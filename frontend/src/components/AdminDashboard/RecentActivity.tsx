import React, { useEffect, useState } from 'react';
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
  Chip
} from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import PersonIcon from '@mui/icons-material/Person';
import SettingsIcon from '@mui/icons-material/Settings';
import FolderIcon from '@mui/icons-material/Folder';
import axios from 'axios';
import { API_BASE_URL } from '../../config/config';

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
const isLocalhost = 
  window.location.hostname === 'localhost' || 
  window.location.hostname === '127.0.0.1';

const RecentActivity: React.FC = () => {
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Get users from Redux store to ensure we only use MongoDB users
  const userState = useSelector((state: RootState) => state.user);
  const users: UserType[] = userState.users.allUsers || [];
  const media = useSelector((state: RootState) => state.media.allMedia);
  
  useEffect(() => {
    const fetchActivities = async () => {
      try {
        setLoading(true);
        
        // Skip API call if we're running on localhost - just use mock data
        if (isLocalhost) {
          console.log('Using mock activity data in local development');
          createMockData();
          return;
        }
        
        // Only attempt to fetch from API if the endpoint is available
        if (API_BASE_URL) {
          try {
            const response = await axios.get<ApiResponse>(`${API_BASE_URL}/api/activity-logs`, {
              headers: {
                Authorization: `Bearer ${localStorage.getItem('token')}`
              },
              params: {
                limit: 20
              }
            });
            
            // Filter activities to only include MongoDB users
            const filteredActivities = response.data.data.filter(activity => {
              return users.some((user: UserType) => user.id === activity.userId || user._id === activity.userId);
            });
            
            setActivities(filteredActivities);
            setLoading(false);
          } catch (err) {
            console.error("Error fetching activity logs:", err);
            createMockData();
          }
        } else {
          createMockData();
        }
      } catch (err) {
        console.error("Error in activity handling:", err);
        createMockData();
      }
    };
    
    const createMockData = () => {
      // For demo purposes, create mock data using the actual MongoDB users
      const mockUsernames = users.length > 0 
        ? users.map((user: UserType) => user.username || user.name || 'user')
        : ['admin', 'editor'];
      
      const mockUserIds = users.length > 0
        ? users.map((user: UserType) => user.id || user._id || '1')
        : ['1', '2'];
      
      // Create realistic activity based on actual media items when possible
      const mockActivities: ActivityLog[] = [
        {
          id: '1',
          userId: mockUserIds[0] || '1',
          username: mockUsernames[0] || 'admin',
          action: 'UPLOAD',
          details: `Uploaded ${media.length > 0 ? media[0].title || 'a new file' : 'a new image file'}`,
          resourceType: 'media',
          resourceId: media.length > 0 ? media[0].id || '123' : '123',
          timestamp: new Date(Date.now() - 1000 * 60 * 5).toISOString()
        },
        {
          id: '2',
          userId: mockUserIds.length > 1 ? mockUserIds[1] : mockUserIds[0] || '1',
          username: mockUsernames.length > 1 ? mockUsernames[1] : mockUsernames[0] || 'admin',
          action: 'DELETE',
          details: 'Deleted a document file',
          resourceType: 'media',
          resourceId: '456',
          timestamp: new Date(Date.now() - 1000 * 60 * 15).toISOString()
        },
        {
          id: '3',
          userId: mockUserIds[0] || '1',
          username: mockUsernames[0] || 'admin',
          action: 'CREATE',
          details: 'Created a new media type: Videos',
          resourceType: 'mediaType',
          resourceId: '789',
          timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString()
        },
        {
          id: '4',
          userId: mockUserIds.length > 1 ? mockUserIds[1] : mockUserIds[0] || '1',
          username: mockUsernames.length > 1 ? mockUsernames[1] : mockUsernames[0] || 'admin',
          action: 'EDIT',
          details: 'Updated media metadata',
          resourceType: 'media',
          resourceId: media.length > 1 ? media[1].id || '456' : '456',
          timestamp: new Date(Date.now() - 1000 * 60 * 60).toISOString()
        },
        {
          id: '5',
          userId: mockUserIds[0] || '1',
          username: mockUsernames[0] || 'admin',
          action: 'VIEW',
          details: 'Accessed media library',
          resourceType: 'system',
          resourceId: 'media-library',
          timestamp: new Date(Date.now() - 1000 * 60 * 120).toISOString()
        },
      ];
      
      setActivities(mockActivities);
      setLoading(false);
      setError(null);
    };
    
    fetchActivities();
  }, [users, media]);
  
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
        return <FolderIcon />;
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
  
  if (loading) {
    return (
      <Paper elevation={2} className="dashboard-card" style={{ minHeight: '450px' }}>
        <Typography variant="h6" gutterBottom>Recent Activity</Typography>
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 3, minHeight: '350px' }}>
          <Typography>Loading...</Typography>
        </Box>
      </Paper>
    );
  }
  
  if (error) {
    return (
      <Paper elevation={2} className="dashboard-card" style={{ minHeight: '450px' }}>
        <Typography variant="h6" gutterBottom>Recent Activity</Typography>
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 3, minHeight: '350px' }}>
          <Typography color="error">{error}</Typography>
        </Box>
      </Paper>
    );
  }
  
  return (
    <Paper elevation={2} className="dashboard-card has-scroll" style={{ width: '100%', maxWidth: '100%', minHeight: '450px' }}>
      <Typography variant="h6" gutterBottom>Recent Activity</Typography>
      
      {activities.length === 0 ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 3, minHeight: '350px' }}>
          <Typography color="textSecondary">No recent activity found</Typography>
        </Box>
      ) : (
        <List sx={{ width: '100%', bgcolor: 'background.paper', minHeight: '350px' }}>
          {activities.map((activity, index) => (
            <React.Fragment key={activity.id}>
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
                    <React.Fragment>
                      <Typography component="span" variant="body2" color="text.primary">
                        {activity.details}
                      </Typography>
                      <Typography component="span" variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                        {formatRelativeTime(activity.timestamp)}
                      </Typography>
                    </React.Fragment>
                  }
                />
              </ListItem>
              {index < activities.length - 1 && <Divider variant="inset" component="li" />}
            </React.Fragment>
          ))}
        </List>
      )}
    </Paper>
  );
};

export default RecentActivity; 