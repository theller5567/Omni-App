import React, { Suspense } from 'react';
import { Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from '../store/store';
import { Box, CircularProgress } from '@mui/material';

interface ProtectedRouteProps {
  element: React.ReactElement;
}

const LoadingFallback = () => (
  <Box display="flex" justifyContent="center" alignItems="center" height="100vh">
    <CircularProgress />
  </Box>
);

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ element }) => {
  const isAuthenticated = useSelector((state: RootState) => !!state.user.currentUser.email);  

  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  return (
    <Suspense fallback={<LoadingFallback />}>
      {element}
    </Suspense>
  );
};

export default ProtectedRoute; 