import React from 'react';
import { Card, CardContent, Typography, Box } from '@mui/material';
import '../MediaCard.scss';
import { isImageFile, isVideoFile, getFileIcon } from '../utils';
import { useSelector } from 'react-redux';
import { RootState } from '../../../store/store';

interface MediaCardProps {
  file: any;
  onClick: () => void;
}

const MediaCard: React.FC<MediaCardProps> = ({ file, onClick }) => {
  // Get media types to find the color
  const mediaTypes = useSelector((state: RootState) => state.mediaTypes.mediaTypes);
  
  // Find the media type color
  const mediaTypeColor = React.useMemo(() => {
    const mediaType = mediaTypes.find(type => type.name === file.mediaType);
    return mediaType?.catColor || '#4dabf5';
  }, [file.mediaType, mediaTypes]);

  const renderPreview = () => {
    if (isImageFile(file.fileExtension)) {
      return (
        <img 
          src={file.location} 
          alt={file.metadata?.fileName || file.title} 
          className="preview-image"
        />
      );
    } 
    
    if (isVideoFile(file.fileExtension) || file.mediaType?.includes('Video')) {
      if (file.metadata?.v_thumbnail) {
        return (
          <img 
            src={file.metadata.v_thumbnail} 
            alt={file.metadata?.fileName || file.title} 
            className="preview-image"
          />
        );
      }
    }
    
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
      onClick={onClick}
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
};

export default MediaCard; 