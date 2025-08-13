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
      flexDirection="column"
      gap={isMobile ? 1 : 2}
      sx={{ px: isMobile ? 1 : 0, width: '100%' }}
    >
      {/* Row 1: Add Media (full) + Search (full) on mobile; on desktop they sit inline */}
      <Box display="flex" gap={isMobile ? 1 : 2} flexDirection={isMobile ? 'column' : 'row'} width="100%">
        <Button 
          variant="contained" 
          color="secondary" 
          onClick={onAddMedia} 
          startIcon={<FaPlus />}
          fullWidth={isMobile}
          sx={{ height: 44 }}
        >
          Add Media
        </Button>
        <Box sx={{ flex: 1 }}>
          <SearchInput mediaFiles={mediaFilesData} setSearchQuery={setSearchQuery} />
        </Box>
      </Box>

      {/* Row 2: MediaType Select + View Toggle on same row */}
      <Box display="flex" alignItems="center" gap={1} width="100%">
        <Select
          value={selectedMediaType}
          onChange={(e) => handleMediaTypeChange(e.target.value)}
          displayEmpty
          aria-label="Filter by media type"
          sx={{ flex: 1, minWidth: isMobile ? 'auto' : 220, height: 44 }}
          renderValue={(value) => value || 'All'}
        >
          {availableMediaTypes.map((type) => (
            <MenuItem key={type} value={type}>{type}</MenuItem>
          ))}
        </Select>
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