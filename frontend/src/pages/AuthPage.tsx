// cSpell:ignore Toastify

import React, { useState, useEffect } from 'react';
import { TextField, Button, Typography, Box, CircularProgress, Container, Alert, Grid, Link } from '@mui/material';
import { useDispatch, useSelector } from 'react-redux';
import { register, login } from '../store/slices/authSlice';
import { RootState } from '../store/store';
import { useLocation, useNavigate } from 'react-router-dom';
import { AppDispatch } from '../store/store';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { setUser } from '../store/slices/userSlice';

const AuthPage: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const location = useLocation();
  const [isSignUp, setIsSignUp] = useState(false);
  const [formData, setFormData] = useState({ firstName: '', lastName: '', email: '', password: '' });
  const [showForm, setShowForm] = useState(true);
  const [emailVerified, setEmailVerified] = useState(false);

  const { error, message } = useSelector((state: RootState) => state.auth);
  const loading = useSelector((state: RootState) => state.auth.isLoading);

  useEffect(() => {
    // Check for verification parameters in URL
    const params = new URLSearchParams(location.search);
    const verified = params.get('emailVerified');
    
    if (verified === 'true') {
      setEmailVerified(true);
      setIsSignUp(false); // Switch to sign in form
      toast.success('Your email has been successfully verified!');
    }
  }, [location]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      if (isSignUp) {
        await dispatch(register({ 
          firstName: formData.firstName, 
          lastName: formData.lastName, 
          email: formData.email,
          username: formData.email,
          password: "temporary123" // Temporary password for email registration flow
        }));
        // After successful registration, hide the form and show the email verification message
        setShowForm(false);
      } else {
        const response = await dispatch(login({ email: formData.email, password: formData.password }));
        if (response.payload && typeof response.payload === 'object' && 'token' in response.payload && 'user' in response.payload) {
          const { token, user } = response.payload as { token: string, user: any }; // Type assertion to specify the structure of response.payload
          localStorage.setItem('authToken', token); // Store token in localStorage
          dispatch(setUser(user)); // Update Redux store with user information
          navigate('/media-library'); // Redirect to home or another page
        } else {
          console.error('Invalid login response:', response.payload);
        }
      }
    } catch (error) {
      console.error('Error during authentication:', error);
    }
  };
  
  return (
    <Container 
      component="main" 
      maxWidth="xs" 
      sx={{ 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center', 
        justifyContent: 'center',
        minHeight: '100vh',
        padding: 3
      }}
    >
      <Box
        sx={{
          padding: 3,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          borderRadius: 2,
          boxShadow: 3,
          width: '100%',
        }}
      >
        <Typography component="h1" variant="h5" sx={{ mb: 3 }}>
          {isSignUp ? 'Create Account' : 'Sign In'}
        </Typography>

        {emailVerified && (
          <Alert severity="success" sx={{ mb: 2, width: '100%' }}>
            Email verified successfully! You can now sign in.
          </Alert>
        )}

        {!showForm && isSignUp && (
          <Box sx={{ mt: 2, width: '100%', textAlign: 'center' }}>
            <Alert severity="info" sx={{ mb: 2 }}>
              Verification email sent! Please check your inbox to complete registration.
            </Alert>
            <Button
              fullWidth
              variant="outlined"
              onClick={() => setShowForm(true)}
              sx={{ mt: 2 }}
            >
              Back to Sign In
            </Button>
          </Box>
        )}

        {showForm && (
          <>
            <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1, width: '100%' }}>
              {isSignUp && (
                <>
                  <TextField
                    margin="normal"
                    required
                    fullWidth
                    id="firstName"
                    label="First Name"
                    name="firstName"
                    autoComplete="given-name"
                    value={formData.firstName}
                    onChange={handleChange}
                  />
                  <TextField
                    margin="normal"
                    required
                    fullWidth
                    id="lastName"
                    label="Last Name"
                    name="lastName"
                    autoComplete="family-name"
                    value={formData.lastName}
                    onChange={handleChange}
                  />
                </>
              )}
              <TextField
                margin="normal"
                required
                fullWidth
                id="email"
                label="Email Address"
                name="email"
                autoComplete="email"
                value={formData.email}
                onChange={handleChange}
              />
              {!isSignUp && (
                <TextField
                  margin="normal"
                  required
                  fullWidth
                  name="password"
                  label="Password"
                  type="password"
                  id="password"
                  autoComplete="current-password"
                  value={formData.password}
                  onChange={handleChange}
                />
              )}
              <Button
                type="submit"
                fullWidth
                variant="contained"
                sx={{ mt: 3, mb: 2 }}
                disabled={loading}
              >
                {loading ? (
                  <CircularProgress size={24} />
                ) : isSignUp ? (
                  'Sign Up'
                ) : (
                  'Sign In'
                )}
              </Button>
              <Grid container justifyContent="center">
                <div style={{ display: 'grid', gridTemplateColumns: '1fr', justifyItems: 'center' }}>
                  <Link 
                    component="button" 
                    variant="body2" 
                    onClick={() => {
                      setIsSignUp(!isSignUp);
                      setFormData({ firstName: '', lastName: '', email: '', password: '' });
                    }}
                  >
                    {isSignUp
                      ? 'Already have an account? Sign In'
                      : "Don't have an account? Sign Up"}
                  </Link>
                </div>
              </Grid>
            </Box>
          </>
        )}

        {error && (
          <Alert severity="error" sx={{ mt: 2, width: '100%' }}>
            {error}
          </Alert>
        )}
        
        {message && (
          <Alert severity="success" sx={{ mt: 2, width: '100%' }}>
            {message}
          </Alert>
        )}
      </Box>
    </Container>
  );
};

export default AuthPage;