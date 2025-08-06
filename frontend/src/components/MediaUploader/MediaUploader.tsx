import React, { useState, useEffect, useCallback, useRef, useMemo } from "react";
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
import { toast } from "react-toastify";
// Import TanStack Query hooks and types
import { useMediaTypes, useTagCategories, useUserProfile, MediaType as HookMediaType } from "../../hooks/query-hooks";
// Keep the import for Field and specific MediaType shape from Redux
// import type { MediaType as ReduxMediaType } from "../../store/slices/mediaTypeSlice"; // Removed
import { motion, AnimatePresence } from "framer-motion";

// Import our utilities
import {
  normalizeTag,
  uploadMedia,
  prepareMetadataForUpload,
} from './utils';

// Import component types and subcomponents
import { MediaTypeUploaderProps, MetadataState } from "./types";
import UploadThumbnailSelector from '../VideoThumbnailSelector/UploadThumbnailSelector';
import MetadataForm from "./components/MetadataForm";

// Define an internal MediaType interface based on the old ReduxMediaType structure
interface InternalMediaType {
  _id: string;
  name: string;
  description?: string; // Make optional if not always present from API or used
  fields: any[]; // Define more specific field type if possible
  status: 'active' | 'deprecated' | 'archived';
  usageCount?: number;
  replacedBy?: string | null;
  isDeleting?: boolean;
  acceptedFileTypes: string[];
  createdAt?: string;
  updatedAt?: string;
  baseType: 'BaseImage' | 'BaseVideo' | 'BaseAudio' | 'BaseDocument' | 'Media' | undefined;
  includeBaseFields: boolean;
  catColor: string;
  defaultTags: string[];
  settings: Record<string, any>; // Or a more specific settings type
}

// Helper to adapt MediaType from TanStack Query to the shape expected by the MediaUploader
const adaptMediaType = (mediaType: HookMediaType): InternalMediaType => {
  const validStatuses = ['active', 'deprecated', 'archived'];
  const newStatus = mediaType.status && validStatuses.includes(mediaType.status) 
    ? mediaType.status 
    : 'active';

  const validBaseTypes = ['BaseImage', 'BaseVideo', 'BaseAudio', 'BaseDocument', 'Media'];
  const newBaseType = mediaType.baseType && validBaseTypes.includes(mediaType.baseType) 
    ? mediaType.baseType 
    : undefined;

  return {
    _id: mediaType._id,
    name: mediaType.name,
    description: mediaType.description || '',
    fields: mediaType.fields || [],
    status: newStatus as 'active' | 'deprecated' | 'archived',
    usageCount: mediaType.usageCount || 0,
    replacedBy: mediaType.replacedBy || null,
    isDeleting: mediaType.isDeleting || false,
    acceptedFileTypes: mediaType.acceptedFileTypes || [],
    createdAt: mediaType.createdAt as string,
    updatedAt: mediaType.updatedAt as string,
    baseType: newBaseType as 'BaseImage' | 'BaseVideo' | 'BaseAudio' | 'BaseDocument' | 'Media' | undefined,
    includeBaseFields: mediaType.includeBaseFields || true,
    catColor: mediaType.catColor || '#2196f3',
    defaultTags: mediaType.defaultTags || [],
    settings: mediaType.settings || {}
  };
};

// Adapter for findMediaType to use InternalMediaType
const findInternalMediaType = (
  mediaTypes: InternalMediaType[], // Use InternalMediaType
  mediaTypeId: string | null
): InternalMediaType | null => { // Return InternalMediaType
  if (!mediaTypeId || !mediaTypes.length) return null;
  
  // First try to find by ID
  let matchingType = mediaTypes.find(type => type._id === mediaTypeId);
  
  // If not found, try by name (for backward compatibility)
  if (!matchingType) {
    matchingType = mediaTypes.find(type => type.name === mediaTypeId);
  }
  
  return matchingType || null;
};

