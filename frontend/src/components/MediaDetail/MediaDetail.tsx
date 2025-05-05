import React, { useEffect, useState, lazy, Suspense, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { 
  Box, 
  Button, 
  CircularProgress, 
  Chip, 
  Typography,
  useMediaQuery,
  Theme,
  Tabs,
  Tab,
  Tooltip
} from "@mui/material";
import axios from "axios";
import { BaseMediaFile } from "../../interfaces/MediaFile";
import { MediaFile, MediaType } from "../../types/media";
import { motion } from 'framer-motion';
import { formatFileSize } from "../../utils/formatFileSize";
import "./mediaDetail.scss";
import { useSelector, useDispatch } from "react-redux";
import { RootState, AppDispatch } from "../../store/store";
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useUsername } from '../../hooks/useUsername';
import env from '../../config/env';
import { 
  FaFileAudio, 
  FaFileWord, 
  FaFileExcel, 
  FaFile, 
  FaDownload,
  FaFilePdf
} from 'react-icons/fa';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import EditIcon from '@mui/icons-material/Edit';
import PhotoIcon from '@mui/icons-material/Photo';
import { updateMedia } from '../../store/slices/mediaSlice';
import RelatedMediaItem from "./RelatedMediaItem";

// Lazy load subcomponents
const MediaInformation = lazy(() => import('./MediaInformation'));
const EditMediaDialog = lazy(() => import('./EditMediaDialog').then(module => ({ 
  default: module.default || module.EditMediaDialog 
})));
const ThumbnailUpdateDialog = lazy(() => import('./ThumbnailUpdateDialog'));

// Loading fallback component
const LoadingFallback = () => (
  <Box display="flex" justifyContent="center" alignItems="center" p={2}>
    <CircularProgress size={24} />
  </Box>
);

// Add a helper function to safely get metadata fields from either root or metadata object
const getMetadataField = (mediaFile: any, fieldName: string, defaultValue: any = undefined) => {
  if (!mediaFile) return defaultValue;
  
  // First check in metadata object
  if (mediaFile.metadata && mediaFile.metadata[fieldName] !== undefined) {
    return mediaFile.metadata[fieldName];
  }
  
  // Then check in root object
  if (mediaFile[fieldName] !== undefined) {
    return mediaFile[fieldName];
  }
  
  // Return default if not found anywhere
  return defaultValue;
};

// Add this type definition near the top of the file, after your imports
interface MediaMetadata {
  fileName?: string;
  altText?: string;
  description?: string;
  visibility?: string;
  tags?: string[];
  v_thumbnail?: string;
  v_thumbnailTimestamp?: string;
  [key: string]: any; // Allow for additional properties
}

// Extract subcomponents for better organization and code splitting

interface MediaDetailTagsProps {
  tags?: string[];
  isMobile?: boolean;
}

export const MediaDetailTags: React.FC<MediaDetailTagsProps> = ({ tags, isMobile }) => {
  if (!tags || tags.length === 0) return null;
  
  return (
    <Box className="media-tags">
      {tags?.map((tag, index) => (
        <Chip 
          key={index} 
          label={tag} 
          size={isMobile ? "small" : "medium"} 
          sx={{ backgroundColor: 'var(--accent-color)', color: 'var(--color-text-invert)', margin: '0.25rem', fontSize: isMobile ? '0.75rem' : '0.875rem' }}
        />
      ))}
    </Box>
  );
};

interface MediaDetailPreviewProps {
  mediaFile: BaseMediaFile;
  onEdit?: () => void;
  onDownload: () => void;
  isEditingEnabled: boolean;
  onThumbnailUpdate?: () => void;
}

