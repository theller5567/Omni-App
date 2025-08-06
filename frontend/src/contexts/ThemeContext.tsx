import React from 'react';

export interface ThemeContextValue {
  isDarkMode: boolean;
  toggleTheme: (newTheme: 'light' | 'dark') => void;
}

export const ThemeContext = React.createContext<ThemeContextValue>({
  isDarkMode: true,
  toggleTheme: () => {}, // Parameter removed
});

// Optional: Custom hook to use the theme context
export const useTheme = () => React.useContext(ThemeContext); 