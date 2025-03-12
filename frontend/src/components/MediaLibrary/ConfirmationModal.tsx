import React, { useEffect, useState } from 'react';
import { Modal, Box, Typography, Button, TextField } from '@mui/material';

interface ConfirmationModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({ open, onClose, onConfirm }) => {
  const [inputValue, setInputValue] = useState('');

  useEffect(() => {
    if (!open) {
      setInputValue(''); // Reset input value when modal is closed
    }
  }, [open]);

  const handleConfirm = () => {
    if (inputValue === 'DELETE') {
      onConfirm();
      onClose();
      setInputValue('');
    }
  };

  return (
    <Modal className="confirmation-modal" open={open} onClose={onClose}>
      <Box className="confirmation-modal-box" sx={{ p: 4, bgcolor: 'background.paper', borderRadius: 1, boxShadow: 24 }}>
        <Typography variant="h6" gutterBottom>
          Are you sure you want to delete this file?
        </Typography>
        <Typography variant="body2" gutterBottom>
          Type "DELETE" to confirm.
        </Typography>
        <TextField
          fullWidth
          variant="outlined"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder="Type DELETE to confirm"
        />
        <Box mt={2} display="flex" justifyContent="flex-end">
          <Button onClick={onClose} color="primary">
            Cancel
          </Button>
          <Button onClick={handleConfirm} color="error" variant="contained" sx={{ ml: 2 }}>
            Submit
          </Button>
        </Box>
      </Box>
    </Modal>
  );
};

export default ConfirmationModal;