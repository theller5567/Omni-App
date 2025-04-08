import React, { useState, useEffect, useCallback } from "react";
import {
  Box,
  Button,
  TextField,
  LinearProgress,
  Typography,
  FormControl,
  Select,
  MenuItem,
  InputLabel,
  SelectChangeEvent,
  Stepper,
  Step,
  StepLabel,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  CircularProgress,
  Grid,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import { useDropzone } from "react-dropzone";
import { FaFileImage, FaFileVideo, FaUpload } from "react-icons/fa";
import "./MediaUploader.scss";
import { useNavigate } from "react-router-dom";
import { BaseMediaFile } from "../../interfaces/MediaFile";
import { useSelector, useDispatch } from "react-redux";
import { RootState, AppDispatch } from "../../store/store";
import { addMedia } from "../../store/slices/mediaSlice";
import { toast } from "react-toastify";
import { initializeMediaTypes } from "../../store/slices/mediaTypeSlice";
import { motion, AnimatePresence } from "framer-motion";
import env from '../../config/env';

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

const MediaUploader: React.FC<MediaTypeUploaderProps> = ({
  open,
  onClose,
  onUploadComplete,
}) => {
  const dispatch = useDispatch<AppDispatch>();
  const mediaTypes = useSelector(
    (state: RootState) => state.mediaTypes.mediaTypes
  );
  const user = useSelector((state: RootState) => state.user);
  const navigate = useNavigate();

  useEffect(() => {
    if (mediaTypes.length === 0) {
      dispatch(initializeMediaTypes());
    }
  }, [dispatch, mediaTypes.length]);

  // All state hooks
  const [step, setStep] = useState(1);
  const [file, setFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [selectedMediaType, setSelectedMediaType] = useState("");
  const [metadata, setMetadata] = useState<MetadataState>({
    fileName: "",
    tags: [],
    visibility: "public",
    altText: "",
    description: "",
    recordedDate: new Date().toISOString(),
    uploadedBy: user.currentUser._id,
    modifiedBy: user.currentUser._id,
  });
  const [fileSelected, setFileSelected] = useState(false);
  const [slug, setSlug] = useState<string | null>(null);
  const [uploadComplete, setUploadComplete] = useState(false);

  const [fileLoadingProgress, setFileLoadingProgress] = useState(0);
  const [isPreviewReady, setIsPreviewReady] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);

  const maxFileSizeMB = 200;

  const acceptedFileTypes = {
    "image/*": [],
    "video/*": [],
  };

  const getFileTypeIcon = (fileType: string) => {
    if (fileType.startsWith("image")) return <FaFileImage size={24} />;
    if (fileType.startsWith("video")) return <FaFileVideo size={24} />;
    return <FaUpload size={24} />;
  };

  const formatFileSize = (size: number) => {
    if (size < 1024) return size + " B";
    if (size < 1024 * 1024) return (size / 1024).toFixed(1) + " KB";
    return (size / (1024 * 1024)).toFixed(1) + " MB";
  };

  const onDrop = useCallback(
    (acceptedFiles: File[], fileRejections: any[]) => {
      if (fileRejections.length > 0) {
        const { file, errors } = fileRejections[0];
        const fileSizeInMB = (file.size / (1024 * 1024)).toFixed(2);
        let errorMessage = "";

        if (errors[0].code === "file-too-large") {
          errorMessage = `File is too large. Maximum size is ${maxFileSizeMB} MB. Your file was ${fileSizeInMB} MB.`;
        } else if (errors[0].code === "file-invalid-type") {
          errorMessage = `Invalid file type. Please upload an image or video file.`;
        } else {
          errorMessage = errors[0].message;
        }

        toast.error(errorMessage);
        return;
      }

      const file = acceptedFiles[0];
      if (file) {
        setFile(file);
        setFileSelected(true);
        setIsPreviewReady(false);
        setFileLoadingProgress(0);

        let progress = 0;
        const interval = setInterval(() => {
          progress += 5;
          setFileLoadingProgress(Math.min(progress, 90));
          if (progress >= 90) clearInterval(interval);
        }, 50);

        const reader = new FileReader();

        reader.onloadstart = () => {
          setFileLoadingProgress(0);
        };

        reader.onprogress = (event) => {
          if (event.lengthComputable) {
            const progress = Math.round((event.loaded / event.total) * 100);
            setFileLoadingProgress(progress);
          }
        };

        reader.onloadend = () => {
          const imageUrl = reader.result as string;
          setFilePreview(imageUrl);

          const img = new Image();
          img.onload = () => {
            setMetadata((prev) => ({
              ...prev,
              imageWidth: img.width,
              imageHeight: img.height,
            }));
            setFileLoadingProgress(100);
            setIsPreviewReady(true);
            clearInterval(interval);
          };
          img.src = imageUrl;
        };

        reader.readAsDataURL(file);
      }
    },
    [maxFileSizeMB]
  );

  // Dropzone setup with enhanced options
  const {
    getRootProps,
    getInputProps,
    isDragActive,
    isDragReject,
    isDragAccept,
  } = useDropzone({
    onDrop,
    accept: acceptedFileTypes,
    maxSize: maxFileSizeMB * 1024 * 1024,
    multiple: false,
  });

  useEffect(() => {
    if (user) {
      setMetadata((prevMetadata) => ({
        ...prevMetadata,
        uploadedBy: user.currentUser._id,
        modifiedBy: user.currentUser._id,
      }));
    }
  }, [user]);

  useEffect(() => {
    if (step === 2) {
      setUploadProgress(0);
      setUploadComplete(false);
    }
  }, [step]);

  // Early return after all hooks
  if (!open) return null;

  const handleMetadataChange = (field: string, value: any) => {
    setMetadata((prevMetadata: any) => ({
      ...prevMetadata,
      [field]: value,
    }));
  };

  const handleTagsChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    handleMetadataChange("tagsInput", event.target.value);
  };

  const handleTagsBlur = () => {
    if (metadata.tagsInput) {
      const newTags = metadata.tagsInput
        .split(",")
        .map((tag) => tag.trim())
        .filter((tag) => tag !== "");
      handleMetadataChange("tags", newTags);
    }
  };

  const handleTagsKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      event.preventDefault(); // Prevent form submission
      handleTagsBlur();
    }
  };

  const renderUploadStatus = () => {
    return (
      <Box sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "400px",
        padding: "2rem",
      }}>
        <Typography variant="h6" sx={{ mb: 3 }}>
          {isProcessing ? "Processing Upload" : "Upload Progress"}
        </Typography>
        <Box sx={{ width: "100%", maxWidth: "400px", mb: 3 }}>
          <LinearProgress
            variant={isProcessing ? "indeterminate" : "determinate"}
            value={uploadProgress}
            sx={{ height: 10, borderRadius: 5 }}
          />
          <Typography
            variant="body2"
            color="textSecondary"
            align="center"
            sx={{ mt: 2 }}
          >
            {isProcessing ? "Processing your upload..." : `${uploadProgress}% Uploaded`}
          </Typography>
        </Box>
      </Box>
    );
  };

  const handleUpload = async (file: File) => {
    console.log('Starting upload process...');
    setUploadComplete(false);
    setUploadProgress(0);
    setIsProcessing(false);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("title", file.name);
    formData.append(
      "fileExtension",
      file.name.split(".").pop()?.toUpperCase() || "UNKNOWN"
    );
    formData.append("uploadedBy", user.currentUser._id);
    formData.append("modifiedBy", user.currentUser._id);
    formData.append("mediaType", selectedMediaType);

    const { tagsInput, ...metadataWithoutTagsInput } = metadata;

    Object.entries(metadataWithoutTagsInput).forEach(([key, value]) => {
      if (key === "tags" && Array.isArray(value)) {
        value.forEach((tag) => formData.append(`metadata[${key}][]`, tag));
      } else {
        formData.append(`metadata[${key}]`, value as string);
      }
    });

    try {
      console.log('Creating XMLHttpRequest...');
      const xhr = new XMLHttpRequest();
      const response = await new Promise<UploadResponse>((resolve, reject) => {
        xhr.upload.onprogress = (event: ProgressEvent) => {
          const percentCompleted = Math.round(
            (event.loaded * 100) / event.total
          );
          console.log(`Upload progress: ${percentCompleted}%`);
          setUploadProgress(percentCompleted);
        };

        xhr.onload = () => {
          if (xhr.status === 201) {
            console.log('Upload successful, processing response...');
            // Don't set upload progress to 100 yet
            setIsProcessing(true);
            resolve(JSON.parse(xhr.response));
          } else {
            console.error('Upload failed with status:', xhr.status);
            reject(new Error("Upload failed"));
          }
        };

        xhr.onerror = () => {
          console.error('Upload failed with network error');
          reject(new Error("Upload failed"));
        };

        xhr.open("POST", `${env.BASE_URL}/media/upload`);
        xhr.send(formData);
      });

      console.log('Creating new file object...');
      const newFile: BaseMediaFile = {
        _id: response._id,
        id: response.id,
        location: response.location,
        slug: response.slug,
        title: response.title,
        uploadedBy: user.currentUser._id,
        modifiedBy: user.currentUser._id,
        mediaType: selectedMediaType,
        __t: selectedMediaType,
        metadata: {
          ...metadataWithoutTagsInput,
        },
        fileSize: file.size,
        modifiedDate: new Date(file.lastModified).toISOString(),
        fileExtension: file.name.split(".").pop() || "",
      };

      console.log('Dispatching addMedia action...');
      dispatch(addMedia(newFile));
      
      console.log('Setting final states...');
      setSlug(response.slug);
      // Set processing to false before showing completion
      setIsProcessing(false);
      setUploadComplete(true);
      console.log('Upload complete state set to true');
      
      if (typeof onUploadComplete === 'function') {
        console.log('Calling onUploadComplete callback...');
        onUploadComplete(newFile);
      }
      console.log('Upload process completed successfully');
    } catch (error) {
      console.error("Error uploading file:", error);
      toast.error("Failed to upload file");
      setUploadProgress(0);
      setIsProcessing(false);
      setUploadComplete(false);
    }
  };

  const handleClose = () => {
    console.log('handleClose called - explicit close requested');
    // Only reset states if explicitly closed by user
    setStep(1);
    setFile(null);
    setFilePreview(null);
    setFileSelected(false);
    setSlug(null);
    setUploadProgress(0);
    setIsProcessing(false);
    setUploadComplete(false);
    setSelectedMediaType("");
    setMetadata({
      fileName: "",
      tags: [],
      visibility: "public",
      altText: "",
      description: "",
      recordedDate: new Date().toISOString(),
      uploadedBy: user.currentUser._id,
      modifiedBy: user.currentUser._id,
    });
    onClose();
  };

  const handleAddMore = () => {
    setUploadProgress(0);
    setFilePreview(null);
    setStep(1);
    setFile(null);
    setSelectedMediaType("");
    setMetadata({
      fileName: "",
      tags: [],
      visibility: "public",
      altText: "",
      description: "",
      recordedDate: new Date().toISOString(),
      uploadedBy: user.currentUser._id,
      modifiedBy: user.currentUser._id,
    });
    setFileSelected(false);
    setUploadComplete(false);
  };

  const handleNext = () => {
    const nextStep = step + 1;
    if (nextStep === 4) {
      // Only trigger upload when moving to step 4
      handleUpload(file!);
    }
    setStep(nextStep);
  };

  const handleBack = () => setStep((prev) => (prev === 1 ? 1 : prev - 1));

  const handleChange = (event: SelectChangeEvent) => {
    setSelectedMediaType(event.target.value);
    handleMetadataChange("mediaType", event.target.value);
  };

  const steps = [
    "Select Media Type",
    "Upload File",
    "Add Metadata",
    "Completion",
  ];

  const handleViewMedia = () => {
    if (slug) {
      setStep(1);
      setFile(null);
      setFilePreview(null);
      setFileSelected(false);
      setUploadProgress(0);
      setUploadComplete(false);
      navigate(`/media/slug/${slug}`);
    }
  };

  const renderFields = () => {
    if (!selectedMediaType) return null;

    const selectedType = mediaTypes.find(
      (type) => type.name === selectedMediaType
    );
    if (!selectedType) return null;

    return (
      <Grid container spacing={2}>
        {/* Left Column */}
        <Grid item xs={6}>
          <TextField
            label="File Name"
            value={metadata.fileName || ""}
            onChange={(e) => handleMetadataChange("fileName", e.target.value)}
            required
            fullWidth
            margin="normal"
          />
          <TextField
            label="Alt Text"
            value={metadata.altText || ""}
            onChange={(e) => handleMetadataChange("altText", e.target.value)}
            required
            fullWidth
            margin="normal"
          />
          <FormControl fullWidth margin="normal">
            <InputLabel>Visibility</InputLabel>
            <Select
              value={metadata.visibility || "public"}
              onChange={(e) => handleMetadataChange("visibility", e.target.value)}
              label="Visibility"
            >
              <MenuItem value="public">Public</MenuItem>
              <MenuItem value="private">Private</MenuItem>
            </Select>
          </FormControl>
        </Grid>

        {/* Right Column */}
        <Grid item xs={6}>
          <TextField
            label="Tags"
            value={metadata.tagsInput || ""}
            onChange={handleTagsChange}
            onBlur={handleTagsBlur}
            onKeyDown={handleTagsKeyDown}
            fullWidth
            margin="normal"
            helperText="Enter tags separated by commas"
          />
          
          {/* First half of media type specific fields */}
          {selectedType.fields.slice(0, Math.ceil(selectedType.fields.length / 2)).map((field) => {
            switch (field.type) {
              case 'Text':
                return (
                  <TextField
                    key={field.name}
                    label={field.name}
                    value={metadata[field.name] || ""}
                    onChange={(e) => handleMetadataChange(field.name, e.target.value)}
                    required={field.required}
                    fullWidth
                    margin="normal"
                  />
                );
              case 'Number':
                return (
                  <TextField
                    key={field.name}
                    label={field.name}
                    type="number"
                    value={metadata[field.name] || ""}
                    onChange={(e) => handleMetadataChange(field.name, e.target.value)}
                    required={field.required}
                    fullWidth
                    margin="normal"
                  />
                );
              case 'Select':
                return (
                  <FormControl key={field.name} fullWidth margin="normal">
                    <InputLabel>{field.name}</InputLabel>
                    <Select
                      value={metadata[field.name] || ""}
                      onChange={(e) => handleMetadataChange(field.name, e.target.value)}
                      label={field.name}
                      required={field.required}
                    >
                      {field.options?.map((option) => (
                        <MenuItem key={option} value={option}>
                          {option}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                );
              case 'Date':
                return (
                  <TextField
                    key={field.name}
                    label={field.name}
                    type="date"
                    value={metadata[field.name] || ""}
                    onChange={(e) => handleMetadataChange(field.name, e.target.value)}
                    required={field.required}
                    fullWidth
                    margin="normal"
                    InputLabelProps={{ shrink: true }}
                  />
                );
              case 'Boolean':
                return (
                  <FormControl key={field.name} fullWidth margin="normal">
                    <InputLabel>{field.name}</InputLabel>
                    <Select
                      value={metadata[field.name] || ""}
                      onChange={(e) => handleMetadataChange(field.name, e.target.value)}
                      label={field.name}
                      required={field.required}
                    >
                      <MenuItem value="true">Yes</MenuItem>
                      <MenuItem value="false">No</MenuItem>
                    </Select>
                  </FormControl>
                );
              default:
                return null;
            }
          })}
        </Grid>

        {/* Description field - full width */}
        <Grid item xs={12}>
          <TextField
            label="Description"
            value={metadata.description || ""}
            onChange={(e) => handleMetadataChange("description", e.target.value)}
            required
            fullWidth
            margin="normal"
            multiline
            rows={4}
          />
        </Grid>

        {/* Second half of media type specific fields */}
        {selectedType.fields.slice(Math.ceil(selectedType.fields.length / 2)).map((field) => (
          <Grid item xs={6} key={field.name}>
            {(() => {
              switch (field.type) {
                case 'Text':
                  return (
                    <TextField
                      label={field.name}
                      value={metadata[field.name] || ""}
                      onChange={(e) => handleMetadataChange(field.name, e.target.value)}
                      required={field.required}
                      fullWidth
                      margin="normal"
                    />
                  );
                case 'Number':
                  return (
                    <TextField
                      label={field.name}
                      type="number"
                      value={metadata[field.name] || ""}
                      onChange={(e) => handleMetadataChange(field.name, e.target.value)}
                      required={field.required}
                      fullWidth
                      margin="normal"
                    />
                  );
                case 'Select':
                  return (
                    <FormControl fullWidth margin="normal">
                      <InputLabel>{field.name}</InputLabel>
                      <Select
                        value={metadata[field.name] || ""}
                        onChange={(e) => handleMetadataChange(field.name, e.target.value)}
                        label={field.name}
                        required={field.required}
                      >
                        {field.options?.map((option) => (
                          <MenuItem key={option} value={option}>
                            {option}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  );
                case 'Date':
                  return (
                    <TextField
                      label={field.name}
                      type="date"
                      value={metadata[field.name] || ""}
                      onChange={(e) => handleMetadataChange(field.name, e.target.value)}
                      required={field.required}
                      fullWidth
                      margin="normal"
                      InputLabelProps={{ shrink: true }}
                    />
                  );
                case 'Boolean':
                  return (
                    <FormControl fullWidth margin="normal">
                      <InputLabel>{field.name}</InputLabel>
                      <Select
                        value={metadata[field.name] || ""}
                        onChange={(e) => handleMetadataChange(field.name, e.target.value)}
                        label={field.name}
                        required={field.required}
                      >
                        <MenuItem value="true">Yes</MenuItem>
                        <MenuItem value="false">No</MenuItem>
                      </Select>
                    </FormControl>
                  );
                default:
                  return null;
              }
            })()}
          </Grid>
        ))}
      </Grid>
    );
  };

  return (
    <Dialog
      open={open}
      onClose={(_, reason) => {
        console.log('Dialog onClose triggered with reason:', reason);
        // Only allow closing through explicit button clicks
        if (reason === 'backdropClick' || reason === 'escapeKeyDown') {
          console.log('Preventing automatic close from:', reason);
          return;
        }
        console.log('Allowing close from explicit action');
        onClose();
      }}
      disableEscapeKeyDown
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          minHeight: "600px",
          maxHeight: "90vh",
          width: "100%",
          margin: 2,
        },
      }}
    >
      <DialogTitle>
        Upload Media
        <IconButton
          aria-label="close"
          onClick={handleClose}
          sx={{
            position: "absolute",
            right: 8,
            top: 8,
            color: (theme) => theme.palette.grey[500],
          }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent>
        <Box className="dialog-inner">
          <Stepper activeStep={step - 1} alternativeLabel className="stepper">
            {steps.map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>
          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.3 }}
                style={{ width: "100%" }}
              >
                <Typography variant="h6" sx={{ mb: 3 }}>
                  Select Media Type
                </Typography>
                <FormControl fullWidth>
                  <InputLabel>Media Type</InputLabel>
                  <Select
                    value={selectedMediaType}
                    onChange={handleChange}
                    label="Media Type"
                  >
                    {mediaTypes
                      .filter(type => !type.status || type.status === 'active')
                      .map((type) => (
                        <MenuItem key={type.name} value={type.name}>
                          {type.name}
                        </MenuItem>
                      ))}
                  </Select>
                </FormControl>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.3 }}
                style={{ width: "100%" }}
              >
                <Typography variant="h6" sx={{ mb: 3 }}>
                  Upload File
                </Typography>
                <div
                  {...getRootProps()}
                  className={`dropzone ${isDragActive ? "active" : ""} ${
                    isDragReject ? "reject" : ""
                  } ${isDragAccept ? "accept" : ""}`}
                  style={{ width: "100%", minHeight: "200px" }}
                >
                  <input {...getInputProps()} />
                  <div className="dropzone-content">
                    {!fileSelected ? (
                      <>
                        {getFileTypeIcon(file?.type || "upload")}
                        <Typography>
                          Drag & drop your file here, or click to select
                        </Typography>
                        <Typography variant="caption" color="textSecondary">
                          Maximum file size: {maxFileSizeMB}MB
                        </Typography>
                      </>
                    ) : (
                      <>
                        {!isPreviewReady ? (
                          <div className="loading-preview">
                            <CircularProgress />
                            <Typography>
                              Loading preview... {fileLoadingProgress}%
                            </Typography>
                          </div>
                        ) : (
                          <div className="file-preview">
                            {filePreview && file?.type.startsWith("image") ? (
                              <img
                                src={filePreview}
                                alt="Preview"
                                style={{ maxWidth: "100%", maxHeight: "200px" }}
                              />
                            ) : (
                              getFileTypeIcon(file?.type || "")
                            )}
                            <Typography>{file?.name}</Typography>
                            <Typography variant="caption">
                              {formatFileSize(file?.size || 0)}
                            </Typography>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.3 }}
                style={{ width: "100%" }}
              >
                <Typography variant="h6" sx={{ mb: 3 }}>
                  Add Metadata
                </Typography>
                {renderFields()}
              </motion.div>
            )}

            {step === 4 && (
              <motion.div
                key="step4"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.3 }}
                style={{ width: "100%" }}
              >
                {!uploadComplete ? (
                  renderUploadStatus()
                ) : (
                  <Box
                    sx={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      minHeight: "400px",
                      padding: "2rem",
                    }}
                  >
                    <CheckCircleIcon
                      sx={{
                        fontSize: "80px",
                        color: "success.main",
                        mb: 3,
                      }}
                    />
                    <Typography
                      variant="h4"
                      gutterBottom
                      sx={{
                        fontWeight: "bold",
                        mb: 2,
                      }}
                    >
                      Upload Complete!
                    </Typography>
                    <Typography
                      color="textSecondary"
                      sx={{
                        mb: 4,
                        textAlign: "center",
                      }}
                    >
                      Your file has been successfully uploaded.
                    </Typography>
                    {filePreview && (
                      <Box
                        sx={{
                          mb: 4,
                          width: "100%",
                          maxWidth: "400px",
                          display: "flex",
                          justifyContent: "center",
                        }}
                      >
                        <img
                          src={filePreview}
                          alt="Upload preview"
                          style={{
                            width: "100%",
                            maxHeight: "250px",
                            objectFit: "contain",
                            borderRadius: "8px",
                            boxShadow: "0 4px 8px rgba(0,0,0,0.1)",
                          }}
                        />
                      </Box>
                    )}
                    <Box
                      sx={{
                        display: "flex",
                        gap: 2,
                        justifyContent: "center",
                      }}
                    >
                      <Button
                        variant="contained"
                        color="primary"
                        onClick={handleViewMedia}
                        size="large"
                      >
                        View Media
                      </Button>
                      <Button
                        variant="outlined"
                        color="primary"
                        onClick={handleAddMore}
                        size="large"
                      >
                        Upload More
                      </Button>
                      <Button
                        variant="outlined"
                        color="secondary"
                        onClick={handleClose}
                        size="large"
                      >
                        Close
                      </Button>
                    </Box>
                  </Box>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </Box>
      </DialogContent>
      <DialogActions sx={{ padding: 2 }}>
        {step > 1 && (
          <Button onClick={handleBack} sx={{ mr: 1 }}>
            Back
          </Button>
        )}
        {step < 4 && (
          <Button
            variant="contained"
            onClick={handleNext}
            disabled={
              (step === 1 && !selectedMediaType) ||
              (step === 2 && !fileSelected)
            }
          >
            Next
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default MediaUploader;
