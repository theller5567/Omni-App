import React, { useEffect } from 'react';
import {
  Box, 
  Typography,
  Tabs,
  Tab,
  SelectChangeEvent
} from '@mui/material';
import { MetadataState } from '../types';
import SimpleFormFieldsTab from "./SimpleFormFieldsTab";
import RelatedMediaSection from "./RelatedMediaSection";
import { MediaType } from "../../../store/slices/mediaTypeSlice";
import { TagCategory } from "../../../store/slices/tagCategorySlice";
import { 
  hasIncompleteStandardFields, 
  hasIncompleteCustomFields, 
  findMediaType,
  supportsRelatedMedia as checkRelatedMediaSupport
} from "../utils";

interface MetadataFormProps {
  mediaTypes: MediaType[];
  selectedMediaType: string;
  file: File | null;
  metadata: MetadataState;
  handleMetadataChange: (field: string, value: any) => void;
  tagCategories: TagCategory[];
  showTagFilter: boolean;
  setShowTagFilter: React.Dispatch<React.SetStateAction<boolean>>;
  getAvailableTags: () => string[];
  handleTagsChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  handleTagsBlur: () => void;
  handleTagsKeyDown: (event: React.KeyboardEvent<HTMLInputElement>) => void;
  handleTagCategoryChange: (event: SelectChangeEvent) => void;
  handleTagSearch: (event: React.ChangeEvent<HTMLInputElement>) => void;
  currentTab: number;
  setCurrentTab: React.Dispatch<React.SetStateAction<number>>;
}

const MetadataForm: React.FC<MetadataFormProps> = ({
  mediaTypes,
  selectedMediaType,
  file,
  metadata,
  handleMetadataChange,
  tagCategories,
  showTagFilter,
  setShowTagFilter,
  getAvailableTags,
  handleTagsChange,
  handleTagsBlur,
  handleTagsKeyDown,
  handleTagCategoryChange,
  handleTagSearch,
  currentTab,
  setCurrentTab
}) => {
  
  // Find the selected media type
  const currentMediaType = findMediaType(mediaTypes, selectedMediaType);
  
  // Validate media fields
  const hasStandardErrors = hasIncompleteStandardFields(metadata);
  const hasCustomErrors = hasIncompleteCustomFields(metadata, currentMediaType);
  
  // Check if the current media type supports related media
  const supportsRelatedMedia = checkRelatedMediaSupport(currentMediaType);

  // Determine tab labels and status indicators
  const tabLabels = {
    0: hasStandardErrors ? "Basic Info ⚠️" : "Basic Info",
    1: hasCustomErrors ? "Media Fields ⚠️" : "Media Fields",
    2: "Related Media" 
  };
  
  // Handle tab change
  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    // Don't let users navigate to related media tab if it's not supported
    if (newValue === 2 && !supportsRelatedMedia) {
      return;
    }
    setCurrentTab(newValue);
  };
  
  // Reset to first tab if currently on related media tab but type changed to one that doesn't support it
  useEffect(() => {
    if (currentTab === 2 && !supportsRelatedMedia) {
      setCurrentTab(0);
    }
  }, [currentTab, supportsRelatedMedia, setCurrentTab]);
  
  return (
    <Box sx={{ width: "100%", height: "100%", display: "flex", flexDirection: "column" }}>
      <Typography variant="h6" sx={{ mb: 2 }}>
        Add Metadata for {file?.name}
      </Typography>
      
      <Box sx={{ borderBottom: 1, borderColor: "divider", mb: 2 }}>
        <Tabs
          value={currentTab}
          onChange={handleTabChange}
          aria-label="metadata tabs"
          variant="fullWidth"
          sx={{ mb: 1 }}
        >
          <Tab label={tabLabels[0]} />
          <Tab label={tabLabels[1]} />
          {supportsRelatedMedia && <Tab label={tabLabels[2]} />}
        </Tabs>
      </Box>
      
      <Box sx={{ flexGrow: 1, overflow: "auto", pb: 2 }}>
        {currentTab === 0 && (
          <SimpleFormFieldsTab
            metadata={metadata}
            handleMetadataChange={handleMetadataChange}
            tagCategories={tagCategories}
            showTagFilter={showTagFilter}
            setShowTagFilter={setShowTagFilter}
            getAvailableTags={getAvailableTags}
            handleTagsChange={handleTagsChange}
            handleTagsBlur={handleTagsBlur}
            handleTagsKeyDown={handleTagsKeyDown}
            handleTagCategoryChange={handleTagCategoryChange}
            handleTagSearch={handleTagSearch}
            isCustomSection={false}
          />
        )}
        
        {currentTab === 1 && (
          <SimpleFormFieldsTab
            metadata={metadata}
            handleMetadataChange={handleMetadataChange}
            mediaType={currentMediaType}
            tagCategories={tagCategories}
            isCustomSection={true}
          />
        )}
        
        {currentTab === 2 && supportsRelatedMedia && (
          <RelatedMediaSection
            metadata={metadata}
            handleMetadataChange={handleMetadataChange}
          />
        )}
      </Box>
    </Box>
  );
};

export default MetadataForm; 