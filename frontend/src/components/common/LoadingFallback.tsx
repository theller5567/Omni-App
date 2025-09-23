import React from 'react';
import { Box, CircularProgress } from '@mui/material';

const LoadingFallback: React.FC<{ size?: number }> = ({ size = 24 }) => (
  <Box display="flex" justifyContent="center" alignItems="center" p={2}>
    <CircularProgress size={size} />
  </Box>
);

export default LoadingFallback;

