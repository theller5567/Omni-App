import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { AppDispatch } from '../store/store';
import { API_BASE_URL } from '../config/config';
import { initializeUser, fetchAllUsers } from '../store/slices/userSlice'; // Correct import

interface LoginResponse {
  token: string;
}

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();

  const handleLogin = async (e: React.FormEvent) => {
    console.log('Login attempt:', 'TESTING!!!!');
    e.preventDefault();
    setLoginError(''); // Clear any previous errors
    
    try {
      const response = await axios.post<LoginResponse>(`${API_BASE_URL}/api/users/login`, { email, password });
      console.log('Login response:', response);
      const token = response.data.token; // Assuming the token is returned in the response
      console.log('Token received:', token); // Debugging log
      
      // Store token in localStorage
      localStorage.setItem('authToken', token);
      
      // Important: Initialize user data in Redux store
      try {
        // Dispatch action to load user into Redux store
        await dispatch(initializeUser());
        console.log('User data initialized in Redux store');
        
        // Explicitly fetch all users for admin UI components
        await dispatch(fetchAllUsers());
        console.log('All users fetched for admin components');
      } catch (initError) {
        console.error('Error initializing user data:', initError);
        // Continue even if this fails, as the main login was successful
      }
      
      // Navigate to the media library page
      navigate('/media-library');
    } catch (error) {
      console.error('Error logging in:', error);
      setLoginError('Login failed. Please check your credentials and try again.');
    }
  };

  return (
    <form className="login-form" onSubmit={handleLogin}>
      <div>
        <label>Email</label>
        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" />
      </div>
      <div>
        <label>Password</label>
        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" />
      </div>
      {loginError && <div className="error-message">{loginError}</div>}
      <button type="submit">Login</button>
    </form>
  );
};

export default Login;