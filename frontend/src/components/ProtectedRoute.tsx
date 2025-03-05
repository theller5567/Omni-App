import React from 'react';
import { Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from '../store/store';

interface ProtectedRouteProps {
  element: React.ReactElement;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ element }) => {
  const isAuthenticated = useSelector((state: RootState) => !!state.user.email);

  // Debugging: Check user state and authentication status
  console.log('User state:', useSelector((state: RootState) => state.user));
  console.log('Is authenticated:', isAuthenticated);
  
  return isAuthenticated ? element : <Navigate to="/" />;
  
};

export default ProtectedRoute; 