import React, { useState, useEffect } from 'react';
import { 
  Paper, 
  Typography, 
  List, 
  ListItem, 
  ListItemAvatar, 
  ListItemText, 
  Avatar,
  Divider,
  Box, 
  Chip,
  Button,
  FormControlLabel,
  Checkbox,
  CircularProgress
} from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import PersonIcon from '@mui/icons-material/Person';
import SettingsIcon from '@mui/icons-material/Settings';
import RefreshIcon from '@mui/icons-material/Refresh';
import { FaTag } from 'react-icons/fa';
import { Link } from 'react-router-dom';
import { 
  useActivityLogs, 
  useAllUsers, 
  useTransformedMedia, 
  User as UserType, 
  TransformedMediaFile 
} from '../../hooks/query-hooks';

// ActivityLog interface - ensure this matches the data from fetchActivityLogs
interface ActivityLog {
  _id: string; // Assuming API returns _id
  userId?: string; // Optional if system activities don't have a user
  username?: string;
  action: string;
  details?: string;
  targetType?: string; // e.g., 'media', 'user', 'mediaType'
  targetId?: string;
  targetSlug?: string; // If API provides a direct slug for the target
  ip?: string;
  userAgent?: string;
  timestamp: string;
  mediaSlug?: string;
  mediaTitle?: string;
  resourceType?: string;
}

