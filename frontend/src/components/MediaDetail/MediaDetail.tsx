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
} from "@mui/material";
import axios from "axios";
import { BaseMediaFile } from "../../interfaces/MediaFile";
import { MediaFile } from "../../types/media";
import { motion } from 'framer-motion';
import { formatFileSize } from "../../utils/formatFileSize";
import "./styles/mediaDetail.scss";
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
import { 
  useMediaDetail, 
  useUpdateMedia, 
  useApiHealth, 
  QueryKeys, 
  useMediaTypes,
  useUserProfile
} from '../../hooks/query-hooks';
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
  
  const queryClient = useQueryClient();
  
  const { data: mediaTypes = [] } = useMediaTypes();
  
  const { data: userProfile, isLoading: isUserLoading, isError: isUserProfileError } = useUserProfile(); 
  const { 
    data: mediaFile, 
    isLoading: isLoadingMedia,
    isError: isMediaError,
    error: mediaError,
    refetch,
  } = useMediaDetail(userProfile, slug);
  
  const { mutateAsync: updateMediaMutation } = useUpdateMedia();
  const { 
    isLoading: isCheckingHealth, 
    isError: isHealthError, 
    error: healthError,
    refetch: recheckHealth 
  } = useApiHealth();

  useEffect(() => {
      if (!slug) {
      navigate('/media-library');
    }
  }, [slug, navigate]);
  
  // Determine if editing is enabled based on userProfile role
  const isEditingEnabled = !isUserLoading && userProfile && (userProfile.role === 'admin' || userProfile.role === 'superAdmin');

  // 1. Handle user profile loading state first
  if (isUserLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="100vh">
        <CircularProgress />
        <Typography sx={{ ml: 2 }}>Loading user information...</Typography>
      </Box>
    );
  }

  // 2. Handle user logged-out state (ProtectedRoute should also catch this)
  // This check is important because useMediaDetail is enabled based on userProfile.
  // If no userProfile, mediaFile will be undefined and isLoadingMedia will be false (as query is disabled).
  if (!userProfile) {
    // If there was an error fetching the profile itself, that's a different issue
    if (isUserProfileError) {
       return (
        <Box display="flex" flexDirection="column" justifyContent="center" alignItems="center" height="100vh" className="media-detail-container error-container">
          <Typography variant="h5" color="error" gutterBottom>Error Loading User Profile</Typography>
          <Typography variant="body1" color="textSecondary" sx={{ mb: 2 }}>Could not load your profile. Please try again.</Typography>
          <Button variant="contained" onClick={() => window.location.reload()}>Reload</Button>
        </Box>
      );
    }
    // Otherwise, user is simply not logged in.
    return (
      <Box display="flex" flexDirection="column" justifyContent="center" alignItems="center" height="100vh" className="media-detail-container error-container">
        <Typography variant="h5" color="textSecondary" gutterBottom>Access Denied</Typography>
        <Typography variant="body1" color="textSecondary" sx={{ mb: 2 }}>Please log in to view this content.</Typography>
        <Button variant="contained" onClick={() => navigate('/login')}>Go to Login</Button>
      </Box>
    );
  }

  // At this point, userProfile IS defined.
  // So, useMediaDetail query IS (or was) enabled (assuming slug is also present).

  // 3. Handle media loading state (query is enabled and fetching)
  if (isLoadingMedia) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="100vh">
        <CircularProgress />
        <Typography sx={{ ml: 2 }}>Loading media details...</Typography>
      </Box>
    );
  }

  // 4. Handle media fetching error (query was enabled, ran, but failed)
  if (isMediaError) {
    return (
      <div className="media-detail-container error-container">
        <Typography variant="h4" color="error" gutterBottom>Error Loading Media</Typography>
        <Typography variant="body1" sx={{ mb: 2 }}>
          {mediaError?.message || "An unexpected error occurred while trying to load the media file."}
        </Typography>
        <Typography variant="subtitle2">API Server Status: {isCheckingHealth ? "Checking..." : isHealthError ? `Offline (${healthError?.message || 'Unknown Error'})` : "Online"}</Typography>
        <Button onClick={() => recheckHealth()} disabled={isCheckingHealth} sx={{ my: 1 }}>Retry Health Check</Button>
        <Button onClick={() => refetch()} sx={{ my: 1, ml: 1 }}>Retry Loading Media</Button>
        
        <Box sx={{ mt: 2, p: 2, border: '1px dashed grey', borderRadius: '4px' }}>
          <Typography variant="caption" display="block" gutterBottom>Debug Information:</Typography>
          <Typography variant="caption" display="block">Slug: {slug}</Typography>
          <Typography variant="caption" display="block">Error: {mediaError?.message || JSON.stringify(mediaError)}</Typography>
        </Box>
      </div>
    );
  }

  // 5. Handle media not found (query was enabled, ran, succeeded, but returned no data e.g. 404 for slug)
  if (!mediaFile) {
    return (
      <div className="media-detail-container error-container">
        <Typography variant="h4" color="error" gutterBottom>Media Not Found</Typography>
        <Typography variant="body1">
          The requested media could not be found. It may have been moved or deleted.
        </Typography>
        <Button onClick={() => navigate('/media-library')} sx={{ mt: 2 }}>Back to Library</Button>
      </div>
    );
  }

  // If we reach here, userProfile exists, and mediaFile exists and there were no errors loading it.
  const userId = getMetadataField(mediaFile, 'uploadedBy', '') || '';
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
          isEditingEnabled={isEditingEnabled ?? false}
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