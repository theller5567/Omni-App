import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  Button,
  FormControlLabel,
  Checkbox
} from '@mui/material';

interface DeleteConfirmationDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  hardDelete: boolean;
  setHardDelete: (value: boolean) => void;
  categoryName: string;
}

export const DeleteConfirmationDialog: React.FC<DeleteConfirmationDialogProps> = ({
  open,
  onClose,
  onConfirm,
  hardDelete,
  setHardDelete,
  categoryName
}) => {
  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>Delete Tag Category</DialogTitle>
      <DialogContent>
        <Typography>
          Are you sure you want to delete this tag category?
          {hardDelete 
            ? ' This action will permanently remove the category from the database and cannot be undone.'
            : ' This will mark the category as inactive. You can restore it later if needed.'
          }
        </Typography>
        {categoryName && (
          <Typography variant="subtitle1" sx={{ mt: 2, fontWeight: 'bold' }}>
            {categoryName}
          </Typography>
        )}
        
        <FormControlLabel
          control={
            <Checkbox
              checked={hardDelete}
              onChange={(e) => setHardDelete(e.target.checked)}
              color="warning"
            />
          }
          label={
            <Typography color="warning.main">
              Permanently delete from database (not recommended)
            </Typography>
          }
          sx={{ mt: 2, display: 'block' }}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button 
          onClick={onConfirm} 
          color={hardDelete ? "warning" : "error"} 
          variant="contained"
        >
          {hardDelete ? 'Permanently Delete' : 'Delete'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}; 