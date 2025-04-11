import React, { useState, useEffect } from 'react';
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
  IconButton,
  Typography,
  Box,
  Chip
} from '@mui/material';
import { useDispatch, useSelector } from 'react-redux';
import { addMediaType, initializeMediaTypes } from '../../store/slices/mediaTypeSlice';
import { toast } from 'react-toastify';
import axios from 'axios';
import { FaArrowRight, FaArrowLeft, FaSave } from 'react-icons/fa';
import CloseIcon from '@mui/icons-material/Close';
import { 
  MediaTypeConfig, 
  MediaTypeField, 
  FieldType, 
  ApiMediaTypeResponse,
  createField,
} from '../../types/mediaTypes';
import '../MediaTypeUploader.scss';
import env from '../../config/env';
import { RootState, AppDispatch } from '../../store/store';
import { 
  ColorPicker, 
  FieldEditor, 
  FieldPreview, 
  FileTypeSelector, 
  ReviewStep 
} from './components';
import {
  transformConfigToApiData,
  FileTypeCategory,
  predefinedColors
} from '../../utils/mediaTypeUploaderUtils';
import { FaImage, FaVideo, FaFileAudio, FaFileWord } from 'react-icons/fa';

// Define available field types
const inputOptions: FieldType[] = ['Text', 'TextArea', 'Number', 'Date', 'Boolean', 'Select', 'MultiSelect'];

// Define common file type categories and their MIME types
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

// Initial media type configuration
const initialMediaTypeConfig: MediaTypeConfig = {
  name: '',
  fields: [],
  baseType: 'Media' as 'BaseImage' | 'BaseVideo' | 'BaseAudio' | 'BaseDocument' | 'Media',
  includeBaseFields: true,
  acceptedFileTypes: [],
  status: 'active',
  catColor: '#2196f3', // Default blue color
  defaultTags: [], // Initialize with empty array
  _id: undefined
};

// Define step constants
const STEP_NAME = 0;
const STEP_FIELDS = 1;
const STEP_REVIEW = 2;

interface MediaTypeUploaderProps {
  open: boolean;
  onClose: () => void;
  editMediaTypeId?: string | null; // Add optional prop for editing
}

