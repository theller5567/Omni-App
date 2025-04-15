import { styled } from '@mui/material/styles';
import Typography, { TypographyProps } from '@mui/material/Typography';
import { fontWeights } from '../utils/fontUtils';

/**
 * Display heading - for very large, impactful headings
 */
export const DisplayLarge = styled(Typography)(({ theme }) => ({
  fontSize: 'clamp(2.5rem, 5vw, 3.75rem)',
  fontWeight: fontWeights.bold,
  lineHeight: 1.1,
  letterSpacing: '-0.02em',
  marginBottom: theme.spacing(2),
})) as React.ComponentType<TypographyProps>;

/**
 * Display medium - for large headings
 */
export const DisplayMedium = styled(Typography)(({ theme }) => ({
  fontSize: 'clamp(2rem, 4vw, 3rem)',
  fontWeight: fontWeights.bold,
  lineHeight: 1.1,
  letterSpacing: '-0.015em',
  marginBottom: theme.spacing(2),
})) as React.ComponentType<TypographyProps>;

/**
 * Lead paragraph - for introductory text
 */
export const Lead = styled(Typography)(({ theme }) => ({
  fontSize: 'clamp(1.125rem, 2vw, 1.375rem)',
  fontWeight: fontWeights.medium,
  lineHeight: 1.5,
  letterSpacing: '0',
  color: theme.palette.text.secondary,
  marginBottom: theme.spacing(3),
})) as React.ComponentType<TypographyProps>;

/**
 * Monospace text - for code, data, etc.
 */
export const Monospace = styled(Typography)({
  fontFamily: '"SFMono-Regular", Consolas, "Liberation Mono", Menlo, monospace',
  fontSize: '0.9em',
  letterSpacing: '-0.01em',
}) as React.ComponentType<TypographyProps>;

/**
 * Small text with light weight - for captions, footnotes
 */
export const SmallText = styled(Typography)(({ theme }) => ({
  fontSize: '0.75rem',
  fontWeight: fontWeights.light,
  lineHeight: 1.5,
  color: theme.palette.text.secondary,
})) as React.ComponentType<TypographyProps>;

/**
 * Heading with bottom border 
 */
export const BorderedHeading = styled(Typography)(({ theme }) => ({
  fontWeight: fontWeights.semiBold,
  paddingBottom: theme.spacing(1),
  borderBottom: `1px solid ${theme.palette.divider}`,
  marginBottom: theme.spacing(2),
})) as React.ComponentType<TypographyProps>;

/**
 * Text that truncates with ellipsis if it's too long
 */
export const TruncatedText = styled(Typography)({
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
}) as React.ComponentType<TypographyProps>;

/**
 * Gradient text
 */
export const GradientText = styled(Typography)(({ theme }) => ({
  background: `linear-gradient(90deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
  backgroundClip: 'text',
  WebkitBackgroundClip: 'text',
  WebkitTextFillColor: 'transparent',
  color: theme.palette.primary.main, // Fallback
})) as React.ComponentType<TypographyProps>; 