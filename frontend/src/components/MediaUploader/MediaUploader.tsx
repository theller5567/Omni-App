import React, { useState, useEffect } from 'react';
import { Box, Button, TextField, LinearProgress, Typography, FormControl, Select, MenuItem, InputLabel, SelectChangeEvent, Stepper, Step, StepLabel } from '@mui/material';
import { useDropzone } from 'react-dropzone';
import { useUser } from '../../contexts/UserContext';
import { FaTimes } from 'react-icons/fa';
import './MediaUploader.scss';
import useFileUpload from '../../hooks/useFileUpload';
import axios from 'axios';

interface MediaUploaderProps {
  onDone: () => void;
  onCancel: () => void;
}

// Define the expected response type
interface UploadResponse {
  location: string;
}

const MediaUploader: React.FC<MediaUploaderProps> = ({ onDone, onCancel }) => {
  const { user } = useUser();
  const [step, setStep] = useState(1);
  const [file, setFile] = useState<File | null>(null);
  const [metadata, setMetadata] = useState<{ [key: string]: string | number | string[] }>({});
  const { uploadProgress, setUploadProgress, uploadComplete, resetUploadComplete } = useFileUpload();
  const [selectedMediaType, setSelectedMediaType] = useState('');
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [fileUrl, setFileUrl] = useState<string | null>(null);

  const onDrop = async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    const formData = new FormData();
    formData.append('file', file);

    const config = {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent: ProgressEvent) => {
        const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
        setUploadProgress(percentCompleted);
      },
    };

    try {
      const response = await axios.post<UploadResponse>('http://localhost:5002/media/upload', formData, config);

      if (response.status === 200) {
        console.log('File uploaded successfully', response.data);
        setFileUrl(response.data.location);
        resetUploadComplete();
      } else {
        console.error('Upload failed');
      }
    } catch (error) {
      console.error('Error uploading file:', error);
    }
  };

  const { getRootProps, getInputProps } = useDropzone({ onDrop });

  const handleNext = () => setStep((prev) => prev + 1);
  const handleBack = () => setStep((prev) => (prev === 1 ? 1 : prev - 1));

  const handleMetadataChange = (key: string, value: string | number | string[]) => {
    setMetadata((prevMetadata) => ({ ...prevMetadata, [key]: value }));
  };

  useEffect(() => {
    if (user) {
      handleMetadataChange('uploadedBy', user.name);
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
    console.log('handleAddMore');
    setUploadProgress(0);
    setStep(1);
    setFile(null);
    setMetadata({});
    resetUploadComplete();
  };

  const handleChange = (event: SelectChangeEvent) => {
    const mediaType = event.target.value;
    setSelectedMediaType(mediaType);
    console.log(mediaType, 'mediaType');
  };

  const steps = ['Select Media Type', 'Upload File', 'Add Metadata', 'Completion'];

  return (
    <Box id="media-uploader">
      <Button className="close-modal" onClick={onCancel} color="primary"><FaTimes /></Button>
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
                <MenuItem value={'Image'}>Image</MenuItem>
                <MenuItem value={'Video'}>Video</MenuItem>
                <MenuItem value={'App note'}>App note</MenuItem>
                <MenuItem value={'PDF'}>PDF</MenuItem>
              </Select>
            </FormControl>
            <div className="cta-group">
            <Button variant="outlined" onClick={handleBack} style={{opacity: '0', pointerEvents: 'none'}} disabled={true}>Back</Button>
              <Button variant="contained" onClick={handleNext} disabled={!selectedMediaType}>Next</Button>
            </div>
          </Box>
        )}
        {step === 2 && (
          <Box className="step step-2">
            <div {...getRootProps()} style={{ border: '2px dashed var(--accent-color2)', padding: '20px', textAlign: 'center' }}>
              <input {...getInputProps()} />
              <p>Drag & drop files here, or click to select files</p>
            </div>
            {showSuccessMessage ? (
              <Typography variant="h6" color="primary">Upload Successful!</Typography>
            ) : (
              <LinearProgress color="secondary" style={{ margin: '1rem', padding: '0.2rem', borderRadius: '10px' }} className="progress-bar" variant="determinate" value={uploadProgress} />
            )}
            {fileUrl && (
                  <Box mt={2}>
                    <img src={fileUrl} alt="Uploaded file" style={{ maxWidth: '100px', height: 'auto' }} />
                  </Box>
                )}
            {file && <p>Selected file: {file.name}</p>}
            <div className="cta-group">
              <Button variant="outlined" onClick={handleBack}>Back</Button>
              <Button variant="contained" onClick={handleNext} disabled={!showSuccessMessage}>Next</Button>
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
                  onChange={(e) => handleMetadataChange('tags', e.target.value.split(',').map(tag => tag.trim()))}
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
                  label="Folder Path"
                  required
                  value={metadata.folderPath || ''}
                  onChange={(e) => handleMetadataChange('folderPath', e.target.value)}
                  fullWidth
                  margin="normal"
                />
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
              </Box>
            </Box>
            <div className="cta-group">
              <Button variant="outlined" onClick={handleBack}>Back</Button>
              <Button variant="contained" onClick={handleNext} disabled={!metadata.fileName || !metadata.folderPath || !metadata.tags || !metadata.visibility || !metadata.altText || !metadata.description}>Next</Button>
            </div>
          </Box>
        )}
        {step === 4 && (
          <Box className="step step-4">
            {uploadComplete && (
              <>
                <Typography variant="h6">Media uploaded successfully!</Typography>
                {fileUrl && (
                  <Box mt={2}>
                    <img src={fileUrl} alt="Uploaded file" style={{ maxWidth: '100%', height: 'auto' }} />
                  </Box>
                )}
              </>
            )}
            <div className="cta-group">
              <Button variant="outlined" onClick={handleAddMore}>Add More</Button>
              <Button variant="contained" onClick={onDone}>Done</Button>
            </div>
          </Box>
        )}
      </>
    </Box>
  );
};

export default MediaUploader;