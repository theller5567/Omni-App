import React, { useState } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Stepper, Step, StepLabel, TextField, Select, MenuItem, IconButton, List, ListItem, ListItemText, Checkbox, FormControlLabel, Typography } from '@mui/material';
import { useDispatch } from 'react-redux';
import { addMediaType } from '../store/slices/mediaTypeSlice';
import { toast } from 'react-toastify';
import axios from 'axios';
import { FaPlus, FaMinus } from 'react-icons/fa';

interface Field {
  name: string;
  type: string;
  options?: string[];
  required: boolean;
}

interface MediaType {
  name: string;
  fields: Field[];
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
  //const [isSubmitted, setIsSubmitted] = useState(false);

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
      setFields([...fields, newField]);
      console.log('submitted', newField);
      resetFieldForm();
    } else {
      toast.error('Field name and type are required');
    }
  };

  const handleRemoveField = (index: number) => {
    setFields(fields.filter((_, i) => i !== index));
  };

  const handleAddOption = () => {
    if (optionInput.trim()) {
      setOptions([...options, optionInput]);
      setOptionInput('');
    }
  };

  const saveMediaTypeToBackend = async (mediaType: MediaType) => {
    try {
      const response = await axios.post('/media-types', mediaType);
      console.log('Media Type saved:', response.data);
    } catch (error) {
      console.error('Error saving media type:', error);
    }
  };

  const handleSaveMediaType = () => {
    if (fieldName.trim() && inputType) {
      handleAddField();
    }

    if (mediaTypeName.trim()) {
      const mediaType = { name: mediaTypeName, fields };
      dispatch(addMediaType(mediaType));
      saveMediaTypeToBackend(mediaType);
      toast.success('Media Type added successfully!');
      handleClose();
    } else {
      toast.error('Media Type Name cannot be empty');
    }
  };

  const resetFieldForm = () => {
    setFieldName('');
    setInputType('');
    setOptions([]);
    setIsRequired(false);
    setIsEditing(false);
  };

  const handleClose = () => {
    resetFieldForm();
    setMediaTypeName('');
    setFields([]);
    setActiveStep(0);
    onClose();
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
                  <div className='field-creation-container' style={{ display: 'flex', gap: '1rem', flexDirection: 'column' }}>
                    {fields.map((field, index) => (
                      <div key={index} className='new-input-field-container' style={{display: 'flex', alignItems: 'first baseline', gap: '2rem', width: '100%'}}>
                        <Select
                          value={field.type}
                          onChange={(e) => {
                            const newFields = [...fields];
                            newFields[index].type = e.target.value;
                            setFields(newFields);
                          }}
                          onBlur={() => {setIsEditing(false); console.log('blur')}}
                          onFocus={() => {setIsEditing(true); console.log('focus')}}

                          fullWidth
                          displayEmpty
                          className={`input-field select-input  ${isEditing ? 'editing' : 'neutral'}`}
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
                          value={field.name}
                          onChange={(e) => {
                            const newFields = [...fields];
                            newFields[index].name = e.target.value;
                            setFields(newFields);
                          }}
                          onBlur={() => setIsEditing(false)}
                          onFocus={() => setIsEditing(true)}
                          fullWidth
                          margin="normal"
                          className="input-field text-input submitted"
                        />
                        <div className="button-wrapper">
                        {index === fields.length - 1 && (
                          <IconButton onClick={handleAddField} color="primary" disabled={!inputType || !fieldName.trim()}>
                            <FaPlus />
                          </IconButton>
                        )}
                        {fields.length > 1 && (
                          <IconButton onClick={() => handleRemoveField(index)} color="secondary">
                            <FaMinus />
                          </IconButton>
                        )}
                        </div>
                      </div>
                    ))}
                    <div  className={inputType === 'Select' || inputType === 'MultiSelect' ? 'new-input-field-container select-input' : 'new-input-field-container'} style={{display: 'flex', alignItems: 'first baseline', gap: '0.2rem', width: '100%'}}>
                      <div className='new-input-field-container-inner'>
                        <div className='input-row'>
                        <Select
                            value={inputType}
                            onChange={(e) => {
                            setInputType(e.target.value);
                            setIsEditing(true); // Set editing state
                            }}
                            onBlur={() => setIsEditing(false)} // Reset editing state on blur
                            onFocus={() => setIsEditing(true)}
                            fullWidth
                            displayEmpty
                            className={`input-field select-input ${inputType ? 'editing' : 'neutral'}`}
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
                            setIsEditing(true); // Set editing state
                            }}
                            onBlur={() => setIsEditing(false)} // Reset editing state on blur
                            onFocus={() => setIsEditing(true)}
                            fullWidth
                            variant='outlined'
                            margin="normal"
                            className={`input-field text-input ${isEditing ? 'editing' : 'neutral'}`}
                        />
                        <FormControlLabel
                            label='Required'
                            className='required-checkbox'
                            control={<Checkbox className='required-checkbox-input' checked={isRequired} onChange={(e) => setIsRequired(e.target.checked)} />}
                            
                        />
                        <IconButton onClick={handleAddField} color="primary" disabled={!inputType || !fieldName.trim()}>
                            <FaPlus />
                        </IconButton>
                        </div>
                       
                      </div>
                      <div className='new-input-field-container-inner'>
                      <div className='input-row'>
                        {(inputType === 'Select' || inputType === 'MultiSelect') && (
                            <div className="" style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '1rem', }}>
                            <TextField
                                label="Option"
                                value={optionInput}
                                onChange={(e) => {
                                setOptionInput(e.target.value);
                                setIsEditing(true); // Set editing state
                                }}
                                onBlur={() => setIsEditing(false)} // Reset editing state on blur
                                onFocus={() => setIsEditing(true)}
                                margin="normal"
                                className={`input-field text-input ${inputType ? 'editing' : 'neutral'}`}
                                
                            />
                            <IconButton onClick={handleAddOption} color="primary">
                                <FaPlus />
                            </IconButton>
                            <List sx={{display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '1rem'}}>
                                {options.map((option, index) => (
                                <ListItem key={index}>
                                    <ListItemText primary={option} />
                                </ListItem>
                                ))}
                            </List>
                            </div>
                        )}
                        </div>
                      </div>
                      
                    </div>
                  </div>
                 
                  <div className='field-preview-container'>
                    <Typography variant="h6" sx={{ marginTop: '1rem' }}>Field Preview:</Typography>
                    <List>
                    {fields.map((field, index) => (
                      <ListItem key={index}>
                        <ListItemText
                          primary={`${field.name} (${field.type})`}
                          secondary={field.options ? `Options: ${field.options.join(', ')}` : ''}
                        />
                      </ListItem>
                    ))}
                  </List>
                  </div>
                </div>
              )}
              {activeStep === 2 && (
                <div className="step-container step2">
                <Typography variant="body1">Review your media type and submit.</Typography>
                <Typography variant="h6" sx={{ marginTop: '1rem' }}>Field Preview:</Typography>
                    <List>
                    {fields.map((field, index) => (
                      <ListItem key={index}>
                        <ListItemText
                          primary={`${field.name} (${field.type})`}
                          secondary={field.options ? `Options: ${field.options.join(', ')}` : ''}
                        />
                      </ListItem>
                    ))}
                  </List>
                </div>
              )}
              </div>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleBack} disabled={activeStep === 0}>Back</Button>
        {activeStep === steps.length - 1 ? (
          <Button onClick={handleSaveMediaType} color="primary">Submit</Button>
        ) : (
          <Button onClick={handleNext} color="primary">Next</Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default MediaTypeUploader;
