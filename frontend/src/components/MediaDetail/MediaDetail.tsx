import React, { useEffect, useState } from "react";
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
import { useSelector } from "react-redux";
import { RootState } from "../../store/store";
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useUsername } from '../../hooks/useUsername';
import env from '../../config/env';
import { 
  FaFileAudio, 
  FaFilePdf, 
  FaFileWord, 
  FaFileExcel, 
  FaFile, 
  FaDownload,
} from 'react-icons/fa';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import EditIcon from '@mui/icons-material/Edit';
import MediaInformation from './MediaInformation';
import { EditMediaDialog } from './EditMediaDialog';


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


// Add this interface near the other interfaces
interface MediaTypeField {
  name: string;
  type: string;
  required?: boolean;
  options?: string[];
  [key: string]: any;
}

interface MediaTypeConfig {
  fields: MediaTypeField[];
  name: string;
  baseType?: string;
  [key: string]: any;
}

// Remove unused interface
// interface ExtendedMediaFile extends BaseMediaFile { ... }

const MediaDetail: React.FC = () => {
  // All state hooks first
  const { slug } = useParams();
  const [mediaFile, setMediaFile] = useState<BaseMediaFile | null>(null);
  const [mediaTypeConfig, setMediaTypeConfig] = useState<MediaTypeConfig | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const mediaTypes = useSelector((state: RootState) => state.mediaTypes.mediaTypes);
  const navigate = useNavigate();
  const { username: uploaderUsername, loading: uploaderLoading } = useUsername(mediaFile?.uploadedBy);
  const userRole = useSelector((state: RootState) => state.user.currentUser.role);
  const isMobile = useMediaQuery((theme: Theme) => theme.breakpoints.down('sm'));
  
  // Function to get base schema fields
  const getBaseSchemaFields = (): Record<string, any> => {
    if (!mediaFile || !mediaFile.__t) return {};

    // Handle different base types with their fields
    switch (mediaFile.__t) {
      case 'BaseImage':
        return {
          imageWidth: { type: 'Number', required: true },
          imageHeight: { type: 'Number', required: true },
          resolution: { type: 'Number' },
          colorSpace: { type: 'Text' },
          orientation: { type: 'Text' },
          hasAlpha: { type: 'Boolean' }
        };
      case 'BaseVideo':
        return {
          duration: { type: 'Number' },
          frameRate: { type: 'Number' },
          width: { type: 'Number' },
          height: { type: 'Number' },
          codec: { type: 'Text' },
          aspectRatio: { type: 'Text' },
          hasAudio: { type: 'Boolean' },
          audioCodec: { type: 'Text' }
        };
      case 'BaseAudio':
        return {
          duration: { type: 'Number' },
          sampleRate: { type: 'Number' },
          bitRate: { type: 'Number' },
          channels: { type: 'Number' },
          codec: { type: 'Text' }
        };
      case 'BaseDocument':
        return {
          pageCount: { type: 'Number' },
          author: { type: 'Text' },
          creationDate: { type: 'Date' }
        };
      default:
        return {};
    }
  };

  // Get base fields based on the file type
  const baseFields = getBaseSchemaFields();



  useEffect(() => {
    const fetchMediaFile = async () => {
      try {
        const response = await axios.get<BaseMediaFile>(
          `${env.BASE_URL}/media/slug/${slug}`
        );
        console.log('Fetched media file:', response.data);
        setMediaFile(response.data);
      } catch (error) {
        console.error("Error fetching media file:", error);
        toast.error("Failed to load media file");
      } finally {
        setLoading(false);
      }
    };

    if (slug) {
      fetchMediaFile();
    }
  }, [slug]);

  // Update mediaTypeConfig when mediaFile changes
  useEffect(() => {
    if (mediaFile && mediaTypes.length > 0) {
      const config = mediaTypes.find(type => type.name === mediaFile.mediaType);
      setMediaTypeConfig(config || null);
    }
  }, [mediaFile, mediaTypes]);

  const handleSave = async (data: Partial<MediaFile>) => {
    if (!mediaFile) return;

    try {
      console.log('Received form data:', data);

      // Transform form data to API format
      const apiData = {
        title: data.title || '',
        metadata: {
          fileName: data.fileName || '',
          altText: data.altText || '',
          description: data.description || '',
          visibility: data.visibility || 'public',
          tags: data.tags || [],
          ...data.customFields
        }
      };
      console.log('Transformed for API:', apiData);

      // Check if any data actually changed
      const hasChanged = 
        apiData.title !== mediaFile.title ||
        apiData.metadata.fileName !== mediaFile.metadata?.fileName ||
        apiData.metadata.altText !== mediaFile.metadata?.altText ||
        apiData.metadata.description !== mediaFile.metadata?.description ||
        apiData.metadata.visibility !== mediaFile.metadata?.visibility ||
        JSON.stringify(apiData.metadata.tags) !== JSON.stringify(mediaFile.metadata?.tags);

      if (!hasChanged) {
        console.log('No changes detected. Skipping save operation.');
        setIsEditing(false);
        return;
      }

      const response = await axios.put<BaseMediaFile>(
        `${env.BASE_URL}/media/update/${mediaFile.slug}`,
        apiData,
        {
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          }
        }
      );

      if (response.status === 200 && response.data) {
        // Update the local state with the new data
        const updatedMediaFile = {
          ...mediaFile,
          title: data.title || '',
          metadata: {
            fileName: data.fileName || '',
            altText: data.altText || '',
            description: data.description || '',
            visibility: data.visibility || 'public',
            tags: data.tags || [],
            ...data.customFields
          }
        };

        console.log('Updating local state:', data);
        setMediaFile(updatedMediaFile);
        setIsEditing(false);
        toast.success('Media file updated successfully');
      } else {
        throw new Error('Failed to update media file');
      }
    } catch (error: any) {
      console.error('Update failed:', error);
      toast.error(`Update failed: ${error.message || 'Unknown error'}`);
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <CircularProgress />
      </Box>
    );
  }

  if (!mediaFile) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <Typography color="error">Error loading media file.</Typography>
      </Box>
    );
  }

  // Convert BaseMediaFile to MediaFile type for the EditMediaDialog
  const mediaFileForEdit: MediaFile = {
    id: mediaFile._id,
    title: mediaFile.title || '',
    fileName: mediaFile.metadata?.fileName || '',
    visibility: mediaFile.metadata?.visibility as 'public' | 'private',
    altText: mediaFile.metadata?.altText || '',
    description: mediaFile.metadata?.description || '',
    tags: Array.isArray(mediaFile.metadata?.tags) ? [...mediaFile.metadata.tags] : [],
    customFields: {
      // Map webinar fields first
      'Webinar Title': mediaFile.metadata?.['Webinar Title'] || '',
      'Webinar Summary': mediaFile.metadata?.['Webinar Summary'] || '',
      'Webinar CTA': mediaFile.metadata?.['Webinar CTA'] || '',
      // Then spread the rest of metadata, excluding standard fields
      ...Object.entries(mediaFile.metadata || {}).reduce((acc, [key, value]) => {
        if (!['fileName', 'altText', 'description', 'visibility', 'tags'].includes(key)) {
          acc[key] = value;
        }
        return acc;
      }, {} as Record<string, any>)
    },
    fileType: mediaFile.fileExtension,
    fileSize: mediaFile.fileSize,
    uploadDate: mediaFile.modifiedDate,
    url: mediaFile.location
  };

  console.log('MediaDetail - Preparing edit form with data:', {
    originalFile: mediaFile,
    originalMetadata: mediaFile.metadata,
    mappedData: mediaFileForEdit,
    originalTags: mediaFile.metadata?.tags,
    hasMetadata: !!mediaFile.metadata,
    metadataKeys: mediaFile.metadata ? Object.keys(mediaFile.metadata) : [],
    customFields: mediaFileForEdit.customFields
  });

  // Convert MediaTypeConfig to MediaType for the EditMediaDialog
  const mediaTypeForEdit: MediaType = mediaTypeConfig ? {
    id: mediaTypeConfig._id,
    name: mediaTypeConfig.name,
    description: mediaTypeConfig.description || '',
    fields: mediaTypeConfig.fields.map(field => ({
      name: field.name,
      label: field.name,
      type: field.type.toLowerCase(),
      required: field.required || false,
      options: field.options || []
    })),
    acceptedFileTypes: mediaTypeConfig.acceptedFileTypes || [],
    defaultTags: mediaTypeConfig.defaultTags || []
  } : {
    id: '',
    name: '',
    fields: [],
    acceptedFileTypes: []
  };

  // Motion animation adjusted for mobile
  const motionProps = {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
    transition: { duration: isMobile ? 0.3 : 0.5 }
  };

  return (
    <motion.div
      className="media-detail-container"
      {...motionProps}
    >
      <Button 
        className="back-button" 
        onClick={() => navigate('/media-library')} 
        variant="outlined"
        size={isMobile ? "small" : "medium"}
      >
        <ArrowBackIcon fontSize={isMobile ? "small" : "medium"} />
      </Button>
      <Box className="media-detail">
        <Box className="media-preview">
          <Box className="media-preview-header">
            <Typography variant="body2"><span>Media Type:</span> <span style={{ color: mediaTypes.find(type => type.name === mediaFile.mediaType)?.catColor || '#999' }}> {mediaFile.mediaType}</span></Typography>
            
            <Box className="size-container">
              <Typography variant="body2">Size:<span> {formatFileSize(mediaFile.fileSize || 0)}</span></Typography>
            </Box>
            <Box className="updated-date">
              <Typography variant="body2">Uploaded on:<span> {new Date(mediaFile.modifiedDate).toLocaleDateString()}</span></Typography>
            </Box>
            <Box className="uploaded-by">
              <Typography variant="body2">Uploaded by:<span> {uploaderLoading ? 'Loading...' : uploaderUsername}</span></Typography>
            </Box>
          </Box>
          <Box className="media-preview-media">
            {mediaFile.fileExtension && ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp'].includes(mediaFile.fileExtension.toLowerCase()) ? (
              // Image preview
              <img src={mediaFile.location} alt={mediaFile.metadata?.altText || ''} />
            ) : mediaFile.fileExtension && ['mp4', 'webm', 'ogg', 'mov'].includes(mediaFile.fileExtension.toLowerCase()) ? (
              // Video preview
              <Box sx={{ width: '100%', height: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', background: '#000' }}>
                <video 
                  controls 
                  autoPlay={false}
                  style={{ width: '100%', maxHeight: isMobile ? '300px' : '600px' }} 
                  poster={mediaFile.metadata?.v_thumbnail} 
                >
                  <source src={mediaFile.location} type={`video/${mediaFile.fileExtension === 'mov' ? 'quicktime' : mediaFile.fileExtension.toLowerCase()}`} />
                  Your browser does not support the video tag.
                </video>
              </Box>
            ) : (mediaTypeConfig?.baseType === 'BaseVideo' || mediaFile.__t === 'BaseVideo') ? (
              // Fallback for videos when file extension is not recognized
              <Box sx={{ width: '100%', height: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', background: '#000' }}>
                <video 
                  controls 
                  autoPlay={false}
                  style={{ width: '100%', maxHeight: isMobile ? '300px' : '600px' }} 
                  poster={mediaFile.metadata?.v_thumbnail} 
                >
                  <source src={mediaFile.location} />
                  Your browser does not support the video tag.
                </video>
              </Box>
            ) : mediaFile.fileExtension && ['mp3', 'wav', 'ogg', 'aac', 'flac'].includes(mediaFile.fileExtension.toLowerCase()) ? (
              // Audio preview
              <Box sx={{ width: '100%', p: isMobile ? 2 : 3, display: 'flex', justifyContent: 'center', alignItems: 'center', flexDirection: 'column' }}>
                <Box sx={{ mb: isMobile ? 1 : 2, fontSize: isMobile ? '2rem' : '3rem', color: 'primary.main' }}>
                  <FaFileAudio />
                </Box>
                <audio controls style={{ width: '100%' }}>
                  <source src={mediaFile.location} type={`audio/${mediaFile.fileExtension.toLowerCase()}`} />
                  Your browser does not support the audio tag.
                </audio>
              </Box>
            ) : mediaFile.fileExtension === 'pdf' ? (
              // PDF preview
              <Box sx={{ width: '100%', p: isMobile ? 2 : 3, display: 'flex', justifyContent: 'center', alignItems: 'center', flexDirection: 'column' }}>
                <Box sx={{ mb: isMobile ? 1 : 2, fontSize: isMobile ? '2rem' : '3rem', color: 'error.main' }}>
                  <FaFilePdf />
                </Box>
                <iframe 
                  src={`${mediaFile.location}#toolbar=0&navpanes=0`}
                  title={mediaFile.title || 'PDF Document'}
                  style={{ width: '100%', height: isMobile ? '300px' : '600px', border: 'none' }}
                />
              </Box>
            ) : mediaFile.fileExtension && ['doc', 'docx'].includes(mediaFile.fileExtension.toLowerCase()) ? (
              // Word document (no preview, just icon)
              <Box sx={{ width: '100%', p: isMobile ? 2 : 3, display: 'flex', justifyContent: 'center', alignItems: 'center', flexDirection: 'column' }}>
                <Box sx={{ mb: isMobile ? 1 : 2, fontSize: isMobile ? '2rem' : '3rem', color: 'primary.main' }}>
                  <FaFileWord />
                </Box>
                <Typography variant={isMobile ? "body2" : "body1"}>
                  This is a Word document. Please download to view.
                </Typography>
                <Button 
                  variant="contained" 
                  color="primary" 
                  startIcon={<FaDownload />}
                  onClick={() => window.open(mediaFile.location, '_blank')}
                  sx={{ mt: isMobile ? 1 : 2 }}
                  size={isMobile ? "small" : "medium"}
                >
                  Download Document
                </Button>
              </Box>
            ) : mediaFile.fileExtension && ['xls', 'xlsx'].includes(mediaFile.fileExtension.toLowerCase()) ? (
              // Excel document (no preview, just icon)
              <Box sx={{ width: '100%', p: isMobile ? 2 : 3, display: 'flex', justifyContent: 'center', alignItems: 'center', flexDirection: 'column' }}>
                <Box sx={{ mb: isMobile ? 1 : 2, fontSize: isMobile ? '2rem' : '3rem', color: 'success.main' }}>
                  <FaFileExcel />
                </Box>
                <Typography variant={isMobile ? "body2" : "body1"}>
                  This is an Excel spreadsheet. Please download to view.
                </Typography>
                <Button 
                  variant="contained" 
                  color="primary" 
                  startIcon={<FaDownload />}
                  onClick={() => window.open(mediaFile.location, '_blank')}
                  sx={{ mt: isMobile ? 1 : 2 }}
                  size={isMobile ? "small" : "medium"}
                >
                  Download Spreadsheet
                </Button>
              </Box>
            ) : (
              // Generic file (no preview, just icon)
              <Box sx={{ width: '100%', p: isMobile ? 2 : 3, display: 'flex', justifyContent: 'center', alignItems: 'center', flexDirection: 'column' }}>
                <Box sx={{ mb: isMobile ? 1 : 2, fontSize: isMobile ? '2rem' : '3rem', color: 'text.secondary' }}>
                  <FaFile />
                </Box>
                <Typography variant={isMobile ? "body2" : "body1"}>
                  {mediaFile.fileExtension 
                    ? `This is a ${mediaFile.fileExtension.toUpperCase()} file. Please download to view.` 
                    : 'File preview not available.'}
                </Typography>
                <Button 
                  variant="contained" 
                  color="primary" 
                  startIcon={<FaDownload />}
                  onClick={() => window.open(mediaFile.location, '_blank')}
                  sx={{ mt: isMobile ? 1 : 2 }}
                  size={isMobile ? "small" : "medium"}
                >
                  Download File
                </Button>
              </Box>
            )}
          </Box>
          <Box className="media-preview-footer">
            <Box className="tags-container">
              Tags: {mediaFile.metadata?.tags && mediaFile.metadata.tags.length > 0 ? (
                <>
                  {/* Sort tags to display default tags first */}
                  {(mediaFile.metadata.tags).sort((a, b) => {
                    const aIsDefault = mediaTypeForEdit.defaultTags?.includes(a) || false;
                    const bIsDefault = mediaTypeForEdit.defaultTags?.includes(b) || false;
                    if (aIsDefault === bIsDefault) return 0;
                    return aIsDefault ? -1 : 1;
                  }).map((tag, index) => {
                    const isDefaultTag = mediaTypeForEdit.defaultTags?.includes(tag);
                    return (
                      <Chip 
                        key={index} 
                        size="small" 
                        label={tag}
                        className={isDefaultTag ? "default-tag" : "custom-tag"}
                      />
                    );
                  })}
                </>
              ) : (
                <Typography variant="body2" sx={{ opacity: 0.6, fontStyle: 'italic' }}>No tags</Typography>
              )}
            </Box>
            <Box className="media-actions">
              <Box className="action-buttons">
                <Button
                  variant="contained"
                  color="primary"
                  startIcon={<FaDownload />}
                  onClick={() => window.open(mediaFile.location, '_blank')}
                  size={isMobile ? "small" : "medium"}
                >
                  Download
                </Button>
                
                {(userRole === 'admin' || userRole === 'superAdmin') && (
                  <Button 
                    variant="outlined" 
                    color="primary" 
                    startIcon={<EditIcon />}
                    onClick={() => setIsEditing(true)}
                    size={isMobile ? "small" : "medium"}
                  >
                    Edit
                  </Button>
                )}
              </Box>
            </Box>
          </Box>
        </Box>

        {mediaFile && (
          <div className="media-information-container">
            <MediaInformation 
              mediaFile={mediaFile} 
              mediaTypeConfig={mediaTypeConfig} 
              baseFields={baseFields} 
              getMetadataField={getMetadataField} 
            />
          </div>
        )}

        {mediaTypeConfig && (
          <EditMediaDialog
            open={isEditing}
            onClose={() => setIsEditing(false)}
            mediaFile={mediaFileForEdit}
            mediaType={mediaTypeForEdit}
            onSave={handleSave}
          />
        )}
      </Box>
      
      <ToastContainer position="top-center" />
    </motion.div>
  );
};

export default MediaDetail;