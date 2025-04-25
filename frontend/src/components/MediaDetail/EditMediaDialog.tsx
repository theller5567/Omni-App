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
import { MediaFile, MediaType } from '../../types/media';
import './EditMediaDialog.scss';
import VideoThumbnailSelector from '../VideoThumbnailSelector/VideoThumbnailSelector';
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
  const { control, handleSubmit, watch, setValue } = useForm<FormValues>({
    defaultValues: {
      title: mediaFile.title || '',
      fileName: mediaFile.fileName || '',
      altText: mediaFile.altText || '',
      description: mediaFile.description || '',
      visibility: mediaFile.visibility || 'private',
      tags: mediaFile.tags || [],
      customFields: {
        ...mediaFile.customFields,
        'Webinar Title': mediaFile.customFields?.['Webinar Title'] || '',
        'Webinar Summary': mediaFile.customFields?.['Webinar Summary'] || '',
        'Webinar CTA': mediaFile.customFields?.['Webinar CTA'] || ''
      }
    }
  });


  // Initialize form with default values and ensure default tags are included
  useEffect(() => {
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
  }, [mediaType, setValue, watch]);

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
      data.title !== mediaFile.title ||
      data.fileName !== mediaFile.fileName ||
      data.altText !== mediaFile.altText ||
      data.description !== mediaFile.description ||
      data.visibility !== mediaFile.visibility ||
      !compareArrays(data.tags, mediaFile.tags || []) ||
      !compareObjects(data.customFields, mediaFile.customFields || {});
    
    // Only proceed with save if changes were made
    if (hasChanged) {
      // Format the data before sending
      const formattedData = {
        id: mediaFile.id,
        _id: mediaFile._id || mediaFile.id, // Include MongoDB ID
        slug: (mediaFile as any).slug, // Use type assertion
        title: data.title,
        fileName: data.fileName,
        altText: data.altText,
        description: data.description,
        visibility: data.visibility,
        tags: data.tags,
        customFields: {
          ...data.customFields,
          thumbnailUrl: data.customFields?.thumbnailUrl
        }
      };

      try {
        setIsSaving(true);
        await onSave(formattedData);
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
    const keys1 = Object.keys(obj1).filter(key => obj1[key] !== undefined && obj1[key] !== '');
    const keys2 = Object.keys(obj2).filter(key => obj2[key] !== undefined && obj2[key] !== '');
    
    if (keys1.length !== keys2.length) return false;
    
    return keys1.every(key => {
      // Skip special fields that are managed differently
      if (['thumbnailUrl'].includes(key)) return true;
      return obj1[key] === obj2[key];
    });
  };

  const renderCustomField = (field: MediaType['fields'][0], value: any, onChange: (value: any) => void) => {
    switch (field.type) {
      case 'text':
        return (
          <TextField
            label={field.label}
            value={value}
            onChange={onChange}
            fullWidth
            size="small"
            required={field.required}
          />
        );
      case 'number':
        return (
          <TextField
            label={field.label}
            value={value}
            onChange={onChange}
            type="number"
            fullWidth
            size="small"
            required={field.required}
          />
        );
      case 'select':
        return (
          <FormControl fullWidth size="small" required={field.required}>
            <InputLabel>{field.label}</InputLabel>
            <Select
              value={value}
              onChange={onChange}
              label={field.label}
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
        return (
          <FormControlLabel
            control={
              <Switch
                checked={value}
                onChange={(e) => onChange(e.target.checked)}
              />
            }
            label={field.label}
          />
        );
      default:
        return (
          <TextField
            label={field.label}
            value={value}
            onChange={onChange}
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

  return (
    <Dialog
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
        <form onSubmit={handleSubmit(onSubmit)} className="edit-form">
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
                {mediaType.fields.map((field) => (
                  <Box key={field.name}>
                    <Controller
                      name={`customFields.${field.name}`}
                      control={control}
                      defaultValue={mediaFile.customFields?.[field.name] || ''}
                      render={({ field: { value, onChange } }) => renderCustomField(field, value, onChange)}
                    />
                  </Box>
                ))}
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
                      {mediaFile.customFields?.thumbnailUrl && (
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
                          }
                        }}>
                          <Typography variant="caption" color="text.secondary" sx={{ fontSize: isMobile ? '0.65rem' : '0.75rem' }}>
                            Custom thumbnail set
                          </Typography>
                          <img 
                            src={mediaFile.customFields.thumbnailUrl} 
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
                      currentThumbnail={mediaFile.customFields?.thumbnailUrl}
                      onThumbnailUpdate={(thumbnailUrl) => {
                        setValue('customFields.thumbnailUrl', thumbnailUrl);
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