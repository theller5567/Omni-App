import React, { useMemo } from 'react';
import { Box, Switch, FormGroup, FormControlLabel, styled, Button, ButtonGroup } from '@mui/material';
import './HeaderComponent.scss';
import SearchInput from '../SearchInput/SearchInput';
import { BaseMediaFile } from '../../interfaces/MediaFile';
import { FaPlus } from 'react-icons/fa';
const gridIcon = encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="white" d="M3 3h8v8H3V3zm10 0h8v8h-8V3zM3 13h8v8H3v-8zm10 0h8v8h-8v-8z"/></svg>'
);

const listIcon = encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="white" d="M3 4h18v2H3V9zm0 6h18v2H3v-2zm0 6h18v2H3v-2z"/></svg>'
);

interface HeaderComponentProps {
  view: 'card' | 'list';
  toggleView: () => void;
  mediaFilesData: BaseMediaFile[];
  setSearchQuery: React.Dispatch<React.SetStateAction<string>>;
  selectedMediaType: string;
  handleMediaTypeChange: (type: string) => void;
  onAddMedia: () => void;
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
      backgroundImage: `url('data:image/svg+xml;utf8,${listIcon}')`,
    },
    '&::after': {
      content: '""',
      position: 'absolute',
      top: '50%',
      right: 12,
      transform: 'translateY(-50%)',
      width: 14,
      height: 14,
      backgroundImage: `url('data:image/svg+xml;utf8,${gridIcon}')`,
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

const HeaderComponent: React.FC<HeaderComponentProps> = ({ view, toggleView, mediaFilesData, setSearchQuery, selectedMediaType, handleMediaTypeChange, onAddMedia }) => {
  // Generate media type filters dynamically from the available media types
  const availableMediaTypes = useMemo(() => {
    // Start with 'All' option
    const types = ['All'];
    
    // Add unique media types from data
    mediaFilesData.forEach(file => {
      if (file.mediaType && !types.includes(file.mediaType)) {
        types.push(file.mediaType);
      }
    });
    
    return types;
  }, [mediaFilesData]);

  return (
    <Box
      className="header-component"
      display="flex"
      alignItems="center"
      justifyContent="space-between"
      padding="1rem"
      bgcolor="var(--secondary-color)"
    >
      <Box display="flex" alignItems="center" gap={2}>
        <SearchInput mediaFiles={mediaFilesData} setSearchQuery={setSearchQuery} />
        <ButtonGroup variant="outlined" aria-label="Media type filters">
          {availableMediaTypes.map((type) => (
            <Button
              key={type}
              variant={selectedMediaType === type ? 'contained' : 'outlined'}
              color="primary"
              onClick={() => handleMediaTypeChange(type)}
            >
              {type}
            </Button>
          ))}
          <Button variant="contained" color="secondary" onClick={onAddMedia} startIcon={<FaPlus />}>
            Add Media
          </Button>
        </ButtonGroup>
      </Box>
      <Box display="flex" alignItems="center">
        <FormGroup>
          <FormControlLabel
            control={
              <Android12Switch
                checked={view === 'list'}
                onChange={toggleView}
                className="toggle-switch"
              />
            }
            label={view === 'list' ? 'List' : 'Card'}
          />
        </FormGroup>
      </Box>
    </Box>
  );
};

export default HeaderComponent; 