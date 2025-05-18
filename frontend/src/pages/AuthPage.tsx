// cSpell:ignore Toastify

import React, { useState, useEffect } from 'react';
import { TextField, Button, Typography, Box, CircularProgress, Container, Alert, Grid, Link } from '@mui/material';
import { useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useLogin, useRegister } from '../hooks/query-hooks'; // Import TanStack Query hooks

const AuthPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isSignUp, setIsSignUp] = useState(false);
  const [formData, setFormData] = useState({ firstName: '', lastName: '', email: '', password: '' });
  const [showForm, setShowForm] = useState(true);
  const [emailVerified, setEmailVerified] = useState(false);

  // Instantiate mutation hooks
  const { mutate: loginMutate, isPending: isPendingLogin, error: loginError } = useLogin();
  const { mutate: registerMutate, isPending: isPendingRegister, error: registerError } = useRegister();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const verified = params.get('emailVerified');
    
    if (verified === 'true') {
      setEmailVerified(true);
      setIsSignUp(false); 
      toast.success('Your email has been successfully verified!');
    }
  }, [location]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (isSignUp) {
      registerMutate({
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        username: formData.email, // Assuming username is email as before
        password: formData.password, // Use actual password for sign up now
      }, {
        onSuccess: () => {
          setShowForm(false); // Keep this specific UI logic
          // Toast for success is handled by useRegister hook
        },
        onError: () => {
          // Toast for error is handled by useRegister hook
        }
      });
    } else {
      loginMutate({ 
        email: formData.email, 
        password: formData.password 
      }, {
        onSuccess: (data) => {
          // data here is AuthResponse. Token is stored by loginUser API function.
          // User profile cache is updated by useLogin hook.
          // Toast for success is handled by useLogin hook.
          navigate('/media-library'); 
        },
        onError: () => {
          // Toast for error is handled by useLogin hook
        }
      });
    }
  };
  
  const overallIsLoading = isPendingLogin || isPendingRegister;
  const currentError = isSignUp ? registerError : loginError;

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

        {emailVerified && !isSignUp && (
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
              onClick={() => {
                setIsSignUp(false); // Switch to sign-in
                setShowForm(true);
              }}
              sx={{ mt: 2 }}
            >
              Go to Sign In
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
              {/* Show password field for both sign-up and sign-in if isSignUp is true, or if it's sign-in mode*/}
              {(isSignUp || !isSignUp) && (
                <TextField
                  margin="normal"
                  required
                  fullWidth
                  name="password"
                  label="Password"
                  type="password"
                  id="password"
                  autoComplete={isSignUp ? "new-password" : "current-password"}
                  value={formData.password}
                  onChange={handleChange}
                />
              )}
              <Button
                type="submit"
                fullWidth
                variant="contained"
                sx={{ mt: 3, mb: 2 }}
                disabled={overallIsLoading}
              >
                {overallIsLoading ? (
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

        {/* Errors are handled by react-toastify via the hooks, so these general Alert components can be removed */}
        {/* {currentError && (
          <Alert severity="error" sx={{ mt: 2, width: '100%' }}>
            {currentError.message}
          </Alert>
        )} */}
      </Box>
    </Container>
  );
};

export default AuthPage;