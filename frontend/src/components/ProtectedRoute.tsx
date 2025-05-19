import React, { Suspense } from 'react';
import { Navigate } from 'react-router-dom';
import { Box, CircularProgress } from '@mui/material';
import { useUserProfile } from '../hooks/query-hooks';

interface ProtectedRouteProps {
  element: React.ReactElement;
  requiredRole?: Array<'user' | 'admin' | 'distributor' | 'superAdmin'> | 'user' | 'admin' | 'distributor' | 'superAdmin';
  adminOnly?: boolean;
}

const LoadingFallback = () => (
  <Box display="flex" justifyContent="center" alignItems="center" height="100vh">
    <CircularProgress />
  </Box>
);

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ element, requiredRole, adminOnly = false }) => {
  const { 
    data: userProfile, 
    isLoading: isUserLoading, 
    isError: isUserError 
  } = useUserProfile();

  if (isUserLoading) {
    return <LoadingFallback />;
  }

  if (isUserError || !userProfile) {
    return <Navigate to="/login" replace />;
  }

  const isAuthenticated = !!userProfile?._id;

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  let hasRequiredRole = true;

  if (requiredRole) {
    const userRole = userProfile?.role;
    const userRolesArray = Array.isArray(userRole) ? userRole : (userRole ? [userRole] : []);

    if (Array.isArray(requiredRole)) {
      hasRequiredRole = requiredRole.some(role => userRolesArray.includes(role));
    } else {
      hasRequiredRole = userRolesArray.includes(requiredRole);
    }
  } else if (adminOnly) {
    hasRequiredRole = userProfile?.role === 'admin' || userProfile?.role === 'superAdmin';
  }

  if (!hasRequiredRole) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <Suspense fallback={<LoadingFallback />}>
      {element}
    </Suspense>
  );
};

export default ProtectedRoute; 