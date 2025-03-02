// cSpell:ignore Toastify

import React, { useState } from 'react';
import { TextField, Button, Typography, Box, Paper, CircularProgress } from '@mui/material';
import { useDispatch, useSelector } from 'react-redux';
import { signUpUser } from '../store/slices/authSlice';
import { RootState } from '../store/store';
import { useNavigate } from 'react-router-dom';
import { AppDispatch } from '../store/store';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import axios from 'axios';

interface LoginResponse {
  token: string;
  // Add other fields if necessary
}

const AuthPage: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const [isSignUp, setIsSignUp] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '', password: '' });
  const [showForm, setShowForm] = useState(true);

  const { loading, error } = useSelector((state: RootState) => state.auth);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    console.log('handleSubmit:', 'TESTING!!!!');
    e.preventDefault();
    if (isSignUp) {
      dispatch(signUpUser({ name: formData.name, email: formData.email }))
        .unwrap()
        .then((response) => {
          console.log('Test:', response);
          setShowForm(false);
          toast.success('Check your email for the verification link!');
        })
        .catch((err) => {
          console.error('Sign up failed:', err);
        });
    } else {
      // Handle sign-in logic
      handleLogin();
    }
  };

  const handleLogin = async () => {
    try {
      const response = await axios.post<LoginResponse>('/api/auth/login', { email: formData.email, password: formData.password });
      console.log('Login successful:', response.data);
      const token = response.data.token;
      console.log('Token received:', token);
      localStorage.setItem('authToken', token);
      toast.success('Logged in successfully');
      navigate('/home');
    } catch (error) {
      if (error instanceof Error && error.hasOwnProperty('response')) {
        const errResponse = (error as any).response;
        console.error('Error logging in:', errResponse);
        toast.error(errResponse?.data?.message || 'An error occurred');
      } else {
        console.error('Unexpected error:', error);
        toast.error('An unexpected error occurred');
      }
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
                <TextField
                  fullWidth
                  label="Name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  margin="normal"
                  required
                />
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