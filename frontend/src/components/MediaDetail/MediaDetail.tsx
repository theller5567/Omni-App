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
        {/* Add Action Buttons to Header */}
        <Box sx={{ 
          marginLeft: 'auto', 
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
              onClick={onEdit}
              size={isMobile ? "small" : "medium"}
              sx={{ 
                padding: isMobile ? '4px 8px' : '6px 12px',
                minWidth: isMobile ? 'auto' : '64px'
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
    setIsEditing(true);
  };

  const handleSave = async (updatedMediaFile: Partial<MediaFile>) => {
    if (!mediaFile) return;
    
    try {
      // Get required identifiers from the media file
      const mediaId = mediaFile._id || mediaFile.id || '';
      const mediaSlug = mediaFile.slug || '';
      
      // Extract only the properties we need to update
      const updatePayload = {
        _id: mediaId,
        id: mediaId, // Include both ID formats
        slug: mediaSlug, // Include the slug for the API endpoint
        title: updatedMediaFile.title,
        metadata: {
          fileName: updatedMediaFile.fileName,
          altText: updatedMediaFile.altText,
          description: updatedMediaFile.description,
          visibility: updatedMediaFile.visibility,
          tags: updatedMediaFile.tags,
        }
      };
      
      console.log('Sending update with payload:', updatePayload);
      
      // Call the Redux action to update the media file
      const resultAction = await dispatch(updateMedia(updatePayload));
      
      if (updateMedia.fulfilled.match(resultAction)) {
        // Update was successful, update local state with the returned data
        const updatedData = resultAction.payload;
        setMediaFile(prevState => {
          if (!prevState) return null;
          
          return {
            ...prevState,
            ...updatedData
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

  // Prepare the media file for the edit dialog
  const mediaFileForEdit = mediaFile ? {
    id: mediaFile._id || mediaFile.id || '',
    title: mediaFile.title || '',
    fileName: getMetadataField(mediaFile, 'fileName', mediaFile.title),
    altText: getMetadataField(mediaFile, 'altText', ''),
    description: getMetadataField(mediaFile, 'description', ''),
    visibility: getMetadataField(mediaFile, 'visibility', 'private'),
    tags: getMetadataField(mediaFile, 'tags', []),
    customFields: {} as Record<string, any>,
    fileType: mediaFile.fileExtension || '',
    url: mediaFile.location || ''
  } : null;

  // Find the media type based on the mediaFile
  const mediaTypeForEdit = mediaTypeConfig;

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
    </motion.div>
  );
};

export default MediaDetail;