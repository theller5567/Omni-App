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
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '../../store/store'; // Adjust the import path as necessary
import { addMedia } from '../../store/slices/mediaSlice';
import { toast } from 'react-toastify';
import { initializeMediaTypes } from '../../store/slices/mediaTypeSlice';
//import { fieldLabels, nonEditableFields, fieldConfigurations } from '../../config/config'; // Adjust the import path as necessary

interface SelectFieldConfig {
  type: 'select';
  class: string;
  options: string[];
  fullWidth: boolean;
}

interface Field {
  name: string;
  type: string;
  options?: string[];
  required: boolean;
}

interface MediaTypeUploaderProps {
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

// Type guard to check if a field configuration is a SelectFieldConfig
function isSelectFieldConfig(config: any): config is SelectFieldConfig {
  return config.type === 'select' && Array.isArray(config.options);
}

// interface UploadProgressEvent extends ProgressEvent {
//   loaded: number;
//   total: number;
// }

interface MetadataState {
  fileName: string;
  tags: string[];
  tagsInput?: string;
  visibility: string;
  altText: string;
  description: string;
  recordedDate: string;
  uploadedBy: string;
  modifiedBy: string;
  imageWidth?: number;
  imageHeight?: number;
  [key: string]: any; // Allow dynamic fields for media type specific fields
}

const MediaUploader: React.FC<MediaTypeUploaderProps> = ({ open, onClose, onUploadComplete }) => {
  // Access user data from Redux store
  const user = useSelector((state: RootState) => state.user);
  const mediaTypes = useSelector((state: RootState) => state.mediaTypes.mediaTypes);
  const mediaTypesStatus = useSelector((state: RootState) => state.mediaTypes.status);
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();

  useEffect(() => {
    // Skip if we're already loading or have data
    if (mediaTypesStatus === 'loading' || mediaTypes.length > 0) {
      console.log('MediaUploader - Media types:', 
        mediaTypesStatus === 'loading' ? 'loading in progress' : `${mediaTypes.length} types loaded`);
      return;
    }

    // Only load if we're idle and have no data
    if (mediaTypesStatus === 'idle') {
      console.log('MediaUploader - Loading media types');
      dispatch(initializeMediaTypes());
    }
  }, [dispatch, mediaTypesStatus, mediaTypes.length]);

  // All state hooks
  const [step, setStep] = useState(1);
  const [file, setFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [selectedMediaType, setSelectedMediaType] = useState('');
  const [metadata, setMetadata] = useState<MetadataState>({
    fileName: '',
    tags: [],
    visibility: 'public',
    altText: '',
    description: '',
    recordedDate: new Date().toISOString(),
    uploadedBy: user.currentUser._id,
    modifiedBy: user.currentUser._id,
  });
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [fileUrl, setFileUrl] = useState<string | null>(null);
  const [fileSelected, setFileSelected] = useState(false);
  const [slug, setSlug] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const { uploadProgress, setUploadProgress, uploadComplete, resetUploadComplete } = useFileUpload();

  const onDrop = useCallback((acceptedFiles: File[], fileRejections: any[]) => {
    if (fileRejections.length > 0) {
      const rejection = fileRejections[0];
      const fileSizeInMB = (rejection.file.size / (1024 * 1024)).toFixed(2);
      const maxFileSizeMB = 200;
      const errorMessage = `Error: File is larger than ${maxFileSizeMB} MB. Your file was ${fileSizeInMB} MB. Please use a smaller file.`;
      setError(errorMessage);
      return;
    }

    const file = acceptedFiles[0];
    if (file) {
      setError(null);
      setFile(file);
      setFileSelected(true);

      const reader = new FileReader();
      reader.onloadend = () => {
        const imageUrl = reader.result as string;
        setFilePreview(imageUrl);

        const img = new Image();
        img.onload = () => {
          setMetadata(prev => ({
            ...prev,
            imageWidth: img.width,
            imageHeight: img.height,
          }));
        };
        img.src = imageUrl;
      };
      reader.readAsDataURL(file);
    }
  }, []);

  // Dropzone setup
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
    maxSize: 200 * 1024 * 1024,
  });

