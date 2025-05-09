import React, { Suspense } from 'react';
import { Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from '../store/store';
import { Box, CircularProgress } from '@mui/material';

interface ProtectedRouteProps {
  element: React.ReactElement;
  adminOnly?: boolean;
}

const LoadingFallback = () => (
  <Box display="flex" justifyContent="center" alignItems="center" height="100vh">
    <CircularProgress />
  </Box>
);

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ element, adminOnly = false }) => {
  const user = useSelector((state: RootState) => state.user.currentUser);
  const isAuthenticated = !!user.email;
  const isAdmin = user.role === 'admin' || user.role === 'superAdmin';

  // Check authentication first
  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  // If adminOnly is true, check if user is an admin
  if (adminOnly && !isAdmin) {
    // Redirect to dashboard or another page if not an admin
    return <Navigate to="/dashboard" />;
  }

  return (
    <Suspense fallback={<LoadingFallback />}>
      {element}
    </Suspense>
  );
};

export default ProtectedRoute; 