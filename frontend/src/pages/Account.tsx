import React, { useState, useContext, useEffect } from 'react';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { 
  Box, 
  Button, 
  TextField, 
  Typography, 
  Avatar, 
  CircularProgress, 
  Paper, 
  Divider,
  useMediaQuery,
  useTheme,
  Alert,
  Container,
  InputAdornment
} from '@mui/material';
import { motion } from 'framer-motion';
import SaveIcon from '@mui/icons-material/Save';
import PersonIcon from '@mui/icons-material/Person';
import LockIcon from '@mui/icons-material/Lock';
import EmailIcon from '@mui/icons-material/Email';
import BrushIcon from '@mui/icons-material/Brush';
import ThemeToggle from '../components/ThemeToggle/ThemeToggle';
import { ThemeContext } from '../contexts/ThemeContext';
import ViewModeToggle from '../components/ViewModeToggle/ViewModeToggle';
import { useUserProfile, useUpdateUserProfile, User as UserProfileType } from '../hooks/query-hooks';
import { Link as RouterLink } from 'react-router-dom';

// Define a User interface for form values (can be slightly different from UserProfileType if needed, e.g. password)
interface UserFormValues {
  email: string;
  firstName: string;
  lastName: string;
  username: string;
  password?: string; // Password is optional for update
  avatar?: string | null;
}

