import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Stepper,
  Step,
  StepLabel,
  TextField,
  Select,
  MenuItem,
  IconButton,
  List,
  ListItem,
  ListItemText,
  Checkbox,
  FormControlLabel,
  Typography,
  Chip,
  Box,
  InputLabel,
  FormControl
} from '@mui/material';
import { useDispatch, useSelector } from 'react-redux';
import { addMediaType } from '../store/slices/mediaTypeSlice';
import { toast } from 'react-toastify';
import axios from 'axios';
import { FaPlus, FaCheck, FaExclamationCircle, FaTimes, FaEdit, FaStar, FaImage, FaVideo, FaFileAudio, FaFileWord, FaArrowRight, FaArrowLeft, FaSave } from 'react-icons/fa';
import CloseIcon from '@mui/icons-material/Close';
import { 
  MediaTypeConfig, 
  MediaTypeField, 
  FieldType, 
  isSelectField, 
  transformConfigToApiData, 
  ApiMediaTypeResponse,
  createField,
  MediaTypeState,
  SelectField,
  updateFieldOptions
} from '../types/mediaTypes';
import './MediaTypeUploader.scss';
import env from '../config/env';
import { RootState } from '../store/store';

interface MediaTypeUploaderProps {
  open: boolean;
  onClose: () => void;
}

// Define common file type categories and their MIME types
interface FileTypeCategory {
  name: string;
  label: string;
  icon: React.ReactNode;
  mimeTypes: string[];
}

const fileTypeCategories: FileTypeCategory[] = [
  { 
    name: 'images', 
    label: 'Images', 
    icon: <FaImage />, 
    mimeTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/svg+xml', 'image/webp'] 
  },
  { 
    name: 'videos', 
    label: 'Videos', 
    icon: <FaVideo />, 
    mimeTypes: ['video/mp4', 'video/webm', 'video/ogg', 'video/quicktime'] 
  },
  { 
    name: 'audio', 
    label: 'Audio', 
    icon: <FaFileAudio />, 
    mimeTypes: ['audio/mpeg', 'audio/ogg', 'audio/wav', 'audio/webm'] 
  },
  { 
    name: 'documents', 
    label: 'Documents', 
    icon: <FaFileWord />, 
    mimeTypes: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain'] 
  }
];

// Update FieldType to include new types
type ExtendedFieldType = 'Text' | 'TextArea' | 'Number' | 'Date' | 'Boolean' | 'Select' | 'MultiSelect';

// Available field types
const inputOptions: ExtendedFieldType[] = ['Text', 'TextArea', 'Number', 'Date', 'Boolean', 'Select', 'MultiSelect'];

// Define predefined colors for the media types
const predefinedColors = [
  { name: 'Red', hex: '#f44336' },
  { name: 'Pink', hex: '#e91e63' },
  { name: 'Purple', hex: '#9c27b0' },
  { name: 'Deep Purple', hex: '#673ab7' },
  { name: 'Indigo', hex: '#3f51b5' },
  { name: 'Blue', hex: '#2196f3' },
  { name: 'Light Blue', hex: '#03a9f4' },
  { name: 'Cyan', hex: '#00bcd4' },
  { name: 'Teal', hex: '#009688' },
  { name: 'Green', hex: '#4caf50' },
  { name: 'Light Green', hex: '#8bc34a' },
  { name: 'Lime', hex: '#cddc39' },
  { name: 'Yellow', hex: '#ffeb3b' },
  { name: 'Amber', hex: '#ffc107' },
  { name: 'Orange', hex: '#ff9800' },
  { name: 'Deep Orange', hex: '#ff5722' },
  { name: 'Brown', hex: '#795548' },
  { name: 'Grey', hex: '#9e9e9e' },
  { name: 'Blue Grey', hex: '#607d8b' }
];

// Extend MediaTypeConfig interface
interface ExtendedMediaTypeConfig extends MediaTypeConfig {
  catColor?: string;
  _id?: string;
}

const initialMediaTypeConfig: ExtendedMediaTypeConfig = {
  name: '',
  fields: [],
  baseType: 'Media',
  includeBaseFields: true,
  acceptedFileTypes: [],
  status: 'active',
  catColor: '#2196f3', // Default blue color
  _id: undefined
};

