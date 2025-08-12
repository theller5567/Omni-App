import React from 'react';
import { Card, CardContent, Typography, Box} from '@mui/material';
import '../MediaCard.scss';
import { isImageFile, isVideoFile, getFileIcon } from '../utils';
import { useMediaTypes, TransformedMediaFile } from '../../../hooks/query-hooks';
import { cdnUrl, cdnSrcSet } from '../../../utils/imageCdn';

interface MediaCardProps {
  file: TransformedMediaFile;
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
  const { data: mediaTypes = [], isLoading: isLoadingMediaTypes, isError: isMediaTypesError } = useMediaTypes({ enabled: true });
  // Get current user role
  
  // Find the media type color
  const { mediaTypeLabel, mediaTypeColor } = React.useMemo(() => {
    const fallback = { mediaTypeLabel: typeof file.mediaType === 'string' ? file.mediaType : 'Unknown', mediaTypeColor: '#4dabf5' };
    if (isLoadingMediaTypes || isMediaTypesError || !mediaTypes) return fallback;
    const mt: any = (file as any).mediaType;
    const mtId: string | undefined = (file as any).mediaTypeId;
    let found = null as any;
    if (mt && typeof mt === 'object') found = mediaTypes.find((t: any) => t._id === mt._id) || mediaTypes.find((t: any) => t.name === mt.name);
    else if (typeof mt === 'string' || typeof mtId === 'string') found = mediaTypes.find((t: any) => t._id === (mtId || mt)) || mediaTypes.find((t: any) => t.name === ((file as any).mediaTypeName || mt));
    else if ((file as any).mediaTypeName) found = mediaTypes.find((t: any) => t.name === (file as any).mediaTypeName);
    return { mediaTypeLabel: found?.name || (file as any).mediaTypeName || (typeof mt === 'string' ? mt : 'Unknown'), mediaTypeColor: found?.catColor || '#4dabf5' };
  }, [file.mediaType, (file as any).mediaTypeId, (file as any).mediaTypeName, mediaTypes, isLoadingMediaTypes, isMediaTypesError]);

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
          // Use known intrinsic dimensions when available to prevent CLS
          const intrinsicWidth = (file.metadata as any)?.imageWidth || (file as any).imageWidth || undefined;
          const intrinsicHeight = (file.metadata as any)?.imageHeight || (file as any).imageHeight || undefined;
          const aspectRatio = intrinsicWidth && intrinsicHeight ? intrinsicWidth / intrinsicHeight : 16 / 9;
          const [loaded, setLoaded] = React.useState(false);
          return (
            <img 
              src={cdnUrl(file.location, { w: 640 })} 
              srcSet={cdnSrcSet(file.location)}
              sizes="(max-width: 600px) 50vw, (max-width: 1200px) 33vw, 240px"
              alt={file.metadata?.fileName || file.title || 'Image'} 
              className="preview-image"
              loading="lazy"
              decoding="async"
              fetchPriority="low"
              width={intrinsicWidth || undefined}
              height={intrinsicHeight || undefined}
              style={{
                aspectRatio: `${aspectRatio}`,
                filter: loaded ? 'none' : 'blur(12px)',
                transform: loaded ? 'none' : 'scale(1.03)',
                transition: 'filter 320ms ease, transform 320ms ease'
              }}
              onLoad={() => setLoaded(true)}
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
        if (file.metadata && typeof file.metadata.v_thumbnail === 'string') {
          // Now file.metadata is confirmed to exist, and file.metadata.v_thumbnail is a string.
          const timestamp = file.metadata.v_thumbnailTimestamp ?? Date.now(); 
          const thumbnailUrl = file.metadata.v_thumbnail.split('?')[0]; 
          const thumbnailWithCacheBuster = `${thumbnailUrl}?t=${timestamp}&id=${file.id || ''}`;
          const intrinsicWidth = (file.metadata as any)?.imageWidth || undefined;
          const intrinsicHeight = (file.metadata as any)?.imageHeight || undefined;
          const aspectRatio = intrinsicWidth && intrinsicHeight ? intrinsicWidth / intrinsicHeight : 16 / 9;
          const [loaded, setLoaded] = React.useState(false);
          return (
            <img 
              src={cdnUrl(thumbnailWithCacheBuster, { w: 640 })} 
              srcSet={cdnSrcSet(thumbnailWithCacheBuster)}
              sizes="(max-width: 600px) 50vw, (max-width: 1200px) 33vw, 240px"
              alt={file.metadata.fileName || file.title || 'Video'} 
              className="preview-image"
              loading="lazy"
              decoding="async"
              fetchPriority="low"
              width={intrinsicWidth || undefined}
              height={intrinsicHeight || undefined}
              style={{
                aspectRatio: `${aspectRatio}`,
                filter: loaded ? 'none' : 'blur(12px)',
                transform: loaded ? 'none' : 'scale(1.03)',
                transition: 'filter 320ms ease, transform 320ms ease'
              }}
              onLoad={() => setLoaded(true)}
              key={`thumb-card-${file.id}-${timestamp}`} // Add key to force re-render
              onError={(e) => {
                console.warn('Error loading video thumbnail:', file.metadata?.v_thumbnail); // Added optional chaining here
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
              {mediaTypeLabel}
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