import React, { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Grid,
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
  Divider
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { MediaFile, MediaType } from '../../types/media';
import './EditMediaDialog.scss';
import VideoThumbnailSelector from '../VideoThumbnailSelector/VideoThumbnailSelector';

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
  console.log('EditMediaDialog - Initial props:', {
    mediaFile,
    mediaType
  });

  const [newTag, setNewTag] = useState('');
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

  // Log the form values whenever they change
  const formValues = watch();
  useEffect(() => {
    console.log('EditMediaDialog - Current form values:', formValues);
  }, [formValues]);

  const handleAddTag = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' && newTag.trim()) {
      const currentTags = watch('tags');
      if (!currentTags.includes(newTag.trim())) {
        setValue('tags', [...currentTags, newTag.trim()]);
      }
      setNewTag('');
    }
  };

  const handleDeleteTag = (tagToDelete: string) => {
    const currentTags = watch('tags');
    setValue('tags', currentTags.filter(tag => tag !== tagToDelete));
  };

  const onSubmit = async (data: FormValues) => {
    console.log('EditMediaDialog - Form submission data:', {
      formData: data,
      originalMediaFile: mediaFile
    });

    // Format the data before sending
    const formattedData = {
      ...data,
      customFields: {
        ...data.customFields,
        'Webinar Title': data.customFields?.['Webinar Title'] || '',
        'Webinar Summary': data.customFields?.['Webinar Summary'] || '',
        'Webinar CTA': data.customFields?.['Webinar CTA'] || ''
      }
    };

    console.log('EditMediaDialog - Formatted submission data:', formattedData);
    await onSave(formattedData);
    onClose();
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

  return (
    <Dialog
      open={open}
      onClose={onClose}
      className="edit-media-dialog"
      maxWidth="md"
      fullWidth
    >
      <DialogTitle className="dialog-title">
        Edit Media Details
        <IconButton
          onClick={onClose}
          sx={{ position: 'absolute', right: 8, top: 8 }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      
      <DialogContent className="dialog-content">
        <form onSubmit={handleSubmit(onSubmit)} className="edit-form">
          {/* Basic Information Section */}
          <Box className="form-section">
            <Typography variant="h6" gutterBottom>Basic Information</Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
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
              </Grid>
              <Grid item xs={12} md={6}>
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
              </Grid>
              <Grid item xs={12} md={6}>
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
              </Grid>
              <Grid item xs={12} md={6}>
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
              </Grid>
              <Grid item xs={12}>
                <Controller
                  name="description"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="Description"
                      fullWidth
                      multiline
                      rows={2}
                      size="small"
                    />
                  )}
                />
              </Grid>
            </Grid>
          </Box>

          <Divider sx={{ my: 2 }} />

          {/* Video Thumbnail Section */}
          {showVideoThumbnailSelector && mediaFile.url && mediaFile.id && (
            <>
              <Box className="form-section">
                <Typography variant="h6" gutterBottom>Video Thumbnail</Typography>
                <VideoThumbnailSelector
                  videoUrl={mediaFile.url}
                  mediaId={mediaFile.id}
                  currentThumbnail={mediaFile.customFields?.thumbnailUrl}
                  onThumbnailUpdate={(thumbnailUrl) => {
                    setValue('customFields.thumbnailUrl', thumbnailUrl);
                  }}
                />
              </Box>
              <Divider sx={{ my: 2 }} />
            </>
          )}

          {/* Tags Section */}
          <Box className="form-section">
            <Typography variant="h6" gutterBottom>Tags</Typography>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  label="Add Tags"
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  onKeyPress={handleAddTag}
                  fullWidth
                  size="small"
                  helperText="Press Enter to add a tag"
                />
                <Box sx={{ mt: 1, display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {watch('tags').map((tag) => (
                    <Chip
                      key={tag}
                      label={tag}
                      onDelete={() => handleDeleteTag(tag)}
                      size="small"
                    />
                  ))}
                </Box>
              </Grid>
            </Grid>
          </Box>

          <Divider sx={{ my: 2 }} />

          {/* Custom Fields Section */}
          {mediaType.fields.length > 0 && (
            <Box className="form-section">
              <Typography variant="h6" gutterBottom>{mediaType.name} Fields</Typography>
              <Grid container spacing={2}>
                {mediaType.fields.map((field) => (
                  <Grid item xs={12} md={6} key={field.name}>
                    <Controller
                      name={`customFields.${field.name}`}
                      control={control}
                      defaultValue={mediaFile.customFields?.[field.name] || ''}
                      render={({ field: { value, onChange } }) => renderCustomField(field, value, onChange)}
                    />
                  </Grid>
                ))}
              </Grid>
            </Box>
          )}
        </form>
      </DialogContent>

      <DialogActions className="dialog-actions">
        <Button onClick={onClose}>Cancel</Button>
        <Button
          onClick={handleSubmit(onSubmit)}
          variant="contained"
          color="primary"
        >
          Save Changes
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default EditMediaDialog; 