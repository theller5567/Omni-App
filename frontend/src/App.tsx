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
import MediaContainer from './components/MediaContainer';
import { Provider, useDispatch, useSelector } from 'react-redux';
import store from './store/store';
import ProtectedRoute from './components/ProtectedRoute';
import PasswordSetupPage from './pages/PasswordSetup';
import { setUser } from './store/slices/userSlice';
import axios from 'axios';
import { RootState } from './store/store';

interface UserState {
  email: string;
  firstName: string;
  lastName: string;
  avatar: string;
  isLoading: boolean;
}

const App: React.FC = () => {
  //const [isSidebarVisible, setSidebarVisible] = useState(true);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const dispatch = useDispatch();
  const isLoading = useSelector((state: RootState) => state.user.isLoading);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', isDarkMode ? 'dark' : 'light');
  }, [isDarkMode]);

  useEffect(() => {
    const token = localStorage.getItem('authToken');
    if (token) {
      axios.get<UserState>('/api/user/profile', {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then(response => {
        dispatch(setUser(response.data));
      })
      .catch(error => {
        console.error('Error fetching user data:', error);
        localStorage.removeItem('authToken');
        dispatch(setUser({ email: '', firstName: '', lastName: '', avatar: '', isLoading: false }));
      });
    } else {
      dispatch(setUser({ email: '', firstName: '', lastName: '', avatar: '', isLoading: false }));
    }
  }, [dispatch]);

  // Debugging: Check user state
  const userState = useSelector((state: RootState) => state.user);
  console.log('User state on app load:', userState);

  // const toggleSidebar = () => {
  //   setSidebarVisible(!isSidebarVisible);
  // };

  const toggleTheme = () => {
    setIsDarkMode((prevMode) => !prevMode);
  };

  if (isLoading) {
    return <div>Loading...</div>; // Show a loading indicator while fetching data
  }

  return (
    <ThemeProvider theme={isDarkMode ? darkTheme : lightTheme}>
      <CssBaseline />
      <Provider store={store}>
        <Router>
          <div id="app-container" style={{ position: 'relative', width: '100vw', height: '100vh', overflow: 'hidden' }}>
            <Sidebar />
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
                <Route path="/media-library" element={<ProtectedRoute element={<MediaContainer />} />} />
                <Route path="/account" element={<ProtectedRoute element={<Account />} />} />
                <Route path="/home" element={<ProtectedRoute element={<Home />} />} />
                <Route path="/password-setup" element={<PasswordSetupPage />} />
                <Route path="/" element={<AuthPage />} />
              </Routes>
            </div>
          </div>
        </Router>
      </Provider>
    </ThemeProvider>
  );
};

export default App;