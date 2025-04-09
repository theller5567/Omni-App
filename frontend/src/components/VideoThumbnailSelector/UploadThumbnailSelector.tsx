import React, { useState, useRef, useEffect } from 'react';
import {
  Box,
  Slider,
  IconButton,
  Typography,
  Button,
} from '@mui/material';
import {
  PlayArrow,
  Pause,
  PhotoCamera
} from '@mui/icons-material';
import './VideoThumbnailSelector.scss';

interface UploadThumbnailSelectorProps {
  videoUrl: string;
  onThumbnailSelect: (timestamp: string) => void;
  currentThumbnail?: string;
}

const UploadThumbnailSelector: React.FC<UploadThumbnailSelectorProps> = ({
  videoUrl,
  onThumbnailSelect,
  currentThumbnail
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isSliding, setIsSliding] = useState(false);
  const [seekTime, setSeekTime] = useState<number | null>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleLoadedMetadata = () => {
      console.log('Video metadata loaded, duration:', video.duration);
      setDuration(video.duration);
      // Ensure video is ready for frame display
      video.currentTime = 0;
    };

    const handleTimeUpdate = () => {
      if (!isSliding) {
        setCurrentTime(video.currentTime);
      }
    };

    const handleSeeked = () => {
      console.log('Video seeked to:', video.currentTime);
      // Update current time after seeking
      setCurrentTime(video.currentTime);
      // Pause the video after seeking to maintain frame
      video.pause();
      setIsPlaying(false);
    };

    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('seeked', handleSeeked);

    // Load the video
    video.src = videoUrl;
    video.load();

    return () => {
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('seeked', handleSeeked);
      video.src = '';
    };
  }, [videoUrl]);

  useEffect(() => {
    // Handle seeking when seekTime changes
    if (seekTime !== null && videoRef.current) {
      videoRef.current.currentTime = seekTime;
    }
  }, [seekTime]);

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
    setCurrentTime(time);
    setSeekTime(time);
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

  const handleCaptureThumbnail = () => {
    if (!videoRef.current) return;
    
    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx?.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    console.log('Capturing thumbnail at time:', currentTime);
    onThumbnailSelect(formatTime(currentTime));
  };

  return (
    <Box className="video-thumbnail-selector upload-mode">
      <Box className="video-container">
        <video
          ref={videoRef}
          style={{ width: '100%', maxHeight: '300px' }}
          playsInline
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
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
          startIcon={<PhotoCamera />}
          onClick={handleCaptureThumbnail}
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

export default UploadThumbnailSelector; 