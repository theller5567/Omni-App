import React from 'react';
import { Container, Typography, CircularProgress, Box, Alert, Avatar } from '@mui/material';
import { useParams } from 'react-router-dom';
import { 
    useUserById
  } from '../hooks/query-hooks';

const UserPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { data: user, isLoading, error, isError } = useUserById(id);

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="80vh">
        <CircularProgress />
        <Typography sx={{ ml: 2 }}>Loading user profile...</Typography>
      </Box>
    );
  }

  if (isError || !user) {
    const errorMessage = error?.message || 'User not found or an error occurred.';
    return (
      <Container sx={{ textAlign: 'center', mt: 5 }}>
        <Alert severity="error">{errorMessage}</Alert>
      </Container>
    );
  }

  return (
    <Container sx={{ mt: 4, textAlign: 'center' }}>
      <Avatar 
        src={user.avatar || undefined} 
        sx={{ width: 120, height: 120, margin: '0 auto 2rem auto', fontSize: '3rem' }}
      >
        {(!user.avatar && user.firstName && user.lastName) ? `${user.firstName.charAt(0)}${user.lastName.charAt(0)}` : user.username?.charAt(0).toUpperCase()}
      </Avatar>
      <Typography variant="h2" gutterBottom>{user.username}</Typography>
      {user.firstName && user.lastName && (
        <Typography variant="h4" color="textSecondary" gutterBottom>
          {`${user.firstName} ${user.lastName}`}
        </Typography>
      )}
      <Typography variant="body1" color="textSecondary">
        Joined: {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
      </Typography>
    </Container>
  );
};

export default UserPage;