const Account: React.FC = () => {
  const [changesMade, setChangesMade] = useState<boolean>(false);
  
  const { data: currentUser, isLoading: isUserLoading, error: userError } = useUserProfile();
  const { mutate: updateUser, isPending: isUpdatingUser } = useUpdateUserProfile();

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const { isDarkMode, toggleTheme } = useContext(ThemeContext);

  // Initial values for Formik - will be updated by useEffect when currentUser loads
  const [initialFormValues, setInitialFormValues] = useState<UserFormValues>({
    email: '',
    firstName: '',
    lastName: '',
    username: '',
    password: '',
    avatar: ''
  });

  useEffect(() => {
    if (currentUser) {
      setInitialFormValues({
        email: currentUser.email || '',
        firstName: currentUser.firstName || '',
        lastName: currentUser.lastName || '',
        username: currentUser.username || '',
        password: '', // Password field should be empty initially for updates
        avatar: currentUser.avatar || ''
      });
    }
  }, [currentUser]);

  const formik = useFormik<UserFormValues>({
    initialValues: initialFormValues, // Use state for initialValues
    enableReinitialize: true, // Important to reinitialize form when initialFormValues change
    validationSchema: Yup.object({
      email: Yup.string().email('Invalid email address').required('Email is required'),
      firstName: Yup.string().required('First Name is required'),
      lastName: Yup.string().required('Last Name is required'),
      username: Yup.string().required('Username is required'),
      password: Yup.string().min(6, 'Password must be at least 6 characters').nullable(), // Allow empty for no change
    }),
    onSubmit: async (values) => {
      if (!currentUser?._id) {
        toast.error('User ID is missing, cannot update profile.');
        return;
      }
      try {
        const updatedFields: Partial<UserProfileType> = {};
        // Compare with initialFormValues loaded from currentUser, not formik.initialValues which might not be latest from API
        Object.keys(values).forEach((keyStr) => {
          const key = keyStr as keyof UserFormValues;
          const value = values[key];
          const initialValue = initialFormValues[key];

          if (key === 'password') {
            if (value) { // Only include password if a new one is entered
              (updatedFields as any)[key] = value;
            }
          } else if (value !== initialValue) {
            // Type assertion needed here if UserFormValues and UserProfileType keys differ significantly
            (updatedFields as any)[key] = value;
          }
        });

        if (Object.keys(updatedFields).length > 0) {
          updateUser({ _id: currentUser._id, ...updatedFields }, {
            onSuccess: () => {
              toast.success('Profile updated successfully');
              setChangesMade(false);
              // initialFormValues will be updated by useEffect due to cache update by useUpdateUserProfile
            },
            onError: (error: any) => {
              console.error('Error updating profile:', error);
              toast.error(error.response?.data?.message || error.message || 'An error occurred while updating.');
            }
          });
        } else {
          toast.info('No changes to save.');
        }

      } catch (error: any) { // Catch general errors if any before calling mutate
        console.error('Error preparing profile update:', error);
        toast.error('An unexpected error occurred.');
      }
    },
  });

  // Track when form values change compared to initial values from currentUser
  React.useEffect(() => {
    if (!currentUser) return;
    const hasChanged = 
      formik.values.email !== initialFormValues.email ||
      formik.values.firstName !== initialFormValues.firstName ||
      formik.values.lastName !== initialFormValues.lastName ||
      formik.values.username !== initialFormValues.username ||
      !!(formik.values.password && formik.values.password !== initialFormValues.password); // Only consider changed if new password entered
    
    setChangesMade(hasChanged);
  }, [formik.values, initialFormValues, currentUser]);

  // Generate initials for avatar if no image is available
  const getInitials = () => {
    if (!currentUser) return '';
    const firstInitial = currentUser.firstName?.charAt(0) || '';
    const lastInitial = currentUser.lastName?.charAt(0) || '';
    return (firstInitial + lastInitial).toUpperCase();
  };

  // Add state for the view mode
  const [preferredViewMode, setPreferredViewMode] = useState<'list' | 'card'>(() => {
    const stored = localStorage.getItem('mediaLibraryViewMode');
    return (stored === 'list' || stored === 'card') ? (stored as 'list' | 'card') : 'list';
  });
  
  // Add a function to handle view mode changes
  const handleViewModeChange = (newViewMode: 'list' | 'card') => {
    setPreferredViewMode(newViewMode);
    localStorage.setItem('mediaLibraryViewMode', newViewMode);
    toast.success(`Default view mode set to ${newViewMode === 'list' ? 'List' : 'Card'}`);
  };

  if (isUserLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="100vh">
        <CircularProgress />
        <Typography sx={{ml: 2}}>Loading account details...</Typography>
      </Box>
    );
  }

  if (userError) {
    return (
      <Box display="flex" flexDirection="column" justifyContent="center" alignItems="center" height="100vh">
        <Typography color="error">Error loading user profile: {userError.message}</Typography>
        <Button onClick={() => window.location.reload()} sx={{mt: 2}}>Try Reloading</Button>
      </Box>
    );
  }
  
  if (!currentUser) {
    return (
        <Box display="flex" flexDirection="column" justifyContent="center" alignItems="center" height="100vh">
            <Typography>User not found. You may need to log in.</Typography>
            <Button component={RouterLink} to="/" variant="contained" sx={{mt: 2}}>Go to Login</Button>
        </Box>
    );
  }

  return (
    <Container maxWidth="xl">
      <Box
        component={motion.div}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        sx={{
          padding: 2,
          width: '100%',
          margin: 'auto',
          maxWidth: '1200px'
        }}
      >
        <Typography 
          variant={isMobile ? "h3" : "h1"} 
          gutterBottom
          sx={{ 
            marginBottom: '1.5rem' 
          }}
        >
          Account Settings
        </Typography>

        <Paper 
          elevation={3}
          sx={{ 
            padding: isMobile ? '1.5rem 1rem' : '2rem',
            borderRadius: '12px',
            backgroundColor: 'var(--bg-secondary)',
            marginBottom: '2rem'
          }}
        >
          <Box 
            sx={{ 
              display: 'flex', 
              flexDirection: isMobile ? 'column' : 'row',
              alignItems: 'center',
              justifyContent: isMobile ? 'center' : 'flex-start',
              mb: 4,
              gap: 3
            }}
          >
            <Avatar
              src={currentUser.avatar || undefined}
              sx={{ 
                width: 75, 
                height: 75,
                fontSize: '2.5rem',
                bgcolor: 'var(--accent-color)',
                border: '3px solid var(--primary-color)',
                boxShadow: '0 4px 8px rgba(0,0,0,0.2)'
              }}
            >
              {!currentUser.avatar && getInitials()}
            </Avatar>
            
            <Box>
              <Typography 
                variant="h4" 
                sx={{ 
                  fontWeight: 500, 
                  marginBottom: '0.2rem',
                  textAlign: isMobile ? 'center' : 'left'
                }}
              >
                {`${currentUser.firstName} ${currentUser.lastName}`}
              </Typography>
              
              <Typography 
                variant="body1" 
                color="textSecondary" 
                sx={{ 
                  marginBottom: '0.2rem',
                  paddingLeft: '0.5rem',
                  textAlign: isMobile ? 'center' : 'left'
                }}
              >
                @{currentUser.username}
              </Typography>
              
              <Typography 
                variant="body2" 
                color="textSecondary"
                sx={{ 
                  textAlign: isMobile ? 'center' : 'left',
                  paddingLeft: '0.5rem',
                }}
              >
                Role: {currentUser.role || 'User'}
              </Typography>
            </Box>
          </Box>

          <Divider sx={{ marginBottom: 3 }} />

          {changesMade && (
            <Alert 
              severity="info" 
              sx={{ mb: 3 }}
            >
              You have unsaved changes. Click Save Changes to update your profile.
            </Alert>
          )}

          <form onSubmit={formik.handleSubmit}>
            <Box sx={{ 
              display: 'grid', 
              gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)', 
              gap: isMobile ? 2 : 3,
              marginBottom: 3
            }}>
              <TextField
                fullWidth
                id="firstName"
                name="firstName"
                label="First Name"
                value={formik.values.firstName}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.touched.firstName && Boolean(formik.errors.firstName)}
                helperText={formik.touched.firstName && formik.errors.firstName}
                variant="outlined"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <PersonIcon />
                    </InputAdornment>
                  ),
                }}
              />
              <TextField
                fullWidth
                id="lastName"
                name="lastName"
                label="Last Name"
                value={formik.values.lastName}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.touched.lastName && Boolean(formik.errors.lastName)}
                helperText={formik.touched.lastName && formik.errors.lastName}
                variant="outlined"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <PersonIcon />
                    </InputAdornment>
                  ),
                }}
              />
              <TextField
                fullWidth
                id="username"
                name="username"
                label="Username"
                value={formik.values.username}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.touched.username && Boolean(formik.errors.username)}
                helperText={formik.touched.username && formik.errors.username}
                variant="outlined"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <PersonIcon />
                    </InputAdornment>
                  ),
                }}
              />
              <TextField
                fullWidth
                id="email"
                name="email"
                label="Email"
                type="email"
                value={formik.values.email}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.touched.email && Boolean(formik.errors.email)}
                helperText={formik.touched.email && formik.errors.email}
                variant="outlined"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <EmailIcon />
                    </InputAdornment>
                  ),
                }}
              />
              <TextField
                fullWidth
                id="password"
                name="password"
                label="New Password (leave blank to keep current)"
                type="password"
                value={formik.values.password}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.touched.password && Boolean(formik.errors.password)}
                helperText={formik.touched.password && formik.errors.password}
                variant="outlined"
                autoComplete="new-password"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <LockIcon />
                    </InputAdornment>
                  ),
                }}
              />
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
              <Button 
                type="submit" 
                variant="contained" 
                color="primary" 
                disabled={isUpdatingUser || !changesMade}
                startIcon={isUpdatingUser ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />}
              >
                {isUpdatingUser ? 'Saving...' : 'Save Changes'}
              </Button>
            </Box>
          </form>
          <Divider sx={{ mb: 6, mt: 6 }} />
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, paddingLeft: '1rem' }}>
          <Typography variant="h4" sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
            <BrushIcon sx={{ mr: 1, color: 'var(--accent-color)' }} /> Appearance Settings
          </Typography>
          
          <Box sx={{ display: 'flex', flexDirection: 'column', maxWidth: '300px', gap: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="body1">Color Theme</Typography>
              <ThemeToggle theme={isDarkMode ? 'dark' : 'light'} toggleTheme={toggleTheme} />
            </Box>
            
            <Divider />
            
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="body1">Default View Mode</Typography>
              <ViewModeToggle 
                viewMode={preferredViewMode}
                toggleViewMode={handleViewModeChange}
              />
            </Box>
          </Box>
          </Box>
        </Paper>

        {/* <ToastContainer position={isMobile ? "bottom-center" : "top-right"} autoClose={3000} /> */}
      </Box>
    </Container>
  );
};

export default Account; 