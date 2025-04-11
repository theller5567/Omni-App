import React, { useState } from 'react';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import axios from 'axios';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { Box, Button, TextField, Typography, Avatar, CircularProgress } from '@mui/material';
import { motion } from 'framer-motion';
import { useSelector } from 'react-redux';
import { RootState } from '../store/store';

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
  const currentUser = useSelector((state: RootState) => state.user.currentUser);
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
      } catch (error: any) {
        console.error('Error updating profile:', error);
        toast.error(error.response?.data?.message || 'An error occurred');
      } finally {
        setLoading(false);
      }
    },
  });

  return (
    <Box
      component={motion.div}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      sx={{
        maxWidth: '600px',
        margin: 'auto',
        padding: '2rem',
        backgroundColor: 'background.paper',
        borderRadius: '8px',
        boxShadow: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: 'auto',
        width: '100%',
        
      }}
    >
      <Typography variant="h2" gutterBottom>
        Account Settings
      </Typography>

      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <Avatar
          src={currentUser.avatar || undefined}
          sx={{ width: 100, height: 100, mr: 2 }}
        />
      </Box>

      <form onSubmit={formik.handleSubmit} style={{ marginTop: '1rem' }}>
        <TextField
          fullWidth
          id="email"
          name="email"
          label="Email"
          value={formik.values.email}
          onChange={formik.handleChange}
          error={formik.touched.email && Boolean(formik.errors.email)}
          helperText={formik.touched.email && formik.errors.email}
          sx={{ mb: 2 }}
        />

        <TextField
          fullWidth
          id="firstName"
          name="firstName"
          label="First Name"
          value={formik.values.firstName}
          onChange={formik.handleChange}
          error={formik.touched.firstName && Boolean(formik.errors.firstName)}
          helperText={formik.touched.firstName && formik.errors.firstName}
          sx={{ mb: 2 }}
        />

        <TextField
          fullWidth
          id="lastName"
          name="lastName"
          label="Last Name"
          value={formik.values.lastName}
          onChange={formik.handleChange}
          error={formik.touched.lastName && Boolean(formik.errors.lastName)}
          helperText={formik.touched.lastName && formik.errors.lastName}
          sx={{ mb: 2 }}
        />

        <TextField
          fullWidth
          id="username"
          name="username"
          label="Username"
          value={formik.values.username}
          onChange={formik.handleChange}
          error={formik.touched.username && Boolean(formik.errors.username)}
          helperText={formik.touched.username && formik.errors.username}
          sx={{ mb: 2 }}
        />

        <TextField
          fullWidth
          id="password"
          name="password"
          label="New Password (optional)"
          type="password"
          value={formik.values.password}
          onChange={formik.handleChange}
          error={formik.touched.password && Boolean(formik.errors.password)}
          helperText={formik.touched.password && formik.errors.password}
          sx={{ mb: 2 }}
        />

        <Button
          type="submit"
          variant="contained"
          color="primary"
          disabled={loading}
          sx={{ mt: 2 }}
        >
          {loading ? <CircularProgress size={24} /> : 'Save Changes'}
        </Button>
      </form>

      <ToastContainer position="bottom-right" />
    </Box>
  );
};

export default Account; 