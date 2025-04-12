import React, { useState, useContext } from 'react';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import axios from 'axios';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { 
  Box, 
  Button, 
  TextField, 
  Typography, 
  Avatar, 
  CircularProgress, 
  Paper, 
  Grid, 
  Divider,
  useMediaQuery,
  useTheme,
  Alert,
  Card,
  CardContent
} from '@mui/material';
import { motion } from 'framer-motion';
import { useSelector } from 'react-redux';
import { RootState } from '../store/store';
import EditIcon from '@mui/icons-material/Edit';
import SaveIcon from '@mui/icons-material/Save';
import PersonIcon from '@mui/icons-material/Person';
import LockIcon from '@mui/icons-material/Lock';
import BrushIcon from '@mui/icons-material/Brush';
import ThemeToggle from '../components/ThemeToggle/ThemeToggle';
import { ThemeContext } from '../App';

// Define a User interface if not already defined elsewhere
interface User {
  email: string;
  firstName: string;
  lastName: string;
  username: string;
  password?: string;
  avatar?: string | null;
}

const Account: React.FC = () => {
  const [loading, setLoading] = useState<boolean>(false);
  const [changesMade, setChangesMade] = useState<boolean>(false);
  const currentUser = useSelector((state: RootState) => state.user.currentUser);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const { isDarkMode, toggleTheme } = useContext(ThemeContext);

  const [initialValues] = useState<User>({
    email: currentUser.email,
    firstName: currentUser.firstName,
    lastName: currentUser.lastName,
    username: currentUser.username,
    password: '',
  });

  const formik = useFormik<User>({
    initialValues,
    enableReinitialize: true,
    validationSchema: Yup.object({
      email: Yup.string().email('Invalid email address').required('Email is required'),
      firstName: Yup.string().required('First Name is required'),
      lastName: Yup.string().required('Last Name is required'),
      username: Yup.string().required('Username is required'),
      password: Yup.string().min(6, 'Password must be at least 6 characters'),
    }),
    onSubmit: async (values) => {
      setLoading(true);
      try {
        const token = localStorage.getItem('authToken');
        if (!token) {
          throw new Error('No token found');
        }

        const updatedFields: Partial<User> = {};
        Object.keys(values).forEach((key) => {
          const value = values[key as keyof User];
          const initialValue = initialValues[key as keyof User];

          if (value !== initialValue && value !== '') {
            updatedFields[key as keyof User] = value ?? undefined;
          }
        });

        if (currentUser.avatar) {
          updatedFields.avatar = currentUser.avatar;
        }

        const response = await axios.put('/api/user/update', updatedFields, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        console.log(response, 'response');
        toast.success('Profile updated successfully');
        setChangesMade(false);
      } catch (error: any) {
        console.error('Error updating profile:', error);
        toast.error(error.response?.data?.message || 'An error occurred');
      } finally {
        setLoading(false);
      }
    },
  });

  // Track when form values change
  React.useEffect(() => {
    const hasChanged = 
      formik.values.email !== initialValues.email ||
      formik.values.firstName !== initialValues.firstName ||
      formik.values.lastName !== initialValues.lastName ||
      formik.values.username !== initialValues.username ||
      (formik.values.password !== initialValues.password && formik.values.password !== '');
    
    setChangesMade(hasChanged);
  }, [formik.values, initialValues]);

  // Generate initials for avatar if no image is available
  const getInitials = () => {
    const firstInitial = formik.values.firstName?.charAt(0) || '';
    const lastInitial = formik.values.lastName?.charAt(0) || '';
    return (firstInitial + lastInitial).toUpperCase();
  };

  return (
    <Box
      component={motion.div}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      sx={{
        width: '100%',
        maxWidth: '900px',
        margin: 'auto',
        padding: isMobile ? '1rem' : '2rem',
        marginTop: isMobile ? '1rem' : '2rem',
        marginBottom: isMobile ? '5rem' : '2rem',
      }}
    >
      <Paper 
        elevation={3}
        sx={{ 
          padding: isMobile ? '1.5rem 1rem' : '2rem',
          borderRadius: '12px',
          backgroundColor: 'var(--bg-secondary)',
          marginBottom: '2rem'
        }}
      >
        <Typography 
          variant={isMobile ? "h3" : "h2"} 
          align="center" 
          gutterBottom
          sx={{ 
            color: 'var(--accent-color)',
            fontWeight: 600,
            marginBottom: '1.5rem' 
          }}
        >
          Account Settings
        </Typography>

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
              width: 100, 
              height: 100,
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
                marginBottom: '0.5rem',
                textAlign: isMobile ? 'center' : 'left'
              }}
            >
              {`${currentUser.firstName} ${currentUser.lastName}`}
            </Typography>
            
            <Typography 
              variant="body1" 
              color="textSecondary" 
              sx={{ 
                marginBottom: '0.5rem',
                textAlign: isMobile ? 'center' : 'left'
              }}
            >
              @{currentUser.username}
            </Typography>
            
            <Typography 
              variant="body2" 
              color="textSecondary"
              sx={{ 
                textAlign: isMobile ? 'center' : 'left'
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
          <Grid container spacing={isMobile ? 2 : 3}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                id="firstName"
                name="firstName"
                label="First Name"
                value={formik.values.firstName}
                onChange={(e) => {
                  formik.handleChange(e);
                }}
                error={formik.touched.firstName && Boolean(formik.errors.firstName)}
                helperText={formik.touched.firstName && formik.errors.firstName}
                InputProps={{
                  startAdornment: <PersonIcon color="action" sx={{ mr: 1 }} />
                }}
                variant="outlined"
                sx={{ mb: 2 }}
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                id="lastName"
                name="lastName"
                label="Last Name"
                value={formik.values.lastName}
                onChange={formik.handleChange}
                error={formik.touched.lastName && Boolean(formik.errors.lastName)}
                helperText={formik.touched.lastName && formik.errors.lastName}
                InputProps={{
                  startAdornment: <PersonIcon color="action" sx={{ mr: 1 }} />
                }}
                variant="outlined"
                sx={{ mb: 2 }}
              />
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                fullWidth
                id="email"
                name="email"
                label="Email"
                value={formik.values.email}
                onChange={formik.handleChange}
                error={formik.touched.email && Boolean(formik.errors.email)}
                helperText={formik.touched.email && formik.errors.email}
                InputProps={{
                  startAdornment: <EditIcon color="action" sx={{ mr: 1 }} />
                }}
                variant="outlined"
                sx={{ mb: 2 }}
              />
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                fullWidth
                id="username"
                name="username"
                label="Username"
                value={formik.values.username}
                onChange={formik.handleChange}
                error={formik.touched.username && Boolean(formik.errors.username)}
                helperText={formik.touched.username && formik.errors.username}
                InputProps={{
                  startAdornment: <EditIcon color="action" sx={{ mr: 1 }} />
                }}
                variant="outlined"
                sx={{ mb: 2 }}
              />
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                fullWidth
                id="password"
                name="password"
                label="New Password (optional)"
                type="password"
                value={formik.values.password}
                onChange={formik.handleChange}
                error={formik.touched.password && Boolean(formik.errors.password)}
                helperText={formik.touched.password ? formik.errors.password : "Leave blank to keep current password"}
                InputProps={{
                  startAdornment: <LockIcon color="action" sx={{ mr: 1 }} />
                }}
                variant="outlined"
                sx={{ mb: 2 }}
              />
            </Grid>
          </Grid>

          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'center', 
            mt: 3 
          }}>
            <Button
              type="submit"
              variant="contained"
              color="primary"
              disabled={loading || !changesMade}
              size="large"
              startIcon={loading ? <CircularProgress size={20} /> : <SaveIcon />}
              sx={{ 
                minWidth: '200px',
                py: 1.5,
                borderRadius: '8px',
                boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                transition: 'transform 0.2s ease-in-out',
                '&:hover': {
                  transform: 'translateY(-3px)',
                  boxShadow: '0 6px 8px rgba(0,0,0,0.15)',
                },
                '&:disabled': {
                  backgroundColor: 'rgba(0,0,0,0.12)',
                }
              }}
            >
              {loading ? 'Saving...' : 'Save Changes'}
            </Button>
          </Box>
        </form>
      </Paper>

      {/* Theme Preferences Section */}
      <Paper 
        elevation={3}
        sx={{ 
          padding: isMobile ? '1.5rem 1rem' : '2rem',
          borderRadius: '12px',
          backgroundColor: 'var(--bg-secondary)',
        }}
      >
        <Typography 
          variant={isMobile ? "h4" : "h3"} 
          sx={{ 
            color: 'var(--accent-color)',
            fontWeight: 500,
            marginBottom: '1.5rem',
            display: 'flex',
            alignItems: 'center',
            gap: 1
          }}
        >
          <BrushIcon fontSize="inherit" />
          Appearance
        </Typography>

        <Card sx={{ mb: 2, p: 1 }}>
          <CardContent sx={{ p: 1 }}>
            <Box sx={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              flexDirection: isMobile ? 'column' : 'row', 
              gap: 2 
            }}>
              <Box>
                <Typography variant="h6">Theme</Typography>
                <Typography variant="body2" color="textSecondary">
                  Choose between light and dark mode
                </Typography>
              </Box>
              <ThemeToggle 
                theme={isDarkMode ? 'dark' : 'light'} 
                toggleTheme={toggleTheme} 
                showLabel={false}
              />
            </Box>
          </CardContent>
        </Card>

        <Typography variant="body2" color="textSecondary" sx={{ mt: 2, fontStyle: 'italic' }}>
          Your theme preference will be saved and applied across all pages.
        </Typography>
      </Paper>

      <ToastContainer position="bottom-right" />
    </Box>
  );
};

export default Account; 