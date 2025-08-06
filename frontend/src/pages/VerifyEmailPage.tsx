// frontend/src/pages/VerifyEmailPage.tsx
import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate, Link as RouterLink } from 'react-router-dom';
import { Box, Typography, Button, CircularProgress, Container, Alert } from '@mui/material';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import axios from 'axios';
import env from '../config/env';

interface VerifyEmailResponse {
  message: string;
  redirectUrl: string;
}

const VerifyEmailPage: React.FC = () => {
  const [verificationStatus, setVerificationStatus] = useState<'pending' | 'success' | 'error'>('pending');
  const [message, setMessage] = useState('');
  const location = useLocation();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const token = params.get('token');

    if (!token) {
      setVerificationStatus('error');
      setMessage('No verification token found. Please check the link and try again.');
      return;
    }

    const verifyToken = async () => {
      try {
        const response = await axios.get<VerifyEmailResponse>(`${env.BASE_URL}/api/auth/verify-email/${token}`);
        setVerificationStatus('success');
        setMessage(response.data.message || 'Email verified successfully! Redirecting...');
        
        // Use the redirectUrl from the backend response
        if (response.data.redirectUrl) {
          setTimeout(() => {
            window.location.href = response.data.redirectUrl;
          }, 2000);
        }

      } catch (error: any) {
        setVerificationStatus('error');
        setMessage(error.response?.data?.message || 'Failed to verify email. The link may be invalid or expired.');
      }
    };

    verifyToken();
  }, [location]);

  return (
    <Container component="main" maxWidth="sm" sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
          p: 4,
          borderRadius: 2,
          boxShadow: 3,
          bgcolor: 'background.paper',
        }}
      >
        {verificationStatus === 'pending' && (
          <>
            <CircularProgress size={60} sx={{ mb: 3 }} />
            <Typography variant="h5">Verifying your email...</Typography>
            <Typography color="text.secondary">Please wait a moment.</Typography>
          </>
        )}

        {verificationStatus === 'success' && (
          <>
            <CheckCircleOutlineIcon sx={{ fontSize: 80, color: 'success.main', mb: 2 }} />
            <Typography variant="h4" gutterBottom>Success!</Typography>
            <Alert severity="success" sx={{ mb: 3 }}>{message}</Alert>
            <Typography color="text.secondary">You will be redirected shortly.</Typography>
          </>
        )}

        {verificationStatus === 'error' && (
          <>
            <ErrorOutlineIcon sx={{ fontSize: 80, color: 'error.main', mb: 2 }} />
            <Typography variant="h4" gutterBottom>Verification Failed</Typography>
            <Alert severity="error" sx={{ mb: 3 }}>{message}</Alert>
            <Button component={RouterLink} to="/" variant="contained" color="primary">
              Go to Login Page
            </Button>
          </>
        )}
      </Box>
    </Container>
  );
};

export default VerifyEmailPage;
