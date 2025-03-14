import React, { useState, useEffect, useCallback } from 'react';
import { Box, Button, TextField, LinearProgress, Typography, FormControl, Select, MenuItem, InputLabel, SelectChangeEvent, Stepper, Step, StepLabel } from '@mui/material';
import { useDropzone } from 'react-dropzone';
import { useUser } from '../../contexts/UserContext';
import { FaTimes } from 'react-icons/fa';
import './MediaUploader.scss';
import useFileUpload from '../../hooks/useFileUpload';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { MediaFile } from '../../interfaces/MediaFile';

interface MediaUploaderProps {
  open: boolean;
  onClose: () => void;
  onUploadComplete: (newFile: MediaFile) => void;
}

// Define the expected response type
interface UploadResponse {
  _id: string;
  id: string;
  location: string;
  slug: string;
  title: string;
}

const MediaUploader: React.FC<MediaUploaderProps> = ({ open, onClose, onUploadComplete }) => {
  if (!open) return null; // Render nothing if not open
  const { user } = useUser();
  const [step, setStep] = useState(1);
  const [file, setFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [metadata, setMetadata] = useState<any>({
    fileName: '',
    tags: [],
    visibility: 'public',
    altText: '',
    description: '',
    mediaType: '',
    recordedDate: new Date().toISOString().split('T')[0], // Prepopulate with current date
  });
  const { uploadProgress, setUploadProgress, uploadComplete, resetUploadComplete } = useFileUpload();
  const [selectedMediaType, setSelectedMediaType] = useState('');
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
        setMediaTypes(response.data);
      } catch (error) {
        console.error('Error fetching media types:', error);
      }
    };

    fetchMediaTypes();
  }, []);

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

      // Generate a local preview URL
      const reader = new FileReader();
      reader.onloadend = () => {
        setFilePreview(reader.result as string);
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
    const tags = value.split(',').map(tag => tag.trim());
    handleMetadataChange('tags', tags);
  };

  const handleUpload = async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('title', file.name);
    formData.append('fileExtension', file.name.split('.').pop()?.toUpperCase() || 'UNKNOWN');
    formData.append('metadata', JSON.stringify(metadata));
    formData.append('mediaType', selectedMediaType); // Include mediaType in the form data

    try {
      const response = await axios.post<UploadResponse>('http://localhost:5002/media/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent: ProgressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          console.log(`Upload Progress: ${percentCompleted}%`);
          setUploadProgress(percentCompleted);
        },
      } as any);

      if (response.status === 200) {
        resetUploadComplete();
        setFileUrl(response.data.location);
        setSlug(response.data.slug);
        const modifiedDate = new Date(file.lastModified);

        const newFile: MediaFile = {
          _id: response.data._id,
          id: response.data.id,
          __t: selectedMediaType,
          location: response.data.location,
          slug: response.data.slug,
          title: response.data.title,
          metadata: {
            ...metadata,
            mediaType: selectedMediaType, // Include mediaType in the metadata
          },
          fileSize: file.size,
          modifiedDate,
          fileExtension: file.name.split('.').pop() || '',
        };

        onUploadComplete(newFile);
      } else {
        console.error('Upload failed');
      }
    } catch (error) {
      if (error && typeof error === 'object' && 'response' in error) {
        console.error('Error uploading file:', (error as any).response?.data);
      } else {
        console.error('Error uploading file:', error);
      }
    }
  };

  const handleNext = () => {
    setStep((prev) => prev + 1);
  };

  const handleBack = () => setStep((prev) => (prev === 1 ? 1 : prev - 1));

  useEffect(() => {
    if (user) {
      handleMetadataChange('uploadedBy', user.name);
      handleMetadataChange('modifiedBy', user.name);
    }
  }, [user]);

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
    });
    resetUploadComplete();
  };

  const handleChange = (event: SelectChangeEvent) => {
    const mediaType = event.target.value;
    setSelectedMediaType(mediaType);
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
    return Object.keys(fields).map((field) => (
      <TextField
        key={field}
        label={field}
        required={fields[field].required}
        value={metadata[field] || ''}
        onChange={(e) => handleMetadataChange(field, e.target.value)}
        fullWidth
        margin="normal"
      />
    ));
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
            <Box display="flex" flexWrap="wrap" justifyContent="space-between">
              <Box width="48%">
                <TextField
                  label="File Name"
                  required
                  value={metadata.fileName || ''}
                  onChange={(e) => handleMetadataChange('fileName', e.target.value)}
                  fullWidth
                  margin="normal"
                />
                <TextField
                  label="Tags (comma separated)"
                  required
                  value={Array.isArray(metadata.tags) ? metadata.tags.join(', ') : ''}
                  onChange={handleTagsChange}
                  fullWidth
                  margin="normal"
                />
                <TextField
                  label="Alt Text"
                  required
                  value={metadata.altText || ''}
                  onChange={(e) => handleMetadataChange('altText', e.target.value)}
                  fullWidth
                  margin="normal"
                />
              </Box>
              <Box width="48%">
                <TextField
                  label="Visibility"
                  value={metadata.visibility || ''}
                  onChange={(e) => handleMetadataChange('visibility', e.target.value)}
                  fullWidth
                  margin="normal"
                />
                <TextField
                  label="Description"
                  required
                  value={metadata.description || ''}
                  onChange={(e) => handleMetadataChange('description', e.target.value)}
                  fullWidth
                  margin="normal"
                />
                <TextField
                  label="Recorded Date"
                  type="date"
                  value={metadata.recordedDate}
                  onChange={(e) => handleMetadataChange('recordedDate', e.target.value)}
                  fullWidth
                  margin="normal"
                  InputLabelProps={{
                    shrink: true,
                  }}
                />
              </Box>
              {renderFields()}
            </Box>
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
