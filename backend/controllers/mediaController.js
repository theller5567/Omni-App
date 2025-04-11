import { uploadFileToS3, deleteFileFromS3 } from '../services/awsService.js';
import { v4 as uuidv4 } from 'uuid';
import { getDatabaseConnection } from '../config/db.js';
import mongoose from 'mongoose';
import Media from '../models/Media.js';
import MediaType from '../models/MediaType.js';
import { getBaseModelForMimeType } from '../utils/mediaTypeUtils.js';
import ffmpeg from 'fluent-ffmpeg';
import ffmpegInstaller from '@ffmpeg-installer/ffmpeg';
import { promises as fs } from 'fs';
import path from 'path';
import os from 'os';

// Set ffmpeg path
ffmpeg.setFfmpegPath(ffmpegInstaller.path);

const generateSlug = (title) => {
  return `${title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${uuidv4()}`;
};

// Function to generate video thumbnail
const generateVideoThumbnail = async (videoPath, timestamp = '00:00:01') => {
  const thumbnailPath = path.join(os.tmpdir(), `${uuidv4()}.jpg`);
  
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
          const thumbnailBuffer = await fs.readFile(thumbnailPath);
          // Clean up the temporary file
          await fs.unlink(thumbnailPath);
          resolve(thumbnailBuffer);
        } catch (error) {
          reject(error);
        }
      })
      .on('error', (err) => reject(err));
  });
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
  try {
    const { id } = req.params;
    const { timestamp } = req.body;

    // Find the media file
    const mediaFile = await Media.findById(id);
    if (!mediaFile || !mediaFile.location) {
      return res.status(404).json({ error: 'Media file not found' });
    }

    // Generate new thumbnail
    const thumbnailBuffer = await generateVideoThumbnail(mediaFile.location, timestamp);
    
    // Upload thumbnail to S3
    const thumbnailLocation = await uploadFileToS3({
      buffer: thumbnailBuffer,
      mimetype: 'image/jpeg',
      originalname: `${mediaFile.id}-thumbnail.jpg`
    }, mediaFile.uploadedBy);

    // Update media file with new thumbnail URL
    mediaFile.metadata.thumbnailUrl = thumbnailLocation;
    mediaFile.metadata.thumbnailTimestamp = timestamp;
    await mediaFile.save();

    res.status(200).json({ thumbnailUrl: thumbnailLocation });
  } catch (error) {
    console.error('Error updating video thumbnail:', error);
    res.status(500).json({ error: 'Failed to update thumbnail' });
  }
};

export const uploadMedia = async (req, res) => {
  try {
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

    // Create the media document
    const mediaData = {
      id: generateSlug(req.body.title),
      title: req.body.title,
      location: s3UploadResult.Location,
      slug: slug,
      fileSize: file.size,
      fileExtension: req.body.fileExtension,
      modifiedDate: new Date(),
      uploadedBy: req.body.uploadedBy,
      modifiedBy: req.body.modifiedBy,
      mediaType: req.body.mediaType,
      metadata: {
        ...parseMetadata(req.body.metadata),
        fileName: req.body.title,
      },
    };

    // Add thumbnail data if available
    if (thumbnailLocation && thumbnailTimestamp) {
      mediaData.metadata.v_thumbnail = thumbnailLocation;
      mediaData.metadata.v_thumbnailTimestamp = thumbnailTimestamp;
    }

    // Save to database
    const mediaType = await MediaType.findOne({ name: req.body.mediaType });
    if (!mediaType) {
      throw new Error('Media type not found');
    }

    const baseType = mediaType.baseType || 'Media';
    const MediaModel = mongoose.model(baseType);
    
    const newMedia = new MediaModel(mediaData);
    const savedMedia = await newMedia.save();
    console.log('Saved media document:', savedMedia);

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
  res.header('Access-Control-Allow-Methods', 'GET, PUT, POST, DELETE');
  res.header('Access-Control-Allow-Headers', 'Content-Type');

  const { slug } = req.params;
  console.log('Received update request for slug:', slug);
  console.log('Request body:', JSON.stringify(req.body, null, 2));
  console.log('Request URL:', req.originalUrl);
  console.log('Request method:', req.method);
  console.log('Request headers:', req.headers);

  try {
    // Fetch the document using the Media model
    console.log('Attempting to find media with slug:', slug);
    const documentBeforeUpdate = await Media.findOne({ slug });
    
    if (!documentBeforeUpdate) {
      console.log('Media not found for slug:', slug);
      return res.status(404).json({ error: 'Media not found' });
    }

    console.log('Found document before update:', documentBeforeUpdate);

    // Build update fields
    const updateFields = {
      title: req.body.title,
      metadata: {
        ...documentBeforeUpdate.metadata, // Keep existing metadata
        ...req.body.metadata, // Merge with new metadata
      }
    };

    console.log('Constructed updateFields:', JSON.stringify(updateFields, null, 2));

    // Perform the update using the Media model
    const updatedMediaFile = await Media.findOneAndUpdate(
      { slug },
      { $set: updateFields },
      { new: true, runValidators: true }
    ).lean(); // Add lean() to convert to plain JavaScript object

    if (!updatedMediaFile) {
      console.log('Media not found during update for slug:', slug);
      return res.status(404).json({ error: 'Media not found' });
    }

    // Log the document after update
    console.log('Updated media file:', JSON.stringify(updatedMediaFile, null, 2));

    // Send response with proper content type
    res.setHeader('Content-Type', 'application/json');
    return res.status(200).json(updatedMediaFile);
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


