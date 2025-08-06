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
  useUserProfile,
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
  mediaSlug?: string; // CamelCase from interface
  mediaTitle?: string; // CamelCase from interface
  mediaslug?: string; // Optional: lowercase version from potential API inconsistency
  mediatitle?: string; // Optional: lowercase version from potential API inconsistency
  resourceType?: string;
  tagName?: string;
  tagCategoryName?: string;
  resourceName?: string; // Added for fallback category name
}

const RecentActivity: React.FC = () => {
  const [displayError, setDisplayError] = useState<string | null>(null);

  // Get user profile
  const { data: userProfile } = useUserProfile();

  // Use TanStack Query hooks
  const { 
    data: activityLogs = [], // Assuming useActivityLogs directly returns ActivityLog[]
    isLoading: isLoadingActivities,
    isError: isActivitiesError,
    error: activitiesError,
    refetch,
    isRefetching
  } = useActivityLogs(userProfile, 20); // Pass userProfile, Fetch latest 20

  const { 
    data: allUsers = [], 
    isLoading: isLoadingUsers 
  } = useAllUsers();
  
  const { 
    data: allMedia = [], 
    isLoading: isLoadingMedia 
  } = useTransformedMedia(userProfile); // Pass userProfile, implicitly uses 'All' for mediaTypeId

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
    const logs: ActivityLog[] = activityLogs || []; // Use const
    // For now, just return the fetched logs directly, assuming backend provides sufficient info
    return logs;
  }, [activityLogs]);

  const finalActivities: ActivityLog[] = (activityLogs && activityLogs.length > 0) 
                          ? processedActivities 
                          : []; // Simplified: show processed or empty, no mock, no loading check needed here as UI handles loading

  const handleRefresh = () => {
    refetch();
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

  const getAvatarColor = (action: string, resourceType?: string) => {
    const actionUpper = action.toUpperCase();
    // Specific handling for tag creation to match chip color more directly if needed
    if (resourceType === 'tag' && actionUpper === 'CREATE') return 'var(--color-success)'; 
    if (resourceType === 'tag' && actionUpper === 'UPDATE') return 'var(--color-info)';
    if (resourceType === 'tag' && actionUpper === 'DELETE') return 'var(--color-error)';

    switch (actionUpper) {
      case 'UPLOAD':
        return 'var(--color-warning)';
      case 'CREATE': 
        return 'var(--color-success)';
      case 'DELETE': 
        return 'var(--color-error)';
      case 'EDIT': 
      case 'UPDATE': 
        return 'var(--color-info)';
      case 'LOGIN': 
      case 'REGISTER': 
      case 'PROFILE_UPDATE':
        return 'var(--color-primary)';
      default: 
        return 'var(--color-text-secondary)'; // More neutral default
    }
  };

  const renderActivityDetails = (activity: ActivityLog) => {
    // Debug: log the full activity object
    console.log('RecentActivity: activity object', activity);
    const details = activity.details || activity.action; // Use const
    let changedFields: string[] = [];
    let mainDetails = details;
    let mediaLink: string | null = null;
    let mediaLabel: string | null = null;

    // Determine the consistent color for this activity item
    const itemColor = getAvatarColor(activity.action, activity.resourceType);

    // Handle Tag related activities first
    if (activity.resourceType === 'tag' && activity.tagName) { 
      let actionText = 'Tag activity:';
      // Color is already determined by itemColor from getAvatarColor

      const actionUpper = activity.action.toUpperCase();
      if (actionUpper === 'CREATE') {
        actionText = 'Created tag:';
      } else if (actionUpper === 'UPDATE') {
        actionText = 'Updated tag:';
      } else if (actionUpper === 'DELETE') {
        actionText = 'Deleted tag:';
      }

      return (
        <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 0.5 }}>
          <Typography variant="body2" component="span" sx={{ mr: 0.5 }}>
            {actionText}
          </Typography>
          <Chip 
            label={activity.tagName} 
            size="small" 
            variant="outlined" 
            sx={{ 
              color: itemColor, // Use itemColor
              borderColor: itemColor, // Use itemColor
              fontSize: "12px" 
            }}
          />
        </Box>
      );
    }

    // Handle Tag CATEGORY related activities
    if (activity.resourceType === 'tagCategory') {
      let actionText = 'Tag category activity:';
      // Use tagCategoryName if available, otherwise try to parse from details or use a default
      const categoryName = activity.tagCategoryName || activity.resourceName || 'Unnamed Category';
      let associatedTags: Array<{ id?: string; name: string }> = [];

      // Check if backend provides a direct array of tags in the log (ideal scenario)
      // Example: if (Array.isArray(activity.loggedTags)) { associatedTags = activity.loggedTags; }
      // For now, we parse from 'details' as per the provided log structure

      if (typeof activity.details === 'string') {
        // Regex to capture text after "containing tags: " or "with tags: "
        const tagsStringMatch = activity.details.match(/(?:containing|with) tags: (.*)/i);
        if (tagsStringMatch && tagsStringMatch[1]) {
          associatedTags = tagsStringMatch[1]
            .split(',')
            .map(name => name.trim())
            .filter(name => name !== '…' && name.length > 0) // Remove ellipsis and empty strings
            .map(name => ({ name })); // Create objects { name: string }
        }
      }

      const actionUpper = activity.action.toUpperCase();
      if (actionUpper === 'CREATE') {
        actionText = `Created category "${categoryName}" with tags:`;
      } else if (actionUpper === 'UPDATE') {
        actionText = `Updated category "${categoryName}" with tags:`;
      } else if (actionUpper === 'DELETE') {
        actionText = `Deleted category "${categoryName}".`;
      }

      return (
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 0.5 }}>
          <Typography variant="body2" component="span">
            {actionText}
          </Typography>
          {associatedTags.length > 0 && (
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
              {associatedTags.map((tag, index) => (
                <Chip 
                  key={tag.id || `tag-${index}`}
                  label={tag.name}
                  size="small" 
                  variant="outlined" 
                  sx={{ 
                    color: 'var(--color-success)', 
                    borderColor: 'var(--color-success)', 
                    fontSize: "12px" 
                  }}
                />
              ))}
            </Box>
          )}
        </Box>
      );
    }

    // Media link rendering logic (updated to use itemColor)
    {
      const resolvedMediaSlug = activity.mediaSlug || activity.mediaslug; // Prefer camelCase, fallback to lowercase
      const resolvedMediaTitle = activity.mediaTitle || activity.mediatitle; // Prefer camelCase, fallback to lowercase
      console.log('RecentActivity: resolved mediaSlug', resolvedMediaSlug, 'mediaTitle', resolvedMediaTitle);
      if (activity.resourceType === 'media' && resolvedMediaSlug && resolvedMediaTitle) {
        let displayTextBefore = '';
        if (activity.action === 'UPLOAD') {
          displayTextBefore = 'Uploaded media file: ';
        } else if (activity.action === 'EDIT' || activity.action === 'UPDATE') {
          displayTextBefore = 'Updated media file: ';
        } else if (activity.action.toLowerCase().includes('thumbnail')) {
          displayTextBefore = 'Updated video thumbnail for ';
        }
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
              <Link 
                to={`/media/slug/${resolvedMediaSlug}`} 
                style={{ 
                  textDecoration: 'underline', 
                  color: itemColor, // Use itemColor for the link
                  fontWeight: 500 
                }}
              >
                {resolvedMediaTitle}
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

    // Fallback logic for other types of links or details if needed (updated to use itemColor for links)
    if (typeof details === 'string' && details.includes('(') && details.includes(')')) {
      const match = details.match(/\(([^)]+)\)/);
      if (match && match[1]) {
        changedFields = match[1].split(',').map(f => f.trim());
        mainDetails = details.replace(/\s*\([^)]+\)/, '').trim();
      }
    }

    const actionType = (activity.action || '').toUpperCase();
    let foundTitle: string = '';
    let foundMedia: TransformedMediaFile | undefined;
    let shouldTryUpdateLink = false;
    let displayTextBefore = '';
    const displayTextAfter = ''; // Use const

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
          const forIdx = details.toLowerCase().lastIndexOf(' for ');
          if (forIdx !== -1) {
            foundTitle = details.substring(forIdx + 5).trim();
            shouldTryUpdateLink = true;
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
        <Typography variant="body2" component="span" noWrap sx={{ mr: 1 }}>
          {mediaLink && mediaLabel ? (
            <>
              {displayTextBefore}
              <Link 
                to={mediaLink} 
                style={{ 
                  textDecoration: 'underline', 
                  color: itemColor, // Use itemColor for this link too
                  fontWeight: 500 
                }}
              >
                {mediaLabel}
              </Link>
              {displayTextAfter}
            </>
          ) : (
            mainDetails
          )}
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
    <Paper elevation={3} sx={{ p: 2, display: 'flex', flexDirection: 'column', height: '100%' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6">Recent Activity</Typography>
        <Button 
          variant="outlined" 
          size="small"
          onClick={handleRefresh} 
          startIcon={isRefetching ? <CircularProgress size={16} color="inherit" /> : <RefreshIcon />}
          disabled={isRefetching || isLoadingActivities}
        >
          Refresh
        </Button>
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
                  <Avatar sx={{ bgcolor: getAvatarColor(activity.action, activity.resourceType), width: 36, height: 36 }}>
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