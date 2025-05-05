// App.tsx
import React, { useState, useEffect, lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Sidebar from './components/Sidebar/Sidebar';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { lightTheme, darkTheme } from './theme';
import './App.scss';
import { useDispatch, useSelector } from 'react-redux';
import ProtectedRoute from './components/ProtectedRoute';
import { setUser, initializeUser } from './store/slices/userSlice';
import { initializeMedia } from './store/slices/mediaSlice';
import { initializeMediaTypes } from './store/slices/mediaTypeSlice';
import { RootState } from './store/store';
import { AppDispatch } from './store/store';
import axios from 'axios';
import { Box, CircularProgress } from '@mui/material';

// Lazy load components
const MediaDetail = lazy(() => import('./components/MediaDetail/MediaDetail'));
const Account = lazy(() => import('./pages/Account'));
const Home = lazy(() => import('./components/Home'));
const AuthPage = lazy(() => import('./pages/AuthPage'));
const PasswordSetupPage = lazy(() => import('./pages/PasswordSetup'));
const MediaLibraryPage = lazy(() => import('./pages/MediaLibraryPage'));
const AccountUsers = lazy(() => import('./pages/AccountUsers'));
const AccountTags = lazy(() => import('./pages/AccountTags'));
const AccountMediaTypes = lazy(() => import('./pages/AccountMediaTypes'));
const AccountAdminDashboard = lazy(() => import('./pages/AccountAdminDashboard'));
const StyleGuidePage = lazy(() => import('./pages/StyleGuidePage'));

// Loading fallback component
const LoadingFallback = () => (
  <Box display="flex" justifyContent="center" alignItems="center" height="100vh">
    <CircularProgress />
  </Box>
);

// Create a context for theme toggling
export const ThemeContext = React.createContext({
  isDarkMode: true,
  toggleTheme: (_newTheme: 'light' | 'dark') => {}
});

// Create an axios interceptor to handle auth errors globally
axios.interceptors.response.use(
  (response) => response,
  (error) => {
    // Check if the error is a 401 Unauthorized
    if (error.response && error.response.status === 401) {
      console.log('Authorization error detected, clearing session');
      // Clear all auth data
      localStorage.removeItem('authToken');
      localStorage.removeItem('refreshToken');
      
      // Only redirect if we're not already on the login page
      if (!window.location.pathname.includes('/login')) {
        console.log('Redirecting to login page');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

const App: React.FC = () => {
  // Check localStorage for saved theme preference
  const savedTheme = localStorage.getItem('theme');
  const [isDarkMode, setIsDarkMode] = useState(savedTheme ? savedTheme === 'dark' : true);
  const dispatch = useDispatch<AppDispatch>();
  const isLoading = useSelector((state: RootState) => state.user.currentUser.isLoading);
  const userRole = useSelector((state: RootState) => state.user.currentUser.role);
  const userState = useSelector((state: RootState) => state.user.currentUser);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', isDarkMode ? 'dark' : 'light');
    // Save preference to localStorage
    localStorage.setItem('theme', isDarkMode ? 'dark' : 'light');
  }, [isDarkMode]);

  useEffect(() => {
    if (isInitialized) return;

    const token = localStorage.getItem('authToken');
    if (process.env.NODE_ENV === 'development') {
      console.log('Initializing app with token:', token ? 'exists' : 'none');
    }
    
    const initializeApp = async () => {
      if (token) {
        try {
          // First initialize user (authentication)
          if (process.env.NODE_ENV === 'development') {
            console.log('Starting data initialization sequence...');
          }
          const userResult = await dispatch(initializeUser()).unwrap();
          
          // Skip media initialization if we're not signed in
          if (!userResult.currentUser?._id) {
            if (process.env.NODE_ENV === 'development') {
              console.log('User initialization did not return a valid user - skipping media initialization');
            }
            setIsInitialized(true);
            return;
          }
          
          // PERFORMANCE IMPROVEMENT: Only load media data if we're viewing the media library
          // For other pages, we'll lazy load these when needed
          const currentPath = window.location.pathname;
          if (currentPath.includes('/media-library') || currentPath.includes('/media/slug/')) {
            if (process.env.NODE_ENV === 'development') {
              console.log('Detected media page, initializing media data...');
            }
            
            try {
              // Launch both requests in parallel using Promise.all
              const [mediaTypesResult, mediaResult] = await Promise.all([
                dispatch(initializeMediaTypes()).unwrap(),
                dispatch(initializeMedia()).unwrap()
              ]);
              
              if (process.env.NODE_ENV === 'development') {
                console.log('Media data initialized:');
                console.log(`- Media types: ${mediaTypesResult.length} items`);
                console.log(`- Media: ${mediaResult.length} items`);
              }
            } catch (dataError) {
              console.error('Error during media data initialization:', dataError);
              // Even if there's an error loading data, we consider the app initialized
            }
          } else {
            if (process.env.NODE_ENV === 'development') {
              console.log('Not on media page, skipping media data initialization for faster loading');
            }
          }
          
          if (process.env.NODE_ENV === 'development') {
            console.log('App initialization complete');
          }
        } catch (authError) {
          console.error('Authentication failed:', authError);
          // Handle auth error - clear token and set empty user
          localStorage.removeItem('authToken');
          dispatch(setUser({ 
            id: '', 
            email: '', 
            firstName: '', 
            lastName: '', 
            avatar: '', 
            isLoading: false, 
            _id: '', 
            username: '', 
            role: 'user', 
            error: null, 
            token: '' 
          }));
        }
      } else {
        dispatch(setUser({ 
          id: '', 
          email: '', 
          firstName: '', 
          lastName: '', 
          avatar: '', 
          isLoading: false, 
          _id: '', 
          username: '', 
          role: 'user', 
          error: null, 
          token: '' 
        }));
      }
      // Always set initialized to true, even if there were errors
      setIsInitialized(true);
    };

    initializeApp();
  }, [dispatch, isInitialized]);

  // Updated to handle direct theme changes
  const toggleTheme = (newTheme: 'light' | 'dark') => {
    setIsDarkMode(newTheme === 'dark');
  };

  if (isLoading) {
    // Only show loading screen for protected routes, not for login/auth page
    if (window.location.pathname !== '/login' && !window.location.pathname.includes('/auth')) {
      return <LoadingFallback />;
    }
    // For login/auth pages, continue rendering normally
  }

  return (
    <ThemeProvider theme={isDarkMode ? darkTheme : lightTheme}>
      <CssBaseline />
      <ThemeContext.Provider value={{ isDarkMode, toggleTheme }}>
        <Router>
          <div id="app-container" style={{ position: 'relative', width: '100vw', height: '100vh', overflow: 'hidden' }}>
            {userState.email && <Sidebar />}
            <div
              style={{
                position: 'absolute',
                top: 0,
                right: 0,
                bottom: 0,
                width: '100vw',
                overflow: 'auto',
              }}
            >
              <Suspense fallback={<LoadingFallback />}>
                <Routes>
                  <Route path="/media/slug/:slug" element={<ProtectedRoute element={<MediaDetail />} />} />
                  <Route path="/media-library" element={<ProtectedRoute element={<MediaLibraryPage />} />} />
                  <Route path="/account" element={<ProtectedRoute element={<Account />} />} />
                  <Route path="/admin-users" element={<ProtectedRoute element={<AccountUsers />} />} />
                  <Route path="/admin-tags" element={<ProtectedRoute element={<AccountTags />} />} />
                  <Route path="/admin-media-types" element={<ProtectedRoute element={<AccountMediaTypes />} />} />
                  {userRole === 'superAdmin' && (
                    <Route path="/manage-media-types" element={<AccountMediaTypes />} />
                  )}
                  <Route path="/admin-dashboard" element={<ProtectedRoute element={<AccountAdminDashboard />} />} />
                  <Route path="/home" element={<ProtectedRoute element={<Home />} />} />
                  <Route path="/password-setup" element={<PasswordSetupPage />} />
                  <Route path="/style-guide" element={<ProtectedRoute element={<StyleGuidePage />} />} />
                  <Route path="/login" element={<AuthPage />} />
                  <Route path="/" element={<AuthPage />} />
                </Routes>
              </Suspense>
            </div>
          </div>
        </Router>
      </ThemeContext.Provider>
    </ThemeProvider>
  );
};

export default App;