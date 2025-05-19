import React, { useState, useEffect, useCallback } from 'react';
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
  Chip,
  CircularProgress,
  Tooltip,
  Backdrop
} from '@mui/material';
import { toast } from 'react-toastify';
import axios from 'axios';
import { FaArrowRight, FaArrowLeft, FaSave, FaQuestionCircle } from 'react-icons/fa';
import CloseIcon from '@mui/icons-material/Close';
import { 
  MediaTypeConfig, 
  MediaTypeField, 
  FieldType, 
  createField,
} from '../../types/mediaTypes';
import '../MediaTypeUploader.scss';
import env from '../../config/env';
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
  predefinedColors,
  normalizeTag
} from '../../utils/mediaTypeUploaderUtils';
import { FaImage, FaVideo, FaFileAudio, FaFileWord } from 'react-icons/fa';
import debounce from 'lodash/debounce';
import {
  useMediaTypes,
  useUpdateMediaType,
  useCreateMediaType,
  useUserProfile
} from '../../hooks/query-hooks';
import { useQueryClient } from '@tanstack/react-query';

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

// Debug logging function
const logSettings = (action: string, settings: any) => {
  console.log(`[MediaTypeUploader] ${action}:`, {
    settings,
    allowRelatedMedia: settings?.allowRelatedMedia,
    type: typeof settings,
    isObject: settings !== null && typeof settings === 'object'
  });
};

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
  _id: undefined,
  settings: {
    allowRelatedMedia: false
  }
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

// Define interface for ConfirmationDialog props
interface ConfirmationDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  message?: string;
}

// Confirmation dialog component
const ConfirmationDialog: React.FC<ConfirmationDialogProps> = ({ 
  open, 
  onClose, 
  onConfirm, 
  title = 'Confirm Action', 
  message = 'Are you sure you want to proceed?' 
}) => (
  <Dialog open={open} onClose={onClose}>
    <DialogTitle>{title}</DialogTitle>
    <DialogContent>
      <Typography>{message}</Typography>
    </DialogContent>
    <DialogActions>
      <Button onClick={onClose} color="primary">Cancel</Button>
      <Button onClick={() => { onConfirm(); onClose(); }} color="error" variant="contained">
        Confirm
      </Button>
    </DialogActions>
  </Dialog>
);

