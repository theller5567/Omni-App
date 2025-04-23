import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  Box,
  Button,
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
import { toast } from "react-toastify";
import { initializeMediaTypes } from "../../store/slices/mediaTypeSlice";
import type { MediaType } from "../../store/slices/mediaTypeSlice";
import { motion, AnimatePresence } from "framer-motion";
import { fetchTagCategories } from "../../store/slices/tagCategorySlice";

// Import our utilities
import {
  normalizeTag,
  findMediaType,
  uploadMedia,
  prepareMetadataForUpload,
} from './utils';

// Import component types and subcomponents
import { MediaTypeUploaderProps, MetadataState } from "./types";
import UploadThumbnailSelector from '../VideoThumbnailSelector/UploadThumbnailSelector';
import MetadataForm from "./components/MetadataForm";

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
  const tagCategories = useSelector(
    (state: RootState) => state.tagCategories.tagCategories
  );
  const navigate = useNavigate();

  useEffect(() => {
    if (mediaTypes.length === 0) {
      dispatch(initializeMediaTypes());
    }
  }, [dispatch, mediaTypes.length]);

  // All state hooks must be declared at the top level
  const [step, setStep] = useState(1);
  const [file, setFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [selectedMediaType, setSelectedMediaType] = useState("");
  const [metadata, setMetadata] = useState<MetadataState>({
    fileName: "",
    tags: [],
    tagsInput: "",
    visibility: "public",
    altText: "",
    description: "",
    recordedDate: new Date().toISOString(),
    uploadedBy: user.currentUser._id,
    modifiedBy: user.currentUser._id,
    mediaTypeId: "",
    mediaTypeName: "",
    title: ""  // Initialize title explicitly
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
  const [currentTab, setCurrentTab] = useState(0);
  const [preventStepReset, setPreventStepReset] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [showTagFilter, setShowTagFilter] = useState(false);

  // All refs must also be declared at the top level
  const tagCategoriesFetchedRef = useRef(false);
  const uploaderStateRef = useRef({
    completionPending: false,
    isClosing: false,
    uploadedFileData: null as BaseMediaFile | null
  });

  // Add effect to fetch tag categories when component opens - with debounce
  useEffect(() => {
    // Only fetch tag categories once per component lifecycle
    if (open && tagCategories.length === 0 && !tagCategoriesFetchedRef.current) {
      console.log('Fetching tag categories on first open');
      tagCategoriesFetchedRef.current = true;
      dispatch(fetchTagCategories());
    }
  }, [dispatch, open, tagCategories.length]);

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

  // Modify the media type selection to show accepted file types and apply default tags
  const handleChange = (event: SelectChangeEvent) => {
    const newMediaTypeId = event.target.value;
    setSelectedMediaType(newMediaTypeId);
    
    // Find the media type object for applying default tags
    const selectedType = mediaTypes.find(type => type._id === newMediaTypeId);
    
    // Update metadata with media type ID and name
    handleMetadataChange("mediaTypeId", newMediaTypeId);
    if (selectedType) {
      handleMetadataChange("mediaTypeName", selectedType.name);
    }
    
    // Apply default tags from the selected media type
    if (selectedType && selectedType.defaultTags && Array.isArray(selectedType.defaultTags) && selectedType.defaultTags.length > 0) {
      console.log('Applying default tags:', selectedType.defaultTags);
      
      // Validate default tags - ensure they are all strings and filter out any invalid values
      const validDefaultTags = selectedType.defaultTags
        .filter(tag => typeof tag === 'string' && tag.trim() !== '')
        .map(tag => tag.trim());
      
      if (validDefaultTags.length > 0) {
      // Get existing tags and normalize them for comparison
      const existingTags = metadata.tags || [];
        const normalizedExistingTags = existingTags
          .filter(tag => typeof tag === 'string')
          .map(tag => normalizeTag(tag));
      
      // Only add default tags that don't already exist (case-insensitive)
      const newTags = [...existingTags];
      
        validDefaultTags.forEach(defaultTag => {
        const normalizedDefaultTag = normalizeTag(defaultTag);
          if (normalizedDefaultTag && !normalizedExistingTags.includes(normalizedDefaultTag)) {
          newTags.push(defaultTag);
        }
      });
      
      handleMetadataChange("tags", newTags);
      }
    }
    
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

  // Store upload completion status in a ref to prevent multiple callback invocations
  const uploadCompletedRef = useRef(false);
  // Add a flag to strictly lock step 4 after success
  const stayOnStep4Ref = useRef(false);

  // Make sure the useEffect doesn't conflict - Prevent step change after upload completion
  useEffect(() => {
    if (uploadComplete && preventStepReset && !stayOnStep4Ref.current) {
      console.log('Setting hard lock to stay on step 4');
      stayOnStep4Ref.current = true;
      
      // Force step to remain at 4
      setStep(4);
    }
  }, [uploadComplete, preventStepReset]);

  // Override any attempts to change step if we're locked to step 4
  useEffect(() => {
    if (stayOnStep4Ref.current && step !== 4) {
      console.log('Forcing step back to 4 due to lock');
      setStep(4);
    }
  }, [step]);

  // Add this useEffect to handle onUploadComplete after all other useEffects - with single callback guaranteed
  useEffect(() => {
    // Only call onUploadComplete if upload is complete and we have slug (indicating successful upload)
    // Also check if we haven't already processed this completion
    if (uploadComplete && slug && !uploaderStateRef.current.isClosing && !uploadCompletedRef.current) {
      console.log('Upload complete, preparing callback data');
      
      // Mark as completed to prevent duplicate callbacks
      uploadCompletedRef.current = true;
      // Lock to step 4
      stayOnStep4Ref.current = true;
      setPreventStepReset(true);
      
      // Create a BaseMediaFile object from the current state
      const uploadedFile: BaseMediaFile = {
        _id: slug, // Using slug as ID since we don't have the actual ID
        id: slug,
        location: '', // We don't have this info
        slug: slug,
        title: metadata.fileName || file?.name || '',
        fileSize: file?.size || 0,
        fileExtension: file?.name ? file.name.split('.').pop() || '' : '',
        modifiedDate: new Date().toISOString(),
        metadata: {
          ...metadata,
          v_thumbnail: videoThumbnail,
          v_thumbnailTimestamp: videoThumbnailTimestamp
        },
        mediaType: selectedMediaType
      };
      
      // Store in ref to avoid duplicate calls
      uploaderStateRef.current.uploadedFileData = uploadedFile;
      
      // Force step to remain at 4
      setStep(4);
      
      // Call the callback once with a small delay to avoid React state update issues
      const timer = setTimeout(() => {
        if (!uploaderStateRef.current.isClosing) {
          console.log('Calling onUploadComplete with data, slug:', slug);
          onUploadComplete(uploadedFile);
        }
      }, 100);
      
      return () => clearTimeout(timer);
    }
  }, [uploadComplete, slug]);  // Reduced dependency array to prevent multiple triggers

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
      // Split by comma, normalize each tag, and filter out empty strings
      const newTags = metadata.tagsInput
        .split(",")
        .map((tag) => normalizeTag(tag))
        .filter((tag) => typeof tag === 'string' && tag.trim() !== "");
      
      // Remove duplicates after normalization
      const uniqueTags = Array.from(new Set(newTags));
      
      // Update the tags array with valid strings only
      handleMetadataChange("tags", uniqueTags);
      // Clear the input field
      handleMetadataChange("tagsInput", "");
    }
  };

  const handleTagsKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      event.preventDefault(); // Prevent form submission
      handleTagsBlur();
    }
  };

  const handleTagCategoryChange = (event: SelectChangeEvent) => {
    const categoryId = event.target.value;
    handleMetadataChange("selectedTagCategoryId", categoryId);
  };

  const getAvailableTags = (): string[] => {
    // First, get all tags based on category selection
    let allTags: string[];
    if (!metadata.selectedTagCategoryId) {
      // If no category selected, return all tags from all categories
      allTags = tagCategories.flatMap(category => 
        category.tags?.map(tag => tag.name) || []
      );
    } else {
      // Return tags only from selected category
      const selectedCategory = tagCategories.find(cat => cat._id === metadata.selectedTagCategoryId);
      allTags = selectedCategory?.tags?.map(tag => tag.name) || [];
    }
    
    // Then filter by search query if one exists
    if (metadata.tagSearchQuery) {
      const searchLower = metadata.tagSearchQuery.toLowerCase();
      return allTags.filter(tag => tag.toLowerCase().includes(searchLower));
    }
    
    return allTags;
  };

  // Add function to handle tag search
  const handleTagSearch = (event: React.ChangeEvent<HTMLInputElement>) => {
    handleMetadataChange("tagSearchQuery", event.target.value);
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
    if (!file || !selectedMediaType) {
      console.error('File or media type not selected');
      setUploadError('File or media type not selected');
      setIsProcessing(false);
      return;
    }
    
    try {
      // Find the matching media type
      const mediaType = findMediaType(mediaTypes, selectedMediaType);
      
      if (!mediaType) {
        setUploadError('Selected media type not found');
        setIsProcessing(false);
        return;
      }
      
      // Prepare metadata
      const preparedMetadata = prepareMetadataForUpload(metadata, user.currentUser._id);
      preparedMetadata.mediaTypeId = mediaType._id;
      preparedMetadata.mediaTypeName = mediaType.name;
      
      // Add default tags from media type if provided
      if (mediaType.defaultTags && mediaType.defaultTags.length > 0) {
        console.log('Adding default tags from media type:', mediaType.defaultTags);
        // Ensure preparedMetadata.tags is an array before spreading
        const currentTags = Array.isArray(preparedMetadata.tags) ? preparedMetadata.tags : [];
        // Filter out duplicates
        const uniqueTags = [...new Set([
          ...currentTags,
          ...mediaType.defaultTags
        ])];
        preparedMetadata.tags = uniqueTags;
      }
      
      // Set the upload to complete in our reference to avoid race conditions
      uploadCompletedRef.current = true;
      
      // Upload the file
      const uploadedFile = await uploadMedia({
        file,
        metadata: preparedMetadata,
        videoThumbnailTimestamp: videoThumbnailTimestamp,
        onProgress: (progress) => {
          setUploadProgress(progress);
        },
        onError: (error) => {
          console.error('Upload error:', error);
          setUploadError(error.message || 'File upload failed');
          setIsProcessing(false);
        }
      });
      
      console.log('Upload complete:', uploadedFile);
      
      // Store the uploaded file data in our ref
      uploaderStateRef.current.uploadedFileData = uploadedFile;
      
      // Set upload complete state
      setUploadComplete(true);
      setSlug(uploadedFile.slug || '');
      setIsProcessing(false);
      
      // Call the onUploadComplete callback
      onUploadComplete(uploadedFile);
      
      // Set completion states
      uploaderStateRef.current.completionPending = false;
      stayOnStep4Ref.current = true;
    } catch (error: any) {
      console.error('Error during upload:', error);
      setUploadError(error.message || 'File upload failed');
      setIsProcessing(false);
      
      // Make sure we don't close prematurely
      uploadCompletedRef.current = false;
      uploaderStateRef.current.completionPending = false;
    }
  };

  const handleClose = () => {
    console.log('handleClose called - explicit close requested');
    
    // Mark as closing to prevent callbacks from firing
    uploaderStateRef.current.isClosing = true;
    
    // Reset all completion tracking
    uploadCompletedRef.current = false;
    stayOnStep4Ref.current = false;
    
    // Only reset states if explicitly closed by user
    setPreventStepReset(false);
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
      tagsInput: "",
      visibility: "public",
      altText: "",
      description: "",
      recordedDate: new Date().toISOString(),
      uploadedBy: user.currentUser._id,
      modifiedBy: user.currentUser._id,
      mediaTypeId: "",
      mediaTypeName: "",
      title: ""  // Initialize title explicitly
    });
    
    // Close with a slight delay to ensure state updates complete
    return setTimeout(() => {
      onClose();
      
      // Reset closing state (even though component will unmount)
      uploaderStateRef.current.isClosing = false;
      tagCategoriesFetchedRef.current = false;
    }, 50);
  };

  const handleAddMore = () => {
    // Reset the completion flags
    setPreventStepReset(false);
    uploadCompletedRef.current = false;
    stayOnStep4Ref.current = false;
    
    // Prevent state reset while in the middle of a transition
    if (isProcessing) {
      console.log('Cannot add more while processing');
      return;
    }
    
    console.log('Resetting for new upload');
    setUploadProgress(0);
    setFilePreview(null);
    setFile(null);
    setSelectedMediaType("");
    setMetadata({
      fileName: "",
      tags: [],
      tagsInput: "",
      visibility: "public",
      altText: "",
      description: "",
      recordedDate: new Date().toISOString(),
      uploadedBy: user.currentUser._id,
      modifiedBy: user.currentUser._id,
      mediaTypeId: "",
      mediaTypeName: "",
      title: ""  // Initialize title explicitly
    });
    setFileSelected(false);
    setUploadComplete(false);
    setUploadError(null);
    setSlug(null);
    
    // Now it's safe to reset the step
    console.log('Resetting to step 1 for a new upload');
    setStep(1);
  };

  const handleNext = () => {
    const nextStep = step + 1;
    console.log(`Moving from step ${step} to step ${nextStep}`);
    
    // Apply default tags when moving from step 2 to step 3
    if (step === 2 && nextStep === 3) {
      const selectedType = mediaTypes.find(type => type._id === selectedMediaType);
      if (selectedType && Array.isArray(selectedType.defaultTags) && selectedType.defaultTags.length > 0) {
        console.log('Applying default tags:', selectedType.defaultTags);
        // Update metadata with default tags, preserving any existing tags
        setMetadata(prev => ({
          ...prev,
          tags: [...new Set([...prev.tags, ...selectedType.defaultTags as string[]])]
        }));
      }
    }
    
    if (nextStep === 4) {
      // Show processing state immediately when moving to upload step
      console.log('Initiating upload process in step 4');
      setIsProcessing(true);
      setUploadProgress(0);
      
      // Set the step first to ensure we're on step 4
      setStep(nextStep);
      
      // Then trigger upload
      setTimeout(() => {
        if (file) {
          console.log('Starting upload with file:', file.name);
          handleUpload(file);
        } else {
          console.error('No file available for upload');
          setIsProcessing(false);
        }
      }, 100);
    } else {
      // For other steps, just update the step
      setStep(nextStep);
    }
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

  // Add a function to validate if all required fields are filled
  const validateRequiredFields = () => {
    // If no media type is selected, validation fails
    if (!selectedMediaType) return false;
    
    // Find the selected media type to get its fields
    const selectedType = mediaTypes.find(type => type._id === selectedMediaType);
    if (!selectedType) return false;
    
    // Check if all required fields in metadata have values
    const requiredFields = [
      // Standard required fields
      ...(metadata.fileName.trim() === '' ? ['fileName'] : []),
      
      // Check media type specific required fields
      ...selectedType.fields
        .filter(field => field.required)
        .filter(field => {
          // For different field types, check if they have valid values
          if (field.type === 'MultiSelect') {
            return !metadata[field.name] || (Array.isArray(metadata[field.name]) && metadata[field.name].length === 0);
          }
          
          // For all other field types
          return metadata[field.name] === undefined || metadata[field.name] === "";
        })
        .map(field => field.name)
    ];
    
    // If any required fields are missing values, validation fails
    return requiredFields.length === 0;
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
    console.log('Rendering completion step, uploadComplete:', uploadComplete, 'isProcessing:', isProcessing);
    
    // If still processing, show the upload status
    if (isProcessing) {
      console.log('Showing upload progress/processing UI');
      return renderUploadStatus();
    }

    // If upload is not complete and not processing, there was an error
    if (!uploadComplete) {
      console.log('Showing upload failure UI');
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
          <Typography variant="h6" color="error" sx={{ mb: 3 }}>
            Upload Failed
          </Typography>
          {uploadError && (
            <Typography color="error" sx={{ mb: 3 }}>
              {uploadError}
            </Typography>
          )}
          <Button
            variant="contained"
            color="primary"
            onClick={() => setStep(3)} // Go back to metadata step
          >
            Try Again
          </Button>
        </Box>
      );
    }

    // Call onUploadComplete when rendering success UI if we have data
    if (uploaderStateRef.current.uploadedFileData && onUploadComplete) {
      // Use setTimeout to avoid triggering during render
      setTimeout(() => {
        if (uploaderStateRef.current.uploadedFileData) {
          onUploadComplete(uploaderStateRef.current.uploadedFileData);
        }
      }, 0);
    }

    // Success state
    console.log('Showing upload success UI, slug:', slug);
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
            disabled={!slug}
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

  const renderFields = () => {
    return (
      <MetadataForm
        mediaTypes={mediaTypes}
        selectedMediaType={selectedMediaType}
        file={file}
        metadata={metadata}
        handleMetadataChange={handleMetadataChange}
        tagCategories={tagCategories}
        showTagFilter={showTagFilter}
        setShowTagFilter={setShowTagFilter}
        getAvailableTags={getAvailableTags}
        handleTagsChange={handleTagsChange}
        handleTagsBlur={handleTagsBlur}
        handleTagsKeyDown={handleTagsKeyDown}
        handleTagCategoryChange={handleTagCategoryChange}
        handleTagSearch={handleTagSearch}
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
      />
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
          height: '92vh',
          maxHeight: '800px', // Increase maximum height
          width: '100%',
          margin: 1,
          display: 'flex',
          flexDirection: 'column',
        },
      }}
    >
      <DialogTitle sx={{ 
        borderBottom: '1px solid', 
        borderColor: 'divider',
        padding: '12px 24px'
      }}>
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
      <DialogContent sx={{ 
        p: 1.5, 
        flexGrow: 1, 
        display: 'flex', 
        flexDirection: 'column',
        overflow: 'hidden' // Important to prevent scrollbars in the dialog
      }}>
        <Box className="dialog-inner" sx={{ 
          display: 'flex', 
          flexDirection: 'column',
          flexGrow: 1,
          overflow: 'hidden' // Important to prevent scrollbars
        }}>
          <Stepper 
            activeStep={step - 1} 
            alternativeLabel 
            className="stepper" 
            sx={{ 
              mb: 0.5,
              borderBottom: '1px solid', 
              borderColor: 'divider' 
            }}
          >
            {steps.map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>
          <Box sx={{ 
            flexGrow: 1, 
            overflow: 'auto',
            display: 'flex',
            flexDirection: 'column',
            p: 1
          }}>
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
                <Typography variant="h6" sx={{ mb: 2 }}>
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
                <Typography variant="h6" sx={{ mb: 2 }}>
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
                  style={{ 
                    width: "100%", 
                    height: "100%", 
                    display: "flex", 
                    flexDirection: "column",
                    overflow: "hidden"
                  }}
                >
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
        </Box>
      </DialogContent>
      <DialogActions sx={{ 
        padding: 2, 
        borderTop: '1px solid', 
        borderColor: 'divider'
      }}>
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
              (step === 2 && !fileSelected) ||
              (step === 3 && !validateRequiredFields())
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
