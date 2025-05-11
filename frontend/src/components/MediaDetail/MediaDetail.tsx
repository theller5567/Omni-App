import React, { useEffect, useState, lazy, Suspense, useRef } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
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
  Tooltip,
  TextField
} from "@mui/material";
import axios from "axios";
import { BaseMediaFile } from "../../interfaces/MediaFile";
import { MediaFile } from "../../types/media";
import { motion } from 'framer-motion';
import { formatFileSize } from "../../utils/formatFileSize";
import "./styles/mediaDetail.scss";
import { useSelector } from "react-redux";
import { RootState } from "../../store/store";
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useUsername } from '../../hooks/useUsername';
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
import RelatedMediaItem from "./components/RelatedMediaItem";
// Import React Query hooks
import { useMediaDetail, useUpdateMedia, useApiHealth, QueryKeys, useMediaTypes } from '../../hooks/query-hooks';
import { useQueryClient } from '@tanstack/react-query';
import ThumbnailUpdateDialog from './components/ThumbnailUpdateDialog';

// Lazy load subcomponents
const MediaInformation = lazy(() => import('./components/MediaInformation'));
const EditMediaDialog = lazy(() => import('./components/EditMediaDialog'));

// Helper function to safely get metadata fields from either root or metadata object
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
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const isMobile = useMediaQuery((theme: Theme) => theme.breakpoints.down("sm"));
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isThumbnailDialogOpen, setIsThumbnailDialogOpen] = useState(false);
  
  // Get queryClient for cache invalidation
  const queryClient = useQueryClient();
  
  // Debug state variables
  const [showAdvancedDebug, setShowAdvancedDebug] = useState(false);
  const [customEndpoint, setCustomEndpoint] = useState('');
  const [isTestingEndpoint, setIsTestingEndpoint] = useState(false);
  const [testResult, setTestResult] = useState<{success: boolean, message: string} | null>(null);
  
  // Get media types from TanStack Query instead of Redux
  const { data: mediaTypes = [] } = useMediaTypes();
  
  // Use React Query hook instead of direct API call
  const { 
    data: mediaFile, 
    isLoading, 
    isError, 
    error,
    refetch 
  } = useMediaDetail(slug);
  
  // Use mutation hook for updates
  const { mutateAsync: updateMediaMutation } = useUpdateMedia();
  
  // Add API health check
  const { 
    isLoading: isCheckingHealth, 
    isError: isHealthError, 
    error: healthError,
    refetch: recheckHealth 
  } = useApiHealth();
  
  // Redirect back to media library if slug is missing
  useEffect(() => {
      if (!slug) {
      navigate('/media-library');
    }
  }, [slug, navigate]);
  
  // Get current user role from Redux store
  const userRole = useSelector((state: RootState) => state.user.currentUser.role);
  const isEditingEnabled = userRole === 'admin' || userRole === 'superAdmin';

  // Get user info - moved to top level to ensure consistent hook order
  const userId = mediaFile ? (getMetadataField(mediaFile, 'uploadedBy', '') || '') : '';
  const { username: uploadedBy } = useUsername(userId);

  // Effect to update the URL if the slug in the URL doesn't match the actual slug
  useEffect(() => {
    if (mediaFile && slug && mediaFile.slug && slug !== mediaFile.slug) {
      // We found media but the URL slug doesn't match the actual slug
      // Update the URL without triggering a new page load
      if (process.env.NODE_ENV === 'development') {
        console.log(`Correcting URL: changing ${slug} to ${mediaFile.slug}`);
      }
      const newPath = location.pathname.replace(slug, mediaFile.slug);
      navigate(newPath, { replace: true });
    }
  }, [mediaFile, slug, navigate, location.pathname]);

  // Motion animation adjusted for mobile
  const motionProps = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.3 }
  };

  const handleDownload = async () => {
    if (!mediaFile || !mediaFile.location) return;
    
    try {
      // Fetch file with responseType: 'blob' to get binary data
      const response = await axios.get(mediaFile.location, {
          responseType: 'blob'
        });
        
      // Create a blob URL for the file
        const blob = new Blob([response.data as BlobPart]);
        const url = window.URL.createObjectURL(blob);
        
      // Create a temporary link element and click it to download
        const link = document.createElement('a');
        link.href = url;
      link.download = mediaFile.metadata?.fileName || mediaFile.title || 'download';
        document.body.appendChild(link);
        link.click();
        
        // Clean up
        window.URL.revokeObjectURL(url);
        document.body.removeChild(link);
      
      toast.success('File download started');
    } catch (error) {
      console.error('Error downloading file:', error);
      toast.error('Failed to download file');
    }
  };

  const handleEdit = () => {
    setIsEditDialogOpen(true);
  };
  
  const handleSave = async (updatedMediaFile: Partial<MediaFile> & { metadata?: Record<string, any> }): Promise<boolean> => {
    try {
      if (!mediaFile) {
        throw new Error('No media file data available to update');
      }
      
      // Track which fields are actually changed
      const changedFields: string[] = [];
      
      // Check if title changed
      if (updatedMediaFile.title && updatedMediaFile.title !== mediaFile.title) {
        changedFields.push('title');
      }
      
      // Check which metadata fields changed
      if (updatedMediaFile.metadata && mediaFile.metadata) {
        Object.keys(updatedMediaFile.metadata).forEach(key => {
          const oldValue = mediaFile.metadata?.[key];
          const newValue = updatedMediaFile.metadata?.[key];
          
          // Special handling for undefined to empty string conversion
          // This prevents registering a non-meaningful change when a field goes from undefined to empty string
          if (oldValue === undefined && (newValue === '' || newValue === null)) {
            // Skip adding this to changedFields since undefined to empty string is not a real change
            console.log(`Field ${key} changed from undefined to empty string, ignoring as non-meaningful change`);
            return;
          }
          
          // Only add to changedFields if the value actually changed
          if (JSON.stringify(oldValue) !== JSON.stringify(newValue)) {
            changedFields.push(`metadata.${key}`);
          }
        });
      }
      
      // Build the update payload - only include changed metadata fields
      const updatePayload: Partial<BaseMediaFile> & { 
        metadata?: Record<string, any>;
        changedFields?: string[];
      } = {
        _id: mediaFile._id,
        id: mediaFile.id,
        slug: mediaFile.slug || '',
        modifiedDate: mediaFile.modifiedDate || new Date().toISOString(),
        // Only include title if it changed
        ...(changedFields.includes('title') ? { title: updatedMediaFile.title } : {})
      };
      
      // Only include changed metadata fields
      if (updatedMediaFile.metadata && changedFields.some(f => f.startsWith('metadata.'))) {
        updatePayload.metadata = { ...(mediaFile.metadata || {}) };
        
        // Only update fields that actually changed
        changedFields
          .filter(field => field.startsWith('metadata.'))
          .forEach(field => {
            const metadataKey = field.replace('metadata.', '');
            updatePayload.metadata![metadataKey] = updatedMediaFile.metadata![metadataKey];
          });
      }
      
      // Add changedFields to the payload so the backend knows which fields were updated
      updatePayload.changedFields = changedFields;
      
      // Don't proceed if there are no changes to make
      if (changedFields.length === 0) {
        console.log('No changes detected, skipping update');
        return true;
      }
      
      // Use the mutation function
      await updateMediaMutation(updatePayload as any);
      
      // Handle successful update
      handleSuccessfulUpdate(updatePayload);
      
      return true;
    } catch (error: any) {
      handleFailedUpdate(error);
      return false;
    }
  };
  
  const handleSuccessfulUpdate = (updatedMediaFile: Partial<BaseMediaFile> & { metadata?: Record<string, any> }) => {
    // Close the edit dialog 
    setIsEditDialogOpen(false);
    
    // Show success message
    if (updatedMediaFile.title !== mediaFile?.title) {
      toast.success(`Title updated successfully`);
    } else {
      toast.success(`Media details updated successfully`);
    }
    
    // Invalidate activity logs query to refresh the Recent Activity component
    queryClient.invalidateQueries({ queryKey: [QueryKeys.activityLogs] });
    
    // Refetch data to ensure we have the most up-to-date version
    refetch();
  };
  
  const handleFailedUpdate = (payload: unknown) => {
    console.error('Error updating media:', payload);
    
    if (typeof payload === 'object' && payload !== null && 'message' in payload) {
      toast.error(`Update failed: ${String((payload as any).message)}`);
    } else {
      toast.error('Failed to update media');
    }
  };
  
  const handleThumbnailUpdate = (thumbnailUrl: string) => {
    if (mediaFile && thumbnailUrl) {
      try {
        // Track which fields are being changed
        const changedFields: string[] = [];
        
        // Check if thumbnail is actually changing
        if (mediaFile.metadata?.v_thumbnail !== thumbnailUrl) {
          changedFields.push('metadata.v_thumbnail');
        }
        
        // Add timestamp field
        changedFields.push('metadata.v_thumbnailTimestamp');
        
        // The thumbnail has already been updated by the API endpoint call
        // No need to call updateMediaMutation again which is causing duplicate logs
        
        // Close dialog
        setIsThumbnailDialogOpen(false);
        
        // Show success toast notification
        toast.success('Thumbnail updated successfully');
      
        // Invalidate activity logs query to refresh the Recent Activity component
        queryClient.invalidateQueries({ queryKey: [QueryKeys.activityLogs] });
        
        // Invalidate media queries to refresh the media library and media detail views
        queryClient.invalidateQueries({ queryKey: [QueryKeys.media] });
        queryClient.invalidateQueries({ queryKey: [QueryKeys.mediaDetail] });
        
        // Refetch to get latest data
        refetch();
        return Promise.resolve(true);
    } catch (error) {
        console.error('Error processing thumbnail update:', error);
        toast.error('Failed to update thumbnail');
        return Promise.resolve(false);
      }
    }
    return Promise.resolve(false);
  };
  
  // Function to test a custom endpoint
  const testCustomEndpoint = async () => {
    if (!customEndpoint || !slug) return;
    
    setIsTestingEndpoint(true);
    setTestResult(null);
    
    try {
      const token = localStorage.getItem('authToken');
      // Extract ID if present in the slug
      const idMatch = slug.match(/([a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12})/i);
      const id = idMatch ? idMatch[1] : slug;
      
      // Replace :id or :slug placeholders with actual values
      const endpoint = customEndpoint
        .replace(':id', id)
        .replace(':slug', slug);
        
      const response = await axios.get(endpoint, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      setTestResult({
        success: true,
        message: `Success! Endpoint returned ${response.status} with data: ${JSON.stringify(response.data).substring(0, 100)}...`
      });
    } catch (error: any) {
      setTestResult({
        success: false,
        message: `Error: ${error.message}${error.response ? ` (Status: ${error.response.status})` : ''}`
      });
    } finally {
      setIsTestingEndpoint(false);
    }
  };

  // Find media type details and convert to MediaTypeConfig format
  const mediaTypeInfo = mediaTypes.find(
    (type) => type.name === mediaFile?.mediaType
  );
  
  // Convert mediaTypeInfo to MediaTypeConfig format
  const mediaTypeConfig = mediaTypeInfo ? {
    ...mediaTypeInfo,
    fields: mediaTypeInfo.fields || []
  } : null;

  // Get the media's accent color from its media type
  const accentColor = mediaTypeInfo?.catColor || '#4dabf5';
  
  // Get metadata description (from either root or metadata object)
  const description = mediaFile ? getMetadataField(mediaFile, 'description', '') : '';
  
  // Ensure modifiedDate exists - required by BaseMediaFile interface
  const modifiedDate = mediaFile ? (mediaFile.modifiedDate || new Date().toISOString()) : new Date().toISOString();
  
  // Set CSS variables for theming
  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty('--accent-color', accentColor);
    
    return () => {
      // Reset to default when component unmounts
      root.style.setProperty('--accent-color', '#4dabf5');
    };
  }, [accentColor]);
  
  const isVideo = mediaFile && mediaFile.fileExtension && 
    ['mp4', 'webm', 'ogg', 'mov'].includes(mediaFile.fileExtension.toLowerCase());

  // Prepare data for MediaInformation component according to its expected props
  const baseFields = mediaFile ? [
    { name: 'File Name', value: getMetadataField(mediaFile, 'fileName', mediaFile.title) },
    { name: 'Media Type', value: mediaFile.mediaType },
    { name: 'File Size', value: formatFileSize(mediaFile.fileSize || 0) },
    { name: 'File Extension', value: mediaFile.fileExtension?.toUpperCase() },
    { name: 'Upload Date', value: new Date(modifiedDate).toLocaleDateString() },
    { name: 'Uploaded By', value: uploadedBy || userId || 'Unknown' },
    { name: 'Description', value: description },
    { name: 'Alt Text', value: getMetadataField(mediaFile, 'altText', '') },
    { name: 'Visibility', value: getMetadataField(mediaFile, 'visibility', 'private')?.toUpperCase() },
  ] : [];

  // Render the successful state with the media file
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

      {isLoading ? (
        <Box
          sx={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            minHeight: "400px",
          }}
        >
          <CircularProgress />
        </Box>
      ) : isError || !mediaFile ? (
        <Box
          sx={{
            p: 3,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 2,
          }}
        >
          <Typography variant="h5" color="error">
            Error Loading Media
          </Typography>
          <Typography variant="body1" sx={{ maxWidth: '600px', textAlign: 'center', mb: 2 }}>
            {error instanceof Error ? error.message : 'Failed to load media file'}
          </Typography>
          
          {/* Show API Health Status */}
          <Box sx={{ 
            p: 2, 
            bgcolor: isHealthError ? 'rgba(255,0,0,0.05)' : 'rgba(0,255,0,0.05)', 
            borderRadius: 1,
            mb: 2,
            width: '100%',
            maxWidth: '500px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center'
          }}>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>
              API Server Status: {isCheckingHealth ? 'Checking...' : (isHealthError ? 'Error' : 'Online')}
            </Typography>
            
            {isHealthError && (
              <Typography variant="body2" color="error">
                {healthError instanceof Error ? healthError.message : 'Cannot connect to API server'}
              </Typography>
            )}
            
            {!isCheckingHealth && (
              <Button 
                size="small" 
                variant="outlined" 
                onClick={() => recheckHealth()}
                sx={{ mt: 1 }}
              >
                Check API Status
              </Button>
            )}
      </Box>
          
          {process.env.NODE_ENV === 'development' && (
            <>
              <Box sx={{ 
                p: 2, 
                bgcolor: 'rgba(0,0,0,0.05)', 
                borderRadius: 1, 
                width: '100%',
                maxWidth: '600px',
                overflow: 'auto',
                mb: showAdvancedDebug ? 0 : 2
              }}>
                <Typography variant="subtitle2" sx={{ mb: 1 }}>Debug Information:</Typography>
                <Typography variant="caption" component="pre" sx={{ whiteSpace: 'pre-wrap' }}>
                  Slug: {slug}
                  {error instanceof Error ? 
                    `\n\nError: ${error.message}\n\nStack: ${error.stack || 'No stack trace'}` : 
                    `\n\nError: ${JSON.stringify(error, null, 2)}`}
                </Typography>
                
                <Button 
                  size="small" 
                  variant="text" 
                  onClick={() => setShowAdvancedDebug(!showAdvancedDebug)}
                  sx={{ mt: 2 }}
                >
                  {showAdvancedDebug ? 'Hide Advanced Debug' : 'Show Advanced Debug'}
                </Button>
      </Box>
              
              {showAdvancedDebug && (
                <Box sx={{ 
                  p: 2, 
                  bgcolor: 'rgba(0,0,255,0.05)', 
                  borderRadius: 1, 
                  width: '100%',
                  maxWidth: '600px',
                  mb: 2
                }}>
                  <Typography variant="subtitle2" sx={{ mb: 1 }}>Test Custom Endpoint:</Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    <Typography variant="caption">
                      Enter a custom API endpoint to test. Use :id or :slug for dynamic values.
                    </Typography>
                    
                    <TextField 
                      size="small"
                      fullWidth
                      value={customEndpoint}
                      onChange={(e) => setCustomEndpoint(e.target.value)}
                      placeholder="e.g., http://localhost:5002/api/media/:id"
                      disabled={isTestingEndpoint}
                    />
                    
      <Button
                      variant="contained" 
                      size="small"
                      onClick={testCustomEndpoint}
                      disabled={!customEndpoint || isTestingEndpoint}
                    >
                      {isTestingEndpoint ? 'Testing...' : 'Test Endpoint'}
                    </Button>
                    
                    {testResult && (
                      <Box sx={{ 
                        mt: 1, 
                        p: 1, 
                        bgcolor: testResult.success ? 'rgba(0,255,0,0.1)' : 'rgba(255,0,0,0.1)', 
                        borderRadius: 1 
                      }}>
                        <Typography variant="caption">
                          {testResult.message}
                        </Typography>
                      </Box>
                    )}
                    
                    <Typography variant="caption" sx={{ mt: 1 }}>
                      Suggested endpoints to try:
                    </Typography>
                    
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {[
                        'http://localhost:5002/media/slug/:slug',
                        'http://localhost:5002/media/:slug',
                        'http://localhost:5002/api/media/id/:id',
                        'http://localhost:5002/media/id/:id',
                        'http://localhost:5002/api/media/:id',
                        'http://localhost:5002/media/by-id/:id'
                      ].map((endpoint) => (
                        <Chip 
                          key={endpoint}
                          label={endpoint} 
                          size="small" 
                          onClick={() => setCustomEndpoint(endpoint)}
                          clickable
                        />
                      ))}
                    </Box>
                  </Box>
                </Box>
              )}
            </>
          )}
          
          <Button
        variant="outlined"
            onClick={() => refetch()}
      >
            Retry
      </Button>
        </Box>
      ) : (
        <>
          <Box
            className="media-detail"
            sx={{
              p: isMobile ? 2 : 3,
              maxWidth: '100%',
              margin: '0 auto'
            }}
          >
        <MediaDetailPreview 
              mediaFile={mediaFile as BaseMediaFile}
          onEdit={handleEdit}
          onDownload={handleDownload}
          isEditingEnabled={isEditingEnabled}
              onThumbnailUpdate={isVideo && isEditingEnabled ? () => setIsThumbnailDialogOpen(true) : undefined}
            />
          
            <Box className="media-detail-content">
              <Suspense fallback={<CircularProgress size={24} />}>
                <MediaInformation
                  mediaFile={mediaFile}
                  mediaTypeConfig={mediaTypeConfig}
                  baseFields={baseFields}
                  getMetadataField={getMetadataField}
                />
              </Suspense>
            </Box>
          </Box>

          {isEditDialogOpen && (
            <Suspense fallback={<CircularProgress size={24} />}>
              <EditMediaDialog
                open={isEditDialogOpen}
                onClose={() => setIsEditDialogOpen(false)}
                mediaFile={mediaFile as any}
                mediaType={mediaTypeConfig as any}
                onSave={async (data) => {
                  await handleSave(data);
                  return;
                }}
              />
            </Suspense>
          )}
          
          {isThumbnailDialogOpen && (
            <ThumbnailUpdateDialog
              open={isThumbnailDialogOpen}
              onClose={() => setIsThumbnailDialogOpen(false)}
              mediaData={mediaFile}
              onThumbnailUpdate={handleThumbnailUpdate}
            />
          )}
        </>
      )}
      
      <ToastContainer
        position={isMobile ? "bottom-center" : "top-right"}
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        pauseOnFocusLoss
        draggable
        pauseOnHover
      />
    </motion.div>
  );
};

export default MediaDetail;