  useEffect(() => {
    if (user) {
      setMetadata(prevMetadata => ({
        ...prevMetadata,
        uploadedBy: user.currentUser._id,
        modifiedBy: user.currentUser._id,
      }));
    }
  }, [user]);

  useEffect(() => {
    if (uploadProgress === 100) {
      setShowSuccessMessage(true);
      setTimeout(() => setUploadProgress(0), 1000);
    }
  }, [uploadProgress, setUploadProgress]);

  useEffect(() => {
    if (step === 2) {
      setShowSuccessMessage(false);
      setUploadProgress(0);
    }
  }, [step, setUploadProgress]);

  useEffect(() => {
    if (step === 4 && file) {
      handleUpload(file);
    }
  }, [step, file]);

  // Early return after all hooks
  if (!open) return null;

  const handleMetadataChange = (field: string, value: any) => {
    setMetadata((prevMetadata: any) => ({
      ...prevMetadata,
      [field]: value,
    }));
  };

  const handleTagsChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    handleMetadataChange('tagsInput', value); // Store the raw input temporarily
  };

  const handleTagsBlur = () => {
    if (metadata.tagsInput) {
      const tags = metadata.tagsInput
        .split(',')
        .map((tag: string) => tag.trim())
        .filter((tag: string) => tag !== '');
      handleMetadataChange('tags', tags);
    }
  };

  const handleTagsKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      event.preventDefault(); // Prevent form submission
      handleTagsBlur();
    }
  };

  const handleUpload = async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('title', file.name);
    formData.append('fileExtension', file.name.split('.').pop()?.toUpperCase() || 'UNKNOWN');
    formData.append('uploadedBy', user.currentUser._id);
    formData.append('modifiedBy', user.currentUser._id);
    formData.append('mediaType', selectedMediaType);

    const { tagsInput, ...metadataWithoutTagsInput } = metadata;

    Object.entries(metadataWithoutTagsInput).forEach(([key, value]) => {
      if (key === 'tags' && Array.isArray(value)) {
        value.forEach(tag => formData.append(`metadata[${key}][]`, tag));
      } else {
        formData.append(`metadata[${key}]`, value as string);
      }
    });

    interface ProgressEvent {
      loaded: number;
      total?: number;
    }

    try {
      const response = await axios.post<UploadResponse>(
        'http://localhost:5002/media/upload',
        formData,
        {
          headers: { 'Content-Type': 'multipart/form-data' }
        }
      );

      // Update progress separately using XMLHttpRequest
      const xhr = new XMLHttpRequest();
      xhr.upload.onprogress = (event: ProgressEvent) => {
        const total = event.total || 0;
        const percentCompleted = Math.round((event.loaded * 100) / total);
        setUploadProgress(percentCompleted);
      };

      if (response.status === 201) {
        resetUploadComplete();
        setFileUrl(response.data.location);
        setSlug(response.data.slug);

        const newFile: BaseMediaFile = {
          _id: response.data._id,
          id: response.data.id,
          location: response.data.location,
          slug: response.data.slug,
          title: response.data.title,
          uploadedBy: user.currentUser._id,
          modifiedBy: user.currentUser._id,
          mediaType: selectedMediaType,
          __t: selectedMediaType,
          metadata: {
            ...metadataWithoutTagsInput,
          },
          fileSize: file.size,
          modifiedDate: new Date(file.lastModified).toISOString(),
          fileExtension: file.name.split('.').pop() || '',
        };
        dispatch(addMedia(newFile));
        onUploadComplete(newFile);
      }
    } catch (error) {
      console.error('Error uploading file:', error);
      toast.error('Failed to upload file');
    }
  };

  const handleNext = () => {
    setStep((prev) => prev + 1);
  };

  const handleBack = () => setStep((prev) => (prev === 1 ? 1 : prev - 1));

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
      recordedDate: new Date().toISOString(),
      uploadedBy: user.currentUser._id,
      modifiedBy: user.currentUser._id,
    });
    resetUploadComplete();
  };

  const handleChange = (event: SelectChangeEvent) => {
    const mediaType = event.target.value;
    setSelectedMediaType(mediaType);
    handleMetadataChange('mediaType', mediaType);
  };

  const steps = ['Select Media Type', 'Upload File', 'Add Metadata', 'Completion'];

  const handleViewMedia = () => {
    if (slug) {
      navigate(`/media-library/media/${slug}`);
    }
  };

  const renderFields = () => {
    if (!selectedMediaType) return null;

    const selectedType = mediaTypes.find(type => type.name === selectedMediaType);
    if (!selectedType) return null;

    // Base schema fields that are common to all media types
    const baseFields = (
      <>
        <TextField
          label="File Name"
          value={metadata.fileName || ''}
          onChange={(e) => handleMetadataChange('fileName', e.target.value)}
          required
          fullWidth
          margin="normal"
        />
        <TextField
          label="Tags"
          value={metadata.tagsInput || ''}
          onChange={handleTagsChange}
          onBlur={handleTagsBlur}
          onKeyDown={handleTagsKeyDown}
          fullWidth
          margin="normal"
          helperText="Enter tags separated by commas"
        />
        <TextField
          label="Alt Text"
          value={metadata.altText || ''}
          onChange={(e) => handleMetadataChange('altText', e.target.value)}
          required
          fullWidth
          margin="normal"
        />
        <TextField
          label="Description"
          value={metadata.description || ''}
          onChange={(e) => handleMetadataChange('description', e.target.value)}
          required
          fullWidth
          margin="normal"
          multiline
          rows={4}
        />
        <FormControl fullWidth margin="normal">
          <InputLabel>Visibility</InputLabel>
          <Select
            value={metadata.visibility || 'public'}
            onChange={(e) => handleMetadataChange('visibility', e.target.value)}
            label="Visibility"
          >
            <MenuItem value="public">Public</MenuItem>
            <MenuItem value="private">Private</MenuItem>
          </Select>
        </FormControl>
      </>
    );

    // Media type specific fields (will be stored under metadata)
    const mediaTypeFields = selectedType.fields.map((field: Field) => {
      const fieldPath = field.name; // Remove metadata. prefix
      switch (field.type) {
        case 'Select':
        case 'MultiSelect':
          return (
            <FormControl fullWidth margin="normal" key={field.name}>
              <InputLabel id={`${field.name}-label`}>{field.name}</InputLabel>
              <Select
                labelId={`${field.name}-label`}
                id={field.name}
                value={metadata[fieldPath] || ''}
                onChange={(e) => handleMetadataChange(fieldPath, e.target.value)}
                label={field.name}
                required={field.required}
              >
                {field.options?.map((option: string) => (
                  <MenuItem key={option} value={option}>
                    {option}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          );
        case 'Boolean':
          return (
            <FormControlLabel
              key={field.name}
              control={
                <Checkbox
                  checked={metadata[fieldPath] || false}
                  onChange={(e) => handleMetadataChange(fieldPath, e.target.checked)}
                  name={field.name}
                  required={field.required}
                />
              }
              label={field.name}
            />
          );
        default:
          const fieldConfig = isSelectFieldConfig(field) ? field : { type: 'text' };
          return (
            <TextField
              key={field.name}
              label={field.name}
              required={field.required}
              value={metadata[fieldPath] || ''}
              onChange={(e) => handleMetadataChange(fieldPath, e.target.value)}
              fullWidth
              margin="normal"
              multiline={fieldConfig.type === 'text'}
              rows={fieldConfig.type === 'text' ? 4 : 1}
            />
          );
      }
    });

    return (
      <div className="form-grid">
        {baseFields}
        <Typography variant="h6" sx={{ mt: 3, mb: 2 }}>Media Type Specific Fields</Typography>
        {mediaTypeFields}
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
                {mediaTypes.map((type) => (
                  <MenuItem key={type._id} value={type.name}>{type.name}</MenuItem>
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


