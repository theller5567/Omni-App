import { MediaType } from "../../../store/slices/mediaTypeSlice";
import { TagCategory } from "../../../store/slices/tagCategorySlice";

/**
 * Returns base fields for a specific MIME type
 */
export const getBaseFieldsForMimeType = (mimeType: string): Record<string, any> => {
  console.log('getBaseFieldsForMimeType called with:', mimeType);
  
  const baseFields: Record<string, any> = {};
  
  if (mimeType.startsWith('image/')) {
    baseFields.imageWidth = { 
      type: 'Number', 
      required: false 
    };
    baseFields.imageHeight = { 
      type: 'Number', 
      required: false 
    };
    baseFields.imageFormat = { 
      type: 'Text', 
      required: false 
    };
    // Add more image-specific fields
    baseFields.colorSpace = {
      type: 'Select',
      options: ['RGB', 'CMYK', 'Grayscale'],
      required: false
    };
    baseFields.imageOrientation = {
      type: 'Select',
      options: ['Landscape', 'Portrait', 'Square'],
      required: false
    };
  } else if (mimeType.startsWith('video/')) {
    baseFields.videoDuration = { 
      type: 'Text', 
      required: false 
    };
    baseFields.videoCodec = { 
      type: 'Text', 
      required: false 
    };
    baseFields.videoResolution = { 
      type: 'Text', 
      required: false 
    };
    // Add more video-specific fields
    baseFields.frameRate = {
      type: 'Text',
      required: false
    };
    baseFields.aspectRatio = {
      type: 'Select',
      options: ['16:9', '4:3', '21:9', 'Other'],
      required: false
    };
  } else if (mimeType.startsWith('audio/')) {
    baseFields.audioDuration = { 
      type: 'Text', 
      required: false 
    };
    baseFields.audioCodec = { 
      type: 'Text', 
      required: false 
    };
    baseFields.audioSampleRate = { 
      type: 'Text', 
      required: false 
    };
    // Add more audio-specific fields
    baseFields.bitRate = {
      type: 'Text',
      required: false
    };
    baseFields.channels = {
      type: 'Select',
      options: ['Mono', 'Stereo', 'Surround'],
      required: false
    };
  } else if (mimeType === 'application/pdf') {
    baseFields.pageCount = { 
      type: 'Number', 
      required: false 
    };
    baseFields.documentType = { 
      type: 'Text', 
      required: false,
      value: 'PDF'
    };
    // Add more document-specific fields
    baseFields.author = {
      type: 'Text',
      required: false
    };
    baseFields.creationDate = {
      type: 'Date',
      required: false
    };
  }
  
  console.log('Generated baseFields:', Object.keys(baseFields).length, 'fields for MIME type:', mimeType);
  return baseFields;
};

/**
 * Get tag options from a tag category
 */
export const getTagCategoryOptions = (
  tagCategories: TagCategory[],
  tagCategoryId: string
): string[] => {
  if (!tagCategoryId || !tagCategories) return [];
  
  const category = tagCategories.find(cat => cat._id === tagCategoryId);
  return category?.tags?.map(tag => tag.name) || [];
};

/**
 * Check if a field uses tag categories
 */
export const isTagCategoryField = (field: any): boolean => {
  return field && 
    (field.type === 'Select' || field.type === 'MultiSelect') && 
    field.useTagCategory && 
    !!field.tagCategoryId;
};

/**
 * Find a media type by ID or name
 */
export const findMediaType = (
  mediaTypes: MediaType[],
  mediaTypeId: string | null
): MediaType | null => {
  if (!mediaTypeId || !mediaTypes.length) return null;
  
  // First try to find by ID
  let matchingType = mediaTypes.find(type => type._id === mediaTypeId);
  
  // If not found, try by name (for backward compatibility)
  if (!matchingType) {
    matchingType = mediaTypes.find(type => type.name === mediaTypeId);
  }
  
  return matchingType || null;
};

/**
 * Checks if a media type supports related media
 */
export const supportsRelatedMedia = (mediaType: MediaType | null): boolean => {
  if (!mediaType) return false;
  
  // Check if the mediaType has the settings property with allowRelatedMedia: true
  return !!mediaType.settings?.allowRelatedMedia;
}; 