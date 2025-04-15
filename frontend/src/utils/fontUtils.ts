/**
 * Font utilities for consistent typography throughout the app
 */

export type FontWeight = 
  | 'thin' 
  | 'extraLight' 
  | 'light' 
  | 'regular' 
  | 'medium' 
  | 'semiBold' 
  | 'bold' 
  | 'extraBold'
  | 'black';

export type FontStyle = 'normal' | 'italic';

/**
 * Maps font weight names to their numerical values
 */
export const fontWeights: Record<FontWeight, number> = {
  thin: 100,
  extraLight: 200,
  light: 300,
  regular: 400,
  medium: 500,
  semiBold: 600,
  bold: 700,
  extraBold: 800,
  black: 900
};

/**
 * Primary font family with fallbacks
 */
export const fontFamily = '"Hanken Grotesk", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol"';

/**
 * Font family for variable font (supports font-variation-settings)
 */
export const variableFontFamily = "'Hanken Grotesk Variable', 'Hanken Grotesk', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";

/**
 * Generate font style object for consistent typography
 * 
 * @param weight - Font weight (thin, light, regular, medium, bold, etc.)
 * @param style - Font style (normal or italic)
 * @param size - Font size in rem (default: inherit)
 * @param lineHeight - Line height (default: inherit)
 * @param letterSpacing - Letter spacing (default: inherit)
 * @returns Typography style object
 */
export const getFont = (
  weight: FontWeight = 'regular',
  style: FontStyle = 'normal',
  size?: string,
  lineHeight?: string,
  letterSpacing?: string
): Record<string, string | number> => {
  return {
    fontFamily,
    fontWeight: fontWeights[weight],
    fontStyle: style,
    ...(size && { fontSize: size }),
    ...(lineHeight && { lineHeight }),
    ...(letterSpacing && { letterSpacing })
  };
};

/**
 * Generate a responsive font size that scales with viewport width
 * 
 * @param minSize - Minimum font size (in rem) at small viewport
 * @param maxSize - Maximum font size (in rem) at large viewport
 * @returns CSS clamp value for font size
 */
export const responsiveFontSize = (minSize: number, maxSize: number): string => {
  return `clamp(${minSize}rem, calc(${minSize}rem + ${maxSize - minSize} * ((100vw - 320px) / 1600)), ${maxSize}rem)`;
};

/**
 * Common text styles for reuse throughout the app
 */
export const textStyles = {
  h1: getFont('light', 'normal', '2.5rem', '2', '-0.01em'),
  h2: getFont('bold', 'normal', '2rem', '1.2', '-0.01em'),
  h3: getFont('semiBold', 'normal', '1.75rem', '1.3', '-0.005em'),
  h4: getFont('semiBold', 'normal', '1.5rem', '1.3', '-0.005em'),
  h5: getFont('medium', 'normal', '1.25rem', '1.4', '0em'),
  h6: getFont('medium', 'normal', '1.1rem', '1.4', '0em'),
  body1: getFont('regular', 'normal', '1rem', '1.5', '0.01em'),
  body2: getFont('regular', 'normal', '0.875rem', '1.5', '0.01em'),
  caption: getFont('light', 'normal', '0.75rem', '1.5', '0.02em'),
  button: getFont('medium', 'normal', '0.875rem', '1.5', '0.05em'),
};

/**
 * Font sizes map (in rem units)
 */
export const fontSizes = {
  xs: '0.75rem',    // 12px
  sm: '0.875rem',   // 14px
  md: '1rem',       // 16px (base)
  lg: '1.125rem',   // 18px
  xl: '1.25rem',    // 20px
  '2xl': '1.5rem',  // 24px
  '3xl': '1.875rem', // 30px
  '4xl': '2.25rem', // 36px
  '5xl': '3rem',    // 48px
  '6xl': '3.75rem', // 60px
  '7xl': '4.5rem',  // 72px
  '8xl': '6rem',    // 96px
  '9xl': '8rem',    // 128px
} as const;

/**
 * Line heights for various text elements
 */
export const lineHeights = {
  none: 1,
  tight: 1.25,
  snug: 1.375,
  normal: 1.5,
  relaxed: 1.625,
  loose: 2,
} as const;

/**
 * Letter spacing options
 */
export const letterSpacings = {
  tighter: '-0.05em',
  tight: '-0.025em',
  normal: '0',
  wide: '0.025em',
  wider: '0.05em',
  widest: '0.1em',
} as const;

/**
 * Creates a fluid typography value that scales between min and max
 * based on viewport width
 * 
 * @param minSize - The minimum font size (in rem)
 * @param maxSize - The maximum font size (in rem)
 * @param minWidth - The minimum viewport width (in px)
 * @param maxWidth - The maximum viewport width (in px)
 * @returns A CSS clamp expression as a string
 */
export const fluidTypography = (
  minSize: number,
  maxSize: number,
  minWidth: number = 320,
  maxWidth: number = 1200
): string => {
  // Convert the min and max sizes to rem values assuming 16px base
  const minSizeRem = minSize / 16;
  const maxSizeRem = maxSize / 16;
  
  // Calculate the slope (how quickly the font size grows)
  const slope = (maxSize - minSize) / (maxWidth - minWidth);
  
  // Calculate the viewport-based size
  const viewportBased = `${minSizeRem}rem + ${slope * 100}vw`;
  
  // Use CSS clamp to set minimum and maximum sizes
  return `clamp(${minSizeRem}rem, ${viewportBased}, ${maxSizeRem}rem)`;
}; 