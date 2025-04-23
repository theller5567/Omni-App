import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { clearUser } from '../../store/slices/userSlice';

// Create a standalone hook for logout functionality
export const useLogout = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  return () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('refreshToken');
    dispatch(clearUser());
    navigate('/login');
  };
};

const NavBar: React.FC = () => {
  // Component currently not used in the app
  return null;
};

export default NavBar; 