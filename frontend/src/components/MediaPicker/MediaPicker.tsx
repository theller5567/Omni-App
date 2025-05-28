import React, { useState } from 'react';
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
import CloseIcon from '@mui/icons-material/Close';
import SearchIcon from '@mui/icons-material/Search';
import { 
  useUserProfile, 
  useTransformedMedia, 
  TransformedMediaFile
} from '../../hooks/query-hooks';
import { isImageFile, isVideoFile } from '../MediaLibrary/utils/fileUtils';
import './MediaPicker.scss';

interface MediaPickerProps {
  open: boolean;
  onClose: () => void;
  onSelect: (mediaFile: TransformedMediaFile) => void;
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
  const [searchQuery, setSearchQuery] = useState('');

  const { data: userProfile } = useUserProfile();
  const { 
    data: allMedia = [],
    isLoading: isMediaLoading,
    isError: isMediaError,
    error: mediaFetchError
  } = useTransformedMedia(userProfile);

  // Filter media based on search and exclude IDs
  const filteredMedia = allMedia
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
      const searchableText = (
        media.displayTitle +
        (media.metadata?.description || '') +
        (media.metadata?.tags || []).join(' ')
      ).toLowerCase();
      
      return searchTerms.every(term => searchableText.includes(term));
    });
  
  // Handle media selection
  const handleSelect = (media: TransformedMediaFile) => {
    onSelect(media);
    onClose();
  };
  
  // Render preview based on media type
  const renderPreview = (media: TransformedMediaFile) => {
    // Handle images
    const extension = media.fileExtension || media.metadata?.fileExtension || '';
    if (isImageFile(extension)) {
      return (
        <CardMedia
          component="img"
          height="100"
          image={media.thumbnailUrl || media.location}
          alt={media.displayTitle}
          sx={{ objectFit: 'contain', backgroundColor: '#f0f0f0' }}
        />
      );
    }
    
    // Handle videos with thumbnail
    if (isVideoFile(extension) && media.thumbnailUrl) {
      return (
        <CardMedia
          component="img"
          height="100"
          image={media.thumbnailUrl}
          alt={media.displayTitle}
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
          {extension.toUpperCase() || 'FILE'}
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
      
      {isMediaLoading ? (
        <Box className="media-picker-loading">
          <CircularProgress />
        </Box>
      ) : isMediaError ? (
        <Typography color="error" className="media-picker-error">
          Error loading media: {mediaFetchError?.message || 'Unknown error'}
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
                          {media.displayTitle}
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