import React from 'react';
import { Card, CardContent, Typography, Box} from '@mui/material';
import '../MediaCard.scss';
import { isImageFile, isVideoFile, getFileIcon } from '../utils';
import { useSelector } from 'react-redux';
import { RootState } from '../../../store/store';

interface MediaCardProps {
  file: any;
  handleFileClick: () => void;
  onDeleteClick?: () => void;
}

/**
 * Helper function to clean thumbnail URL and add consistent cache-busting
 * @param url - The thumbnail URL to format
 * @param mediaId - The media ID to use as a stable cache key
 * @param forceRefresh - Whether to force a refresh with a timestamp (default: false)
 */
const formatThumbnailUrl = (url: string, mediaId: string, forceRefresh = false): string => {
  if (!url) return '';
  // Remove any existing query parameters
  const cleanUrl = url.split('?')[0];
  
  // For initial rendering or stable display, use just the mediaId as cache key
  // For explicit refresh actions (like after updating thumbnail), add timestamp
  if (forceRefresh) {
    return `${cleanUrl}?id=${mediaId}&t=${Date.now()}`;
  } else {
    return `${cleanUrl}?id=${mediaId}`;
  }
};

const MediaCard: React.FC<MediaCardProps> = ({ file, handleFileClick }) => {
  // Add error boundary
  const [hasError, setHasError] = React.useState(false);
  
  // Add debugging logs
  React.useEffect(() => {
    console.log('MediaCard rendering with file:', {
      id: file?.id,
      location: file?.location?.substring(0, 30) + '...',
      mediaType: file?.mediaType,
      fileExtension: file?.fileExtension
    });
    
    // Check for required fields
    if (!file?.location && !file?.fileExtension) {
      console.warn('MediaCard missing required fields:', file);
    }
  }, [file]);
  
  // Get media types to find the color
  const mediaTypes = useSelector((state: RootState) => state.mediaTypes.mediaTypes);
  // Get current user role
  
  // Find the media type color
  const mediaTypeColor = React.useMemo(() => {
    const mediaType = mediaTypes.find(type => type.name === file.mediaType);
    return mediaType?.catColor || '#4dabf5';
  }, [file.mediaType, mediaTypes]);

  // If there was an error rendering, show a placeholder
  if (hasError) {
    return (
      <Card className="media-card media-card-error">
        <CardContent>
          <Typography variant="subtitle2" color="error">
            Error rendering media
          </Typography>
        </CardContent>
      </Card>
    );
  }

  // Wrap the actual rendering in try/catch to prevent crashes
  try {
    const renderPreview = () => {
      // Check if file has required properties
      if (!file) {
        console.warn('MediaCard received null or undefined file');
        return (
          <div className="icon-container">
            {getFileIcon('', '', 48)}
          </div>
        );
      }
      
    if (isImageFile(file.fileExtension)) {
        // Only render image if URL exists
        if (file.location) {
      return (
        <img 
          src={file.location} 
              alt={file.metadata?.fileName || file.title || 'Image'} 
          className="preview-image"
          loading="lazy"
              onError={(e) => {
                console.warn('Error loading image:', file.location);
                // Replace with fallback
                e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0iI2NjYyI+PHBhdGggZD0iTTIxIDV2MTRoLTE4di0xNGgxOHptMC0yaC0xOGMtMS4xIDAtMiAuOS0yIDJ2MTRjMCAxLjEuOSAyIDIgMmgxOGMxLjEgMCAyLS45IDItMnYtMTRjMC0xLjEtLjktMi0yLTJ6bS0xMCA3YzAgMS4xLS45IDItMiAycy0yLS45LTItMiAuOS0yIDItMiAyIC45IDIgMnptNCAxLjQzYzAtLjYyLjMzLTEuMjkgMS0xLjQuNzgtLjEzIDEuNS40NiAxLjUgMS4yNHY0LjczaC0xM3YtMmgzLjY3Yy40MiAwIC43Ny0uMTYgMS4wMi0uNDZsMS41LTEuODNjLjM5LS40OCAxLjEtLjUgMS41NiAwbC40LjQ3Yy4zMS4zNi44OS4zNiAxLjIgMGwxLjA1LTEuMjhjLjQuNDkuOS43NC45LjczeiIvPjwvc3ZnPg==';
              }}
        />
      );
        }
    } 
    
    if (isVideoFile(file.fileExtension) || file.mediaType?.includes('Video')) {
      if (file.metadata?.v_thumbnail) {
        // Use consistent thumbnail formatting
        const thumbnailWithCacheBuster = formatThumbnailUrl(file.metadata.v_thumbnail, file._id || file.id || '', true);
        return (
          <img 
            src={thumbnailWithCacheBuster} 
            alt={file.metadata?.fileName || file.title || 'Video'} 
            className="preview-image"
            loading="lazy"
            onError={(e) => {
              console.warn('Error loading video thumbnail:', file.metadata.v_thumbnail);
              // Replace with fallback
              e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0iIzNiODJmNiI+PHBhdGggZD0iTTEyIDJjNS41MiAwIDEwIDQuNDggMTAgMTBzLTQuNDggMTAtMTAgMTAtMTAtNC40OC0xMC0xMCA0LjQ4LTEwIDEwLTEwem0wLTJjLTYuNjMgMC0xMiA1LjM3LTEyIDEyczUuMzcgMTIgMTIgMTIgMTItNS4zNyAxMi0xMi01LjM3LTEyLTEyLTEyem0tMyAxN3YtMTBsOSA1LjAxNC05IDQuOTg2eiIvPjwvc3ZnPg==';
            }}
          />
        );
      }
    }
    
      // Fallback to icon for all other file types
    return (
      <div className="icon-container">
        {getFileIcon(file.fileExtension, file.mediaType, 48)}
      </div>
    );
  };

  // Get clean extension for the badge
  const fileExtension = file.fileExtension ? file.fileExtension.toUpperCase() : '';

  return (
    <Card 
      className="media-card" 
      onClick={handleFileClick}
      data-extension={fileExtension}
    >
      {/* Color indicator circle */}
      <div 
        className="media-type-indicator" 
        style={{ backgroundColor: mediaTypeColor }}
      />
      
      <div className="media-preview">
        {renderPreview()}
      </div>
      <CardContent className="media-info">
        <Typography variant="subtitle2" className="media-title" title={file.metadata?.fileName || file.title}>
          {file.metadata?.fileName || file.title}
        </Typography>
        <Box className="media-meta">
          <Typography 
            variant="caption" 
            className="media-type"
            style={{ backgroundColor: mediaTypeColor }}
          >
            {file.mediaType}
          </Typography>
         
        </Box>
      </CardContent>
    </Card>
  );
  } catch (error) {
    console.error('Error rendering MediaCard:', error);
    setHasError(true);
    return (
      <Card className="media-card media-card-error">
        <CardContent>
          <Typography variant="subtitle2" color="error">
            Error rendering media
          </Typography>
        </CardContent>
      </Card>
    );
  }
};

export default MediaCard; 