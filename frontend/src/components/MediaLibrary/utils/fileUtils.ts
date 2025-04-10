/**
 * Utility functions for handling files in the Media Library
 */

/**
 * Determine if a file is an image based on its extension
 */
export const isImageFile = (extension?: string): boolean => {
  if (!extension) return false;
  return ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp'].includes(
    extension.toLowerCase()
  );
};

/**
 * Determine if a file is a video based on its extension
 */
export const isVideoFile = (extension?: string): boolean => {
  if (!extension) return false;
  return ['mp4', 'webm', 'mov', 'avi', 'mkv'].includes(
    extension.toLowerCase()
  );
};

/**
 * Determine if a file is an audio file based on its extension
 */
export const isAudioFile = (extension?: string): boolean => {
  if (!extension) return false;
  return ['mp3', 'wav', 'ogg', 'aac', 'flac'].includes(
    extension.toLowerCase()
  );
};

/**
 * Determine if a file is a document based on its extension
 */
export const isDocumentFile = (extension?: string): boolean => {
  if (!extension) return false;
  return ['pdf', 'doc', 'docx', 'txt', 'xls', 'xlsx', 'ppt', 'pptx'].includes(
    extension.toLowerCase()
  );
};

/**
 * Get mime type for a file extension
 */
export const getMimeType = (extension?: string): string => {
  if (!extension) return 'application/octet-stream';
  
  const ext = extension.toLowerCase();
  
  // Image types
  if (ext === 'jpg' || ext === 'jpeg') return 'image/jpeg';
  if (ext === 'png') return 'image/png';
  if (ext === 'gif') return 'image/gif';
  if (ext === 'webp') return 'image/webp';
  if (ext === 'svg') return 'image/svg+xml';
  if (ext === 'bmp') return 'image/bmp';
  
  // Video types
  if (ext === 'mp4') return 'video/mp4';
  if (ext === 'webm') return 'video/webm';
  if (ext === 'mov') return 'video/quicktime';
  if (ext === 'avi') return 'video/x-msvideo';
  if (ext === 'mkv') return 'video/x-matroska';
  
  // Audio types
  if (ext === 'mp3') return 'audio/mpeg';
  if (ext === 'wav') return 'audio/wav';
  if (ext === 'ogg') return 'audio/ogg';
  if (ext === 'aac') return 'audio/aac';
  if (ext === 'flac') return 'audio/flac';
  
  // Document types
  if (ext === 'pdf') return 'application/pdf';
  if (ext === 'doc') return 'application/msword';
  if (ext === 'docx') return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
  if (ext === 'txt') return 'text/plain';
  if (ext === 'xls') return 'application/vnd.ms-excel';
  if (ext === 'xlsx') return 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
  if (ext === 'ppt') return 'application/vnd.ms-powerpoint';
  if (ext === 'pptx') return 'application/vnd.openxmlformats-officedocument.presentationml.presentation';
  
  return 'application/octet-stream';
}; 