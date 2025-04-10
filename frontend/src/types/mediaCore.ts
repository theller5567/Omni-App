import { MediaType } from '../store/slices/mediaTypeSlice';

// Core interfaces
export interface MediaMetadata {
  fileName: string;
  altText?: string;
  description?: string;
  visibility: 'public' | 'private';
  tags: string[];
  [key: string]: any;
}

export interface UploadState {
  file: File | null;
  mediaType: string;
  metadata: MediaMetadata;
  progress: number;
  isProcessing: boolean;
  previewUrl?: string;
}

// Type guards
export const isVideoFile = (file: File): boolean => 
  file.type.startsWith('video/');

export const isImageFile = (file: File): boolean => 
  file.type.startsWith('image/');

// Logging utilities
export const mediaLogger = (component: string) => ({
  state: (action: string, state: Partial<UploadState>) => {
    console.log(`[${component}] ${action}:`, {
      file: state.file ? {
        name: state.file.name,
        type: state.file.type,
        size: state.file.size
      } : null,
      mediaType: state.mediaType,
      metadata: state.metadata,
      progress: state.progress,
      isProcessing: state.isProcessing,
      previewUrl: state.previewUrl
    });
  },
  
  mediaType: (action: string, mediaType: MediaType) => {
    console.log(`[${component}] ${action}:`, {
      id: mediaType._id,
      name: mediaType.name,
      acceptedTypes: mediaType.acceptedFileTypes,
      fields: mediaType.fields.map(f => ({
        name: f.name,
        type: f.type,
        required: f.required
      }))
    });
  },

  file: (action: string, file: File) => {
    console.log(`[${component}] ${action}:`, {
      name: file.name,
      type: file.type,
      size: file.size,
      lastModified: new Date(file.lastModified).toISOString()
    });
  },

  metadata: (action: string, metadata: MediaMetadata) => {
    console.log(`[${component}] ${action}:`, {
      standardFields: {
        fileName: metadata.fileName,
        altText: metadata.altText,
        description: metadata.description,
        visibility: metadata.visibility,
        tags: metadata.tags
      },
      customFields: Object.entries(metadata)
        .filter(([key]) => !['fileName', 'altText', 'description', 'visibility', 'tags'].includes(key))
        .reduce((acc, [key, value]) => ({ ...acc, [key]: value }), {})
    });
  },

  error: (action: string, error: any) => {
    console.error(`[${component}] Error in ${action}:`, {
      message: error.message,
      code: error.code,
      details: error.response?.data
    });
  }
}); 