// const baseSchemaFields = {
//   fileName: { type: 'Text', required: true, description: 'Name of the file' },
//   altText: { type: 'Text', required: false, description: 'Alternative text for accessibility' },
//   description: { type: 'Text', required: false, description: 'Description of the media' },
//   visibility: { type: 'Select', required: true, options: ['public', 'private'], description: 'Visibility setting' },
//   tags: { type: 'Array', required: false, description: 'Tags for categorization' }
// };

// Define step constants outside component
const STEP_NAME = 0;
const STEP_FIELDS = 1;
const STEP_REVIEW = 2;

// Create a simple color picker component
const ColorPicker: React.FC<{
  value: string;
  onChange: (color: string) => void;
  usedColors?: string[];
}> = ({ value, onChange, usedColors = [] }) => {
  return (
    <FormControl fullWidth>
      <InputLabel id="color-select-label">Select Color</InputLabel>
      <Select
        labelId="color-select-label"
        id="color-select"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        label="Select Color"
        renderValue={(selected) => {
          const color = predefinedColors.find(c => c.hex === selected);
          return (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Box sx={{ 
                width: 20, 
                height: 20, 
                bgcolor: selected, 
                borderRadius: '50%', 
                border: '1px solid rgba(0, 0, 0, 0.1)'
              }} />
              {color?.name || selected}
            </Box>
          );
        }}
      >
        {predefinedColors.map((color) => {
          const isUsed = usedColors.includes(color.hex) && value !== color.hex;
          return (
            <MenuItem 
              key={color.hex} 
              value={color.hex}
              disabled={isUsed}
              sx={{ opacity: isUsed ? 0.5 : 1 }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Box sx={{ 
                  width: 24, 
                  height: 24, 
                  bgcolor: color.hex, 
                  borderRadius: '50%', 
                  border: '1px solid rgba(0, 0, 0, 0.1)'
                }} />
                <Typography>
                  {color.name}
                  {isUsed && <Typography component="span" variant="caption" color="error"> (in use)</Typography>}
                </Typography>
              </Box>
            </MenuItem>
          );
        })}
      </Select>
    </FormControl>
  );
};

// Fix the type issue with mediaTypes by extending MediaTypeState
interface MediaTypeWithColor extends MediaTypeState {
  catColor?: string;
}

const MediaTypeUploader: React.FC<MediaTypeUploaderProps> = ({ open, onClose }) => {
  const dispatch = useDispatch();
  const mediaTypes = useSelector((state: RootState) => state.mediaTypes.mediaTypes) as MediaTypeWithColor[];
  
  // State for media type configuration
  const [mediaTypeConfig, setMediaTypeConfig] = useState<ExtendedMediaTypeConfig>(initialMediaTypeConfig);

  // State for field editing
  const [currentField, setCurrentField] = useState<MediaTypeField>(createField('Text'));
  const [options, setOptions] = useState<string[]>([]);
  const [optionInput, setOptionInput] = useState('');
  const [editingFieldIndex, setEditingFieldIndex] = useState<number | null>(null);

  // UI state
  const [activeStep, setActiveStep] = useState(STEP_NAME);
  const [isEditing, setIsEditing] = useState(false);
  const [activeField, setActiveField] = useState<number | null>(null);

  const steps = ['Name Media Type', 'Add Fields', 'Review & Submit'];

  // Get used colors from existing media types - improve the filtering logic
  const usedColors = React.useMemo(() => {
    return mediaTypes
      .filter(type => mediaTypeConfig._id !== type._id)
      .map(type => type.catColor)
      .filter(Boolean) as string[];
  }, [mediaTypes, mediaTypeConfig._id]);

  const handleNext = () => {
    // Only validate name and file types in step 1
    if (activeStep === STEP_NAME) {
      if (mediaTypeConfig.name.trim() === '' || mediaTypeConfig.acceptedFileTypes.length === 0) {
        toast.error('Please provide a name and select at least one accepted file type');
        return;
      }
    }
    
    // No validation for step 2 - fields are optional
    
    setActiveStep((prev) => prev + 1);
  };

  const handleBack = () => setActiveStep((prev) => prev - 1);

  const handleAddField = () => {
    if (currentField.name.trim()) {
      let newField: MediaTypeField;
      
      if (isSelectField(currentField)) {
        newField = {
          ...currentField,
          options: [...options]
        };
      } else {
        newField = currentField;
      }
      
      if (editingFieldIndex !== null) {
        const updatedFields = [...mediaTypeConfig.fields];
        updatedFields[editingFieldIndex] = newField;
        setMediaTypeConfig(prev => ({ ...prev, fields: updatedFields }));
        setEditingFieldIndex(null);
      } else {
        setMediaTypeConfig(prev => ({ ...prev, fields: [...prev.fields, newField] }));
      }
      
      console.log('submitted', newField);
      resetFieldForm();
    } else {
      toast.error('Field name is required');
    }
  };

  const handleEditField = (index: number) => {
    const field = mediaTypeConfig.fields[index];
    setCurrentField(field);
    if (isSelectField(field)) {
      setOptions(field.options);
    } else {
      setOptions([]);
    }
    setIsEditing(true);
    setEditingFieldIndex(index);
  };


  const handleRemoveField = (index: number) => {
    const updatedFields = mediaTypeConfig.fields.filter((_, i) => i !== index);
    setMediaTypeConfig(prev => ({ ...prev, fields: updatedFields }));
    if (editingFieldIndex === index) {
      resetFieldForm();
    }
  };

  const handleAddOption = () => {
    if (optionInput.trim() && isSelectField(currentField)) {
      const newOptions = [...currentField.options, optionInput.trim()];
      setOptions(newOptions);
      setCurrentField(updateFieldOptions(currentField, newOptions));
      setOptionInput('');
    }
  };

  const handleRemoveOption = (index: number) => {
    if (isSelectField(currentField)) {
      const newOptions = currentField.options.filter((_, i) => i !== index);
      setOptions(newOptions);
      setCurrentField(updateFieldOptions(currentField, newOptions));
    }
  };

  const handleFileTypeCategoryChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const categoryName = event.target.name;
    const isChecked = event.target.checked;
    
    // Find the category
    const category = fileTypeCategories.find(cat => cat.name === categoryName);
    
    if (category) {
      if (isChecked) {
        // Add all MIME types from this category
        setMediaTypeConfig(prev => ({
          ...prev,
          acceptedFileTypes: [...prev.acceptedFileTypes, ...category.mimeTypes]
        }));
      } else {
        // Remove all MIME types from this category
        setMediaTypeConfig(prev => ({
          ...prev,
          acceptedFileTypes: prev.acceptedFileTypes.filter(type => !category.mimeTypes.includes(type))
        }));
      }
    }
  };

  const handleSaveMediaType = async () => {
    try {
      if (!mediaTypeConfig.name || !mediaTypeConfig.fields?.length || !mediaTypeConfig.acceptedFileTypes?.length) {
        toast.error('Please fill in all required fields');
        return;
      }

      // Create API data from the media type config
      const apiData = {
        ...transformConfigToApiData(mediaTypeConfig),
        catColor: mediaTypeConfig.catColor || '#2196f3' // Ensure catColor is included
      };
      
      console.log('Saving media type with color:', apiData);

      const response = await axios.post<ApiMediaTypeResponse>(
        `${env.BASE_URL}/api/media-types`,
        apiData
      );

      // Add catColor to the store data
      const storeData: MediaTypeState & { catColor?: string } = {
        ...response.data,
        usageCount: 0,
        replacedBy: null,
        isDeleting: false,
        catColor: mediaTypeConfig.catColor || '#2196f3'
      };

      dispatch(addMediaType(storeData));
      toast.success('Media Type added successfully!');
      handleClose();
    } catch (error) {
      console.error('Failed to save media type', error);
      toast.error('Failed to save media type');
    }
  };

  const resetFieldForm = () => {
    setCurrentField(createField('Text'));
    setOptions([]);
    setIsEditing(false);
    setEditingFieldIndex(null);
  };

  const handleClose = () => {
    resetFieldForm();
    setMediaTypeConfig(initialMediaTypeConfig);
    setActiveStep(STEP_NAME);
    setActiveField(null);
    onClose();
  };

  const renderFieldOptions = (field: SelectField) => (
    <span className="field-options">
      Options: {field.options.join(', ')}
    </span>
  );

  const renderCompactFieldItem = (field: MediaTypeField, index: number) => {
    if (editingFieldIndex === index) {
      return (
        <div 
          key={index} 
          className={`new-input-field-container ${activeField === index ? 'active' : ''}`}
        >
          <div className="input-row">
            <div className="field-group">
              <Select
                value={field.type}
                onChange={(e) => {
                  const newType = e.target.value as FieldType;
                  const newField = createField(newType, currentField.name, currentField.required);
                  const newFields = [...mediaTypeConfig.fields];
                  newFields[index] = newField;
                  setMediaTypeConfig(prev => ({ ...prev, fields: newFields }));
                  setCurrentField(newField);
                }}
                fullWidth
                displayEmpty
                className="input-field select-input"
              >
                {inputOptions.map((option) => (
                  <MenuItem key={option} value={option}>
                    {option}
                  </MenuItem>
                ))}
              </Select>
            
              <TextField
                label="Field Name"
                value={currentField.name}
                onChange={(e) => {
                  setCurrentField(prev => ({ ...prev, name: e.target.value }));
                  setIsEditing(true);
                }}
                fullWidth
                className="input-field text-input"
              />
            </div>
            
            <FormControlLabel
              label='Required'
              className='required-checkbox'
              control={
                <Checkbox 
                  checked={field.required}
                  onChange={(e) => {
                    const newFields = [...mediaTypeConfig.fields];
                    newFields[index].required = e.target.checked;
                    setMediaTypeConfig(prev => ({ ...prev, fields: newFields }));
                  }}
                />
              }
            />
            
            <div className="button-wrapper">
              <IconButton 
                onClick={() => handleAddField()}
                color="primary" 
                className="add-button"
                title="Save changes"
              >
                <FaCheck />
              </IconButton>
              <IconButton 
                onClick={() => {
                  resetFieldForm();
                  setEditingFieldIndex(null);
                }}
                color="error"
                className="remove-button"
                title="Cancel editing"
              >
                <FaTimes />
              </IconButton>
            </div>
          </div>
          
          {isSelectField(field) && (
            <div className="options-container">
              <div className="options-header">
                <span className="title">Define Options</span>
              </div>
              
              <div className="add-option-container">
                <TextField
                  label="Option Value"
                  value={optionInput}
                  onChange={(e) => {
                    setOptionInput(e.target.value);
                    setIsEditing(true);
                  }}
                  fullWidth
                  className="input-field text-input"
                />
                <IconButton onClick={handleAddOption} color="primary" disabled={!optionInput.trim()}>
                  <FaPlus />
                </IconButton>
              </div>
              
              {field.options.length > 0 && (
                <div className="option-chips">
                  {field.options.map((option, optIndex) => (
                    <div key={optIndex} className="option-chip">
                      {option}
                      <span className="remove-icon" onClick={() => handleRemoveOption(optIndex)}>
                        <FaTimes size={10} />
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      );
    }
    
    return (
      <div 
        key={index}
        className={`compact-field-item ${activeField === index ? 'active' : ''}`}
        onClick={() => setActiveField(index)}
      >
        <div className="field-info">
          <span className="field-type-badge">{field.type}</span>
          <span className="field-name">{field.name}</span>
          {field.required && (
            <span className="field-required">
              <FaStar size={8} /> Required
            </span>
          )}
        </div>
        
        {isSelectField(field) && renderFieldOptions(field)}
        
        <div className="field-actions">
          <div 
            className="edit-button" 
            onClick={(e) => {
              e.stopPropagation();
              handleEditField(index);
            }}
            title="Edit field"
          >
            <FaEdit />
          </div>
          <div 
            className="remove-button"
            onClick={(e) => {
              e.stopPropagation();
              handleRemoveField(index);
            }}
            title="Remove field"
          >
            <FaTimes />
          </div>
        </div>
      </div>
    );
  };

  const isCategorySelected = (categoryName: string) => {
    const category = fileTypeCategories.find(cat => cat.name === categoryName);
    if (!category) return false;
    
    // Check if all MIME types in this category are selected
    return category.mimeTypes.every(type => mediaTypeConfig.acceptedFileTypes.includes(type));
  };

  const isCategoryPartiallySelected = (categoryName: string) => {
    const category = fileTypeCategories.find(cat => cat.name === categoryName);
    if (!category) return false;
    
    // Check if some (but not all) MIME types in this category are selected
    const selectedCount = category.mimeTypes.filter(type => mediaTypeConfig.acceptedFileTypes.includes(type)).length;
    return selectedCount > 0 && selectedCount < category.mimeTypes.length;
  };

  const renderFirstStep = () => (
    <div className="step-container">
      <Typography variant="h6">Select Media Type Name</Typography>
      <TextField
        label="Media Type Name"
        value={mediaTypeConfig.name}
        onChange={(e) => setMediaTypeConfig(prev => ({ ...prev, name: e.target.value }))}
        fullWidth
        className="input-field text-input"
      />
      
      <Box >
        <Typography variant="h6">Select Color for Media Type</Typography>
        <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
          This color will help identify this media type throughout the app
        </Typography>
        <ColorPicker 
          value={mediaTypeConfig.catColor || '#2196f3'}
          onChange={(color) => setMediaTypeConfig(prev => ({ ...prev, catColor: color }))}
          usedColors={usedColors}
        />
      </Box>
      
      <Box sx={{ mt: 3 }}>
        <Typography variant="h6">Accepted File Types</Typography>
        <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
          Select which file types this media type will accept during uploads
        </Typography>
      
        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
          {fileTypeCategories.map((category) => (
            <div key={category.name} className="file-type-category">
              <FormControlLabel
                control={
                  <Checkbox 
                    checked={isCategorySelected(category.name)}
                    indeterminate={isCategoryPartiallySelected(category.name)}
                    onChange={handleFileTypeCategoryChange}
                    name={category.name}
                  />
                }
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {category.icon}
                    <span>{category.label}</span>
                  </Box>
                }
              />
              
              <Box sx={{ pl: 4, pb: 2 }}>
                {category.mimeTypes.map((type) => (
                  <Chip 
                    key={type}
                    size='small'
                    label={type}
                    variant={mediaTypeConfig.acceptedFileTypes.includes(type) ? "filled" : "outlined"}
                    onClick={() => {
                      if (mediaTypeConfig.acceptedFileTypes.includes(type)) {
                        setMediaTypeConfig(prev => ({
                          ...prev,
                          acceptedFileTypes: prev.acceptedFileTypes.filter(t => t !== type)
                        }));
                      } else {
                        setMediaTypeConfig(prev => ({
                          ...prev,
                          acceptedFileTypes: [...prev.acceptedFileTypes, type]
                        }));
                      }
                    }}
                    sx={{ m: 0.5 }}
                  />
                ))}
              </Box>
            </div>
          ))}
        </Box>
      </Box>
    </div>
  );

  return (
    <Dialog id='dialog-container' open={open} onClose={handleClose}>
      <DialogTitle sx={{ m: 0, p: 2 }}>
        <IconButton
          aria-label="close"
          onClick={handleClose}
          sx={{
            position: 'absolute',
            right: 8,
            top: 8,
            color: 'grey.500'
          }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent className='dialog-inner' style={{width: '100%', height: '600px'}}>
        <Stepper activeStep={activeStep} alternativeLabel sx={{marginBottom: '3rem'}}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>
        <div className='new-media-type-form-container'>
          {activeStep === STEP_NAME && renderFirstStep()}
          {activeStep === STEP_FIELDS && (
            <div className="step-container step1">
              <div className='field-creation-container'>
                <Typography className="section-title">Create Media Type Fields</Typography>
                
                {mediaTypeConfig.fields.length > 0 && (
                  <div className="field-list">
                    <div className="field-list-title">
                      <span>Existing Fields</span>
                      <span className="count-badge">{mediaTypeConfig.fields.length}</span>
                    </div>
                    
                    {mediaTypeConfig.fields.map((field, index) => renderCompactFieldItem(field, index))}
                  </div>
                )}
                
                {editingFieldIndex === null && (
                  <div className={`new-input-field-container ${currentField.type === 'Select' || currentField.type === 'MultiSelect' ? 'select-input' : ''} ${isEditing ? 'active' : ''}`}>
                    <div className='new-input-field-container-inner'>
                      <div className='input-row'>
                        <div className="field-group">
                          <Select
                            value={currentField.type}
                            onChange={(e) => {
                              const newType = e.target.value as FieldType;
                              setCurrentField(createField(newType, currentField.name, currentField.required));
                              setIsEditing(true);
                            }}
                            onFocus={() => setIsEditing(true)}
                            fullWidth
                            displayEmpty
                            className={`input-field select-input`}
                          >
                            <MenuItem value="" disabled>Select Input Type</MenuItem>
                            {inputOptions.map((option) => (
                              <MenuItem key={option} value={option}>
                                {option}
                              </MenuItem>
                            ))}
                          </Select>
                           
                          <TextField
                            label="Field Name"
                            value={currentField.name}
                            onChange={(e) => {
                              setCurrentField(prev => ({ ...prev, name: e.target.value }));
                              setIsEditing(true);
                            }}
                            onFocus={() => setIsEditing(true)}
                            fullWidth
                            variant='outlined'
                            className={`input-field text-input`}
                          />
                        </div>
                        
                        <FormControlLabel
                          label='Required'
                          className='required-checkbox'
                          control={<Checkbox checked={currentField.required} onChange={(e) => setCurrentField(prev => ({ ...prev, required: e.target.checked }))} />}
                        />
                        
                        <IconButton 
                          onClick={handleAddField} 
                          color="primary" 
                          disabled={!currentField.type || !currentField.name.trim()}
                          className="add-button"
                        >
                          <FaPlus />
                        </IconButton>
                      </div>
                    </div>
                    
                    {(currentField.type === 'Select' || currentField.type === 'MultiSelect') && (
                      <div className="options-container">
                        <div className="options-header">
                          <span className="title">Define Options</span>
                        </div>
                        
                        <div className="add-option-container">
                          <TextField
                            label="Option Value"
                            value={optionInput}
                            onChange={(e) => {
                              setOptionInput(e.target.value);
                              setIsEditing(true);
                            }}
                            fullWidth
                            className="input-field text-input"
                          />
                          <IconButton onClick={handleAddOption} color="primary" disabled={!optionInput.trim()}>
                            <FaPlus />
                          </IconButton>
                        </div>
                        
                        {options.length > 0 && (
                          <div className="option-chips">
                            {options.map((option, index) => (
                              <div key={index} className="option-chip">
                                {option}
                                <span className="remove-icon" onClick={() => handleRemoveOption(index)}>
                                  <FaTimes size={10} />
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
             
              <div className='field-preview-container'>
                <div className="preview-header">
                  <h6>Field Preview</h6>
                  <span className="field-count">{mediaTypeConfig.fields.length} fields</span>
                </div>
                
                {mediaTypeConfig.fields.length === 0 ? (
                  <div className="empty-message">
                    <Typography>No fields added yet. Start by creating a field on the left.</Typography>
                  </div>
                ) : (
                  <List>
                    {mediaTypeConfig.fields.map((field, index) => (
                      <ListItem key={index} onClick={() => setActiveField(index)}>
                        <Box sx={{ width: '100%' }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                            <Typography variant="subtitle2">
                              {field.name}
                              {field.required && (
                                <small className='required-badge' style={{marginLeft: '0.5rem', color: 'green', fontSize: '0.6rem'}}>* Required</small>
                              )}
                            </Typography>
                            <Chip 
                              size="small" 
                              label={field.type}
                              variant="outlined"
                            />
                          </Box>
                          {isSelectField(field) && field.options.length > 0 && (
                            <Box sx={{ mt: 1 }}>
                              <Typography variant="caption" color="textSecondary">
                                Options: {field.options.join(', ')}
                              </Typography>
                            </Box>
                          )}
                        </Box>
                      </ListItem>
                    ))}
                  </List>
                )}
              </div>
            </div>
          )}
          {activeStep === STEP_REVIEW && (
            <div className="step-container step2">
              <div className="media-type-summary">
                <h4>Media Type: {mediaTypeConfig.name}</h4>
                <Typography variant="body1">
                  This media type will have {mediaTypeConfig.fields.length} field{mediaTypeConfig.fields.length !== 1 ? 's' : ''}.
                  {mediaTypeConfig.fields.filter(f => f.required).length > 0 && (
                    <span> {mediaTypeConfig.fields.filter(f => f.required).length} field{mediaTypeConfig.fields.filter(f => f.required).length !== 1 ? 's are' : ' is'} required.</span>
                  )}
                </Typography>
                
                <Box sx={{ mt: 2 }}>
                  <Typography variant="subtitle1">Accepted File Types:</Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1 }}>
                    {mediaTypeConfig.acceptedFileTypes.map((type) => (
                      <Chip 
                        key={type}
                        label={type}
                        sx={{ m: 0.5 }}
                      />
                    ))}
                  </Box>
                </Box>
                
                <Box sx={{ mt: 2, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  {inputOptions.map(type => {
                    const count = mediaTypeConfig.fields.filter(f => f.type === type).length;
                    if (count === 0) return null;
                    return (
                      <Chip 
                        key={type} 
                        label={`${type}: ${count}`} 
                        sx={{ 
                          backgroundColor: 'rgba(25, 118, 210, 0.2)',
                          borderRadius: '4px',
                          fontSize: '0.8rem'
                        }} 
                      />
                    );
                  })}
                </Box>
              </div>
              
              <div className="field-list-container">
                <h6>Field Details:</h6>
                <List>
                  {mediaTypeConfig.fields.map((field, index) => (
                    <ListItem key={index}>
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            {field.name}
                            {field.required && 
                              <span className="required-badge">Required</span>
                            }
                          </Box>
                        }
                        secondary={
                          <>
                            <Typography component="span" variant="body2">
                              Type: {field.type}
                            </Typography>
                            {isSelectField(field) && field.options.length > 0 && (
                              <Box mt={1}>
                                <Typography component="span" variant="body2">
                                  Options: {field.options.join(', ')}
                                </Typography>
                              </Box>
                            )}
                          </>
                        }
                      />
                    </ListItem>
                  ))}
                </List>
              </div>
              
              <Box className="confirmation-message">
                <Typography variant="body2">
                  <FaExclamationCircle style={{ marginRight: '8px', verticalAlign: 'middle' }} />
                  Please review the media type details above before proceeding. Once created, only an admin can modify it.
                </Typography>
              </Box>
            </div>
          )}
        </div>
      </DialogContent>
      <DialogActions sx={{ 
        justifyContent: 'space-between', 
        px: 4, 
        py: 2,
        position: 'relative',
        borderTop: '1px solid rgba(0, 0, 0, 0.12)'
      }}>
        <Button 
          onClick={handleBack} 
          disabled={activeStep === STEP_NAME}
          startIcon={<FaArrowLeft />}
          variant="outlined"
          size="large"
        >
          Back
        </Button>
        
        <Button 
          onClick={handleClose} 
          variant="text" 
          sx={{ position: 'absolute', left: '50%', transform: 'translateX(-50%)' }}
        >
          Cancel
        </Button>
        
        {activeStep === STEP_REVIEW ? (
          <Button 
            onClick={handleSaveMediaType} 
            color="primary" 
            variant="contained" 
            startIcon={<FaSave />}
            size="large"
          >
            Create
          </Button>
        ) : (
          <Button 
            onClick={handleNext} 
            color="primary"
            variant="contained"
            endIcon={<FaArrowRight />}
            disabled={activeStep === STEP_NAME && (mediaTypeConfig.name.trim() === '' || mediaTypeConfig.acceptedFileTypes.length === 0)}
            size="large"
          >
            Next
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default MediaTypeUploader;
