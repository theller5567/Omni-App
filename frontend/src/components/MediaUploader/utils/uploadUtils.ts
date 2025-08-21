import apiClient from '../../../api/apiClient';
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
  // Start with required fields and defaults
  const preparedMetadata: any = {
    // Set default values for required fields
    userId,
    visibility: metadata.visibility || 'public',
    recordedDate: metadata.recordedDate || new Date().toISOString(),
    uploadedBy: metadata.uploadedBy || userId,
    modifiedBy: metadata.modifiedBy || userId,
    // Ensure tags are valid strings, filtering out any undefined/null values
    tags: (metadata.tags || []).filter((tag: any) => typeof tag === 'string' && tag !== ''),
    // Include related media if present, but strip out _display which is only for UI
    relatedMedia: (metadata.relatedMedia || []).map((item: any) => ({
      mediaId: item.mediaId,
      relationship: item.relationship,
      note: item.note
    }))
  };
  
  // Copy other metadata fields, but only if they have actual values
  Object.entries(metadata).forEach(([key, value]) => {
    // Skip fields we've already handled
    if (['userId', 'visibility', 'recordedDate', 'uploadedBy', 'modifiedBy', 'tags', 'relatedMedia'].includes(key)) {
      return;
    }
    
    // Only include fields with actual values (not empty strings, null, or undefined)
    if (value !== undefined && value !== null && value !== '') {
      preparedMetadata[key] = value;
    }
  });
  
  return preparedMetadata;
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
    // Lock extension: if user-provided fileName changes, keep original file extension
    const origExt = (file.name.match(/\.[^.]+$/) || [''])[0];
    const userBase = (metadata.fileName || file.name).replace(/\.[^.]+$/, '');
    const title = `${userBase}${origExt}`;
    formData.append('title', title);
    
    // Extract and add file extension
    const fileExtension = (origExt.replace('.', '')) || (file.name.split('.').pop() || '');
    formData.append('fileExtension', fileExtension);
    
    // Add all metadata as JSON
    const metadataWithType = {
      ...metadata,
      title: title, // Make sure there's always a title
      fileExtension: fileExtension, // Include the file extension in metadata as well
      v_thumbnailTimestamp: videoThumbnailTimestamp || ''
    };
    
    // Filter out empty/null/undefined values before sending to the server
    const cleanedMetadata = Object.entries(metadataWithType).reduce((acc, [key, value]) => {
      // Only include fields with actual values
      if (value !== undefined && value !== null && value !== '') {
        acc[key] = value;
      }
      return acc;
    }, {} as any);
    
    formData.append('metadata', JSON.stringify(cleanedMetadata));
    
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
    // Dynamic timeout: longer for large files and videos
    const isVideo = file && typeof file.type === 'string' && file.type.startsWith('video/');
    const sizeBytes = file?.size || 0;
    const sizeMB = Math.round(sizeBytes / (1024 * 1024));
    const timeoutForUpload = isVideo
      ? 300_000 // 5 minutes for videos
      : sizeMB > 25
        ? 180_000 // 3 minutes for large non-video files
        : 60_000; // 1 minute for small files

    const config: any = {
      // Let axios/browser set the proper multipart boundary; don't set Content-Type manually
      onUploadProgress: (progressEvent: any) => {
        if (progressEvent.total && onProgress) {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress(percentCompleted);
        }
      },
      // Uploads can be large/slow: override short global timeout and size limits
      timeout: timeoutForUpload,
      maxContentLength: Infinity,
      maxBodyLength: Infinity
    };
    
    // Use cookie-aware client so HttpOnly cookies are sent
    const response = await apiClient.post<UploadedFile>(`/media/upload`, formData, config);
    
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