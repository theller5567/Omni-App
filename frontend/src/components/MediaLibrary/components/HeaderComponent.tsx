import React, { useMemo } from 'react';
import { Box, ToggleButtonGroup, ToggleButton, Button, ButtonGroup } from '@mui/material';
import '../HeaderComponent.scss';
import SearchInput from '../../SearchInput/SearchInput';
import { BaseMediaFile } from '../../../interfaces/MediaFile';
import { FaPlus, FaList, FaThLarge } from 'react-icons/fa';

interface HeaderComponentProps {
  view: 'card' | 'list';
  toggleView: () => void;
  mediaFilesData: BaseMediaFile[];
  setSearchQuery: React.Dispatch<React.SetStateAction<string>>;
  selectedMediaType: string;
  handleMediaTypeChange: (type: string) => void;
  onAddMedia: () => void;
}

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
        <ToggleButtonGroup
          value={view}
          exclusive
          onChange={() => toggleView()}
          aria-label="view mode"
          size="small"
        >
          <ToggleButton value="card" aria-label="grid view" title="Grid View">
            <FaThLarge size={16} />
          </ToggleButton>
          <ToggleButton value="list" aria-label="list view" title="List View">
            <FaList size={16} />
          </ToggleButton>
        </ToggleButtonGroup>
      </Box>
    </Box>
  );
};

export default HeaderComponent; 