import { createTheme, Theme } from '@mui/material/styles';

/**
 * Function to get CSS variable value
 * This lets us use our CSS variables in the MUI theme
 */
const getCssVar = (varName: string): string => {
  // Ensure we're running in browser environment
  if (typeof window !== 'undefined' && window.document) {
    const computedStyle = getComputedStyle(document.documentElement);
    return computedStyle.getPropertyValue(varName).trim();
  }
  // Fallback values for SSR
  return '';
};

// Function to create a theme based on the CSS variables
const createThemeFromCssVars = (mode: 'light' | 'dark'): Theme => {
  // First set the data-theme attribute to ensure correct CSS variables are used
  if (typeof document !== 'undefined') {
    document.documentElement.setAttribute('data-theme', mode);
  }
  
  // Light mode colors
  const lightColors = {
    primary: '#1976d2',
    primaryLight: '#90caf9',
    primaryDark: '#1565c0',
    secondary: '#b2c200',
    secondaryLight: '#dae339',
    secondaryDark: '#919c00',
    background: '#f3f3f3',
    surface: '#ffffff',
    textPrimary: '#000000',
    textSecondary: '#444444',
    textDisabled: '#757575',
    textOnPrimary: '#ffffff',
    textOnSecondary: '#000000',
    error: '#f44336',
    warning: '#ff9800',
    info: '#2196f3',
    success: '#4caf50',
    divider: '#e0e0e0'
  };
  
  // Dark mode colors
  const darkColors = {
    primary: '#90caf9',
    primaryLight: '#bbdefb',
    primaryDark: '#42a5f5',
    secondary: '#b2c200',
    secondaryLight: '#dae339',
    secondaryDark: '#919c00',
    background: '#121212',
    surface: '#1e1e1e',
    textPrimary: '#ffffff',
    textSecondary: '#b0b0b0',
    textDisabled: '#757575',
    textOnPrimary: '#000000',
    textOnSecondary: '#ffffff',
    error: '#ef5350',
    warning: '#ffa726',
    info: '#42a5f5',
    success: '#66bb6a',
    divider: '#444444'
  };
  
  // Select the appropriate color set based on the theme mode
  const colors = mode === 'light' ? lightColors : darkColors;
  
  return createTheme({
    palette: {
      mode,
      primary: {
        main: colors.primary,
        light: colors.primaryLight,
        dark: colors.primaryDark,
        contrastText: colors.textOnPrimary,
      },
      secondary: {
        main: colors.secondary,
        light: colors.secondaryLight,
        dark: colors.secondaryDark,
        contrastText: colors.textOnSecondary,
      },
      background: {
        default: colors.background,
        paper: colors.surface,
      },
      text: {
        primary: colors.textPrimary,
        secondary: colors.textSecondary,
        disabled: colors.textDisabled,
      },
      error: {
        main: colors.error,
      },
      warning: {
        main: colors.warning,
      },
      info: {
        main: colors.info,
      },
      success: {
        main: colors.success,
      },
      divider: colors.divider,
    },
    shape: {
      borderRadius: parseInt(getCssVar('--border-radius-md'), 10) || 8,
    },
    typography: {
      fontFamily: getCssVar('--font-family-base') || 
        '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
      fontSize: 16,
      htmlFontSize: 16,
      h1: {
        fontSize: getCssVar('--font-size-4xl') || '2.25rem',
        fontWeight: getCssVar('--font-weight-bold') || 700,
        lineHeight: getCssVar('--line-height-tight') || 1.25,
      },
      h2: {
        fontSize: getCssVar('--font-size-3xl') || '1.875rem',
        fontWeight: getCssVar('--font-weight-bold') || 700,
        lineHeight: getCssVar('--line-height-tight') || 1.25,
      },
      h3: {
        fontSize: getCssVar('--font-size-2xl') || '1.5rem',
        fontWeight: getCssVar('--font-weight-semibold') || 600,
        lineHeight: getCssVar('--line-height-tight') || 1.25,
      },
      h4: {
        fontSize: getCssVar('--font-size-xl') || '1.25rem',
        fontWeight: getCssVar('--font-weight-semibold') || 600,
        lineHeight: getCssVar('--line-height-tight') || 1.25,
      },
      h5: {
        fontSize: getCssVar('--font-size-lg') || '1.125rem',
        fontWeight: getCssVar('--font-weight-medium') || 500,
        lineHeight: getCssVar('--line-height-tight') || 1.25,
      },
      h6: {
        fontSize: getCssVar('--font-size-md') || '1rem',
        fontWeight: getCssVar('--font-weight-medium') || 500,
        lineHeight: getCssVar('--line-height-tight') || 1.25,
      },
      subtitle1: {
        fontSize: getCssVar('--font-size-md') || '1rem',
        fontWeight: getCssVar('--font-weight-medium') || 500,
      },
      subtitle2: {
        fontSize: getCssVar('--font-size-sm') || '0.875rem',
        fontWeight: getCssVar('--font-weight-medium') || 500,
      },
      body1: {
        fontSize: getCssVar('--font-size-md') || '1rem',
      },
      body2: {
        fontSize: getCssVar('--font-size-sm') || '0.875rem',
      },
      button: {
        fontSize: getCssVar('--font-size-sm') || '0.875rem',
        fontWeight: getCssVar('--font-weight-medium') || 500,
        textTransform: 'none', // Override MUI's default uppercase
      },
      caption: {
        fontSize: getCssVar('--font-size-xs') || '0.75rem',
      },
      overline: {
        fontSize: getCssVar('--font-size-xs') || '0.75rem',
        textTransform: 'uppercase',
        fontWeight: getCssVar('--font-weight-semibold') || 600,
        letterSpacing: '0.08em',
      },
    },
    spacing: (factor: number) => {
      const spaceMap: Record<number, string> = {
        1: '0.25rem',   // 4px
        2: '0.5rem',    // 8px
        3: '0.75rem',   // 12px
        4: '1rem',      // 16px
        5: '1.5rem',    // 24px
        6: '2rem',      // 32px
        8: '3rem',      // 48px
        10: '4rem',     // 64px
        12: '5rem',     // 80px
      };
      return spaceMap[factor] || `${factor * 0.25}rem`;
    },
    components: {
      MuiCssBaseline: {
        styleOverrides: {
          body: {
            backgroundColor: colors.background,
            color: colors.textPrimary,
          },
        },
      },
      MuiButton: {
        styleOverrides: {
          root: {
            borderRadius: getCssVar('--border-radius-md') || '8px',
            textTransform: 'none',
            boxShadow: mode === 'light' ? '0 1px 2px rgba(0,0,0,0.05)' : '0 1px 3px rgba(0,0,0,0.3)',
            transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
            '&:hover': {
              boxShadow: mode === 'light' ? '0 4px 6px rgba(0,0,0,0.1)' : '0 4px 8px rgba(0,0,0,0.4)',
            }
          },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            backgroundColor: colors.surface,
            borderRadius: getCssVar('--border-radius-md') || '8px',
            boxShadow: mode === 'light' ? '0 4px 6px rgba(0,0,0,0.1)' : '0 4px 8px rgba(0,0,0,0.4)',
          },
        },
      },
      MuiDialog: {
        styleOverrides: {
          paper: {
            backgroundColor: colors.surface,
            borderRadius: getCssVar('--border-radius-lg') || '12px',
            boxShadow: mode === 'light' ? '0 20px 25px rgba(0,0,0,0.15)' : '0 20px 30px rgba(0,0,0,0.6)',
          },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            backgroundColor: colors.surface,
          },
          elevation1: {
            boxShadow: mode === 'light' ? '0 1px 2px rgba(0,0,0,0.05)' : '0 1px 3px rgba(0,0,0,0.3)',
          },
          elevation2: {
            boxShadow: mode === 'light' ? '0 4px 6px rgba(0,0,0,0.1)' : '0 4px 8px rgba(0,0,0,0.4)',
          },
          elevation3: {
            boxShadow: mode === 'light' ? '0 10px 15px rgba(0,0,0,0.1)' : '0 10px 20px rgba(0,0,0,0.5)',
          },
          elevation4: {
            boxShadow: mode === 'light' ? '0 20px 25px rgba(0,0,0,0.15)' : '0 20px 30px rgba(0,0,0,0.6)',
          },
        },
      },
      MuiInputBase: {
        styleOverrides: {
          root: {
            transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
          },
        },
      },
      MuiSwitch: {
        styleOverrides: {
          root: {
            '& .MuiSwitch-switchBase.Mui-checked': {
              color: colors.primary,
              '& + .MuiSwitch-track': {
                backgroundColor: colors.primaryLight,
              },
            },
          },
        },
      },
      MuiToggleButton: {
        styleOverrides: {
          root: {
            '&.Mui-selected': {
              backgroundColor: colors.primary,
              color: colors.textOnPrimary,
              '&:hover': {
                backgroundColor: colors.primaryDark,
              },
            },
          },
        },
      },
      MuiTableCell: {
        styleOverrides: {
          root: {
            borderBottom: `1px solid ${colors.divider}`,
          },
          head: {
            fontWeight: getCssVar('--font-weight-semibold') || 600,
          },
        },
      },
    },
  });
};

// Create the themes
const lightTheme = createThemeFromCssVars('light');
const darkTheme = createThemeFromCssVars('dark');

export { lightTheme, darkTheme }; 