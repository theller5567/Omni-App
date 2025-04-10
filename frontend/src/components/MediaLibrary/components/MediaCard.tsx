import React from 'react';
import { Card, CardContent, Typography, Box } from '@mui/material';
import '../styles/MediaCard.scss';
import { isImageFile, isVideoFile, getFileIcon } from '../utils';

interface MediaCardProps {
  file: any;
  onClick: () => void;
}

const MediaCard: React.FC<MediaCardProps> = ({ file, onClick }) => {
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
      <div className="media-preview">
        {renderPreview()}
      </div>
      <CardContent className="media-info">
        <Typography variant="subtitle2" className="media-title" title={file.metadata?.fileName || file.title}>
          {file.metadata?.fileName || file.title}
        </Typography>
        <Box className="media-meta">
          <Typography variant="caption" className="media-type">
            {file.mediaType}
          </Typography>
          <Typography variant="caption" className="media-size">
            {file.fileExtension ? file.fileExtension.toUpperCase() : ''}
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
};

export default MediaCard; 