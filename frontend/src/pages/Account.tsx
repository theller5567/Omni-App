import React, { useState, useEffect } from 'react';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import axios from 'axios';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { Box, Button, TextField, Typography, Avatar, CircularProgress } from '@mui/material';
import { motion } from 'framer-motion';

// Define a User interface if not already defined elsewhere
interface User {
  email: string;
  firstName: string;
  lastName: string;
  password?: string;
  avatar?: string | null;
}


const Account: React.FC = () => {
  const [loading, setLoading] = useState<boolean>(false);
  const [avatar, setAvatar] = useState<string | null>(null);
  const [initialValues, setInitialValues] = useState<User>({
    email: '',
    firstName: '',
    lastName: '',
    password: '',
  });

  // Fetch user data on component mount
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const token = localStorage.getItem('authToken');
        if (!token) {
          console.error('No token found in localStorage');
          throw new Error('No token found');
        }

        const response = await axios.get<User>('http://localhost:5002/api/user/profile', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const { email, firstName, lastName, avatar } = response.data;
        setInitialValues({ email, firstName, lastName, password: '' });
        setAvatar(avatar || null);
        console.log('Token:', token);
        console.log('Response:', response.data);
      } catch (error: any) {
        console.error('Error fetching user data:', error);
        toast.error('Failed to load user data');
      }
    };

    fetchUserData();
  }, []);

  const formik = useFormik<User>({
    initialValues,
    enableReinitialize: true,
    validationSchema: Yup.object({
      email: Yup.string().email('Invalid email address').required('Email is required'),
      firstName: Yup.string().required('First Name is required'),
      lastName: Yup.string().required('Last Name is required'),
      password: Yup.string().min(6, 'Password must be at least 6 characters'),
    }),
    onSubmit: async (values) => {
      setLoading(true);
      try {
        const token = localStorage.getItem('authToken'); // Retrieve the token
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

        if (avatar) {
          updatedFields.avatar = avatar;
        }

        const response = await axios.put('/api/user/update', updatedFields, {
          headers: {
            Authorization: `Bearer ${token}`, // Include the token in the headers
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
    <Box display="flex" justifyContent="center" alignItems="center" height="100vh">
      <motion.div
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Typography variant="h4" align="center" gutterBottom>
          Account Settings
        </Typography>
        <form onSubmit={formik.handleSubmit}>
          <Box display="flex" justifyContent="center" marginBottom={2}>
            <Avatar src={avatar || '/default-avatar.png'} sx={{ width: 100, height: 100 }} />
          </Box>
         
          <TextField
            fullWidth
            label="First Name"
            name="firstName"
            value={formik.values.firstName}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            margin="normal"
            required
            error={formik.touched.firstName && Boolean(formik.errors.firstName)}
            helperText={formik.touched.firstName && formik.errors.firstName}
          />
           <TextField
            fullWidth
            label="Last Name"
            name="lastName"
            value={formik.values.lastName}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            margin="normal"
            required
            error={formik.touched.lastName && Boolean(formik.errors.lastName)}
            helperText={formik.touched.lastName && formik.errors.lastName}
          />
          
          <TextField
            fullWidth
            label="Email"
            name="email"
            type="email"
            value={formik.values.email}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            margin="normal"
            required
            error={formik.touched.email && Boolean(formik.errors.email)}
            helperText={formik.touched.email && formik.errors.email}
          />
          <TextField
            fullWidth
            label="Password"
            name="password"
            type="password"
            value={formik.values.password}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            margin="normal"
            error={formik.touched.password && Boolean(formik.errors.password)}
            helperText={formik.touched.password && formik.errors.password}
          />
          <Button
            variant="contained"
            color="primary"
            fullWidth
            type="submit"
            sx={{ marginTop: 2 }}
            disabled={loading}
          >
            {loading ? <CircularProgress size={24} color="inherit" /> : 'Update Profile'}
          </Button>
        </form>
      </motion.div>
      <ToastContainer />
    </Box>
  );
};

export default Account; 