export const MediaDetailPreview: React.FC<MediaDetailPreviewProps> = ({ 
  mediaFile, 
  onEdit, 
  onDownload, 
  isEditingEnabled,
  onThumbnailUpdate
}) => {
  // Get uploadedBy from either direct property or metadata
  const isMobile = useMediaQuery((theme: Theme) => theme.breakpoints.down('sm'));
  
  // Add state for the active tab
  const [activeTab, setActiveTab] = useState(0);
  
  // Check if there are related media files
  const hasRelatedMedia = mediaFile.metadata?.relatedMedia && 
    (Array.isArray(mediaFile.metadata.relatedMedia) ? 
      mediaFile.metadata.relatedMedia.length > 0 : 
      mediaFile.metadata.relatedMedia.mediaId);
  
  // Check if this is a video file
  const isVideo = mediaFile.fileExtension && 
    ['mp4', 'webm', 'ogg', 'mov'].includes(mediaFile.fileExtension.toLowerCase());
  
  // Handler for tab changes
  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };
  
  // Component to render media content based on file type
  const RenderMediaContent = React.useCallback(() => {
    if (!mediaFile) return null;
    
    if (mediaFile.fileExtension &&
      ["jpg", "jpeg", "png", "gif", "webp", "svg", "bmp"].includes(
        mediaFile.fileExtension.toLowerCase()
      )) {
      // Image preview
      return (
        <img
          src={mediaFile.location}
          alt={mediaFile.metadata?.altText || ""}
        />
      );
    } else if (mediaFile.fileExtension &&
      ["mp4", "webm", "ogg", "mov"].includes(
        mediaFile.fileExtension.toLowerCase()
      )) {
      // Video preview
      return (
        <Box
          sx={{
            width: "100%",
            height: "100%",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            background: "#000",
          }}
        >
          <video
            controls
            autoPlay={false}
            style={{
              width: "100%",
              maxHeight: isMobile ? "300px" : "600px",
            }}
            poster={mediaFile.metadata?.v_thumbnail || undefined}
          >
            <source
              src={mediaFile.location}
              type={`video/${
                mediaFile.fileExtension === "mov"
                  ? "quicktime"
                  : mediaFile.fileExtension.toLowerCase()
              }`}
            />
            Your browser does not support the video tag.
          </video>
        </Box>
      );
    } else if (mediaFile.fileExtension &&
      ["mp3", "wav", "ogg", "m4a"].includes(
        mediaFile.fileExtension.toLowerCase()
      )) {
      // Audio preview
      return (
        <Box
          sx={{
            p: 4,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 2,
          }}
        >
          <FaFileAudio size={isMobile ? 48 : 64} />
          <audio
            controls
            src={mediaFile.location}
            style={{ width: "100%" }}
          >
            Your browser does not support the audio element.
          </audio>
        </Box>
      );
    } else if (mediaFile.fileExtension &&
      ["pdf"].includes(mediaFile.fileExtension.toLowerCase())) {
      // PDF preview
      return (
        <Box
          sx={{
            width: "100%",
            height: "100%",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            p: 2,
            position: "relative", // Add for debugging overlay
          }}
        >
          {/* Primary method: Try using an iframe for preview */}
          <iframe
            src={`${mediaFile.location}#toolbar=1&navpanes=1&scrollbar=1`}
            style={{
              width: "100%",
              height: isMobile ? "400px" : "600px",
              border: "none",
              borderRadius: "4px",
              overflow: "hidden",
            }}
            title="PDF Preview"
            onError={(e) => {
              // Show alternative PDF viewer on error
              const iframe = e.target as HTMLIFrameElement;
              if (iframe && iframe.style) {
                iframe.style.display = 'none';
              }
              
              // Try to show the object tag fallback
              const objectFallback = document.querySelector('.pdf-object-fallback') as HTMLElement;
              if (objectFallback && objectFallback.style) {
                objectFallback.style.display = 'block';
                
                // If object also fails, show icon fallback
                setTimeout(() => {
                  const objectElement = objectFallback.querySelector('object');
                  if (objectElement && !objectElement.contentDocument) {
                    objectFallback.style.display = 'none';
                    const iconFallback = document.querySelector('.pdf-icon-fallback') as HTMLElement;
                    if (iconFallback && iconFallback.style) {
                      iconFallback.style.display = 'flex';
                    }
                  }
                }, 1000);
              }
            }}
          />
          
          {/* Object tag fallback - works in some browsers where iframe doesn't */}
          <Box 
            className="pdf-object-fallback"
            sx={{ 
              display: 'none',
              width: '100%',
              height: isMobile ? "400px" : "600px",
            }}
          >
            <object
              data={mediaFile.location}
              type="application/pdf"
              width="100%"
              height="100%"
              style={{
                border: "none",
                borderRadius: "4px",
              }}
            >
              <p>Your browser does not support PDF viewing.</p>
            </object>
          </Box>
          
          {/* Icon fallback as last resort */}
          <Box 
            className="pdf-icon-fallback"
            sx={{ 
              display: 'none',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              p: 3,
              gap: 2
            }}
          >
            <FaFilePdf size={isMobile ? 56 : 86} color="#ef4444" />
            <Typography variant={isMobile ? "body2" : "body1"} sx={{ mt: 2, textAlign: 'center' }}>
              PDF preview not available in this browser.
            </Typography>
            <Button
              variant="contained"
              color="primary"
              startIcon={<FaDownload />}
              onClick={onDownload}
              size={isMobile ? "small" : "medium"}
              sx={{ mt: 2 }}
            >
              Download PDF
            </Button>
          </Box>
        </Box>
      );
    } else if (mediaFile.fileExtension &&
      ["doc", "docx"].includes(mediaFile.fileExtension.toLowerCase())) {
      // Word document
      return (
        <Box
          sx={{
            p: 4,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 2,
          }}
        >
          <FaFileWord size={isMobile ? 48 : 64} />
          <Typography variant={isMobile ? "body2" : "body1"}>
            Microsoft Word Document Preview Not Available
          </Typography>
        </Box>
      );
    } else if (mediaFile.fileExtension &&
      ["xls", "xlsx"].includes(mediaFile.fileExtension.toLowerCase())) {
      // Excel document
      return (
        <Box
          sx={{
            p: 4,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 2,
          }}
        >
          <FaFileExcel size={isMobile ? 48 : 64} />
          <Typography variant={isMobile ? "body2" : "body1"}>
            Microsoft Excel Document Preview Not Available
          </Typography>
        </Box>
      );
    } else {
      // Generic file
      return (
        <Box
          sx={{
            p: 4,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 2,
          }}
        >
          <FaFile size={isMobile ? 48 : 64} />
          <Typography variant={isMobile ? "body2" : "body1"}>
            {mediaFile.fileExtension
              ? `${mediaFile.fileExtension.toUpperCase()} File Preview Not Available`
              : "File Preview Not Available"}
          </Typography>
        </Box>
      );
    }
  }, [mediaFile, isMobile, onDownload]);

  // Inside the MediaDetailPreview component, after the RenderMediaContent component definition
  // Add a new piece of state to track the content height
  const [contentHeight, setContentHeight] = useState<number>(400); // Default min height
  const contentRef = useRef<HTMLDivElement>(null);

  // Use ResizeObserver to track content height changes
  useEffect(() => {
    if (!contentRef.current) return;
    
    // Function to measure height
    const updateHeight = () => {
      if (contentRef.current && activeTab === 0) {
        const height = contentRef.current.offsetHeight;
        if (height > 200) { // Only update if it's a meaningful height
          setContentHeight(height);
        }
      }
    };
    
    // Initial measurement
    updateHeight();
    
    // Set up ResizeObserver for dynamic updates
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        if (entry.target === contentRef.current && activeTab === 0) {
          updateHeight();
        }
      }
    });
    
    // Start observing
    resizeObserver.observe(contentRef.current);
    
    // Cleanup
    return () => {
      resizeObserver.disconnect();
    };
  }, [activeTab, mediaFile]);

  // Media type specific adjustment: ensure proper height for different media types
  useEffect(() => {
    if (!mediaFile) return;
    
    // Set larger minimum height for certain file types
    if (mediaFile.fileExtension) {
      const ext = mediaFile.fileExtension.toLowerCase();
      
      // Videos and PDFs need more height
      if (['mp4', 'webm', 'ogg', 'mov', 'pdf'].includes(ext)) {
        setContentHeight(prev => Math.max(prev, 600));
      }
      // Images can vary
      else if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext)) {
        // Don't set a fixed height, let the image determine it
      }
      // Other file types need less space
      else {
        setContentHeight(prev => Math.max(prev, 300));
      }
    }
  }, [mediaFile]);

  return (
    <Box className="media-preview">
      <Box className="media-preview-header">
        <Typography 
          variant={isMobile ? "h5" : "h4"} 
          gutterBottom 
          style={{ 
            color: 'var(--accent-color)',
            fontSize: isMobile ? '1.25rem' : '2rem',
            marginBottom: '0',
          }}
        >
          {getMetadataField(mediaFile, 'fileName') || mediaFile.title || 'Untitled Media'}
        </Typography>
        
        {/* Action Buttons */}
        <Box sx={{ 
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <Button
            variant="contained"
            color="primary"
            startIcon={<FaDownload />}
            onClick={onDownload}
            size={isMobile ? "small" : "medium"}
            sx={{ 
              padding: isMobile ? '4px 8px' : '6px 12px',
              minWidth: isMobile ? 'auto' : '64px'
            }}
          >
            {isMobile ? '' : 'Download'}
          </Button>
          
          {isEditingEnabled && onEdit && (
            <Button
              variant="outlined"
              color="primary"
              startIcon={<EditIcon />}
              onClick={(e) => {
                console.log('Edit button clicked');
                e.stopPropagation();
                if (onEdit) onEdit();
              }}
              size={isMobile ? "small" : "medium"}
              sx={{ 
                padding: isMobile ? '4px 8px' : '6px 12px',
                minWidth: isMobile ? 'auto' : '64px',
                zIndex: 10  // Add a higher z-index to ensure it's clickable
              }}
            >
              {isMobile ? '' : 'Edit'}
            </Button>
          )}
          
          {/* Add thumbnail button for video files */}
          {isEditingEnabled && isVideo && onThumbnailUpdate && (
            <Tooltip title="Update Video Thumbnail">
              <Button
                variant="outlined"
                color="secondary"
                startIcon={<PhotoIcon />}
                onClick={onThumbnailUpdate}
                size={isMobile ? "small" : "medium"}
                sx={{ 
                  padding: isMobile ? '4px 8px' : '6px 12px',
                  minWidth: isMobile ? 'auto' : '64px',
                }}
              >
                {isMobile ? '' : 'Thumbnail'}
              </Button>
            </Tooltip>
          )}
        </Box>
      </Box>
      
      {/* Tabs only shown if related media exists */}
      {hasRelatedMedia ? (
        <>
          <Box sx={{ borderBottom: 1, borderColor: 'divider', mt: 2 }}>
            <Tabs value={activeTab} onChange={handleTabChange} aria-label="media content tabs">
              <Tab label="Main File" id="tab-0" aria-controls="tabpanel-0" />
              <Tab label="Related Files" id="tab-1" aria-controls="tabpanel-1" />
            </Tabs>
          </Box>
          
          {/* Shared container with minimum height */}
          <Box 
            className="tab-content-container"
            sx={{ 
              mt: 2, 
              minHeight: contentHeight ? `${contentHeight}px` : 'auto',
              transition: 'min-height 0.3s ease-in-out'
            }}
          >
            {/* Main File Tab Content */}
            <Box 
              className="tab-panel"
              role="tabpanel"
              hidden={activeTab !== 0}
              id="tabpanel-0"
              aria-labelledby="tab-0"
            >
              {activeTab === 0 && (
                <Box className="media-preview-media" ref={contentRef}>
                  <RenderMediaContent />
                </Box>
              )}
            </Box>
            
            {/* Related Files Tab Content */}
            <Box 
              className="tab-panel related-tab"
              role="tabpanel"
              hidden={activeTab !== 1}
              id="tabpanel-1"
              aria-labelledby="tab-1"
              sx={{ 
                height: contentHeight ? `${contentHeight}px` : 'auto',
                overflowY: 'auto'
              }}
            >
              {activeTab === 1 && (
                <Box className="related-media-container">
                  <Box className="related-media-list">
                    {/* Render related media */}
                    {Array.isArray(mediaFile.metadata?.relatedMedia) ? (
                      mediaFile.metadata.relatedMedia.map((item, index) => (
                        <RelatedMediaItem key={index} media={item} />
                      ))
                    ) : (
                      // Single object case
                      mediaFile.metadata?.relatedMedia?.mediaId && (
                        <RelatedMediaItem media={mediaFile.metadata.relatedMedia} />
                      )
                    )}
                  </Box>
                </Box>
              )}
            </Box>
          </Box>
        </>
      ) : (
        // No tabs, just show the main media
        <Box className="media-preview-media" sx={{ mt: 2 }}>
          <RenderMediaContent />
        </Box>
      )}
    </Box>
  );
};

const MediaDetail: React.FC = () => {
  // All state hooks first
  const { slug } = useParams();
  const [mediaFile, setMediaFile] = useState<BaseMediaFile | null>(null);
  const [mediaTypeConfig, setMediaTypeConfig] = useState<MediaType | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const mediaTypes = useSelector((state: RootState) => state.mediaTypes.mediaTypes);
  const navigate = useNavigate();
  // Get uploadedBy from either direct property or metadata
  const userId = mediaFile ? getMetadataField(mediaFile, 'uploadedBy', '') : '';
  const { username: uploaderUsername, loading: uploaderLoading } = useUsername(userId);
  const userRole = useSelector((state: RootState) => state.user.currentUser.role);
  const isMobile = useMediaQuery((theme: Theme) => theme.breakpoints.down('sm'));
  const dispatch = useDispatch<AppDispatch>();

  // Add state for thumbnail dialog
  const [thumbnailDialogOpen, setThumbnailDialogOpen] = useState(false);

  useEffect(() => {
    const fetchFile = async () => {
      if (!slug) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const response = await axios.get<BaseMediaFile>(`${env.BASE_URL}/media/slug/${slug}`);
        console.log("Media file:", response.data);
        setMediaFile(response.data);

        // Find the corresponding media type
        if (response.data.mediaType) {
          const mediaType = mediaTypes.find(
            (type) => type.name === response.data.mediaType
          );
          
          if (mediaType) {
            console.log("Media type found:", mediaType);
            // Create a properly typed MediaType object from our store type
            setMediaTypeConfig({
              id: mediaType._id || '',
              name: mediaType.name,
              // Explicitly set optional properties
              description: '',
              fields: mediaType.fields || [],
              acceptedFileTypes: mediaType.acceptedFileTypes || [],
              defaultTags: mediaType.defaultTags || []
            });
          } else {
            console.warn(
              `Media type "${response.data.mediaType}" not found in available types.`
            );
          }
        }
      } catch (error) {
        console.error("Error fetching file details:", error);
        toast.error("Failed to load file details. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchFile();
  }, [slug, mediaTypes]);

  const handleDownload = async () => {
    if (!mediaFile) return;

    try {
      // For direct downloads of files with known URLs
      if (mediaFile.location) {
        // Create a temporary anchor element
        const link = document.createElement('a');
        link.href = mediaFile.location;
        
        // Set the download attribute with the file name
        const fileName = mediaFile.metadata?.fileName || mediaFile.title || `file.${mediaFile.fileExtension}`;
        link.setAttribute('download', fileName);
        
        // Append to the document, click it, and remove it
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else {
        // Use the API for downloads that require server-side processing
        const response = await axios.get(`${env.BASE_URL}/media/download/${mediaFile.id || mediaFile._id}`, {
          responseType: 'blob'
        });
        
        // Create a blob URL for the downloaded file
        const blob = new Blob([response.data as BlobPart]);
        const url = window.URL.createObjectURL(blob);
        
        // Set up and trigger download
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', mediaFile.metadata?.fileName || mediaFile.title || 'download');
        document.body.appendChild(link);
        link.click();
        
        // Clean up
        window.URL.revokeObjectURL(url);
        document.body.removeChild(link);
      }
      
      toast.success('Download started');
    } catch (error) {
      console.error('Error downloading file:', error);
      toast.error('Failed to download file. Please try again.');
    }
  };

  const handleEdit = () => {
    console.log('handleEdit function called');
    setIsEditing(true);
    console.log('isEditing set to true');
  };

  const handleSave = async (updatedMediaFile: Partial<MediaFile> & { metadata?: Record<string, any> }) => {
    if (!mediaFile) return;
    
    try {
      // Get required identifiers from the media file
      const mediaId = mediaFile._id || mediaFile.id || '';
      const mediaSlug = mediaFile.slug || '';
      
      console.log('Received data for update:', updatedMediaFile);
      
      // Log MediaType specific fields from updatedMediaFile.customFields
      if (updatedMediaFile.customFields && mediaTypeConfig?.fields) {
        console.log('MediaType specific fields to update:');
        mediaTypeConfig.fields.forEach(field => {
          const fieldValue = updatedMediaFile.customFields?.[field.name];
          console.log(`Field "${field.name}" (${field.type}):`, fieldValue, 
            `(type: ${typeof fieldValue})`);
          
          // Check for undefined or null values that might be causing issues
          if (fieldValue === undefined) {
            console.warn(`Field "${field.name}" is undefined`);
          } else if (fieldValue === null) {
            console.warn(`Field "${field.name}" is null`);
          } else if (fieldValue === '') {
            console.warn(`Field "${field.name}" is empty string`);
          }
        });
      }
      
      // If the updated data already has a metadata property, that means the EditDialog
      // has already prepared the changed-only fields for us
      if (updatedMediaFile.metadata) {
        console.log('Received pre-filtered changed fields:', updatedMediaFile);
        
        // Make sure we have the required identifiers
        const updatePayload = {
          ...updatedMediaFile,
          _id: mediaId,
          id: mediaId,
          slug: mediaSlug
        };
        
        // Important: Do not add any other fields to the metadata
        // The EditDialog has already filtered for only changed fields
        
        console.log('Using pre-filtered update payload:', JSON.stringify(updatePayload, null, 2));
        const resultAction = await dispatch(updateMedia(updatePayload));
        
        // Process the result
        if (updateMedia.fulfilled.match(resultAction)) {
          handleSuccessfulUpdate(resultAction.payload, updatedMediaFile);
        } else if (updateMedia.rejected.match(resultAction)) {
          handleFailedUpdate(resultAction.payload);
        }
        
        return;
      }
      
      // Legacy format handling for backward compatibility
      // Extract only the properties we need to update
      const updatePayload: {
        _id: string;
        id: string;
        slug: string;
        title?: string;
        metadata?: Record<string, any>;
      } = {
        _id: mediaId,
        id: mediaId, // Include both ID formats
        slug: mediaSlug, // Include the slug for the API endpoint
        title: updatedMediaFile.title
      };
      
      // Only add metadata if needed
      if (updatedMediaFile.fileName || 
          updatedMediaFile.altText || 
          updatedMediaFile.description || 
          updatedMediaFile.visibility || 
          updatedMediaFile.tags ||
          (updatedMediaFile.customFields && Object.keys(updatedMediaFile.customFields).length > 0)) {
        
        updatePayload.metadata = {};
        
        // Only add fields that were provided in the update
        if (updatedMediaFile.fileName) updatePayload.metadata.fileName = updatedMediaFile.fileName;
        if (updatedMediaFile.altText) updatePayload.metadata.altText = updatedMediaFile.altText;
        if (updatedMediaFile.description) updatePayload.metadata.description = updatedMediaFile.description;
        if (updatedMediaFile.visibility) updatePayload.metadata.visibility = updatedMediaFile.visibility;
        if (updatedMediaFile.tags) updatePayload.metadata.tags = updatedMediaFile.tags;
        
        // Only add custom fields that were explicitly provided
        if (updatedMediaFile.customFields && Object.keys(updatedMediaFile.customFields).length > 0) {
          Object.entries(updatedMediaFile.customFields).forEach(([key, value]) => {
            if (key && value !== undefined) {
              // Check if it's a MediaType field
              const isMediaTypeField = mediaTypeConfig?.fields.some(field => field.name === key);
              if (isMediaTypeField) {
                console.log(`Adding changed MediaType field "${key}" with value:`, value);
                updatePayload.metadata![key] = value;
              }
            }
          });
        }
      }
      
      // ALWAYS include thumbnail URLs if they exist in data, even if unchanged
      // This ensures changes are saved properly and prevents caching issues
      if (updatedMediaFile.metadata && 'v_thumbnail' in updatedMediaFile.metadata) {
        // Ensure metadata exists
        if (!updatePayload.metadata) {
          updatePayload.metadata = {};
        }
        // Type assertion and null check
        const thumbnailUrl = (updatedMediaFile.metadata as MediaMetadata).v_thumbnail;
        if (thumbnailUrl) {
          (updatePayload.metadata as MediaMetadata).v_thumbnail = thumbnailUrl.split('?')[0];
        }
      }
      
      if (updatedMediaFile.metadata && 'v_thumbnailTimestamp' in updatedMediaFile.metadata) {
        // Ensure metadata exists
        if (!updatePayload.metadata) {
          updatePayload.metadata = {};
        }
        // Type assertion with non-null assertion
        const timestamp = (updatedMediaFile.metadata as MediaMetadata).v_thumbnailTimestamp;
        if (timestamp) {
          (updatePayload.metadata as MediaMetadata).v_thumbnailTimestamp = timestamp;
        }
      }
      
      console.log('Final update payload:', JSON.stringify(updatePayload, null, 2));
      
      // Call the Redux action to update the media file
      const resultAction = await dispatch(updateMedia(updatePayload));
      
      if (updateMedia.fulfilled.match(resultAction)) {
        handleSuccessfulUpdate(resultAction.payload, updatedMediaFile);
      } else if (updateMedia.rejected.match(resultAction)) {
        handleFailedUpdate(resultAction.payload);
      }
    } catch (error) {
      console.error('Error updating media:', error);
      toast.error('Failed to update media: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  };

  // Helper function to handle successful updates
  const handleSuccessfulUpdate = (updatedData: any, updatedMediaFile: Partial<MediaFile> & { metadata?: Record<string, any> }) => {
    console.log('Update successful, server returned:', updatedData);
    
    // Inspect metadata from server response
    console.log('Server returned metadata:', updatedData.metadata);
    
    // Track if we had mediaType-specific fields to update
    let hadMediaTypeFields = false;
    
    // Examine specific custom fields in server response
    if (mediaTypeConfig && updatedMediaFile.metadata) {
      hadMediaTypeFields = true;
      
      // Log comparison of what was submitted vs what the server returned
      console.log('Checking server response against our submitted changes:');
      
      // Get the fields that should have been updated
      Object.keys(updatedMediaFile.metadata).forEach(fieldName => {
        const serverValue = updatedData.metadata?.[fieldName];
        const submittedValue = updatedMediaFile.metadata?.[fieldName];
        
        console.log(`Field "${fieldName}":`, {
          serverReturned: serverValue,
          formSubmitted: submittedValue,
          serverType: typeof serverValue,
          submittedType: typeof submittedValue,
          valueMatch: serverValue === submittedValue
        });
      });
    }
    
    // Create a new mediaFile object that properly preserves the custom fields
    setMediaFile(prevState => {
      if (!prevState) return null;
      
      // Create a new metadata object that combines existing and updated values
      const combinedMetadata = {
        ...(prevState.metadata || {}),
        ...(updatedData.metadata || {})
      };
      
      // Ensure the submitted metadata changes take precedence over what the server returned
      // This handles cases where the server might not have correctly updated all fields
      if (hadMediaTypeFields && updatedMediaFile.metadata) {
        console.log('Adding submitted form changes to final metadata');
        Object.entries(updatedMediaFile.metadata).forEach(([key, value]) => {
          if (value !== undefined) {
            console.log(`Ensuring field "${key}" uses submitted value:`, value);
            combinedMetadata[key] = value;
          }
        });
      }
      
      // Special handling for thumbnails
      if (updatedMediaFile.metadata && 'v_thumbnail' in updatedMediaFile.metadata) {
        const thumbnailUrl = (updatedMediaFile.metadata as MediaMetadata).v_thumbnail;
        if (thumbnailUrl) {
          (combinedMetadata as MediaMetadata).v_thumbnail = thumbnailUrl.split('?')[0];
        }
      }
      
      if (updatedMediaFile.metadata && 'v_thumbnailTimestamp' in updatedMediaFile.metadata) {
        const timestamp = (updatedMediaFile.metadata as MediaMetadata).v_thumbnailTimestamp;
        if (timestamp) {
          (combinedMetadata as MediaMetadata).v_thumbnailTimestamp = timestamp;
        }
      }
      
      // Log the combined metadata for debugging
      console.log('Combined metadata after update:', combinedMetadata);
      
      // Return a new media file object with the updated data
      return {
        ...prevState,
        ...updatedData,
        // Ensure metadata is properly updated
        metadata: combinedMetadata,
        // Update customFields with the combined metadata for future edits
        customFields: { ...combinedMetadata }
      };
    });
    
    toast.success('Media updated successfully');
  };

  // Helper function to handle failed updates
  const handleFailedUpdate = (payload: unknown) => {
    // Handle specific error if available
    const errorMsg = payload ? String(payload) : 'Update failed';
    throw new Error(errorMsg);
  };

  // Define base fields for the details component
  const baseFields = [
    { name: 'File Name', value: getMetadataField(mediaFile, 'fileName', mediaFile?.title) },
    { name: 'Media Type', value: mediaFile?.mediaType },
    { name: 'File Size', value: formatFileSize(mediaFile?.fileSize || 0) },
    { name: 'File Extension', value: mediaFile?.fileExtension?.toUpperCase() },
    { name: 'Upload Date', value: mediaFile?.modifiedDate ? new Date(mediaFile.modifiedDate).toLocaleDateString() : 'Unknown' },
    { name: 'Uploaded By', value: uploaderLoading ? 'Loading...' : (uploaderUsername || userId || 'Unknown') },
    { name: 'Description', value: getMetadataField(mediaFile, 'description', '') },
    { name: 'Alt Text', value: getMetadataField(mediaFile, 'altText', '') },
    { name: 'Visibility', value: getMetadataField(mediaFile, 'visibility', 'private')?.toUpperCase() },
  ];

  // Update mediaTypeForEdit when mediaFile or mediaTypeConfig changes
  useEffect(() => {
    console.log("mediaFile or mediaTypeConfig changed, updating mediaTypeForEdit");
    
    // If fields are modified and saved, ensure they're reflected when reopening the dialog
    if (mediaFile && isEditing) {
      console.log("Dialog is open, refreshing values");
      console.log("Current mediaFile metadata:", mediaFile.metadata);
    }
  }, [mediaFile, mediaTypeConfig, isEditing]);

  // Prepare the media file for the edit dialog
  const mediaFileForEdit = mediaFile ? {
    id: mediaFile._id || mediaFile.id || '',
    title: mediaFile.title || '',
    fileName: getMetadataField(mediaFile, 'fileName', mediaFile.title),
    altText: getMetadataField(mediaFile, 'altText', ''),
    description: getMetadataField(mediaFile, 'description', ''),
    visibility: getMetadataField(mediaFile, 'visibility', 'private'),
    tags: getMetadataField(mediaFile, 'tags', []),
    // Include both metadata and customFields for maximum compatibility
    customFields: {
      // First include all metadata fields
      ...(mediaFile.metadata || {}),
      // Ensure each MediaType specific field is explicitly included from metadata
      ...(mediaTypeConfig?.fields.reduce((fields, field) => {
        if (mediaFile.metadata && mediaFile.metadata[field.name] !== undefined) {
          fields[field.name] = mediaFile.metadata[field.name];
        }
        return fields;
      }, {} as Record<string, any>))
    },
    fileType: mediaFile.fileExtension || '',
    url: mediaFile.location || ''
  } : null;

  // Find the media type based on the mediaFile
  const mediaTypeForEdit = mediaTypeConfig ? {
    ...mediaTypeConfig,
    // Ensure each field has a label property
    fields: mediaTypeConfig.fields.map(field => ({
      ...field,
      // Use label if exists, otherwise use name as the label
      label: field.label || field.name
    }))
  } : null;

  // Function to handle thumbnail update
  const handleThumbnailUpdate = (thumbnailUrl: string, updatedMedia?: any) => {
    console.log('Thumbnail updated:', thumbnailUrl);
    
    if (updatedMedia) {
      console.log('Updated media file:', updatedMedia);
      // Use our existing handleSuccessfulUpdate function to update the state
      handleSuccessfulUpdate({
        success: true,
        message: 'Thumbnail updated successfully',
        data: updatedMedia
      }, updatedMedia);
      
      // Update the Redux store with the complete media object
      if ('_id' in updatedMedia) {
        dispatch(updateMedia(updatedMedia));
      }
    } else if (mediaFile && thumbnailUrl) {
      // Create updated media file object with new thumbnail
      const updatedMediaFile = {
        ...mediaFile,
        metadata: {
          ...mediaFile.metadata,
          v_thumbnail: thumbnailUrl,
          v_thumbnailTimestamp: Date.now()
        }
      };
      
      // Update the state
      handleSuccessfulUpdate({
        success: true,
        message: 'Thumbnail updated successfully',
        data: updatedMediaFile
      }, updatedMediaFile);
      
      // Update the Redux store with the complete media object
      dispatch(updateMedia(updatedMediaFile));
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="100vh">
        <CircularProgress />
      </Box>
    );
  }

  if (!mediaFile) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="100vh">
        <Typography>Media not found</Typography>
      </Box>
    );
  }

  // Is the current user allowed to edit this media?
  const isEditingEnabled = userRole === 'superAdmin' || userRole === 'admin';

  // Motion animation adjusted for mobile
  const motionProps = {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
    transition: { duration: isMobile ? 0.3 : 0.5 }
  };

  return (
    <motion.div className="media-detail-container" {...motionProps}>
      <Button
        className="back-button"
        onClick={() => navigate("/media-library")}
        variant="outlined"
        size={isMobile ? "small" : "medium"}
      >
        <ArrowBackIcon fontSize={isMobile ? "small" : "medium"} />
      </Button>
      <Box className="media-detail">
        <MediaDetailPreview 
          mediaFile={mediaFile} 
          onEdit={handleEdit}
          onDownload={handleDownload}
          isEditingEnabled={isEditingEnabled}
          onThumbnailUpdate={() => setThumbnailDialogOpen(true)}
        />

        <Box className="media-detail-info">
         

          {mediaFile && (
            <div className="media-information-container">
              <Suspense fallback={<LoadingFallback />}>
                <MediaInformation
                  mediaFile={mediaFile}
                  mediaTypeConfig={mediaTypeConfig}
                  baseFields={baseFields}
                  getMetadataField={getMetadataField}
                />
              </Suspense>
            </div>
          )}

          {mediaTypeConfig && isEditing && mediaFileForEdit && mediaTypeForEdit && (
            <Suspense fallback={<LoadingFallback />}>
              <EditMediaDialog
                key={`edit-dialog-${mediaFile._id}-${isEditing}-${new Date().getTime()}`}
                open={isEditing}
                onClose={() => setIsEditing(false)}
                mediaFile={mediaFileForEdit}
                mediaType={mediaTypeForEdit}
                onSave={handleSave}
              />
            </Suspense>
          )}

          {/* Add the thumbnail dialog */}
          <Suspense fallback={<LoadingFallback />}>
            {mediaFile && (
              <ThumbnailUpdateDialog
                open={thumbnailDialogOpen}
                onClose={() => setThumbnailDialogOpen(false)}
                mediaData={mediaFile}
                onThumbnailUpdate={handleThumbnailUpdate}
              />
            )}
          </Suspense>
        </Box>
      </Box>

      <ToastContainer position="top-center" />

      {process.env.NODE_ENV !== 'production' && (
        <Box sx={{ position: 'fixed', bottom: 10, right: 10, p: 2, bgcolor: 'rgba(0,0,0,0.7)', color: 'white', zIndex: 9999, borderRadius: 1 }}>
          <Typography variant="caption">
            isEditing: {isEditing ? 'true' : 'false'}<br />
            hasMediaType: {!!mediaTypeConfig ? 'true' : 'false'}<br />
            hasMediaFile: {!!mediaFileForEdit ? 'true' : 'false'}<br />
            isAdmin: {isEditingEnabled ? 'true' : 'false'}
          </Typography>
        </Box>
      )}
    </motion.div>
  );
};

export default MediaDetail;