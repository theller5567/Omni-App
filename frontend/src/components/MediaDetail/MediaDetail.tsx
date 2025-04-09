import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { 
  Box, 
  Button, 
  CircularProgress, 
  Chip, 
  Typography,
} from "@mui/material";
import axios from "axios";
import { BaseMediaFile } from "../../interfaces/MediaFile";
import { MediaFile, MediaType } from "../../types/media";
import { motion } from 'framer-motion';
import { formatFileSize } from "../../utils/formatFileSize";
import "./mediaDetail.scss";
import { useSelector } from "react-redux";
import { RootState } from "../../store/store";
import { toast } from 'react-toastify';
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
import EditMediaDialog from './EditMediaDialog';
import { MediaFormData, ApiMediaData, transformFormToApiData, createLogger } from '../../types/mediaTypes';

// Create a logger instance for this component
const logger = createLogger('MediaDetail');

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

  const handleSave = async (formData: MediaFormData) => {
    if (!mediaFile) return;

    try {
      logger.formData('Received form data', formData);

      // Transform form data to API format
      const apiData = transformFormToApiData(formData);
      logger.apiData('Transformed for API', apiData);

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

      // Transform server response to ApiMediaData format before logging
      const transformedResponse: ApiMediaData = {
        title: response.data.title,
        metadata: {
          ...response.data.metadata,
          fileName: response.data.metadata?.fileName || '',
          tags: response.data.metadata?.tags || [],
          visibility: (response.data.metadata?.visibility || 'public') as 'public' | 'private'
        }
      };

      logger.apiData('Server response', transformedResponse);

      if (response.status === 200 && response.data) {
        // Update the local state with the new data
        const updatedMediaFile = {
          ...mediaFile,
          title: formData.title,
          metadata: {
            fileName: formData.fileName,
            altText: formData.altText,
            description: formData.description,
            visibility: formData.visibility,
            tags: formData.tags,
            ...formData.customFields
          }
        };

        logger.formData('Updating local state', formData);
        setMediaFile(updatedMediaFile);
        setIsEditing(false);
        toast.success('Media file updated successfully');
      } else {
        throw new Error('Failed to update media file');
      }
    } catch (error: any) {
      logger.error('Update failed', error);
      
      if (error.response?.status === 404) {
        toast.error('Media file not found. Please refresh the page.');
      } else {
        toast.error(`Failed to update media file: ${error.response?.data?.error || error.message}`);
      }
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
    acceptedFileTypes: mediaTypeConfig.acceptedFileTypes || []
  } : {
    id: '',
    name: '',
    fields: [],
    acceptedFileTypes: []
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="media-detail-container"
    >
      <Button 
        className="back-button" 
        onClick={() => navigate(-1)} 
        variant="outlined"
      >
        <ArrowBackIcon />
      </Button>
      <Box className="media-detail">
        <Box className="media-preview">
          <Box className="media-preview-header">
            <Typography variant="body2">Media Type:<span> {mediaFile.mediaType}</span></Typography>
            
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
                  style={{ width: '100%', maxHeight: '600px' }} 
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
                  style={{ width: '100%', maxHeight: '600px' }} 
                  poster={mediaFile.metadata?.v_thumbnail} 
                >
                  <source src={mediaFile.location} />
                  Your browser does not support the video tag.
                </video>
              </Box>
            ) : mediaFile.fileExtension && ['mp3', 'wav', 'ogg', 'aac', 'flac'].includes(mediaFile.fileExtension.toLowerCase()) ? (
              // Audio preview
              <Box sx={{ width: '100%', p: 3, display: 'flex', justifyContent: 'center', alignItems: 'center', flexDirection: 'column' }}>
                <Box sx={{ mb: 2, fontSize: '3rem', color: 'primary.main' }}>
                  <FaFileAudio />
                </Box>
                <audio controls style={{ width: '100%' }}>
                  <source src={mediaFile.location} type={`audio/${mediaFile.fileExtension.toLowerCase()}`} />
                  Your browser does not support the audio tag.
                </audio>
              </Box>
            ) : mediaFile.fileExtension === 'pdf' ? (
              // PDF preview
              <Box sx={{ width: '100%', p: 3, display: 'flex', justifyContent: 'center', alignItems: 'center', flexDirection: 'column' }}>
                <Box sx={{ mb: 2, fontSize: '3rem', color: 'error.main' }}>
                  <FaFilePdf />
                </Box>
                <iframe 
                  src={`${mediaFile.location}#toolbar=0&navpanes=0`}
                  title={mediaFile.title || 'PDF Document'}
                  style={{ width: '100%', height: '600px', border: 'none' }}
                />
              </Box>
            ) : mediaFile.fileExtension && ['doc', 'docx'].includes(mediaFile.fileExtension.toLowerCase()) ? (
              // Word document (no preview, just icon)
              <Box sx={{ width: '100%', p: 3, display: 'flex', justifyContent: 'center', alignItems: 'center', flexDirection: 'column' }}>
                <Box sx={{ mb: 2, fontSize: '3rem', color: 'primary.main' }}>
                  <FaFileWord />
                </Box>
                <Typography variant="body1">
                  This is a Word document. Please download to view.
                </Typography>
                <Button 
                  variant="contained" 
                  color="primary" 
                  startIcon={<FaDownload />}
                  onClick={() => window.open(mediaFile.location, '_blank')}
                  sx={{ mt: 2 }}
                >
                  Download Document
                </Button>
              </Box>
            ) : mediaFile.fileExtension && ['xls', 'xlsx'].includes(mediaFile.fileExtension.toLowerCase()) ? (
              // Excel document (no preview, just icon)
              <Box sx={{ width: '100%', p: 3, display: 'flex', justifyContent: 'center', alignItems: 'center', flexDirection: 'column' }}>
                <Box sx={{ mb: 2, fontSize: '3rem', color: 'success.main' }}>
                  <FaFileExcel />
                </Box>
                <Typography variant="body1">
                  This is an Excel spreadsheet. Please download to view.
                </Typography>
                <Button 
                  variant="contained" 
                  color="primary" 
                  startIcon={<FaDownload />}
                  onClick={() => window.open(mediaFile.location, '_blank')}
                  sx={{ mt: 2 }}
                >
                  Download Spreadsheet
                </Button>
              </Box>
            ) : (
              // Generic file (no preview, just icon)
              <Box sx={{ width: '100%', p: 3, display: 'flex', justifyContent: 'center', alignItems: 'center', flexDirection: 'column' }}>
                <Box sx={{ mb: 2, fontSize: '3rem', color: 'text.secondary' }}>
                  <FaFile />
                </Box>
                <Typography variant="body1">
                  {mediaFile.fileExtension 
                    ? `This is a ${mediaFile.fileExtension.toUpperCase()} file. Please download to view.` 
                    : 'File preview not available.'}
                </Typography>
                <Button 
                  variant="contained" 
                  color="primary" 
                  startIcon={<FaDownload />}
                  onClick={() => window.open(mediaFile.location, '_blank')}
                  sx={{ mt: 2 }}
                >
                  Download File
                </Button>
              </Box>
            )}
          </Box>
          <Box className="media-preview-footer">
            <Box className="tags-container">
              Tags: {mediaFile.metadata?.tags?.map((tag, index) => (
                <Chip key={index} size="small" label={tag} sx={{ backgroundColor: 'var(--accent-color)', fontSize: '0.8rem', padding: '0px', color: 'var(--background-color)', marginRight: '0.5rem' }}/>
              ))}
            </Box>
            <Box className="media-actions">
            <Box className="action-buttons">
              <Button
                variant="contained"
                color="primary"
                startIcon={<FaDownload />}
                onClick={() => window.open(mediaFile.location, '_blank')}
              >
                Download
              </Button>
              
              {(userRole === 'admin' || userRole === 'superAdmin') && (
                <Button 
                  variant="outlined" 
                  color="primary" 
                  startIcon={<EditIcon />}
                  onClick={() => setIsEditing(true)}
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
    </motion.div>
  );
};

export default MediaDetail;