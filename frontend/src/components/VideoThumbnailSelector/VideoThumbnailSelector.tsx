import React, { useState, useRef, useEffect } from 'react';
import {
  Box,
  Slider,
  IconButton,
  Typography,
  Button,
  CircularProgress
} from '@mui/material';
import {
  PlayArrow,
  Pause,
  PhotoCamera
} from '@mui/icons-material';
import axios from 'axios';
import env from '../../config/env';
import './VideoThumbnailSelector.scss';
import { toast } from 'react-toastify';

interface VideoThumbnailSelectorProps {
  videoUrl: string;
  mediaId: string;
  currentThumbnail?: string;
  onThumbnailUpdate: (thumbnailUrl: string, mediaData?: any) => void;
}

interface ThumbnailResponse {
  thumbnailUrl: string;
  mediaFile?: {
    _id: string;
    id: string;
    title: string;
    metadata: {
      v_thumbnail: string;
      v_thumbnailTimestamp?: string;
      [key: string]: any;
    };
  };
}

// Define a proper type for the server response
interface ThumbnailUpdateResponse {
  thumbnailUrl: string;
  mediaFile?: any;
  success: boolean;
  message?: string;
}

/**
 * Helper function to clean thumbnail URL and add consistent cache-busting
 * @param url - The thumbnail URL to format
 * @param mediaId - The media ID to use as a stable cache key
 * @param forceRefresh - Whether to force a refresh with a timestamp (default: false)
 */
const formatThumbnailUrl = (url: string, mediaId: string, forceRefresh = false): string => {
  if (!url) return '';
  // Remove any existing query parameters
  const cleanUrl = url.split('?')[0];
  
  // For initial rendering or stable display, use just the mediaId as cache key
  // For explicit refresh actions (like after updating thumbnail), add timestamp
  if (forceRefresh) {
    return `${cleanUrl}?id=${mediaId}&t=${Date.now()}`;
  } else {
    return `${cleanUrl}?id=${mediaId}`;
  }
};

const VideoThumbnailSelector: React.FC<VideoThumbnailSelectorProps> = ({
  videoUrl,
  mediaId,
  currentThumbnail,
  onThumbnailUpdate
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isSliding, setIsSliding] = useState(false);
  const [refreshKey, setRefreshKey] = useState(Date.now()); // For forcing re-renders
  const [retryCount, setRetryCount] = useState(0); // Add retry counter for error handling
  const [isPaused, setIsPaused] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [thumbnailUrl, setThumbnailUrl] = useState<string | undefined>(currentThumbnail);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleLoadedMetadata = () => {
      setDuration(video.duration);
      // Ensure video is ready for frame display
      video.currentTime = 0;
    };

    const handleTimeUpdate = () => {
      if (!isSliding) {
        setCurrentTime(video.currentTime);
      }
    };

    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    video.addEventListener('timeupdate', handleTimeUpdate);

    return () => {
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      video.removeEventListener('timeupdate', handleTimeUpdate);
    };
  }, [isSliding]);

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleSliderChange = (_event: Event, newValue: number | number[]) => {
    const time = newValue as number;
    if (videoRef.current) {
      videoRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  const handleSliderDragStart = () => {
    setIsSliding(true);
    if (isPlaying) {
      videoRef.current?.pause();
      setIsPlaying(false);
    }
  };

  const handleSliderDragEnd = () => {
    setIsSliding(false);
    // Ensure we maintain the current frame
    if (videoRef.current) {
      videoRef.current.currentTime = currentTime;
    }
  };

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const formatTimestamp = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleThumbnailCapture = async () => {
    if (!videoRef.current || !mediaId) return;

    // Pause the video before capturing
    videoRef.current.pause();
    setIsPlaying(false); // Update isPlaying state when pausing

    try {
      setIsLoading(true);
      // Get the current timestamp in MM:SS format
      const timestamp = formatTimestamp(videoRef.current.currentTime);
      
      // Send request to server to generate and update thumbnail
      const response = await axios.post<ThumbnailUpdateResponse>(
        `${env.BASE_URL}/media/thumbnail/${mediaId}`,
        { timestamp },
        { withCredentials: true }
      );

      if (response.data && response.data.thumbnailUrl) {
        // Clean the URL by removing any cache parameters
        const cleanUrl = response.data.thumbnailUrl.split('?')[0];
        
        // Use the clean URL for state updates
        setThumbnailUrl(cleanUrl);
        
        // Reset the refresh key to force component update
        setRefreshKey(Date.now());
        
        // Always pass the clean URL to parent components
        // Let them handle cache-busting as needed
        if (onThumbnailUpdate) {
          // Force refresh with timestamp when notifying parent
          const refreshedUrl = formatThumbnailUrl(cleanUrl, mediaId, true);
          onThumbnailUpdate(refreshedUrl, response.data.mediaFile);
        }

        toast.success('Thumbnail updated successfully!');
      } else {
        toast.error('Failed to update thumbnail. Please try again.');
      }
    } catch (error) {
      toast.error('Error updating thumbnail. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Format current thumbnail URL consistently
  const displayThumbnailUrl = currentThumbnail 
    ? formatThumbnailUrl(currentThumbnail, mediaId, false)
    : '';

  return (
    <Box className="video-thumbnail-selector" key={refreshKey}>
      <Box className="video-container">
        <video
          ref={videoRef}
          src={videoUrl}
          style={{ width: '100%', maxHeight: '300px' }}
          playsInline
        />
      </Box>

      <Box className="controls">
        <IconButton onClick={togglePlay}>
          {isPlaying ? <Pause /> : <PlayArrow />}
        </IconButton>

        <Box sx={{ flex: 1, mx: 2 }}>
          <Slider
            value={currentTime}
            max={duration}
            onChange={handleSliderChange}
            onMouseDown={handleSliderDragStart}
            onMouseUp={handleSliderDragEnd}
            onTouchStart={handleSliderDragStart}
            onTouchEnd={handleSliderDragEnd}
            aria-label="Video progress"
          />
          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <Typography variant="caption">
              {formatTime(currentTime)}
            </Typography>
            <Typography variant="caption">
              {formatTime(duration)}
            </Typography>
          </Box>
        </Box>

        <Button
          variant="contained"
          startIcon={isProcessing ? <CircularProgress size={20} /> : <PhotoCamera />}
          onClick={handleThumbnailCapture}
          disabled={isProcessing}
        >
          Set Thumbnail
        </Button>
      </Box>

      {currentThumbnail && (
        <Box className="current-thumbnail">
          <Typography variant="subtitle2" gutterBottom>
            Current Thumbnail
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
            <img
              src={displayThumbnailUrl}
              alt="Video thumbnail"
              style={{ maxWidth: '160px', borderRadius: '4px', border: '1px solid #ddd' }}
            />
            {currentThumbnail.includes(mediaId) ? (
              <Typography variant="caption" color="success.main" sx={{ mt: 0.5 }}>
                Thumbnail includes media ID (unique to this video)
              </Typography>
            ) : (
              <Typography variant="caption" color="warning.main" sx={{ mt: 0.5 }}>
                Legacy thumbnail - click "Set Thumbnail" to update
              </Typography>
            )}
          </Box>
        </Box>
      )}
    </Box>
  );
};

export default VideoThumbnailSelector; 