const RecentActivity: React.FC = () => {
  const [disableMock, setDisableMock] = useState(false);
  const [displayError, setDisplayError] = useState<string | null>(null);

  // Use TanStack Query hooks
  const { 
    data: activityLogs = [], // Assuming useActivityLogs directly returns ActivityLog[]
    isLoading: isLoadingActivities,
    isError: isActivitiesError,
    error: activitiesError,
    refetch,
    isRefetching
  } = useActivityLogs(20); // Fetch latest 20, or make configurable

  const { 
    data: allUsers = [], 
    isLoading: isLoadingUsers 
  } = useAllUsers();
  
  const { 
    data: allMedia = [], 
    isLoading: isLoadingMedia 
  } = useTransformedMedia();

  useEffect(() => {
    if (isActivitiesError && activitiesError) {
      const errorMessage = activitiesError instanceof Error 
        ? activitiesError.message 
        : typeof activitiesError === 'string' ? activitiesError : 'Failed to load activity logs'; // Handle non-Error objects
      setDisplayError(errorMessage);
    } else {
      setDisplayError(null);
    }
  }, [isActivitiesError, activitiesError]);

  // Process activities (enrichment, filtering) once all data is available
  const processedActivities = React.useMemo(() => {
    let logs: ActivityLog[] = activityLogs || []; // Use activityLogs directly
    // For now, just return the fetched logs directly, assuming backend provides sufficient info
    return logs;
  }, [activityLogs, allMedia, allUsers]);


  // Function to create mock data for fallback (Simplified - needs careful review)
  const createMockData = (): ActivityLog[] => {
    if (disableMock) return [];
    let counter = 0;
    const generateUniqueId = (prefix: string) => `${prefix}-${Date.now()}-${counter++}-${Math.random().toString(36).substring(2, 9)}`;
    
    const mockActivities: ActivityLog[] = [];

    // User for mock data
    const mockUser = allUsers.length > 0 ? allUsers[0] : ({ _id: 'mock-user-1', id: 'mock-user-1', username: 'mockUser' } as UserType); // Cast to UserType
    const mockMedia = allMedia.length > 0 ? allMedia[0] : ({ _id: 'mock-media-1', id: 'mock-media-1', title: 'Mock Media Title', slug: 'mock-media-slug' } as TransformedMediaFile); // Cast to TransformedMediaFile

    if (!isLoadingActivities && !isLoadingUsers && !isLoadingMedia) {
        mockActivities.push({
            _id: generateUniqueId('mock-upload'),
            userId: mockUser._id,
            username: mockUser.username,
            action: 'UPLOAD',
            details: `Uploaded ${mockMedia.title || 'a new file'}`,
            targetType: 'media',
            targetId: mockMedia._id,
            targetSlug: mockMedia.slug,
            timestamp: new Date(Date.now() - 1000 * 60 * 5).toISOString()
        });
        // Add more mock activities as needed
    }
    return mockActivities;
  };

  const finalActivities: ActivityLog[] = (activityLogs && activityLogs.length > 0) 
                          ? processedActivities 
                          : (isLoadingActivities || isLoadingUsers || isLoadingMedia) ? [] : createMockData();

  const handleRefresh = () => {
    refetch();
  };

  const handleToggleMock = (event: React.ChangeEvent<HTMLInputElement>) => {
    setDisableMock(event.target.checked);
  };

  const getActionIcon = (action: string, resourceType?: string) => {
    switch (action.toUpperCase()) {
      case 'UPLOAD':
      case 'CREATE':
        return resourceType === 'media' ? <CloudUploadIcon /> : <FaTag />;
      case 'DELETE':
        return <DeleteIcon />;
      case 'EDIT':
      case 'UPDATE':
        return <EditIcon />;
      case 'LOGIN':
      case 'REGISTER':
      case 'PROFILE_UPDATE':
        return <PersonIcon />;
      default:
        return <SettingsIcon />;
    }
  };

  const getAvatarColor = (action: string) => {
    // ... (keep existing logic or simplify)
    switch (action.toUpperCase()) {
        case 'UPLOAD': case 'CREATE': return 'primary.main';
        case 'DELETE': return 'error.main';
        case 'EDIT': case 'UPDATE': return 'info.main';
        case 'LOGIN': case 'REGISTER': case 'PROFILE_UPDATE': return 'success.main';
        default: return 'grey.500';
    }
  };

  const renderActivityDetails = (activity: ActivityLog) => {
    // Debug: log the full activity object
    console.log('RecentActivity: activity object', activity);
    let details = activity.details || activity.action;
    let changedFields: string[] = [];
    let mainDetails = details;
    let mediaLink: string | null = null;
    let mediaLabel: string | null = null;

    {
      // Support both camelCase and lowercase field names
      const mediaSlug = activity.mediaSlug || (activity as any)['mediaslug'];
      const mediaTitle = activity.mediaTitle || (activity as any)['mediatitle'];
      // Debug: log the resolved mediaSlug and mediaTitle
      console.log('RecentActivity: resolved mediaSlug', mediaSlug, 'mediaTitle', mediaTitle);
      if (activity.resourceType === 'media' && mediaSlug && mediaTitle) {
        let displayTextBefore = '';
        if (activity.action === 'UPLOAD') {
          displayTextBefore = 'Uploaded media file: ';
        } else if (activity.action === 'EDIT' || activity.action === 'UPDATE') {
          displayTextBefore = 'Updated media file: ';
        } else if (activity.action.toLowerCase().includes('thumbnail')) {
          displayTextBefore = 'Updated video thumbnail for ';
        }
        // Extract changed fields if present in details
        if (typeof details === 'string' && details.includes('(') && details.includes(')')) {
          const match = details.match(/\(([^)]+)\)/);
          if (match && match[1]) {
            changedFields = match[1].split(',').map(f => f.trim());
          }
        }
        return (
          <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
            <Typography variant="body2" component="span" noWrap sx={{ mr: 1 }}>
              {displayTextBefore}
              <Link to={`/media/slug/${mediaSlug}`} style={{ textDecoration: 'underline', color: '#1976d2', fontWeight: 500 }}>
                {mediaTitle}
              </Link>
            </Typography>
            {changedFields.length > 0 && (
              <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                {changedFields.map((field, idx) => (
                  <Chip key={field + idx} label={field} size="small" color="info" variant="outlined" />
                ))}
              </Box>
            )}
          </Box>
        );
      }
    }

    // If details is a string and contains changed fields in parentheses, extract them
    if (typeof details === 'string' && details.includes('(') && details.includes(')')) {
      const match = details.match(/\(([^)]+)\)/);
      if (match && match[1]) {
        changedFields = match[1].split(',').map(f => f.trim());
        // Remove the fields portion from the main details
        mainDetails = details.replace(/\s*\([^)]+\)/, '').trim();
      }
    }

    // Only create a link for specific actions (UPLOAD, UPDATE (media), UPDATE VIDEO THUMBNAIL)
    const actionType = (activity.action || '').toUpperCase();
    let foundTitle: string = '';
    let foundMedia: TransformedMediaFile | undefined;
    let shouldTryUpdateLink = false;
    let displayTextBefore = '';
    let displayTextAfter = '';
    // Always link for upload actions
    if (actionType === 'UPLOAD') {
      if (activity.targetSlug) {
        mediaLink = `/media/slug/${activity.targetSlug}`;
        foundMedia = allMedia.find(m => m.slug === activity.targetSlug);
        mediaLabel = foundMedia?.title || foundMedia?.metadata?.fileName || 'Media File';
        displayTextBefore = 'Uploaded media file: ';
      } else if (activity.targetId) {
        foundMedia = allMedia.find(m => m._id === activity.targetId || m.id === activity.targetId);
        if (foundMedia && foundMedia.slug) {
          mediaLink = `/media/slug/${foundMedia.slug}`;
          mediaLabel = foundMedia.title || foundMedia.metadata?.fileName || 'Media File';
          displayTextBefore = 'Uploaded media file: ';
        }
      } else if (details.startsWith('Uploaded media file:')) {
        foundTitle = details.split(':').pop()?.trim() || '';
        foundMedia = allMedia.find(
          m => (m.title && m.title.toLowerCase() === foundTitle.toLowerCase()) ||
               (m.metadata?.fileName && m.metadata.fileName.toLowerCase() === foundTitle.toLowerCase())
        );
        if (foundMedia && foundMedia.slug) {
          mediaLink = `/media/slug/${foundMedia.slug}`;
          mediaLabel = foundTitle;
          displayTextBefore = 'Uploaded media file: ';
        }
      }
    } else {
      if (typeof details === 'string') {
        if (details.startsWith('Updated media file:')) {
          foundTitle = details.split(':').pop()?.trim() || '';
          shouldTryUpdateLink = true;
          displayTextBefore = 'Updated media file: ';
        } else if (details.toLowerCase().includes('updated video thumbnail')) {
          // Remove timestamp and extract media title
          // Example: 'Updated video thumbnail at timestamp 00:01:29 for VWR Bead Mill Max - Plant'
          // Should become: 'Updated video thumbnail for <LINK>VWR Bead Mill Max - Plant</LINK>'
          const forIdx = details.toLowerCase().lastIndexOf(' for ');
          if (forIdx !== -1) {
            foundTitle = details.substring(forIdx + 5).trim();
            shouldTryUpdateLink = true;
            // Always display 'Updated video thumbnail for ' (remove timestamp)
            displayTextBefore = 'Updated video thumbnail for ';
          }
        }
        if (shouldTryUpdateLink && foundTitle) {
          foundMedia = allMedia.find(
            m => (m.title && m.title.toLowerCase() === foundTitle.toLowerCase()) ||
                 (m.metadata?.fileName && m.metadata.fileName.toLowerCase() === foundTitle.toLowerCase())
          );
          if (foundMedia && foundMedia.slug) {
            mediaLink = `/media/slug/${foundMedia.slug}`;
            mediaLabel = foundTitle;
          }
        }
      }
    }

    return (
      <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
        {/* Main details text */}
        <Typography variant="body2" component="span" noWrap sx={{ mr: 1 }}>
          {mediaLink && mediaLabel ? (
            <>
              {displayTextBefore}
              <Link to={mediaLink} style={{ textDecoration: 'underline', color: '#1976d2', fontWeight: 500 }}>
                {mediaLabel}
              </Link>
              {displayTextAfter}
            </>
          ) : (
            mainDetails
          )}
        </Typography>
        {/* Changed fields as Chips */}
        {changedFields.length > 0 && (
          <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
            {changedFields.map((field, idx) => (
              <Chip key={field + idx} label={field} size="small" color="info" variant="outlined" />
            ))}
          </Box>
        )}
      </Box>
    );
  };

  const formatRelativeTime = (timestamp: string) => {
    // ... (keep existing logic)
    const date = new Date(timestamp);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return `${diffInSeconds}s ago`;
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d ago`;
    return date.toLocaleDateString();
  };

  if (isLoadingActivities || isLoadingUsers || isLoadingMedia) {
    return (
      <Paper sx={{ padding: 2, textAlign: 'center', minHeight: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <CircularProgress />
        <Typography sx={{ ml: 2 }}>Loading recent activities...</Typography>
      </Paper>
    );
  }

  // const testAuthentication = async () => { ... }; // This can be removed or adapted if still needed

  return (
    <Paper elevation={2} sx={{ p: 2, minHeight: 300 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
        <Typography variant="h6">Recent Activity</Typography>
        <Box>
           <FormControlLabel 
            control={<Checkbox checked={disableMock} onChange={handleToggleMock} size="small" />} 
            label={<Typography variant="caption">Disable Fallback Data</Typography>}
            sx={{mr: 1}}
          />
          <Button 
            onClick={handleRefresh} 
            startIcon={isRefetching ? <CircularProgress size={16} color="inherit" /> : <RefreshIcon />}
            disabled={isRefetching || isLoadingActivities}
            size="small"
            variant="outlined"
          >
            Refresh
          </Button>
        </Box>
      </Box>
      {displayError && (
        <Typography color="error" sx={{ mb: 2 }}>Error: {displayError}</Typography>
      )}
      {finalActivities.length === 0 && !displayError && (
        <Typography sx={{ textAlign: 'center', py: 3 }}>No recent activity found.</Typography>
      )}
      <List dense>
        {finalActivities.map((activity: ActivityLog, index: number) => { // Added types for activity and index
          const user = activity.userId ? allUsers.find(u => u._id === activity.userId) : null;
          const userDisplayName = user?.username || activity.username || 'System';
          // const avatarText = user?.firstName && user?.lastName 
          //                   ? `${user.firstName[0]}${user.lastName[0]}` 
          //                   : userDisplayName.substring(0, 1).toUpperCase();

          return (
            <React.Fragment key={activity._id || index}>
              <ListItem alignItems="flex-start">
                <ListItemAvatar>
                  <Avatar sx={{ bgcolor: getAvatarColor(activity.action), width: 36, height: 36 }}>
                    {getActionIcon(activity.action, activity.resourceType)}
                  </Avatar>
                </ListItemAvatar>
                <ListItemText
                  primary={renderActivityDetails(activity)}
                  secondary={
                    <Typography variant="caption" color="textSecondary">
                      By: {userDisplayName} - {formatRelativeTime(activity.timestamp)}
                    </Typography>
                  }
                />
              </ListItem>
              {index < finalActivities.length - 1 && <Divider variant="inset" component="li" />}
            </React.Fragment>
          );
        })}
      </List>
    </Paper>
  );
};

export default RecentActivity;