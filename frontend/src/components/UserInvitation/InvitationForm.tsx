import React, { useState } from 'react';
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
import axios from 'axios';
import { API_BASE_URL } from '../../config/config';
import { useSelector } from 'react-redux';
import { RootState } from '../../store/store';

interface InvitationFormProps {
  onInvitationSent?: () => void;
}

const InvitationForm: React.FC<InvitationFormProps> = ({ onInvitationSent }) => {
  // Get current user from Redux store
  const currentUser = useSelector((state: RootState) => state.user.currentUser);

  // Form state
  const [formData, setFormData] = useState({
    email: '',
    firstName: '',
    lastName: '',
    role: 'user',
    message: ''
  });
  
  // UI state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | any) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const validateEmail = (email: string): boolean => {
    // Basic email validation regex
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };
  
  const resetMessages = () => {
    setError(null);
    setSuccess(null);
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    resetMessages();
    
    // Validate form data
    if (!formData.email || !formData.firstName || !formData.lastName) {
      setError('Email, first name, and last name are required');
      return;
    }
    
    if (!validateEmail(formData.email)) {
      setError('Please enter a valid email address');
      return;
    }
    
    try {
      setLoading(true);
      
      // Get token from localStorage
      const token = localStorage.getItem('authToken');
      
      if (!token) {
        setError('You must be logged in to send invitations');
        setLoading(false);
        return;
      }
      
      // Add the invitedBy field to the request - important: use the current user's id
      const userId = currentUser.id || currentUser._id;
      console.log('Current user for invitation:', currentUser);
      console.log('Using userId for invitedBy:', userId);
      
      const invitationData = {
        ...formData,
        invitedBy: userId
      };
      
      console.log('Sending invitation with data:', invitationData);
      
      // Send the invitation
      const response = await axios.post(
        `${API_BASE_URL}/api/invitations`,
        invitationData,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      
      console.log('Invitation response:', response.data);
      
      setSuccess(`Invitation sent to ${formData.email} successfully!`);
      
      // Reset form
      setFormData({
        email: '',
        firstName: '',
        lastName: '',
        role: 'user',
        message: ''
      });
      
      // Notify parent component if callback provided
      if (onInvitationSent) {
        onInvitationSent();
      }
      
    } catch (err: any) {
      console.error('Error sending invitation:', err);
      
      // If we have a response with an error message
      if (err.response?.data?.message) {
        setError(err.response.data.message);
      } 
      // If we have a generic axios error message
      else if (err.message) {
        setError(`Error: ${err.message}`);
      }
      // Fallback error message
      else {
        setError('An error occurred while sending the invitation. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
      <Typography variant="h5" gutterBottom>
        Invite New User
      </Typography>
      
      <Typography variant="body2" color="text.secondary" paragraph>
        Send an email invitation to a new user to join Omni's Media Library.
      </Typography>
      
      {/* Success message */}
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
      
      {/* Error message */}
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
          />
          
          <TextField
            name="lastName"
            label="Last Name"
            value={formData.lastName}
            onChange={handleChange}
            fullWidth
            required
            autoComplete="family-name"
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
        />
        
        <FormControl fullWidth margin="normal">
          <InputLabel id="role-label">Role</InputLabel>
          <Select
            labelId="role-label"
            name="role"
            value={formData.role}
            onChange={handleChange}
            label="Role"
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
        />
        
        <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
          <Button
            type="submit"
            variant="contained"
            color="primary"
            disabled={loading}
            sx={{ minWidth: 120 }}
          >
            {loading ? <CircularProgress size={24} /> : 'Send Invitation'}
          </Button>
        </Box>
      </Box>
    </Paper>
  );
};

export default InvitationForm; 