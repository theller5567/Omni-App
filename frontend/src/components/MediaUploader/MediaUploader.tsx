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
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import { useDropzone } from "react-dropzone";
import { FaFileImage, FaFileVideo, FaUpload, FaImage, FaVideo, FaFileAudio, FaFileWord } from "react-icons/fa";
import "./MediaUploader.scss";
import { useNavigate } from "react-router-dom";
import { BaseMediaFile } from "../../interfaces/MediaFile";
import { useSelector, useDispatch } from "react-redux";
import { RootState, AppDispatch } from "../../store/store";
import { addMedia } from "../../store/slices/mediaSlice";
import { toast } from "react-toastify";
import { initializeMediaTypes } from "../../store/slices/mediaTypeSlice";
import type { MediaType } from "../../store/slices/mediaTypeSlice";
import { motion, AnimatePresence } from "framer-motion";
import env from '../../config/env';
import { getBaseFieldsForMimeType } from '../../utils/mediaTypeUtils';
import UploadThumbnailSelector from '../VideoThumbnailSelector/UploadThumbnailSelector';

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
  metadata?: {
    v_thumbnail?: string;
    v_thumbnailTimestamp?: string;
    [key: string]: any;
  };
  fileSize: number;
  fileExtension: string;
  modifiedDate: string;
  uploadedBy: string;
  modifiedBy: string;
  mediaType: string;
  __t: string;
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

  const [videoThumbnail, setVideoThumbnail] = useState<string | undefined>();
  const [videoThumbnailTimestamp, setVideoThumbnailTimestamp] = useState('00:00:01');

  const maxFileSizeMB = 200;

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

  // Add the function to check if a file type is valid for the selected media type
  const isFileTypeValid = (file: File): boolean => {
    if (!selectedMediaType) return false;
    
    const mediaType = mediaTypes.find(type => type._id === selectedMediaType);
    if (!mediaType || !mediaType.acceptedFileTypes || mediaType.acceptedFileTypes.length === 0) {
      return false;
    }
    
    // Check if the file's MIME type is in the accepted types
    const fileMimeType = file.type;
    
    // Direct match for specific MIME type
    if (mediaType.acceptedFileTypes.includes(fileMimeType)) {
      return true;
    }
    
    // Check for wildcard match (e.g., "image/*" should match "image/png")
    const fileCategory = fileMimeType.split('/')[0];
    if (mediaType.acceptedFileTypes.includes(`${fileCategory}/*`)) {
      return true;
    }
    
    return false;
  };

  // Dynamic file type accepter based on selected media type
  const getAcceptedFileTypes = () => {
    // If no media type is selected, return empty object (don't accept any files)
    if (!selectedMediaType) {
      return {};
    }
    
    // Find the selected media type
    const mediaType = mediaTypes.find(type => type._id === selectedMediaType);
    
    // If media type not found or has no accepted file types, return empty object
    if (!mediaType || !mediaType.acceptedFileTypes || mediaType.acceptedFileTypes.length === 0) {
      return {};
    }
    
    // Create a map of accepted file types for react-dropzone
    const acceptedTypesMap: Record<string, string[]> = {};
    
    // First collect all the non-wildcard types
    mediaType.acceptedFileTypes.forEach(type => {
      if (type.includes('/')) {
        const [category, subtype] = type.split('/');
        
        // Skip wildcards for now
        if (subtype !== '*') {
          // Initialize the category array if needed
          if (!acceptedTypesMap[`${category}/*`]) {
            acceptedTypesMap[`${category}/*`] = [];
          }
          
          // Add the extension (assuming extension matches subtype)
          // This avoids the "invalid file extension" warning
          acceptedTypesMap[`${category}/*`].push(`.${subtype}`);
        }
      }
    });
    
    // Now handle wildcards - if we have image/* but no specific image types,
    // we need to include some common extensions
    mediaType.acceptedFileTypes.forEach(type => {
      if (type.includes('/')) {
        const [category, subtype] = type.split('/');
        
        if (subtype === '*') {
          // Initialize category if needed
          if (!acceptedTypesMap[`${category}/*`]) {
            acceptedTypesMap[`${category}/*`] = [];
            
            // Add common extensions for each category
            switch (category) {
              case 'image':
                acceptedTypesMap[`${category}/*`] = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'];
                break;
              case 'video':
                acceptedTypesMap[`${category}/*`] = ['.mp4', '.webm', '.ogg', '.mov'];
                break;
              case 'audio':
                acceptedTypesMap[`${category}/*`] = ['.mp3', '.wav', '.ogg', '.m4a'];
                break;
              case 'application':
                acceptedTypesMap[`${category}/*`] = ['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx'];
                break;
              default:
                // For unknown categories, leave as empty array
                break;
            }
          }
        }
      }
    });
    
    return acceptedTypesMap;
  };

  // Add this function to group accepted file types by category for better display
  const getAcceptedFileTypesSummary = () => {
    if (!selectedMediaType) return 'Select a media type to upload files';
    
    const mediaType = mediaTypes.find(type => type._id === selectedMediaType);
    if (!mediaType || !mediaType.acceptedFileTypes || mediaType.acceptedFileTypes.length === 0) {
      return 'No file types are accepted for this media type';
    }

    // Group by category (image, video, etc.)
    const byCategory: Record<string, string[]> = {};
    
    mediaType.acceptedFileTypes.forEach(type => {
      if (type.includes('/')) {
        const [category, subtype] = type.split('/');
        if (!byCategory[category]) {
          byCategory[category] = [];
        }
        if (subtype !== '*') {
          byCategory[category].push(subtype);
        } else {
          byCategory[category].push('All types');
        }
      }
    });

    return Object.entries(byCategory)
      .map(([category, subtypes]) => {
        const subtypesText = subtypes.includes('All types') 
          ? 'All types' 
          : subtypes.join(', ');
        return `${category.charAt(0).toUpperCase() + category.slice(1)}: ${subtypesText}`;
      })
      .join(', ');
  };

  // Define onDrop function before useDropzone
  const onDrop = useCallback(
    (acceptedFiles: File[], fileRejections: any[]) => {
    if (fileRejections.length > 0) {
        const { file, errors } = fileRejections[0];
        const fileSizeInMB = (file.size / (1024 * 1024)).toFixed(2);
        let errorMessage = "";

        if (errors[0].code === "file-too-large") {
          errorMessage = `File is too large. Maximum size is ${maxFileSizeMB} MB. Your file was ${fileSizeInMB} MB.`;
        } else if (errors[0].code === "file-invalid-type") {
          const mediaType = mediaTypes.find(type => type._id === selectedMediaType);
          if (mediaType) {
            errorMessage = `Invalid file type. This media type only accepts: ${mediaType.acceptedFileTypes.join(', ')}`;
          } else {
            errorMessage = `Invalid file type. Please upload an accepted file type.`;
          }
        } else {
          errorMessage = errors[0].message;
        }

        toast.error(errorMessage);
      return;
    }

    const file = acceptedFiles[0];
    if (file) {
        // Extra validation to ensure file type is acceptable
        if (!isFileTypeValid(file)) {
          const mediaType = mediaTypes.find(type => type._id === selectedMediaType);
          toast.error(`Invalid file type. This media type only accepts: ${mediaType?.acceptedFileTypes.join(', ')}`);
          return;
        }

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
          const fileUrl = reader.result as string;
          setFilePreview(fileUrl);

          // Check if the file is an image
          if (file.type.startsWith('image')) {
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
            img.onerror = () => {
              console.error('Error loading image preview');
              setFileLoadingProgress(100);
              setIsPreviewReady(true);
              clearInterval(interval);
            };
            img.src = fileUrl;
          } else {
            // Handle non-image files (like videos)
            console.log('Non-image file detected, skipping image dimension extraction');
            // For video files, we won't have image dimensions, so we can set them to undefined
            setMetadata((prev) => ({
              ...prev,
              imageWidth: undefined,
              imageHeight: undefined,
            }));
            setFileLoadingProgress(100);
            setIsPreviewReady(true);
            clearInterval(interval);
          }
        };

        reader.onerror = () => {
          console.error('Error reading file');
          toast.error('Error preparing file preview');
          setFileLoadingProgress(100);
          setIsPreviewReady(true);
          clearInterval(interval);
        };

      reader.readAsDataURL(file);
    }
    },
    [maxFileSizeMB, selectedMediaType, mediaTypes]
  );

  // Update the useDropzone setup
  const {
    getRootProps,
    getInputProps,
    isDragActive,
    isDragReject,
    isDragAccept,
  } = useDropzone({
    onDrop,
    accept: getAcceptedFileTypes(),
    maxSize: maxFileSizeMB * 1024 * 1024,
    multiple: false,
    disabled: !selectedMediaType, // Disable if no media type selected
  });

  // Modify the media type selection to show accepted file types
  const handleChange = (event: SelectChangeEvent) => {
    const newMediaTypeId = event.target.value;
    setSelectedMediaType(newMediaTypeId);
    handleMetadataChange("mediaType", newMediaTypeId);
    
    // Reset file if media type changes
    if (file) {
      setFile(null);
      setFilePreview(null);
      setFileSelected(false);
    }
    
    // Reset step to 1 if changing media type
    setStep(1);
  };

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

  // Add a new useEffect near the top of the component, with other useEffect hooks
  useEffect(() => {
    if (step === 3) {
      console.log('Step 3 - Selected Media Type:', selectedMediaType);
      console.log('Step 3 - Media Types available:', mediaTypes.map(t => ({id: t._id, name: t.name})));
    }
  }, [step, selectedMediaType, mediaTypes]);

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

  const handleThumbnailSelect = (timestamp: string) => {
    if (!file) return;
    
    console.log('Generating thumbnail at timestamp:', timestamp);
    
    const video = document.createElement('video');
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    video.onloadeddata = () => {
      console.log('Video loaded, seeking to timestamp');
      // Convert timestamp format (HH:MM:SS) to seconds
      const [hours, minutes, seconds] = timestamp.split(':').map(Number);
      const timeInSeconds = (hours * 3600) + (minutes * 60) + seconds;
      video.currentTime = timeInSeconds;
    };
    
    video.onseeked = () => {
      console.log('Video seeked to timestamp, generating thumbnail');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      ctx?.drawImage(video, 0, 0, canvas.width, canvas.height);
      const thumbnail = canvas.toDataURL('image/jpeg', 0.7);
      console.log('Thumbnail generated, updating state');
      setVideoThumbnail(thumbnail);
      setVideoThumbnailTimestamp(timestamp);
      
      // Clean up
      URL.revokeObjectURL(video.src);
    };
    
    video.onerror = (e) => {
      console.error('Error loading video:', e);
      toast.error('Failed to generate thumbnail');
      URL.revokeObjectURL(video.src);
    };
    
    const videoUrl = URL.createObjectURL(file);
    console.log('Created video URL:', videoUrl);
    video.src = videoUrl;
  };

  const handleUpload = async (file: File) => {
    console.log('Starting upload process...', { fileName: file.name, fileType: file.type });
    setUploadComplete(false);
    setUploadProgress(0);
    setIsProcessing(true);

    let uploadTimeout: NodeJS.Timeout | null = null;
    const UPLOAD_TIMEOUT_MS = 60000;

    const formData = new FormData();
    
    console.log('Uploading file:', {
      name: file.name,
      type: file.type,
      size: file.size
    });
    
    formData.append("file", file);
    formData.append("title", file.name);
    formData.append(
      "fileExtension",
      file.name.split(".").pop()?.toUpperCase() || "UNKNOWN"
    );
    formData.append("uploadedBy", user.currentUser._id);
    formData.append("modifiedBy", user.currentUser._id);
    
    const selectedMediaTypeObj = mediaTypes.find(type => type._id === selectedMediaType);
    if (!selectedMediaTypeObj) {
      toast.error("Selected media type not found");
      return;
    }
    
    formData.append("mediaType", selectedMediaTypeObj.name);

    // Add thumbnail data if available
    if (file.type.startsWith('video/') && videoThumbnail) {
      console.log('Adding video thumbnail data');
      
      // Create thumbnail filename based on video filename
      const baseName = file.name.split('.')[0].toLowerCase().replace(/[^a-z0-9]+/g, '_');
      const date = new Date().toLocaleDateString('en-US', {
        month: '2-digit',
        day: '2-digit',
        year: 'numeric'
      }).replace(/\//g, '');
      const thumbnailFilename = `${baseName}_thumbnail_${date}.jpg`;
      
      // Convert base64 thumbnail to blob
      const base64Data = videoThumbnail.split(',')[1];
      const byteCharacters = atob(base64Data);
      const byteArrays = [];
      
      for (let offset = 0; offset < byteCharacters.length; offset += 512) {
        const slice = byteCharacters.slice(offset, offset + 512);
        const byteNumbers = new Array(slice.length);
        for (let i = 0; i < slice.length; i++) {
          byteNumbers[i] = slice.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        byteArrays.push(byteArray);
      }
      
      const thumbnailBlob = new Blob(byteArrays, { type: 'image/jpeg' });
      formData.append('v_thumbnail', thumbnailBlob, thumbnailFilename);
      formData.append('v_thumbnailTimestamp', videoThumbnailTimestamp);
    }

    // Add metadata
    const { tagsInput, ...metadataWithoutTagsInput } = metadata;
    const metadataString = JSON.stringify(metadataWithoutTagsInput);
    formData.append('metadata', metadataString);

    try {
      console.log('Creating XMLHttpRequest...');
      const xhr = new XMLHttpRequest();
      const response = await new Promise<UploadResponse>((resolve, reject) => {
        // Set timeout to handle stalled uploads
        uploadTimeout = setTimeout(() => {
          xhr.abort();
          reject(new Error("Upload timed out after " + (UPLOAD_TIMEOUT_MS/1000) + " seconds"));
        }, UPLOAD_TIMEOUT_MS);

        xhr.upload.onprogress = (event: ProgressEvent) => {
          const percentCompleted = Math.round(
            (event.loaded * 100) / event.total
          );
          console.log(`Upload progress: ${percentCompleted}%`);
          setUploadProgress(percentCompleted);
        };

        xhr.onload = () => {
          // Clear the timeout since we got a response
          if (uploadTimeout) clearTimeout(uploadTimeout);
          
          if (xhr.status === 201) {
            console.log('Upload successful, processing response...');
            const responseData = JSON.parse(xhr.response);
            console.log('Server response:', responseData);
            resolve(responseData);
          } else {
            console.error('Upload failed with status:', xhr.status, xhr.responseText);
            reject(new Error(`Upload failed with status: ${xhr.status}. ${xhr.responseText}`));
          }
        };

        xhr.onerror = () => {
          // Clear the timeout since we got an error
          if (uploadTimeout) clearTimeout(uploadTimeout);
          
          console.error('Upload failed with network error');
          reject(new Error("Upload failed due to network error"));
        };

        xhr.open("POST", `${env.BASE_URL}/media/upload`);
        xhr.send(formData);
      });

      console.log('Creating new file object with response:', response);
      const newFile: BaseMediaFile = {
        _id: response._id,
        id: response.id,
        location: response.location,
        slug: response.slug,
        title: response.title,
        uploadedBy: response.uploadedBy,
        modifiedBy: response.modifiedBy,
        mediaType: response.mediaType,
        __t: response.__t,
        metadata: {
          ...metadataWithoutTagsInput,
          ...(response.metadata || {}),
        },
        fileSize: response.fileSize,
        modifiedDate: response.modifiedDate,
        fileExtension: response.fileExtension,
      };

      console.log('Dispatching addMedia action with file:', newFile);
      await dispatch(addMedia(newFile));
      
      console.log('Setting final states...');
      setSlug(response.slug);
      setIsProcessing(false);
      setUploadComplete(true);
      console.log('Upload complete state set to true, slug:', response.slug);
      
      if (typeof onUploadComplete === 'function') {
        console.log('Calling onUploadComplete callback with file:', newFile);
        onUploadComplete(newFile);
      }
      console.log('Upload process completed successfully');
    } catch (error) {
      console.error("Error uploading file:", error);
      toast.error("Failed to upload file: " + (error instanceof Error ? error.message : "Unknown error"));
      setUploadProgress(0);
      setIsProcessing(false);
      setUploadComplete(false);
    } finally {
      // Make sure to clear the timeout if it's still active
      if (uploadTimeout) clearTimeout(uploadTimeout);
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
      // Show processing state immediately when moving to upload step
      setIsProcessing(true);
      setUploadProgress(0);
      // Only trigger upload when moving to step 4
      handleUpload(file!);
    }
    setStep(nextStep);
  };

  const handleBack = () => setStep((prev) => (prev === 1 ? 1 : prev - 1));

  const steps = [
    "Select Media Type",
    "Upload File",
    "Add Metadata",
    "Completion",
  ];

  const handleViewMedia = () => {
    if (!slug) {
      console.error('Cannot view media: slug is not set');
      return;
    }
    
    console.log('Navigating to media with slug:', slug);
    // First close the dialog
    handleClose();
    // Then navigate to the media detail page
    setTimeout(() => {
      navigate(`/media/slug/${slug}`);
    }, 100);
  };

  const renderFieldInput = (field: any) => {
    switch (field.type) {
      case 'Text':
        return (
      <TextField
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
              {field.options?.map((option: string) => (
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
  };

  const renderFields = () => {
    // First, try to find the media type by ID
    let matchingType = mediaTypes.find(type => type._id === selectedMediaType);
    
    // If not found by ID, try to find by name (for backward compatibility)
    if (!matchingType) {
      matchingType = mediaTypes.find(type => type.name === selectedMediaType);
    }
    
    if (!matchingType) {
      console.log('No matching media type found for:', selectedMediaType);
      return <Typography color="error">Media type not found. Please select a valid media type.</Typography>;
    }

    // Determine if this media type has a base type
    const baseType = matchingType.baseType || 'Media';
    const includeBaseFields = matchingType.includeBaseFields !== false;
    
    // Get base fields if a file is selected and we should include base fields
    let baseFields = {};
    if (file && baseType !== 'Media' && includeBaseFields) {
      // Get the appropriate MIME type prefix based on the base type
      let mimeTypePrefix = '';
      switch (baseType) {
        case 'BaseImage': mimeTypePrefix = 'image/'; break;
        case 'BaseVideo': mimeTypePrefix = 'video/'; break;
        case 'BaseAudio': mimeTypePrefix = 'audio/'; break;
        case 'BaseDocument': mimeTypePrefix = 'application/pdf'; break;
      }
      
      // Get base fields if the file type matches the base type
      const fileCategory = file.type.split('/')[0];
      const baseCategory = mimeTypePrefix.split('/')[0];
      if (fileCategory === baseCategory) {
        baseFields = getBaseFieldsForMimeType(file.type);
      }
    }
    
    return (
      <Box className="fields-container">
        {/* Standard fields always shown */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6">Standard Information</Typography>
          
                <TextField
            fullWidth
            name="metadata.fileName"
                  label="File Name"
            value={metadata.fileName || file?.name || ""}
            onChange={(e) => handleMetadataChange("fileName", e.target.value)}
                  required
            margin="normal"
          />
          
          <TextField
                  fullWidth
            name="metadata.altText"
            label="Alt Text"
            value={metadata.altText || ""}
            onChange={(e) => handleMetadataChange("altText", e.target.value)}
                  margin="normal"
                />
          
                <TextField
                  fullWidth
            multiline
            rows={2}
            name="metadata.description"
            label="Description"
            value={metadata.description || ""}
            onChange={(e) => handleMetadataChange("description", e.target.value)}
                  margin="normal"
                />
          
          <FormControl fullWidth margin="normal">
            <InputLabel>Visibility</InputLabel>
            <Select
              name="metadata.visibility"
              value={metadata.visibility || "public"}
              onChange={(e) => handleMetadataChange("visibility", e.target.value)}
              label="Visibility"
            >
              <MenuItem value="public">Public</MenuItem>
              <MenuItem value="private">Private</MenuItem>
            </Select>
          </FormControl>
          
                <TextField
                  fullWidth
            name="metadata.tagsInput"
            label="Tags (comma-separated)"
            value={metadata.tagsInput || ""}
            onChange={handleTagsChange}
            onBlur={handleTagsBlur}
            onKeyDown={handleTagsKeyDown}
                  margin="normal"
                />
              </Box>
        
        {/* Base schema fields if available */}
        {Object.keys(baseFields).length > 0 && (
          <Box sx={{ mb: 3 }}>
            <Typography variant="h6">
              {baseType.replace('Base', '')} Properties
            </Typography>
            {Object.entries(baseFields).map(([fieldName, fieldProps]: [string, any]) => {
              // Skip fields that are already populated automatically
              if ((fieldName === 'imageWidth' || fieldName === 'imageHeight') && 
                  metadata[fieldName] !== undefined) {
                return (
                <TextField
                    key={fieldName}
                  fullWidth
                    disabled
                    name={`metadata.${fieldName}`}
                    label={fieldName}
                    value={metadata[fieldName] || "Auto-detected"}
                    helperText="This field is automatically populated"
                  margin="normal"
                />
                );
              }
              
              // Render appropriate input based on field type
              switch (fieldProps.type) {
                case 'Number':
                  return (
                <TextField
                      key={fieldName}
                      type="number"
                  fullWidth
                      name={`metadata.${fieldName}`}
                      label={fieldName}
                      value={metadata[fieldName] || ""}
                      onChange={(e) => handleMetadataChange(fieldName, e.target.value)}
                      required={fieldProps.required}
                  margin="normal"
                />
                  );
                case 'Boolean':
                  return (
                    <FormControl key={fieldName} fullWidth margin="normal">
                      <InputLabel>{fieldName}</InputLabel>
                      <Select
                        name={`metadata.${fieldName}`}
                        value={metadata[fieldName] !== undefined ? metadata[fieldName] : "false"}
                        onChange={(e) => handleMetadataChange(fieldName, e.target.value)}
                        label={fieldName}
                      >
                        <MenuItem value="true">Yes</MenuItem>
                        <MenuItem value="false">No</MenuItem>
                      </Select>
                    </FormControl>
                  );
                case 'Date':
                  return (
                <TextField
                      key={fieldName}
                  type="date"
                  fullWidth
                      name={`metadata.${fieldName}`}
                      label={fieldName}
                      value={metadata[fieldName] || ""}
                      onChange={(e) => handleMetadataChange(fieldName, e.target.value)}
                      InputLabelProps={{ shrink: true }}
                  margin="normal"
                    />
                  );
                default: // Text fields and others
                  return (
                    <TextField
                      key={fieldName}
                      fullWidth
                      name={`metadata.${fieldName}`}
                      label={fieldName}
                      value={metadata[fieldName] || ""}
                      onChange={(e) => handleMetadataChange(fieldName, e.target.value)}
                      margin="normal"
                    />
                  );
              }
            })}
              </Box>
        )}
        
        {/* Custom media type fields */}
        {matchingType.fields.length > 0 && (
          <Box sx={{ mb: 3 }}>
            <Typography variant="h6">
              {matchingType.name} Specific Fields
            </Typography>
            {matchingType.fields.map((field, index) => (
              <Box key={index} sx={{ mb: 2 }}>
                <Typography variant="subtitle1">{field.name}</Typography>
                {renderFieldInput(field)}
            </Box>
            ))}
          </Box>
        )}
      </Box>
    );
  };

  const renderDropzone = () => {
    return (
      <>
        <div
          {...getRootProps()}
          className={`dropzone ${isDragActive ? "active" : ""} ${
            isDragReject ? "reject" : ""
          } ${isDragAccept ? "accept" : ""} ${!selectedMediaType ? "disabled" : ""}`}
          style={{ width: "100%", minHeight: "200px" }}
        >
          <input {...getInputProps()} />
          {!selectedMediaType ? (
            <div className="dropzone-content disabled">
              <Typography variant="h6">Please select a media type first</Typography>
              <Typography variant="body2" color="textSecondary">
                Different media types only accept specific file formats
              </Typography>
            </div>
          ) : (
            <div className="dropzone-content">
              {!fileSelected ? (
                // No file selected yet
                <>
                  <FaUpload size={40} />
                  <Typography variant="h6">
                    Drag & drop or click to select a file
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Accepted file types: {getAcceptedFileTypesSummary()}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Max file size: {maxFileSizeMB} MB
                  </Typography>
                </>
              ) : (
                // File selected - show preview or loading
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
          )}
        </div>

        {/* Video Thumbnail Selector - Shown below dropzone when a video is selected */}
        {file && file.type.startsWith('video/') && isPreviewReady && (
          <Box sx={{ mt: 2, width: '100%' }}>
            <Typography variant="subtitle1" gutterBottom>
              Video Thumbnail
            </Typography>
            <UploadThumbnailSelector
              videoUrl={URL.createObjectURL(file)}
              onThumbnailSelect={handleThumbnailSelect}
              currentThumbnail={videoThumbnail}
            />
          </Box>
        )}
      </>
    );
  };

  const renderMediaTypeSelector = () => {
    // Helper function to get an appropriate icon based on accepted file types
    const getFileTypeIcons = (mediaType: MediaType) => {
      if (!mediaType.acceptedFileTypes || mediaType.acceptedFileTypes.length === 0) {
        return null;
      }

      const hasImages = mediaType.acceptedFileTypes.some(type => type.startsWith('image/'));
      const hasVideos = mediaType.acceptedFileTypes.some(type => type.startsWith('video/'));
      const hasAudio = mediaType.acceptedFileTypes.some(type => type.startsWith('audio/'));
      const hasDocuments = mediaType.acceptedFileTypes.some(type => 
        type.includes('pdf') || type.includes('doc') || type.includes('text/')
      );
      
      return (
        <Box sx={{ display: 'flex', ml: 'auto', gap: 0.5 }}>
          {hasImages && <FaImage size={12} style={{ color: '#4dabf5' }} />}
          {hasVideos && <FaVideo size={12} style={{ color: '#f57c00' }} />}
          {hasAudio && <FaFileAudio size={12} style={{ color: '#7e57c2' }} />}
          {hasDocuments && <FaFileWord size={12} style={{ color: '#2196f3' }} />}
    </Box>
      );
    };

    return (
      <Box sx={{ mb: 3 }}>
        <FormControl fullWidth>
          <InputLabel id="media-type-label">Media Type</InputLabel>
          <Select
            labelId="media-type-label"
            id="media-type-select"
            value={selectedMediaType}
            onChange={handleChange}
            label="Media Type"
          >
            {mediaTypes.map((type) => (
              <MenuItem 
                key={type._id} 
                value={type._id}
                sx={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  py: 1
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  {type.name}
                  {type.acceptedFileTypes && type.acceptedFileTypes.length > 0 && (
                    <Typography variant="caption" sx={{ ml: 1, color: 'text.secondary', fontSize: '0.7rem' }}>
                      ({type.acceptedFileTypes.length} file types)
                    </Typography>
                  )}
                </Box>
                {getFileTypeIcons(type)}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        
        {selectedMediaType && (
          <Box sx={{ mt: 1, p: 1, bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
            <Typography variant="body2" fontWeight="bold">
              Accepted File Types:
            </Typography>
            <Typography variant="body2">
              {getAcceptedFileTypesSummary()}
            </Typography>
          </Box>
        )}
      </Box>
    );
  };

  const renderCompletionStep = () => {
    if (!uploadComplete) {
      return renderUploadStatus();
    }

    return (
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
        {file && (
          <Box
            sx={{
              mb: 4,
              width: "100%",
              maxWidth: "400px",
              display: "flex",
              justifyContent: "center",
            }}
          >
            {file.type.startsWith('video/') && videoThumbnail ? (
              <img
                src={videoThumbnail}
                alt="Video thumbnail"
                style={{
                  width: "100%",
                  maxHeight: "250px",
                  objectFit: "contain",
                  borderRadius: "8px",
                  boxShadow: "0 4px 8px rgba(0,0,0,0.1)",
                }}
              />
            ) : file.type.startsWith('image/') && filePreview ? (
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
            ) : null}
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
                {renderMediaTypeSelector()}
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
                {renderDropzone()}
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
                {renderCompletionStep()}
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
