import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  Box,
  Slider,
  IconButton,
  Typography,
  Button,
  CircularProgress,
  Alert,
  Fade
} from '@mui/material';
import {
  PlayArrow,
  Pause,
  PhotoCamera,
  ErrorOutline,
  CheckCircle,
  AccessTime,
  ArrowForward,
  FastForward,
  FastRewind,
  Replay
} from '@mui/icons-material';
import './VideoThumbnailSelector.scss';
import axios from 'axios';
import env from '../../config/env';
import { toast } from 'react-toastify';

interface MediaDetailThumbnailSelectorProps {
  videoUrl: string;
  mediaId: string;
  currentThumbnail?: string;
  onThumbnailUpdate: (thumbnailUrl: string) => void;
  mediaData?: any; // Optional complete media data from parent
  onClose?: () => void; // Optional close handler for dialog mode
}

interface ThumbnailResponse {
  success?: boolean;
  message?: string;
  timestamp?: string;
  thumbnailUrl?: string;
  mediaFile?: any;
}

const MediaDetailThumbnailSelector: React.FC<MediaDetailThumbnailSelectorProps> = ({
  videoUrl,
  mediaId,
  currentThumbnail,
  onThumbnailUpdate,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isSliding, setIsSliding] = useState(false);
  const [seekTime, setSeekTime] = useState<number | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [refreshKey, setRefreshKey] = useState<string | number>(0);
  const [isVideoLoading, setIsVideoLoading] = useState(true);
  const [videoError, setVideoError] = useState<string | null>(null);
  const [thumbnailUpdated, setThumbnailUpdated] = useState(false);
  const [showSuccessIndicator, setShowSuccessIndicator] = useState(false);
  const [processingProgress, setProcessingProgress] = useState(0);
  const [oldThumbnail, setOldThumbnail] = useState<string | null>(null);
  const [showOverlay, setShowOverlay] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    video.src = videoUrl;
    setIsVideoLoading(true);
    setVideoError(null);

    const handleLoadedMetadata = () => {
      setDuration(video.duration);
      setIsVideoLoading(false);
      video.currentTime = 0;
    };

    const handleTimeUpdate = () => {
      if (!isSliding) {
        setCurrentTime(video.currentTime);
      }
    };

    const handleSeeked = () => {
      setCurrentTime(video.currentTime);
      video.pause();
      setIsPlaying(false);
    };

    const handleError = (_e: Event) => {
      setVideoError('Failed to load video. Please check the URL and your connection.');
      setIsVideoLoading(false);
    };

    const handleLoadStart = () => {
      setIsVideoLoading(true);
    };

    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('seeked', handleSeeked);
    video.addEventListener('error', handleError);
    video.addEventListener('loadstart', handleLoadStart);

    video.load();

    return () => {
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('seeked', handleSeeked);
      video.removeEventListener('error', handleError);
      video.removeEventListener('loadstart', handleLoadStart);
      video.src = '';
    };
  }, [videoUrl]);

  useEffect(() => {
    if (seekTime !== null && videoRef.current) {
      videoRef.current.currentTime = seekTime;
    }
  }, [seekTime]);

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        try {
          const playPromise = videoRef.current.play();
          if (playPromise !== undefined) {
            playPromise.catch(error => {
              setVideoError(`Error playing video: ${error.message}`);
            });
          }
        } catch (error) {
          setVideoError(`Error playing video: ${error instanceof Error ? error.message : String(error)}`);
        }
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

  const handleStepForward = () => {
    if (videoRef.current) {
      const newTime = Math.min(currentTime + 1, duration);
      videoRef.current.currentTime = newTime;
      setCurrentTime(newTime);
    }
  };

  const handleStepBackward = () => {
    if (videoRef.current) {
      const newTime = Math.max(currentTime - 1, 0);
      videoRef.current.currentTime = newTime;
      setCurrentTime(newTime);
    }
  };

  const resetToStart = () => {
    if (videoRef.current) {
      videoRef.current.currentTime = 0;
      setCurrentTime(0);
      videoRef.current.pause();
      setIsPlaying(false);
    }
  };

  const simulateProgress = () => {
    let progress = 0;
    const interval = setInterval(() => {
      progress += Math.random() * 15;
      if (progress > 100) {
        progress = 100;
        clearInterval(interval);
      }
      setProcessingProgress(progress);
    }, 200);

    return () => clearInterval(interval);
  };

  const sendTimestampToServer = async (timestamp: string) => {
    try {
      // Save the old thumbnail URL to potentially show a comparison
      if (currentThumbnail) {
        setOldThumbnail(currentThumbnail);
      }
      
      setIsProcessing(true);
      setThumbnailUpdated(false);
      setShowOverlay(false);
      
      // Start progress simulation
      const stopProgressSimulation = simulateProgress();
      
      const response = await axios.post<ThumbnailResponse>(
        `${env.BASE_URL}/media/update/timestamp-thumbnail/${mediaId}`,
        { timestamp },
        { 
          withCredentials: true,
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('authToken')}`
          }
        }
      );
      
      // Stop progress simulation
      stopProgressSimulation();
      setProcessingProgress(100);
      
      if (response.data.success && response.data.thumbnailUrl) {
        const originalS3Url = response.data.thumbnailUrl;
        
        const timeValue = Date.now();
        const uniqueId = `${timeValue}`;
        
        setRefreshKey(uniqueId);
        setThumbnailUpdated(true);
        
        // Notify parent component about the update
        onThumbnailUpdate(originalS3Url);
        
        // Show success indicator
        setShowSuccessIndicator(true);
        setTimeout(() => setShowSuccessIndicator(false), 3000);
        
        // Reset video to beginning and show overlay
        resetToStart();
        setTimeout(() => {
          setShowOverlay(true);
        }, 300);
        
        // Toast notification is now handled by parent component
      } else {
        toast.error('Failed to update thumbnail: No URL returned');
      }
    } catch (error) {
      toast.error('Error updating thumbnail');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCaptureThumbnail = () => {
    const timestamp = formatTime(currentTime);
    sendTimestampToServer(timestamp);
  };

  const handleHideOverlay = () => {
    setShowOverlay(false);
  };

  const displayThumbnailUrl = useMemo(() => {
    if (!currentThumbnail) return undefined;
    
    // If already a proxied URL, just use it directly
    if (currentThumbnail.includes('/thumbnail-proxy/')) {
      return currentThumbnail;
    }
    
    // Extract base URL without query parameters
    const baseUrl = currentThumbnail.split('?')[0];
    
    // Create a timestamp that changes only when refreshKey changes
    // This prevents multiple requests during renders
    const uniqueId = `${refreshKey}`;
    
    return `${baseUrl}?nocache=${uniqueId}`;
  }, [currentThumbnail, refreshKey]);

  const retryVideoLoad = () => {
    if (videoRef.current) {
      setVideoError(null);
      setIsVideoLoading(true);
      videoRef.current.load();
    }
  };

  return (
    <Box
      className="video-thumbnail-selector media-detail-mode"
      key={refreshKey}
    >
      <Box className="video-container">
        {videoError && (
          <Box className="video-error">
            <Alert
              severity="error"
              icon={<ErrorOutline />}
              action={
                <Button color="inherit" size="small" onClick={retryVideoLoad}>
                  Retry
                </Button>
              }
            >
              {videoError}
            </Alert>
          </Box>
        )}

        {isVideoLoading && !videoError && (
          <Box className="video-loading">
            <CircularProgress size={40} />
            <Typography variant="body2" sx={{ mt: 2 }}>
              Loading video...
            </Typography>
          </Box>
        )}

        <video
          ref={videoRef}
          style={{
            width: "100%",
            maxHeight: "300px",
            display: videoError ? "none" : "block",
          }}
          playsInline
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
        />
        
        {showOverlay && displayThumbnailUrl && (
          <Box 
            className="thumbnail-overlay"
            onClick={handleHideOverlay}
            sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
              zIndex: 10,
            }}
          >
            <img 
              src={displayThumbnailUrl}
              alt="New thumbnail"
              style={{
                maxWidth: '80%',
                maxHeight: '70%',
                objectFit: 'contain',
                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.5)',
                border: '2px solid white',
                borderRadius: '4px',
              }}
            />
            <Typography 
              variant="body2" 
              sx={{ 
                color: 'white', 
                mt: 2, 
                backgroundColor: 'rgba(0, 0, 0, 0.7)',
                px: 2,
                py: 0.5,
                borderRadius: '4px',
                display: 'flex',
                alignItems: 'center',
              }}
            >
              <CheckCircle fontSize="small" sx={{ mr: 1, color: '#4caf50' }} />
              New thumbnail set - Click to dismiss
            </Typography>
          </Box>
        )}
      </Box>

      <Box className="controls">
        <IconButton
          onClick={togglePlay}
          disabled={!!videoError || isVideoLoading}
        >
          {isPlaying ? <Pause /> : <PlayArrow />}
        </IconButton>

        <IconButton
          onClick={handleStepBackward}
          disabled={!!videoError || isVideoLoading || currentTime <= 0}
        >
          <FastRewind fontSize="small" />
        </IconButton>

        <Box sx={{ flex: 1, mx: 2 }}>
          <Slider
            value={currentTime}
            max={duration || 100}
            onChange={handleSliderChange}
            onMouseDown={handleSliderDragStart}
            onMouseUp={handleSliderDragEnd}
            onTouchStart={handleSliderDragStart}
            onTouchEnd={handleSliderDragEnd}
            aria-label="Video progress"
            disabled={!!videoError || isVideoLoading}
          />
          <Box sx={{ display: "flex", justifyContent: "space-between" }}>
            <Typography variant="caption">{formatTime(currentTime)}</Typography>
            <Typography variant="caption">{formatTime(duration)}</Typography>
          </Box>
        </Box>

        <IconButton
          onClick={handleStepForward}
          disabled={!!videoError || isVideoLoading || currentTime >= duration}
        >
          <FastForward fontSize="small" />
        </IconButton>
        
        <IconButton
          onClick={resetToStart}
          disabled={!!videoError || isVideoLoading}
          sx={{ mr: 1 }}
          title="Return to start"
        >
          <Replay fontSize="small" />
        </IconButton>

        <Button
          variant="contained"
          startIcon={
            isProcessing ? (
              <CircularProgress size={16} color="inherit" />
            ) : (
              <PhotoCamera />
            )
          }
          onClick={handleCaptureThumbnail}
          disabled={isProcessing || !!videoError || isVideoLoading}
        >
          {isProcessing
            ? `Processing ${Math.round(processingProgress)}%`
            : "Set Thumbnail"}
        </Button>
      </Box>

      {displayThumbnailUrl && (
        <div className="video-footer-container">
          <Box className="current-thumbnail">
            <Box className="thumbnail-wrapper">
              <Typography variant="subtitle2" gutterBottom>
                Current Thumbnail
              </Typography>
              <img
                key={`thumbnail-${refreshKey}`}
                src={displayThumbnailUrl}
                alt="Video thumbnail"
                style={{
                  maxWidth: "160px",
                  borderRadius: "4px",
                  transition: "border 0.3s ease-in-out",
                }}
                className={thumbnailUpdated ? "thumbnail-updated" : ""}
                onError={(e) => {
                  const img = e.target as HTMLImageElement;
                  const baseUrl = img.src.split("?")[0];

                  const retryTimestamp = Date.now();
                  const randomId = Math.random().toString(36).substring(2, 8);
                  img.src = `${baseUrl}?reload=${retryTimestamp}&r=${randomId}`;
                }}
              />
              {isProcessing && (
                <Box
                  sx={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: "rgba(0, 0, 0, 0.5)",
                    borderRadius: "4px",
                  }}
                >
                  <CircularProgress
                    size={40}
                    variant="determinate"
                    value={processingProgress}
                    color="primary"
                    sx={{ color: "white" }}
                  />
                </Box>
              )}
              <Fade in={showSuccessIndicator}>
                <Box
                  className={`success-indicator ${
                    showSuccessIndicator ? "visible" : ""
                  }`}
                >
                  <CheckCircle fontSize="small" />
                </Box>
              </Fade>
            </Box>

            {oldThumbnail && thumbnailUpdated && (
              <Fade in={thumbnailUpdated}>
                <Box className="thumbnail_old_new">
                  <Box className="thumbnail-timestamp">
                    <AccessTime fontSize="small" />
                    <Typography variant="caption" color="textSecondary">
                      {formatTime(currentTime)}
                    </Typography>
                  </Box>
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      mt: 2,
                      opacity: 0.7,
                    }}
                  >
                    {/* Use a stable URL for the old thumbnail to avoid multiple requests */}
                    <img
                      src={oldThumbnail.includes('?') ? oldThumbnail : `${oldThumbnail}?v=old`}
                      alt="Previous thumbnail"
                      style={{
                        width: "60px",
                        marginRight: "8px",
                        border: "1px solid #ddd",
                        borderRadius: "2px",
                        opacity: 0.7,
                      }}
                    />
                    <ArrowForward
                      sx={{ mx: 1, fontSize: 16, color: "text.secondary" }}
                    />
                    {/* Use the same displayThumbnailUrl for consistency */}
                    <img
                      src={displayThumbnailUrl}
                      alt="New thumbnail"
                      style={{
                        width: "60px",
                        border: "1px solid var(--accent-color)",
                        borderRadius: "2px",
                      }}
                    />
                  </Box>
                </Box>
              </Fade>
            )}
          </Box>
        </div>
      )}
    </Box>
  );
};

export default MediaDetailThumbnailSelector; 