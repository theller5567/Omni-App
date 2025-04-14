import React from 'react';
import { ToggleButtonGroup, ToggleButton, Box, Typography } from '@mui/material';
import { FaList, FaTh } from 'react-icons/fa';
import './viewModeToggle.scss';

interface ViewModeToggleProps {
  viewMode: 'list' | 'card';
  toggleViewMode: (newViewMode: 'list' | 'card') => void;
  showLabel?: boolean;
}

const ViewModeToggle: React.FC<ViewModeToggleProps> = ({ viewMode, toggleViewMode, showLabel = false }) => {
  const handleChange = (_event: React.MouseEvent<HTMLElement>, newViewMode: string | null) => {
    if (newViewMode !== null) {
      toggleViewMode(newViewMode as 'list' | 'card');
    }
  };

  return (
    <Box className="view-mode-toggle" sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
      {showLabel && (
        <Typography variant="body2" color="textSecondary">
          Default View Mode
        </Typography>
      )}
      <ToggleButtonGroup
        value={viewMode}
        exclusive
        onChange={handleChange}
        aria-label="view mode"
        size="small"
      >
        <ToggleButton value="list" aria-label="list view" title="List View">
          <FaList size={16} />
        </ToggleButton>
        <ToggleButton value="card" aria-label="card view" title="Card View">
          <FaTh size={16} />
        </ToggleButton>
      </ToggleButtonGroup>
    </Box>
  );
};

export default ViewModeToggle; 