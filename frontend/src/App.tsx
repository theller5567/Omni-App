import React from 'react';
import Sidebar from './components/Sidebar'; // Import Sidebar component
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Home from './pages/Home';
import AuthPage from './pages/AuthPage';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import './App.scss';

const App: React.FC = () => {
  return (
    <Router>
      <Sidebar /> {/* Sidebar is included on all pages */}

      <div className="content">
        <Routes>
          <Route path="/" element={<AuthPage />} />
          <Route path="/home" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/dashboard" element={<Dashboard />} />
        </Routes>
      </div>
    </Router>
  );
};

export default App;