import { uploadFileToS3, deleteFileFromS3 } from '../services/awsService.js';
import { v4 as uuidv4 } from 'uuid';
import { getDatabaseConnection } from '../config/db.js';
import mongoose from 'mongoose';
import Media from '../models/Media.js';
import MediaType from '../models/MediaType.js';
import { getBaseModelForMimeType } from '../utils/mediaTypeUtils.js';
import ffmpeg from 'fluent-ffmpeg';
import ffmpegInstaller from '@ffmpeg-installer/ffmpeg';
import fs from 'fs';
import { promises as fsPromises } from 'fs';
import path from 'path';
import os from 'os';
import ActivityTrackingService from '../services/activityTrackingService.js';
import axios from 'axios';

// Set ffmpeg path
ffmpeg.setFfmpegPath(ffmpegInstaller.path);

const generateSlug = (title) => {
  return `${title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${uuidv4()}`;
};

// Update the generateVideoThumbnail function to handle URLs better
const generateVideoThumbnail = async (videoPath, timestamp = '00:00:01') => {
  const thumbnailPath = path.join(os.tmpdir(), `${uuidv4()}.jpg`);
  const tempVideoPath = path.join(os.tmpdir(), `${uuidv4()}.mp4`);
  
  try {
    console.log(`Generating thumbnail for video at: ${videoPath} with timestamp: ${timestamp}`);
    
    // Check if the video path is a URL (likely an S3 URL)
    if (videoPath.startsWith('http')) {
      console.log('Detected URL, downloading video to temp file first');
      
      // Download the file to a temporary location
      const response = await axios({
        method: 'GET',
        url: videoPath,
        responseType: 'stream'
      });
      
      // Create write stream and pipe the response to it
      const writer = fs.createWriteStream(tempVideoPath);
      response.data.pipe(writer);
      
      // Return a promise that resolves when the download is complete
      await new Promise((resolve, reject) => {
        writer.on('finish', resolve);
        writer.on('error', reject);
      });
      
      console.log(`Downloaded video to: ${tempVideoPath}`);
      
      // Use the local file path instead of the URL
      videoPath = tempVideoPath;
    }
    
    // Generate thumbnail from the video file
  return new Promise((resolve, reject) => {
    ffmpeg(videoPath)
      .screenshots({
        timestamps: [timestamp],
        filename: thumbnailPath,
        size: '320x240'
      })
      .on('end', async () => {
        try {
          // Read the generated thumbnail
            const thumbnailBuffer = await fsPromises.readFile(thumbnailPath);
            
            // Clean up the temporary files
            await fsPromises.unlink(thumbnailPath).catch(err => console.warn('Error deleting thumbnail:', err));
            if (tempVideoPath !== videoPath) {
              await fsPromises.unlink(tempVideoPath).catch(err => console.warn('Error deleting temp video:', err));
            }
            
          resolve(thumbnailBuffer);
        } catch (error) {
          reject(error);
        }
      })
        .on('error', (err) => {
          console.error('FFmpeg error:', err);
          // Clean up temp files on error too
          fsPromises.unlink(thumbnailPath).catch(() => {});
          if (tempVideoPath !== videoPath) {
            fsPromises.unlink(tempVideoPath).catch(() => {});
          }
          reject(err);
        });
  });
  } catch (error) {
    // Clean up temporary files if there was an error
    try {
      await fsPromises.unlink(thumbnailPath).catch(() => {});
      if (tempVideoPath !== videoPath) {
        await fsPromises.unlink(tempVideoPath).catch(() => {});
      }
    } catch {}
    
    console.error('Error in generateVideoThumbnail:', error);
    throw error;
  }
};

// Function to extract video metadata
const getVideoMetadata = (videoPath) => {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(videoPath, (err, metadata) => {
      if (err) return reject(err);
      
      const videoStream = metadata.streams.find(s => s.codec_type === 'video');
      const audioStream = metadata.streams.find(s => s.codec_type === 'audio');
      
      resolve({
        duration: metadata.format.duration,
        frameRate: eval(videoStream.r_frame_rate),
        width: videoStream.width,
        height: videoStream.height,
        codec: videoStream.codec_name,
        hasAudio: !!audioStream,
        audioCodec: audioStream?.codec_name
      });
    });
  });
};

// Function to update video thumbnail
export const updateVideoThumbnail = async (req, res) => {
  // This entire function will be removed as it's part of the MediaDetail thumbnail functionality
  // We'll re-implement this from scratch if needed
};

