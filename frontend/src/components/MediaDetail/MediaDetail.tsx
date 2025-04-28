import React, { useEffect, useState, lazy, Suspense } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { 
  Box, 
  Button, 
  CircularProgress, 
  Chip, 
  Typography,
  useMediaQuery,
  Theme,
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
import { updateMedia } from '../../store/slices/mediaSlice';

// Lazy load subcomponents
const MediaInformation = lazy(() => import('./MediaInformation'));
const EditMediaDialog = lazy(() => import('./EditMediaDialog').then(module => ({ 
  default: module.default || module.EditMediaDialog 
})));

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
}

export const MediaDetailPreview: React.FC<MediaDetailPreviewProps> = ({ 
  mediaFile, 
  onEdit, 
  onDownload, 
  isEditingEnabled 
}) => {
  // Get uploadedBy from either direct property or metadata

  const isMobile = useMediaQuery((theme: Theme) => theme.breakpoints.down('sm'));

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
        </Box>
      </Box>
      <Box className="media-preview-media">
        {mediaFile.fileExtension &&
        ["jpg", "jpeg", "png", "gif", "webp", "svg", "bmp"].includes(
          mediaFile.fileExtension.toLowerCase()
        ) ? (
          // Image preview
          <img
            src={mediaFile.location}
            alt={mediaFile.metadata?.altText || ""}
          />
        ) : mediaFile.fileExtension &&
          ["mp4", "webm", "ogg", "mov"].includes(
            mediaFile.fileExtension.toLowerCase()
          ) ? (
          // Video preview
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
              poster={mediaFile.metadata?.v_thumbnail}
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
        ) : mediaFile.fileExtension &&
          ["mp3", "wav", "ogg", "m4a"].includes(
            mediaFile.fileExtension.toLowerCase()
          ) ? (
          // Audio preview
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
        ) : mediaFile.fileExtension &&
          ["pdf"].includes(mediaFile.fileExtension.toLowerCase()) ? (
          // PDF preview
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
            {/* Add a debug button in development mode */}
            {/* {process.env.NODE_ENV !== 'production' && (
              <Box 
                sx={{ 
                  position: 'absolute',
                  top: 0,
                  right: 0,
                  zIndex: 10,
                  p: 1,
                }}
              >
                <Button
                  variant="outlined"
                  size="small"
                  onClick={() => {
                    console.log('PDF Debug Info:');
                    console.log('- PDF URL:', mediaFile.location);
                    console.log('- File Extension:', mediaFile.fileExtension);
                    console.log('- Content Type:', mediaFile.metadata?.contentType);
                    
                    // Log iframe status
                    const iframe = document.querySelector('iframe[title="PDF Preview"]');
                    console.log('- iframe element:', iframe);
                    
                    // Log object status
                    const objectElem = document.querySelector('.pdf-object-fallback object');
                    console.log('- object element:', objectElem);
                    
                    // Try different display methods
                    const showIframe = () => {
                      const iframe = document.querySelector('iframe[title="PDF Preview"]') as HTMLElement;
                      const objectFallback = document.querySelector('.pdf-object-fallback') as HTMLElement;
                      const iconFallback = document.querySelector('.pdf-icon-fallback') as HTMLElement;
                      
                      if (iframe && iframe.style) iframe.style.display = 'block';
                      if (objectFallback && objectFallback.style) objectFallback.style.display = 'none';
                      if (iconFallback && iconFallback.style) iconFallback.style.display = 'none';
                    };
                    
                    const showObject = () => {
                      const iframe = document.querySelector('iframe[title="PDF Preview"]') as HTMLElement;
                      const objectFallback = document.querySelector('.pdf-object-fallback') as HTMLElement;
                      const iconFallback = document.querySelector('.pdf-icon-fallback') as HTMLElement;
                      
                      if (iframe && iframe.style) iframe.style.display = 'none';
                      if (objectFallback && objectFallback.style) objectFallback.style.display = 'block';
                      if (iconFallback && iconFallback.style) iconFallback.style.display = 'none';
                    };
                    
                    const showIconFallback = () => {
                      const iframe = document.querySelector('iframe[title="PDF Preview"]') as HTMLElement;
                      const objectFallback = document.querySelector('.pdf-object-fallback') as HTMLElement;
                      const iconFallback = document.querySelector('.pdf-icon-fallback') as HTMLElement;
                      
                      if (iframe && iframe.style) iframe.style.display = 'none';
                      if (objectFallback && objectFallback.style) objectFallback.style.display = 'none';
                      if (iconFallback && iconFallback.style) iconFallback.style.display = 'flex';
                    };
                    
                    // Show a dialog with buttons for each method
                    const dialogContent = document.createElement('div');
                    dialogContent.innerHTML = `
                      <div style="padding: 16px; display: flex; flex-direction: column; gap: 8px;">
                        <button id="btn-iframe">Try iframe</button>
                        <button id="btn-object">Try object tag</button>
                        <button id="btn-icon">Show icon fallback</button>
                        <button id="btn-close">Close</button>
                      </div>
                    `;
                    const dialog = document.createElement('dialog');
                    dialog.appendChild(dialogContent);
                    document.body.appendChild(dialog);
                    
                    // Add event listeners
                    dialog.querySelector('#btn-iframe')?.addEventListener('click', showIframe);
                    dialog.querySelector('#btn-object')?.addEventListener('click', showObject);
                    dialog.querySelector('#btn-icon')?.addEventListener('click', showIconFallback);
                    dialog.querySelector('#btn-close')?.addEventListener('click', () => dialog.close());
                    
                    dialog.showModal();
                  }}
                >
                  Debug PDF
                </Button>
              </Box>
            )} */}
            
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
        ) : mediaFile.fileExtension &&
          ["doc", "docx"].includes(mediaFile.fileExtension.toLowerCase()) ? (
          // Word document
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
        ) : mediaFile.fileExtension &&
          ["xls", "xlsx"].includes(mediaFile.fileExtension.toLowerCase()) ? (
          // Excel document
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
        ) : (
          // Generic file
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
        )}
      </Box>
      
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

  const handleSave = async (updatedMediaFile: Partial<MediaFile>) => {
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
          console.log(`Field "${field.name}" (${field.type}):`, 
            updatedMediaFile.customFields?.[field.name]);
        });
      }
      
      // Extract only the properties we need to update
      const updatePayload = {
        _id: mediaId,
        id: mediaId, // Include both ID formats
        slug: mediaSlug, // Include the slug for the API endpoint
        title: updatedMediaFile.title,
        metadata: {
          // Keep existing metadata values
          ...(mediaFile.metadata || {}),
          // Update with new values
          fileName: updatedMediaFile.fileName,
          altText: updatedMediaFile.altText,
          description: updatedMediaFile.description,
          visibility: updatedMediaFile.visibility,
          tags: updatedMediaFile.tags,
        }
      };
      
      // Add each custom field individually to ensure they're properly included
      if (updatedMediaFile.customFields && Object.keys(updatedMediaFile.customFields).length > 0) {
        Object.entries(updatedMediaFile.customFields).forEach(([key, value]) => {
          if (key && value !== undefined) {
            // Check if it's a MediaType field
            const isMediaTypeField = mediaTypeConfig?.fields.some(field => field.name === key);
            if (isMediaTypeField) {
              console.log(`Adding MediaType field "${key}" with value:`, value);
              // @ts-ignore - We're dynamically adding properties
              updatePayload.metadata[key] = value;
            }
          }
        });
      }
      
      console.log('Final update payload:', updatePayload);
      
      // Call the Redux action to update the media file
      const resultAction = await dispatch(updateMedia(updatePayload));
      
      if (updateMedia.fulfilled.match(resultAction)) {
        // Update was successful, update local state with the returned data
        const updatedData = resultAction.payload;
        console.log('Update successful, server returned:', updatedData);
        
        // Inspect metadata from server response
        console.log('Server returned metadata:', updatedData.metadata);
        
        // Examine specific custom fields in server response
        if (mediaTypeConfig) {
          mediaTypeConfig.fields.forEach(field => {
            console.log(`Checking if "${field.name}" is in server response:`, 
              updatedData.metadata?.[field.name]);
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
          
          // Ensure custom fields from the form are explicitly included
          if (updatedMediaFile.customFields) {
            mediaTypeConfig?.fields.forEach(field => {
              const fieldValue = updatedMediaFile.customFields?.[field.name];
              if (fieldValue !== undefined) {
                combinedMetadata[field.name] = fieldValue;
              }
            });
          }
          
          // Log the combined metadata for debugging
          console.log('Combined metadata after update:', combinedMetadata);
          
          // Return a new media file object with the updated data
          return {
            ...prevState,
            ...updatedData,
            // Ensure metadata is properly updated
            metadata: combinedMetadata
          };
        });
        
        toast.success('Media updated successfully');
      } else if (updateMedia.rejected.match(resultAction)) {
        // Handle specific error if available
        const errorMsg = resultAction.payload ? String(resultAction.payload) : 'Update failed';
        throw new Error(errorMsg);
      }
    } catch (error) {
      console.error('Error updating media:', error);
      toast.error('Failed to update media: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
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