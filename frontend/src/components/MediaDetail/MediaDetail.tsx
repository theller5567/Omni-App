import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import { Box, Button, CircularProgress, Chip, Dialog, DialogContent, DialogTitle, FormControl, FormLabel, FormControlLabel, FormGroup, FormHelperText } from "@mui/material";
import axios from "axios";
import { MediaFile } from "../../interfaces/MediaFile";
import { useNavigate } from "react-router-dom";
import { motion } from 'framer-motion';
// import { formatFileSize } from "../../utils/formatFileSize";
import { nonEditableFields, fieldConfigurations, fieldLabels } from "../../config/config";
import "./mediaDetail.scss";

const MediaDetail: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const [mediaFile, setMediaFile] = useState<MediaFile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [mediaTypes, setMediaTypes] = useState<any>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchMediaFile = async () => {
      try {
        const response = await axios.get<MediaFile>(
          `http://localhost:5002/media/slug/${slug}`
        );
        setMediaFile(response.data);
      } catch (error) {
        console.error("Error fetching media file:", error);
      } finally {
        setLoading(false);
      }
    };

    const fetchMediaTypes = async () => {
      try {
        const response = await axios.get('http://localhost:5002/media/media-types');
        setMediaTypes(response.data);
      } catch (error) {
        console.error("Error fetching media types:", error);
      }
    };

    if (slug) {
      fetchMediaFile();
      fetchMediaTypes();
    }
  }, [slug]);

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleCancel = () => {
    setIsEditing(false);
  };

  const handleSubmit = async (values: any) => {
    try {
      if (!mediaFile || !mediaFile.slug) {
        console.error("Media slug is undefined");
        return;
      }
      const updatedValues = {
        metadata: {
          ...values,
          tags: typeof values.tags === 'string' ? values.tags.split(',').map((tag: string) => tag.trim()) : values.tags,
        }
      };
      const response = await axios.put<MediaFile>(`http://localhost:5002/media/update/${mediaFile.slug}`, updatedValues);
      setMediaFile(response.data);
      setIsEditing(false);
    } catch (error) {
      console.error("Error updating media file:", error);
    }
  };

  if (loading) {
    return <div className="loading-container"><CircularProgress /></div>;
  }

  if (!mediaFile) {
    return <div>Error loading media file.</div>;
  }

  const goBack = () => {
    navigate(-1);
  };

  const renderFields = () => {
    if (!mediaTypes || !mediaFile) return null;

    const mediaTypeSchema = mediaTypes[mediaFile.__t]?.schema;
    if (!mediaTypeSchema) return null;

    const mergedObject = {
      ...mediaFile,
      ...mediaTypeSchema,
      ...mediaFile.metadata,
    };

    const renderedFields = new Set<string>();

    return (
      <FormGroup sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 2 }}>
        {Object.keys(mergedObject).map((field) => {
          if (field !== 'metadata' && isFieldEditable(field) && !renderedFields.has(field)) {
            renderedFields.add(field);

            const fieldConfig = fieldConfigurations[field as keyof typeof fieldConfigurations] || { type: 'text' };
            const label = fieldLabels[field as keyof typeof fieldLabels] || field;

            return (
              <FormControl className="media-detail-field" key={field} sx={{ mb: 2, gridColumn: fieldConfig.type === 'textarea' ? '1 / -1' : undefined, width: fieldConfig.type === 'textarea' ? '100%' : undefined }}>
                <FormLabel htmlFor={field}>{label}</FormLabel>
                {fieldConfig.type === 'textarea' && 'class' in fieldConfig && (
                  <Field name={field} as="textarea" className={fieldConfig.class || ''} />
                )}
                {fieldConfig.type === 'select' && 'options' in fieldConfig && (
                  <Field name={field} as="select">
                    {(fieldConfig.options || []).map((option: string) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </Field>
                )}
                {fieldConfig.type === 'checkbox' && (
                  <Field name={field} type="checkbox" as={FormControlLabel} control={<input />} />
                )}
                {fieldConfig.type === 'text' && (
                  <Field name={field} type="text" as={FormControlLabel} control={<input />} />
                )}
                <ErrorMessage name={field} component={FormHelperText} />
              </FormControl>
            );
          }
          return null;
        })}
      </FormGroup>
    );
  };

  // const renderMetadataFields = () => {
  //   if (!mediaTypes || !mediaFile) return null;

  //   const mediaTypeSchema = mediaTypes[mediaFile.__t]?.schema;
  //   if (!mediaTypeSchema) return null;

  //   return Object.keys(mediaTypeSchema).map((field) => (
  //     <p key={field}>
  //       {field}: <span className="metadata-value">{mediaFile.metadata[field]}</span>
  //     </p>
  //   ));
  // };

  function isFieldEditable(fieldName: string): boolean {
    return !nonEditableFields.hasOwnProperty(fieldName);
  }

  // Define animation variants
  const containerVariants = {
    hidden: { opacity: 0, x: -50 },
    visible: { opacity: 1, x: 0, transition: { duration: 0.5 } },
    exit: { opacity: 0, x: -50, transition: { duration: 0.5 } },
  };

  return (
    <motion.div
      className="media-detail-wrapper"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
    >
      <div className="navbar">
        <Button variant="contained" color="info" onClick={goBack}>
          Back
        </Button>
      </div>
      <div className="media-detail">
        <div className="img-container">
          <img src={mediaFile.location} alt={mediaFile.metadata.altText} />
        </div>
        <div className="media-information">
          {Object.keys(mediaFile).map((key) => {
            const value = (mediaFile as Record<string, any>)[key];
            if (key in fieldLabels && !(nonEditableFields as Record<string, boolean>)[key]) {
              if (typeof value === 'object' && value !== null) {
                return (
                  <div key={key}>
                    {/* <strong>{fieldLabels[key as keyof typeof fieldLabels]}:</strong> */}
                    <ul>
                      {Object.entries(value).map(([subKey, subValue]) =>
                        subKey === 'tags' ? (
                          <div className="tags" key={subKey}>
                            {(subValue as string[]).map((tag: string) => (
                              <Chip key={tag} label={tag} className="tag" />
                            ))}
                          </div>
                        ) : subKey === 'fileName' ? (
                          <h1 key={subKey}>{subValue as string}</h1>
                        ) : (
                          <li key={subKey} data-name={subKey}>
                            {fieldLabels[subKey as keyof typeof fieldLabels] || subKey}: <span className="metadata-value">{subValue as string}</span>
                          </li>
                        )
                      )}
                    </ul>
                  </div>
                );
              }
            }
            return null;
          })}
          
          <Button variant="contained" color="primary" onClick={handleEdit}>
            Edit
          </Button>
        </div>
        <Dialog className="edit-media-dialog" open={isEditing} onClose={handleCancel} fullWidth maxWidth="md">
          <DialogTitle>Edit Media Details</DialogTitle>
          <DialogContent>
            <Formik
              initialValues={{
                ...mediaFile.metadata,
                title: mediaFile.title,
              }}
              validationSchema={Yup.object({
                fileName: Yup.string().required('File name is required'),
                description: Yup.string().required('Description is required'),
                tags: Yup.string().required('At least one tag is required'),
                title: Yup.string().required('Title is required'),
              })}
              onSubmit={(values) => {
                handleSubmit(values);
              }}
            >
              {({ isSubmitting }) => (
                <Form id="edit-media-form">
                  {renderFields()}
                  <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
                    <Button onClick={handleCancel} color="primary" sx={{ mr: 2 }}>
                      Cancel
                    </Button>
                    <Button type="submit" color="primary" variant="contained" disabled={isSubmitting}>
                      Save
                    </Button>
                  </Box>
                </Form>
              )}
            </Formik>
          </DialogContent>
        </Dialog>
      </div>
    </motion.div>
  );
};

export default MediaDetail;
