import React from 'react';
import { FaSun, FaMoon } from 'react-icons/fa';
import './ThemeToggle.scss';

interface ThemeToggleProps {
  theme: 'light' | 'dark';
  toggleTheme: () => void;
}

const ThemeToggle: React.FC<ThemeToggleProps> = ({ theme, toggleTheme }) => {
  return (
    <div className="theme-toggle" onClick={toggleTheme}>
      <div className={`toggle-switch ${theme}`}>
        <FaSun className="icon sun" />
        <FaMoon className="icon moon" />
      </div>
    </div>
  );
};

export default ThemeToggle; 