// cSpell:ignore Toastify

import React, { useState, useEffect } from 'react';
import { TextField, Button, Typography, Box, CircularProgress, Container, Alert, Grid, Link } from '@mui/material';
import ThreeBillboardParticles from '../components/ThreeBillboardParticles';
import { useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useLogin, useRegister, useUserProfile } from '../hooks/query-hooks'; // Import TanStack Query hooks

const AuthPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isSignUp, setIsSignUp] = useState(false);
  const [formData, setFormData] = useState({ firstName: '', lastName: '', email: '', password: '' });
  const [showForm, setShowForm] = useState(true);
  const [emailVerified, setEmailVerified] = useState(false);

  // Check if the user is already logged in
  const { data: userProfile, isSuccess } = useUserProfile();

  useEffect(() => {
    if (isSuccess && userProfile) {
      navigate('/media-library', { replace: true });
    }
  }, [isSuccess, userProfile, navigate]);

  // Instantiate mutation hooks
  const { mutate: loginMutate, isPending: isPendingLogin } = useLogin();
  const { mutate: registerMutate, isPending: isPendingRegister } = useRegister();

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
      // Registration does not include a password; it will be set after email verification
      registerMutate({
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        username: formData.email,
        password: '' as unknown as string, // placeholder ignored by backend
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
        onSuccess: (_data) => {
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

  return (
    <Box sx={{ position: 'relative', minHeight: '100vh' }}>
      {/* Background billboard particles */}
      <ThreeBillboardParticles count={700} baseSizePx={1.6} maxBoostPx={2.4} interactionRadius={7} />
      <Container 
        component="main" 
        maxWidth="xs" 
        sx={{ 
          position: 'relative',
          zIndex: 1,
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center', 
          justifyContent: 'center',
          minHeight: '100vh',
          padding: 3,
          
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
          backgroundColor: 'rgba(0,0,0,0.5)', // subtle glass effect over background
          //backdropFilter: 'blur(4px)'
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
              {/* Show password only for sign-in. For sign-up, password is set after email verification. */}
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
                sx={{ mt: 3, mb: 2, color: 'black' }}
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
    </Box>
  );
};

export default AuthPage;