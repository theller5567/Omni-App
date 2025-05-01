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
  Accordion,
  AccordionSummary,
  AccordionDetails,
  useMediaQuery,
  Theme,
  Alert,
  CircularProgress
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { MediaType } from '../../types/media';
import './EditMediaDialog.scss';
import VideoThumbnailSelector from '../VideoThumbnailSelector/VideoThumbnailSelector';
import { useSelector } from 'react-redux';
import { RootState } from '../../store/store';
import { normalizeTag } from '../../utils/mediaTypeUploaderUtils';
import { BaseMediaFile } from '../../interfaces/MediaFile';

interface EditMediaDialogProps {
  open: boolean;
  onClose: () => void;
  mediaFile: BaseMediaFile & {
    url?: string;
    fileType?: string;
    visibility?: string;
    tags?: string[];
    customFields?: Record<string, any>;
  };
  mediaType: MediaType;
  onSave: (data: Partial<BaseMediaFile>) => Promise<void>;
}

interface FormValues {
  title: string;
  metadata: {
    fileName?: string;
    altText?: string;
    description?: string;
    visibility?: string;
    tags?: string[];
    v_thumbnail?: string;
    v_thumbnailTimestamp?: string;
    [key: string]: any;
  }
  customFields?: Record<string, any>;
}

/**
 * Helper function to clean thumbnail URL and add consistent cache-busting
 * @param url - The thumbnail URL to format
 * @param mediaId - The media ID to use as a stable cache key
 * @param forceRefresh - Whether to force a refresh with a timestamp (default: false)
 */
const formatThumbnailUrl = (url: string, mediaId: string): string => {
  if (!url) return '';
  // Always use a new timestamp when showing thumbnails in the edit form
  // to ensure we're seeing the latest version
  const cleanUrl = url.split('?')[0];
  return `${cleanUrl}?id=${mediaId}&t=${Date.now()}`;
};