const MediaUploader: React.FC<MediaTypeUploaderProps> = ({
  open,
  onClose,
  onUploadComplete,
}) => {
  const navigate = useNavigate();
  const { data: userProfile } = useUserProfile();
  
  // Replace Redux selector with TanStack Query hook
  const { data: mediaTypesData = [], isLoading: isLoadingMediaTypes } = useMediaTypes();
  
  // Adapt the TanStack MediaType to the InternalMediaType shape
  const mediaTypes: InternalMediaType[] = useMemo(() => {
    const adaptedTypes = mediaTypesData.map(adaptMediaType);
    
    // Add debugging output in development mode
    if (process.env.NODE_ENV === 'development') {
      console.log('MediaUploader - Media types from TanStack Query:', {
        raw: mediaTypesData.length,
        adapted: adaptedTypes.length,
        isLoading: isLoadingMediaTypes,
        sample: adaptedTypes.length > 0 ? adaptedTypes[0] : null
      });
    }
    
    return adaptedTypes;
  }, [mediaTypesData, isLoadingMediaTypes]);
  
  // Use TanStack Query for tag categories instead of Redux
  const { data: tagCategories = [], refetch: refetchTagCategories } = useTagCategories(userProfile);
  
  // =============== CONSTANTS ===============
  const maxFileSizeMB = 200;
  
  // =============== STATE MANAGEMENT ===============
  // Step management
  const [step, setStep] = useState(1);
  const [preventStepReset, setPreventStepReset] = useState(false);
  
  // Media type selection state
  const [selectedMediaType, setSelectedMediaType] = useState("");
  const [currentTab, setCurrentTab] = useState(0);
  
  // File handling state
  const [file, setFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [fileSelected, setFileSelected] = useState(false);
  const [fileLoadingProgress, setFileLoadingProgress] = useState(0);
  const [isPreviewReady, setIsPreviewReady] = useState(false);
  
  // Upload state
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadComplete, setUploadComplete] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [slug, setSlug] = useState<string | null>(null);
  
  // Video thumbnail state
  const [videoThumbnail, setVideoThumbnail] = useState<string | undefined>();
  const [videoThumbnailTimestamp, setVideoThumbnailTimestamp] = useState('00:00:01');
  
  // Metadata state
  const [metadata, setMetadata] = useState<MetadataState>({
    fileName: "",
    tags: [],
    tagsInput: "",
    visibility: "public",
    altText: "",
    description: "",
    recordedDate: new Date().toISOString(),
    uploadedBy: userProfile?._id || '',
    modifiedBy: userProfile?._id || '',
    mediaTypeId: "",
    mediaTypeName: "",
    title: "",
    relatedMedia: []
  });
  const [showTagFilter, setShowTagFilter] = useState(false);

  // =============== REFS ===============
  // Refs to handle state between renders
  const tagCategoriesFetchedRef = useRef(false);
  const uploaderStateRef = useRef({
    completionPending: false,
    isClosing: false,
    uploadedFileData: null as BaseMediaFile | null
  });
  // Store upload completion status in a ref to prevent multiple callback invocations
  const uploadCompletedRef = useRef(false);
  // Flag to strictly lock step 4 after success
  const stayOnStep4Ref = useRef(false);

  // =============== UTILITY FUNCTIONS ===============
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

  // Check if a file type is valid for the selected media type
  const isFileTypeValid = (file: File): boolean => {
    if (!selectedMediaType) return false;
    
    const mediaType = mediaTypes.find((type: InternalMediaType) => type._id === selectedMediaType);
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

  // Handle metadata field changes
  const handleMetadataChange = (field: string, value: any) => {
    // For non-required fields, if the value is an empty string, 
    // set it to undefined so it won't be sent to the database
    const finalValue = value === '' ? undefined : value;
    
    setMetadata((prev) => ({
      ...prev,
      [field]: finalValue,
    }));
  };

  // Handle image preview loading
  const handleImagePreviewLoad = (fileUrl: string) => {
    const img = new Image();
    img.onload = () => {
      setMetadata((prev) => ({
        ...prev,
        imageWidth: img.width,
        imageHeight: img.height,
      }));
      setFileLoadingProgress(100);
      setIsPreviewReady(true);
    };
    
    img.onerror = () => {
      console.error('Error loading image preview');
      setFileLoadingProgress(100);
      setIsPreviewReady(true);
    };
    
    img.src = fileUrl;
  };

  // =============== HOOKS ===============
  // Get accepted file types for react-dropzone
  const acceptedFileTypes = useMemo(() => {
    if (!selectedMediaType) {
      return undefined;
    }
    
    const mediaType = mediaTypes.find(type => type._id === selectedMediaType);
    if (!mediaType || !mediaType.acceptedFileTypes || mediaType.acceptedFileTypes.length === 0) {
      return undefined;
    }
    
    // Create an object with MIME types as keys for react-dropzone
    const acceptObject: Record<string, string[]> = {};
    
    mediaType.acceptedFileTypes.forEach((type: string) => {
      if (type.includes('/')) {
        const [category] = type.split('/');
        const key = `${category}/*`;
        
        if (!acceptObject[key]) {
          acceptObject[key] = [];
        }
      }
    });
    
    return acceptObject;
  }, [selectedMediaType, mediaTypes]);

  // Generate a human-readable summary of accepted file types
  const getAcceptedFileTypesSummary = () => {
    if (!selectedMediaType) {
      return "Please select a media type";
    }
    
    const mediaType = mediaTypes.find(type => type._id === selectedMediaType);
    if (!mediaType) {
      return "Invalid media type selected";
    }
    
    if (!mediaType.acceptedFileTypes || mediaType.acceptedFileTypes.length === 0) {
      return "All file types";
    }
    
    // Group by category (image, video, etc)
    const categories: Record<string, string[]> = {};
    
    mediaType.acceptedFileTypes.forEach(type => {
      if (type.includes('/*')) {
        // Handle wildcards like "image/*"
        const category = type.split('/')[0];
        categories[category] = ["all"];
      } else {
        // Handle specific types like "image/png"
        const [category, subtype] = type.split('/');
        
        if (!categories[category]) {
          categories[category] = [];
        }
        
        if (categories[category][0] !== "all") {
          categories[category].push(subtype);
        }
      }
    });
    
    // Convert to readable format
    const parts = Object.entries(categories).map(([category, subtypes]) => {
      if (subtypes.length === 0 || subtypes[0] === "all") {
        return `All ${category} files`;
      }
      
      // Limit the number of subtypes shown to 3
      const displayedSubtypes = subtypes.slice(0, 3);
      const remaining = subtypes.length - 3;
      
      const subtypeText = displayedSubtypes.map(subtype => `.${subtype}`).join(', ');
      
      if (remaining > 0) {
        return `${category.toUpperCase()}: ${subtypeText}, and ${remaining} more`;
      }
      
      return `${category.toUpperCase()}: ${subtypeText}`;
    });
    
    return parts.join(' • ');
  };

  // Handle file drop and selection
  const handleFileDrop = useCallback((acceptedFiles: File[], fileRejections: any[]) => {
    if (fileRejections.length > 0) {
      const rejection = fileRejections[0];
      const error = rejection.errors[0];
      
      if (error.code === 'file-too-large') {
        toast.error(`File is too large. Maximum size is ${maxFileSizeMB}MB.`);
      } else if (error.code === 'file-invalid-type') {
        const mediaType = mediaTypes.find(type => type._id === selectedMediaType);
        toast.error(`Invalid file type. This media type only accepts: ${mediaType?.acceptedFileTypes.join(', ')}`);
      } else {
        toast.error(`Error uploading file: ${error.message}`);
      }
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

      // Show progress indicator
      let progress = 0;
      const interval = setInterval(() => {
        progress += 5;
        setFileLoadingProgress(Math.min(progress, 90));
        if (progress >= 90) clearInterval(interval);
      }, 50);

      // Read the file for preview
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

        // Handle preview based on file type
        if (file.type.startsWith('image')) {
          handleImagePreviewLoad(fileUrl);
        } else {
          // Handle non-image files
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
      
      // Set the filename in metadata
      handleMetadataChange("fileName", file.name || "");
    }
  }, [selectedMediaType, mediaTypes, maxFileSizeMB]);

  // Configure dropzone - must be after handleFileDrop and acceptedFileTypes are defined
  const {
    getRootProps,
    getInputProps,
    isDragActive,
    isDragReject,
    isDragAccept,
  } = useDropzone({
    onDrop: handleFileDrop,
    accept: acceptedFileTypes,
    maxSize: maxFileSizeMB * 1024 * 1024,
    multiple: false,
    disabled: !selectedMediaType, // Disable if no media type selected
  });

  // =============== EFFECTS ===============
  // Effect to fetch tag categories when component opens
  useEffect(() => {
    if (open && tagCategories.length === 0 && !tagCategoriesFetchedRef.current) {
      console.log('Fetching tag categories on first open');
      tagCategoriesFetchedRef.current = true;
      refetchTagCategories();
    }
  }, [open, tagCategories.length, refetchTagCategories]);

  // Set user ID in metadata when user changes
  useEffect(() => {
    if (userProfile) {
      setMetadata((prevMetadata) => ({
        ...prevMetadata,
        uploadedBy: userProfile._id,
        modifiedBy: userProfile._id,
      }));
    }
  }, [userProfile]);

  // Reset upload progress when changing to step 2
  useEffect(() => {
    if (step === 2) {
      setUploadProgress(0);
      setUploadComplete(false);
    }
  }, [step]);

  // Prevent step change after upload completion
  useEffect(() => {
    if (uploadComplete && preventStepReset && !stayOnStep4Ref.current) {
      stayOnStep4Ref.current = true;
      // Force step to remain at 4
      setStep(4);
    }
  }, [uploadComplete, preventStepReset]);

  // Override any attempts to change step if we're locked to step 4
  useEffect(() => {
    if (stayOnStep4Ref.current && step !== 4) {
      setStep(4);
    }
  }, [step]);

  // Handle onUploadComplete after all other useEffects
  useEffect(() => {
    // Only call onUploadComplete if upload is complete and we have slug
    if (uploadComplete && slug && !uploaderStateRef.current.isClosing && !uploadCompletedRef.current) {
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
  }, [uploadComplete, slug, file, metadata, onUploadComplete, selectedMediaType, videoThumbnail, videoThumbnailTimestamp]);

  // =============== HANDLERS AND OTHER FUNCTIONS ===============
  // Update the renderDropzone to use the hook values defined above
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

  // Handle video thumbnail selection
  const handleThumbnailSelect = (timestamp: string) => {
    if (!file) return;
    
    const video = document.createElement('video');
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    video.onloadeddata = () => {
      // Convert timestamp format (HH:MM:SS) to seconds
      const [hours, minutes, seconds] = timestamp.split(':').map(Number);
      const timeInSeconds = (hours * 3600) + (minutes * 60) + seconds;
      video.currentTime = timeInSeconds;
    };
    
    video.onseeked = () => {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      ctx?.drawImage(video, 0, 0, canvas.width, canvas.height);
      const thumbnail = canvas.toDataURL('image/jpeg', 0.7);
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

  // Handle media type selection change
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
      applyDefaultTags(selectedType.defaultTags);
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

  // Apply default tags from media type
  const applyDefaultTags = (defaultTags: string[]) => {
    // Validate default tags - ensure they are all strings and filter out any invalid values
    const validDefaultTags = defaultTags
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
  };

  // Handle tags input change
  const handleTagsChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    handleMetadataChange("tagsInput", event.target.value);
  };

  // Handle tags input blur
  const handleTagsBlur = () => {
    const tagsInput = metadata.tagsInput;
    if (tagsInput && tagsInput.trim() !== "") {
      // Split by comma and create an array of tags
      const newTags = tagsInput
        .split(",")
        .map((tag) => tag.trim())
        .filter((tag) => tag !== "");

      // Add these tags to the existing tags
      const existingTags = metadata.tags || [];
      
      // Normalize tags to check for duplicates
      const normalizedExistingTags = existingTags.map(tag => 
        normalizeTag(tag)
      );
      
      // Only add tags that don't already exist
      const uniqueNewTags = newTags.filter(tag => {
        const normalizedTag = normalizeTag(tag);
        return !normalizedExistingTags.includes(normalizedTag);
      });
      
      handleMetadataChange("tags", [...existingTags, ...uniqueNewTags]);
      handleMetadataChange("tagsInput", "");
    }
  };

  // Handle tag input key down events (Enter to add tags)
  const handleTagsKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      event.preventDefault();
      handleTagsBlur();
    }
  };

  // Handle tag category selection
  const handleTagCategoryChange = (event: SelectChangeEvent) => {
    setShowTagFilter(!!event.target.value);
  };

  // Filter and return available tags based on selected category
  const getAvailableTags = (): string[] => {
    const currentTagInput = metadata.tagsInput || '';
    const searchLower = currentTagInput.toLowerCase().trim();
    
    // Default to returning empty array if no categories loaded
    if (tagCategories.length === 0) {
      console.log('No tag categories available');
      return [];
    }
    
    // Map of category names to tags
    const availableTags: string[] = [];
    
    // Combine all tags from all categories
    tagCategories.forEach((category: any) => {
      if (category.tags && Array.isArray(category.tags)) {
        category.tags.forEach((tag: any) => {
          if (typeof tag === 'string' && !availableTags.includes(tag)) {
            // Filter tags by the search term if provided
            if (!searchLower || tag.toLowerCase().includes(searchLower)) {
              availableTags.push(tag);
            }
          }
        });
      }
    });
    
    return availableTags;
  };

  // Handle tag search input
  const handleTagSearch = (event: React.ChangeEvent<HTMLInputElement>) => {
    handleMetadataChange("tagsInput", event.target.value);
  };

  // Handle file upload process
  const handleUpload = async (file: File) => {
    if (!file || !selectedMediaType) {
      console.error('File or media type not selected');
      setUploadError('File or media type not selected');
      setIsProcessing(false);
      return;
    }
    
    try {
      // Find the matching media type
      const mediaType = findInternalMediaType(mediaTypes, selectedMediaType);
      
      if (!mediaType) {
        setUploadError('Selected media type not found');
        setIsProcessing(false);
        return;
      }
      
      // Prepare metadata
      const preparedMetadata = prepareMetadataForUpload(metadata, userProfile?._id || '');
      preparedMetadata.mediaTypeId = mediaType._id;
      preparedMetadata.mediaTypeName = mediaType.name;
      
      // Add default tags from media type if provided
      if (mediaType.defaultTags && mediaType.defaultTags.length > 0) {
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
        videoThumbnail: videoThumbnail,
        onProgress: (progress) => {
          setUploadProgress(progress);
        },
        onError: (error) => {
          console.error('Upload error:', error);
          setUploadError(error.message || 'File upload failed');
          setIsProcessing(false);
        }
      });
      
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

  // Handle dialog close
  const handleClose = () => {
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
      uploadedBy: userProfile?._id || '',
      modifiedBy: userProfile?._id || '',
      mediaTypeId: "",
      mediaTypeName: "",
      title: "",
      relatedMedia: []
    });
    
    // Close with a slight delay to ensure state updates complete
    return setTimeout(() => {
      onClose();
      
      // Reset closing state (even though component will unmount)
      uploaderStateRef.current.isClosing = false;
      tagCategoriesFetchedRef.current = false;
    }, 50);
  };

  // Handle "Add More" after successful upload
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
    
    // Reset all state to initial values
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
      uploadedBy: userProfile?._id || '',
      modifiedBy: userProfile?._id || '',
      mediaTypeId: "",
      mediaTypeName: "",
      title: "",
      relatedMedia: []
    });
    setFileSelected(false);
    setUploadComplete(false);
    setUploadError(null);
    setSlug(null);
    
    // Now it's safe to reset the step
    setStep(1);
  };

  // Handle next step button
  const handleNext = () => {
    const nextStep = step + 1;
    // Apply default tags when moving from step 2 to step 3
    if (step === 2 && nextStep === 3) {
      const selectedType = mediaTypes.find(type => type._id === selectedMediaType);
      if (selectedType && Array.isArray(selectedType.defaultTags) && selectedType.defaultTags.length > 0) {
        // Update metadata with default tags, preserving any existing tags
        setMetadata(prev => ({
          ...prev,
          tags: [...new Set([...prev.tags, ...selectedType.defaultTags as string[]])]
        }));
      }
    }
    
    if (nextStep === 4) {
      // Show processing state immediately when moving to upload step
      setIsProcessing(true);
      setUploadProgress(0);
      
      // Set the step first to ensure we're on step 4
      setStep(nextStep);
      
      // Then trigger upload
      setTimeout(() => {
        if (file) {
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

  // Handle back button
  const handleBack = () => setStep((prev) => (prev === 1 ? 1 : prev - 1));

  // Handle View Media button after successful upload
  const handleViewMedia = () => {
    if (!slug) {
      console.error('Cannot view media: slug is not set');
      return;
    }
    
    handleClose();
    // Then navigate to the media detail page
    setTimeout(() => {
      navigate(`/media/slug/${slug}`);
    }, 100);
  };

  // Validate required fields before proceeding
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

  // Early return if dialog is not open
  if (!open) return null;

  // =============== RENDER FUNCTIONS ===============
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
        <Box sx={{ width: "100%", maxWidth: "400px", mb: 3, position: "relative" }}>
          <LinearProgress
            variant={isProcessing ? "indeterminate" : "determinate"}
            value={uploadProgress}
            sx={{ height: 10, borderRadius: 5 }}
          />
          <Typography
            variant="body2"
            color="textSecondary"
            align="center"
            sx={{ 
              mt: 2,
              fontWeight: "bold", 
              position: "absolute", 
              top: -5, 
              left: "50%", 
              transform: "translateX(-50%)",
              backgroundColor: "rgba(255,255,255,0.7)",
              px: 1,
              borderRadius: 1,
              fontSize: "0.75rem",
              display: isProcessing ? "none" : "block"
            }}
          >
            {uploadProgress}%
          </Typography>
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

  const renderCompletionStep = () => {
    // If still processing, show the upload status
    if (isProcessing) {
      return renderUploadStatus();
    }

    // If upload is not complete and not processing, there was an error
    if (!uploadComplete) {
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
    const uploadedFile = uploaderStateRef.current.uploadedFileData;
    let successMessage = "Your file has been successfully uploaded.";
    if (uploadedFile?.approvalStatus === 'pending') {
      successMessage = "Your file has been submitted for approval.";
    } else if (uploadedFile?.approvalStatus === 'approved') {
      successMessage = "Your file has been successfully uploaded and approved.";
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
          {successMessage}
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
    const currentMediaType = mediaTypes.find((type: InternalMediaType) => type._id === selectedMediaType);
    if (!currentMediaType) return null;

    const fieldsToRender = currentMediaType.fields?.filter((field: any) => field.name !== 'File Name');

    // Add title field if not present and base fields are included
    if (currentMediaType.includeBaseFields && !fieldsToRender?.find((field: any) => field.name === 'Title')) {
      fieldsToRender?.unshift({ name: 'Title', type: 'Text', required: true });
    }

    return (
      <MetadataForm
        mediaTypes={mediaTypes.map(mt => ({ ...mt, description: mt.description || '' }))}
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

  const renderMediaTypeSelector = () => {
    // Helper function to get icons for file types
    const getFileTypeIcons = (mediaType: InternalMediaType) => {
      const icons = [];
      if (mediaType.acceptedFileTypes?.some((type: string) => type.startsWith('image/'))) icons.push(<FaImage key="image" />);
      if (mediaType.acceptedFileTypes?.some((type: string) => type.startsWith('video/'))) icons.push(<FaVideo key="video" />);
      if (mediaType.acceptedFileTypes?.some((type: string) => type.startsWith('audio/'))) icons.push(<FaFileAudio key="audio" />);
      if (mediaType.acceptedFileTypes?.some((type: string) => type.startsWith('application/') || type.startsWith('text/'))) icons.push(<FaFileWord key="document" />);
      return icons.length > 0 ? icons : [<FaUpload key="default" />];
    };

    // Filter out archived media types
    const activeMediaTypes = mediaTypes.filter(type => type.status !== 'archived');

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
            disabled={isLoadingMediaTypes} // Disable while loading
          >
            {isLoadingMediaTypes ? (
              <MenuItem disabled>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <CircularProgress size={16} />
                  <Typography>Loading media types...</Typography>
                </Box>
              </MenuItem>
            ) : activeMediaTypes.length === 0 ? (
              <MenuItem disabled>
                <Typography>No media types available</Typography>
              </MenuItem>
            ) : (
              activeMediaTypes.map((type) => (
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
                    {type.status === 'deprecated' && (
                      <Typography 
                        variant="caption" 
                        sx={{ 
                          ml: 1, 
                          color: 'warning.main', 
                          fontSize: '0.7rem',
                          fontStyle: 'italic'
                        }}
                      >
                        (deprecated)
                      </Typography>
                    )}
                    {type.acceptedFileTypes && type.acceptedFileTypes.length > 0 && (
                      <Typography variant="caption" sx={{ ml: 1, color: 'text.secondary', fontSize: '0.7rem' }}>
                        ({type.acceptedFileTypes.length} file types)
                      </Typography>
                    )}
                  </Box>
                  {getFileTypeIcons(type)}
                </MenuItem>
              ))
            )}
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

  return (
    <Dialog
      open={open}
      onClose={(_, reason) => {
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
            zIndex: 5,
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
            {["Select Media Type", "Upload File", "Add Metadata", "Completion"].map((label) => (
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