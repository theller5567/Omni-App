// App.tsx
import React, { useState, useEffect, lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Sidebar from './components/Sidebar/Sidebar';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { lightTheme, darkTheme } from './theme';
import './App.scss';
import ProtectedRoute from './components/ProtectedRoute';
import axios from 'axios';
import { Box, CircularProgress, useMediaQuery } from '@mui/material';
// React Query imports
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
// Import ToastContainer for centralized toast notifications
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
// Import the necessary hooks
import { useMediaTypesWithUsageCounts, useUserProfile } from './hooks/query-hooks';
import type { User } from './hooks/query-hooks';
// Remove Redux imports if no longer used for user state here
// import { useDispatch, useSelector } from 'react-redux';
// import { RootState, AppDispatch } from './store/store';
// import MediaApprovalPage from './pages/MediaApprovalPage'; // Adjust path as needed

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
const UserPage = lazy(() => import('./pages/User'));

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
      console.log('[AXIOS INTERCEPTOR] 401 Unauthorized detected. Current path:', window.location.pathname);
      console.log('[AXIOS INTERCEPTOR] Removing authToken and refreshToken from localStorage.');
      // Clear all auth data
      localStorage.removeItem('authToken');
      localStorage.removeItem('refreshToken');
      // Only redirect if we're not already on the login page
      if (!window.location.pathname.includes('/login')) {
        console.log('[AXIOS INTERCEPTOR] Redirecting to login page.');
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
  // const dispatch = useDispatch<AppDispatch>(); // Removed, not used for user init
  // const isLoadingRedux = useSelector((state: RootState) => state.user.currentUser.isLoading); // Removed
  // const userRoleRedux = useSelector((state: RootState) => state.user.currentUser.role); // Removed
  // const userStateRedux = useSelector((state: RootState) => state.user.currentUser); // Removed
  const [isInitialized, setIsInitialized] = useState(false);
  // Check for mobile view to determine toast position
  const isMobile = useMediaQuery('(max-width:600px)');
  
  // --- User Profile with TanStack Query ---
  const { 
    data: userProfile, 
    isLoading: isUserLoading, 
    error: userError,
    isSuccess: isUserSuccess,
    isError: isUserFetchError
  } = useUserProfile();

  // Prefetch media types data using TanStack Query
  // This replaces the Redux mediaTypes initialization
  useMediaTypesWithUsageCounts(userProfile);

  useEffect(() => {
    // This effect block was primarily for the old custom callbacks.
    // The core logic of clearing userProfile on auth error is now in useUserProfile's internal onError.
    // The logic for localStorage.removeItem('authToken') on 401 is handled by the axios interceptor.
    // If additional side-effects are needed in App.tsx based on userProfile changes, 
    // a new useEffect watching userProfile, isUserFetchError, and userError can be added.
    if (isUserFetchError) {
      // Example: if a specific action is needed in App.tsx when user fetch fails, beyond what useUserProfile does.
      if (process.env.NODE_ENV === 'development') {
        console.error('App.tsx: User profile fetch resulted in an error state.', userError);
      }
      // If the error indicates an auth failure and the token is somehow still present, clear it.
      // This is a defensive check, as the interceptor and useUserProfile's onError should handle most cases.
      const token = localStorage.getItem('authToken');
      if (token && userError && typeof userError === 'object' && 'message' in userError) {
        const errorMessage = (userError as any).message || '';
        let isAuthFailure = errorMessage.includes('Authentication token missing');
        // Check for shape of Axios error without relying on isAxiosError
        if (!isAuthFailure && userError && typeof userError === 'object' && 'response' in userError && (userError as any).response) {
            const status = (userError as any).response.status;
            if (status === 401 || status === 403) {
                isAuthFailure = true;
            }
        }
        if (isAuthFailure) {
            localStorage.removeItem('authToken');
            // Optionally, redirect here if not handled by other mechanisms
            // window.location.href = '/login'; 
        }
      }
    }
  }, [isUserFetchError, userError]);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', isDarkMode ? 'dark' : 'light');
    // Save preference to localStorage
    localStorage.setItem('theme', isDarkMode ? 'dark' : 'light');
  }, [isDarkMode]);

  // useEffect to manage overall app initialization status
  // This effect now primarily waits for user and media types to settle.
  useEffect(() => {
    if (isUserSuccess || isUserFetchError) { // Considered initialized once user fetch attempt is complete
      setIsInitialized(true);
      if (process.env.NODE_ENV === 'development') {
        console.log('App initialization status: User fetch attempt complete.');
        if (isUserSuccess) console.log('User profile:', userProfile);
        if (isUserFetchError) console.log('User fetch error:', userError);
      }
    }
  }, [isUserSuccess, isUserFetchError, userProfile, userError]);

  // Updated to handle direct theme changes
  const toggleTheme = (newTheme: 'light' | 'dark') => {
    setIsDarkMode(newTheme === 'dark');
  };

  // Show loading fallback if user profile is loading or app is not yet initialized.
  // Ensure mediaTypes loading is also considered if it's critical before rendering.
  if (isUserLoading || !isInitialized) { 
    // Only show loading screen for protected routes, not for login/auth page
    // Check if userProfile is null (meaning not fetched or error) when deciding to show loading for protected routes.
    const currentPath = window.location.pathname;
    const isAuthPath = currentPath === '/login' || currentPath.includes('/auth');
    
    // If on an auth path, don't show global loading, let the auth page handle its own state.
    // If not on an auth path AND user is loading OR app not initialized, show fallback.
    if (!isAuthPath && (isUserLoading || !isInitialized)) {
      return <LoadingFallback />;
    }
  }

  return (
    <ThemeProvider theme={isDarkMode ? darkTheme : lightTheme}>
      <CssBaseline />
      <ThemeContext.Provider value={{ isDarkMode, toggleTheme }}>
        <Router>
          <div id="app-container" style={{ display: 'flex', flexDirection: 'row', width: '100vw', height: '100vh', overflow: 'hidden' }}>
            {/* Sidebar is shown if user profile fetch was successful and userProfile exists */}
           {(isUserSuccess && userProfile && Object.keys(userProfile).length > 0 && (<Sidebar /> as React.ReactNode))}
            <div
              style={{
                flexGrow: 1,
                height: '100vh', // Ensure the content area can scroll independently
                overflow: 'auto', // Allows content to scroll
                // Removed position: 'absolute' and related top, left, right, bottom, width properties
              }}
            >
              <Suspense fallback={<LoadingFallback />}>
                <Routes>
                  {/* Pass userProfile to ProtectedRoutes */}
                  <Route path="/media/slug/:slug" element={<ProtectedRoute element={<MediaDetail />} />} />
                  <Route path="/media-library" element={<ProtectedRoute element={<MediaLibraryPage />} />} />
                  <Route path="/account" element={<ProtectedRoute element={<Account />} />} />
                  <Route path="/user/:id" element={<ProtectedRoute element={<UserPage />} />} />
                  <Route path="/admin-users" element={<ProtectedRoute element={<AccountUsers />} adminOnly />} />
                  <Route path="/admin-tags" element={<ProtectedRoute element={<AccountTags />} adminOnly />} />
                  <Route path="/admin-media-types" element={<ProtectedRoute element={<AccountMediaTypes />} adminOnly />} />
                  {/* Conditional route based on userProfile role */}
                  {(userProfile as User | null | undefined)?.role === 'superAdmin' && (
                    <Route path="/manage-media-types" element={<ProtectedRoute element={<AccountMediaTypes />} adminOnly />} />
                  )}
                  <Route path="/admin-dashboard" element={<ProtectedRoute element={<AccountAdminDashboard />} adminOnly />} />
                  <Route path="/accept-invitation/:token" element={<AcceptInvitation />} /> {/* Consider if this needs protection */}
                  <Route path="/home" element={<ProtectedRoute element={<Home />} />} />
                  <Route path="/password-setup" element={<ProtectedRoute element={<PasswordSetupPage />} />} />
                  <Route path="/style-guide" element={<ProtectedRoute element={<StyleGuidePage />} adminOnly />} />
                  <Route path="/login" element={<AuthPage />} />
                  <Route path="/" element={<AuthPage />} />
                  {/* <Route path="/admin-media-approvals" element={<ProtectedRoute element={<MediaApprovalPage />} adminOnly />} /> */}
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