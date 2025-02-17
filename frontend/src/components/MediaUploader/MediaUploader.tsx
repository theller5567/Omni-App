import React, { useState, useEffect } from 'react';
import { Box, Button, TextField, LinearProgress, Typography } from '@mui/material';
import { useDropzone } from 'react-dropzone';
import { useUser } from '../../contexts/UserContext';
import { FaTimes } from 'react-icons/fa';
import './MediaUploader.scss';

interface MediaUploaderProps {
  onDone: () => void;
  onCancel: () => void;
}

const MediaUploader: React.FC<MediaUploaderProps> = ({ onDone, onCancel }) => {
  const { user } = useUser();
  const [step, setStep] = useState(1);
  const [file, setFile] = useState<File | null>(null);
  const [metadata, setMetadata] = useState<{ [key: string]: string | number | string[] }>({});
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [uploadComplete, setUploadComplete] = useState<boolean>(false);

  const onDrop = (acceptedFiles: File[]) => {
    setFile(acceptedFiles[0]);
    setUploadProgress(0);
    setUploadComplete(false);
  };

  const { getRootProps, getInputProps } = useDropzone({ onDrop });

  const handleNext = () => setStep((prev) => prev + 1);
  const handleBack = () => setStep((prev) => prev - 1);

  const handleMetadataChange = (key: string, value: string | number | string[]) => {
    setMetadata((prevMetadata) => ({ ...prevMetadata, [key]: value }));
  };

  useEffect(() => {
    if (user) {
      handleMetadataChange('uploadedBy', user.name);
    }
  }, [user]);

  const isStep2Valid = () => {
    return (
      metadata.fileName &&
      metadata.folderPath &&
      metadata.tags &&
      metadata.visibility &&
      metadata.altText &&
      metadata.description
    );
  };

  const handleAddMedia = () => {
    if (file) {
      const interval = setInterval(() => {
        setUploadProgress((prevProgress) => {
          if (prevProgress < 100) {
            return prevProgress + 10;
          } else {
            clearInterval(interval);
            setUploadComplete(true);
            console.log('Saving media with metadata:', file, metadata);
            // Implement actual saving logic here
            return prevProgress;
          }
        });
      }, 500);
    }
  };

  const handleAddMore = () => {
    setStep(1);
    setFile(null);
    setMetadata({});
    setUploadProgress(0);
    setUploadComplete(false);
  };

  return (
    <Box id="media-uploader">
        <Button onClick={onCancel} color="secondary" sx={{ float: 'right' }}><FaTimes /></Button>
      {!uploadComplete ? (
        <>
          <Box textAlign="center" mb={2}>
            
            <Typography variant="subtitle1">Step {step} of 3</Typography>
          </Box>
          {step === 1 && (
            <Box>
              <div {...getRootProps()} style={{ border: '2px dashed var(--accent-color)', padding: '20px', textAlign: 'center' }}>
                <input {...getInputProps()} />
                <p>Drag & drop files here, or click to select files</p>
              </div>
              {file && <p>Selected file: {file.name}</p>}
              <div className="cta-group">
              <Button onClick={handleBack} disabled={true}></Button>
              <Button onClick={handleNext} disabled={!file}>Next</Button>
              </div>
            </Box>
          )}
          {step === 2 && (
            <Box>
              <TextField
                label="File Name"
                required
                onChange={(e) => handleMetadataChange('fileName', e.target.value)}
                fullWidth
                margin="normal"
              />
              <TextField
                label="Folder Path"
                required
                onChange={(e) => handleMetadataChange('folderPath', e.target.value)}
                fullWidth
                margin="normal"
              />
              <TextField
                label="Tags (comma separated)"
                required
                onChange={(e) => handleMetadataChange('tags', e.target.value.split(','))}
                fullWidth
                margin="normal"
              />
              <TextField
                label="Visibility"
                onChange={(e) => handleMetadataChange('visibility', e.target.value)}
                fullWidth
                margin="normal"
              />
              <TextField
                label="Alt Text"
                required
                onChange={(e) => handleMetadataChange('altText', e.target.value)}
                fullWidth
                margin="normal"
              />
              <TextField
                label="Description"
                required
                onChange={(e) => handleMetadataChange('description', e.target.value)}
                fullWidth
                margin="normal"
              />
              <div className="cta-group">
                <Button onClick={handleBack}>Back</Button>
                <Button onClick={handleNext} disabled={!isStep2Valid()}>Next</Button>
              </div>
            </Box>
          )}
          {step === 3 && (
            <Box>
              {file && <p>Thumbnail: {file.name}</p>}
              <LinearProgress variant="determinate" value={uploadProgress} />
              <Button onClick={handleBack}>Back</Button>
              <Button onClick={handleAddMedia}>Add Media</Button>
            </Box>
          )}
        </>
      ) : (
        <Box textAlign="center">
          <Typography variant="h6">Media uploaded successfully!</Typography>
          <Button onClick={handleAddMore}>Add More</Button>
          <Button onClick={onDone}>Done</Button>
        </Box>
      )}
    </Box>
  );
};

export default MediaUploader;