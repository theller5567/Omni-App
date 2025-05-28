import React, { useState } from 'react';
// import axios from 'axios'; // No longer directly needed for login API call
import { useNavigate } from 'react-router-dom';
// import { useDispatch } from 'react-redux'; // Removed
// import { AppDispatch } from '../store/store'; // Removed
// import { API_BASE_URL } from '../config/config'; // API_BASE_URL is in env.ts now, managed by query-hooks
// import { initializeUser, fetchAllUsers } from '../store/slices/userSlice'; // Removed
import { useLogin } from '../hooks/query-hooks'; // Added

// interface LoginResponse { // No longer needed as useLogin handles response structure
//   token: string;
// }

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  // const [loginError, setLoginError] = useState(''); // Handled by useLogin onError
  const navigate = useNavigate();
  // const dispatch = useDispatch<AppDispatch>(); // Removed
  const { mutate: loginUser, isPending: isLoggingIn, error: loginErrorHook } = useLogin(); // Added useLogin hook

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    // setLoginError(''); // Clear previous errors - not needed with hook's error state

    loginUser({ email, password }, {
      onSuccess: (data) => {
        // navigate('/media-library'); // Original navigation
        // The useLogin hook's onSuccess already shows a toast.
        // It also populates the userProfile cache and stores tokens.
        // Let's navigate to home or dashboard based on role, or just a default page.
        // For now, keeping it simple and navigating to /home as a default logged-in page.
        // The ProtectedRoute and App.tsx will handle further redirection if needed.
        if (data.user?.role === 'admin' || data.user?.role === 'superAdmin') {
          navigate('/admin-dashboard');
        } else {
          navigate('/home');
        }
      },
      onError: (error: any) => {
        // The useLogin hook's onError already shows a toast.
        // We don't need to set local loginError state here.
        // Error object from useLogin can be directly used if needed for UI, but toast might be enough.
        console.error('Login failed from component:', error);
        // Example: if (loginErrorHook) toast.error(loginErrorHook.message || 'Login failed.');
      }
    });
  };

  return (
    <form className="login-form" onSubmit={handleLogin}>
      <div>
        <label>Email</label>
        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" disabled={isLoggingIn} />
      </div>
      <div>
        <label>Password</label>
        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" disabled={isLoggingIn} />
      </div>
      {loginErrorHook && <div className="error-message">{(loginErrorHook as any).message || 'Login failed. Please check credentials.'}</div>}
      <button type="submit" disabled={isLoggingIn}>
        {isLoggingIn ? 'Logging in...' : 'Login'}
      </button>
    </form>
  );
};

export default Login;