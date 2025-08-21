import React from 'react';
import { Card, CardContent, Typography, Box} from '@mui/material';
import '../MediaCard.scss';
import { isImageFile, isVideoFile, getFileIcon } from '../utils';
import { useMediaTypes, TransformedMediaFile } from '../../../hooks/query-hooks';
import { cdnUrl, cdnSrcSet } from '../../../utils/imageCdn';

const hasFileExtension = (url: string): boolean => {
  try {
    const path = url.split('?')[0];
    return /\.[a-zA-Z0-9]{2,5}$/.test(path);
  } catch {
    return false;
  }
};

interface MediaCardProps {
  file: TransformedMediaFile;
  handleFileClick: () => void;
  onDeleteClick?: () => void;
}

const MediaCard: React.FC<MediaCardProps> = ({ file, handleFileClick }) => {
  // Error boundary flag
  const [hasError, setHasError] = React.useState(false);
  const cdnTriedRef = React.useRef(false);
  const [failed, setFailed] = React.useState(false);
  
  // Add lazy loading with Intersection Observer
  const [isVisible, setIsVisible] = React.useState(false);
  const cardRef = React.useRef<HTMLDivElement>(null);
  // Single loaded flag used for both image and video thumbnail to avoid hooks-in-branches
  const [loaded, setLoaded] = React.useState(false);
  
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
      
      if (failed) {
        return (
          <div className="icon-container">
            {getFileIcon(file.fileExtension, file.mediaType, 48)}
          </div>
        );
      }

      if (isImageFile(file.fileExtension)) {
        if (file.location) {
          const useCdn = hasFileExtension(file.location);
          // Use known intrinsic dimensions when available to prevent CLS
          const intrinsicWidth = (file.metadata as any)?.imageWidth || (file as any).imageWidth || undefined;
          const intrinsicHeight = (file.metadata as any)?.imageHeight || (file as any).imageHeight || undefined;
          const aspectRatio = intrinsicWidth && intrinsicHeight ? intrinsicWidth / intrinsicHeight : 16 / 9;
          const primarySrc = useCdn ? cdnUrl(file.location, { w: 640 }) : file.location;
          const srcSetAttr = useCdn ? cdnSrcSet(file.location) : undefined;
          return (
            <img 
              src={primarySrc}
              srcSet={srcSetAttr}
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
                const img = e.currentTarget as HTMLImageElement;
                if (!cdnTriedRef.current && useCdn) {
                  cdnTriedRef.current = true;
                  img.src = file.location; // fallback to original
                  img.srcset = '';
                  return;
                }
                setFailed(true);
                img.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==';
                img.srcset = '';
              }}
              referrerPolicy="no-referrer"
            />
          );
        }
      } 
      
      if (isVideoFile(file.fileExtension) || file.mediaType?.includes('Video')) {
        if (file.metadata && typeof file.metadata.v_thumbnail === 'string') {
          // Build a stable URL (avoid Date.now() which causes re-fetch loops)
          const timestamp = (file.metadata as any)?.v_thumbnailTimestamp as number | undefined;
          const thumbnailUrl = file.metadata.v_thumbnail.split('?')[0];
          const thumbnailWithCacheBuster = `${thumbnailUrl}?${timestamp ? `t=${timestamp}&` : ''}id=${file.id || ''}`;
          const intrinsicWidth = (file.metadata as any)?.imageWidth || undefined;
          const intrinsicHeight = (file.metadata as any)?.imageHeight || undefined;
          const aspectRatio = intrinsicWidth && intrinsicHeight ? intrinsicWidth / intrinsicHeight : 16 / 9;
          const primarySrc = cdnUrl(thumbnailWithCacheBuster, { w: 640 });
          return (
            <img 
              src={primarySrc}
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
                const img = e.currentTarget as HTMLImageElement;
                if (!cdnTriedRef.current) {
                  cdnTriedRef.current = true;
                  img.src = thumbnailWithCacheBuster; // fallback to original URL
                  img.srcset = '';
                  return;
                }
                setFailed(true);
                img.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==';
                img.srcset = '';
              }}
              referrerPolicy="no-referrer"
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