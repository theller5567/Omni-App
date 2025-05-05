import React, { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Chip,
  IconButton,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Switch,
  Typography,
  Box,
  useMediaQuery,
  Theme,
  Alert,
  CircularProgress
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { MediaFile, MediaType } from '../../types/media';
import './EditMediaDialog.scss';
import { useSelector } from 'react-redux';
import { RootState } from '../../store/store';
import { normalizeTag } from '../../utils/mediaTypeUploaderUtils';

interface EditMediaDialogProps {
  open: boolean;
  onClose: () => void;
  mediaFile: MediaFile;
  mediaType: MediaType;
  onSave: (data: Partial<MediaFile>) => Promise<void>;
}

interface FormValues {
  title: string;
  fileName: string;
  altText: string;
  description: string;
  visibility: 'public' | 'private';
  tags: string[];
  customFields: Record<string, any>;
}


export const EditMediaDialog: React.FC<EditMediaDialogProps> = ({
  open,
  onClose,
  mediaFile,
  mediaType,
  onSave
}) => {

  // Get user role from Redux
  const userRole = useSelector((state: RootState) => state.user.currentUser.role);
  const isSuperAdmin = userRole === 'superAdmin';
  const isMobile = useMediaQuery((theme: Theme) => theme.breakpoints.down('sm'));

  const [newTag, setNewTag] = useState('');
  // Track save in progress
  const [isSaving, setIsSaving] = useState(false);
  
  // State for forcing form rerendering
  const [formVersion, setFormVersion] = useState(0);
  
  // Add state to track original values for change detection
  const [originalValues, setOriginalValues] = useState<FormValues | null>(null);
  
  // Debug: Log media file custom fields
  console.log('MediaFile customFields:', mediaFile.customFields);
  console.log('MediaType fields:', mediaType.fields);
  
  const { control, handleSubmit, watch, setValue, reset, formState } = useForm<FormValues>({
    defaultValues: {
      title: mediaFile.title || '',
      fileName: mediaFile.fileName || '',
      altText: mediaFile.altText || '',
      description: mediaFile.description || '',
      visibility: mediaFile.visibility || 'private',
      tags: mediaFile.tags || [],
      customFields: mediaFile.customFields || {} // Pass all custom fields
    }
  });

  // Reset form when the dialog opens or mediaFile changes
  useEffect(() => {
    if (open) {
      console.log('Dialog opened, resetting form with fresh values');
      
      // Create initial values object
      const initialValues = {
        title: mediaFile.title || '',
        fileName: mediaFile.fileName || '',
        altText: mediaFile.altText || '',
        description: mediaFile.description || '',
        visibility: mediaFile.visibility || 'private',
        tags: mediaFile.tags || [],
        customFields: mediaFile.customFields || {}
      };
      
      // Store original values for change detection
      setOriginalValues(initialValues);
      
      // Force reset with current mediaFile values
      reset(initialValues);
      
      // Increment version to force re-render
      setFormVersion(prev => prev + 1);
    }
  }, [open, mediaFile, reset]);

  // Initialize form with default values and ensure default tags are included
  useEffect(() => {
    // When the dialog opens, re-initialize form values from mediaFile
    console.log('Dialog open state changed or mediaFile updated, refreshing form values');
    
    // Reset form values when dialog opens or mediaFile changes
    if (open) {
      // Make sure all default tags from the media type are included in the tags
      if (mediaType && mediaType.defaultTags && mediaType.defaultTags.length > 0) {
        const currentTags = watch('tags') || [];
        const defaultTags = mediaType.defaultTags;
        
        // Check if all default tags are included
        const allDefaultTagsIncluded = defaultTags.every(tag => currentTags.includes(tag));
        
        if (!allDefaultTagsIncluded) {
          // Add any missing default tags
          const updatedTags = [...currentTags];
          defaultTags.forEach(tag => {
            if (!updatedTags.includes(tag)) {
              updatedTags.push(tag);
            }
          });
          
          // Update the form
          setValue('tags', updatedTags);
        }
      }
      
      // Ensure all MediaType fields are properly loaded
      if (mediaType && mediaType.fields && mediaType.fields.length > 0) {
        console.log('Setting initial custom field values...');
        
        // Log all available customFields for debugging
        console.log('Available customFields:', mediaFile.customFields);
        
        // Check if mediaFile has metadata as well
        if ((mediaFile as any).metadata) {
          console.log('Available metadata from mediaFile:', (mediaFile as any).metadata);
        }
        
        mediaType.fields.forEach(field => {
          // Try finding value in either customFields or metadata
          const fieldValueFromCustomFields = mediaFile.customFields?.[field.name];
          const fieldValueFromMetadata = (mediaFile as any).metadata?.[field.name];
          
          // Use the most appropriate value source
          const fieldValue = fieldValueFromCustomFields !== undefined 
            ? fieldValueFromCustomFields 
            : fieldValueFromMetadata;
          
          console.log(`Setting field "${field.name}" to:`, fieldValue, 
            `(from ${fieldValueFromCustomFields !== undefined ? 'customFields' : 'metadata'})`);
          
          // Set each field with appropriate type conversion
          if (field.type === 'boolean') {
            setValue(`customFields.${field.name}`, Boolean(fieldValue));
          } else if (field.type === 'number') {
            const numValue = fieldValue !== undefined && fieldValue !== null 
              ? Number(fieldValue) : '';
            setValue(`customFields.${field.name}`, numValue);
          } else {
            // For text, select, and other types
            setValue(`customFields.${field.name}`, fieldValue !== undefined ? fieldValue : '');
          }
        });
      }
    }
  }, [mediaType, setValue, watch, mediaFile.customFields, open, mediaFile]);

  // Reset the tag input field when the dialog opens or closes
  useEffect(() => {
    // Reset any tag-related state when dialog visibility changes
    setNewTag('');
    setUnsavedTag(null);
  }, [open]);

  const handleAddTag = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' && newTag.trim()) {
      // Normalize the tag
      const normalizedTag = normalizeTag(newTag.trim());
      
      // Check if user is a superAdmin for default tags
      const isDefaultTag = mediaType.defaultTags?.map(t => normalizeTag(t)).includes(normalizedTag);
      
      // Only allow adding tags if not a default tag, or if user is a superAdmin
      if (isDefaultTag && !isSuperAdmin) {
        return;
      }
      
      const currentTags = watch('tags');
      // Check if normalized tag already exists (case-insensitive)
      if (!currentTags.map(t => normalizeTag(t)).includes(normalizedTag)) {
        setValue('tags', [...currentTags, normalizedTag]);
      }
      setNewTag('');
    }
  };

  const handleDeleteTag = (tagToDelete: string) => {
    const normalizedTagToDelete = normalizeTag(tagToDelete);
    
    // Check if the tag is a default tag (using normalized comparison)
    const isDefaultTag = mediaType.defaultTags?.some(tag => 
      normalizeTag(tag) === normalizedTagToDelete
    );
    
    // Do not allow removing default tags from this UI
    if (isDefaultTag) {
      // For better UX, show a toast notification explaining why
      // If you have react-toastify or similar
      console.warn('Cannot remove default tag:', tagToDelete);
      return;
    }
    
    const currentTags = watch('tags');
    setValue('tags', currentTags.filter(tag => normalizeTag(tag) !== normalizedTagToDelete));
  };

  // Replace tagWarningOpen with a state to track unsaved tag warning
  const [unsavedTag, setUnsavedTag] = useState<string | null>(null);

  // Add debugging code to trace form value changes
  useEffect(() => {
    if (open && formState.isDirty) {
      const currentValues = watch();
      console.log('Form values changed:', currentValues);
      // If customFields changed, log the differences
      if (currentValues.customFields && originalValues?.customFields) {
        Object.keys(currentValues.customFields).forEach(key => {
          const newVal = currentValues.customFields[key];
          const oldVal = originalValues.customFields?.[key];
          if (newVal !== oldVal) {
            console.log(`Field "${key}" changed from:`, oldVal, 'to:', newVal);
          }
        });
      }
    }
  }, [watch, formState.isDirty, open, originalValues]);

  // Modified to debug custom fields on form submission
  const onSubmit = async (data: FormValues) => {
    if (!mediaFile) return;
    
    // Log all form data for debugging
    console.log('Form submitted with data:', data);
    console.log('Custom fields at submission:', data.customFields);
    
    // Check if there's an unpressed tag in the input
    if (newTag.trim()) {
      setUnsavedTag(newTag.trim());
      return; // Stop submission flow until user decides
    }

    // Proceed with normal async save, showing spinner
    setIsSaving(true);
    await handleFormSubmission(data);
    setIsSaving(false);
  };

  // Add these handlers for the inline alert buttons
  const handleAddUnsavedTag = () => {
    if (unsavedTag) {
      const normalizedTag = normalizeTag(unsavedTag);
      const currentTags = watch('tags');
      
      // Check if normalized tag already exists (case-insensitive)
      if (!currentTags.map(t => normalizeTag(t)).includes(normalizedTag)) {
        // Add the tag
        const updatedTags = [...currentTags, normalizedTag];
        setValue('tags', updatedTags);
        
        // Proceed with form submission after adding tag
        const currentData = watch();
        currentData.tags = updatedTags;
        handleFormSubmission(currentData);
      }
    }
    setNewTag('');
    setUnsavedTag(null);
  };

  const handleIgnoreUnsavedTag = () => {
    // Skip adding tag and continue with form submission
    setUnsavedTag(null);
    setNewTag(''); // Clear the tag input
    handleFormSubmission(watch());
  };

  // Create a handler for when the dialog is closed
  const handleDialogClose = () => {
    // Clear any unsaved tag input when closing the dialog
    setNewTag('');
    setUnsavedTag(null);
    onClose();
  };

  // Extract the submission logic to a separate function to avoid duplication
  const handleFormSubmission = async (data: FormValues) => {
    // Ensure all default tags are included
    if (mediaType && mediaType.defaultTags) {
      const finalTags = [...data.tags];
      let tagsChanged = false;
      
      // Add any missing default tags
      mediaType.defaultTags.forEach(tag => {
        const normalizedDefaultTag = normalizeTag(tag);
        // Check if this default tag is missing (using normalized comparison)
        if (!finalTags.some(t => normalizeTag(t) === normalizedDefaultTag)) {
          finalTags.push(tag);
          tagsChanged = true;
        }
      });
      
      // Update the tags if they were changed
      if (tagsChanged) {
        data.tags = finalTags;
      }
    }

    // Check if any values have actually changed before saving
    const hasChanged = 
      data.title !== (originalValues?.title || '') ||
      data.fileName !== (originalValues?.fileName || '') ||
      data.altText !== (originalValues?.altText || '') ||
      data.description !== (originalValues?.description || '') ||
      data.visibility !== (originalValues?.visibility || '') ||
      !compareArrays(data.tags, originalValues?.tags || []) ||
      !compareObjects(data.customFields, originalValues?.customFields || {});
    
    // Only proceed with save if changes were made
    if (hasChanged) {
      // Debug: Log custom fields before submission
      console.log('Form custom fields before submission:', data.customFields);
      
      // Create object with only the changed fields to minimize what's sent to the server
      const changedData: any = {
        id: mediaFile.id,
        _id: mediaFile._id || mediaFile.id, // Include MongoDB ID
        slug: (mediaFile as any).slug, // Use type assertion
      };
      
      // Only include fields that actually changed
      if (data.title !== (originalValues?.title || '')) {
        changedData.title = data.title;
      }
      
      // Create metadata object for changes
      changedData.metadata = {};
        
      // Only add metadata fields that changed
      if (data.fileName !== (originalValues?.fileName || '')) {
        changedData.metadata.fileName = data.fileName;
      }
      
      if (data.altText !== (originalValues?.altText || '')) {
        changedData.metadata.altText = data.altText;
      }
      
      if (data.description !== (originalValues?.description || '')) {
        changedData.metadata.description = data.description;
      }
      
      if (data.visibility !== (originalValues?.visibility || '')) {
        changedData.metadata.visibility = data.visibility;
      }
      
      if (!compareArrays(data.tags, originalValues?.tags || [])) {
        changedData.metadata.tags = data.tags;
      }
      
      // Only include mediaType fields that have actually changed
      if (data.customFields && mediaType.fields && originalValues?.customFields) {
        console.log('Checking for changed mediaType fields');
        
        let changedFieldsCount = 0;
        
        mediaType.fields.forEach(field => {
          const newValue = data.customFields[field.name];
          const originalValue = originalValues.customFields?.[field.name];
          
          // Determine if the value has changed based on type
          let hasChanged = false;
          
          // For objects, use JSON comparison
          if (typeof newValue === 'object' || typeof originalValue === 'object') {
            hasChanged = JSON.stringify(newValue) !== JSON.stringify(originalValue);
          } 
          // For booleans, do direct comparison
          else if (typeof newValue === 'boolean') {
            hasChanged = newValue !== originalValue;
          } 
          // For numbers, convert both to numbers for comparison
          else if (typeof newValue === 'number' || !isNaN(Number(newValue))) {
            const numNewValue = typeof newValue === 'number' ? newValue : Number(newValue);
            const numOriginalValue = typeof originalValue === 'number' ? originalValue : Number(originalValue);
            hasChanged = numNewValue !== numOriginalValue;
          }
          // For strings and other types
          else {
            hasChanged = newValue !== originalValue;
          }
          
          // Only include field if it has changed
          if (hasChanged) {
            changedFieldsCount++;
            console.log(`Field "${field.name}" changed from "${originalValue}" to "${newValue}"`);
            
            // Handle specific types correctly
            if (typeof newValue === 'boolean') {
              changedData.metadata[field.name] = newValue;
            }
            else if (typeof newValue === 'number' || !isNaN(Number(newValue))) {
              const numValue = typeof newValue === 'number' ? newValue : Number(newValue);
              changedData.metadata[field.name] = numValue;
            }
            else if (newValue !== undefined) {
              changedData.metadata[field.name] = newValue;
            }
          } else {
            // Log that this field didn't change
            console.log(`Field "${field.name}" unchanged: "${newValue}"`);
          }
        });
        
        console.log(`Found ${changedFieldsCount} changed mediaType fields`);
      }
      
      // If no metadata fields changed, remove empty metadata object
      if (Object.keys(changedData.metadata).length === 0) {
        delete changedData.metadata;
      }


      try {
        setIsSaving(true);
        await onSave(changedData);
        setIsSaving(false);
      } catch (error) {
        setIsSaving(false);
        console.error('Error saving media:', error);
        // You might want to show an error message here
      }
    } else {
      console.log('No changes detected. Skipping save operation.');
    }
    
    // Use handleDialogClose instead of directly calling onClose to ensure we clear the tag input
    handleDialogClose();
  };

  // Helper function to compare arrays (for tags)
  const compareArrays = (arr1: any[], arr2: any[]): boolean => {
    if (arr1.length !== arr2.length) return false;
    
    // Sort and normalize tags for comparison
    const sorted1 = [...arr1].map(tag => normalizeTag(tag)).sort();
    const sorted2 = [...arr2].map(tag => normalizeTag(tag)).sort();
    
    return sorted1.every((val, i) => val === sorted2[i]);
  };

  // Helper function to compare objects (for customFields)
  const compareObjects = (obj1: Record<string, any>, obj2: Record<string, any>): boolean => {
    // Get non-empty keys from both objects
    const keys1 = Object.keys(obj1).filter(key => obj1[key] !== undefined && obj1[key] !== '');
    const keys2 = Object.keys(obj2).filter(key => obj2[key] !== undefined && obj2[key] !== '');
    
    // Log comparison details for debugging
    console.log('Comparing custom fields:', {
      obj1Count: keys1.length,
      obj2Count: keys2.length,
      keys1,
      keys2
    });
    
    // If key counts don't match, objects are different
    if (keys1.length !== keys2.length) {
      console.log('Key count mismatch, fields have changed');
      return false;
    }
    
    // Compare each field value 
    let allMatch = true;
    keys1.forEach(key => {
      // Skip special fields that are managed differently
      if (['thumbnailUrl'].includes(key)) return;
      
      const val1 = obj1[key];
      const val2 = obj2[key];
      
      // For non-primitive types (objects, arrays), use JSON comparison
      const isEqual = typeof val1 === 'object' || typeof val2 === 'object' 
        ? JSON.stringify(val1) === JSON.stringify(val2)
        : val1 === val2;
      
      if (!isEqual) {
        console.log(`Field "${key}" changed:`, {
          from: val2,
          to: val1,
          type1: typeof val1,
          type2: typeof val2
        });
        allMatch = false;
      }
    });
    
    return allMatch;
  };

  const renderCustomField = (field: MediaType['fields'][0], value: any, onChange: (value: any) => void) => {
    // Use field.label if available, otherwise use field.name
    const displayLabel = field.label || field.name;
    
    // Ensure the value is properly formatted based on field type
    let formattedValue = value;
    
    // Debug the field value
    console.log(`Formatting field "${field.name}" of type "${field.type}" with value:`, value);
    
    switch (field.type) {
      case 'text':
        formattedValue = value || '';
        return (
          <TextField
            label={displayLabel}
            value={formattedValue}
            onChange={(e) => onChange(e.target.value)}
            fullWidth
            size="small"
            required={field.required}
          />
        );
      case 'number':
        // Ensure we have a numeric value or empty string
        formattedValue = value !== undefined && value !== null ? Number(value) : '';
        return (
          <TextField
            label={displayLabel}
            value={formattedValue}
            onChange={(e) => {
              const numericValue = e.target.value === '' ? '' : Number(e.target.value);
              onChange(numericValue);
            }}
            type="number"
            fullWidth
            size="small"
            required={field.required}
          />
        );
      case 'select':
        // Ensure we have a valid selection
        formattedValue = value || '';
        return (
          <FormControl fullWidth size="small" required={field.required}>
            <InputLabel>{displayLabel}</InputLabel>
            <Select
              value={formattedValue}
              onChange={(e) => onChange(e.target.value)}
              label={displayLabel}
            >
              {field.options?.map((option) => (
                <MenuItem key={option} value={option}>
                  {option}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        );
      case 'boolean':
        // Ensure we have a boolean value
        formattedValue = Boolean(value);
        return (
          <FormControlLabel
            control={
              <Switch
                checked={formattedValue}
                onChange={(e) => onChange(e.target.checked)}
              />
            }
            label={displayLabel}
          />
        );
      default:
        // For any other type, use a text field
        formattedValue = value || '';
        return (
          <TextField
            label={displayLabel}
            value={formattedValue}
            onChange={(e) => onChange(e.target.value)}
            fullWidth
            size="small"
          />
        );
    }
  };

  return (
    <Dialog
      key={`media-edit-${mediaFile.id}-${open}`}
      open={open}
      onClose={handleDialogClose}
      className="edit-media-dialog"
      maxWidth="md"
      fullWidth
      fullScreen={isMobile}
    >
      <DialogTitle className="dialog-title">
        Edit Media Details
        <IconButton
          onClick={handleDialogClose}
          sx={{ position: 'absolute', right: 8, top: 8 }}
          size={isMobile ? "small" : "medium"}
        >
          <CloseIcon fontSize={isMobile ? "small" : "medium"} />
        </IconButton>
      </DialogTitle>
      
      <DialogContent className="dialog-content">
        <form 
          key={`form-${mediaFile.id}-${formVersion}`}
          onSubmit={handleSubmit(onSubmit)} 
          className="edit-form"
        >
          {/* Unsaved tag warning alert */}
          {unsavedTag && (
            <Alert 
              severity="warning" 
              sx={{ mb: 2 }}
              action={
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Button 
                    color="primary" 
                    size="small" 
                    onClick={handleAddUnsavedTag}
                    sx={{ mr: 1 }}
                  >
                    Add Tag
                  </Button>
                  <Button 
                    color="inherit" 
                    size="small" 
                    onClick={handleIgnoreUnsavedTag}
                  >
                    Ignore
                  </Button>
                </Box>
              }
            >
              You have an unsaved tag: <strong>"{unsavedTag}"</strong>
            </Alert>
          )}

          {/* Basic Information Section (CSS grid) */}
          <Box className="form-section" sx={{ marginTop: isMobile ? 2 : 4, padding: 2, marginBottom: 0 }}>
            <Typography variant={isMobile ? "subtitle1" : "h6"} gutterBottom>Basic Information</Typography>
            <Box sx={{
              display: 'grid',
              gap: isMobile ? 2 : 4,
              gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr'
            }}>
              <Box>
                <Controller
                  name="title"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="Title"
                      fullWidth
                      size="small"
                    />
                  )}
                />
              </Box>
              <Box>
                <Controller
                  name="fileName"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="File Name"
                      fullWidth
                      size="small"
                    />
                  )}
                />
              </Box>
              <Box>
                <Controller
                  name="altText"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="Alt Text"
                      fullWidth
                      size="small"
                    />
                  )}
                />
              </Box>
              <Box>
                <Controller
                  name="visibility"
                  control={control}
                  render={({ field }) => (
                    <FormControl fullWidth size="small">
                      <InputLabel>Visibility</InputLabel>
                      <Select {...field} label="Visibility">
                        <MenuItem value="public">Public</MenuItem>
                        <MenuItem value="private">Private</MenuItem>
                      </Select>
                    </FormControl>
                  )}
                />
              </Box>
              <Box sx={{ gridColumn: '1 / -1' }}>
                <Controller
                  name="description"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="Description"
                      fullWidth
                      multiline
                      rows={isMobile ? 3 : 2}
                      size="small"
                    />
                  )}
                />
              </Box>
            </Box>
          </Box>

          {/* Custom Fields Section */}
          {mediaType.fields.length > 0 && (
            <Box className="form-section" sx={{ marginTop: isMobile ? 2 : 4, padding: 2 }}>
              <Typography variant={isMobile ? "subtitle1" : "h6"} gutterBottom>{mediaType.name} Fields</Typography>
              <Box sx={{ display: 'grid', gap: isMobile ? 2 : 4, gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr' }}>
                {mediaType.fields.map((field) => {
                  // Log the current field definition and its value
                  console.log(`Rendering field "${field.name}" (${field.type}):`, 
                    mediaFile.customFields?.[field.name]);
                    
                  return (
                    <Box key={field.name}>
                      <Controller
                        name={`customFields.${field.name}`}
                        control={control}
                        defaultValue={mediaFile.customFields?.[field.name] || ''}
                        render={({ field: { value, onChange } }) => {
                          // Log each value change 
                          const handleChange = (newValue: any) => {
                            console.log(`Field "${field.name}" changed to:`, newValue);
                            onChange(newValue);
                          };
                          return renderCustomField(field, value, handleChange);
                        }}
                      />
                    </Box>
                  );
                })}
              </Box>
            </Box>
          )}

          <Box className="form-section" sx={{ marginTop: isMobile ? 2 : 4, padding: 2 }}>
            <Typography variant={isMobile ? "subtitle1" : "h6"} gutterBottom>Tags</Typography>
            <Typography variant="caption" color="text.secondary" sx={{ mb: isMobile ? 1 : 2, display: 'block', fontSize: isMobile ? '0.7rem' : '0.75rem' }}>
              Default tags from the media type cannot be removed here. They can only be modified by superAdmins in the Media Types settings.
            </Typography>
            <Box sx={{ display: 'grid', gap: isMobile ? 2 : 4 }}>
              <Box>
                <TextField
                  label="Add Tags"
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  onKeyDown={handleAddTag}
                  fullWidth
                  size="small"
                  helperText="Press Enter to add a tag"
                />
                <Box sx={{ mt: 1, display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {watch('tags').map((tag) => {
                    const isDefaultTag = mediaType.defaultTags?.includes(tag);
                    return (
                      <Chip
                        key={tag}
                        label={tag}
                        onDelete={isDefaultTag ? undefined : () => handleDeleteTag(tag)}
                        size="small"
                        color={isDefaultTag ? "primary" : "default"}
                        sx={isDefaultTag ? {
                          borderWidth: isMobile ? '1px' : '2px',
                          borderStyle: 'solid',
                          borderColor: 'var(--secondary-color)',
                          position: 'relative',
                        } : {}}
                        title={isDefaultTag ? "This is a default tag from the media type and cannot be removed" : "Click 'x' to remove this tag"}
                      />
                    );
                  })}
                </Box>
              </Box>
            </Box>
          </Box>
        </form>
      </DialogContent>

      <DialogActions className="dialog-actions">
        <Button onClick={handleDialogClose} size={isMobile ? "small" : "medium"}>Cancel</Button>
        <Button
          onClick={handleSubmit(onSubmit)}
          variant="contained"
          color="primary"
          size={isMobile ? "small" : "medium"}
          disabled={isSaving}
        >
          {isSaving ? <CircularProgress size={20} /> : 'Save Changes'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

// Export as both named and default export for lazy loading support
export default EditMediaDialog;