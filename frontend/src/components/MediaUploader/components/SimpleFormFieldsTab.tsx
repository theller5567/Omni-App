import React from "react";
import { 
  Box, 
  Typography,
  Paper
} from "@mui/material";
import FieldLabel from "./FieldLabel";
import FieldInput from "./FieldInput";
import { MediaType } from "../../../store/slices/mediaTypeSlice";
import { TagCategory } from "../../../store/slices/tagCategorySlice";
import { MetadataState } from "../types";
import StandardFields from "./StandardFields";
import { SelectChangeEvent } from "@mui/material";
import "./FormFieldsTab.css";

interface SimpleFormFieldsTabProps {
  metadata: MetadataState;
  handleMetadataChange: (field: string, value: any) => void;
  isCustomSection?: boolean;
  mediaType?: MediaType | null;
  tagCategories?: TagCategory[];
  showTagFilter?: boolean;
  setShowTagFilter?: React.Dispatch<React.SetStateAction<boolean>>;
  getAvailableTags?: () => string[];
  handleTagsChange?: (event: React.ChangeEvent<HTMLInputElement>) => void;
  handleTagsBlur?: () => void;
  handleTagsKeyDown?: (event: React.KeyboardEvent<HTMLInputElement>) => void;
  handleTagCategoryChange?: (event: SelectChangeEvent) => void;
  handleTagSearch?: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

const SimpleFormFieldsTab: React.FC<SimpleFormFieldsTabProps> = ({
  metadata,
  handleMetadataChange,
  isCustomSection = false,
  mediaType = null,
  tagCategories = [],
  showTagFilter = false,
  setShowTagFilter = () => {},
  getAvailableTags = () => [],
  handleTagsChange = () => {},
  handleTagsBlur = () => {},
  handleTagsKeyDown = () => {},
  handleTagCategoryChange = () => {},
  handleTagSearch = () => {}
}) => {
  return (
    <Box className="fields-container">
      {!isCustomSection ? (
        // Standard fields
        <Paper className="tab-content-paper" elevation={0} variant="outlined">
          <StandardFields 
            metadata={metadata}
            handleMetadataChange={handleMetadataChange}
            showTagFilter={showTagFilter}
            setShowTagFilter={setShowTagFilter}
            tagCategories={tagCategories}
            getAvailableTags={getAvailableTags}
            handleTagsChange={handleTagsChange}
            handleTagsBlur={handleTagsBlur}
            handleTagsKeyDown={handleTagsKeyDown}
            handleTagCategoryChange={handleTagCategoryChange}
            handleTagSearch={handleTagSearch}
          />
        </Paper>
      ) : (
        // Custom fields specific to the media type
        <Paper className="tab-content-paper" elevation={0} variant="outlined">
          {mediaType && mediaType.fields && mediaType.fields.length > 0 ? (
            <Box className="fields-grid">
              {mediaType.fields.map((field: any, index) => (
                <Box 
                  className={field.type === 'TextArea' ? 'field-full-width' : 'field-half-width'}
                  key={`${field.name}-${index}`}
                >
                  <FieldLabel 
                    name={field.name} 
                    required={field.required} 
                    isValid={field.required ? (metadata[field.name] ? true : false) : null}
                  />
                  <FieldInput
                    field={field}
                    keyName={field.name}
                    metadata={metadata}
                    tagCategories={tagCategories}
                    handleMetadataChange={handleMetadataChange}
                  />
                </Box>
              ))}
            </Box>
          ) : (
            <Typography variant="body1" className="empty-message" align="center">
              No custom fields for this media type.
            </Typography>
          )}
        </Paper>
      )}
    </Box>
  );
};

export default SimpleFormFieldsTab; 