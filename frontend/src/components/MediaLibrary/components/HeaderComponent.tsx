import React, { useMemo } from 'react';
import { Box, ToggleButtonGroup, ToggleButton, Button, useMediaQuery, Theme, Select, MenuItem } from '@mui/material';
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
  // Check if we're on mobile
  const isMobile = useMediaQuery((theme: Theme) => theme.breakpoints.down('sm'));
  
  // Generate media type filters dynamically from the available media types
  const availableMediaTypes = useMemo(() => {
    // Start with 'All' option
    const types = ['All'];
    
    // Add unique media types from data
    mediaFilesData.forEach(file => {
      const label = (file as any).mediaTypeName || file.mediaType;
      if (label && !types.includes(label)) {
        types.push(label);
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
      <Box display="flex" alignItems={isMobile ? "stretch" : "center"} gap={2} flexDirection={isMobile ? "column" : "row"} width="100%">
        <SearchInput mediaFiles={mediaFilesData} setSearchQuery={setSearchQuery} />
        <span>Filter by Media Type:</span>
        <Select
          value={selectedMediaType}
          onChange={(e) => handleMediaTypeChange(e.target.value)}
          displayEmpty
          sx={{ minWidth: isMobile ? '100%' : 200, textAlign: 'left', height: '100%' }}
          renderValue={(value) => value || 'All'}
        >
          {availableMediaTypes.map((type) => (
            <MenuItem key={type} value={type}>{type}</MenuItem>
          ))}
        </Select>
        {/* <ButtonGroup 
          variant="outlined" 
          aria-label="Media type filters"
          orientation={isMobile ? "vertical" : "horizontal"}
          sx={{ width: isMobile ? '100%' : 'auto' }}
        >
          {availableMediaTypes.map((type) => (
            <Button
              key={type}
              variant={selectedMediaType === type ? 'contained' : 'outlined'}
              color="primary"
              onClick={() => handleMediaTypeChange(type)}
              fullWidth={isMobile}
            >
              {type}
            </Button>
          ))}
        </ButtonGroup> */}
        <Button 
          variant="contained" 
          color="secondary" 
          onClick={onAddMedia} 
          startIcon={<FaPlus />}
          fullWidth={isMobile}
          sx={{ 
            order: isMobile ? -1 : 0,
            height: '100%',
          }}
        >
          Add Media
        </Button>
      </Box>
      <Box display="flex" alignItems="center" sx={{ mt: isMobile ? 2 : 0 }}>
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