const MediaTypeUploader: React.FC<MediaTypeUploaderProps> = ({ open, onClose, editMediaTypeId }) => {
  const dispatch = useDispatch<AppDispatch>();
  const mediaTypes = useSelector((state: RootState) => state.mediaTypes.mediaTypes);
  // Get the current user role
  const userRole = useSelector((state: RootState) => state.user.currentUser.role);
  const isSuperAdmin = userRole === 'superAdmin';
  
  // State for media type configuration
  const [mediaTypeConfig, setMediaTypeConfig] = useState<MediaTypeConfig>(initialMediaTypeConfig);
  const [newTag, setNewTag] = useState(''); // For handling tag input
  const [isEditMode, setIsEditMode] = useState(false);

  // State for field editing
  const [currentField, setCurrentField] = useState<MediaTypeField>(createField('Text'));
  const [editingFieldIndex, setEditingFieldIndex] = useState<number | null>(null);

  // UI state
  const [activeStep, setActiveStep] = useState(STEP_NAME);
  const [isEditing, setIsEditing] = useState(false);
  const [activeField, setActiveField] = useState<number | null>(null);

  // Effect to initialize media type for editing
  useEffect(() => {
    if (open && editMediaTypeId) {
      const mediaTypeToEdit = mediaTypes.find(type => type._id === editMediaTypeId);
      if (mediaTypeToEdit) {
        // Convert field types to ensure compatibility
        const convertedFields = mediaTypeToEdit.fields?.map(field => ({
          name: field.name,
          type: field.type as FieldType,
          options: field.options || [],
          required: field.required || false
        })) || [];
        
        setMediaTypeConfig({
          _id: mediaTypeToEdit._id,
          name: mediaTypeToEdit.name,
          fields: convertedFields,
          baseType: mediaTypeToEdit.baseType || 'Media',
          includeBaseFields: mediaTypeToEdit.includeBaseFields !== false,
          acceptedFileTypes: mediaTypeToEdit.acceptedFileTypes || [],
          status: mediaTypeToEdit.status || 'active',
          catColor: mediaTypeToEdit.catColor || '#2196f3',
          defaultTags: mediaTypeToEdit.defaultTags || []
        });
        setIsEditMode(true);
      }
    } else if (open && !editMediaTypeId) {
      // Reset for creating a new media type
      setMediaTypeConfig(initialMediaTypeConfig);
      setIsEditMode(false);
    }
  }, [open, editMediaTypeId, mediaTypes]);

  const steps = ['Name Media Type', 'Add Fields', 'Review & Submit'];

  // Get used colors from existing media types
  const usedColors = React.useMemo(() => {
    // More explicit mapping to ensure we get the catColor property from each media type
    const colors = mediaTypes
      .filter(type => mediaTypeConfig._id !== type._id) // Exclude the current media type
      .map(type => {
        console.log('Processing media type:', type.name, 'catColor:', type.catColor);
        return type.catColor;
      })
      .filter(color => color !== undefined && color !== null) as string[];
    
    console.log('Used colors:', colors);
    return colors;
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

  const handleAddField = (field: MediaTypeField, index: number | null) => {
    if (field.name.trim()) {
      if (index !== null) {
        const updatedFields = [...mediaTypeConfig.fields];
        updatedFields[index] = field;
        setMediaTypeConfig(prev => ({ ...prev, fields: updatedFields }));
        setEditingFieldIndex(null);
      } else {
        setMediaTypeConfig(prev => ({ ...prev, fields: [...prev.fields, field] }));
      }
      
      resetFieldForm();
    } else {
      toast.error('Field name is required');
    }
  };

  const handleEditField = (index: number) => {
    const field = mediaTypeConfig.fields[index];
    setCurrentField(field);
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

  const handleFieldUpdate = (field: MediaTypeField) => {
    setCurrentField(field);
    setIsEditing(true);
  };

  const handleSaveMediaType = async () => {
    try {
      if (!mediaTypeConfig.name || !mediaTypeConfig.acceptedFileTypes?.length) {
        toast.error('Please fill in all required fields');
        return;
      }

      // Make sure we have a color - use default if not specified
      const catColor = mediaTypeConfig.catColor || '#2196f3';
      const colorName = predefinedColors.find(c => c.hex === catColor)?.name || 'Default Blue';
      
      // Create API data from the media type config
      const apiData = {
        ...transformConfigToApiData(mediaTypeConfig),
        catColor // Make sure catColor is explicitly included
      };

      if (isEditMode && mediaTypeConfig._id) {
        // Update existing media type
        console.log('Updating media type with ID:', mediaTypeConfig._id);
        
        const response = await axios.put<ApiMediaTypeResponse>(
          `${env.BASE_URL}/api/media-types/${mediaTypeConfig._id}`,
          apiData
        );

        console.log('Media type updated successfully:', response.data);
        
        // Refresh all media types to ensure store is updated
        dispatch(initializeMediaTypes());
        
        toast.success(`Media Type '${mediaTypeConfig.name}' updated successfully`);
      } else {
        // Create new media type
        console.log('Creating new media type with color:', colorName, '(', catColor, ')');

        const response = await axios.post<ApiMediaTypeResponse>(
          `${env.BASE_URL}/api/media-types`,
          apiData
        );
  
        console.log('Media type created successfully with ID:', response.data._id);
  
        // Add the media type to the store with type assertion
        const storeData = {
          ...response.data,
          usageCount: 0,
          replacedBy: null,
          isDeleting: false,
          status: response.data.status || 'active',
          catColor: catColor // Explicitly include catColor
        } as any; // Using type assertion to avoid complex typing issues
  
        dispatch(addMediaType(storeData));
        toast.success(`Media Type '${mediaTypeConfig.name}' added successfully with color: ${colorName}`);
      }
      
      handleClose();
    } catch (error) {
      console.error('Failed to save media type', error);
      toast.error(`Failed to ${isEditMode ? 'update' : 'save'} media type`);
    }
  };

  const resetFieldForm = () => {
    setCurrentField(createField('Text'));
    setIsEditing(false);
    setEditingFieldIndex(null);
  };

  const handleClose = () => {
    resetFieldForm();
    setMediaTypeConfig(initialMediaTypeConfig);
    setActiveStep(STEP_NAME);
    setActiveField(null);
    setIsEditMode(false);
    onClose();
  };

  const handleAddTag = (event: React.KeyboardEvent<HTMLInputElement>) => {
    // Only superAdmins can add tags
    if (!isSuperAdmin) return;
    
    if (event.key === 'Enter' && newTag.trim()) {
      if (!mediaTypeConfig.defaultTags?.includes(newTag.trim())) {
        setMediaTypeConfig(prev => ({
          ...prev,
          defaultTags: [...(prev.defaultTags || []), newTag.trim()]
        }));
      }
      setNewTag('');
      event.preventDefault(); // Prevent form submission
    }
  };

  const handleDeleteTag = (tagToDelete: string) => {
    // Only superAdmins can delete tags
    if (!isSuperAdmin) return;
    
    setMediaTypeConfig(prev => ({
      ...prev,
      defaultTags: prev.defaultTags?.filter(tag => tag !== tagToDelete) || []
    }));
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
      
      <Box sx={{ mt: 3, mb: 2 }}>
        <Typography variant="h6">Default Tags</Typography>
        <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
          These tags will be automatically applied to all media files created with this type
          {!isSuperAdmin && (
            <Typography variant="caption" color="error" sx={{ display: 'block', mt: 1 }}>
              * Only Super Admins can add or modify default tags
            </Typography>
          )}
        </Typography>
        
        {isSuperAdmin && (
          <TextField
            label="Add Default Tags"
            value={newTag}
            onChange={(e) => setNewTag(e.target.value)}
            onKeyPress={handleAddTag}
            fullWidth
            size="small"
            helperText="Press Enter to add a tag"
            className="input-field text-input"
          />
        )}
        
        {mediaTypeConfig.defaultTags && mediaTypeConfig.defaultTags.length > 0 && (
          <Box sx={{ mt: 1, display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
            {mediaTypeConfig.defaultTags.map((tag, index) => (
              <Chip
                key={index}
                label={tag}
                onDelete={isSuperAdmin ? () => handleDeleteTag(tag) : undefined}
                size="small"
                color="primary"
                variant="outlined"
              />
            ))}
          </Box>
        )}
      </Box>
      
      <Box>
        <Typography variant="h6">Select Color for Media Type</Typography>
        <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
          This color will help identify this media type throughout the app
        </Typography>
        <ColorPicker 
          value={mediaTypeConfig.catColor || '#2196f3'}
          onChange={(color) => {
            console.log('Setting color to:', color);
            setMediaTypeConfig(prev => ({ ...prev, catColor: color }));
          }}
          usedColors={usedColors}
        />
      </Box>
      
      <FileTypeSelector 
        fileTypeCategories={fileTypeCategories}
        acceptedFileTypes={mediaTypeConfig.acceptedFileTypes}
        onChange={(newTypes) => setMediaTypeConfig(prev => ({ ...prev, acceptedFileTypes: newTypes }))}
      />
    </div>
  );

  // Debug mediaTypeConfig before rendering
  console.log('MediaTypeUploader - Current mediaTypeConfig:', {
    ...mediaTypeConfig,
    catColor: mediaTypeConfig.catColor
  });
  console.log('MediaTypeUploader - Current step:', activeStep);

  // Update dialog title to reflect create/edit mode
  const dialogTitle = isEditMode ? 'Edit Media Type' : 'Create New Media Type';

  return (
    <Dialog id='dialog-container' open={open} onClose={handleClose}>
      <DialogTitle sx={{ m: 0, p: 2 }}>
        {dialogTitle}
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
                    
                    {mediaTypeConfig.fields.map((field, index) => (
                      <FieldEditor 
                        key={index}
                        field={field}
                        index={index}
                        isEditing={editingFieldIndex === index}
                        activeField={activeField}
                        inputOptions={inputOptions}
                        onSave={handleAddField}
                        onCancel={resetFieldForm}
                        onFieldUpdate={handleFieldUpdate}
                        onFieldSelect={(index) => setActiveField(index)}
                        onEdit={handleEditField}
                        onRemove={handleRemoveField}
                      />
                    ))}
                  </div>
                )}
                
                {editingFieldIndex === null && (
                  <div className={`new-input-field-container ${currentField.type === 'Select' || currentField.type === 'MultiSelect' ? 'select-input' : ''} ${isEditing ? 'active' : ''}`}>
                    <FieldEditor 
                      field={currentField}
                      index={null}
                      isEditing={true}
                      activeField={null}
                      inputOptions={inputOptions}
                      onSave={handleAddField}
                      onCancel={resetFieldForm}
                      onFieldUpdate={handleFieldUpdate}
                      onFieldSelect={() => {}}
                      onEdit={() => {}}
                      onRemove={() => {}}
                    />
                  </div>
                )}
              </div>
             
              <div className='field-preview-container'>
                <div className="preview-header">
                  <h6>Field Preview</h6>
                  <span className="field-count">{mediaTypeConfig.fields.length} fields</span>
                </div>
                
                <FieldPreview 
                  fields={mediaTypeConfig.fields}
                  onFieldSelect={(index) => setActiveField(index)}
                />
              </div>
            </div>
          )}
          {activeStep === STEP_REVIEW && (
            <ReviewStep 
              mediaTypeConfig={mediaTypeConfig}
              inputOptions={inputOptions}
              isSuperAdmin={isSuperAdmin}
            />
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
            {isEditMode ? 'Update' : 'Create'}
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