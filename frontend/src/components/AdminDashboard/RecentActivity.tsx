import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../../store/store';
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
import axios from 'axios';
import { API_BASE_URL } from '../../config/config';
import { useActivityLogs } from '../../hooks/query-hooks';

// Example activity type
interface ActivityLog {
  id: string;
  userId: string;
  username: string;
  action: string;
  details: string;
  resourceType: string;
  resourceId: string;
  timestamp: string;
  // Add slug fields for tracking media
  slug?: string;
  mediaSlug?: string;
}

interface ApiResponse {
  data: ActivityLog[];
  success: boolean;
  message?: string;
}

interface UserType {
  _id?: string;
  id?: string;
  username?: string;
  name?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
}

// Determine if we're running on localhost
// const isLocalhost = 
//   window.location.hostname === 'localhost' || 
//   window.location.hostname === '127.0.0.1';

const RecentActivity: React.FC = () => {
  const [disableMock, setDisableMock] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Get users from Redux store to ensure we only use MongoDB users
  const userState = useSelector((state: RootState) => state.user);
  const users: UserType[] = userState.users.allUsers || [];
  const media = useSelector((state: RootState) => state.media.allMedia);
  
  // Use TanStack Query for activity logs
  const { 
    data: activitiesData,
    isLoading,
    isError,
    error: queryError,
    refetch,
    isRefetching
  } = useActivityLogs(20);
  
  // Create a more detailed error message from queryError if available
  React.useEffect(() => {
    if (isError && queryError) {
      const errorMessage = queryError instanceof Error 
        ? queryError.message 
        : 'Failed to load activity logs';
      setError(errorMessage);
    } else {
      setError(null);
    }
  }, [isError, queryError]);
  
  // Function to enrich media activities with slugs
  const enrichMediaActivities = (activities: ActivityLog[], allMedia: any[]): ActivityLog[] => {
    // Create a copy of activities to modify
    const enrichedActivities = [...activities];
    
    // Only log in development mode and limit to summary information
    const isDev = process.env.NODE_ENV === 'development';
    
    // Count for logging summary
    let mediaActivitiesEnriched = 0;
    
    // Process each activity
    for (const activity of enrichedActivities) {
      // Handle media type activities
      if (activity.resourceType === 'media') {
        // If mediaSlug is already available from the API, use it
        if (activity.mediaSlug) {
          activity.slug = activity.mediaSlug;
          mediaActivitiesEnriched++;
          continue;
        }

        // Try to find matching media by resourceId
        if (activity.resourceId) {
          const mediaFile = allMedia.find(media => 
            media._id === activity.resourceId || 
            media.id === activity.resourceId
          );
          
          if (mediaFile && mediaFile.slug) {
            activity.slug = mediaFile.slug;
            mediaActivitiesEnriched++;
            continue; // Skip to next activity
          }
        }

        // If no slug found yet, try to extract from details
        if (activity.details) {
          // Extract potential media title from activity details
          let potentialTitle = '';
          if (activity.action === 'UPLOAD' && activity.details.includes('Uploaded media file: ')) {
            potentialTitle = activity.details.substring(activity.details.indexOf('Uploaded media file: ') + 'Uploaded media file: '.length);
          } else if (activity.action === 'UPLOAD' && activity.details.includes('Uploaded ')) {
            potentialTitle = activity.details.substring(activity.details.indexOf('Uploaded ') + 'Uploaded '.length);
          } else if (activity.action === 'DELETE' && activity.details.includes('Deleted media file: ')) {
            potentialTitle = activity.details.substring(activity.details.indexOf('Deleted media file: ') + 'Deleted media file: '.length);
          } else if (activity.action === 'DELETE' && activity.details.includes('Deleted ')) {
            potentialTitle = activity.details.substring(activity.details.indexOf('Deleted ') + 'Deleted '.length);
          } else if (activity.action === 'EDIT' && activity.details.includes('Updated media file: ')) {
            potentialTitle = activity.details.substring(activity.details.indexOf('Updated media file: ') + 'Updated media file: '.length);
          } else if (activity.action === 'EDIT' && activity.details.includes('Updated ')) {
            potentialTitle = activity.details.substring(activity.details.indexOf('Updated ') + 'Updated '.length);
          }
          
          // Clean up potential title (remove anything after parenthesis)
          if (potentialTitle.includes(' (')) {
            potentialTitle = potentialTitle.substring(0, potentialTitle.indexOf(' ('));
          }
          
          if (potentialTitle) {
            // Try to find a media file with a matching title
            const matchingMedia = allMedia.find(media => 
              media.title === potentialTitle || 
              media.metadata?.fileName === potentialTitle
            );
            
            if (matchingMedia && matchingMedia.slug) {
              activity.slug = matchingMedia.slug;
              mediaActivitiesEnriched++;
            }
          }
        }
      }
    }
    
    // Log summary in development mode only
    if (isDev) {
      const mediaActivities = enrichedActivities.filter(a => a.resourceType === 'media');
      if (mediaActivities.length > 0) {
        console.log(`Enrichment complete: Found slugs for ${mediaActivitiesEnriched} out of ${mediaActivities.length} media activities`);
      }
    }
    
    return enrichedActivities;
  };
  
  // Function to create mock data for fallback
  const createMockData = () => {
    // For demo purposes, create mock data using the actual MongoDB users
    const mockUsernames = users.length > 0 
      ? users.map((user: UserType) => user.username || user.name || 'user')
      : ['admin', 'editor'];
    
    const mockUserIds = users.length > 0
      ? users.map((user: UserType) => user.id || user._id || '1')
      : ['1', '2'];
    
    // Use a counter to ensure unique IDs
    let counter = 0;
    
    // Create realistic activity based on actual media items when possible
    const mockActivities: ActivityLog[] = [];
    
    // Generate a truly unique ID for mock data
    const generateUniqueId = (prefix: string) => {
      counter++;
      return `${prefix}-${Date.now()}-${counter}-${Math.random().toString(36).substring(2, 9)}`;
    };
    
    // Media upload activity
    mockActivities.push({
      id: generateUniqueId('mock-upload'),
      userId: mockUserIds[0] || '1',
      username: mockUsernames[0] || 'admin',
      action: 'UPLOAD',
      details: `Uploaded ${media.length > 0 ? media[0].title || 'a new file' : 'a new image file'}`,
      resourceType: 'media',
      resourceId: media.length > 0 ? media[0].id || '123' : '123',
      timestamp: new Date(Date.now() - 1000 * 60 * 5).toISOString()
    });
    
    // Media delete activity
    mockActivities.push({
      id: generateUniqueId('mock-delete'),
      userId: mockUserIds.length > 1 ? mockUserIds[1] : mockUserIds[0] || '1',
      username: mockUsernames.length > 1 ? mockUsernames[1] : mockUsernames[0] || 'admin',
      action: 'DELETE',
      details: 'Deleted a document file',
      resourceType: 'media',
      resourceId: '456',
      timestamp: new Date(Date.now() - 1000 * 60 * 15).toISOString()
    });
    
    // Media type creation activity
    mockActivities.push({
      id: generateUniqueId('mock-create'),
      userId: mockUserIds[0] || '1',
      username: mockUsernames[0] || 'admin',
      action: 'CREATE',
      details: 'Created a new media type: Videos',
      resourceType: 'mediaType',
      resourceId: '789',
      timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString()
    });
    
    // Media edit activity
    mockActivities.push({
      id: generateUniqueId('mock-edit'),
      userId: mockUserIds.length > 1 ? mockUserIds[1] : mockUserIds[0] || '1',
      username: mockUsernames.length > 1 ? mockUsernames[1] : mockUsernames[0] || 'admin',
      action: 'EDIT',
      details: 'Updated media metadata',
      resourceType: 'media',
      resourceId: media.length > 1 ? media[1].id || '456' : '456',
      timestamp: new Date(Date.now() - 1000 * 60 * 60).toISOString()
    });
    
    // View activity
    mockActivities.push({
      id: generateUniqueId('mock-view'),
      userId: mockUserIds[0] || '1',
      username: mockUsernames[0] || 'admin',
      action: 'VIEW',
      details: 'Accessed media library',
      resourceType: 'system',
      resourceId: 'media-library',
      timestamp: new Date(Date.now() - 1000 * 60 * 120).toISOString()
    });
    
    return mockActivities;
  };
  
  // Process the activities data
  const activities = React.useMemo(() => {
    // If no data or disableMock is true and there's an error, return empty array
    if (!activitiesData || (isError && disableMock)) {
      return [];
    }
    
    // If there's an error and disableMock is false, create mock data
    if (isError && !disableMock) {
      return createMockData();
    }
    
    // Filter activities to only include MongoDB users
    const filteredActivities = activitiesData.filter(activity => {
      return users.some((user: UserType) => user.id === activity.userId || user._id === activity.userId);
    });
    
    // Enrich the activities with media slugs
    return enrichMediaActivities(filteredActivities, media);
  }, [activitiesData, isError, disableMock, users, media]);
  
  // Handle manual refresh
  const handleRefresh = () => {
    refetch();
  };
  
  // Handle toggle mock data
  const handleToggleMock = (event: React.ChangeEvent<HTMLInputElement>) => {
    setDisableMock(event.target.checked);
  };
  
  // Function to get icon based on action type
  const getActionIcon = (action: string) => {
    switch (action) {
      case 'UPLOAD':
        return <CloudUploadIcon />;
      case 'DELETE':
        return <DeleteIcon />;
      case 'EDIT':
        return <EditIcon />;
      case 'CREATE':
        return <FaTag />;
      case 'VIEW':
        return <PersonIcon />;
      default:
        return <SettingsIcon />;
    }
  };
  
  // Function to get avatar color based on action
  const getAvatarColor = (action: string) => {
    switch (action) {
      case 'UPLOAD':
        return 'primary.main';
      case 'DELETE':
        return 'error.main';
      case 'EDIT':
        return 'warning.main';
      case 'CREATE':
        return 'success.main';
      case 'VIEW':
        return 'info.main';
      default:
        return 'text.secondary';
    }
  };
  
  // Function to render activity details with links for media files
  const renderActivityDetails = (activity: ActivityLog) => {
    // Extract main details and changed fields if present
    let mainDetails = activity.details;
    let changedFields: string[] = [];
    
    // Extract changed fields for EDIT actions with parentheses pattern
    if (activity.action === 'EDIT' && activity.details.includes('(')) {
      const fieldsMatch = activity.details.match(/\(([^)]+)\)/);
      if (fieldsMatch && fieldsMatch[1]) {
        // Split by comma and clean up each field
        changedFields = fieldsMatch[1].split(',').map(field => field.trim());
        // Remove the fields portion from the main details
        mainDetails = activity.details.replace(/\s*\([^)]+\)/, '');
      }
    }
    
    return (
      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
        <Box sx={{ color: 'text.secondary', mt: 0.5 }}>
          {getActionIcon(activity.action)}
        </Box>
        <Box sx={{ flex: 1 }}>
          <Typography component="div" variant="body2" color="text.primary">
            {mainDetails}
          </Typography>
          
          {/* If there are changed fields, display them as chips */}
          {changedFields.length > 0 && (
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 0.5 }}>
              {changedFields.map((field, idx) => (
                <Chip
                  key={`field-${idx}`}
                  label={field}
                  size="small"
                  variant="outlined"
                  sx={{ height: '20px', fontSize: '0.7rem', borderColor: 'warning.main', color: 'warning.main' }}
                />
              ))}
            </Box>
          )}
          
          {/* If it's a media activity and we have a slug, add a link below */}
          {activity.resourceType === 'media' && (activity.slug || activity.mediaSlug) && (
            <Typography component="div" variant="caption" color="text.secondary" sx={{ mt: 0.5 }}>
              Media: {activity.slug || activity.mediaSlug}
            </Typography>
          )}
        </Box>
      </Box>
    );
  };
  
  // Format timestamp to relative time
  const formatRelativeTime = (timestamp: string) => {
    const now = new Date();
    const activityTime = new Date(timestamp);
    const diffMs = now.getTime() - activityTime.getTime();
    const diffMins = Math.round(diffMs / 60000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min${diffMins > 1 ? 's' : ''} ago`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 30) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    
    return activityTime.toLocaleDateString();
  };
  
  // Debug function to test authentication
  const testAuthentication = async () => {
    try {
      const token = localStorage.getItem('authToken');
      
      if (!token) {
        setError("No authentication token found in localStorage. Please log in again.");
        return;
      }
      
      console.log("Current token:", token);
      
      // First try a simpler endpoint to test basic authentication
      console.log("Testing authentication with database-stats endpoint...");
      const statsResponse = await axios.get(`${API_BASE_URL}/api/admin/database-stats`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      console.log("Database stats authentication successful:", statsResponse.data);
      
      // Now specifically test the activity-logs endpoint
      console.log("Testing authentication with activity-logs endpoint...");
      const logsResponse = await axios.get<ApiResponse>(`${API_BASE_URL}/api/admin/activity-logs`, {
        headers: {
          Authorization: `Bearer ${token}`
        },
        params: {
          limit: 5
        }
      });
      
      console.log("Activity logs authentication successful:", logsResponse.data);
      
      // Check if we got any actual logs back
      if (logsResponse.data && logsResponse.data.data && logsResponse.data.data.length > 0) {
        console.log(`Successfully retrieved ${logsResponse.data.data.length} activity logs`);
        console.log("Sample log:", logsResponse.data.data[0]);
        
        // Filter logs by valid users
        const filteredLogs = logsResponse.data.data.filter(activity => {
          return users.some((user: UserType) => user.id === activity.userId || user._id === activity.userId);
        });
        
        if (filteredLogs.length > 0) {
          // Try to enrich them with slugs
          const enrichedLogs = await enrichMediaActivities(filteredLogs, media);
          console.log("Enriched logs sample:", enrichedLogs[0]);
          
          // Log the enriched logs instead of updating state
          console.log("Enriched logs:", enrichedLogs);
        }
        
        alert(`Authentication successful! You have admin privileges.\nSuccessfully retrieved ${logsResponse.data.data.length} activity logs.`);
      } else {
        console.log("Authentication successful but no activity logs found");
        alert("Authentication successful, but no activity logs were found in the database.");
      }
      
      setError(null);
    } catch (err: any) {
      console.error("Authentication test failed:", err);
      
      if (err.response) {
        if (err.response.status === 401) {
          setError(`Authentication failed (401): ${err.response.data.error || 'Invalid token'}. Please log in again.`);
        } else if (err.response.status === 403) {
          setError("You don't have admin privileges (403). Admin access is required for this feature.");
        } else if (err.response.status === 404) {
          setError(`API endpoint not found (404): ${err.config.url}. Check if backend routes are correctly configured.`);
        } else {
          setError(`Server error: ${err.response.status} - ${err.response.data.message || err.response.statusText || 'Unknown error'}`);
        }
      } else if (err.request) {
        setError(`No response from server. Check if the backend is running at ${API_BASE_URL}.`);
      } else {
        setError(`Request error: ${err.message}`);
      }
    }
  };
  
  if (isLoading) {
    return (
      <Paper elevation={2} className="dashboard-card" style={{ minHeight: '450px' }}>
        <Typography variant="h6" gutterBottom>Recent Activity</Typography>
        <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', py: 3, minHeight: '350px' }}>
          <CircularProgress />
          <Typography variant="body2" sx={{ mt: 2, color: 'text.secondary' }}>
            Loading activity logs...
          </Typography>
        </Box>
      </Paper>
    );
  }
  
  if (error) {
    return (
      <Paper elevation={2} className="dashboard-card" style={{ minHeight: '450px' }}>
        <Typography variant="h6" gutterBottom>Recent Activity</Typography>
        <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', py: 3, minHeight: '350px' }}>
          <Typography color="error" gutterBottom>{error}</Typography>
          
          <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
            <Button 
              variant="contained" 
              color="primary" 
              onClick={() => refetch()}
              startIcon={<RefreshIcon />}
            >
              Retry
            </Button>
            
            <Button 
              variant="outlined" 
              color="secondary" 
              onClick={testAuthentication}
            >
              Test Auth
            </Button>
            
            <FormControlLabel
              control={
                <Checkbox
                  checked={disableMock}
                  onChange={handleToggleMock}
                  size="small"
                />
              }
              label="Disable Mock Data"
            />
          </Box>
        </Box>
      </Paper>
    );
  }
  
  return (
    <Paper elevation={2} className="dashboard-card has-scroll" style={{ width: '100%', maxWidth: '100%', minHeight: '450px' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6">Recent Activity</Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <FormControlLabel
            control={
              <Checkbox
                checked={disableMock}
                onChange={handleToggleMock}
                size="small"
              />
            }
            label={<Typography variant="caption">Disable Mock Data</Typography>}
          />
          <Button 
            variant="outlined" 
            color="primary" 
            size="small"
            onClick={handleRefresh}
            disabled={isLoading || isRefetching}
            startIcon={isRefetching ? <CircularProgress size={16} /> : <RefreshIcon />}
          >
            {isRefetching ? 'Refreshing...' : 'Refresh'}
          </Button>
          {error && (
            <Button 
              variant="outlined" 
              color="secondary" 
              size="small"
              onClick={testAuthentication}
            >
              Test Auth
            </Button>
          )}
        </Box>
      </Box>
      
      {activities.length === 0 ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 3, minHeight: '350px' }}>
          <Typography color="textSecondary">
            {isLoading ? 'Loading activity data...' : 'No recent activity found'}
          </Typography>
        </Box>
      ) : (
        <List sx={{ width: '100%', bgcolor: 'background.paper', minHeight: '350px', position: 'relative' }}>
          {/* Show a loading overlay when refetching */}
          {isRefetching && (
            <Box sx={{ 
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(255, 255, 255, 0.5)',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              zIndex: 5
            }}>
              <CircularProgress size={30} />
            </Box>
          )}
          {activities.map((activity, index) => (
            <React.Fragment key={`activity-${activity.id || index}`}>
              <ListItem alignItems="flex-start">
                <ListItemAvatar>
                  <Avatar sx={{ bgcolor: getAvatarColor(activity.action) }}>
                    {getActionIcon(activity.action)}
                  </Avatar>
                </ListItemAvatar>
                <ListItemText
                  primary={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography component="span" variant="body1" fontWeight="bold">
                        {activity.username}
                      </Typography>
                      <Chip
                        key={`chip-${activity.id || index}`}
                        label={activity.action}
                        size="small"
                        sx={{ 
                          bgcolor: getAvatarColor(activity.action), 
                          color: 'white', 
                          height: '20px', 
                          fontSize: '0.7rem' 
                        }}
                      />
                    </Box>
                  }
                  secondary={
                    <Box component="div" sx={{ mt: 1 }}>
                      {renderActivityDetails(activity)}
                      <Typography component="div" variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                        {formatRelativeTime(activity.timestamp)}
                      </Typography>
                    </Box>
                  }
                />
              </ListItem>
              {index < activities.length - 1 && <Divider key={`divider-${activity.id || index}`} />}
            </React.Fragment>
          ))}
        </List>
      )}
    </Paper>
  );
};

export default RecentActivity;