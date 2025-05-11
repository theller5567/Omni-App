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
// Remove the import for initializeMediaTypes from mediaTypeSlice
// import { initializeMediaTypes } from './store/slices/mediaTypeSlice';
import { RootState } from './store/store';
import { AppDispatch } from './store/store';
import axios from 'axios';
import { Box, CircularProgress, useMediaQuery } from '@mui/material';
// React Query imports
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
// Import ToastContainer for centralized toast notifications
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
// Import the useMediaTypesWithUsageCounts hook
import { useMediaTypesWithUsageCounts } from './hooks/query-hooks';

// Create React Query client with improved configuration
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false, // Disable refetching when window regains focus
      staleTime: 1000 * 60 * 5, // Data is considered fresh for 5 minutes
      retry: 1, // Only retry failed requests once
      // Adding a custom retry function to avoid retrying on 404 errors
      retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000), // Exponential backoff
    },
    mutations: {
      // Configure mutation defaults
      retry: 1,
      retryDelay: 1000,
    },
  },
});

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
const AcceptInvitation = lazy(() => import('./pages/AcceptInvitation'));

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

// Define an internal component to use React Query hooks
// This is needed because the main App component provides the QueryClientProvider
const AppContent: React.FC = () => {
  // Check localStorage for saved theme preference
  const savedTheme = localStorage.getItem('theme');
  const [isDarkMode, setIsDarkMode] = useState(savedTheme ? savedTheme === 'dark' : true);
  const dispatch = useDispatch<AppDispatch>();
  const isLoading = useSelector((state: RootState) => state.user.currentUser.isLoading);
  const userRole = useSelector((state: RootState) => state.user.currentUser.role);
  const userState = useSelector((state: RootState) => state.user.currentUser);
  const [isInitialized, setIsInitialized] = useState(false);
  // Check for mobile view to determine toast position
  const isMobile = useMediaQuery('(max-width:600px)');
  
  // Prefetch media types data using TanStack Query
  // This replaces the Redux mediaTypes initialization
  const { data: mediaTypes } = useMediaTypesWithUsageCounts();

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
          
          // Media types are now loaded by TanStack Query
          // No need to dispatch initializeMediaTypes
          
          if (process.env.NODE_ENV === 'development') {
            console.log('App initialization complete');
            console.log('Media types loaded with TanStack Query:', mediaTypes?.length || 0);
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
  }, [dispatch, isInitialized, mediaTypes]);

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
                  <Route path="/accept-invitation/:token" element={<AcceptInvitation />} />
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
      
      {/* Centralized ToastContainer for the entire application */}
      <ToastContainer
        position={isMobile ? "bottom-center" : "top-right"}
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={true}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        limit={3}  // Limit concurrent notifications
      />
    </ThemeProvider>
  );
};

// Main App component that provides the QueryClientProvider
const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <AppContent />
      {/* Only show React Query Devtools in development */}
      {process.env.NODE_ENV === 'development' && <ReactQueryDevtools initialIsOpen={false} />}
    </QueryClientProvider>
  );
};

export default App;