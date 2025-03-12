import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import { Box, Button, Typography, CircularProgress, Chip } from "@mui/material";
import axios from "axios";
import MediaFile from "../../interfaces/MediaFile";
import { useNavigate } from "react-router-dom";
import {formatFileSize } from "../../utils/formatFileSize";
import "./mediaDetail.scss";

const MediaDetail: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const [mediaFile, setMediaFile] = useState<MediaFile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchMediaFile = async () => {
      try {
        const response = await axios.get<MediaFile>(
          `http://localhost:5002/media/slug/${slug}`
        );
        console.log('responseData', response.data);
        setMediaFile(response.data);
      } catch (error) {
        console.error("Error fetching media file:", error);
      } finally {
        setLoading(false);
      }
    };

    if (slug) {
      fetchMediaFile();
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
      console.log('Tags before split:', values.tags, typeof values.tags);
      const updatedValues = {
        metadata: {
          fileName: values.fileName,
          description: values.description,
          tags: typeof values.tags === 'string' ? values.tags.split(',').map((tag: string) => tag.trim()) : values.tags,
        }
      };
      console.log('updatedValues', updatedValues);
      const response = await axios.put<MediaFile>(`http://localhost:5002/media/update/${mediaFile.slug}`, updatedValues);
      console.log('updateMediaFile', response.data);
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

  return (
    <div className="media-detail-wrapper">
      <div className="navbar">
        <Button variant="contained" color="info" onClick={goBack}>
          Back
        </Button>
      </div>
      <div className="media-detail">
        <div className="img-container">
          <img src={mediaFile.location} alt={mediaFile.metadata.altText} />
        </div>
        {isEditing ? (
          <Formik
            initialValues={{
              fileName: mediaFile.metadata.fileName,
              description: mediaFile.metadata.description,
              tags: mediaFile.metadata.tags.join(', '),
            }}
            validationSchema={Yup.object({
              fileName: Yup.string().required('File name is required'),
              description: Yup.string().required('Description is required'),
              tags: Yup.string().required('At least one tag is required'),
            })}
            onSubmit={(values) => {
              const updatedValues = {
                ...values,
                tags: typeof values.tags === 'string' ? values.tags.split(',').map((tag: string) => tag.trim()) : values.tags,
              };
              handleSubmit(updatedValues);
            }}
          >
            {({ isSubmitting }) => (
              <Form id="edit-media-form">
                <Box sx={{ mb: 2 }}>
                  <Typography variant="h3">Edit Media Details</Typography>
                </Box>
                <Box sx={{ mb: 2 }}>
                  <label htmlFor="fileName">File Name</label>
                  <Field name="fileName" type="text" />
                  <ErrorMessage name="fileName" component="div" />
                </Box>
                <Box sx={{ mb: 2 }}>
                  <label htmlFor="description">Description</label>
                  <Field name="description" as="textarea" />
                  <ErrorMessage name="description" component="div" />
                </Box>
                <Box sx={{ mb: 2 }}>
                  <label htmlFor="tags">Tags (comma-separated)</label>
                  <Field name="tags" type="text" />
                  <ErrorMessage name="tags" component="div" />
                </Box>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2">File Extension: <span>{mediaFile.fileExtension}</span></Typography>
                  <Typography variant="body2">File Size: <span> {formatFileSize(mediaFile.fileSize)}</span></Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
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
        ) : (
          <div className="media-information">
            <h1>{mediaFile.metadata.fileName}</h1>
            <p>Description: <span>{mediaFile.metadata.description}</span></p>
            <p>Size: <span>{formatFileSize(mediaFile.fileSize)}</span></p>
            <p>Created: <span>{new Date(mediaFile.modifiedDate).toLocaleDateString()}</span></p>
            <p>Extension: <span>{mediaFile.fileExtension}</span></p>
            <div className="tags">
              {mediaFile.metadata.tags.map((tag) => (
                <Chip
                  key={tag}
                  className="tag"
                  color="primary"
                  label={tag}
                  size="small"
                />
              ))}
            </div>
            <Button variant="contained" color="primary" onClick={handleEdit}>
              Edit
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default MediaDetail;
