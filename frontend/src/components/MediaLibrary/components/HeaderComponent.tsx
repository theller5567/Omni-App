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
      flexDirection={isMobile ? 'column' : 'row'}
      alignItems={isMobile ? 'stretch' : 'center'}
      gap={isMobile ? 1 : 2}
      sx={{ px: isMobile ? 1 : 0, width: '100%' }}
    >
      {/* Add Media */}
      <Button 
        variant="contained" 
        color="secondary" 
        onClick={onAddMedia} 
        startIcon={<FaPlus />}
        fullWidth={isMobile}
        sx={{ height: 56 }}
      >
        Add Media
      </Button>

      {/* Search */}
      <Box sx={{ flex: 1 }}>
        <SearchInput mediaFiles={mediaFilesData} setSearchQuery={setSearchQuery} />
      </Box>

      {/* MediaType + Toggle on the same row segment */}
      <Box display="flex" alignItems="center" gap={1} minWidth={isMobile ? 'auto' : 320} sx={{ width: isMobile ? '100%' : 'auto' }}>
        <Select
          value={selectedMediaType}
          onChange={(e) => handleMediaTypeChange(e.target.value)}
          displayEmpty
          aria-label="Filter by media type"
          sx={{ flex: 1, minWidth: isMobile ? 'auto' : 220, height: 56 }}
          renderValue={(value) => (!value || value === 'All' ? 'All media types' : String(value))}
        >
          {availableMediaTypes.map((type) => {
            const label = type === 'All' ? 'All media types' : type;
            return (
              <MenuItem key={type} value={type}>{label}</MenuItem>
            );
          })}
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