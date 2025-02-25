import React from 'react';
import { Box, Switch, FormGroup, FormControlLabel, styled } from '@mui/material';
import './HeaderComponent.scss';

const gridIcon = encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="white" d="M3 3h8v8H3V3zm10 0h8v8h-8V3zM3 13h8v8H3v-8zm10 0h8v8h-8v-8z"/></svg>'
);

const listIcon = encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="white" d="M3 4h18v2H3V9zm0 6h18v2H3v-2zm0 6h18v2H3v-2z"/></svg>'
);

interface HeaderComponentProps {
  view: 'list' | 'grid';
  toggleView: () => void;
}
const Android12Switch = styled(Switch)({
  padding: 8,
  '& .MuiSwitch-track': {
    borderRadius: 22 / 2,
    '&::before': {
      content: '""',
      position: 'absolute',
      top: '50%',
      left: 12,
      transform: 'translateY(-50%)',
      width: 14,
      height: 14,
      backgroundImage: `url('data:image/svg+xml;utf8,${gridIcon}')`,
    },
    '&::after': {
      content: '""',
      position: 'absolute',
      top: '50%',
      right: 12,
      transform: 'translateY(-50%)',
      width: 14,
      height: 14,
      backgroundImage: `url('data:image/svg+xml;utf8,${listIcon}')`,
    },
  },
  '& .MuiSwitch-thumb': {
    boxShadow: 'none',
    width: 16,
    height: 16,
    margin: 2,
    border: '1px solid',
  },
});

const HeaderComponent: React.FC<HeaderComponentProps> = ({ view, toggleView }) => {
  return (
    <Box className="header-component" display="flex" alignItems="center" justifyContent="space-between" padding="1rem" bgcolor="var(--secondary-color)">
      <Box display="flex" alignItems="center">
        
        
      </Box>
      <Box display="flex" alignItems="center">
        <FormGroup>
          <FormControlLabel
            control={
              <Android12Switch
                checked={view === 'grid'}
                onChange={toggleView}
              />
            }
            label={view === 'grid' ? 'Grid' : 'List'}
          />
        </FormGroup>
      </Box>
    </Box>
  );
};

export default HeaderComponent; 