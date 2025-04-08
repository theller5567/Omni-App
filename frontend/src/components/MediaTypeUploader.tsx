import React, { useState } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Stepper, Step, StepLabel, TextField, Select, MenuItem, IconButton, List, ListItem, ListItemText, Checkbox, FormControlLabel, Typography, Chip, Box } from '@mui/material';
import { useDispatch } from 'react-redux';
import { addMediaType } from '../store/slices/mediaTypeSlice';
import { toast } from 'react-toastify';
import axios from 'axios';
import { FaPlus, FaCheck, FaExclamationCircle, FaTimes, FaEdit, FaStar } from 'react-icons/fa';
import type { MediaType } from '../store/slices/mediaTypeSlice';
import './MediaTypeUploader.scss';
import env from '../config/env';

interface Field {
  name: string;
  type: string;
  options?: string[];
  required: boolean;
}

interface MediaTypeUploaderProps {
  open: boolean;
  onClose: () => void;
}

const MediaTypeUploader: React.FC<MediaTypeUploaderProps> = ({ open, onClose }) => {
  const dispatch = useDispatch();
  const [mediaTypeName, setMediaTypeName] = useState('');
  const [fields, setFields] = useState<Field[]>([]);
  const [inputType, setInputType] = useState('');
  const [fieldName, setFieldName] = useState('');
  const [options, setOptions] = useState<string[]>([]);
  const [optionInput, setOptionInput] = useState('');
  const [activeStep, setActiveStep] = useState(0);
  const [isRequired, setIsRequired] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [activeField, setActiveField] = useState<number | null>(null);
  const [editingFieldIndex, setEditingFieldIndex] = useState<number | null>(null);

  const steps = ['Name Media Type', 'Add Fields', 'Review & Submit'];
  const inputOptions = ['Text', 'Number', 'Date', 'Boolean', 'Select', 'MultiSelect'];

  const handleNext = () => setActiveStep((prev) => prev + 1);
  const handleBack = () => setActiveStep((prev) => prev - 1);

  const handleAddField = () => {
    if (fieldName.trim() && inputType) {
      const newField: Field = { name: fieldName, type: inputType, required: isRequired };
      if (inputType === 'Select' || inputType === 'MultiSelect') {
        newField.options = options;
      }
      
      if (editingFieldIndex !== null) {
        // Update existing field
        const updatedFields = [...fields];
        updatedFields[editingFieldIndex] = newField;
        setFields(updatedFields);
        setEditingFieldIndex(null);
      } else {
        // Add new field
        setFields([...fields, newField]);
      }
      
      console.log('submitted', newField);
      resetFieldForm();
    } else {
      toast.error('Field name and type are required');
    }
  };

  const handleEditField = (index: number) => {
    const field = fields[index];
    setFieldName(field.name);
    setInputType(field.type);
    setIsRequired(field.required);
    setOptions(field.options || []);
    setIsEditing(true);
    setEditingFieldIndex(index);
    setActiveField(index);
  };

  const handleRemoveField = (index: number) => {
    setFields(fields.filter((_, i) => i !== index));
    if (editingFieldIndex === index) {
      resetFieldForm();
    }
  };

  const handleAddOption = () => {
    if (optionInput.trim()) {
      setOptions([...options, optionInput]);
      setOptionInput('');
    }
  };

  const handleRemoveOption = (index: number) => {
    setOptions(options.filter((_, i) => i !== index));
  };

  const saveMediaTypeToBackend = async (mediaType: Omit<MediaType, '_id'>) => {
    try {
      console.log('Sending media type to backend:', JSON.stringify(mediaType, null, 2));
      const response = await axios.post<MediaType>(`${env.BASE_URL}/api/media-types`, {
        name: mediaType.name,
        fields: mediaType.fields.map((field: Field) => ({
          name: field.name,
          type: field.type,
          options: field.options || [],
          required: field.required
        }))
      });
      console.log('Media Type saved:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('Error saving media type:', error);
      if (error.response) {
        console.error('Error response:', error.response.data);
        toast.error(error.response.data.message || 'Failed to save media type');
      } else {
        toast.error('Failed to save media type');
      }
      throw error;
    }
  };

  const handleSaveMediaType = async () => {
    try {
      if (fieldName.trim() && inputType) {
        handleAddField();
      }

      if (mediaTypeName.trim()) {
        const mediaType = { 
          name: mediaTypeName, 
          fields: fields.map(field => ({
            name: field.name,
            type: field.type,
            options: field.options || [],
            required: field.required
          })),
          status: 'active' as 'active',
          usageCount: 0,
          replacedBy: null,
          isDeleting: false
        };
        console.log('Saving media type:', mediaType);
        const savedMediaType = await saveMediaTypeToBackend(mediaType);
        dispatch(addMediaType(savedMediaType));
        toast.success('Media Type added successfully!');
        handleClose();
      } else {
        toast.error('Media Type Name cannot be empty');
      }
    } catch (error) {
      // Error is already handled in saveMediaTypeToBackend
      console.error('Failed to save media type:', error);
    }
  };

  const resetFieldForm = () => {
    setFieldName('');
    setInputType('');
    setOptions([]);
    setIsRequired(false);
    setIsEditing(false);
    setEditingFieldIndex(null);
  };

  const handleClose = () => {
    resetFieldForm();
    setMediaTypeName('');
    setFields([]);
    setActiveStep(0);
    setActiveField(null);
    onClose();
  };

  const renderCompactFieldItem = (field: Field, index: number) => {
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
                  const newFields = [...fields];
                  newFields[index].type = e.target.value;
                  setFields(newFields);
                  setInputType(e.target.value);
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
                value={fieldName}
                onChange={(e) => setFieldName(e.target.value)}
                fullWidth
                className="input-field text-input"
              />
            </div>
            
            <FormControlLabel
              label='Required'
              className='required-checkbox'
              control={
                <Checkbox 
                  checked={isRequired}
                  onChange={(e) => setIsRequired(e.target.checked)}
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
          
          {(field.type === 'Select' || field.type === 'MultiSelect') && (
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
                  {options.map((option, optIndex) => (
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
        
        {field.options && field.options.length > 0 && (
          <div className="field-options">
            Options: {field.options.join(', ')}
          </div>
        )}
        
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

  return (
    <Dialog id='dialog-container' open={open} onClose={handleClose}>
      <DialogTitle>Create New Media Type</DialogTitle>
      <DialogContent className='dialog-inner' style={{width: '100%', height: '600px'}}>
        <Stepper activeStep={activeStep} alternativeLabel sx={{marginBottom: '3rem'}}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>
        <div className='new-media-type-form-container'>
              {activeStep === 0 && (
                <TextField
                  label="Media Type Name"
                  value={mediaTypeName}
                  onChange={(e) => setMediaTypeName(e.target.value)}
                  fullWidth
                  margin="normal"
                  className="input-field text-input"
                />
              )}
              {activeStep === 1 && (
                <div className="step-container step1">
                  <div className='field-creation-container'>
                    <Typography className="section-title">Create Media Type Fields</Typography>
                    
                    {fields.length > 0 && (
                      <div className="field-list">
                        <div className="field-list-title">
                          <span>Existing Fields</span>
                          <span className="count-badge">{fields.length}</span>
                        </div>
                        
                        {fields.map((field, index) => renderCompactFieldItem(field, index))}
                      </div>
                    )}
                    
                    {editingFieldIndex === null && (
                      <div className={`new-input-field-container ${inputType === 'Select' || inputType === 'MultiSelect' ? 'select-input' : ''} ${isEditing ? 'active' : ''}`}>
                        <div className='new-input-field-container-inner'>
                          <div className='input-row'>
                            <div className="field-group">
                              <Select
                                value={inputType}
                                onChange={(e) => {
                                  setInputType(e.target.value);
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
                                value={fieldName}
                                onChange={(e) => {
                                  setFieldName(e.target.value);
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
                              control={<Checkbox checked={isRequired} onChange={(e) => setIsRequired(e.target.checked)} />}
                            />
                            
                            <IconButton 
                              onClick={handleAddField} 
                              color="primary" 
                              disabled={!inputType || !fieldName.trim()}
                              className="add-button"
                            >
                              <FaPlus />
                            </IconButton>
                          </div>
                        </div>
                        
                        {(inputType === 'Select' || inputType === 'MultiSelect') && (
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
                      <span className="field-count">{fields.length} fields</span>
                    </div>
                    
                    {fields.length === 0 ? (
                      <div className="empty-message">
                        <Typography>No fields added yet. Start by creating a field on the left.</Typography>
                      </div>
                    ) : (
                      <List>
                        {fields.map((field, index) => (
                          <ListItem key={index} onClick={() => setActiveField(index)}>
                            <ListItemText
                              primary={
                                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                  <span className="field-name">
                                    {field.name}
                                    {field.required && <span className="field-required-badge">Required</span>}
                                  </span>
                                  <span className="field-type">{field.type}</span>
                                </Box>
                              }
                              secondary={
                                field.options && field.options.length > 0 
                                  ? `Options: ${field.options.join(', ')}` 
                                  : null
                              }
                            />
                          </ListItem>
                        ))}
                      </List>
                    )}
                  </div>
                </div>
              )}
              {activeStep === 2 && (
                <div className="step-container step2">
                  <div className="media-type-summary">
                    <h4>Media Type: {mediaTypeName}</h4>
                    <Typography variant="body1">
                      This media type will have {fields.length} field{fields.length !== 1 ? 's' : ''}.
                      {fields.filter(f => f.required).length > 0 && (
                        <span> {fields.filter(f => f.required).length} field{fields.filter(f => f.required).length !== 1 ? 's are' : ' is'} required.</span>
                      )}
                    </Typography>
                    
                    <Box sx={{ mt: 2, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                      {inputOptions.map(type => {
                        const count = fields.filter(f => f.type === type).length;
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
                      {fields.map((field, index) => (
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
                                {field.options && field.options.length > 0 && (
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
      <DialogActions>
        <Button onClick={handleBack} disabled={activeStep === 0}>Back</Button>
        {activeStep === steps.length - 1 ? (
          <Button onClick={handleSaveMediaType} color="primary" variant="contained" startIcon={<FaCheck />}>
            Create Media Type
          </Button>
        ) : (
          <Button onClick={handleNext} color="primary">Next</Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default MediaTypeUploader;
