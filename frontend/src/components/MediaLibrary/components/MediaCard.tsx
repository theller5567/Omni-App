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

const MediaCard: React.FC<MediaCardProps> = ({ file, handleFileClick }) => {
  // Add error boundary
  const [hasError, setHasError] = React.useState(false);
  
  // Add lazy loading with Intersection Observer
  const [isVisible, setIsVisible] = React.useState(false);
  const cardRef = React.useRef<HTMLDivElement>(null);
  
  React.useEffect(() => {
    const currentRef = cardRef.current;
    
    if (!currentRef) return;
    
    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting) {
          setIsVisible(true);
          // Once visible, no need to observe anymore
          observer.disconnect();
        }
      },
      {
        root: null,
        rootMargin: '100px', // Load images 100px before they come into view
        threshold: 0.1,
      }
    );
    
    observer.observe(currentRef);
    
    return () => {
      if (currentRef) observer.unobserve(currentRef);
    };
  }, []);
  
  // Add debugging logs
  React.useEffect(() => {
    // Only log serious errors, not regular rendering info
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
      
      // Only load images/thumbnails when card is visible in viewport
      if (!isVisible) {
        return (
          <div className="icon-container">
            {getFileIcon(file.fileExtension, file.mediaType, 48)}
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
          // Add a timestamp to always get the fresh thumbnail
          const timestamp = file.metadata?.v_thumbnailTimestamp || Date.now();
          const thumbnailUrl = file.metadata.v_thumbnail.split('?')[0]; // Get clean URL
          const thumbnailWithCacheBuster = `${thumbnailUrl}?t=${timestamp}&id=${file.id || ''}`;
          return (
            <img 
              src={thumbnailWithCacheBuster} 
              alt={file.metadata?.fileName || file.title || 'Video'} 
              className="preview-image"
              loading="lazy"
              key={`thumb-card-${file.id}-${timestamp}`} // Add key to force re-render
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
        ref={cardRef}
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