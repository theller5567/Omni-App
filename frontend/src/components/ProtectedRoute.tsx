import React, { Suspense } from 'react';
import { Navigate } from 'react-router-dom';
import { Box, CircularProgress } from '@mui/material';
import type { User } from '../hooks/query-hooks';

interface ProtectedRouteProps {
  element: React.ReactElement;
  userProfile: User | null | undefined;
  requiredRole?: Array<'user' | 'admin' | 'distributor' | 'superAdmin'> | 'user' | 'admin' | 'distributor' | 'superAdmin';
  adminOnly?: boolean;
}

const LoadingFallback = () => (
  <Box display="flex" justifyContent="center" alignItems="center" height="100vh">
    <CircularProgress />
  </Box>
);

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ element, userProfile, requiredRole, adminOnly = false }) => {
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