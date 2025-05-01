import { uploadFileToS3, deleteFileFromS3, BUCKET_NAME } from '../services/awsService.js';
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
import { spawn } from 'child_process';

// Set ffmpeg path
ffmpeg.setFfmpegPath(ffmpegInstaller.path);

// Verify ffmpeg installation
try {
  console.log('FFMPEG Path:', ffmpegInstaller.path);
  console.log('FFMPEG Version:', ffmpegInstaller.version);
  console.log('Verifying ffmpeg installation...');
  
  // Verify that ffmpeg is available
  const ffmpegPathExists = fs.existsSync(ffmpegInstaller.path);
  console.log('FFMPEG path exists:', ffmpegPathExists);
} catch (ffmpegError) {
  console.error('Error verifying ffmpeg installation:', ffmpegError);
}

const generateSlug = (title) => {
  return `${title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${uuidv4()}`;
};

// Improve the generateVideoThumbnail function to better handle remote videos
const generateVideoThumbnail = async (videoPath, timestamp = '00:00:01', retries = 2) => {
  console.log(`Starting thumbnail generation for video: ${videoPath} at timestamp: ${timestamp} (retries left: ${retries})`);
  
  // Create a unique subfolder in temp directory to avoid permission issues
  const tempSubFolder = path.join(os.tmpdir(), `omni_thumbs_${Date.now()}_${uuidv4().substring(0, 8)}`);
  
  try {
    // Create temp subfolder if it doesn't exist
    if (!fs.existsSync(tempSubFolder)) {
      await fsPromises.mkdir(tempSubFolder, { recursive: true });
      console.log(`Created temp subfolder: ${tempSubFolder}`);
    }
    
    const thumbnailPath = path.join(tempSubFolder, `thumbnail_${uuidv4()}.jpg`);
    console.log(`Temporary thumbnail path: ${thumbnailPath}`);
    
    // Convert timestamp string (MM:SS) to seconds for FFmpeg's -ss parameter
    const timestampParts = timestamp.split(':');
    const timestampSeconds = parseInt(timestampParts[0]) * 60 + parseInt(timestampParts[1]);
    
    console.log(`Setting up ffmpeg command for video: ${videoPath}`);
    
    // Use a different approach for remote videos (starting with http or https)
    const isRemoteVideo = videoPath.startsWith('http://') || videoPath.startsWith('https://');
    
    let ffmpegCommand;
    if (isRemoteVideo) {
      // For remote videos, use input options before the input to optimize seeking
      ffmpegCommand = spawn('ffmpeg', [
        '-ss', timestampSeconds.toString(),  // Seek before input for remote files
        '-i', videoPath,
        '-frames:v', '1',  // Capture just one frame
        '-y',              // Overwrite output file
        '-q:v', '2',       // High quality output
        thumbnailPath
      ]);
    } else {
      // For local files, use the existing approach
      ffmpegCommand = spawn('ffmpeg', [
        '-i', videoPath,
        '-ss', timestampSeconds.toString(),
        '-frames:v', '1',
        '-y',
        thumbnailPath
      ]);
    }
    
    // Log the command for debugging
    console.log(`FFmpeg command: ffmpeg ${ffmpegCommand.spawnargs.join(' ')}`);
    
    // Capture and log stdout and stderr
    let stdoutData = '';
    let stderrData = '';
    
    ffmpegCommand.stdout.on('data', (data) => {
      stdoutData += data.toString();
    });
    
    ffmpegCommand.stderr.on('data', (data) => {
      stderrData += data.toString();
    });
    
    // Wait for the process to finish
    const exitCode = await new Promise((resolve) => {
      ffmpegCommand.on('close', (code) => {
        resolve(code);
      });
    });
    
    // Check if the thumbnail was created successfully
    if (exitCode === 0 && fs.existsSync(thumbnailPath) && fs.statSync(thumbnailPath).size > 0) {
      console.log(`Thumbnail generated successfully at ${thumbnailPath}`);
      return thumbnailPath;
    } else {
      console.error(`FFmpeg error (code ${exitCode}):`);
      console.error(`stdout: ${stdoutData}`);
      console.error(`stderr: ${stderrData}`);
      
      // For remote videos, try an alternative method if this one failed
      if (isRemoteVideo && retries > 0) {
        console.log(`Trying alternative method for remote video (${retries} retries left)`);
        return await generateVideoThumbnailAlternative(videoPath, timestamp, retries - 1);
      }
      
      throw new Error(`FFmpeg exited with code ${exitCode}: ${stderrData}`);
    }
  } catch (error) {
    console.error(`FFmpeg error: ${error.message}`);
    
    // Clean up the temp folder
    try {
      await fsPromises.rm(tempSubFolder, { recursive: true, force: true });
    } catch (cleanupError) {
      console.error(`Error cleaning up temp folder: ${cleanupError.message}`);
    }
    
    if (retries > 0) {
      console.log(`Retrying thumbnail generation due to error (${retries} retries left)`);
      return generateVideoThumbnail(videoPath, timestamp, retries - 1);
    }
    
    throw new Error('Retry failed');
  }
};

