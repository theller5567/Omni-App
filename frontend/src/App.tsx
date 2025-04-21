// App.tsx
import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Sidebar from './components/Sidebar/Sidebar';
import MediaDetail from './components/MediaDetail/MediaDetail';
import Account from './pages/Account';
import Home from './components/Home';
import AuthPage from './pages/AuthPage';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { lightTheme, darkTheme } from './theme';
import './App.scss';
import { useDispatch, useSelector } from 'react-redux';
import ProtectedRoute from './components/ProtectedRoute';
import PasswordSetupPage from './pages/PasswordSetup';
import { setUser, initializeUser } from './store/slices/userSlice';
import { initializeMedia } from './store/slices/mediaSlice';
import { initializeMediaTypes } from './store/slices/mediaTypeSlice';
import { RootState } from './store/store';
import MediaLibraryPage from './pages/MediaLibraryPage';
import AccountUsers from './pages/AccountUsers';
import AccountTags from './pages/AccountTags';
import AccountMediaTypes from './pages/AccountMediaTypes';
import AccountAdminDashboard from './pages/AccountAdminDashboard';
import { AppDispatch } from './store/store';
import StyleGuidePage from './pages/StyleGuidePage';

// Create a context for theme toggling
export const ThemeContext = React.createContext({
  isDarkMode: true,
  toggleTheme: (_newTheme: 'light' | 'dark') => {}
});

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
    console.log('Initializing app with token:', token ? 'exists' : 'none');
    
    const initializeApp = async () => {
      if (token) {
        try {
          // First initialize user (authentication)
          console.log('Starting data initialization sequence...');
          const userResult = await dispatch(initializeUser()).unwrap();
          
          // Skip media initialization if we're not signed in
          if (!userResult.currentUser?._id) {
            console.log('User initialization did not return a valid user - skipping media initialization');
            setIsInitialized(true);
            return;
          }
          
          // PERFORMANCE IMPROVEMENT: Load media types and media concurrently
          // This will significantly reduce startup time by running network requests in parallel
          console.log('Starting parallel initialization of media types and media...');
          
          try {
            // Launch both requests in parallel using Promise.all
            const [mediaTypesResult, mediaResult] = await Promise.all([
              dispatch(initializeMediaTypes()).unwrap(),
              dispatch(initializeMedia()).unwrap()
            ]);
            
            console.log('Parallel data initialization complete:');
            console.log(`- Media types: ${mediaTypesResult.length} items loaded`);
            console.log(`- Media: ${mediaResult.length} items loaded`);
          } catch (dataError) {
            console.error('Error during parallel data initialization:', dataError);
            // Even if there's an error loading data, we consider the app initialized
            // This prevents a broken state where the app never finishes loading
          }
          
          console.log('App initialization complete');
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
    return <div>Loading...</div>;
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
                <Route path="/" element={<AuthPage />} />
              </Routes>
            </div>
          </div>
        </Router>
      </ThemeContext.Provider>
    </ThemeProvider>
  );
};

export default App;