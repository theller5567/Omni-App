import React from 'react';
import { ToggleButtonGroup, ToggleButton, Box, Typography } from '@mui/material';
import { FaSun, FaMoon } from 'react-icons/fa';
import './themeToggle.scss';

interface ThemeToggleProps {
  theme: 'light' | 'dark';
  toggleTheme: (newTheme: 'light' | 'dark') => void;
  showLabel?: boolean;
}

const ThemeToggle: React.FC<ThemeToggleProps> = ({ theme, toggleTheme, showLabel = false }) => {
  const handleChange = (_event: React.MouseEvent<HTMLElement>, newTheme: string | null) => {
    if (newTheme !== null) {
      toggleTheme(newTheme as 'light' | 'dark');
    }
  };

  return (
    <Box className="theme-toggle" sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
      {showLabel && (
        <Typography variant="body2" color="textSecondary">
          Theme
        </Typography>
      )}
      <ToggleButtonGroup
        value={theme}
        exclusive
        onChange={handleChange}
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