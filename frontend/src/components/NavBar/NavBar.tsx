import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { QueryKeys } from '../../hooks/query-hooks';

// Create a standalone hook for logout functionality
export const useLogout = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  return () => {
    if (process.env.NODE_ENV === 'development') {
      console.log('Executing logout via useLogout hook...');
    }
    localStorage.removeItem('authToken');
    localStorage.removeItem('refreshToken');
    
    queryClient.removeQueries({ queryKey: QueryKeys.userProfile });
    queryClient.removeQueries({ queryKey: QueryKeys.allUsers });

    if (process.env.NODE_ENV === 'development') {
      console.log('User and auth tokens cleared, navigating to login.');
    }
    navigate('/login');
  };
};

const NavBar: React.FC = () => {
  // Component currently not used in the app
  return null;
};

export default NavBar; 