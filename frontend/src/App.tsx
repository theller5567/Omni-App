// App.tsx
import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Sidebar from './components/Sidebar/Sidebar';
import MediaDetail from './components/MediaDetail/MediaDetail';
import Account from './pages/Account';
import Home from './components/Home';
import AuthPage from './pages/AuthPage';
import ThemeToggle from './components/ThemeToggle/ThemeToggle';
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


const App: React.FC = () => {
  const [isDarkMode, setIsDarkMode] = useState(true);
  const dispatch = useDispatch<AppDispatch>();
  const isLoading = useSelector((state: RootState) => state.user.currentUser.isLoading);
  const userRole = useSelector((state: RootState) => state.user.currentUser.role);
  const userState = useSelector((state: RootState) => state.user.currentUser);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', isDarkMode ? 'dark' : 'light');
  }, [isDarkMode]);

  useEffect(() => {
    if (isInitialized) return;

    const token = localStorage.getItem('authToken');
    console.log('Initializing app with token:', token ? 'exists' : 'none');
    
    const initializeApp = async () => {
      if (token) {
        try {
          await Promise.all([
            dispatch(initializeUser()).unwrap(),
            dispatch(initializeMedia()).unwrap(),
            dispatch(initializeMediaTypes()).unwrap()
          ]);
          console.log('App initialization complete');
        } catch (error) {
          console.error('App initialization failed:', error);
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
      setIsInitialized(true);
    };

    initializeApp();
  }, [dispatch, isInitialized]);

  const toggleTheme = (
    event: React.MouseEvent<HTMLElement>,
    newTheme: 'light' | 'dark' | null
  ) => {
    if (newTheme !== null) {
      setIsDarkMode(newTheme === 'dark');
    }
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <ThemeProvider theme={isDarkMode ? darkTheme : lightTheme}>
      <CssBaseline />
      <Router>
        <div id="app-container" style={{ position: 'relative', width: '100vw', height: '100vh', overflow: 'hidden' }}>
          {userState.email && <Sidebar />}
          <ThemeToggle theme={isDarkMode ? 'dark' : 'light'} toggleTheme={toggleTheme} />
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
              <Route path="/" element={<AuthPage />} />
            </Routes>
          </div>
        </div>
      </Router>
    </ThemeProvider>
  );
};

export default App;