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
import { MediaFile, MediaType } from '../../../types/media';
import '../styles/EditMediaDialog.scss';
import { useUserProfile } from '../../../hooks/query-hooks';
import { normalizeTag } from '../../../utils/mediaTypeUploaderUtils';
import { toast } from 'react-toastify';

// Define interface for MediaTypeField if it's missing from imports
interface MediaTypeField {
  name: string;
  type: string;
  required?: boolean;
  options?: string[];
  label?: string;
  [key: string]: any;
}

// Don't extend MediaFile if there are compatibility issues, define directly
interface ExtendedMediaFile {
  _id?: string;
  id?: string;
  title?: string;
  slug?: string;
  fileName?: string;
  altText?: string;
  description?: string;
  visibility?: 'public' | 'private';
  tags?: string[];
  customFields?: Record<string, any>;
  fileExtension?: string;
  fileSize?: number;
  mediaType?: string;
  location?: string;
  modifiedDate?: string;
  metadata?: {
    fileName?: string;
    altText?: string;
    description?: string;
    visibility?: 'public' | 'private';
    tags?: string[];
    [key: string]: any;
  };
}

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

interface EditMediaDialogProps {
  open: boolean;
  onClose: () => void;
  mediaFile: ExtendedMediaFile;
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
  const { data: userProfile } = useUserProfile();
  const userRole = userProfile?.role;
  const isSuperAdmin = userRole === 'superAdmin';
  const isMobile = useMediaQuery((theme: Theme) => theme.breakpoints.down('sm'));

  const [newTag, setNewTag] = useState('');
  // Track save in progress
  const [isSaving, setIsSaving] = useState(false);
  
  // State for forcing form rerendering
  const [formVersion, setFormVersion] = useState(0);
  
  // Add state to track original values for change detection
  const [originalValues, setOriginalValues] = useState<FormValues | null>(null);
  
  // Replace tagWarningOpen with a state to track unsaved tag warning
  const [unsavedTag, setUnsavedTag] = useState<string | null>(null);

  // Determine the source for custom fields for defaultValues
  let defaultCustomFieldsData = mediaFile.customFields;
  if (defaultCustomFieldsData === undefined && mediaFile.metadata && mediaType && mediaType.fields) {
    defaultCustomFieldsData = {};
    mediaType.fields.forEach((fieldDefinition: MediaTypeField) => {
      if (Object.prototype.hasOwnProperty.call(mediaFile.metadata!, fieldDefinition.name)) {
        defaultCustomFieldsData![fieldDefinition.name] = mediaFile.metadata![fieldDefinition.name];
      }
    });
  }
  defaultCustomFieldsData = defaultCustomFieldsData || {};

  const { control, handleSubmit, watch, setValue, reset, formState } = useForm<FormValues>({
    defaultValues: {
      title: mediaFile.title || '',
      fileName: mediaFile.metadata?.fileName || mediaFile.fileName || '',
      altText: mediaFile.metadata?.altText || mediaFile.altText || '',
      description: mediaFile.metadata?.description || mediaFile.description || '',
      visibility: (mediaFile.metadata?.visibility || mediaFile.visibility || 'private') as 'public' | 'private',
      tags: mediaFile.metadata?.tags || mediaFile.tags || [],
      customFields: defaultCustomFieldsData // Use derived custom fields
    }
  });