// Alternative method using direct HTTP(S) download first
const generateVideoThumbnailAlternative = async (videoUrl, timestamp = '00:00:01', retries = 1) => {
  console.log(`Using alternative thumbnail generation for: ${videoUrl}`);
  
  // Create a unique temp folder
  const tempSubFolder = path.join(os.tmpdir(), `omni_thumbs_alt_${Date.now()}_${uuidv4().substring(0, 8)}`);
  await fsPromises.mkdir(tempSubFolder, { recursive: true });
  
  // Download a small portion of the video first
  const tempVideoPath = path.join(tempSubFolder, `temp_video_${Date.now()}.mp4`);
  const thumbnailPath = path.join(tempSubFolder, `thumbnail_${uuidv4()}.jpg`);
  
  try {
    // Convert timestamp string (MM:SS) to seconds
    const timestampParts = timestamp.split(':');
    const seekSeconds = parseInt(timestampParts[0]) * 60 + parseInt(timestampParts[1]);
    
    // Use ffmpeg to download a short segment around the target frame
    const downloadCommand = spawn('ffmpeg', [
      '-ss', Math.max(0, seekSeconds - 2).toString(), // Start 2 seconds before target
      '-i', videoUrl,
      '-t', '4',                  // Download 4 seconds of video
      '-c', 'copy',               // Just copy, don't re-encode
      '-y',                       // Overwrite if exists
      tempVideoPath
    ]);
    
    // Wait for download to complete
    await new Promise((resolve, reject) => {
      downloadCommand.on('close', (code) => {
        if (code === 0) resolve();
        else reject(new Error(`Download failed with code ${code}`));
      });
    });
    
    // Now extract the frame from the local file
    const ffmpegCommand = spawn('ffmpeg', [
      '-i', tempVideoPath,
      '-ss', '2',                 // 2 seconds into our clip (should be the target time)
      '-frames:v', '1',
      '-y',
      thumbnailPath
    ]);
    
    // Wait for extraction to complete
    await new Promise((resolve, reject) => {
      ffmpegCommand.on('close', (code) => {
        if (code === 0) resolve();
        else reject(new Error(`Frame extraction failed with code ${code}`));
      });
    });
    
    // Check if thumbnail was created successfully
    if (fs.existsSync(thumbnailPath) && fs.statSync(thumbnailPath).size > 0) {
      console.log(`Alternative method successful: ${thumbnailPath}`);
      return thumbnailPath;
    } else {
      throw new Error('Failed to create thumbnail with alternative method');
    }
  } catch (error) {
    console.error(`Alternative method failed: ${error.message}`);
    
    // Clean up
    try {
      await fsPromises.rm(tempSubFolder, { recursive: true, force: true });
    } catch (cleanupError) {
      console.error(`Error cleaning up temp folder: ${cleanupError.message}`);
    }
    
    if (retries > 0) {
      return generateVideoThumbnailAlternative(videoUrl, timestamp, retries - 1);
    }
    
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

// Simplify the updateVideoThumbnail function based on our test function
export const updateVideoThumbnail = async (req, res) => {
  try {
    const { id } = req.params;
    const { timestamp } = req.body;
    
    console.log(`Updating thumbnail for media ID: ${id} at timestamp: ${timestamp}`);

    // Find the media file first
    const mediaFile = await Media.findById(id);
    if (!mediaFile) {
      return res.status(404).json({ success: false, message: 'Media file not found' });
    }

    // Detailed debugging of mediaFile object
    console.log(`Found media file: ${mediaFile.title}, location: ${mediaFile.location}`);
    console.log('MediaFile ID properties:');
    console.log('_id:', mediaFile._id);
    console.log('id:', mediaFile.id);
    
    // Validate that the file is a video
    if (!mediaFile.fileExtension || !['mp4', 'webm', 'mov', 'ogg'].includes(mediaFile.fileExtension.toLowerCase())) {
      return res.status(400).json({ 
        success: false, 
        message: `File type ${mediaFile.fileExtension} is not a supported video format` 
      });
    }

    // Generate a thumbnail from the video
    console.log(`Generating thumbnail from video at: ${mediaFile.location}`);
    
    let thumbnailPath;
    let thumbnailBuffer;
    
    try {
      // Try to generate the actual thumbnail from the video
      thumbnailPath = await generateVideoThumbnail(mediaFile.location, timestamp);
      
      // If we got a path, read the file into a buffer
      if (thumbnailPath) {
        thumbnailBuffer = await fsPromises.readFile(thumbnailPath);
        console.log(`Successfully generated thumbnail, size: ${thumbnailBuffer.length} bytes`);
        
        // Clean up the temporary file
        try {
          await fsPromises.unlink(thumbnailPath);
        } catch (unlinkError) {
          console.error(`Warning: Failed to delete temporary thumbnail: ${unlinkError.message}`);
        }
      }
    } catch (thumbnailError) {
      console.error(`Error generating thumbnail with ffmpeg: ${thumbnailError.message}`);
      console.log(`Using SVG fallback mechanism for thumbnail generation`);
      
      // Create a SVG placeholder if ffmpeg fails
      thumbnailBuffer = createSVGPlaceholder(mediaFile.title || 'Video Thumbnail');
      console.log(`Created SVG placeholder thumbnail, size: ${thumbnailBuffer.length} bytes`);
    }
    
    // Check if we have a valid thumbnail buffer before proceeding
    if (!thumbnailBuffer || thumbnailBuffer.length < 100) {
      return res.status(500).json({ 
        success: false, 
        message: 'Failed to generate valid thumbnail' 
      });
    }

    // Get the old thumbnail URL for later deletion
    const oldThumbnailUrl = mediaFile.metadata?.v_thumbnail;
    console.log(`Old thumbnail URL (will be deleted after update): ${oldThumbnailUrl}`);

    // Add more debugging for thumbnail filename creation
    // Create a unique thumbnail filename based on the media ID
    const mediaId = mediaFile._id ? mediaFile._id.toString() : id;
    console.log(`Using media ID for filename: ${mediaId}`);
    // Use the actual ID from the document which should be the slug-like ID
    const fileName = mediaFile.id || mediaId;
    console.log(`Final filename base: ${fileName}`);
    const fileExtension = thumbnailPath ? 'jpg' : 'svg';
    const thumbnailFileName = `${fileName.replace(/-/g, '_')}_thumbnail_${fileExtension}_${getFormattedDate()}`;
    console.log(`Generated thumbnail filename: ${thumbnailFileName}`);
    
    // Upload the new thumbnail to S3
    const uploadParams = {
      bucket: process.env.AWS_S3_BUCKET,
      key: thumbnailFileName,
      contentType: thumbnailPath ? 'image/jpeg' : 'image/svg+xml',
      body: thumbnailBuffer,
      originalName: `${mediaFile.slug || fileName}-thumbnail.${fileExtension}`,
      formattedName: thumbnailFileName,
      isThumbnail: false
    };
    
    console.log(`Attempting S3 upload:`, {
      bucket: uploadParams.bucket,
      key: uploadParams.key,
      contentType: uploadParams.contentType,
      fileSize: thumbnailBuffer.length,
      originalName: uploadParams.originalName,
      formattedName: uploadParams.formattedName,
      isThumbnail: uploadParams.isThumbnail
    });

    try {
      const uploadResult = await uploadFileToS3(uploadParams);
      console.log(`S3 upload successful:`, {
        location: uploadResult.Location,
        key: uploadResult.Key,
        bucket: uploadResult.Bucket
      });
      
      // Validate S3 upload result
      if (!uploadResult || !uploadResult.Location) {
        throw new Error('S3 upload did not return a valid location');
      }
      
      console.log(`New thumbnail uploaded to S3 with media ID: ${JSON.stringify(uploadResult)}`);
      
      // Update the media file with the new thumbnail info
      console.log(`About to save media file with new thumbnail URL: ${uploadResult.Location}`);
      console.log(`Current metadata before save: ${JSON.stringify(mediaFile.metadata, null, 2)}`);
      
      // Use findByIdAndUpdate for atomicity and to avoid race conditions
      const updatedMedia = await Media.findByIdAndUpdate(
        id,
        { 
          'metadata.v_thumbnail': uploadResult.Location,
          'metadata.v_thumbnailTimestamp': timestamp
        },
        { new: true }
      );
      
      if (!updatedMedia) {
        return res.status(404).json({ success: false, message: 'Failed to update media file' });
      }
      
      console.log(`Successfully updated media file using findByIdAndUpdate`);
      console.log(`Media file updated with new thumbnail: ${updatedMedia.metadata.v_thumbnail}`);
      console.log(`Updated metadata after save: ${JSON.stringify(updatedMedia.metadata, null, 2)}`);
      
      // Delete the old thumbnail if it exists
      if (oldThumbnailUrl) {
        try {
          await deleteFileFromS3(oldThumbnailUrl);
          console.log(`Old thumbnail deleted from S3: ${oldThumbnailUrl}`);
        } catch (deleteError) {
          console.error(`Warning: Failed to delete old thumbnail: ${deleteError.message}`);
          // Continue despite deletion error
        }
      }
      
      // Add a conditional check for req.user before calling ActivityTrackingService
      // Log activity only if req.user exists
      if (req.user) {
        ActivityTrackingService.logActivity(req.user.id, req.user.email, 'UPDATE_THUMBNAIL', 
          `Updated video thumbnail for ${mediaFile.title || id} to timestamp ${timestamp}`, 
          'media', mediaFile.id, mediaFile.slug);
      } else {
        console.log('No user information available, skipping activity logging');
      }

      return res.status(200).json({
        success: true,
        message: 'Thumbnail updated successfully',
        thumbnailUrl: uploadResult.Location,
        mediaFile: updatedMedia
      });
    } catch (s3Error) {
      console.error(`S3 upload error: ${s3Error.message}`);
      return res.status(500).json({
        success: false,
        message: `Failed to upload thumbnail to S3: ${s3Error.message}`
      });
    }
  } catch (error) {
    console.error(`Error updating video thumbnail: ${error.message}`);
    return res.status(500).json({
      success: false,
      message: error.message || 'Internal server error updating thumbnail'
    });
  }
};

// Function to create an SVG placeholder thumbnail
const createSVGPlaceholder = (title, timestamp = '') => {
  // Escape any special characters in the title for SVG
  const safeTitle = title.replace(/[<>&"']/g, c => {
    switch (c) {
      case '<': return '&lt;';
      case '>': return '&gt;';
      case '&': return '&amp;';
      case '"': return '&quot;';
      case "'": return '&apos;';
      default: return c;
    }
  });
  
  // Create an SVG with play button and video title
  const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" width="320" height="240" viewBox="0 0 320 240">
    <rect width="320" height="240" fill="#222222"/>
    <circle cx="160" cy="120" r="40" fill="none" stroke="#FFFFFF" stroke-width="5"/>
    <polygon points="145,100 145,140 185,120" fill="#FFFFFF"/>
    <text x="160" y="200" text-anchor="middle" fill="#FFFFFF" font-family="Arial" font-size="16">${safeTitle}</text>
    ${timestamp ? `<text x="160" y="220" text-anchor="middle" fill="#FFFFFF" font-family="Arial" font-size="12">${timestamp}</text>` : ''}
  </svg>`;
  
  // Convert the SVG to a buffer
  return Buffer.from(svgContent);
};

export const uploadMedia = async (req, res) => {
  try {
    if (!req.files || !req.files.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const file = req.files.file[0];
    const thumbnail = req.files.v_thumbnail ? req.files.v_thumbnail[0] : null;
    const thumbnailTimestamp = req.body.v_thumbnailTimestamp;

    // Format the filename for S3
    const originalName = file.originalname;
    const formattedName = formatFileName(originalName);

    // Upload the main file to S3 with the updated parameters
    const s3UploadResult = await uploadFileToS3({
      bucket: BUCKET_NAME,
      key: formattedName,
      body: file.buffer,
      contentType: file.mimetype,
      originalName: file.originalname,
      formattedName: formattedName
    });

    if (!s3UploadResult || !s3UploadResult.Location) {
      throw new Error('Failed to get file location from S3');
    }
    console.log('Main file uploaded to S3:', s3UploadResult);
    
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
      uploadedBy: req.body.uploadedBy,
      modifiedBy: req.body.modifiedBy,
      mediaType: req.body.mediaType,
      metadata: {
        ...parsedMetadata,
        tags: combinedTags, // Use the combined tags with defaults
      },
    };

    // Save to database first WITHOUT the thumbnail
    const baseType = mediaType.baseType || 'Media';
    const MediaModel = mongoose.model(baseType);
    
    const newMedia = new MediaModel(mediaData);
    const savedMedia = await newMedia.save();
    console.log('Saved media document:', savedMedia);

    // Now that we have a saved media with an ID, upload the thumbnail if provided
    let thumbnailLocation = null;
    if (thumbnail) {
      // Create a unique thumbnail filename with the media ID
      const mediaId = savedMedia._id.toString();
      const thumbnailFileName = `${mediaId.replace(/-/g, '_')}_thumbnail_jpg_${getFormattedDate()}`;
      
      // Upload thumbnail to S3 with the updated parameters
      const thumbnailResult = await uploadFileToS3({
        bucket: BUCKET_NAME,
        key: thumbnailFileName,
        body: thumbnail.buffer,
        contentType: thumbnail.mimetype,
        originalName: `${savedMedia.id}-thumbnail.jpg`,
        formattedName: thumbnailFileName,
        isThumbnail: true
      });
      
      if (thumbnailResult && thumbnailResult.Location) {
        thumbnailLocation = thumbnailResult.Location;
        console.log('Thumbnail uploaded to S3 with media ID:', thumbnailResult);
        
        // Update the media document with the thumbnail information
        // Make sure the metadata object exists
        if (!savedMedia.metadata) {
          savedMedia.metadata = {};
        }
        
        // Save the thumbnail URL to the v_thumbnail field
        savedMedia.metadata.v_thumbnail = thumbnailLocation;
        savedMedia.metadata.v_thumbnailTimestamp = thumbnailTimestamp || '00:00:01';
        
        // Log what we're saving to help with debugging
        console.log('Saving thumbnail info to media:', {
          mediaId: savedMedia.id,
          thumbnailUrl: thumbnailLocation,
          timestamp: thumbnailTimestamp || '00:00:01'
        });
        
        try {
          // Update the document directly using findByIdAndUpdate to ensure the fields are set
          const updatedMedia = await MediaModel.findByIdAndUpdate(
            savedMedia._id,
            { 
              $set: { 
                'metadata.v_thumbnail': thumbnailLocation,
                'metadata.v_thumbnailTimestamp': thumbnailTimestamp || '00:00:01'
              } 
            },
            { new: true } // Return the updated document
          );
          
          if (updatedMedia) {
            console.log('Successfully updated media with thumbnail using findByIdAndUpdate');
            // Replace savedMedia with the updated version for the response
            Object.assign(savedMedia, updatedMedia.toObject());
          } else {
            console.error('Failed to update media with thumbnail via findByIdAndUpdate');
          }
        } catch (updateError) {
          console.error('Error updating media with thumbnail:', updateError);
          // Continue with original save as fallback
        }
        
        // Also try the regular save as a backup method
        try {
          // Save the updated document
          await savedMedia.save();
          console.log('Updated media with thumbnail information via regular save');
        } catch (saveError) {
          console.error('Error in regular save:', saveError);
        }
      }
    }

    // Log the media upload activity
    if (req.user) {
      await ActivityTrackingService.trackMediaUpload(req.user, savedMedia);
    }

    // Return the complete response with updated thumbnail information
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

    // Log detailed information about the response, focusing on thumbnail data
    console.log('------------------- UPLOAD RESPONSE DATA -------------------');
    console.log('Media ID:', savedMedia.id);
    console.log('Thumbnail URL:', savedMedia.metadata?.v_thumbnail || 'NOT SET');
    console.log('Thumbnail in response metadata:', response.metadata?.v_thumbnail || 'NOT SET');
    console.log('Full metadata structure:', JSON.stringify(savedMedia.metadata, null, 2));
    console.log('-----------------------------------------------------------');

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
  console.log('Request URL:', req.originalUrl);
  console.log('Request method:', req.method);
  console.log('Request headers:', req.headers);

  try {
    // Fetch the document using the Media model
    console.log('Attempting to find media with slug:', slug);
    const documentBeforeUpdate = await Media.findOne({ slug });
    
    if (!documentBeforeUpdate) {
      console.log(`No document found with slug: ${slug}`);
      return res.status(404).json({ error: 'Media file not found' });
    }
    
    console.log('Found document:', JSON.stringify(documentBeforeUpdate, null, 2));
    
    // Get the specific model for this document
    const modelName = documentBeforeUpdate.constructor.modelName;
    console.log(`Document model name: ${modelName}`);
    
    // Update the fields
    if (req.body.title) {
      documentBeforeUpdate.title = req.body.title;
    }
    
    // Update metadata if it's provided
    if (req.body.metadata) {
      // Ensure there is a metadata object
      if (!documentBeforeUpdate.metadata) {
        documentBeforeUpdate.metadata = {};
      }
      
      // Update specified metadata fields
      for (const [key, value] of Object.entries(req.body.metadata)) {
        // Skip undefined values
        if (value !== undefined) {
          documentBeforeUpdate.metadata[key] = value;
        }
      }
    }
    
    // Save the updated document
    console.log('Saving updated document...');
    const updatedMediaFile = await documentBeforeUpdate.save();

    // Log the media update activity
    if (req.user) {
      // Determine which fields were changed
      const changedFields = [];
      if (req.body.title !== documentBeforeUpdate.title) changedFields.push('title');
      if (req.body.metadata) {
        Object.keys(req.body.metadata).forEach(key => {
          if (JSON.stringify(req.body.metadata[key]) !== JSON.stringify(documentBeforeUpdate.metadata?.[key])) {
            changedFields.push(`metadata.${key}`);
          }
        });
      }
      
      await ActivityTrackingService.trackMediaUpdate(req.user, updatedMediaFile, changedFields);
      console.log('Media update activity logged with changes:', changedFields);
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

// Add the getFormattedDate helper function
const getFormattedDate = () => {
  const date = new Date();
  return `${date.getMonth() + 1 < 10 ? '0' : ''}${date.getMonth() + 1}${date.getDate() < 10 ? '0' : ''}${date.getDate()}${date.getFullYear()}`;
};

// Create a simplified test function for thumbnail updates
export const testUpdateThumbnail = async (req, res) => {
  try {
    const { id } = req.params;
    const { timestamp } = req.body;
    
    console.log(`TEST: Updating thumbnail for media ID: ${id} at timestamp: ${timestamp}`);

    // Find the media file first
    const mediaFile = await Media.findById(id);
    if (!mediaFile) {
      return res.status(404).json({ success: false, message: 'Media file not found' });
    }

    console.log(`TEST: Found media file: ${mediaFile.title}, location: ${mediaFile.location}`);
    console.log('MediaFile ID properties:');
    console.log('_id:', mediaFile._id);
    console.log('id:', mediaFile.id);
    
    // Create a simple SVG placeholder thumbnail
    const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" width="320" height="240" viewBox="0 0 320 240">
      <rect width="320" height="240" fill="#222222"/>
      <circle cx="160" cy="120" r="40" fill="none" stroke="#FFFFFF" stroke-width="5"/>
      <polygon points="145,100 145,140 185,120" fill="#FFFFFF"/>
      <text x="160" y="200" text-anchor="middle" fill="#FFFFFF" font-family="Arial" font-size="16">Test Thumbnail</text>
      <text x="160" y="220" text-anchor="middle" fill="#FFFFFF" font-family="Arial" font-size="12">${timestamp}</text>
    </svg>`;
    
    // Convert the SVG to a buffer
    const thumbnailBuffer = Buffer.from(svgContent);
    
    // Get the old thumbnail URL for logging
    const oldThumbnailUrl = mediaFile.metadata?.v_thumbnail;
    console.log(`TEST: Old thumbnail URL: ${oldThumbnailUrl}`);

    // Create a unique filename
    const mediaId = mediaFile._id ? mediaFile._id.toString() : id;
    const fileName = mediaFile.id || mediaId;
    const thumbnailFileName = `${fileName.replace(/-/g, '_')}_test_thumbnail_svg_${getFormattedDate()}`;
    console.log(`TEST: Generated thumbnail filename: ${thumbnailFileName}`);
    
    // Log success and return a simulated success response
    return res.status(200).json({
      success: true,
      message: 'Test thumbnail would be updated successfully',
      testInfo: {
        mediaId: mediaId,
        fileName: fileName,
        thumbnailFileName: thumbnailFileName,
        oldThumbnail: oldThumbnailUrl
      }
    });
  } catch (error) {
    console.error(`TEST ERROR: ${error.message}`);
    return res.status(500).json({
      success: false,
      message: error.message || 'Internal server error in test function'
    });
  }
};


