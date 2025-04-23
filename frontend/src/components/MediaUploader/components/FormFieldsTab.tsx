import React from "react";
import { 
  Box, 
  Tabs, 
  Tab, 
  Typography,
  Paper
} from "@mui/material";
import DoneIcon from "@mui/icons-material/Done";
import CircleIcon from "@mui/icons-material/Circle";
import FieldLabel from "./FieldLabel";
import FieldInput from "./FieldInput";
import { MediaType } from "../../../store/slices/mediaTypeSlice";
import { TagCategory } from "../../../store/slices/tagCategorySlice";
import { MetadataState } from "../types";
import StandardFields from "./StandardFields";
import { SelectChangeEvent } from "@mui/material";
import "./FormFieldsTab.css";

interface FormFieldsTabProps {
  currentTab: number;
  setCurrentTab: (index: number) => void;
  matchingType: MediaType;
  baseType: string;
  baseFields: Record<string, any>;
  metadata: MetadataState;
  handleMetadataChange: (field: string, value: any) => void;
  tagCategories: TagCategory[];
  hasIncompleteStandardFields: boolean;
  hasIncompleteCustomFields: boolean;
  hasIncompleteBaseFields: boolean;
  isStandardTabComplete: boolean;
  isCustomTabComplete: boolean;
  isBaseTabComplete: boolean;
  showTagFilter: boolean;
  setShowTagFilter: React.Dispatch<React.SetStateAction<boolean>>;
  getAvailableTags: () => string[];
  handleTagsChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  handleTagsBlur: () => void;
  handleTagsKeyDown: (event: React.KeyboardEvent<HTMLInputElement>) => void;
  handleTagCategoryChange: (event: SelectChangeEvent) => void;
  handleTagSearch: (event: React.ChangeEvent<HTMLInputElement>) => void;
  file: File | null;
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel = (props: TabPanelProps) => {
  const { children, value, index, ...other } = props;
  const isActive = value === index;

  return (
    <Box
      role="tabpanel"
      hidden={!isActive}
      id={`media-uploader-tabpanel-${index}`}
      aria-labelledby={`media-uploader-tab-${index}`}
      className={`tab-panel ${isActive ? 'tab-panel-active' : 'tab-panel-inactive'}`}
      {...other}
    >
      {isActive && (
        <Box className="tab-panel-content">
          {children}
        </Box>
      )}
    </Box>
  );
};

const a11yProps = (index: number) => {
  return {
    id: `media-uploader-tab-${index}`,
    'aria-controls': `media-uploader-tabpanel-${index}`,
  };
};

const FormFieldsTab: React.FC<FormFieldsTabProps> = ({
  currentTab,
  setCurrentTab,
  matchingType,
  baseType,
  baseFields,
  metadata,
  handleMetadataChange,
  tagCategories,
  hasIncompleteStandardFields,
  hasIncompleteCustomFields,
  hasIncompleteBaseFields,
  isStandardTabComplete,
  isCustomTabComplete,
  isBaseTabComplete,
  showTagFilter,
  setShowTagFilter,
  getAvailableTags,
  handleTagsChange,
  handleTagsBlur,
  handleTagsKeyDown,
  handleTagCategoryChange,
  handleTagSearch,
  file
}) => {
  const handleChange = (_event: React.SyntheticEvent, newValue: number) => {
    setCurrentTab(newValue);
  };

  return (
    <Box className="fields-container">
      <Box className="tabs-container">
        <Tabs 
          value={currentTab} 
          onChange={handleChange} 
          variant="fullWidth"
          aria-label="form tabs"
        >
          <Tab 
            label={
              <Box className="tab-label">
                <Typography>Standard Information</Typography>
                <Box className="tab-indicator">
                  {isStandardTabComplete ? (
                    <DoneIcon className="complete-icon" />
                  ) : (
                    <CircleIcon 
                      className={hasIncompleteStandardFields ? "incomplete-icon" : "neutral-icon"}
                    />
                  )}
                </Box>
              </Box>
            } 
            {...a11yProps(0)}
          />
          
          {matchingType.fields.length > 0 && (
            <Tab 
              label={
                <Box className="tab-label">
                  <Typography>{matchingType.name} Fields</Typography>
                  <Box className="tab-indicator">
                    {isCustomTabComplete ? (
                      <DoneIcon className="complete-icon" />
                    ) : (
                      <CircleIcon 
                        className={hasIncompleteCustomFields ? "incomplete-icon" : "neutral-icon"}
                      />
                    )}
                  </Box>
                </Box>
              } 
              {...a11yProps(1)}
            />
          )}
          
          {Object.keys(baseFields).length > 0 && (
            <Tab 
              label={
                <Box className="tab-label">
                  <Typography>{baseType.replace('Base', '')} Properties</Typography>
                  <Box className="tab-indicator">
                    {isBaseTabComplete ? (
                      <DoneIcon className="complete-icon" />
                    ) : (
                      <CircleIcon 
                        className={hasIncompleteBaseFields ? "incomplete-icon" : "neutral-icon"}
                      />
                    )}
                  </Box>
                </Box>
              } 
              {...a11yProps(2)}
            />
          )}
        </Tabs>

        <Box className="tab-panels-container">
        <TabPanel value={currentTab} index={0}>
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
        </TabPanel>
        
        <TabPanel value={currentTab} index={1}>
          {matchingType.fields.length > 0 && (
            <Paper className="tab-content-paper" elevation={0} variant="outlined">
              <Box className="fields-grid">
                {matchingType.fields.map((field: any, index) => (
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
            </Paper>
          )}
        </TabPanel>
        
        <TabPanel value={currentTab} index={2}>
          {Object.keys(baseFields).length > 0 ? (
            <Paper className="tab-content-paper" elevation={0} variant="outlined">
              <Box className="fields-grid">
                {Object.entries(baseFields).map(([key, field]) => {
                  // Skip fields that are already populated automatically
                  if ((key === 'imageWidth' || key === 'imageHeight') && 
                      metadata[key] !== undefined) {
                    return (
                      <Box className="field-half-width" key={key}>
                        <FieldLabel 
                          name={key} 
                          required={false} 
                          isValid={true}
                        />
                        <FieldInput
                          field={{ 
                            type: 'text', 
                            required: false,
                            name: key
                          }}
                          keyName={key}
                          metadata={{...metadata, [key]: metadata[key] || "Auto-detected"}}
                          tagCategories={tagCategories}
                          handleMetadataChange={() => {}}
                        />
                      </Box>
                    );
                  }
                  
                  // Use type assertion to solve the 'field is of type unknown' error
                  const fieldWithType = field as {
                    type: string;
                    options?: string[];
                    required?: boolean;
                    name?: string;
                    useTagCategory?: boolean;
                    tagCategoryId?: string;
                  };
                  
                  const isRequired = !!fieldWithType.required;
                  const isEmpty = metadata[key] === undefined || metadata[key] === "";
                  const isValid = isRequired ? !isEmpty : null;
                  
                  // Render appropriate input based on field type
                  return (
                    <Box className="field-half-width" key={key}>
                      <FieldLabel 
                        name={key} 
                        required={isRequired} 
                        isValid={isValid}
                      />
                      <FieldInput
                        field={fieldWithType}
                        keyName={key}
                        metadata={metadata}
                        tagCategories={tagCategories}
                        handleMetadataChange={handleMetadataChange}
                      />
                    </Box>
                  );
                })}
              </Box>
            </Paper>
          ) : (
            <Paper className="empty-tab-content-paper" elevation={0} variant="outlined">
              <Typography variant="body1" className="empty-message">
                No {baseType.replace('Base', '')} specific properties found for this file.
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {baseType === 'Media' 
                  ? "The selected media type doesn't have a specific base type defined."
                  : `Base properties would appear here when you upload a ${baseType.replace('Base', '').toLowerCase()} file.`}
              </Typography>
              <Box className="file-info-box">
                <Typography variant="caption" display="block" align="left">
                  Current file type: {file ? file.type : 'No file selected'}
                </Typography>
                <Typography variant="caption" display="block" align="left">
                  Media type base: {baseType}
                </Typography>
                <Typography variant="caption" display="block" align="left">
                  Expected MIME type: {baseType === 'BaseImage' ? 'image/*' : 
                    baseType === 'BaseVideo' ? 'video/*' : 
                    baseType === 'BaseAudio' ? 'audio/*' : 
                    baseType === 'BaseDocument' ? 'application/pdf' : 'any'}
                </Typography>
              </Box>
            </Paper>
          )}
        </TabPanel>
      </Box>
      
      </Box>
      
      
    </Box>
  );
};

export default FormFieldsTab; 