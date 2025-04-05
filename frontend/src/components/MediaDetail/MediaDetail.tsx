import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Formik, Form, FormikProps } from 'formik';
import * as Yup from 'yup';
import { 
  Box, 
  Button, 
  CircularProgress, 
  Chip, 
  Dialog, 
  DialogContent, 
  DialogTitle,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Typography
} from "@mui/material";
import axios from "axios";
import { BaseMediaFile } from "../../interfaces/MediaFile";
import { useNavigate } from "react-router-dom";
import { motion } from 'framer-motion';
import { formatFileSize } from "../../utils/formatFileSize";
import { nonEditableFields } from "../../config/config";
import "./mediaDetail.scss";
import { useSelector } from "react-redux";
import { RootState } from "../../store/store";
import { toast } from 'react-toastify';
import { useUsername } from '../../hooks/useUsername';

const MediaDetail: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const [mediaFile, setMediaFile] = useState<BaseMediaFile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const mediaTypes = useSelector((state: RootState) => state.mediaTypes.mediaTypes);
  const navigate = useNavigate();
  const { username: uploaderUsername, loading: uploaderLoading } = useUsername(mediaFile?.uploadedBy);
  const { username: modifierUsername, loading: modifierLoading } = useUsername(mediaFile?.modifiedBy);
  const userRole = useSelector((state: RootState) => state.user.currentUser.role);

  useEffect(() => {
    const fetchMediaFile = async () => {
      try {
        const response = await axios.get<BaseMediaFile>(
          `http://localhost:5002/media/slug/${slug}`
        );
        setMediaFile(response.data);
      } catch (error) {
        console.error("Error fetching media file:", error);
        toast.error("Failed to load media file");
      } finally {
        setLoading(false);
      }
    };

    if (slug) {
      fetchMediaFile();
    }
  }, [slug]);

  const validationSchema = Yup.object().shape({
    title: Yup.string().required('Title is required'),
    metadata: Yup.object().shape({
      fileName: Yup.string().required('File name is required'),
      altText: Yup.string().required('Alt text is required'),
      description: Yup.string().required('Description is required'),
      visibility: Yup.string().required('Visibility is required'),
      tags: Yup.mixed()
        .required('Tags are required')
        .transform((value) => {
          if (typeof value === 'string') {
            return value.split(',').map(tag => tag.trim());
          }
          return value;
        })
    })
  });

  interface MetadataValues {
    fileName: string;
    altText: string;
    description: string;
    visibility: string;
    tags: string | string[];
    [key: string]: any; // Allow dynamic fields from media type config
  }

  interface FormValues {
    title: string;
    metadata: MetadataValues;
  }

  // Helper function to format tags for display
  const formatTagsForDisplay = (tags: string | string[] | undefined): string => {
    if (!tags) return '';
    if (typeof tags === 'string') return tags;
    return tags.map(tag => tag.replace(/"/g, '')).join(', ');
  };

  const initialValues: FormValues = {
    title: mediaFile?.title || '',
    metadata: {
      fileName: mediaFile?.metadata?.fileName || '',
      altText: mediaFile?.metadata?.altText || '',
      description: mediaFile?.metadata?.description || '',
      visibility: mediaFile?.metadata?.visibility || 'public',
      tags: formatTagsForDisplay(mediaFile?.metadata?.tags),
      ...mediaFile?.metadata
    }
  };

  const handleSubmit = async (values: FormValues) => {
    console.log('handleSubmit called with values:', values);
    try {
      if (!mediaFile?.slug) {
        console.error("Media slug is undefined");
        return;
      }

      // Process tags into an array
      const tags = typeof values.metadata.tags === 'string' 
        ? values.metadata.tags.split(',').map(tag => tag.trim())
        : values.metadata.tags;
      console.log('Processed tags:', tags);

      const updatedValues = {
        title: values.title,
        metadata: {
          ...values.metadata,
          tags
        }
      };
      console.log('Sending update request with data:', updatedValues);

      const response = await axios.put<BaseMediaFile>(
        `http://localhost:5002/media/update/${mediaFile.slug}`,
        updatedValues
      );
      console.log('Received response:', response.data);

      // Update the local state with the new data
      setMediaFile(response.data);
      setIsEditing(false);
      toast.success('Media file updated successfully');

      // Refresh the data from the server to ensure we have the latest version
      const refreshResponse = await axios.get<BaseMediaFile>(
        `http://localhost:5002/media/slug/${mediaFile.slug}`
      );
      setMediaFile(refreshResponse.data);
    } catch (error) {
      console.error("Error updating media file:", error);
      toast.error('Failed to update media file');
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <CircularProgress />
      </Box>
    );
  }

  if (!mediaFile) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <Typography color="error">Error loading media file.</Typography>
      </Box>
    );
  }

  // Find the media type configuration
  const mediaTypeConfig = mediaTypes.find(type => type.name === mediaFile.mediaType);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="media-detail-container"
    >
      <Button 
        className="back-button" 
        onClick={() => navigate(-1)} 
        variant="outlined"
      >
        Back to Media Library
      </Button>
      <Box className="media-detail">
        

        <Box className="media-preview">
          <Box className="media-preview-header">
            <Typography variant="h6">Media Type:<span> {mediaFile.mediaType}</span></Typography>
            <Box className="tags-container">
              Tags: {mediaFile.metadata?.tags?.map((tag, index) => (
                <Chip key={index} label={tag} sx={{ backgroundColor: 'var(--accent-color2)', color: 'var(--background-color)', marginRight: '0.5rem' }}/>
              ))}
            </Box>
            <Box className="size-container">
              <Typography variant="h6">Size:<span> {formatFileSize(mediaFile.fileSize || 0)}</span></Typography>
            </Box>
            <Box className="updated-date">
              <Typography variant="h6">Uploaded on:<span> {new Date(mediaFile.modifiedDate).toLocaleDateString()}</span></Typography>
            </Box>
            <Box className="uploaded-by">
              <Typography variant="h6">Uploaded by:<span> {uploaderLoading ? 'Loading...' : uploaderUsername}</span></Typography>
            </Box>
          </Box>
          <Box className="media-preview-media">
            <img src={mediaFile.location} alt={mediaFile.metadata?.altText || ''} />
          </Box>
          <Box className="media-preview-footer">
            <Typography variant="h6">{mediaFile.metadata?.description || ''}</Typography>
          </Box>
        </Box>

        <Box className="media-information">
          <Typography variant="h4">{mediaFile.metadata?.fileName || 'Untitled'}</Typography>
          
          <Box className="media-metadata">
            <Typography><strong>Type:</strong> {mediaFile.mediaType}</Typography>
            <Typography><strong>Size:</strong> {formatFileSize(mediaFile.fileSize || 0)}</Typography>
            <Typography>
              <strong>Uploaded by:</strong> {uploaderLoading ? 'Loading...' : uploaderUsername}
            </Typography>
            <Typography>
              <strong>Modified by:</strong> {modifierLoading ? 'Loading...' : modifierUsername}
            </Typography>
            <Typography><strong>Modified:</strong> {new Date(mediaFile.modifiedDate).toLocaleDateString()}</Typography>
            
            {mediaFile.metadata && Object.entries(mediaFile.metadata).map(([key, value]) => {
              // Skip base schema fields we've already shown
              if (['fileName', 'altText', 'description', 'visibility', 'tags', 'uploadedBy', 'modifiedBy', 'modifiedDate', 'fileSize', 'recordedDate', 'mediaType'].includes(key)) return null;
              
              return (
                <Typography key={key}>
                  <strong>{key}:</strong> {Array.isArray(value) ? value.join(', ') : value}
                </Typography>
              );
            })}
          </Box>

          {(userRole === 'admin' || userRole === 'superAdmin') && (
            <Button 
              variant="contained" 
              color={isEditing ? "error" : "primary"}
              onClick={() => setIsEditing(!isEditing)}
              sx={{ mt: 2 }}
            >
              {isEditing ? "Cancel Editing" : "Edit"}
            </Button>
          )}
        </Box>

        <Dialog open={isEditing} onClose={() => setIsEditing(false)} maxWidth="md" fullWidth>
          <DialogTitle>Edit Media Details</DialogTitle>
          <DialogContent>
            <Formik
              initialValues={initialValues}
              validationSchema={validationSchema}
              onSubmit={handleSubmit}
              enableReinitialize
            >
              {({ errors, touched, handleChange, handleSubmit, values, submitForm }: FormikProps<FormValues>) => {
                console.log('Formik render - current values:', values);
                console.log('Formik render - current errors:', errors);
                return (
                  <Form onSubmit={(e) => {
                    e.preventDefault();
                    console.log('Form onSubmit triggered');
                    handleSubmit(e);
                  }}>
                    <Box display="grid" gap={2} my={2}>
                      <TextField
                        fullWidth
                        name="title"
                        label="Title"
                        value={values.title}
                        onChange={handleChange}
                        error={touched.title && Boolean(errors.title)}
                        helperText={touched.title && errors.title}
                      />

                      <TextField
                        fullWidth
                        name="metadata.fileName"
                        label="File Name"
                        value={values.metadata.fileName || ''}
                        onChange={handleChange}
                        error={touched.metadata?.fileName && Boolean(errors.metadata?.fileName)}
                        helperText={touched.metadata?.fileName && errors.metadata?.fileName}
                      />

                      <TextField
                        fullWidth
                        name="metadata.altText"
                        label="Alt Text"
                        value={values.metadata.altText || ''}
                        onChange={handleChange}
                        error={touched.metadata?.altText && Boolean(errors.metadata?.altText)}
                        helperText={touched.metadata?.altText && errors.metadata?.altText}
                      />

                      <TextField
                        fullWidth
                        multiline
                        rows={4}
                        name="metadata.description"
                        label="Description"
                        value={values.metadata.description || ''}
                        onChange={handleChange}
                        error={touched.metadata?.description && Boolean(errors.metadata?.description)}
                        helperText={touched.metadata?.description && errors.metadata?.description}
                      />

                      <FormControl fullWidth>
                        <InputLabel>Visibility</InputLabel>
                        <Select
                          name="metadata.visibility"
                          value={values.metadata.visibility || ''}
                          onChange={handleChange}
                          label="Visibility"
                        >
                          <MenuItem value="public">Public</MenuItem>
                          <MenuItem value="private">Private</MenuItem>
                        </Select>
                      </FormControl>

                      <TextField
                        fullWidth
                        name="metadata.tags"
                        label="Tags (comma-separated)"
                        value={formatTagsForDisplay(values.metadata.tags)}
                        onChange={handleChange}
                        error={touched.metadata?.tags && Boolean(errors.metadata?.tags)}
                        helperText={touched.metadata?.tags && errors.metadata?.tags}
                      />

                      {/* Render media type specific fields */}
                      {mediaTypeConfig?.fields.map(field => {
                        // Type guard for nonEditableFields
                        const isFieldEditable = (fieldName: string): boolean => {
                          return !(fieldName in nonEditableFields);
                        };

                        if (!isFieldEditable(field.name)) return null;

                        switch (field.type) {
                          case 'Select':
                            return (
                              <FormControl key={field.name} fullWidth>
                                <InputLabel>{field.name}</InputLabel>
                                <Select
                                  name={`metadata.${field.name}`}
                                  value={values.metadata[field.name] || ''}
                                  onChange={handleChange}
                                >
                                  {field.options?.map((option, index) => (
                                    <MenuItem key={index} value={option}>{option}</MenuItem>
                                  ))}
                                </Select>
                              </FormControl>
                            );
                          default:
                            return null;
                        }
                      })}
                    </Box>
                    <DialogActions>
                      <Button onClick={() => setIsEditing(false)}>Cancel</Button>
                      <Button 
                        onClick={() => {
                          console.log('Save button clicked, submitting form with values:', values);
                          submitForm();
                        }}
                        color="primary"
                      >
                        Save
                      </Button>
                    </DialogActions>
                  </Form>
                );
              }}
            </Formik>
          </DialogContent>
        </Dialog>
      </Box>
    </motion.div>
  );
};

export default MediaDetail;