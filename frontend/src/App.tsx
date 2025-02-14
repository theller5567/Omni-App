// App.tsx
import React, { useState } from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Sidebar from './components/Sidebar/Sidebar';
import MediaLibrary from './components/MediaLibrary/MediaLibrary';
import Account from './components/Account';
import Home from './components/Home';
import './App.scss';

const App: React.FC = () => {
  const [isSidebarVisible, setSidebarVisible] = useState(true);

  const toggleSidebar = () => {
    setSidebarVisible(!isSidebarVisible);
  };

  return (
    <Router>
      <div style={{ position: 'relative', width: '100vw', height: '100vh', overflow: 'hidden' }}>
        <Sidebar isVisible={isSidebarVisible} toggleSidebar={toggleSidebar} />
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