export const uploadMedia = async (req, res) => {
  try {
    // Role-based access check for upload
    if (!req.user || (req.user.role !== 'admin' && req.user.role !== 'superAdmin')) {
      console.warn(`Upload attempt by unauthorized user: ${req.user?.username || 'guest'} with role: ${req.user?.role}`);
      return res.status(403).json({ error: 'Forbidden: You do not have permission to upload media.' });
    }

    if (!req.files || !req.files.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const file = req.files.file[0];
    const thumbnail = req.files.v_thumbnail ? req.files.v_thumbnail[0] : null;
    const thumbnailTimestamp = req.body.v_thumbnailTimestamp;

    // Upload the main file to S3
    const s3UploadResult = await uploadFileToS3(file);
    if (!s3UploadResult || !s3UploadResult.Location) {
      throw new Error('Failed to get file location from S3');
    }
    console.log('Main file uploaded to S3:', s3UploadResult);
    
    // If there's a thumbnail, upload it to S3 as well
    let thumbnailLocation = null;
    if (thumbnail) {
      const thumbnailResult = await uploadFileToS3(thumbnail, 'thumbnails/');
      if (thumbnailResult && thumbnailResult.Location) {
        thumbnailLocation = thumbnailResult.Location;
        console.log('Thumbnail uploaded to S3:', thumbnailResult);
      }
    }

    // Generate a slug from the title
    const slug = generateSlug(req.body.title);
    console.log('Generated slug:', slug);

    // Parse metadata from the request
    const parsedMetadata = parseMetadata(req.body.metadata);
    
    // Find the media type to get default tags
    const mediaType = await MediaType.findOne({ name: req.body.mediaType });
    if (!mediaType) {
      throw new Error('Media type not found');
    }
    
    // Apply default tags if they exist and ensure we don't have duplicates
    let combinedTags = [...(parsedMetadata.tags || [])];
    if (mediaType.defaultTags && Array.isArray(mediaType.defaultTags)) {
      // Add each default tag that doesn't already exist in the tags array
      mediaType.defaultTags.forEach(defaultTag => {
        const normalizedDefaultTag = defaultTag.toLowerCase().trim();
        const tagExists = combinedTags.some(
          tag => tag.toLowerCase().trim() === normalizedDefaultTag
        );
        
        if (!tagExists) {
          combinedTags.push(defaultTag);
        }
      });
      
      console.log('Applied default tags from media type:', 
        mediaType.name, 
        'Tags:', combinedTags);
    }

    // Create the media document
    const mediaData = {
      id: generateSlug(req.body.title),
      title: req.body.title,
      location: s3UploadResult.Location,
      slug: slug,
      fileSize: file.size,
      fileExtension: req.body.fileExtension,
      modifiedDate: new Date(),
      mediaType: req.body.mediaType,
      metadata: {
        ...parsedMetadata,
        tags: combinedTags, // Use the combined tags with defaults
      },
      // Approval System Logic
      approvalStatus: 'pending', // Default to pending
      approvalFeedback: undefined,
      approvedBy: undefined,
      approvedAt: undefined,
    };

    // Log the type and value of user ID from token
    console.log(`[uploadMedia] req.user from token:`, JSON.stringify(req.user, null, 2));
    console.log(`[uploadMedia] typeof req.user._id: ${typeof req.user?._id}, value: ${req.user?._id}`);
    console.log(`[uploadMedia] typeof req.user.id: ${typeof req.user?.id}, value: ${req.user?.id}`);

    let uploaderIdToStore;
    if (req.user?._id && mongoose.Types.ObjectId.isValid(req.user._id.toString()) && typeof req.user._id !== 'string') {
      // If req.user._id is already an ObjectId (or a valid representation that's not just a string)
      uploaderIdToStore = req.user._id;
      console.log(`[uploadMedia] Using req.user._id as ObjectId: ${uploaderIdToStore}`);
    } else if (req.user?.id && mongoose.Types.ObjectId.isValid(req.user.id)) {
      // If req.user.id is a string but a valid ObjectId string, convert it
      uploaderIdToStore = new mongoose.Types.ObjectId(req.user.id);
      console.log(`[uploadMedia] Converted req.user.id to ObjectId: ${uploaderIdToStore}`);
    } else {
      console.error("[uploadMedia] Could not determine a valid ObjectId for uploader. Fallback or error needed.");
      // Potentially throw an error or assign a default/null if appropriate for your app logic
      // For now, let's proceed with undefined, which Mongoose might strip or handle based on schema defaults
      uploaderIdToStore = undefined; 
    }

    mediaData.uploadedBy = uploaderIdToStore;
    mediaData.modifiedBy = uploaderIdToStore; // Assuming modifiedBy should also be the uploader ObjectId

    // Auto-approve if uploaded by superAdmin, otherwise pending for admin
    if (req.user.role === 'superAdmin') {
      mediaData.approvalStatus = 'approved';
      mediaData.approvedBy = req.user._id;
      mediaData.approvedAt = new Date();
    } else if (req.user.role === 'admin') {
      mediaData.approvalStatus = 'pending';
      // approvedBy and approvedAt remain undefined for pending state
    }
    // No 'else' needed here as we've already checked roles at the top

    // Add thumbnail data if available
    if (thumbnailLocation && thumbnailTimestamp) {
      mediaData.metadata.v_thumbnail = thumbnailLocation;
      mediaData.metadata.v_thumbnailTimestamp = thumbnailTimestamp;
    }

    // Save to database
    const baseType = mediaType.baseType || 'Media';
    const MediaModel = mongoose.model(baseType);
    
    const newMedia = new MediaModel(mediaData);
    const savedMedia = await newMedia.save();
    console.log('Saved media document:', savedMedia);

    // Log the media upload activity
    if (req.user) {
      await ActivityTrackingService.trackMediaUpload(req.user, savedMedia);
    }

    // Return the complete response
    const response = {
      _id: savedMedia._id,
      id: savedMedia.id,
      location: savedMedia.location,
      slug: savedMedia.slug,
      title: savedMedia.title,
      metadata: savedMedia.metadata,
      fileSize: savedMedia.fileSize,
      fileExtension: savedMedia.fileExtension,
      modifiedDate: savedMedia.modifiedDate,
      uploadedBy: savedMedia.uploadedBy,
      modifiedBy: savedMedia.modifiedBy,
      mediaType: savedMedia.mediaType,
      approvalStatus: savedMedia.approvalStatus,
      approvalFeedback: savedMedia.approvalFeedback,
      approvedBy: savedMedia.approvedBy,
      approvedAt: savedMedia.approvedAt,
      __t: savedMedia.__t
    };

    console.log('Sending response:', response);
    res.status(201).json(response);
  } catch (error) {
    console.error('Error in uploadMedia:', error);
    res.status(500).json({ error: 'Failed to upload media: ' + error.message });
  }
};

// Helper function to parse metadata from form data
const parseMetadata = (metadata) => {
  if (typeof metadata === 'string') {
    try {
      return JSON.parse(metadata);
    } catch (e) {
      console.error('Error parsing metadata:', e);
      return {};
    }
  }
  return metadata || {};
};

export const deleteMedia = async (req, res) => {
  try {
    const { id } = req.params;
    console.log('Deleting media with id:', id);

    // First find the media to get its location and thumbnail
    const mediaToDelete = await Media.findById(id);

    if (!mediaToDelete) {
      console.log('Media not found for id:', id);
      return res.status(404).json({ error: 'Media not found' });
    }

    // Delete the main file from S3
    if (mediaToDelete.location) {
      try {
        await deleteFileFromS3(mediaToDelete.location);
        console.log('Successfully deleted main file from S3:', mediaToDelete.location);
      } catch (s3Error) {
        console.error('Error deleting main file from S3:', s3Error);
        // Continue with deletion even if S3 deletion fails
      }
    }

    // Delete the thumbnail from S3 if it exists
    if (mediaToDelete.metadata?.v_thumbnail) {
      try {
        await deleteFileFromS3(mediaToDelete.metadata.v_thumbnail);
        console.log('Successfully deleted thumbnail from S3:', mediaToDelete.metadata.v_thumbnail);
      } catch (s3Error) {
        console.error('Error deleting thumbnail from S3:', s3Error);
        // Continue with deletion even if thumbnail deletion fails
      }
    }

    // Delete from MongoDB
    const result = await Media.findByIdAndDelete(id);
    console.log('Deleted media from MongoDB:', result);

    // Log the media deletion activity
    if (req.user) {
      await ActivityTrackingService.trackMediaDeletion(req.user, mediaToDelete);
    }

    res.status(200).json({ 
      message: 'Media deleted successfully',
      deletedId: id,
      deletedLocations: {
        main: mediaToDelete.location,
        thumbnail: mediaToDelete.metadata?.v_thumbnail
      }
    });
  } catch (error) {
    console.error('Error deleting media:', error);
    res.status(500).json({ error: 'Failed to delete media' });
  }
};

export const getAllMedia = async (req, res) => {
  try {
    // Query only the Media collection
    const allMedia = await Media.find();
    res.status(200).json(allMedia);
  } catch (error) {
    console.error('Error fetching media:', error);
    res.status(500).json({ error: 'Failed to fetch media' });
  }
};

// Debug endpoint to examine media file structure
export const debugMediaFile = async (req, res) => {
  try {
    const { id } = req.params;
    
    console.log('🔍 Debug request for media file ID:', id);
    
    // Find the media file
    const mediaFile = await Media.findById(id);
    
    if (!mediaFile) {
      console.log('❌ Media file not found');
      return res.status(404).json({ message: 'Media file not found' });
    }
    
    // Get schema info
    const schemaKeys = Object.keys(Media.schema.paths);
    const schemaDetails = {};
    
    schemaKeys.forEach(key => {
      const path = Media.schema.paths[key];
      schemaDetails[key] = {
        type: path.instance,
        required: !!path.isRequired,
        default: path.defaultValue,
        options: path.enumValues
      };
    });
    
    // Get a list of all fields in the document
    const documentKeys = Object.keys(mediaFile._doc);
    
    // Get the associated media type
    let mediaType = null;
    if (mediaFile.mediaType) {
      mediaType = await MediaType.findOne({
        $or: [
          { _id: mediaFile.mediaType },
          { name: mediaFile.mediaType }
        ]
      });
    }
    
    const debugInfo = {
      id: mediaFile._id,
      title: mediaFile.title,
      // Full document
      document: mediaFile._doc,
      // Schema information
      schema: {
        keys: schemaKeys,
        details: schemaDetails
      },
      // Document keys
      documentKeys,
      // Metadata specific debugging
      metadata: {
        value: mediaFile.metadata,
        type: typeof mediaFile.metadata,
        isObject: typeof mediaFile.metadata === 'object' && mediaFile.metadata !== null,
        keys: mediaFile.metadata ? Object.keys(mediaFile.metadata) : []
      },
      // Tags specific debugging
      tags: {
        value: mediaFile.metadata?.tags,
        type: typeof mediaFile.metadata?.tags,
        isArray: Array.isArray(mediaFile.metadata?.tags),
        length: mediaFile.metadata?.tags ? mediaFile.metadata.tags.length : null
      },
      // Media Type info
      mediaType: mediaType ? {
        id: mediaType._id,
        name: mediaType.name,
        defaultTags: mediaType.defaultTags
      } : null
    };
    
    res.status(200).json(debugInfo);
  } catch (error) {
    console.error('❌ Error in debug endpoint:', error);
    res.status(500).json({ message: 'Error debugging media file', error });
  }
};

export const getMediaById = async (req, res) => {
  try {
    const { id } = req.params;
    console.log('Fetching media with ID:', id);

    const mediaFile = await Media.findById(id);

    if (!mediaFile) {
      console.log('Media not found for ID:', id);
      return res.status(404).json({ error: 'Media not found' });
    }

    console.log('Fetched media file:', mediaFile);
    res.status(200).json(mediaFile);
  } catch (error) {
    console.error('Error fetching media file:', error);
    res.status(500).json({ error: 'Failed to fetch media file' });
  }
};

export const searchMedia = async (req, res) => {
  try {
    const { query } = req.params;
    console.log('Searching media with query:', query);

    if (!query || query.length < 2) {
      return res.status(400).json({ error: 'Search query must be at least 2 characters' });
    }

    // Create a case-insensitive regex for the search term
    const searchRegex = new RegExp(query, 'i');

    // Search in title, filename, and tags
    const mediaFiles = await Media.find({
      $or: [
        { title: searchRegex },
        { 'metadata.fileName': searchRegex },
        { 'metadata.tags': { $in: [searchRegex] } }
      ]
    });

    console.log(`Found ${mediaFiles.length} results for search query:`, query);
    res.status(200).json(mediaFiles);
  } catch (error) {
    console.error('Error searching media files:', error);
    res.status(500).json({ error: 'Failed to search media files' });
  }
};

// Utility function to fix tags for specific media files
export const fixTagsForMediaType = async (req, res) => {
  try {
    const { mediaTypeName } = req.params;
    console.log('⭐ Manually fixing tags for media type:', mediaTypeName);
    
    // Find the media type 
    const mediaType = await MediaType.findOne({ 
      name: { $regex: new RegExp(mediaTypeName, 'i') } // Case-insensitive search
    });
    
    if (!mediaType) {
      console.log('❌ Media type not found with name:', mediaTypeName);
      return res.status(404).json({ 
        message: 'Media type not found',
        searchedFor: mediaTypeName
      });
    }
    
    console.log('✅ Found media type:', mediaType.name, 'with ID:', mediaType._id);
    console.log('Current default tags:', mediaType.defaultTags);
    
    // Make sure defaultTags exists and update it 
    if (!mediaType.defaultTags || !Array.isArray(mediaType.defaultTags)) {
      mediaType.defaultTags = [];
    }
    
    // Add "Product image" tag if it's the product image type
    if (mediaType.name.toLowerCase().includes('product') && mediaType.name.toLowerCase().includes('image')) {
      if (!mediaType.defaultTags.includes('Product image')) {
        mediaType.defaultTags.push('Product image');
        await mediaType.save();
        console.log('✅ Added "Product image" default tag to media type');
      }
    }
    
    // Find all media files with this media type
    const mediaFiles = await Media.find({
      $or: [
        { mediaType: mediaType._id.toString() },
        { mediaType: mediaType.name }
      ]
    });
    
    console.log('🔍 Found', mediaFiles.length, 'media files with media type:', mediaType.name);
    
    // Check each file's metadata and tags structure
    const fileStats = {
      totalFiles: mediaFiles.length,
      filesWithNoMetadata: 0,
      filesWithNoTags: 0,
      filesAlreadyTagged: 0,
      filesUpdated: 0,
      errors: 0
    };
    
    for (const file of mediaFiles) {
      console.log('📄 Processing file:', file.title || file._id.toString());
      
      try {
        // Check metadata structure
        if (!file.metadata) {
          console.log('   ⚠️ File has no metadata, creating metadata object');
          file.metadata = {};
          fileStats.filesWithNoMetadata++;
        }
        
        // Check tags structure
        if (!file.metadata.tags || !Array.isArray(file.metadata.tags)) {
          console.log('   ⚠️ File has no tags array, creating tags array');
          file.metadata.tags = [];
          fileStats.filesWithNoTags++;
        }
        
        // Check if the file already has the default tags
        let needsUpdate = false;
        
        for (const tag of mediaType.defaultTags) {
          if (!file.metadata.tags.includes(tag)) {
            console.log(`   ✅ Adding missing tag: "${tag}"`);
            file.metadata.tags.push(tag);
            needsUpdate = true;
          }
        }
        
        if (needsUpdate) {
          await file.save();
          console.log('   ✅ Saved file with updated tags:', file.metadata.tags);
          fileStats.filesUpdated++;
        } else {
          console.log('   ⏭️ File already has all default tags:', file.metadata.tags);
          fileStats.filesAlreadyTagged++;
        }
      } catch (fileError) {
        console.error('   ❌ Error processing file:', fileError);
        fileStats.errors++;
      }
    }
    
    console.log('🎉 Fix operation completed with stats:', fileStats);
    
    res.status(200).json({
      message: 'Fix operation completed',
      mediaType: {
        id: mediaType._id,
        name: mediaType.name,
        defaultTags: mediaType.defaultTags
      },
      stats: fileStats
    });
  } catch (error) {
    console.error('❌ Error in fix operation:', error);
    res.status(500).json({ 
      message: 'Error fixing tags',
      error: error.message
    });
  }
};

export const updateMedia = async (req, res) => {
  // Add CORS headers
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, PUT, POST, DELETE, OPTIONS, PATCH');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Cache-Control, Pragma, Expires, X-Auth-Token');
  res.header('Access-Control-Expose-Headers', 'Cache-Control, Pragma, Expires, Content-Length, Content-Type, X-Auth-Token');

  const { slug } = req.params;
  console.log('Received update request for slug:', slug);
  console.log('Request body:', JSON.stringify(req.body, null, 2));

  // Role-based access check for update
  if (!req.user || req.user.role === 'user') { // Deny regular users from any edit attempts
    console.warn(`Update attempt by unauthorized user: ${req.user?.username || 'guest'} with role: ${req.user?.role}`);
    return res.status(403).json({ error: 'Forbidden: You do not have permission to edit media.' });
  }

  try {
    // Fetch the document using the Media model
    console.log('Attempting to find media with slug:', slug);
    const documentBeforeUpdate = await Media.findOne({ slug });
    
    if (!documentBeforeUpdate) {
      console.log(`No document found with slug: ${slug}`);
      return res.status(404).json({ error: 'Media file not found' });
    }
    
    // Get the specific model for this document
    const modelName = documentBeforeUpdate.constructor.modelName;
    console.log(`Document model name: ${modelName}`);
    
    let changedFieldsForLogging = []; // Use a different name to avoid confusion with req.body.changedFields
    const proposedTitle = req.body.title;
    const proposedMetadata = req.body.metadata;

    const isSuperAdmin = req.user.role === 'superAdmin';
    const isAdminUser = req.user.role === 'admin';

    // Always set modifiedBy if a user is making the change
    if (req.user) {
      documentBeforeUpdate.modifiedBy = req.user._id;
    }

    if (isSuperAdmin) {
      console.log('SuperAdmin is editing. Applying changes directly and approving.');
      if (proposedTitle !== undefined) {
        documentBeforeUpdate.title = proposedTitle;
      }
      if (proposedMetadata !== undefined) {
        // Ensure metadata object exists
        if (!documentBeforeUpdate.metadata) {
          documentBeforeUpdate.metadata = {};
        }

        // Merge proposedMetadata into existing metadata by creating a new object
        documentBeforeUpdate.metadata = { 
          ...documentBeforeUpdate.metadata, 
          ...proposedMetadata 
        };

        // Log AFTER the merge to see the actual state
        console.log('SuperAdmin - documentBeforeUpdate.metadata AFTER MERGE:', JSON.stringify(documentBeforeUpdate.metadata, null, 2));
        
        documentBeforeUpdate.markModified('metadata'); // Mark as modified
      }
      documentBeforeUpdate.pendingVersionData = undefined;
      documentBeforeUpdate.approvalStatus = 'approved';
      documentBeforeUpdate.approvedBy = req.user._id;
      documentBeforeUpdate.approvedAt = new Date();
    } else if (isAdminUser) {
      console.log('Admin user is editing.');
      const wasPreviouslyApproved = documentBeforeUpdate.approvalStatus === 'approved';

      // Log initial states for admin edit
      console.log('--- Admin Edit Initial State ---');
      console.log('Original documentBeforeUpdate.title:', documentBeforeUpdate.title);
      console.log('Original documentBeforeUpdate.metadata:', JSON.stringify(documentBeforeUpdate.metadata, null, 2));
      console.log('Original documentBeforeUpdate.approvalStatus:', documentBeforeUpdate.approvalStatus);
      console.log('Proposed title from req.body:', proposedTitle);
      console.log('Proposed metadata from req.body:', JSON.stringify(proposedMetadata, null, 2));
      console.log('wasPreviouslyApproved:', wasPreviouslyApproved);
      console.log('--------------------------------');

      if (wasPreviouslyApproved) {
        console.log('Admin editing a previously approved item. Attempting to store changes in pendingVersionData.');
        const specificPendingChanges = {};

        // --- Title Change Detection ---
        if (proposedTitle !== undefined) {
            console.log('Comparing title - Proposed:', proposedTitle, '| Current Live:', documentBeforeUpdate.title);
            if (proposedTitle !== documentBeforeUpdate.title) {
                specificPendingChanges.title = proposedTitle;
                console.log('>>> Title change detected for pendingVersionData.');
            }
        }

        // --- Metadata Change Detection ---
        if (proposedMetadata !== undefined) {
            console.log('Comparing metadata - Proposed:', JSON.stringify(proposedMetadata), '| Current Live:', JSON.stringify(documentBeforeUpdate.metadata));
            const tempPendingMetadata = {};
            for (const [key, value] of Object.entries(proposedMetadata)) {
                const liveValue = documentBeforeUpdate.metadata?.[key];
                console.log(`  - Comparing metadata key: "${key}" - Proposed:`, JSON.stringify(value), '| Live:', JSON.stringify(liveValue));
                if (value !== undefined && JSON.stringify(value) !== JSON.stringify(liveValue)) {
                    tempPendingMetadata[key] = value;
                    console.log(`    >>> Metadata change for key "${key}" detected for pendingVersionData.`);
                }
            }
            if (Object.keys(tempPendingMetadata).length > 0) {
                specificPendingChanges.metadata = tempPendingMetadata;
            }
        }
        
        console.log('Constructed specificPendingChanges:', JSON.stringify(specificPendingChanges, null, 2));

        if (Object.keys(specificPendingChanges).length > 0) {
          documentBeforeUpdate.pendingVersionData = specificPendingChanges;
          documentBeforeUpdate.approvalStatus = 'pending';
          documentBeforeUpdate.approvedBy = undefined;
          documentBeforeUpdate.approvedAt = undefined;
          documentBeforeUpdate.approvalFeedback = undefined;
          console.log('>>> pendingVersionData SET, approvalStatus to PENDING, approval fields CLEARED.');
        } else {
          console.log('No effective changes detected by diffing logic to put into pendingVersionData.');
        }
      } else { // Admin editing a non-approved item (e.g., pending, needs_revision)
        console.log('Admin editing an item not currently approved. Applying changes directly to main document.');
        if (proposedTitle !== undefined) {
          documentBeforeUpdate.title = proposedTitle;
        }
        if (proposedMetadata !== undefined) {
          if (!documentBeforeUpdate.metadata) documentBeforeUpdate.metadata = {};
          for (const [key, value] of Object.entries(proposedMetadata)) {
            if (value !== undefined) documentBeforeUpdate.metadata[key] = value;
          }
        }
      }
    }
    
    // Re-evaluate changedFieldsForLogging based on what Mongoose tracks as modified
    if (documentBeforeUpdate.isModified()) {
        documentBeforeUpdate.modifiedPaths().forEach(path => {
            if (!changedFieldsForLogging.includes(path)) {
                changedFieldsForLogging.push(path);
            }
        });
    }

    if (documentBeforeUpdate.isModified()) {
      console.log('Saving updated document. Fields considered changed for logging:', changedFieldsForLogging);
      const updatedMediaFile = await documentBeforeUpdate.save();
      
      if (req.user) {
        await ActivityTrackingService.trackMediaUpdate(req.user, updatedMediaFile, changedFieldsForLogging);
        console.log('Media update activity logged with changes:', changedFieldsForLogging);
      }
      
      res.setHeader('Content-Type', 'application/json');
      return res.status(200).json(updatedMediaFile);
    } else {
      console.log('No effective changes detected from original DB state, skipping save.');
      return res.status(200).json({
        message: 'No changes detected',
        data: documentBeforeUpdate // documentBeforeUpdate is the in-memory version, effectively unchanged from DB
      });
    }
  } catch (error) {
    console.error('Error updating media file:', error);

    // Log validation errors if present
    if (error.errors) {
      Object.values(error.errors).forEach(err => {
        console.error('Validation error:', err.message);
      });
    }

    return res.status(500).json({ error: 'Failed to update media file', details: error.message });
  }
};

