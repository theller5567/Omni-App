import React, { useState, useEffect } from 'react';
import { 
  Drawer, 
  Box, 
  Typography, 
  IconButton, 
  TextField,
  InputAdornment,
  CircularProgress,
  Card,
  CardMedia,
  CardContent,
  CardActionArea,
  Chip
} from '@mui/material';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '../../store/store';
import { initializeMedia } from '../../store/slices/mediaSlice';
import CloseIcon from '@mui/icons-material/Close';
import SearchIcon from '@mui/icons-material/Search';
import { BaseMediaFile } from '../../interfaces/MediaFile';
import { isImageFile, isVideoFile } from '../MediaLibrary/utils/fileUtils';
import './MediaPicker.scss';

interface MediaPickerProps {
  open: boolean;
  onClose: () => void;
  onSelect: (mediaFile: BaseMediaFile) => void;
  title?: string;
  excludeIds?: string[]; // IDs to exclude from selection
  filterMediaTypes?: string[]; // Media types to show
}

const MediaPicker: React.FC<MediaPickerProps> = ({
  open,
  onClose,
  onSelect,
  title = 'Select Media',
  excludeIds = [],
  filterMediaTypes = []
}) => {
  const dispatch = useDispatch<AppDispatch>();
  const mediaState = useSelector((state: RootState) => state.media);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Ensure media is loaded
  useEffect(() => {
    if (open && mediaState.status === 'idle') {
      dispatch(initializeMedia());
    }
  }, [open, mediaState.status, dispatch]);
  
  // Filter media based on search and exclude IDs
  const filteredMedia = mediaState.allMedia
    .filter(media => {
      // Exclude specified IDs
      if (excludeIds.includes(media._id || '') || excludeIds.includes(media.id || '')) {
        return false;
      }
      
      // Filter by media type if specified
      if (filterMediaTypes.length > 0 && !filterMediaTypes.includes(media.mediaType || '')) {
        return false;
      }
      
      // Apply search filter
      const searchTerms = searchQuery.toLowerCase().split(' ');
      const fileName = (media.metadata?.fileName || media.title || '').toLowerCase();
      const description = (media.metadata?.description || '').toLowerCase();
      const tags = (media.metadata?.tags || []).map(tag => tag.toLowerCase());
      
      return searchTerms.every(term => 
        fileName.includes(term) || 
        description.includes(term) || 
        tags.some(tag => tag.includes(term))
      );
    });
  
  // Handle media selection
  const handleSelect = (media: BaseMediaFile) => {
    onSelect(media);
    onClose();
  };
  
  // Render preview based on media type
  const renderPreview = (media: BaseMediaFile) => {
    // Handle images
    if (isImageFile(media.fileExtension || '')) {
      return (
        <CardMedia
          component="img"
          height="100"
          image={media.location}
          alt={media.metadata?.fileName || media.title || 'Image'}
          sx={{ objectFit: 'contain', backgroundColor: '#f0f0f0' }}
        />
      );
    }
    
    // Handle videos with thumbnail
    if (isVideoFile(media.fileExtension || '') && media.metadata?.v_thumbnail) {
      const thumbnailUrl = `${media.metadata.v_thumbnail}${media.metadata.v_thumbnail.includes('?') ? '&' : '?'}id=${media._id || media.id || ''}`;
      return (
        <CardMedia
          component="img"
          height="100"
          image={thumbnailUrl}
          alt={media.metadata?.fileName || media.title || 'Video'}
          sx={{ objectFit: 'contain', backgroundColor: '#000' }}
        />
      );
    }
    
    // Default preview (icon or text)
    return (
      <Box 
        sx={{ 
          height: 100, 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          backgroundColor: '#f0f0f0' 
        }}
      >
        <Typography variant="caption">
          {media.fileExtension?.toUpperCase() || 'FILE'}
        </Typography>
      </Box>
    );
  };
  
  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      className="media-picker-drawer"
      sx={{
        '& .MuiDrawer-paper': {
          width: { xs: '100%', sm: 400, md: 500 },
          maxWidth: '100%',
          p: 2
        }
      }}
    >
      <Box className="media-picker-header">
        <Typography variant="h6">{title}</Typography>
        <IconButton onClick={onClose} edge="end">
          <CloseIcon />
        </IconButton>
      </Box>
      
      <TextField
        fullWidth
        variant="outlined"
        placeholder="Search media..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        className="media-picker-search"
        sx={{ mb: 2 }}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon />
            </InputAdornment>
          )
        }}
      />
      
      {mediaState.status === 'loading' ? (
        <Box className="media-picker-loading">
          <CircularProgress />
        </Box>
      ) : mediaState.status === 'failed' ? (
        <Typography color="error" className="media-picker-error">
          Error loading media: {mediaState.error}
        </Typography>
      ) : (
        <Box className="media-picker-content">
          <div className="media-grid">
            {filteredMedia.length > 0 ? (
              filteredMedia.map((media) => (
                <div className="media-grid-item" key={media._id || media.id}>
                  <Card 
                    className="media-card"
                    sx={{ 
                      cursor: 'pointer',
                      transition: 'transform 0.2s',
                      '&:hover': {
                        transform: 'scale(1.03)',
                        boxShadow: 3
                      }
                    }}
                  >
                    <CardActionArea onClick={() => handleSelect(media)}>
                      {renderPreview(media)}
                      <CardContent sx={{ py: 1, px: 1 }}>
                        <Typography variant="caption" noWrap>
                          {media.metadata?.fileName || media.title || 'Untitled'}
                        </Typography>
                        <Box sx={{ mt: 0.5 }}>
                          <Chip 
                            label={media.mediaType} 
                            size="small"
                            className="media-chip"
                            sx={{ fontSize: '0.6rem', height: 16 }}
                          />
                        </Box>
                      </CardContent>
                    </CardActionArea>
                  </Card>
                </div>
              ))
            ) : (
              <div className="media-grid-empty">
                <Typography sx={{ p: 2, textAlign: 'center' }}>
                  No media found matching your search criteria.
                </Typography>
              </div>
            )}
          </div>
        </Box>
      )}
    </Drawer>
  );
};

export default MediaPicker; 