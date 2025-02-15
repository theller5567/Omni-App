import React from 'react';
import { Box, Typography, Switch, FormControlLabel } from '@mui/material';
import { FaListAlt, FaGripHorizontal } from 'react-icons/fa';

interface HeaderComponentProps {
  view: 'list' | 'grid';
  toggleView: () => void;
}

const HeaderComponent: React.FC<HeaderComponentProps> = ({ view, toggleView }) => {
  return (
    <Box display="flex" justifyContent="space-between" alignItems="center" padding="1rem" bgcolor="var(--secondary-color)">
      <Typography variant="body1" color="var(--text-color)">File name</Typography>
      <Typography variant="body1" color="var(--text-color)">Uploaded by</Typography>
      <Typography variant="body1" color="var(--text-color)">Last modified</Typography>
      <FormControlLabel
        control={
          <Switch
            checked={view === 'list'}
            onChange={toggleView}
            name="viewToggle"
            color="primary"
          />
        }
        label={view === 'grid' ? <FaGripHorizontal /> : <FaListAlt />}
      />
    </Box>
  );
};

export default HeaderComponent; 