import React from "react";
import { Box, Typography } from "@mui/material";
import FormFieldsTab from "./FormFieldsTab";
import { MediaType } from "../../../store/slices/mediaTypeSlice";
import { TagCategory } from "../../../store/slices/tagCategorySlice";
import { MetadataState } from "../types";
import { 
  hasIncompleteStandardFields, 
  hasIncompleteCustomFields, 
  hasIncompleteBaseFields, 
  getBaseFieldsForMimeType,
  findMediaType
} from "../utils";
import { SelectChangeEvent } from "@mui/material";

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
  const matchingType = findMediaType(mediaTypes, selectedMediaType);
  
  if (!matchingType) {
    return <Typography color="error">Media type not found. Please select a valid media type.</Typography>;
  }

  // Determine if this media type has a base type
  const baseType = matchingType.baseType || 'Media';
  const includeBaseFields = matchingType.includeBaseFields !== false;
  
  console.log('MetadataForm - Media type:', matchingType.name);
  console.log('MetadataForm - Base type:', baseType);
  console.log('MetadataForm - Include base fields:', includeBaseFields);
  console.log('MetadataForm - File:', file ? `${file.name} (${file.type})` : 'No file');
  
  // Get base fields if a file is selected and we should include base fields
  let baseFields = {};
  if (file && baseType !== 'Media' && includeBaseFields) {
    // Get the appropriate MIME type prefix based on the base type
    let mimeTypePrefix = '';
    switch (baseType) {
      case 'BaseImage': mimeTypePrefix = 'image/'; break;
      case 'BaseVideo': mimeTypePrefix = 'video/'; break;
      case 'BaseAudio': mimeTypePrefix = 'audio/'; break;
      case 'BaseDocument': mimeTypePrefix = 'application/pdf'; break;
    }
    
    console.log('MetadataForm - MIME type prefix:', mimeTypePrefix);
    
    // Get base fields if the file type matches the base type
    const fileCategory = file.type.split('/')[0];
    const baseCategory = mimeTypePrefix.split('/')[0];
    
    console.log('MetadataForm - File category:', fileCategory);
    console.log('MetadataForm - Base category:', baseCategory);
    console.log('MetadataForm - Categories match:', fileCategory === baseCategory);
    
    if (fileCategory === baseCategory) {
      baseFields = getBaseFieldsForMimeType(file.type);
      console.log('MetadataForm - Base fields generated:', Object.keys(baseFields).length);
    } else {
      console.log('MetadataForm - No base fields for this file type');
    }
  } else {
    console.log('MetadataForm - Conditions not met for base fields:', { 
      hasFile: !!file, 
      baseTypeNotMedia: baseType !== 'Media', 
      includeBaseFields 
    });
  }
  
  console.log('MetadataForm - Final baseFields:', Object.keys(baseFields).length, 'fields');

  // Check if various field types are incomplete
  const incompleteStandardFields = hasIncompleteStandardFields(metadata);
  const incompleteCustomFields = hasIncompleteCustomFields(metadata, matchingType);
  const incompleteBaseFields = hasIncompleteBaseFields(metadata, baseFields);
  
  // Check if all tabs are complete
  const isStandardTabComplete = !incompleteStandardFields;
  const isCustomTabComplete = !incompleteCustomFields;
  const isBaseTabComplete = !incompleteBaseFields;

  return (
    <FormFieldsTab
      currentTab={currentTab}
      setCurrentTab={setCurrentTab}
      matchingType={matchingType}
      baseType={baseType}
      baseFields={baseFields}
      metadata={metadata}
      handleMetadataChange={handleMetadataChange}
      tagCategories={tagCategories}
      hasIncompleteStandardFields={incompleteStandardFields}
      hasIncompleteCustomFields={incompleteCustomFields}
      hasIncompleteBaseFields={incompleteBaseFields}
      isStandardTabComplete={isStandardTabComplete}
      isCustomTabComplete={isCustomTabComplete}
      isBaseTabComplete={isBaseTabComplete}
      showTagFilter={showTagFilter}
      setShowTagFilter={setShowTagFilter}
      getAvailableTags={getAvailableTags}
      handleTagsChange={handleTagsChange}
      handleTagsBlur={handleTagsBlur}
      handleTagsKeyDown={handleTagsKeyDown}
      handleTagCategoryChange={handleTagCategoryChange}
      handleTagSearch={handleTagSearch}
      file={file}
    />
  );
};

export default MetadataForm; 