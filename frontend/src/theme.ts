import { createTheme, Theme } from '@mui/material/styles';
import { fontFamily, fontWeights } from './utils/fontUtils';
// Ensure CSS variables are loaded BEFORE computing theme values
import './styles/variables.scss';

// Import our font CSS to ensure it's included in the bundle
import './assets/fonts/fonts.css';

/**
 * Function to get CSS variable value with fallback
 * This lets us use our CSS variables in the MUI theme
 */
const getCssVar = (varName: string, fallback: string = ''): string => {
  // Ensure we're running in browser environment
  if (typeof window !== 'undefined' && window.document) {
    const computedStyle = getComputedStyle(document.documentElement);
    const value = computedStyle.getPropertyValue(varName).trim();
    return value || fallback; // Return fallback if value is empty
  }
  // Fallback values for SSR
  return fallback;
};

// Function to create a theme based on the CSS variables
const createThemeFromCssVars = (mode: 'light' | 'dark'): Theme => {
  // First set the data-theme attribute to ensure correct CSS variables are used
  // REMOVED: if (typeof document !== 'undefined') {
  // REMOVED:   document.documentElement.setAttribute('data-theme', mode);
  // REMOVED: }
  
  // Default colors for light and dark modes
  const lightDefaults = {
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
  
  const darkDefaults = {
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
  
  // Choose default fallbacks based on mode
  const defaults = mode === 'light' ? lightDefaults : darkDefaults;
  
  // Using CSS variables with fallbacks
  const colors = {
    primary: getCssVar('--color-primary', defaults.primary),
    primaryLight: getCssVar('--color-primary-light', defaults.primaryLight),
    primaryDark: getCssVar('--color-primary-dark', defaults.primaryDark),
    secondary: getCssVar('--color-secondary', defaults.secondary),
    secondaryLight: getCssVar('--color-secondary-light', defaults.secondaryLight),
    secondaryDark: getCssVar('--color-secondary-dark', defaults.secondaryDark),
    background: getCssVar('--color-background', defaults.background),
    surface: getCssVar('--color-surface', defaults.surface),
    textPrimary: getCssVar('--color-text-primary', defaults.textPrimary),
    textSecondary: getCssVar('--color-text-secondary', defaults.textSecondary),
    textDisabled: getCssVar('--color-text-disabled', defaults.textDisabled),
    textOnPrimary: getCssVar('--color-text-on-primary', defaults.textOnPrimary),
    textOnSecondary: getCssVar('--color-text-on-secondary', defaults.textOnSecondary),
    error: getCssVar('--color-error', defaults.error),
    warning: getCssVar('--color-warning', defaults.warning),
    info: getCssVar('--color-info', defaults.info),
    success: getCssVar('--color-success', defaults.success),
    divider: getCssVar('--color-border', defaults.divider)
  };
  
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
      borderRadius: parseInt(getCssVar('--border-radius-md', '8'), 10) || 8,
    },
    typography: {
      fontFamily: fontFamily,
      fontSize: 16,
      htmlFontSize: 16,
      h1: {
        fontSize: getCssVar('--font-size-4xl', '2.25rem'),
        fontWeight: fontWeights.light,
        lineHeight: getCssVar('--line-height-tight', '1.25'),
        letterSpacing: '-0.01em',
      },
      h2: {
        fontSize: getCssVar('--font-size-3xl', '1.875rem'),
        fontWeight: fontWeights.bold,
        lineHeight: getCssVar('--line-height-tight', '1.25'),
        letterSpacing: '-0.01em',
      },
      h3: {
        fontSize: getCssVar('--font-size-2xl', '1.5rem'),
        fontWeight: fontWeights.semiBold,
        lineHeight: getCssVar('--line-height-tight', '1.25'),
        letterSpacing: '-0.005em',
      },
      h4: {
        fontSize: getCssVar('--font-size-xl', '1.25rem'),
        fontWeight: fontWeights.semiBold,
        lineHeight: getCssVar('--line-height-tight', '1.25'),
        letterSpacing: '-0.005em',
      },
      h5: {
        fontSize: getCssVar('--font-size-lg', '1.125rem'),
        fontWeight: fontWeights.medium,
        lineHeight: getCssVar('--line-height-tight', '1.25'),
      },
      h6: {
        fontSize: getCssVar('--font-size-md', '1rem'),
        fontWeight: fontWeights.medium,
        lineHeight: getCssVar('--line-height-tight', '1.25'),
      },
      subtitle1: {
        fontSize: getCssVar('--font-size-md', '1rem'),
        fontWeight: fontWeights.medium,
      },
      subtitle2: {
        fontSize: getCssVar('--font-size-sm', '0.875rem'),
        fontWeight: fontWeights.medium,
      },
      body1: {
        fontSize: getCssVar('--font-size-md', '1rem'),
        fontWeight: fontWeights.regular,
        letterSpacing: '0.01em',
      },
      body2: {
        fontSize: getCssVar('--font-size-sm', '0.875rem'),
        fontWeight: fontWeights.regular,
        letterSpacing: '0.01em',
      },
      button: {
        fontSize: getCssVar('--font-size-sm', '0.875rem'),
        fontWeight: fontWeights.medium,
        textTransform: 'none', // Override MUI's default uppercase
        letterSpacing: '0.05em',
      },
      caption: {
        fontSize: getCssVar('--font-size-xs', '0.75rem'),
        fontWeight: fontWeights.light,
        letterSpacing: '0.02em',
      },
      overline: {
        fontSize: getCssVar('--font-size-xs', '0.75rem'),
        textTransform: 'uppercase',
        fontWeight: fontWeights.semiBold,
        letterSpacing: '0.08em',
      },
    },
    spacing: (factor: number) => {
      const spaceMap: Record<number, string> = {
        1: getCssVar('--space-1', '0.25rem'),
        2: getCssVar('--space-2', '0.5rem'),
        3: getCssVar('--space-3', '0.75rem'),
        4: getCssVar('--space-4', '1rem'),
        5: getCssVar('--space-5', '1.5rem'),
        6: getCssVar('--space-6', '2rem'),
        8: getCssVar('--space-8', '3rem'),
        10: getCssVar('--space-10', '4rem'),
        12: getCssVar('--space-12', '5rem'),
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
            borderRadius: getCssVar('--border-radius-md', '8px'),
            textTransform: 'none',
            boxShadow: mode === 'light' ? getCssVar('--shadow-sm', '0 1px 2px rgba(0, 0, 0, 0.05)') : getCssVar('--shadow-md', '0 4px 6px rgba(0, 0, 0, 0.1)'),
            transition: `all ${getCssVar('--transition-normal', '250ms')} ${getCssVar('--transition-curve-default', 'cubic-bezier(0.4, 0, 0.2, 1)')}`,
            '&:hover': {
              boxShadow: mode === 'light' ? getCssVar('--shadow-md', '0 4px 6px rgba(0, 0, 0, 0.1)') : getCssVar('--shadow-lg', '0 10px 15px rgba(0, 0, 0, 0.1)'),
            }
          },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            backgroundColor: colors.surface,
            borderRadius: getCssVar('--border-radius-md', '8px'),
            boxShadow: mode === 'light' ? getCssVar('--shadow-md', '0 4px 6px rgba(0, 0, 0, 0.1)') : getCssVar('--shadow-lg', '0 10px 15px rgba(0, 0, 0, 0.1)'),
          },
        },
      },
      MuiDialog: {
        styleOverrides: {
          paper: {
            backgroundColor: colors.surface,
            borderRadius: getCssVar('--border-radius-lg', '12px'),
            boxShadow: mode === 'light' ? getCssVar('--shadow-xl', '0 20px 25px rgba(0, 0, 0, 0.15)') : getCssVar('--shadow-xl', '0 20px 30px rgba(0, 0, 0, 0.6)'),
          },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            backgroundColor: colors.surface,
          },
          elevation1: {
            boxShadow: mode === 'light' ? getCssVar('--shadow-sm', '0 1px 2px rgba(0, 0, 0, 0.05)') : getCssVar('--shadow-sm', '0 1px 3px rgba(0, 0, 0, 0.3)'),
          },
          elevation2: {
            boxShadow: mode === 'light' ? getCssVar('--shadow-md', '0 4px 6px rgba(0, 0, 0, 0.1)') : getCssVar('--shadow-md', '0 4px 8px rgba(0, 0, 0, 0.4)'),
          },
          elevation3: {
            boxShadow: mode === 'light' ? getCssVar('--shadow-lg', '0 10px 15px rgba(0, 0, 0, 0.1)') : getCssVar('--shadow-lg', '0 10px 20px rgba(0, 0, 0, 0.5)'),
          },
          elevation4: {
            boxShadow: mode === 'light' ? getCssVar('--shadow-xl', '0 20px 25px rgba(0, 0, 0, 0.15)') : getCssVar('--shadow-xl', '0 20px 30px rgba(0, 0, 0, 0.6)'),
          },
        },
      },
      MuiInputBase: {
        styleOverrides: {
          root: {
            transition: `all ${getCssVar('--transition-normal')} ${getCssVar('--transition-curve-default')}`,
            // Add specific styling for light mode inputs
            ...(mode === 'light' && {
              backgroundColor: 'transparent',
              '& .MuiOutlinedInput-notchedOutline': {
                borderColor: getCssVar('--color-border'),
              },
              '&:hover .MuiOutlinedInput-notchedOutline': {
                borderColor: getCssVar('--color-primary'),
              },
              '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                borderColor: getCssVar('--color-primary'),
              }
            })
          },
        },
      },
      MuiInputLabel: {
        styleOverrides: {
          root: {
            ...(mode === 'light' && {
              color: colors.primary,
              backgroundColor: 'transparent',
            }),
            '&.MuiInputLabel-shrink': {
              ...(mode === 'light' && {
                backgroundColor: 'transparent',
                color: colors.primary,
                '&.MuiInputLabel-outlined': {
                  padding: '0 4px',
                }
              })
            }
          }
        }
      },
      MuiTextField: {
        styleOverrides: {
          root: {
            ...(mode === 'light' && {
              '& .MuiInputBase-root': {
                backgroundColor: 'transparent'
              },
              '& .MuiOutlinedInput-notchedOutline': {
                backgroundColor: 'transparent'
              },
              '& .MuiOutlinedInput-root': {
                backgroundColor: 'transparent'
              }
            })
          }
        }
      },
      MuiSwitch: {
        styleOverrides: {
          root: {
            '& .MuiSwitch-switchBase.Mui-checked': {
              color: getCssVar('--color-primary'),
              '& + .MuiSwitch-track': {
                backgroundColor: getCssVar('--color-primary-light'),
              },
            },
          },
        },
      },
      MuiToggleButton: {
        styleOverrides: {
          root: {
            '&.Mui-selected': {
              backgroundColor: getCssVar('--color-primary'),
              color: getCssVar('--color-text-on-primary'),
              '&:hover': {
                backgroundColor: getCssVar('--color-primary-dark'),
              },
            },
          },
        },
      },
      MuiTableCell: {
        styleOverrides: {
          root: {
            borderBottom: `1px solid ${getCssVar('--color-border')}`,
          },
          head: {
            fontWeight: getCssVar('--font-weight-semibold') || 600,
          },
        },
      },
      MuiFilledInput: {
        styleOverrides: {
          root: {
            ...(mode === 'light' && {
              backgroundColor: 'transparent',
              '&:hover': {
                backgroundColor: getCssVar('--color-overlay-light'),
              },
              '&.Mui-focused': {
                backgroundColor: getCssVar('--color-overlay-light'),
              },
              '&.MuiFilledInput-underline:before': {
                borderBottomColor: getCssVar('--color-border'),
              },
              '&.MuiFilledInput-underline:hover:before': {
                borderBottomColor: getCssVar('--color-primary'),
              }
            })
          }
        }
      },
    },
  });
};

// Create the themes
const lightTheme = createThemeFromCssVars('light');
const darkTheme = createThemeFromCssVars('dark');

export { lightTheme, darkTheme }; 