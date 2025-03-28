import React, { useState, useEffect, useCallback } from 'react';
import { Box, Button, TextField, LinearProgress, Typography, FormControl, Select, MenuItem, InputLabel, SelectChangeEvent, Stepper, Step, StepLabel, FormControlLabel, Checkbox } from '@mui/material';
import { useDropzone } from 'react-dropzone';
//import { useUser } from '../../contexts/UserContext';
import { FaTimes } from 'react-icons/fa';
import './MediaUploader.scss';
import useFileUpload from '../../hooks/useFileUpload';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { BaseMediaFile } from '../../interfaces/MediaFile';
import { useSelector } from 'react-redux';
import { RootState } from '../../store/store'; // Adjust the import path as necessary
import { fieldLabels, nonEditableFields, fieldConfigurations } from '../../config/config'; // Adjust the import path as necessary

interface MediaUploaderProps {
  open: boolean;
  onClose: () => void;
  onUploadComplete: (newFile: BaseMediaFile) => void;
}

// Define the expected response type
interface UploadResponse {
  _id: string;
  id: string;
  location: string;
  slug: string;
  title: string;
}

// Define a type for field configurations with options
interface SelectFieldConfig {
  type: 'select';
  class: string;
  options: string[];
  fullWidth: boolean;
}

// Type guard to check if a field configuration is a SelectFieldConfig
function isSelectFieldConfig(config: any): config is SelectFieldConfig {
  return config.type === 'select' && Array.isArray(config.options);
}