export const approveMediaItem = async (req, res, next) => {
  const { mediaId } = req.params;
  const adminUserId = req.user?._id;

  console.log(`Admin ${adminUserId} attempting to approve media item ${mediaId}`);

  try {
    const mediaItem = await Media.findById(mediaId);

    if (!mediaItem) {
      return res.status(404).json({ message: 'Media item not found.' });
    }

    // Apply pending changes if they exist
    if (mediaItem.pendingVersionData && Object.keys(mediaItem.pendingVersionData).length > 0) {
      console.log('Applying pendingVersionData:', JSON.stringify(mediaItem.pendingVersionData, null, 2));
      // Directly merge pendingVersionData into the mediaItem document
      // This works for top-level fields like 'title' and nested 'metadata'
      for (const key in mediaItem.pendingVersionData) {
        if (key === 'metadata' && typeof mediaItem.pendingVersionData[key] === 'object' && mediaItem.pendingVersionData[key] !== null) {
          if (!mediaItem.metadata) mediaItem.metadata = {};
          // Merge metadata deeply
          for (const metaKey in mediaItem.pendingVersionData[key]) {
            mediaItem.metadata[metaKey] = mediaItem.pendingVersionData[key][metaKey];
          }
          mediaItem.markModified('metadata'); // Important for Mongoose to detect changes in nested objects
        } else {
          mediaItem[key] = mediaItem.pendingVersionData[key];
        }
      }
      mediaItem.pendingVersionData = undefined; // Clear pending data
    }

    mediaItem.approvalStatus = 'approved';
    mediaItem.approvedBy = adminUserId;
    mediaItem.approvedAt = new Date();
    mediaItem.approvalFeedback = undefined; // Clear any previous rejection/revision feedback

    const updatedMediaItem = await mediaItem.save();

    // Log activity
    if (req.user) {
      await ActivityTrackingService.trackMediaApprovalStatusChange(req.user, updatedMediaItem, 'approved');
    }

    console.log(`Media item ${mediaId} approved successfully by ${adminUserId}`);
    res.status(200).json(updatedMediaItem);

  } catch (error) {
    console.error(`Error approving media item ${mediaId}:`, error);
    next(error); // Pass error to the main error handler
  }
};

