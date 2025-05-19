import React, { useState } from 'react';
import { 
  Paper, 
  Typography, 
  Box, 
  Card, 
  CardContent,
  LinearProgress,
  Tooltip,
  IconButton,
  Divider
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import StorageIcon from '@mui/icons-material/Storage';
import CloudIcon from '@mui/icons-material/Cloud';
import GroupIcon from '@mui/icons-material/Group';
import CollectionsIcon from '@mui/icons-material/Collections';
import CategoryIcon from '@mui/icons-material/Category';
import TagIcon from '@mui/icons-material/Tag';
import { useSelector } from 'react-redux';
import { RootState } from '../../store/store';
import { formatFileSize } from '../../utils/formatFileSize';
import { useDatabaseStats, useUserProfile } from '../../hooks/query-hooks';
import type { User } from '../../hooks/query-hooks';

const DatabaseStats: React.FC = () => {
  const [_error, setError] = useState<string | null>(null);
  
  // Get userProfile for enabling the query
  const { data: userProfile } = useUserProfile();
  
  // Remove Redux store access for fallback data if primary data source is TanStack Query
  // const allMedia = useSelector((state: RootState) => state.media.allMedia);
  // const mediaTypes = useSelector((state: RootState) => state.mediaTypes.mediaTypes);
  // const userState = useSelector((state: RootState) => state.user);
  // const mongoUsers = userState.users.allUsers || [];
  
  // Use TanStack Query for fetching database stats, passing userProfile
  const { 
    data: stats, 
    isLoading, 
    isError, 
    error: queryError,
    refetch 
  } = useDatabaseStats(userProfile);
  
  // Create mock data function for fallback
  const createMockData = () => {
    // Mock data should be self-contained or use minimal external dependencies if Redux is removed
    // For now, this will likely break or return less accurate mock data without Redux state.
    // Consider removing or refactoring mock data if live data and loading/error states are sufficient.
    const mockTags = new Set<string>();
    // allMedia.forEach(media => { // allMedia from Redux is removed
    //   if (media.metadata?.tags && Array.isArray(media.metadata.tags)) {
    //     media.metadata.tags.forEach(tag => mockTags.add(tag));
    //   }
    // });
    
    return {
      totalUsers: 2, // Was mongoUsers.length || 2
      activeUsers: 1, // Was Math.max(1, Math.floor(mongoUsers.length / 2)) || 1
      totalMediaFiles: 0, // Was allMedia.length
      totalMediaTypes: 0, // Was mediaTypes.length
      totalTags: mockTags.size,
      storageUsed: 0, // Was allMedia.reduce(...)
      storageLimit: 5 * 1024 * 1024 * 1024, // 5GB
      dbSize: 256 * 1024 * 1024, // 256MB
      lastBackup: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
      uptime: 15 * 24 * 60 * 60 // 15 days in seconds
    };
  };
  
  // Handle refresh button click
  const handleRefresh = () => {
    refetch();
  };
  
  // Format uptime from seconds to days, hours, minutes
  const formatUptime = (seconds: number) => {
    const days = Math.floor(seconds / (24 * 60 * 60));
    const hours = Math.floor((seconds % (24 * 60 * 60)) / (60 * 60));
    const minutes = Math.floor((seconds % (60 * 60)) / 60);
    
    return `${days}d ${hours}h ${minutes}m`;
  };
  
  // Show loading state
  if (isLoading) {
    return (
      <Paper elevation={2} className="dashboard-card">
        <Typography variant="h6" gutterBottom>Database Statistics</Typography>
        <Box sx={{ width: '100%', mt: 2 }}>
          <LinearProgress />
        </Box>
      </Paper>
    );
  }
  
  // Show error state with fallback data
  if (isError) {
    setError(queryError instanceof Error ? queryError.message : 'Failed to load database stats');
    
    // If we have no stats data, create mock data
    if (!stats) {
      const mockStats = createMockData();
      
      // Render the component with mock data
      // (We continue to the main return statement and use mockStats instead)
      return renderDashboard(mockStats, true);
    }
  }
  
  // If we still don't have stats after error handling, return nothing
  if (!stats) return null;
  
  // Render the dashboard with real data
  return renderDashboard(stats, isLoading);
  
  // Helper function to render the dashboard with given stats
  function renderDashboard(statsData: any, isLoadingState: boolean) {
    // Calculate storage usage percentage
    const storagePercentage = (statsData.storageUsed / statsData.storageLimit) * 100;
    
    return (
      <Paper elevation={2} className="dashboard-card">
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6">Database Statistics</Typography>
          <Tooltip title="Refresh">
            <IconButton onClick={handleRefresh} size="small" color="primary">
              <RefreshIcon />
            </IconButton>
          </Tooltip>
        </Box>
        
        {isLoadingState && (
          <Box sx={{ width: '100%', mb: 2 }}>
            <LinearProgress />
          </Box>
        )}
        
        <div className="grid-container" style={{ gridTemplateRows: 'auto auto', minHeight: '450px' }}>
          {/* Storage Usage */}
          <div className="grid-item" style={{ gridColumn: 'span 12' }}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <StorageIcon color="primary" sx={{ mr: 1 }} />
                  <Typography variant="subtitle1" fontWeight="medium">Storage Usage</Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2" color="text.secondary">
                    {formatFileSize(statsData.storageUsed)} used of {formatFileSize(statsData.storageLimit)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {storagePercentage.toFixed(1)}%
                  </Typography>
                </Box>
                <Box sx={{ width: '100%', height: 8, bgcolor: 'background.paper', borderRadius: 4, overflow: 'hidden' }}>
                  <Box 
                    sx={{ 
                      width: `${storagePercentage}%`, 
                      height: '100%', 
                      bgcolor: storagePercentage > 90 ? 'error.main' : storagePercentage > 70 ? 'warning.main' : 'success.main',
                      borderRadius: 4
                    }} 
                  />
                </Box>
              </CardContent>
            </Card>
          </div>
          
          <div className="cards-grid" style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(3, 1fr)', 
            gap: '16px',
            marginTop: '16px'
          }}>
            {/* Database Metrics */}
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <CloudIcon color="info" sx={{ mr: 1 }} />
                  <Typography variant="subtitle1" fontWeight="medium">Database</Typography>
                </Box>
                
                <Box sx={{ mb: 1 }}>
                  <Typography variant="body2" color="text.secondary">Database Size</Typography>
                  <Typography variant="h6">{formatFileSize(statsData.dbSize)}</Typography>
                </Box>
                
                <Box sx={{ mb: 1 }}>
                  <Typography variant="body2" color="text.secondary">Last Backup</Typography>
                  <Typography variant="h6">
                    {statsData.lastBackup ? new Date(statsData.lastBackup).toLocaleDateString() : 'Never'}
                  </Typography>
                </Box>
                
                <Box>
                  <Typography variant="body2" color="text.secondary">Uptime</Typography>
                  <Typography variant="h6">{formatUptime(statsData.uptime)}</Typography>
                </Box>
              </CardContent>
            </Card>
            
            {/* Users */}
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <GroupIcon color="success" sx={{ mr: 1 }} />
                  <Typography variant="subtitle1" fontWeight="medium">Users</Typography>
                </Box>
                
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                  <Typography variant="body1">Total Users</Typography>
                  <Typography variant="h5" fontWeight="medium">{statsData.totalUsers}</Typography>
                </Box>
                
                <Divider sx={{ my: 1 }} />
                
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Typography variant="body1">Active Users</Typography>
                  <Typography variant="h5" fontWeight="medium">{statsData.activeUsers}</Typography>
                </Box>
              </CardContent>
            </Card>
            
            {/* Content */}
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <CollectionsIcon color="secondary" sx={{ mr: 1 }} />
                  <Typography variant="subtitle1" fontWeight="medium">Content</Typography>
                </Box>
                
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <CollectionsIcon fontSize="small" sx={{ mr: 0.5, opacity: 0.7 }} />
                    <Typography variant="body2">Media Files</Typography>
                  </Box>
                  <Typography variant="body1" fontWeight="medium">{statsData.totalMediaFiles}</Typography>
                </Box>
                
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <CategoryIcon fontSize="small" sx={{ mr: 0.5, opacity: 0.7 }} />
                    <Typography variant="body2">Media Types</Typography>
                  </Box>
                  <Typography variant="body1" fontWeight="medium">{statsData.totalMediaTypes}</Typography>
                </Box>
                
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <TagIcon fontSize="small" sx={{ mr: 0.5, opacity: 0.7 }} />
                    <Typography variant="body2">Tags</Typography>
                  </Box>
                  <Typography variant="body1" fontWeight="medium">{statsData.totalTags}</Typography>
                </Box>
              </CardContent>
            </Card>
          </div>
        </div>
      </Paper>
    );
  }
};

export default DatabaseStats; 