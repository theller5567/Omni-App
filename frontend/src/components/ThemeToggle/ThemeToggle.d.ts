import React from 'react';
import './ThemeToggle.scss';
interface ThemeToggleProps {
    theme: 'light' | 'dark';
    toggleTheme: () => void;
}
declare const ThemeToggle: React.FC<ThemeToggleProps>;
export default ThemeToggle;
