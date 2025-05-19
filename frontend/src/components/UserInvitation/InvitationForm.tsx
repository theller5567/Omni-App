import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  TextField, 
  Button, 
  FormControl,
  FormHelperText,
  InputLabel, 
  MenuItem, 
  Select,
  Paper,
  CircularProgress,
  Collapse,
  Alert,
  IconButton
} from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';
import { useUserProfile, useSendInvitation, InvitationData } from '../../hooks/query-hooks';

interface InvitationFormProps {
  onInvitationSent?: () => void;
}

const InvitationForm: React.FC<InvitationFormProps> = ({ onInvitationSent }) => {
  const { data: userProfile } = useUserProfile();
  const { mutate: sendInvitationMutate, isPending: isLoadingInvitation, error: invitationErrorHook } = useSendInvitation();

  const [formData, setFormData] = useState({
    email: '',
    firstName: '',
    lastName: '',
    role: 'user',
    message: ''
  });
  
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  useEffect(() => {
    if (invitationErrorHook) {
      const message =
        (invitationErrorHook as any).response?.data?.message ||
        (invitationErrorHook as any).message ||
        'Failed to send invitation. Please try again.';
      setError(message);
    } else {
      setError(null);
    }
  }, [invitationErrorHook]);
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | any) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };
  
  const resetMessages = () => {
    setError(null);
    setSuccess(null);
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    resetMessages();
    
    if (!formData.email || !formData.firstName || !formData.lastName) {
      setError('Email, first name, and last name are required');
      return;
    }
    
    if (!validateEmail(formData.email)) {
      setError('Please enter a valid email address');
      return;
    }

    if (!userProfile?._id) {
      setError('Could not identify the current user. Please try logging in again.');
      return;
    }
    
    const invitationPayload: InvitationData = {
      ...formData,
      role: formData.role as InvitationData['role'],
      invitedBy: userProfile._id
    };
    
    sendInvitationMutate(invitationPayload, {
      onSuccess: (data) => {
        setSuccess(data.message || `Invitation sent to ${formData.email} successfully!`);
        setFormData({
          email: '',
          firstName: '',
          lastName: '',
          role: 'user',
          message: ''
        });
        if (onInvitationSent) {
          onInvitationSent();
        }
      },
      onError: (error: any) => {
        console.error('Error sending invitation from component callback:', error);
      }
    });
  };
  
  return (
    <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
      <Typography variant="h5" gutterBottom>
        Invite New User
      </Typography>
      
      <Typography variant="body2" color="text.secondary" paragraph>
        Send an email invitation to a new user to join Omni's Media Library.
      </Typography>
      
      <Collapse in={!!success}>
        <Alert 
          severity="success"
          action={
            <IconButton
              aria-label="close"
              color="inherit"
              size="small"
              onClick={() => setSuccess(null)}
            >
              <CloseIcon fontSize="inherit" />
            </IconButton>
          }
          sx={{ mb: 2 }}
        >
          {success}
        </Alert>
      </Collapse>
      
      <Collapse in={!!error}>
        <Alert 
          severity="error"
          action={
            <IconButton
              aria-label="close"
              color="inherit"
              size="small"
              onClick={() => setError(null)}
            >
              <CloseIcon fontSize="inherit" />
            </IconButton>
          }
          sx={{ mb: 2 }}
        >
          {error}
        </Alert>
      </Collapse>
      
      <Box component="form" onSubmit={handleSubmit} noValidate>
        <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
          <TextField
            name="firstName"
            label="First Name"
            value={formData.firstName}
            onChange={handleChange}
            fullWidth
            required
            autoFocus
            autoComplete="given-name"
            disabled={isLoadingInvitation}
          />
          
          <TextField
            name="lastName"
            label="Last Name"
            value={formData.lastName}
            onChange={handleChange}
            fullWidth
            required
            autoComplete="family-name"
            disabled={isLoadingInvitation}
          />
        </Box>
        <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
        <TextField
          name="email"
          label="Email Address"
          value={formData.email}
          onChange={handleChange}
          fullWidth
          required
          margin="normal"
          type="email"
          autoComplete="email"
          disabled={isLoadingInvitation}
        />
        
        <FormControl fullWidth margin="normal" disabled={isLoadingInvitation}>
          <InputLabel id="role-label">Role</InputLabel>
          <Select
            labelId="role-label"
            name="role"
            value={formData.role}
            onChange={handleChange}
            label="Role"
            disabled={isLoadingInvitation}
          >
            <MenuItem value="user">User</MenuItem>
            <MenuItem value="distributor">Distributor</MenuItem>
            <MenuItem value="admin">Admin</MenuItem>
          </Select>
          <FormHelperText>
            Select the role for the new user
          </FormHelperText>
        </FormControl>
        </Box>
        
        <TextField
          name="message"
          label="Personal Message (Optional)"
          value={formData.message}
          onChange={handleChange}
          fullWidth
          margin="normal"
          multiline
          rows={3}
          placeholder="Add a personal message to include in the invitation email"
          disabled={isLoadingInvitation}
        />
        
        <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
          <Button
            type="submit"
            variant="contained"
            color="primary"
            sx={{ minWidth: 120 }}
            disabled={isLoadingInvitation}
          >
            {isLoadingInvitation ? <CircularProgress size={24} sx={{ color: 'white'}} /> : 'Send Invitation'}
          </Button>
        </Box>
      </Box>
    </Paper>
  );
};

export default InvitationForm; 