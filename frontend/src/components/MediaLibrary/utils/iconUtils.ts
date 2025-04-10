import React from 'react';
import { FaFileVideo, FaFileAudio, FaFilePdf, FaFileWord, FaFileExcel, FaFile } from 'react-icons/fa';
import { isImageFile, isVideoFile, isAudioFile, isDocumentFile } from './fileUtils';

/**
 * Get appropriate icon for a file based on file extension and media type
 * 
 * @param fileExtension The file extension
 * @param mediaType Optional media type name
 * @param size Icon size (default: 24)
 * @returns React icon component
 */
export const getFileIcon = (fileExtension?: string, mediaType?: string, size: number = 24) => {
  const extension = fileExtension?.toLowerCase();
  
  // Video files
  if (isVideoFile(extension) || mediaType?.includes('Video')) {
    return <FaFileVideo size={size} color="#3b82f6" />;
  }
  
  // Audio files
  if (isAudioFile(extension) || mediaType?.includes('Audio')) {
    return <FaFileAudio size={size} color="#06b6d4" />;
  }
  
  // Document files
  if (extension === 'pdf') {
    return <FaFilePdf size={size} color="#ef4444" />;
  }
  
  if (extension && ['doc', 'docx'].includes(extension)) {
    return <FaFileWord size={size} color="#3b82f6" />;
  }
  
  if (extension && ['xls', 'xlsx'].includes(extension)) {
    return <FaFileExcel size={size} color="#10b981" />;
  }
  
  // Default file icon for other types
  return <FaFile size={size} />;
}; 