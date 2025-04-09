import React from 'react';
import { 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogActions, 
  Button, 
  Typography, 
  Alert, 
  AlertTitle,
  Box 
} from '@mui/material';
import { FaExclamationTriangle } from 'react-icons/fa';
import { MediaType } from '../store/slices/mediaTypeSlice';

interface MediaTypeWarningDialogProps {
  open: boolean;
  onClose: () => void;
  mediaType: MediaType | null;
  action: 'delete' | 'edit';
  affectedCount: number;
  onConfirm: () => void;
  onCancel: () => void;
}

const MediaTypeWarningDialog: React.FC<MediaTypeWarningDialogProps> = ({
  open,
  onClose,
  mediaType,
  action,
  affectedCount,
  onConfirm,
  onCancel
}) => {
  const isDeleteAction = action === 'delete';
  const isEditAction = action === 'edit';
  const hasAffectedFiles = affectedCount > 0;

  if (!mediaType) return null;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      aria-labelledby="warning-dialog-title"
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle id="warning-dialog-title" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <FaExclamationTriangle color="#f57c00" />
        <Typography component="span">
          {hasAffectedFiles 
            ? `Warning: Media Type In Use` 
            : `Confirm ${isDeleteAction ? 'Deletion' : 'Edit'}`}
        </Typography>
      </DialogTitle>
      
      <DialogContent>
        {hasAffectedFiles ? (
          <>
            <Alert severity="warning" sx={{ mb: 2 }}>
              <AlertTitle>This Media Type Has Linked Files</AlertTitle>
              <Typography variant="body2">
                <strong>{mediaType.name}</strong> is currently used by {affectedCount} media file{affectedCount !== 1 ? 's' : ''}.
              </Typography>
            </Alert>
            
            {isDeleteAction && (
              <Box sx={{ mt: 2 }}>
                <Typography variant="body1">
                  You cannot permanently delete a media type that is in use. Instead, you can:
                </Typography>
                <ul>
                  <li>Archive the media type (prevents new uploads but keeps existing files working)</li>
                  <li>Migrate files to another media type before deleting</li>
                </ul>
              </Box>
            )}
            
            {isEditAction && (
              <Box sx={{ mt: 2 }}>
                <Typography variant="body1">
                  You cannot modify the fields of a media type that is in use. This would break existing files.
                </Typography>
                <Typography variant="body1" sx={{ mt: 1 }}>
                  You can only update the accepted file types for this media type.
                </Typography>
              </Box>
            )}
          </>
        ) : (
          <Typography variant="body1">
            Are you sure you want to {isDeleteAction ? 'delete' : 'edit'} the media type <strong>{mediaType.name}</strong>?
            {isDeleteAction && ' This action cannot be undone.'}
          </Typography>
        )}
      </DialogContent>
      
      <DialogActions>
        <Button onClick={onCancel}>Cancel</Button>
        
        {hasAffectedFiles ? (
          isDeleteAction ? (
            <Button color="warning" onClick={onConfirm}>
              Archive Instead
            </Button>
          ) : (
            <Button color="primary" onClick={onConfirm}>
              Update File Types Only
            </Button>
          )
        ) : (
          <Button 
            color={isDeleteAction ? "error" : "primary"} 
            onClick={onConfirm}
            autoFocus
          >
            {isDeleteAction ? 'Delete' : 'Edit'} Media Type
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default MediaTypeWarningDialog; 