import { 
  Typography, 
  TypographyProps, 
  Paper, 
  PaperProps, 
  Box, 
  BoxProps, 
  Chip, 
  ChipProps, 
  useTheme 
} from '@mui/material';
import { styled } from '@mui/material/styles';

/**
 * Display heading - for very large, impactful headings
 */
export const DisplayHeading = styled(Typography)<TypographyProps>(({ theme }) => ({
  fontWeight: 300,
  fontSize: '3rem',
  lineHeight: 1.2,
  marginBottom: theme.spacing(2),
  [theme.breakpoints.down('md')]: {
    fontSize: '2.25rem',
  },
}));

/**
 * Page title with bottom border
 */
export const PageTitle = styled(Typography)<TypographyProps>(({ theme }) => ({
  fontWeight: 600,
  fontSize: '2rem',
  lineHeight: 1.3,
  marginBottom: theme.spacing(3),
  position: 'relative',
  paddingBottom: theme.spacing(1.5),
  '&::after': {
    content: '""',
    position: 'absolute',
    left: 0,
    bottom: 0,
    width: '3rem',
    height: '4px',
    background: theme.palette.primary.main,
    borderRadius: theme.shape.borderRadius,
  },
  [theme.breakpoints.down('md')]: {
    fontSize: '1.75rem',
  },
}));

/**
 * Section heading - for content sections
 */
export const SectionHeading = styled(Typography)<TypographyProps>(({ theme }) => ({
  fontWeight: 600,
  fontSize: '1.5rem',
  lineHeight: 1.4,
  marginBottom: theme.spacing(2),
  color: theme.palette.text.primary,
  [theme.breakpoints.down('md')]: {
    fontSize: '1.25rem',
  },
}));

/**
 * Lead paragraph - for introductory text
 */
export const LeadText = styled(Typography)<TypographyProps>(({ theme }) => ({
  fontSize: '1.125rem',
  lineHeight: 1.6,
  marginBottom: theme.spacing(3),
  color: theme.palette.mode === 'light' 
    ? theme.palette.grey[800] 
    : theme.palette.grey[300],
}));

/**
 * Card with hover effect
 */
export const HoverCard = styled(Paper)<PaperProps>(({ theme }) => ({
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  '&:hover': {
    transform: 'translateY(-4px)',
    boxShadow: theme.shadows[8],
  },
}));

/**
 * Status chip with appropriate colors
 */
interface StatusChipProps extends Omit<ChipProps, 'status'> {
  status: 'success' | 'error' | 'warning' | 'info' | 'default';
}

export const StatusChip = ({ status, ...props }: StatusChipProps) => {
  const theme = useTheme();
  
  const statusColors = {
    success: {
      color: theme.palette.success.main,
      backgroundColor: theme.palette.success.light,
    },
    error: {
      color: theme.palette.error.main,
      backgroundColor: theme.palette.error.light,
    },
    warning: {
      color: theme.palette.warning.main,
      backgroundColor: theme.palette.warning.light,
    },
    info: {
      color: theme.palette.info.main,
      backgroundColor: theme.palette.info.light,
    },
    default: {
      color: theme.palette.grey[700],
      backgroundColor: theme.palette.grey[200],
    },
  };
  
  return (
    <Chip
      {...props}
      sx={{
        borderRadius: '16px',
        fontWeight: 500,
        color: statusColors[status].color,
        backgroundColor: statusColors[status].backgroundColor,
        ...props.sx,
      }}
    />
  );
};

/**
 * Gradient box with customizable gradient
 */
interface GradientBoxProps extends BoxProps {
  gradientStart?: string;
  gradientEnd?: string;
  gradientDirection?: string;
}

export const GradientBox = styled(Box, {
  shouldForwardProp: (prop) => 
    prop !== 'gradientStart' && prop !== 'gradientEnd' && prop !== 'gradientDirection',
})<GradientBoxProps>(({ 
  theme, 
  gradientStart, 
  gradientEnd, 
  gradientDirection = 'to right'
}) => ({
  padding: theme.spacing(3),
  borderRadius: theme.shape.borderRadius,
  color: '#fff',
  backgroundImage: `linear-gradient(${gradientDirection}, ${
    gradientStart || theme.palette.primary.main
  }, ${
    gradientEnd || theme.palette.secondary.main
  })`,
  boxShadow: theme.shadows[3],
}));

/**
 * Text with truncation and tooltip on hover
 */
interface TruncatedTextProps extends TypographyProps {
  lines?: number;
}

export const TruncatedText = styled(Typography, {
  shouldForwardProp: (prop) => prop !== 'lines',
})<TruncatedTextProps>(({lines = 2 }) => ({
  display: '-webkit-box',
  WebkitLineClamp: lines,
  WebkitBoxOrient: 'vertical',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
}));

/**
 * Gradient text
 */
export const GradientText = ({ children, ...props }: TypographyProps) => {
  const theme = useTheme();
  
  return (
    <Typography
      {...props}
      sx={{ 
        backgroundImage: `linear-gradient(to right, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        backgroundClip: 'text',
        color: 'transparent',
        fontWeight: 600,
        ...props.sx
      }}
    >
      {children}
    </Typography>
  );
}; 