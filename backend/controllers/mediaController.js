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


