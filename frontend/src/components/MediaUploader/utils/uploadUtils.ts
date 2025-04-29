import axios from 'axios';
import env from '../../../config/env';
import { MetadataState } from '../types';
import { BaseMediaFile } from '../../../interfaces/MediaFile';

interface UploadProgressCallback {
  (progress: number): void;
}

interface MediaUploadConfig {
  file: File;
  metadata: MetadataState;
  videoThumbnailTimestamp?: string;
  videoThumbnail?: string;
  onProgress?: UploadProgressCallback;
  onError?: (error: any) => void;
}

interface UploadedFile extends BaseMediaFile {
  slug: string;
  _id: string;
  mediaType: string;
  modifiedDate: string;
  metadata: {
    fileName: string;
    fileSize: number;
    fileExtension: string;
    tags: string[];
    visibility: string;
    altText: string;
    description: string;
    [key: string]: any;
  };
}

/**
 * Prepares metadata for upload by adding user ID and cleaning tags
 */
export const prepareMetadataForUpload = (
  metadata: any,
  userId: string
): any => {
  return {
    ...metadata,
    // Set default values if not present
    userId,
    visibility: metadata.visibility || 'public',
    recordedDate: metadata.recordedDate || new Date().toISOString(),
    uploadedBy: metadata.uploadedBy || userId,
    modifiedBy: metadata.modifiedBy || userId,
    // Ensure tags are valid strings, filtering out any undefined/null values
    tags: (metadata.tags || []).filter((tag: any) => typeof tag === 'string' && tag !== '')
  };
};

/**
 * Uploads a media file to the server with metadata
 */
export const uploadMedia = async ({
  file,
  metadata,
  videoThumbnailTimestamp,
  videoThumbnail,
  onProgress,
  onError
}: MediaUploadConfig): Promise<UploadedFile> => {
  try {
    // Create form data for the upload
    const formData = new FormData();
    formData.append('file', file);
    formData.append('mediaType', metadata.mediaTypeName || ''); // Ensure we have a string value
    formData.append('mediaTypeId', metadata.mediaTypeId || ''); // Ensure we have a string value
    
    // Set explicit title value
    const title = metadata.fileName || file.name;
    formData.append('title', title);
    
    // Extract and add file extension
    const fileExtension = file.name.split('.').pop() || '';
    formData.append('fileExtension', fileExtension);
    
    // Add all metadata as JSON
    const metadataWithType = {
      ...metadata,
      title: title, // Make sure there's always a title
      fileExtension: fileExtension, // Include the file extension in metadata as well
      v_thumbnailTimestamp: videoThumbnailTimestamp || ''
    };
    
    formData.append('metadata', JSON.stringify(metadataWithType));
    
    // Add video thumbnail if available
    if (videoThumbnail) {
      console.log('Video thumbnail found:', videoThumbnail);
      // Convert data URL to Blob for upload
      if (videoThumbnail.startsWith('data:')) {
        const res = await fetch(videoThumbnail);
        const blob = await res.blob();
        formData.append('v_thumbnail', blob);
        formData.append('v_thumbnailTimestamp', videoThumbnailTimestamp || '00:00:01');
      }
    }
    
    // Make the API call with proper type annotations
    const config = {
      headers: {
        'Content-Type': 'multipart/form-data',
        'Authorization': `Bearer ${localStorage.getItem('authToken')}`
      },
      onUploadProgress: (progressEvent: any) => {
        if (progressEvent.total && onProgress) {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress(percentCompleted);
        }
      }
    };
    
    const response = await axios.post<UploadedFile>(`${env.BASE_URL}/media/upload`, formData, config);
    
    // Handle successful upload
    if (response.data && response.data.slug) {
      return response.data;
    } else {
      throw new Error('Invalid response from server');
    }
  } catch (error: any) {
    console.error('Upload request failed:', error.response?.status, error.response?.statusText);
    if (error.response?.data) {
      console.error('Server error message:', error.response.data);
    }
    if (onError) {
      onError(error);
    }
    throw error;
  }
};

/**
 * Generates thumbnail for video file
 */
export const generateVideoThumbnail = async (
  videoFile: File,
  timestamp: string = '00:00:01'
): Promise<string | null> => {
  return new Promise((resolve) => {
    try {
      // Create video element
      const video = document.createElement('video');
      video.preload = 'metadata';
      
      // Create URL for the video file
      const videoUrl = URL.createObjectURL(videoFile);
      video.src = videoUrl;
      
      // Parse the timestamp (format: "hh:mm:ss")
      const timeParts = timestamp.split(':').map(part => parseInt(part, 10));
      const seconds = timeParts[0] * 3600 + timeParts[1] * 60 + timeParts[2];
      
      video.onloadedmetadata = () => {
        // Set the current time to the timestamp or to 1 second if invalid
        video.currentTime = seconds > 0 && seconds < video.duration ? seconds : 1;
      };
      
      video.onseeked = () => {
        // Create canvas and draw the video frame
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          const thumbnailUrl = canvas.toDataURL('image/jpeg');
          
          // Clean up
          URL.revokeObjectURL(videoUrl);
          resolve(thumbnailUrl);
        } else {
          // Clean up
          URL.revokeObjectURL(videoUrl);
          resolve(null);
        }
      };
      
      video.onerror = () => {
        // Clean up
        URL.revokeObjectURL(videoUrl);
        resolve(null);
      };
    } catch (error) {
      console.error('Error generating thumbnail:', error);
      resolve(null);
    }
  });
}; 