const MediaUploader: React.FC<MediaUploaderProps> = ({ open, onClose, onUploadComplete }) => {
  if (!open) return null; // Render nothing if not open

  // Access user data from Redux store
  const user = useSelector((state: RootState) => state.user);

  const [step, setStep] = useState(1);
  const [file, setFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [selectedMediaType, setSelectedMediaType] = useState('');
  const [metadata, setMetadata] = useState<any>({
    fileName: '',
    tags: [],
    visibility: 'public',
    altText: '',
    description: '',
    recordedDate: new Date().toISOString().split('T')[0],
    uploadedBy: user._id,
    modifiedBy: user._id,
  });
  const { uploadProgress, setUploadProgress, uploadComplete, resetUploadComplete } = useFileUpload();
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [fileUrl, setFileUrl] = useState<string | null>(null);
  const [fileSelected, setFileSelected] = useState(false);
  const [slug, setSlug] = useState<string | null>(null);
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [mediaTypes, setMediaTypes] = useState<any>({});

  useEffect(() => {
    const fetchMediaTypes = async () => {
      try {
        const response = await axios.get('http://localhost:5002/media/media-types');
        console.log('Fetched media types:', response.data);
        setMediaTypes(response.data);
      } catch (error) {
        console.error('Error fetching media types:', error);
      }
    };

    fetchMediaTypes();
  }, []);

  useEffect(() => {
    if (user) {
      setMetadata((prevMetadata: any) => {
        const updatedMetadata = {
          ...prevMetadata,
          uploadedBy: user._id,
          modifiedBy: user._id,
        };
        console.log('Updated Metadata:', updatedMetadata);
        return updatedMetadata;
      });
    }
  }, [user]);

  const onDrop = useCallback((acceptedFiles: File[], fileRejections: any[]) => {
    if (fileRejections.length > 0) {
      const rejection = fileRejections[0];
      const fileSizeInMB = (rejection.file.size / (1024 * 1024)).toFixed(2); // Convert bytes to MB
      const maxFileSizeMB = 200; // Maximum file size in MB
      const errorMessage = `Error: File is larger than ${maxFileSizeMB} MB. Your file was ${fileSizeInMB} MB. Please use a smaller file.`;
      setError(errorMessage);
      return;
    }

    const file = acceptedFiles[0];
    if (file) {
      setError(null);
      setFile(file);
      setFileSelected(true);
      console.log('file: ', file);
      // Generate a local preview URL
      const reader = new FileReader();
      reader.onloadend = () => {
        const imageUrl = reader.result as string;
        setFilePreview(imageUrl);

        // Create an Image object to get dimensions
        const img = new Image();
        img.onload = () => {
          console.log('Image Width:', img.width);
          console.log('Image Height:', img.height);

          // You can store these dimensions in the metadata or state if needed
          setMetadata((prevMetadata: any) => ({
            ...prevMetadata,
            imageWidth: img.width,
            imageHeight: img.height,
          }));
        };
        img.src = imageUrl;
      };
      reader.readAsDataURL(file);
    }
  }, []);

  const handleMetadataChange = (field: string, value: any) => {
    setMetadata((prevMetadata: any) => ({
      ...prevMetadata,
      [field]: value,
    }));
  };

  const handleTagsChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    console.log('Raw Tags Input:', value);
    handleMetadataChange('tagsInput', value); // Store the raw input temporarily
  };

  const handleTagsBlur = () => {
    const tags = metadata.tagsInput.split(',').map((tag: string) => tag.trim()).filter((tag: string) => tag !== '');
    console.log('Processed Tags Array:', tags);
    handleMetadataChange('tags', tags);
  };

  const handleTagsKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      handleTagsBlur();
      event.preventDefault(); // Prevent form submission if inside a form
    }
  };

  const handleUpload = async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('title', file.name);
    formData.append('fileExtension', file.name.split('.').pop()?.toUpperCase() || 'UNKNOWN');
    formData.append('uploadedBy', user._id);
    formData.append('modifiedBy', user._id);
    formData.append('mediaType', selectedMediaType);
    console.log('Metadata before appending to FormData:', metadata);

    // Create a new metadata object excluding tagsInput
    const { tagsInput, ...metadataWithoutTagsInput } = metadata;

    console.log('Metadata before appending to FormData:', metadataWithoutTagsInput);

    Object.entries(metadataWithoutTagsInput).forEach(([key, value]) => {
      if (key === 'tags') {
        console.log('Tags before appending:', value);
        if (Array.isArray(value)) {
          value.forEach(tag => formData.append(`metadata[${key}][]`, tag));
        } else {
          console.log('Tags are not an array:', value);
        }
      } else {
        formData.append(`metadata[${key}]`, value as string);
      }
    });

    const config = {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent: ProgressEvent) => {
        const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
        console.log(`Upload Progress: ${percentCompleted}%`);
        setUploadProgress(percentCompleted);
      },
    };

    try {
      console.log('formDataXX:', formData);
      const response = await axios.post<UploadResponse>('http://localhost:5002/media/upload', formData, config);

      if (response.status === 201) {
        console.log('Upload successful:', response.data);
        resetUploadComplete();
        setFileUrl(response.data.location);
        setSlug(response.data.slug);
        const modifiedDate = new Date(file.lastModified);

        const newFile: BaseMediaFile = {
          _id: response.data._id,
          id: response.data.id,
          location: response.data.location,
          slug: response.data.slug,
          title: response.data.title,
          uploadedBy: user._id,
          modifiedBy: user._id,
          mediaType: selectedMediaType,
          __t: selectedMediaType,
          metadata: {
            ...metadataWithoutTagsInput,
          },
          fileSize: file.size,
          modifiedDate,
          fileExtension: file.name.split('.').pop() || '',
        };
        console.log('newFile: ', newFile);
        onUploadComplete(newFile);
      } else {
        console.error('Upload failed with status:', response.status);
      }
    } catch (error) {
      console.error('Error uploading file:', error);
    }
  };

  const handleNext = () => {
    setStep((prev) => prev + 1);
  };

  const handleBack = () => setStep((prev) => (prev === 1 ? 1 : prev - 1));

  useEffect(() => {
    if (uploadProgress === 100) {
      setShowSuccessMessage(true);
      setTimeout(() => setUploadProgress(0), 1000);
    }
  }, [uploadProgress]);

  useEffect(() => {
    if (step === 2) {
      setShowSuccessMessage(false);
      setUploadProgress(0);
    }
  }, [step]);

  const handleAddMore = () => {
    setUploadProgress(0);
    setFilePreview(null);
    setStep(1);
    setFile(null);
    setMetadata({
      fileName: '',
      tags: [],
      visibility: 'public',
      altText: '',
      description: '',
      recordedDate: new Date().toISOString().split('T')[0], // Reset to the current date
      uploadedBy: user._id,
      modifiedBy: user._id,
    });
    resetUploadComplete();
  };

  const handleChange = (event: SelectChangeEvent) => {
    const mediaType = event.target.value;
    setSelectedMediaType(mediaType);
    handleMetadataChange('mediaType', mediaType);
  };

  const steps = ['Select Media Type', 'Upload File', 'Add Metadata', 'Completion'];

  const {
    getRootProps,
    getInputProps,
    isDragActive,
    isDragReject,
  } = useDropzone({
    onDrop,
    accept: {
      'image/*': [],
      'video/*': []
    },
    maxSize: 200 * 1024 * 1024, // Ensure this is 200MB in bytes
  });

  useEffect(() => {
    if (step === 4) {
      handleUpload(file as File); // Start upload when reaching step 4
    }
  }, [step, file]);

  const handleViewMedia = () => {
    if (slug) {
      navigate(`/media-library/media/${slug}`);
    }
  };

  const renderFields = () => {
    if (!selectedMediaType) return null;

    const fields = mediaTypes[selectedMediaType]?.schema || {};

    return (
      <div className="form-grid">
        {Object.keys(fields).map((field) => {
          const strippedField = field.startsWith('metadata.') ? field.replace('metadata.', '') : field;

          if (nonEditableFields[strippedField as keyof typeof nonEditableFields]) {
            return null;
          }
          const fieldConfig = fieldConfigurations[strippedField as keyof typeof fieldConfigurations] || { type: 'text' };
          const label = fieldLabels[strippedField as keyof typeof fieldLabels] || strippedField;

          // Determine if the field should be full-width
          const isFullWidth = fieldConfig.fullWidth || false;
          const fieldClassName = isFullWidth ? 'full-width' : '';

          switch (fieldConfig.type) {
            case 'textarea':
              return (
                <TextField
                  key={strippedField}
                  label={label}
                  required={fields[field].required}
                  value={metadata[strippedField] || ''}
                  onChange={(e) => handleMetadataChange(strippedField, e.target.value)}
                  fullWidth
                  margin="normal"
                  multiline
                  rows={4}
                  className={`${fieldConfig.class || ''} ${fieldClassName}`}
                />
              );
            case 'select':
              return (
                <FormControl fullWidth margin="normal" key={strippedField} className={fieldClassName}>
                  <InputLabel id={`${strippedField}-label`}>{label}</InputLabel>
                  <Select
                    labelId={`${strippedField}-label`}
                    id={strippedField}
                    value={metadata[strippedField] || ''}
                    onChange={(e) => handleMetadataChange(strippedField, e.target.value)}
                    label={label}
                    className={fieldConfig.class || ''}
                  >
                    {isSelectFieldConfig(fieldConfig) && fieldConfig.options.map((option: string) => (
                      <MenuItem className='option-item' key={option} value={option}>
                        {option}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              );
            case 'checkbox':
              return (
                <FormControlLabel
                  key={strippedField}
                  control={
                    <Checkbox
                      checked={metadata[strippedField] || false}
                      onChange={(e) => handleMetadataChange(strippedField, e.target.checked)}
                      name={strippedField}
                    />
                  }
                  label={label}
                  className={fieldClassName}
                />
              );
            case 'tag':
              return (
                <TextField
                  key={strippedField}
                  label={label}
                  value={metadata.tagsInput || ''}
                  onChange={handleTagsChange}
                  onBlur={handleTagsBlur}
                  onKeyDown={handleTagsKeyDown}
                  fullWidth
                  margin="normal"
                />
              );
            default:
              return (
                <TextField
                  key={strippedField}
                  label={label}
                  required={fields[field].required}
                  value={metadata[strippedField] || ''}
                  onChange={(e) => handleMetadataChange(strippedField, e.target.value)}
                  fullWidth
                  margin="normal"
                  className={fieldClassName}
                />
              );
          }
        })}
      </div>
    );
  };

  return (
    <Box id="media-uploader">
      <Button className="close-modal" onClick={onClose} color="primary"><FaTimes /></Button>
      <Stepper alternativeLabel activeStep={step - 1}>
        {steps.map((label) => (
          <Step key={label}>
            <StepLabel>{label}</StepLabel>
          </Step>
        ))}
      </Stepper>
      <>
        {step === 1 && (
          <Box className="step step-1">
            <Typography variant="h6">Select the type of media you want to upload</Typography>
            <FormControl fullWidth>
              <InputLabel id="demo-simple-select-label">Media Type</InputLabel>
              <Select
                labelId="demo-simple-select-label"
                id="demo-simple-select"
                value={selectedMediaType}
                label="Media Type"
                onChange={handleChange}
              >
                {Object.keys(mediaTypes).map((type) => (
                  <MenuItem key={type} value={type}>{type}</MenuItem>
                ))}
              </Select>
            </FormControl>
            <div className="cta-group">
              <Button variant="outlined" onClick={handleBack} style={{ opacity: '0', pointerEvents: 'none' }} disabled={true}>Back</Button>
              <Button variant="contained" onClick={handleNext} disabled={!selectedMediaType}>Next</Button>
            </div>
          </Box>
        )}
        {step === 2 && (
          <Box className="step step-2">
            <div
              {...getRootProps()}
              className={`dropzone ${fileSelected ? 'file-selected' : ''} ${isDragActive ? 'active' : ''} ${isDragReject ? 'reject' : ''}`}
            >
              <input {...getInputProps()} />
              <p>
                {isDragReject
                  ? 'File type not supported'
                  : isDragActive
                    ? 'Drop files here'
                    : 'Drag & drop files here, or click to select files'}
              </p>
              {error && <div style={{ color: 'red' }}>{error}</div>}
            </div>

            {filePreview && (
              <Box mt={2}>
                <img src={filePreview} alt="File preview" style={{ maxWidth: '150px', height: 'auto' }} />
              </Box>
            )}
            <div className="cta-group">
              <Button variant="outlined" onClick={handleBack}>Back</Button>
              <Button variant="contained" onClick={handleNext} disabled={!filePreview}>Next</Button>
            </div>
          </Box>
        )}
        {step === 3 && (
          <Box className="step step-3">
            <Typography variant="h6">Add Metadata</Typography>
            <div className="fields">
              {renderFields()}
            </div>
            <div className="cta-group">
              <Button variant="outlined" onClick={handleBack}>Back</Button>
              <Button variant="contained" onClick={handleNext} disabled={!metadata.fileName || !metadata.tags || !metadata.visibility || !metadata.altText || !metadata.description}>Next</Button>
            </div>
          </Box>
        )}
        {step === 4 && (
          <Box className="step step-4">
            {showSuccessMessage ? (
              <Typography variant="h6" color="primary">Media uploaded successfully!</Typography>
            ) : (
              <LinearProgress color="secondary" style={{ margin: '1rem', padding: '0.2rem', borderRadius: '10px' }} className="progress-bar" variant="determinate" value={uploadProgress} />
            )}
            {uploadComplete && (
              <>
                {fileUrl && (
                  <Box mt={2}>
                    <img src={fileUrl} alt="Uploaded file" style={{ maxWidth: '100%', height: 'auto' }} />
                  </Box>
                )}
                {slug && (
                  <Button variant="contained" onClick={handleViewMedia}>View Media</Button>
                )}
              </>
            )}
            <div className="cta-group">
              <Button variant="outlined" onClick={handleAddMore}>Add More</Button>
              <Button variant="contained" onClick={onClose}>Done</Button>
            </div>
          </Box>
        )}
      </>
    </Box>
  );
};

export default MediaUploader;


