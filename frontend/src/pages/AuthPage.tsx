// cSpell:ignore Toastify

import React, { useState } from 'react';
import { TextField, Button, Typography, Box, Paper, CircularProgress } from '@mui/material';
import { useDispatch, useSelector } from 'react-redux';
import { registerUser, loginUser } from '../store/slices/authSlice';
import { RootState } from '../store/store';
import { useNavigate } from 'react-router-dom';
import { AppDispatch } from '../store/store';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { setUser } from '../store/slices/userSlice';

const AuthPage: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const [isSignUp, setIsSignUp] = useState(false);
  const [formData, setFormData] = useState({ firstName: '', lastName: '', email: '', password: '' });
  const [showForm] = useState(true);

  const { loading, error, message } = useSelector((state: RootState) => state.auth);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };


  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    console.log('Form Data:', formData);
    try {
      if (isSignUp) {
        const response = await dispatch(registerUser({ firstName: formData.firstName, lastName: formData.lastName, email: formData.email }));
        console.log('Registration response:', response);
        // Handle registration response if needed
      } else {
        const response = await dispatch(loginUser({ email: formData.email, password: formData.password }));
        if (response.payload && typeof response.payload === 'object' && 'token' in response.payload && 'user' in response.payload) {
          const { token, user } = response.payload as { token: string, user: any }; // Type assertion to specify the structure of response.payload
          localStorage.setItem('authToken', token); // Store token in localStorage
          dispatch(setUser(user)); // Update Redux store with user information
          console.log('User logged in successfully:', user);
          navigate('/media-library'); // Redirect to home or another page
        } else {
          console.error('Invalid login response:', response.payload);
        }
      }
    } catch (error) {
      console.error('Error during authentication:', error);
    }
  };

  
  const params = new URLSearchParams(window.location.search);
  const emailVerified = params.get('emailVerified');

  if (emailVerified) {
    toast.success('Your email has been successfully verified!');
    navigate('/home');
  }

  return (
    <Box display="flex" justifyContent="center" alignItems="center" height="100vh">
      <Paper elevation={3} sx={{ padding: 4, width: '400px' }}>
        {showForm ? (
          <>
            <Typography variant="h5" align="center" gutterBottom>
              {isSignUp ? 'Create an Account' : 'Sign In'}
            </Typography>
            <form onSubmit={handleSubmit}>
              {isSignUp && (
                <>
                  <TextField
                    fullWidth
                    label="First Name"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleChange}
                    margin="normal"
                    required
                  />
                  <TextField
                    fullWidth
                    label="Last Name"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleChange}
                    margin="normal"
                    required
                  />
                </>
              )}
              <TextField
                fullWidth
                label="Email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                margin="normal"
                required
              />
              {!isSignUp && (
                <TextField
                  fullWidth
                  label="Password"
                  name="password"
                  type="password"
                  value={formData.password}
                  onChange={handleChange}
                  margin="normal"
                  required
                />
              )}
              <Button
                variant="contained"
                color="primary"
                fullWidth
                type="submit"
                sx={{ marginTop: 2 }}
                disabled={loading}
              >
                {loading ? <CircularProgress size={24} color="inherit" /> : isSignUp ? 'Sign Up' : 'Sign In'}
              </Button>
            </form>
          </>
        ) : (
          <Box>
            <Typography variant="h6" align="center" gutterBottom>
              Check your email for the verification link!
            </Typography>
          </Box>
        )}

        {error && (
          <Typography variant="body2" color="error" align="center" sx={{ marginTop: 2 }}>
            {typeof error === 'string' ? error : (error as { message?: string }).message || 'An unexpected error occurred'}
          </Typography>
        )}

        {message && (
          <Typography variant="body2" color="success" align="center" sx={{ marginTop: 2 }}>
            {message}
          </Typography>
        )}

        <Box textAlign="center" marginTop={2}>
          <Typography
            component="button"
            onClick={() => setIsSignUp(!isSignUp)}
            sx={{ textDecoration: 'underline', cursor: 'pointer' }}
          >
            {isSignUp ? 'Already have an account? Sign In' : "Don't have an account? Sign Up"}
          </Typography>
        </Box>
      </Paper>

      <ToastContainer />
    </Box>
  );
};

export default AuthPage;