export const rejectMediaItem = async (req, res, next) => {
  const { mediaId } = req.params;
  const { feedback } = req.body; // Feedback is expected in the request body
  const adminUserId = req.user?._id;

  console.log(`Admin ${adminUserId} attempting to reject media item ${mediaId} with feedback: "${feedback}"`);

  if (!feedback || feedback.trim() === '') {
    return res.status(400).json({ message: 'Feedback is required when rejecting a media item.' });
  }

  try {
    const mediaItem = await Media.findById(mediaId);

    if (!mediaItem) {
      return res.status(404).json({ message: 'Media item not found.' });
    }

    mediaItem.approvalStatus = 'rejected';
    mediaItem.approvalFeedback = feedback;
    mediaItem.approvedBy = undefined; // Clear any previous approver
    mediaItem.approvedAt = undefined;   // Clear any previous approval date
    mediaItem.pendingVersionData = undefined; // Clear any pending changes as they are rejected

    const updatedMediaItem = await mediaItem.save();

    // Log activity
    if (req.user) {
      await ActivityTrackingService.trackMediaApprovalStatusChange(req.user, updatedMediaItem, 'rejected');
    }

    console.log(`Media item ${mediaId} rejected successfully by ${adminUserId}`);
    res.status(200).json(updatedMediaItem);

  } catch (error) {
    console.error(`Error rejecting media item ${mediaId}:`, error);
    next(error); // Pass error to the main error handler
  }
};

