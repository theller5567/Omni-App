import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { clearUser } from '../../store/slices/userSlice';

const NavBar: React.FC = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('refreshToken');
    dispatch(clearUser());
    navigate('/');
  };

  return null; // Component currently not used in the app
};

export default NavBar; 