import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

interface LoginResponse {
  token: string;
}

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    console.log('Login attempt:', 'TESTING!!!!');
    e.preventDefault();
    try {
      const response = await axios.post<LoginResponse>('/api/users/login', { email, password });
      console.log('Login response:', response);
      const token = response.data.token; // Assuming the token is returned in the response
      console.log('Token received:', token); // Debugging log
      localStorage.setItem('authToken', token);
      navigate('/media-library');
    } catch (error) {
      console.error('Error logging in:', error);
    }
  };

  return (
    <form onSubmit={handleLogin}>
      <div>
        <label>Email</label>
        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" />
      </div>
      <div>
        <label>Password</label>
        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" />
      </div>
      <button type="submit">Login</button>
    </form>
  );
};

export default Login;