export const EditMediaDialog: React.FC<EditMediaDialogProps> = ({
  open,
  onClose,
  mediaFile: initialMediaFile,
  mediaType,
  onSave
}) => {
  // Use state to keep track of the mediaFile for local updates
  const [mediaFile, setMediaFile] = useState<typeof initialMediaFile>(initialMediaFile);
  
  // Add a formVersion state to force re-renders when needed
  const [formVersion, setFormVersion] = useState(0);

  // Get user role from Redux
  const userRole = useSelector((state: RootState) => state.user.currentUser.role);
  const isSuperAdmin = userRole === 'superAdmin';
  const isMobile = useMediaQuery((theme: Theme) => theme.breakpoints.down('sm'));

  const [newTag, setNewTag] = useState('');
  // Track save in progress
  const [isSaving, setIsSaving] = useState(false);
  
  // Add state to track original values for change detection
  const [originalValues, setOriginalValues] = useState<FormValues | null>(null);
  
  // Debug: Log media file custom fields
  console.log('MediaFile customFields:', mediaFile.customFields);
  console.log('MediaType fields:', mediaType.fields);
  
  const defaultValues = {
    title: mediaFile.title || '',
    metadata: {
      fileName: mediaFile.metadata?.fileName || '',
      altText: mediaFile.metadata?.altText || '',
      description: mediaFile.metadata?.description || '',
      visibility: mediaFile.metadata?.visibility || 'private',
      tags: mediaFile.metadata?.tags || [],
      v_thumbnail: mediaFile.metadata?.v_thumbnail || '',
      v_thumbnailTimestamp: mediaFile.metadata?.v_thumbnailTimestamp || '',
    },
    customFields: mediaFile.customFields || {} // Pass all custom fields
  }
  
  const {
    handleSubmit,
    control,
    setValue,
    watch,
    reset,
    getValues,
    formState: { errors },
  } = useForm<FormValues>({
    defaultValues: {
      title: mediaFile.title || '',
      metadata: {
        fileName: mediaFile.metadata?.fileName || '',
        altText: mediaFile.metadata?.altText || '',
        description: mediaFile.metadata?.description || '',
        visibility: mediaFile.metadata?.visibility || 'public',
        tags: mediaFile.metadata?.tags || [],
        v_thumbnail: mediaFile.metadata?.v_thumbnail || '',
        v_thumbnailTimestamp: mediaFile.metadata?.v_thumbnailTimestamp || '',
      },
      customFields: mediaFile.customFields || {},
    },
  });

  // Reset the form when mediaFile changes
  useEffect(() => {
    const formValues = {
      title: mediaFile.title || '',
      metadata: {
        fileName: mediaFile.metadata?.fileName || '',
        altText: mediaFile.metadata?.altText || '',
        description: mediaFile.metadata?.description || '',
        visibility: mediaFile.metadata?.visibility || 'public',
        tags: mediaFile.metadata?.tags || [],
        v_thumbnail: mediaFile.metadata?.v_thumbnail || '',
        v_thumbnailTimestamp: mediaFile.metadata?.v_thumbnailTimestamp || '',
      },
      customFields: mediaFile.customFields || {},
    };
    
    // Store original values for change detection
    setOriginalValues(formValues);
    
    // Reset form with current values
    reset(formValues);
    
    // Increment version to force re-render
    setFormVersion(prev => prev + 1);
  }, [mediaFile, reset]);

  // Initialize form with default values and ensure default tags are included
  useEffect(() => {
    // When the dialog opens, re-initialize form values from mediaFile
    console.log('Dialog open state changed or mediaFile updated, refreshing form values');
    
    // Reset form values when dialog opens or mediaFile changes
    if (open) {
      // Make sure all default tags from the media type are included in the tags
      if (mediaType && mediaType.defaultTags && mediaType.defaultTags.length > 0) {
        const currentTags = watch('metadata.tags') || [];
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
          setValue('metadata.tags', updatedTags);
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
      
      const currentTags = watch('metadata.tags') || [];
      // Check if normalized tag already exists (case-insensitive)
      if (!currentTags.map(t => normalizeTag(t)).includes(normalizedTag)) {
        setValue('metadata.tags', [...currentTags, normalizedTag]);
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
    
    const currentTags = watch('metadata.tags') || [];
    setValue('metadata.tags', currentTags.filter(tag => normalizeTag(tag) !== normalizedTagToDelete));
  };

  // Replace tagWarningOpen with a state to track unsaved tag warning
  const [unsavedTag, setUnsavedTag] = useState<string | null>(null);

  // Add debugging code to trace form value changes
  useEffect(() => {
    if (open && Object.keys(errors).length > 0) {
      const currentValues = getValues();
      console.log('Form errors:', errors);
      // If customFields changed, log the differences
      if (currentValues.customFields && originalValues?.customFields) {
        Object.keys(currentValues.customFields || {}).forEach(key => {
          const newVal = currentValues.customFields?.[key];
          const oldVal = originalValues.customFields?.[key];
          if (newVal !== oldVal) {
            console.log(`Field "${key}" changed from:`, oldVal, 'to:', newVal);
          }
        });
      }
    }
  }, [getValues, errors, open, originalValues]);

  // Modified to debug custom fields on form submission
  const onSubmit = async (data: FormValues) => {
    if (!mediaFile) return;
    
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
      const currentTags = watch('metadata.tags') || [];
      
      // Check if normalized tag already exists (case-insensitive)
      if (!currentTags.map(t => normalizeTag(t)).includes(normalizedTag)) {
        // Add the tag
        const updatedTags = [...currentTags, normalizedTag];
        setValue('metadata.tags', updatedTags);
        
        // Proceed with form submission after adding tag
        const currentData = watch();
        // Ensure metadata and metadata.tags exist
        if (!currentData.metadata) {
          currentData.metadata = {};
        }
        currentData.metadata.tags = updatedTags;
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
      const finalTags = [...(data.metadata?.tags || [])];
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
        data.metadata.tags = finalTags;
      }
    }

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
    if (data.metadata.fileName !== (originalValues?.metadata.fileName || '')) {
      changedData.metadata.fileName = data.metadata.fileName;
    }
    
    if (data.metadata.altText !== (originalValues?.metadata.altText || '')) {
      changedData.metadata.altText = data.metadata.altText;
    }
    
    if (data.metadata.description !== (originalValues?.metadata.description || '')) {
      changedData.metadata.description = data.metadata.description;
    }
    
    if (data.metadata.visibility !== (originalValues?.metadata.visibility || '')) {
      changedData.metadata.visibility = data.metadata.visibility;
    }
    
    if (!compareArrays(data.metadata.tags, originalValues?.metadata.tags || [])) {
      changedData.metadata.tags = data.metadata.tags;
    }
    
    // ALWAYS include thumbnail URLs if they exist in data, even if unchanged
    // This ensures changes are saved properly and prevents caching issues
    if (data.metadata.v_thumbnail) {
      // Use clean URL without parameters for storage
      changedData.metadata.v_thumbnail = data.metadata.v_thumbnail.split('?')[0];
    }
    
    if (data.metadata.v_thumbnailTimestamp) {
      changedData.metadata.v_thumbnailTimestamp = data.metadata.v_thumbnailTimestamp;
    }
    
    // Only include mediaType fields that have actually changed
    if (data.customFields && mediaType.fields && originalValues?.customFields) {
      mediaType.fields.forEach(field => {
        // We already checked data.customFields above, but add redundant check for TypeScript
        const newValue = data.customFields && data.customFields[field.name];
        const originalValue = originalValues.customFields?.[field.name];
        
        // Skip null/undefined values to avoid issues
        if (newValue === null || newValue === undefined) return;
        
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
        }
      });
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
      // You might want to show an error message here
    }
    
    // Use handleDialogClose instead of directly calling onClose to ensure we clear the tag input
    handleDialogClose();
  };

  // Helper function to compare arrays (for tags)
  const compareArrays = (arr1: any[] | undefined, arr2: any[] | undefined): boolean => {
    // If both are undefined, they're equal
    if (!arr1 && !arr2) return true;
    // If only one is undefined, they're not equal
    if (!arr1 || !arr2) return false;
    
    if (arr1.length !== arr2.length) return false;
    
    // Sort and normalize tags for comparison
    const sorted1 = [...arr1].map(tag => normalizeTag(tag)).sort();
    const sorted2 = [...arr2].map(tag => normalizeTag(tag)).sort();
    
    return sorted1.every((val, i) => val === sorted2[i]);
  };

  // Helper function to compare objects (for customFields)
  const compareObjects = (obj1: Record<string, any> | undefined, obj2: Record<string, any> | undefined): boolean => {
    // If both are undefined, they're equal
    if (!obj1 && !obj2) return true;
    // If only one is undefined, they're not equal
    if (!obj1 || !obj2) return false;
    
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

  const isVideoFile = mediaFile.fileType?.toLowerCase().match(/^(mp4|webm|ogg|mov)$/);

  // Only show video thumbnail selector if we have all required props
  const showVideoThumbnailSelector = Boolean(
    isVideoFile && 
    mediaFile.url && 
    mediaFile.id
  );

  // After your existing useState hooks, add a new state for tracking accordion expansion
  const [expandedAccordion, setExpandedAccordion] = useState<string | false>(false);

  const handleAccordionChange = (panel: string) => (_: React.SyntheticEvent, isExpanded: boolean) => {
    setExpandedAccordion(isExpanded ? panel : false);
  };

  // Ensure that metadata.tags always has a default value
  useEffect(() => {
    if (!watch('metadata.tags')) {
      setValue('metadata.tags', []);
    }
  }, [watch, setValue]);

  // Update mediaFile when initialMediaFile changes from props
  useEffect(() => {
    setMediaFile(initialMediaFile);
  }, [initialMediaFile]);

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
                  name="metadata.fileName"
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
                  name="metadata.altText"
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
                  name="metadata.visibility"
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
                  name="metadata.description"
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
                  {(watch('metadata.tags') || []).map((tag) => {
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

          {/* Video Thumbnail Section */}
          {showVideoThumbnailSelector && mediaFile.url && mediaFile.id && (
            <>
              <Box className="form-section" sx={{ marginTop: isMobile ? 1 : 2 }}>
                <Accordion 
                  expanded={expandedAccordion === 'videoThumbnail'} 
                  onChange={handleAccordionChange('videoThumbnail')}
                  sx={{ 
                    backgroundColor: 'transparent', 
                    boxShadow: 'none',
                    '&:before': {
                      display: 'none', // Hide the default divider
                    },
                  }}
                >
                  <AccordionSummary
                    expandIcon={<ExpandMoreIcon fontSize={isMobile ? "small" : "medium"} />}
                    aria-controls="video-thumbnail-content"
                    id="video-thumbnail-header"
                    sx={{ 
                      backgroundColor: 'var(--input-background)', 
                      borderRadius: 'var(--border-radius-md)',
                      '&:hover': {
                        backgroundColor: 'var(--input-background-hover)',
                      }
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                      <Typography variant={isMobile ? "body1" : "subtitle1"} sx={{ fontWeight: 'medium', fontSize: isMobile ? '0.85rem' : 'inherit' }}>
                        Edit Video Thumbnail
                      </Typography>
                      {mediaFile.metadata?.v_thumbnail && (
                        <Box sx={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          ml: 'auto', 
                          gap: 1,
                          opacity: 0.7,
                          '& img': { 
                            width: isMobile ? 30 : 36,
                            height: isMobile ? 16 : 20,
                            objectFit: 'cover',
                            borderRadius: 0.5,
                            border: '1px solid var(--border-color)'
                          },
                          '&.thumbnail-updated': {
                            animation: 'pulse 2s',
                            opacity: 1
                          },
                          '@keyframes pulse': {
                            '0%': { opacity: 0.7 },
                            '50%': { opacity: 1 },
                            '100%': { opacity: 0.7 }
                          }
                        }} className="accordion-thumbnail-preview">
                          <Typography variant="caption" color="text.secondary" sx={{ fontSize: isMobile ? '0.65rem' : '0.75rem' }}>
                            {mediaFile.metadata.v_thumbnail.includes(mediaFile.id) 
                              ? "Unique thumbnail" 
                              : "Legacy thumbnail"}
                          </Typography>
                          <img 
                            src={formatThumbnailUrl(mediaFile.metadata.v_thumbnail, mediaFile.id)}
                            alt="Current thumbnail" 
                          />
                        </Box>
                      )}
                    </Box>
                  </AccordionSummary>
                  <AccordionDetails sx={{ padding: isMobile ? 1 : 2, paddingLeft: isMobile ? 2 : 3, paddingRight: isMobile ? 2 : 3, mt: isMobile ? 1 : 2 }}>
                    <VideoThumbnailSelector
                      videoUrl={mediaFile.url}
                      mediaId={mediaFile.id}
                      currentThumbnail={mediaFile.metadata?.v_thumbnail}
                      onThumbnailUpdate={(thumbnailUrl, updatedMediaData) => {
                        // Clean the URL to remove any cache-busting parameters
                        const cleanThumbnailUrl = thumbnailUrl.split('?')[0];
                        
                        // Update form value with clean URL
                        setValue('metadata.v_thumbnail', cleanThumbnailUrl);
                        
                        // Force update of the form data by updating the form version
                        setFormVersion(prev => prev + 1);
                        
                        // If we have the full updated media data, use it
                        if (updatedMediaData) {
                          // Update the entire media file object with the fresh data from the server
                          setMediaFile(prev => ({
                            ...prev,
                            metadata: {
                              ...prev.metadata,
                              v_thumbnail: cleanThumbnailUrl,
                              v_thumbnailTimestamp: updatedMediaData.metadata?.v_thumbnailTimestamp
                            }
                          }));
                          
                          // Update originalValues to prevent change detection false positives
                          setOriginalValues(prev => {
                            if (!prev) return null;
                            return {
                              ...prev,
                              metadata: {
                                ...prev.metadata,
                                v_thumbnail: cleanThumbnailUrl,
                                v_thumbnailTimestamp: updatedMediaData.metadata?.v_thumbnailTimestamp
                              }
                            };
                          });
                        } else {
                          // Fallback to just updating the thumbnail URL if we don't have full media data
                          setMediaFile(prev => ({
                            ...prev,
                            metadata: {
                              ...prev.metadata,
                              v_thumbnail: cleanThumbnailUrl
                            }
                          }));
                        }
                        
                        // Expand the accordion to show the updated thumbnail
                        setExpandedAccordion('videoThumbnail');
                      }}
                    />
                  </AccordionDetails>
                </Accordion>
              </Box>
            </>
          )}
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