export const getPendingMediaReviews = async (req, res, next) => {
  console.log(`Admin ${req.user?._id} attempting to fetch media items pending review.`);

  try {
    const pendingItems = await Media.find({
      approvalStatus: { $in: ['pending', 'needs_revision'] },
    }).sort({ updatedAt: -1 }); // Sort by most recently updated

    console.log(`Found ${pendingItems.length} media items pending review.`);
    res.status(200).json(pendingItems);

  } catch (error) {
    console.error('Error fetching media items pending review:', error);
    next(error);
  }
};

export const getRejectedMedia = async (req, res, next) => {
  console.log(`Admin ${req.user?._id} attempting to fetch rejected media items.`);

  try {
    const rejectedItems = await Media.find({
      approvalStatus: 'rejected',
    }).sort({ updatedAt: -1 }); // Sort by most recently updated

    console.log(`Found ${rejectedItems.length} rejected media items.`);
    res.status(200).json(rejectedItems);

  } catch (error) {
    console.error('Error fetching rejected media items:', error);
    next(error);
  }
};

// New controller function to get media by user ID
export const getMediaByUserId = async (req, res, next) => {
  try {
    const { userId } = req.params;
    console.log(`[getMediaByUserId] Received request for user ID (string): ${userId}`);

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      console.log(`[getMediaByUserId] Invalid ObjectId string: ${userId}`);
      return res.status(400).json({ message: 'Invalid user ID format.' });
    }
    const objectIdForQuery = new mongoose.Types.ObjectId(userId);
    console.log(`[getMediaByUserId] Converted to ObjectId for query: ${objectIdForQuery}`);

    // Find media where uploadedBy matches the userId
    const userMedia = await Media.find({ uploadedBy: objectIdForQuery })
      .sort({ createdAt: -1 }); // Sort by newest first, or as desired

    console.log(`[getMediaByUserId] Media.find({ uploadedBy: ${objectIdForQuery} }) query executed.`);
    console.log(`[getMediaByUserId] Found ${userMedia.length} media items for user ID: ${userId}`);
    
    // Note: A successful query that finds no documents returns an empty array, not null/undefined.
    // So, checking !userMedia is not the right way to see if nothing was found.
    // The length check is appropriate.

    res.status(200).json(userMedia);

  } catch (error) {
    console.error(`[getMediaByUserId] Error fetching media for user ID ${req.params.userId}:`, error);
    next(error); 
  }
};


