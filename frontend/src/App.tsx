// App.tsx
import React, { useState, useEffect, lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import Sidebar from './components/Sidebar/Sidebar';
import ResponsiveNav from './components/Navigation/ResponsiveNav';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { createThemeFromCssVars } from './theme';
import './App.scss';
import ProtectedRoute from './components/ProtectedRoute';
import { Box, CircularProgress, useMediaQuery } from '@mui/material';
// React Query imports
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
// Import the necessary hooks
import { useMediaTypesWithUsageCounts, useUserProfile } from './hooks/query-hooks';
import type { User } from './hooks/query-hooks';
import { ThemeContext } from './contexts/ThemeContext'; // Import ThemeContext
import SessionExpiredDialog from './components/SessionExpiredDialog';
import { subscribeSessionPrompt, resolveSessionPrompt } from './services/sessionManager';

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
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'));
const VerifyEmailPage = lazy(() => import('./pages/VerifyEmailPage'));
const LearningThree = lazy(() => import('./pages/LearningThree'));

// Loading fallback component
const LoadingFallback = () => (
  <Box display="flex" justifyContent="center" alignItems="center" height="100vh">
    <CircularProgress />
  </Box>
);

// Remove duplicate global axios interceptor in favor of centralized apiClient

// This is needed because the main App component provides the QueryClientProvider
const AppContent: React.FC = () => {
  // Check localStorage for saved theme preference
  const savedTheme = localStorage.getItem('theme');
  const [isDarkMode, setIsDarkMode] = useState(savedTheme ? savedTheme === 'dark' : true);
  const [isAuthCheckComplete, setIsAuthCheckComplete] = useState(false);
  // Check for mobile view to determine toast position
  const isMobile = useMediaQuery('(max-width:900px)');
  
  const location = useLocation();
  const isAuthPage = location.pathname === '/' || location.pathname.startsWith('/accept-invitation');
  const [sessionPromptOpen, setSessionPromptOpen] = useState(false);

  useEffect(() => {
    // Subscribe to session prompt events
    const unsubscribe = subscribeSessionPrompt((open) => setSessionPromptOpen(open));
    return () => unsubscribe();
  }, []);

  // --- User Profile with TanStack Query ---
  const { 
    data: userProfile, 
    error: userError,
    isSuccess: isUserSuccess,
    isError: isUserFetchError
  } = useUserProfile(!isAuthPage);

  // Prefetch media types data using TanStack Query
  useMediaTypesWithUsageCounts(userProfile);

  useEffect(() => {
    if (isUserFetchError && userError) {
      if (process.env.NODE_ENV === 'development') {
        console.error('App.tsx: User profile fetch resulted in an error state.', userError);
      }
      const token = localStorage.getItem('authToken');
      if (token) {
        const errorMessage = (userError as Error)?.message || ''; // Safer access to message
        let isAuthFailure = errorMessage.includes('Authentication token missing');
        
        // Check for Axios-like error structure more robustly
        if (!isAuthFailure && 
            typeof userError === 'object' && 
            userError !== null 
           ) {
          // Type assertion for error object with potential response property
          const errorWithResponse = userError as { response?: { status?: unknown; data?: { message?: string } } };
          if (errorWithResponse.response && typeof errorWithResponse.response === 'object' && 'status' in errorWithResponse.response) {
            if (typeof errorWithResponse.response.status === 'number') { // Check if status is a number
              const status = errorWithResponse.response.status;
              if (status === 401 || status === 403) {
                  isAuthFailure = true;
              }
            }
          }
        }
          if (isAuthFailure) {
            localStorage.removeItem('authToken');
            localStorage.removeItem('refreshToken');
            queryClient.clear();
            const path = window.location.pathname;
            if (path !== '/' && !path.startsWith('/accept-invitation')) {
              window.location.href = '/';
            }
          }
      }
    }
  }, [isUserFetchError, userError]);

  // Remove effect-based theme attribute update; we'll set it synchronously in toggleTheme

  const computedTheme = React.useMemo(() => {
    // Recompute theme after data-theme switch so CSS variables are read fresh
    return createThemeFromCssVars(isDarkMode ? 'dark' : 'light');
  }, [isDarkMode]);

  // useEffect to manage overall app initialization status
  // This effect now primarily waits for user and media types to settle.
  useEffect(() => {
    if (isAuthPage) {
      setIsAuthCheckComplete(true);
      return;
    }

    const token = localStorage.getItem('authToken');
    if (!token) {
      setIsAuthCheckComplete(true);
    } else {
      if (isUserSuccess || isUserFetchError) {
        setIsAuthCheckComplete(true);
      }
    }
  }, [isUserSuccess, isUserFetchError, isAuthPage]);

  // Updated to handle direct theme changes
  const toggleTheme = (newTheme: 'light' | 'dark') => {
    // Set attribute BEFORE state update so theme reads fresh CSS vars in the next render
    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute('data-theme', newTheme);
    }
    localStorage.setItem('theme', newTheme);
    setIsDarkMode(newTheme === 'dark');
  };

  // Show loading fallback if user profile is loading or app is not yet initialized.
  // Ensure mediaTypes loading is also considered if it's critical before rendering.
  if (!isAuthCheckComplete) {
      return <LoadingFallback />;
  }

  return (
    <ThemeProvider theme={computedTheme}>
      <CssBaseline />
      <ThemeContext.Provider value={{ isDarkMode, toggleTheme }}>
          <div id="app-container" style={{ display: 'flex', flexDirection: 'row', width: '100vw', height: '100vh', overflow: 'hidden' }}>
            {/* Mobile app bar + bottom nav */}
            {!isAuthPage && <ResponsiveNav />}

            {/* Desktop sidebar (md+) */}
            {(!isAuthPage && isUserSuccess && userProfile && userProfile._id && !isMobile && (<Sidebar /> as React.ReactNode))}
            <div
              id="content-container"
              style={{
                flex: 1,
                overflow: 'auto',
                paddingTop: (!isAuthPage && isMobile) ? 64 : 0,
                paddingBottom: (!isAuthPage && isMobile) ? 56 : 0,
                paddingLeft: 0,
                paddingRight: 0,
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
                  <Route path="/password-setup" element={<PasswordSetupPage />} />
                  <Route path="/style-guide" element={<ProtectedRoute element={<StyleGuidePage />} adminOnly />} />
                  <Route path="/learning-three" element={<ProtectedRoute element={<LearningThree />} adminOnly={false} />} />
                  <Route path="/verify-email" element={<VerifyEmailPage />} />
                  <Route path="/" element={<AuthPage />} />
                  <Route path="*" element={<NotFoundPage />} />
                  {/* <Route path="/admin-media-approvals" element={<ProtectedRoute element={<MediaApprovalPage />} adminOnly />} /> */}
                </Routes>
              </Suspense>
            </div>
          </div>
      </ThemeContext.Provider>
      <SessionExpiredDialog
        open={sessionPromptOpen}
        onContinue={() => resolveSessionPrompt(true)}
        onSignIn={() => {
          resolveSessionPrompt(false);
          window.location.href = '/';
        }}
      />
      
      {/* Centralized ToastContainer for the entire application */}
      <ToastContainer
        position={isMobile ? "bottom-center" : "top-right"}
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={true}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss={false}
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
    <Router>
      <QueryClientProvider client={queryClient}>
        <AppContent />
        {/* Only show React Query Devtools in development */}
        {process.env.NODE_ENV === 'development' && <ReactQueryDevtools initialIsOpen={false} />}
      </QueryClientProvider>
    </Router>
  );
};

export default App;