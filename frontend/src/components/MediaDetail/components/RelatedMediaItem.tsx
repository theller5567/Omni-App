import React, { useState, useEffect } from 'react';
import { Box, Typography, CircularProgress, Paper } from '@mui/material';
import { RelatedMedia } from '../../MediaUploader/types';
import axios from 'axios';
import { BaseMediaFile } from '../../../interfaces/MediaFile';
import env from '../../../config/env';
import { useNavigate } from 'react-router-dom';

interface RelatedMediaItemProps {
  media: RelatedMedia;
}

const RelatedMediaItem: React.FC<RelatedMediaItemProps> = ({ media }) => {  
  const navigate = useNavigate();
  const [mediaDetails, setMediaDetails] = useState<{ 
    title?: string, 
    location?: string,
    relationship?: string,
    note?: string,
    slug?: string
  }>({
    // Initialize with display info if available
    title: media._display?.title,
    location: media._display?.thumbnail,
    relationship: media.relationship,
    note: media.note
  });
  const [loading, setLoading] = useState(!media._display);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    async function fetchMediaDetails() {
      // Skip API call if we already have display info
      if (media._display?.title && media._display?.thumbnail) {
        setLoading(false);
        return;
      }
      
      if (!media.mediaId) {
        setLoading(false);
        setError('Missing media ID');
        return;
      }
      
      setLoading(true);
      setError(null);
      
      try {
        // Attempt to fetch by slug first
        const response = await axios.get<BaseMediaFile>(`${env.BASE_URL}/api/media/slug/${media.mediaId}`);
        setMediaDetails({
          title: response.data.title || response.data.metadata?.fileName || 'Untitled',
          location: response.data.location,
          relationship: media.relationship,
          note: media.note,
          slug: response.data.slug
        });
      } catch (error: any) {
        // If slug fetch fails (e.g., 404), try fetching by ID as a fallback
        if (error.response && error.response.status === 404) {
        try {
            const fallbackResponse = await axios.get<BaseMediaFile>(`${env.BASE_URL}/api/media/${media.mediaId}`);
          setMediaDetails({
            title: fallbackResponse.data.title || fallbackResponse.data.metadata?.fileName || 'Untitled',
            location: fallbackResponse.data.location,
            relationship: media.relationship,
            note: media.note,
            slug: fallbackResponse.data.slug
          });
        } catch (fallbackError) {
          console.error('Fallback fetch also failed:', fallbackError);
            setError('Failed to load related media');
          }
        } else {
          console.error('Error fetching related media details:', error);
          setError('Failed to load related media');
        }
      } finally {
        setLoading(false);
      }
    }
    
    if (media.mediaId) {
      fetchMediaDetails();
    }
  }, [media.mediaId, media._display, media.relationship, media.note]);

  const handleClick = () => {
    if (mediaDetails.slug) {
      navigate(`/media/slug/${mediaDetails.slug}`);
    } else if (media.mediaId) {
      // If we don't have the slug, try to use the ID directly
      navigate(`/media/${media.mediaId}`);
    }
  };

  if (loading) {
    return (
      <Paper 
        elevation={2} 
        className="related-media-item" 
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          p: 2,
          height: '200px',
          borderRadius: '8px'
        }}
      >
        <CircularProgress size={24} />
      </Paper>
    );
  }

  if (error) {
    return (
      <Paper 
        elevation={2} 
        className="related-media-item" 
        sx={{
          p: 2,
          height: '200px',
          borderRadius: '8px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        <Typography variant="body2" color="error">{error}</Typography>
      </Paper>
    );
  }

  // Get relationship display text
  const getRelationshipText = (relationship?: string) => {
    switch (relationship) {
      case 'parent': return 'Parent of';
      case 'child': return 'Child of';
      case 'version': return 'Version of';
      case 'attachment': return 'Attachment to';
      case 'reference': 
      default: return 'Related to';
    }
  };

  return (
    <Paper 
      elevation={2} 
      className="related-media-item" 
      onClick={handleClick}
      sx={{
        overflow: 'hidden',
        borderRadius: '8px',
        transition: 'transform 0.2s, box-shadow 0.2s',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: '0 6px 12px rgba(0,0,0,0.15)',
          cursor: 'pointer'
        }
      }}
    >
      <Box 
        sx={{ 
          height: '140px', 
          overflow: 'hidden',
          backgroundColor: '#f0f0f0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        {mediaDetails.location ? (
          <img 
            src={mediaDetails.location} 
            alt={mediaDetails.title || 'Related media'} 
            style={{ 
              width: '100%', 
              height: '100%', 
              objectFit: 'cover' 
            }}
          />
        ) : (
          <Typography variant="body2" color="textSecondary">No Preview</Typography>
        )}
      </Box>
      <Box sx={{ p: 1.5 }}>
        <Typography 
          variant="subtitle2" 
          noWrap 
          title={mediaDetails.title}
          sx={{ 
            fontWeight: 'bold',
            mb: 0.5 
          }}
        >
          {mediaDetails.title || 'Untitled media'}
        </Typography>
        <Typography 
          variant="caption" 
          color="textSecondary"
          sx={{
            display: 'block',
            fontSize: '0.7rem',
            opacity: 0.8,
            lineHeight: 1.2
          }}
        >
          {getRelationshipText(mediaDetails.relationship)}
          {mediaDetails.note && (
            <Box component="span" sx={{ display: 'block', fontStyle: 'italic', mt: 0.5 }}>
              "{mediaDetails.note}"
            </Box>
          )}
        </Typography>
      </Box>
    </Paper>
  );
};

export default RelatedMediaItem;