const MediaTypeUploader: React.FC<MediaTypeUploaderProps> = ({ open, onClose, editMediaTypeId }) => {
  // Set up TanStack Query hooks
  const queryClient = useQueryClient();
  const { data: mediaTypes = [] } = useMediaTypes();
  const { mutateAsync: createMediaTypeMutation } = useCreateMediaType();
  const { mutateAsync: updateMediaTypeMutation } = useUpdateMediaType();
  const { data: userProfile, isLoading: isUserProfileLoading, error: userProfileError } = useUserProfile();
  
  // Get the current user role
  const userRole = userProfile?.role;
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
  
  // Loading states
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  // Track unsaved changes
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  
  // Confirmation dialog state
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [confirmAction, setConfirmAction] = useState<() => void>(() => {});
  const [confirmDialogConfig, setConfirmDialogConfig] = useState({
    title: 'Confirm Action',
    message: 'Are you sure you want to proceed?'
  });

  // Effect to initialize media type for editing
  useEffect(() => {
    if (open && editMediaTypeId) {
      setIsLoading(true);
      const mediaTypeToEdit = mediaTypes.find(type => type._id === editMediaTypeId);
      if (mediaTypeToEdit) {
        // Define interface for the field structure from backend
        interface ApiField {
          name: string;
          type: string;
          options?: string[];
          required?: boolean;
        }
        
        // Convert field types to ensure compatibility
        const convertedFields = mediaTypeToEdit.fields?.map((field: ApiField) => ({
          name: field.name,
          type: field.type as FieldType,
          options: field.options || [],
          required: field.required || false
        })) || [];
        
        // Log settings from media type
        logSettings('mediaTypeToEdit settings', mediaTypeToEdit.settings);
        
        setMediaTypeConfig({
          _id: mediaTypeToEdit._id,
          name: mediaTypeToEdit.name,
          fields: convertedFields,
          baseType: mediaTypeToEdit.baseType || 'Media',
          includeBaseFields: mediaTypeToEdit.includeBaseFields !== false,
          acceptedFileTypes: mediaTypeToEdit.acceptedFileTypes || [],
          status: mediaTypeToEdit.status || 'active',
          catColor: mediaTypeToEdit.catColor || '#2196f3',
          defaultTags: mediaTypeToEdit.defaultTags || [],
          settings: mediaTypeToEdit.settings || { allowRelatedMedia: false }
        });
        setIsEditMode(true);
      }
      setIsLoading(false);
    } else if (open && !editMediaTypeId) {
      // Reset for creating a new media type
      setMediaTypeConfig(initialMediaTypeConfig);
      setIsEditMode(false);
    }
    
    // Reset unsaved changes when dialog opens
    if (open) {
      setHasUnsavedChanges(false);
    }
  }, [open, editMediaTypeId, mediaTypes]);

  // Add keyboard navigation support
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!open) return;
      
      // ESC key - confirm before closing if changes made
      if (e.key === 'Escape' && hasUnsavedChanges) {
        e.preventDefault();
        confirmClose();
        return;
      }
      
      // Enter on final step submits form
      if (e.key === 'Enter' && !e.shiftKey && activeStep === STEP_REVIEW && !isSaving) {
        e.preventDefault();
        handleSaveMediaType();
        return;
      }
      
      // Tab + Alt navigation between steps
      if (e.key === 'ArrowRight' && e.altKey) {
        e.preventDefault();
        if (activeStep < STEP_REVIEW) handleNext();
        return;
      }
      
      if (e.key === 'ArrowLeft' && e.altKey) {
        e.preventDefault();
        if (activeStep > STEP_NAME) handleBack();
        return;
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, activeStep, hasUnsavedChanges, isSaving]);
  
  // Track changes
  useEffect(() => {
    if (open && 
      (mediaTypeConfig.name !== initialMediaTypeConfig.name ||
       mediaTypeConfig.fields.length > 0 ||
       mediaTypeConfig.acceptedFileTypes.length > 0 ||
       (mediaTypeConfig.defaultTags?.length || 0) > 0 ||
       mediaTypeConfig.catColor !== initialMediaTypeConfig.catColor)
    ) {
      setHasUnsavedChanges(true);
    }
  }, [open, mediaTypeConfig]);

  const steps = ['Name Media Type', 'Add Fields', 'Review & Submit'];

  // Get used colors from existing media types
  const usedColors = React.useMemo(() => {
    // More explicit mapping to ensure we get the catColor property from each media type
    const colors = mediaTypes
      .filter(type => mediaTypeConfig._id !== type._id) // Exclude the current media type
      .map(type => {
        return type.catColor;
      })
      .filter(color => color !== undefined && color !== null) as string[];
    return colors;
  }, [mediaTypes, mediaTypeConfig._id, open]);

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
  
  // Confirmation for closing dialog with unsaved changes
  const confirmClose = useCallback(() => {
    if (hasUnsavedChanges) {
      setConfirmDialogConfig({
        title: 'Discard Changes?',
        message: 'You have unsaved changes. Are you sure you want to close?'
      });
      setConfirmAction(() => handleClose);
      setShowConfirmDialog(true);
    } else {
      handleClose();
    }
  }, [hasUnsavedChanges]);

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
    if (isSaving) return; // Prevent multiple submissions
    
    try {
      if (!mediaTypeConfig.name || !mediaTypeConfig.acceptedFileTypes?.length) {
        toast.error('Please fill in all required fields');
        return;
      }

      setIsSaving(true);

      // Make sure we have a color - use default if not specified
      const catColor = mediaTypeConfig.catColor || '#2196f3';
      const colorName = predefinedColors.find(c => c.hex === catColor)?.name || 'Default Blue';
      
      // Log settings before saving
      logSettings('Before creating API data, settings', mediaTypeConfig.settings);
      
      // Create API data from the media type config
      const apiData = {
        ...transformConfigToApiData(mediaTypeConfig),
        catColor, // Make sure catColor is explicitly included
        settings: {
          allowRelatedMedia: mediaTypeConfig.settings?.allowRelatedMedia || false
        }
      };
      
      // Log API data
      console.log('API data being sent:', JSON.stringify(apiData, null, 2));
      
      if (isEditMode && mediaTypeConfig._id) {
        try {
          // Use TanStack Query mutation to update media type
          await updateMediaTypeMutation({ 
            id: mediaTypeConfig._id as string, 
            updates: apiData 
          });
          
          // Also make a specific request to update the settings field
          if (mediaTypeConfig.settings) {
            try {
              await axios.post(
                `${env.BASE_URL}/api/media-types/update-settings/${mediaTypeConfig._id}`,
                { allowRelatedMedia: mediaTypeConfig.settings.allowRelatedMedia }
              );
              console.log('Successfully updated settings separately');
            } catch (settingsError) {
              console.error('Error updating settings separately:', settingsError);
            }
          }
          
          // Success message is already handled by the mutation hook
          console.log(`Media Type '${mediaTypeConfig.name}' updated successfully`);
          
          // Invalidate queries to ensure data is refreshed
          queryClient.invalidateQueries({ queryKey: ['mediaTypes'] });
        } catch (error: any) {
          // Error is already handled by the mutation hook
          console.error('Error updating media type:', error);
          throw error;
        }
      } else {
        try {
          // Use TanStack Query mutation to create new media type
          const createdMediaType = await createMediaTypeMutation(apiData);
          
          // Also make a specific request to update the settings field
          if (mediaTypeConfig.settings && createdMediaType._id) {
            try {
              await axios.post(
                `${env.BASE_URL}/api/media-types/update-settings/${createdMediaType._id}`,
                { allowRelatedMedia: mediaTypeConfig.settings.allowRelatedMedia }
              );
              console.log('Successfully added settings separately for new media type');
            } catch (settingsError) {
              console.error('Error adding settings separately for new media type:', settingsError);
            }
          }
          
          // Success message is already handled by the mutation hook
          console.log(`Media Type '${mediaTypeConfig.name}' added successfully with color: ${colorName}`);
          
          // Invalidate queries to ensure data is refreshed
          queryClient.invalidateQueries({ queryKey: ['mediaTypes'] });
        } catch (error: any) {
          // Error is already handled by the mutation hook
          console.error('Error creating media type:', error);
          throw error;
        }
      }
      
      setHasUnsavedChanges(false);
      onClose();
    } catch (error) {
      console.error('Failed to save media type', error);
    } finally {
      setIsSaving(false);
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
    setHasUnsavedChanges(false);
    onClose();
  };

  const handleDeleteTag = (tagToDelete: string) => {
    // Only superAdmins can delete tags
    if (!isSuperAdmin) return;
    
    const normalizedTagToDelete = normalizeTag(tagToDelete);
    setMediaTypeConfig(prev => ({
      ...prev,
      defaultTags: prev.defaultTags?.filter(tag => normalizeTag(tag) !== normalizedTagToDelete) || []
    }));
  };
  
  // Function to add a new tag and handle validation
  const addNewTag = (tag: string) => {
    if (!isSuperAdmin) return;
    
    const normalizedTag = normalizeTag(tag);
    if (normalizedTag && !mediaTypeConfig.defaultTags?.map(t => normalizeTag(t)).includes(normalizedTag)) {
      setMediaTypeConfig(prev => ({
        ...prev,
        defaultTags: [...(prev.defaultTags || []), normalizedTag]
      }));
      setNewTag('');
    } else if (normalizedTag) {
      // Tag already exists, just clear the input
      setNewTag('');
    }
  };

  const handleAddTag = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      addNewTag(newTag);
      event.preventDefault(); // Prevent form submission
    }
  };
  
  // Create debounced version of name field change handler
  const debouncedNameChange = useCallback(
    debounce((value: string) => {
      setMediaTypeConfig(prev => ({ ...prev, name: value }));
    }, 300),
    []
  );

  // Update dialog title to reflect create/edit mode
  const dialogTitle = isEditMode ? 'Edit Media Type' : 'Create New Media Type';

  const renderFirstStep = () => (
    <div className="step-container">
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
        <Typography variant="h6">Select Media Type Name</Typography>
        <Tooltip title="Choose a descriptive name that identifies the purpose of this media type">
          <IconButton size="small" sx={{ ml: 1 }}>
            <FaQuestionCircle size={14} />
          </IconButton>
        </Tooltip>
      </Box>
      
      <TextField
        label="Media Type Name"
        defaultValue={mediaTypeConfig.name}
        onChange={(e) => {
          // Use local state immediately for responsive UI
          debouncedNameChange(e.target.value);
        }}
        fullWidth
        className="input-field text-input"
        autoFocus
        helperText="Name should be unique and descriptive"
        error={mediaTypeConfig.name.trim() === '' && hasUnsavedChanges}
      />
      
      <Box sx={{ mt: 3, mb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
          <Typography variant="h6">Default Tags</Typography>
          <Tooltip title="These tags will automatically be applied to all media uploaded with this type">
            <IconButton size="small" sx={{ ml: 1 }}>
              <FaQuestionCircle size={14} />
            </IconButton>
          </Tooltip>
        </Box>
        
        <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
          These tags will be automatically applied to all media files created with this type
          {!isSuperAdmin && (
            <Typography variant="caption" color="error" sx={{ display: 'block', mt: 1 }}>
              * Only Super Admins can add or modify default tags
            </Typography>
          )}
        </Typography>
        
        {isSuperAdmin && (
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-start', width: '100%' }}>
            <TextField
              label="Add Default Tags"
              value={newTag}
              onChange={(e) => setNewTag(e.target.value)}
              onKeyPress={handleAddTag}
              onBlur={() => addNewTag(newTag)}
              fullWidth
              size="small"
              helperText="Press Enter to add a tag or click Add"
              className="input-field text-input"
            />
            <Button 
              variant="outlined"
              onClick={() => addNewTag(newTag)}
              sx={{ mt: 0.5 }}
              disabled={!newTag.trim()}
            >
              Add
            </Button>
          </Box>
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
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
          <Typography variant="h6">Select Color for Media Type</Typography>
          <Tooltip title="This color will help users identify this media type visually in the interface">
            <IconButton size="small" sx={{ ml: 1 }}>
              <FaQuestionCircle size={14} />
            </IconButton>
          </Tooltip>
        </Box>
        
        <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
          This color will help identify this media type throughout the app
        </Typography>
        <ColorPicker 
          value={mediaTypeConfig.catColor || '#2196f3'}
          onChange={(color) => {
            setMediaTypeConfig(prev => ({ ...prev, catColor: color }));
          }}
          usedColors={usedColors}
        />
      </Box>
      
      <Box sx={{ mt: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
          <Typography variant="h6">Select Accepted File Types</Typography>
          <Tooltip title="Choose which file types this media type will accept for upload">
            <IconButton size="small" sx={{ ml: 1 }}>
              <FaQuestionCircle size={14} />
            </IconButton>
          </Tooltip>
        </Box>
        
        <FileTypeSelector 
          fileTypeCategories={fileTypeCategories}
          acceptedFileTypes={mediaTypeConfig.acceptedFileTypes}
          onChange={(newTypes) => setMediaTypeConfig(prev => ({ ...prev, acceptedFileTypes: newTypes }))}
        />
        
        {mediaTypeConfig.acceptedFileTypes.length === 0 && hasUnsavedChanges && (
          <Typography variant="caption" color="error" sx={{ mt: 1, display: 'block' }}>
            *At least one file type must be selected
          </Typography>
        )}
      </Box>

      <Box sx={{ mt: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
          <Typography variant="h6">Related Media Settings</Typography>
          <Tooltip title="Allow users to associate related media files with this media type">
            <IconButton size="small" sx={{ ml: 1 }}>
              <FaQuestionCircle size={14} />
            </IconButton>
          </Tooltip>
        </Box>
        
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <input 
            type="checkbox" 
            id="allowRelatedMedia"
            checked={mediaTypeConfig.settings?.allowRelatedMedia || false}
            onChange={(e) => {
              const newSettings = {
                ...mediaTypeConfig.settings,
                allowRelatedMedia: e.target.checked
              };
              logSettings('Checkbox changed, new settings', newSettings);
              setMediaTypeConfig(prev => ({
                ...prev,
                settings: newSettings
              }));
            }}
            style={{ marginRight: '8px' }}
          />
          <label htmlFor="allowRelatedMedia">
            <Typography variant="body1">
              Allow related media to be attached to this media type
            </Typography>
          </label>
        </Box>
        <Typography variant="body2" color="textSecondary" sx={{ mt: 1, ml: 4 }}>
          This will add a section to the metadata form where users can choose related media files
        </Typography>
      </Box>
    </div>
  );

  return (
    <>
      <Dialog 
        id='dialog-container' 
        open={open} 
        onClose={confirmClose}
        aria-labelledby="media-type-dialog-title"
        maxWidth="md"
        fullWidth
      >
        <DialogTitle id="media-type-dialog-title" sx={{ m: 0, p: 2 }}>
          {dialogTitle}
          <IconButton
            aria-label="close"
            onClick={confirmClose}
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
        
        {isLoading ? (
          <DialogContent sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 400 }}>
            <CircularProgress />
          </DialogContent>
        ) : open && (
          <>
            <DialogContent className='dialog-inner' style={{width: '100%', height: '600px'}}>
              <Stepper activeStep={activeStep} alternativeLabel sx={{marginBottom: '3rem'}}>
                {steps.map((label, index) => (
                  <Step key={label}>
                    <StepLabel
                      StepIconProps={{
                        sx: { cursor: 'pointer' }
                      }}
                      onClick={() => {
                        // Allow clicking on completed steps to navigate back
                        if (index < activeStep) {
                          setActiveStep(index);
                        }
                      }}
                    >
                      {label}
                    </StepLabel>
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
                disabled={activeStep === STEP_NAME || isSaving}
                startIcon={<FaArrowLeft />}
                variant="outlined"
                size="large"
              >
                Back
              </Button>
              
              <Button 
                onClick={confirmClose}
                variant="text" 
                sx={{ position: 'absolute', left: '50%', transform: 'translateX(-50%)' }}
                disabled={isSaving}
              >
                Cancel
              </Button>
              
              {activeStep === STEP_REVIEW ? (
                <Button 
                  onClick={handleSaveMediaType} 
                  color="primary" 
                  variant="contained" 
                  startIcon={isSaving ? <CircularProgress size={16} color="inherit" /> : <FaSave />}
                  size="large"
                  disabled={isSaving}
                >
                  {isEditMode ? 'Update' : 'Create'}
                </Button>
              ) : (
                <Button 
                  onClick={handleNext} 
                  color="primary"
                  variant="contained"
                  endIcon={<FaArrowRight />}
                  disabled={
                    (activeStep === STEP_NAME && (mediaTypeConfig.name.trim() === '' || mediaTypeConfig.acceptedFileTypes.length === 0)) || 
                    isSaving
                  }
                  size="large"
                >
                  Next
                </Button>
              )}
            </DialogActions>
          </>
        )}
      </Dialog>
      
      {/* Backdrop for saving state */}
      <Backdrop
        sx={{ 
          color: '#fff', 
          zIndex: (theme) => theme.zIndex.drawer + 1,
          position: 'absolute'
        }}
        open={isSaving}
      >
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
          <CircularProgress color="inherit" />
          <Typography variant="h6">
            {isEditMode ? 'Updating' : 'Creating'} Media Type...
          </Typography>
        </Box>
      </Backdrop>
      
      {/* Confirmation Dialog */}
      <ConfirmationDialog
        open={showConfirmDialog}
        onClose={() => setShowConfirmDialog(false)}
        onConfirm={() => {
          confirmAction();
          setShowConfirmDialog(false);
        }}
        title={confirmDialogConfig.title}
        message={confirmDialogConfig.message}
      />
    </>
  );
};

// Export the memoized component to prevent unnecessary re-renders
export default React.memo(MediaTypeUploader); 