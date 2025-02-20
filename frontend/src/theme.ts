import { createTheme } from '@mui/material/styles';

const lightTheme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#1976d2', // Light mode primary color
    },
    secondary: {
      main: '#b2c200', // Light mode secondary color
    },
    background: {
      default: '#ffffff', // Light mode background
    },
    text: {
      primary: '#000000', // Light mode text
    },
  },
});

const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#90caf9', // Dark mode primary color
    },
    secondary: {
      main: '#b2c200', // Dark mode secondary color
    },
    background: {
      default: '#121212', // Dark mode background
    },
    text: {
      primary: '#ffffff', // Dark mode text
    },
  },
});

export { lightTheme, darkTheme }; 