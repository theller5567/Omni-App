import React from 'react';
import { ToggleButtonGroup, ToggleButton, Box, Tooltip } from '@mui/material';
import { FaSun, FaMoon } from 'react-icons/fa';
import './ThemeToggle.scss';

interface ThemeToggleProps {
  theme: 'light' | 'dark';
  toggleTheme: (event: React.MouseEvent<HTMLElement>, newTheme: 'light' | 'dark' | null) => void;
}

const ThemeToggle: React.FC<ThemeToggleProps> = ({ theme, toggleTheme }) => {
  return (
    <Box className="theme-toggle">
      <ToggleButtonGroup
        value={theme}
        exclusive
        onChange={toggleTheme}
        aria-label="theme mode"
        size="small"
      >
        <ToggleButton value="light" aria-label="light mode" title="Light Mode">
          <FaSun size={16} />
        </ToggleButton>
        <ToggleButton value="dark" aria-label="dark mode" title="Dark Mode">
          <FaMoon size={16} />
        </ToggleButton>
      </ToggleButtonGroup>
    </Box>
  );
};

export default ThemeToggle; 