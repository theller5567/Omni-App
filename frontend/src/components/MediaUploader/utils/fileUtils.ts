import { MediaType } from "../../../hooks/query-hooks";

/**
 * Returns the appropriate icon based on file type
 */
export const getFileTypeIcon = (fileType: string) => {
  if (fileType.startsWith("image")) return "image";
  if (fileType.startsWith("video")) return "video";
  if (fileType.startsWith("audio")) return "audio";
  if (fileType.startsWith("application/pdf")) return "document";
  return "file";
};

/**
 * Formats file size to human-readable format
 */
export const formatFileSize = (size: number): string => {
  if (size < 1024) return size + " B";
  if (size < 1024 * 1024) return (size / 1024).toFixed(1) + " KB";
  return (size / (1024 * 1024)).toFixed(1) + " MB";
};

/**
 * Validates if a file is of an accepted type
 */
export const isFileTypeValid = (file: File, acceptedTypes: string[]): boolean => {
  // If no accepted types are specified, all files are valid
  if (!acceptedTypes || acceptedTypes.length === 0) {
    return true;
  }

  // Extract the main MIME type and full MIME type
  const fileMainType = file.type.split('/')[0].toLowerCase();
  const fileFullType = file.type.toLowerCase();

  // Check if the file type is in the accepted types list
  return acceptedTypes.some(acceptedType => {
    // Handle wildcard MIME types like "image/*"
    if (acceptedType.endsWith('/*')) {
      const acceptedMainType = acceptedType.split('/')[0].toLowerCase();
      return fileMainType === acceptedMainType;
    }
    // Handle specific MIME types like "image/jpeg"
    return fileFullType === acceptedType.toLowerCase();
  });
};

/**
 * Returns a summary of accepted file types for display
 */
export const getAcceptedFileTypesSummary = (mediaType: MediaType | null): string => {
  if (!mediaType || !mediaType.acceptedFileTypes || mediaType.acceptedFileTypes.length === 0) {
    return "All file types";
  }

  const types = mediaType.acceptedFileTypes.map((type: string) => {
    if (type === "image/*") return "Images";
    if (type === "video/*") return "Videos";
    if (type === "audio/*") return "Audio";
    if (type === "application/pdf") return "PDFs";
    if (type.includes("/")) {
      const parts = type.split("/");
      return `${parts[1].toUpperCase()} ${parts[0]}s`;
    }
    return type;
  });

  // Get unique types and join them
  return [...new Set(types)].join(", ");
};

/**
 * Returns the file extension from a filename
 */
export const getFileExtension = (filename: string): string => {
  return filename.slice(((filename.lastIndexOf(".") - 1) >>> 0) + 2);
};

/**
 * Returns accepted file types as a string for the file input
 */
export const getAcceptedFileTypesString = (acceptedTypes: string[]): string => {
  if (!acceptedTypes || acceptedTypes.length === 0) {
    return "";
  }
  return acceptedTypes.join(",");
};

export const isVideoFile = (extension: string): boolean => 
  ['mp4', 'mov', 'avi', 'mkv', 'webm'].includes(extension.toLowerCase());

export const isImageFile = (extension: string): boolean => 
  ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg'].includes(extension.toLowerCase()); 