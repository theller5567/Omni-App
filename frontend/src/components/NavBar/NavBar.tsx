import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import apiClient from '../../api/apiClient';
import { stopAccessTokenRefreshSchedule } from '../../services/tokenScheduler';

// Create a standalone hook for logout functionality
export const useLogout = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  return async () => {
    if (process.env.NODE_ENV === 'development') {
      console.log('Executing logout via useLogout hook...');
    }
    // Call backend to clear HttpOnly cookies and wait for it to complete
    try {
      await apiClient.post('/auth/logout');
    } catch {}
    // Stop any scheduled refresh timers and clear local storage fallbacks
    stopAccessTokenRefreshSchedule();
    localStorage.removeItem('authToken');
    localStorage.removeItem('refreshToken');
    
    queryClient.clear();

    if (process.env.NODE_ENV === 'development') {
      console.log('User and auth tokens cleared, navigating to login.');
    }
    navigate('/', { replace: true });
  };
};

const NavBar: React.FC = () => {
  // Component currently not used in the app
  return null;
};

export default NavBar; 