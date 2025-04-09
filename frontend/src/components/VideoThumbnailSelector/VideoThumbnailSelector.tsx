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

interface VideoThumbnailSelectorProps {
  videoUrl: string;
  mediaId: string;
  currentThumbnail?: string;
  onThumbnailUpdate: (thumbnailUrl: string) => void;
}

interface ThumbnailResponse {
  thumbnailUrl: string;
}

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

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleLoadedMetadata = () => {
      setDuration(video.duration);
    };

    const handleTimeUpdate = () => {
      setCurrentTime(video.currentTime);
    };

    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    video.addEventListener('timeupdate', handleTimeUpdate);

    return () => {
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      video.removeEventListener('timeupdate', handleTimeUpdate);
    };
  }, []);

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

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    return `${h > 0 ? h + ':' : ''}${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const captureThumbnail = async () => {
    if (!videoRef.current) return;

    setIsLoading(true);
    try {
      // Convert current time to timestamp format (HH:MM:SS)
      const timestamp = formatTime(currentTime);

      const response = await axios.post<ThumbnailResponse>(
        `${env.BASE_URL}/api/media/${mediaId}/thumbnail`,
        { timestamp }
      );

      if (response.data.thumbnailUrl) {
        onThumbnailUpdate(response.data.thumbnailUrl);
      }
    } catch (error) {
      console.error('Failed to update thumbnail:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Box className="video-thumbnail-selector">
      <Box className="video-container">
        <video
          ref={videoRef}
          src={videoUrl}
          style={{ width: '100%', maxHeight: '300px' }}
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
          startIcon={isLoading ? <CircularProgress size={20} /> : <PhotoCamera />}
          onClick={captureThumbnail}
          disabled={isLoading}
        >
          Set Thumbnail
        </Button>
      </Box>

      {currentThumbnail && (
        <Box className="current-thumbnail">
          <Typography variant="subtitle2" gutterBottom>
            Current Thumbnail
          </Typography>
          <img
            src={currentThumbnail}
            alt="Video thumbnail"
            style={{ maxWidth: '160px', borderRadius: '4px' }}
          />
        </Box>
      )}
    </Box>
  );
};

export default VideoThumbnailSelector; 