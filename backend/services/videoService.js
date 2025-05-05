import ffmpeg from 'fluent-ffmpeg';
import ffmpegPath from '@ffmpeg-installer/ffmpeg';
import { uploadFileToS3 } from './awsService.js';
import axios from 'axios';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

// Configure ffmpeg with the installed path
ffmpeg.setFfmpegPath(ffmpegPath.path);

/**
 * Generates a thumbnail from a video at the specified timestamp
 * @param {string} videoUrl - The URL of the video file
 * @param {string} mediaId - The ID of the media file
 * @param {string} timestamp - The timestamp in format HH:MM:SS
 * @returns {Promise<Object>} - Object containing the thumbnail URL
 */
export const generateThumbnailFromTimestamp = async (videoUrl, mediaId, timestamp) => {
  try {
    console.log(`Generating thumbnail for video ${mediaId} at timestamp ${timestamp}`);
    
    // Create a temporary directory for processing
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'video-thumbnail-'));
    const outputPath = path.join(tempDir, `${mediaId}_thumbnail_${Date.now()}.jpg`);
    
    console.log(`Temporary output path: ${outputPath}`);
    
    // Download the video to a temporary file for processing
    const videoTempPath = path.join(tempDir, `${mediaId}_video_temp.mp4`);
    console.log(`Downloading video from ${videoUrl} to ${videoTempPath}`);
    
    // Stream the video to a temporary file
    const videoResponse = await axios({
      method: 'GET',
      url: videoUrl,
      responseType: 'stream'
    });
    
    const writer = fs.createWriteStream(videoTempPath);
    videoResponse.data.pipe(writer);
    
    await new Promise((resolve, reject) => {
      writer.on('finish', resolve);
      writer.on('error', reject);
    });
    
    console.log(`Video downloaded successfully, generating thumbnail at timestamp ${timestamp}`);
    
    // Use ffmpeg to extract a frame at the specified timestamp
    await new Promise((resolve, reject) => {
      ffmpeg(videoTempPath)
        .screenshots({
          timestamps: [timestamp],
          filename: path.basename(outputPath),
          folder: path.dirname(outputPath),
          size: '640x?'  // Maintain aspect ratio with 640px width
        })
        .on('end', () => {
          console.log('Thumbnail generated successfully');
          resolve();
        })
        .on('error', (err) => {
          console.error('FFmpeg error:', err);
          reject(err);
        });
    });
    
    console.log(`Thumbnail generated at ${outputPath}`);
    
    // Read the generated thumbnail file
    const thumbnailBuffer = fs.readFileSync(outputPath);
    
    // Upload the thumbnail to S3
    console.log('Uploading thumbnail to S3');
    const s3Result = await uploadFileToS3({
      buffer: thumbnailBuffer,
      mimetype: 'image/jpeg',
      originalname: path.basename(outputPath),
      size: thumbnailBuffer.length
    });
    
    console.log('Thumbnail uploaded to S3:', s3Result.Location);
    
    // Clean up temp files
    try {
      fs.unlinkSync(videoTempPath);
      fs.unlinkSync(outputPath);
      fs.rmdirSync(tempDir);
      console.log('Temporary files cleaned up');
    } catch (cleanupError) {
      console.warn('Warning: Failed to clean up some temporary files:', cleanupError);
    }
    
    return {
      thumbnailUrl: s3Result.Location,
      timestamp
    };
  } catch (error) {
    console.error('Error generating video thumbnail:', error);
    throw new Error(`Failed to generate thumbnail: ${error.message}`);
  }
}; 