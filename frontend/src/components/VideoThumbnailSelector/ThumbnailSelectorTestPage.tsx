import React, { useState, useEffect, useMemo } from 'react';
import { Box, Typography, Container, Paper, CircularProgress, Alert } from '@mui/material';
import MediaDetailThumbnailSelector from './MediaDetailThumbnailSelector';
import { getProxiedVideoUrl } from '../../utils/videoUtils';
import axios from 'axios';
import env from '../../config/env';
import { useDispatch, useSelector } from 'react-redux';
import { updateMediaLocal } from '../../store/slices/mediaSlice';
import { useParams } from 'react-router-dom';

// Interface for media file data
interface MediaFile {
  _id: string;
  id: string;
  location: string;
  title: string;
  mediaType: string;
  fileExtension: string;
  metadata?: {
    fileName?: string;
    v_thumbnail?: string;
    v_thumbnailTimestamp?: string;
    [key: string]: any;
  };
}

// Function to get proxied thumbnail URL
const getProxiedThumbnailUrl = (s3Url: string): string => {
  if (!s3Url) return '';
  
  const urlParts = s3Url.split('/');
  const filename = urlParts[urlParts.length - 1];
  
  return `${env.BASE_URL}/media/thumbnail-proxy/${filename}`;
};

// Create a media cache object to prevent duplicate requests
const mediaCache: Record<string, MediaFile> = {};

const ThumbnailSelectorTestPage: React.FC = () => {
  // Get ID from URL params or use a default test ID
  const { id } = useParams<{ id: string }>();
  const mediaId = id || '67f6d6ee80ce5846bca45c46'; // Fallback ID for testing
  
  // State management
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedMedia, setSelectedMedia] = useState<MediaFile | null>(null);
  const [currentThumbnail, setCurrentThumbnail] = useState<string>('');
  
  // Add Redux dispatch
  const dispatch = useDispatch();
  
  // Check if we already have this media in Redux store
  const existingMedia = useSelector((state: any) => 
    state.media?.media?.find((m: any) => m._id === mediaId || m.id === mediaId)
  );
  
  // Use memo for the thumbnail URL to prevent unnecessary rerenders and requests
  const thumbnailUrlWithCache = useMemo(() => {
    if (!currentThumbnail) return '';
    
    // Clean URL by removing any query parameters
    const baseUrl = currentThumbnail.split('?')[0];
    
    // Use the proxied URL instead of direct S3 access
    if (baseUrl.includes('.s3.')) {
      const proxyUrl = getProxiedThumbnailUrl(baseUrl);
      // Add cache busting but only once per session
      return `${proxyUrl}?nocache=${Date.now()}`;
    }
    
    return baseUrl;
  }, [currentThumbnail]);
  
  // Fetch only the specific media file we need, with caching
  useEffect(() => {
    const fetchMediaFile = async () => {
      try {
        // If we have this media in the Redux store, use it instead
        if (existingMedia) {
          setSelectedMedia(existingMedia);
          if (existingMedia.metadata?.v_thumbnail) {
            setCurrentThumbnail(existingMedia.metadata.v_thumbnail);
          }
          setLoading(false);
          return;
        }
        
        // Check if we have this media in our local cache
        if (mediaCache[mediaId]) {
          setSelectedMedia(mediaCache[mediaId]);
          if (mediaCache[mediaId].metadata?.v_thumbnail) {
            setCurrentThumbnail(mediaCache[mediaId].metadata.v_thumbnail);
          }
          setLoading(false);
          return;
        }
        
        setLoading(true);
        setError(null);
        
        // Get only the specific media file we need
        const response = await axios.get<MediaFile>(
          `${env.BASE_URL}/media/${mediaId}`,
          { headers: { 'Cache-Control': 'max-age=3600' } } // Add cache control
        );
        
        if (!response.data) {
          setError('Media file not found.');
          return;
        }
        
        const mediaFile = response.data;
        
        // Store in local cache
        mediaCache[mediaId] = mediaFile;
        
        // Check if it's a video file
        const isVideo = mediaFile.fileExtension && 
          ['mp4', 'webm', 'mov', 'ogg'].includes(mediaFile.fileExtension.toLowerCase());
        
        if (!isVideo) {
          setError('Selected file is not a video.');
          return;
        }
        
        setSelectedMedia(mediaFile);
        
        // Set current thumbnail if available
        if (mediaFile.metadata?.v_thumbnail) {
          setCurrentThumbnail(mediaFile.metadata.v_thumbnail);
        }
      } catch (err) {
        setError('Failed to load media file.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchMediaFile();
  }, [mediaId, existingMedia]);

  // Handle thumbnail updates
  const handleThumbnailUpdate = (thumbnailUrl: string, updatedMedia?: any) => {
    // Make sure thumbnailUrl is a clean S3 URL without query parameters
    const cleanS3Url = thumbnailUrl ? thumbnailUrl.split('?')[0] : '';
    
    if (cleanS3Url) {
      // Create a proxied URL for display purposes
      const proxyUrl = getProxiedThumbnailUrl(cleanS3Url);
      
      // Set the thumbnail URL - using the proxied URL to avoid direct S3 calls
      setCurrentThumbnail(proxyUrl);
    }
    
    if (updatedMedia) {
      // Update the selected media object with the ORIGINAL S3 URL
      if (selectedMedia && cleanS3Url) {
        // Get the complete updated media document from MongoDB
        let mediaToUpdate: MediaFile;
        
        if (updatedMedia._id && updatedMedia.metadata) {
          // This is a complete media document from MongoDB
          mediaToUpdate = updatedMedia;
          
          // Update the cache
          mediaCache[mediaId] = mediaToUpdate;
        } else {
          // Create a new media object with the updated metadata
          const updatedMetadata = {
            ...selectedMedia.metadata,
            v_thumbnail: cleanS3Url
          };
          
          // Add timestamp if it exists in the server response
          if (updatedMedia.metadata?.v_thumbnailTimestamp) {
            updatedMetadata.v_thumbnailTimestamp = updatedMedia.metadata.v_thumbnailTimestamp;
          }
          
          // Create a new media object with the updated metadata
          mediaToUpdate = {
            ...selectedMedia,
            metadata: updatedMetadata
          };
          
          // Update the cache
          mediaCache[mediaId] = mediaToUpdate;
        }
        
        // Update the selected media state
        setSelectedMedia(mediaToUpdate);
        
        // Update the media in Redux store 
        dispatch(updateMediaLocal(mediaToUpdate as any));
      }
    }
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 2, mb: 2 }}>
      <Paper 
        elevation={2} 
        sx={{ 
          p: 2, 
          mb: 2,
          borderRadius: '8px',
          overflow: 'hidden'
        }}
      >
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        ) : selectedMedia ? (
          <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
              <Typography variant="h6" sx={{ fontWeight: 500, fontSize: '1.1rem' }}>
                {selectedMedia.metadata?.fileName || selectedMedia.title || 'Untitled Video'}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {selectedMedia.fileExtension.toUpperCase()}
              </Typography>
            </Box>
            
            <MediaDetailThumbnailSelector
              videoUrl={getProxiedVideoUrl(selectedMedia.location, selectedMedia._id)}
              mediaId={selectedMedia._id}
              currentThumbnail={thumbnailUrlWithCache}
              onThumbnailUpdate={handleThumbnailUpdate}
            />
          </Box>
        ) : (
          <Alert severity="warning">
            No video file found. Please select a valid video.
          </Alert>
        )}
      </Paper>
    </Container>
  );
};

export default ThumbnailSelectorTestPage; 