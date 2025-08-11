import React, { useEffect, useState } from 'react';
import apiClient from '../api/apiClient';
import { useNavigate, useLocation } from 'react-router-dom';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { TextField, Button, Typography, Box } from '@mui/material';

const PasswordSetup: React.FC = () => {
  const [error, setError] = useState('');
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    const token = queryParams.get('token');
    if (!token) {
      setError('Invalid or missing token');
    }
  }, [location]);

  const formik = useFormik({
    initialValues: {
      password: '',
    },
    validationSchema: Yup.object({
      password: Yup.string()
        .min(8, 'Password must be at least 8 characters')
        .required('Password is required'),
    }),
    onSubmit: async (values) => {
      const queryParams = new URLSearchParams(location.search);
      const token = queryParams.get('token');
      if (!token) {
        setError('Invalid or missing token');
        return;
      }
      try {
        const response = await apiClient.post(`/auth/password-setup`, { password: values.password, token });
        console.log('Password set successfully:', response.data);
        navigate('/');
      } catch (error) {
        console.error('Error setting password:', error);
        setError('Failed to set password');
      }
    },
  });

  return (
    <Box display="flex" justifyContent="center" alignItems="center" height="100vh">
      <form onSubmit={formik.handleSubmit}>
        <Typography variant="h4" align="center" gutterBottom>
          Set Your Password
        </Typography>
        <TextField
          fullWidth
          label="New Password"
          name="password"
          type="password"
          value={formik.values.password}
          onChange={formik.handleChange}
          onBlur={formik.handleBlur}
          error={formik.touched.password && Boolean(formik.errors.password)}
          helperText={formik.touched.password && formik.errors.password}
          placeholder="Enter new password"
          required
        />
        <Button
          variant="contained"
          color="primary"
          fullWidth
          type="submit"
          sx={{ marginTop: 2 }}
        >
          Set Password
        </Button>
        {error && <Typography color="error">{error}</Typography>}
      </form>
    </Box>
  );
};

export default PasswordSetup; 