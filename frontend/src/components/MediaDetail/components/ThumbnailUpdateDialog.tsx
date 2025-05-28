import React from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogTitle, 
  IconButton, 
  Box, 
  Typography,
  Tooltip
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import MediaDetailThumbnailSelector from '../../VideoThumbnailSelector/MediaDetailThumbnailSelector';
import { getProxiedVideoUrl } from '../../../utils/videoUtils';
import { MediaFile } from '../../../hooks/query-hooks';

interface ThumbnailUpdateDialogProps {
  open: boolean;
  onClose: () => void;
  mediaData: MediaFile;
  onThumbnailUpdate: (thumbnailUrl: string) => void;
}

const ThumbnailUpdateDialog: React.FC<ThumbnailUpdateDialogProps> = ({
  open,
  onClose,
  mediaData,
  onThumbnailUpdate
}) => {
  // Only show for video files
  const isVideo = mediaData?.fileExtension && 
    ['mp4', 'webm', 'mov', 'ogg'].includes(mediaData.fileExtension.toLowerCase());

  // Get the current thumbnail from media data
  const currentThumbnail = mediaData?.metadata?.v_thumbnail || '';

  const handleThumbnailUpdate = (thumbnailUrl: string) => {
    // Pass the update to the parent component
    onThumbnailUpdate(thumbnailUrl);
    
    // Don't close dialog automatically - let the user decide when to close
    // so they can make multiple updates if needed
  };

  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      maxWidth="md"
      fullWidth
      aria-labelledby="thumbnail-update-dialog-title"
    >
      <DialogTitle id="thumbnail-update-dialog-title" sx={{ mb: 0, pb: 1 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h6">
            Update Video Thumbnail
          </Typography>
          <Tooltip title="Close">
            <IconButton
              edge="end"
              color="inherit"
              onClick={onClose}
              aria-label="close"
              size="small"
            >
              <CloseIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </DialogTitle>
      
      <DialogContent dividers sx={{ p: 2 }}>
        {isVideo ? (
          <MediaDetailThumbnailSelector
            videoUrl={getProxiedVideoUrl(mediaData.location, mediaData._id)}
            mediaId={mediaData._id}
            currentThumbnail={currentThumbnail}
            onThumbnailUpdate={handleThumbnailUpdate}
            mediaData={mediaData}
            onClose={onClose}
          />
        ) : (
          <Box sx={{ py: 3, textAlign: 'center' }}>
            <Typography variant="body1" color="text.secondary">
              Thumbnail selection is only available for video files.
            </Typography>
          </Box>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default ThumbnailUpdateDialog; 