  // Reset form when the dialog opens or mediaFile changes
  useEffect(() => {
    if (open) {
      // console.log('Dialog opened, resetting form with fresh values');
      
      // Determine the source for custom fields for initialValues
      let sourceCustomFieldsForInitial = mediaFile.customFields;
      if (sourceCustomFieldsForInitial === undefined && mediaFile.metadata && mediaType && mediaType.fields) {
        sourceCustomFieldsForInitial = {};
        mediaType.fields.forEach((fieldDefinition: MediaTypeField) => {
          if (Object.prototype.hasOwnProperty.call(mediaFile.metadata!, fieldDefinition.name)) {
            sourceCustomFieldsForInitial![fieldDefinition.name] = mediaFile.metadata![fieldDefinition.name];
          }
        });
      }
      sourceCustomFieldsForInitial = sourceCustomFieldsForInitial || {};

      const initialValues = {
        title: mediaFile.title || '',
        fileName: mediaFile.metadata?.fileName || mediaFile.fileName || '',
        altText: mediaFile.metadata?.altText || mediaFile.altText || '',
        description: mediaFile.metadata?.description || mediaFile.description || '',
        visibility: (mediaFile.metadata?.visibility || mediaFile.visibility || 'private') as 'public' | 'private',
        tags: mediaFile.metadata?.tags || mediaFile.tags || [],
        customFields: sourceCustomFieldsForInitial // Use derived custom fields
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
        const allDefaultTagsIncluded = defaultTags.every((tag: string) => currentTags.includes(tag));
        
        if (!allDefaultTagsIncluded) {
          // Add any missing default tags
          const updatedTags = [...currentTags];
          defaultTags.forEach((tag: string) => {
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
        
        mediaType.fields.forEach((field: MediaTypeField) => {
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
      const isDefaultTag = mediaType.defaultTags?.map((t: string) => normalizeTag(t)).includes(normalizedTag);
      
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
    const isDefaultTag = mediaType.defaultTags?.some((tag: string) => 
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
    // Check if there's an unpressed tag in the input
    if (newTag.trim()) {
      setUnsavedTag(newTag.trim());
      return; // Stop submission flow until user decides
    }
    // Call the main submission handler
    await handleFormSubmission(data);
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
    setIsSaving(true);
    try {
      // Ensure all default tags are included
      if (mediaType && mediaType.defaultTags) {
        const finalTags = [...data.tags];
        let tagsChangedInternal = false; // Renamed to avoid conflict
        
        mediaType.defaultTags.forEach((tag: string) => {
          const normalizedDefaultTag = normalizeTag(tag);
          if (!finalTags.some(t => normalizeTag(t) === normalizedDefaultTag)) {
            finalTags.push(tag);
            tagsChangedInternal = true;
          }
        });
        
        if (tagsChangedInternal) {
          data.tags = finalTags;
        }
      }

      // Check if any values have actually changed before saving
      const customFieldsHaveChanged = !compareObjects(data.customFields, originalValues?.customFields || {});
      const standardFieldsHaveChanged = 
        data.title !== (originalValues?.title || '') ||
        data.fileName !== (originalValues?.fileName || '') ||
        data.altText !== (originalValues?.altText || '') ||
        data.description !== (originalValues?.description || '') ||
        data.visibility !== (originalValues?.visibility || '') || // Corrected: was missing originalValues
        !compareArrays(data.tags, originalValues?.tags || []);
        
      const overallHasChanged = standardFieldsHaveChanged || customFieldsHaveChanged;
      
      if (overallHasChanged) {
        const changedData: any = {
          _id: mediaFile._id || mediaFile.id,
          slug: (mediaFile as any).slug,
        };
        
        if (data.title !== (originalValues?.title || '')) {
          changedData.title = data.title;
        }
        
        changedData.metadata = {}; // Initialize metadata object
            
        if (data.fileName !== (originalValues?.fileName || '')) {
          changedData.metadata.fileName = data.fileName;
        }
        if (data.altText !== (originalValues?.altText || '')) {
          changedData.metadata.altText = data.altText;
        }
        if (data.description !== (originalValues?.description || '')) {
          changedData.metadata.description = data.description;
        }
        if (data.visibility !== (originalValues?.visibility || '')) { // Corrected
          changedData.metadata.visibility = data.visibility;
        }
        if (!compareArrays(data.tags, originalValues?.tags || [])) {
          changedData.metadata.tags = data.tags;
        }
        
        // Process custom fields correctly
        if (customFieldsHaveChanged) {
          const fullCustomFieldsPayload = { 
            ...(originalValues?.customFields || {}),
            ...data.customFields 
          };

          if (process.env.NODE_ENV === 'development') {
            console.log("DEBUG: EditMediaDialog - Merged customFields for payload:", JSON.stringify(fullCustomFieldsPayload, null, 2));
          }

          Object.keys(fullCustomFieldsPayload).forEach(key => {
            if (mediaType.fields?.some(field => field.name === key)) {
              changedData.metadata[key] = fullCustomFieldsPayload[key];
            }
          });
        }
        
        if (Object.keys(changedData.metadata).length === 0) {
          delete changedData.metadata; // Remove if empty
        }

        if (process.env.NODE_ENV === 'development') {
          console.log('DEBUG: EditMediaDialog - Submitting changedData:', JSON.stringify(changedData, null, 2));
        }
        await onSave(changedData);

      } else {
        if (process.env.NODE_ENV === 'development') {
          console.log('DEBUG: EditMediaDialog - No changes detected. Skipping save operation.');
        }
      }
      
      handleDialogClose();
    } catch (error) {
      console.error('Error saving media:', error);
      toast.error('An error occurred while saving. Please try again.');
    } finally {
      setIsSaving(false);
    }
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
              {field.options?.map((option: string) => (
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
                  render={({ field }) => {
                    // Prevent editing/removing file extension; lock extension suffix
                    const original = originalValues?.fileName || mediaFile.fileName || '';
                    const originalExt = (original.match(/\.[^.]+$/) || [''])[0];
                    const baseValue = String(field.value || '');
                    const currentExt = (baseValue.match(/\.[^.]+$/) || [''])[0];
                    const baseName = currentExt ? baseValue.slice(0, -currentExt.length) : baseValue;
                    return (
                      <TextField
                        value={baseName}
                        onChange={(e) => {
                          const nextBase = e.target.value || '';
                          field.onChange(nextBase + originalExt);
                        }}
                        label="File Name"
                        fullWidth
                        size="small"
                        helperText={originalExt ? `Extension locked to ${originalExt}` : undefined}
                      />
                    );
                  }}
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