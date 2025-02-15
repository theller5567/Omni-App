// App.tsx
import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Sidebar from './components/Sidebar/Sidebar';
import MediaLibrary from './components/MediaLibrary/MediaLibrary';
import Account from './components/Account';
import Home from './components/Home';
import ThemeToggle from './components/ThemeToggle/ThemeToggle';
import './App.scss';

const App: React.FC = () => {
  const [isSidebarVisible, setSidebarVisible] = useState(true);
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const toggleSidebar = () => {
    setSidebarVisible(!isSidebarVisible);
  };

  const toggleTheme = () => {
    console.log('toggleTheme');
    setTheme((prevTheme) => (prevTheme === 'light' ? 'dark' : 'light'));
  };

  return (
    <Router>
      <div style={{ position: 'relative', width: '100vw', height: '100vh', overflow: 'hidden' }}>
        <Sidebar isVisible={isSidebarVisible} toggleSidebar={toggleSidebar} />
        <ThemeToggle theme={theme} toggleTheme={toggleTheme} />
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
            <Route path="/media-library" element={<MediaLibrary />} />
            <Route path="/account" element={<Account />} />
            <Route path="/home" element={<Home />} />
          </Routes>
        </div>
      </div>
    </Router>
  );
};

export default App;