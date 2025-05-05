import env from '../config/env';

/**
 * Get a proxied video URL to avoid CORS issues when streaming from S3
 * @param originalUrl - Original S3 or direct video URL
 * @param mediaId - The ID of the media file
 * @returns Proxied URL through the backend
 */
export const getProxiedVideoUrl = (originalUrl: string, mediaId: string): string => {
  // For S3 videos, use the proxy endpoint
  if (originalUrl.includes('s3.') || originalUrl.includes('amazonaws.com')) {
    return `${env.BASE_URL}/media/video-proxy/${mediaId}`;
  }
  
  // For testing with local videos, use the direct URL
  return originalUrl;
};

/**
 * Format a timestamp in the format HH:MM:SS
 * @param seconds - Seconds to format
 * @returns Formatted timestamp string
 */
export const formatTimestamp = (seconds: number): string => {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}; 