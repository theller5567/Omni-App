import React, { useState, lazy, Suspense } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  Tabs, 
  Tab, 
  CircularProgress,
  useTheme,
  useMediaQuery
} from '@mui/material';
import { useSelector } from 'react-redux';
import { RootState } from '../store/store';
import '../components/AdminDashboard/dashboard.scss';

// Lazy-loaded dashboard components
const MediaTypeDistribution = lazy(() => import('../components/AdminDashboard/MediaTypeDistribution'));
const StorageUsageChart = lazy(() => import('../components/AdminDashboard/StorageUsageChart'));
const RecentActivity = lazy(() => import('../components/AdminDashboard/RecentActivity'));
const DatabaseStats = lazy(() => import('../components/AdminDashboard/DatabaseStats'));
const UserActivity = lazy(() => import('../components/AdminDashboard/UserActivity'));

// Loading fallback component
const LoadingFallback = () => (
  <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
    <CircularProgress />
  </Box>
);

// Tab panel component
interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel = (props: TabPanelProps) => {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`dashboard-tabpanel-${index}`}
      aria-labelledby={`dashboard-tab-${index}`}
      key={`tab-panel-${index}`}
      style={{ minHeight: '450px' }}
      {...other}
    >
      {value === index && <Box sx={{ minHeight: '450px' }}>{children}</Box>}
    </div>
  );
};

// Tab accessor function
function a11yProps(index: number) {
  return {
    id: `dashboard-tab-${index}`,
    'aria-controls': `dashboard-tabpanel-${index}`
  };
}

const AccountAdminDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState(0);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  // Get media data from Redux store
  const allMedia = useSelector((state: RootState) => state.media.allMedia);
  const mediaTypes = useSelector((state: RootState) => state.mediaTypes.mediaTypes);
  
  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  // Format date for latest upload display
  const formatLatestUploadDate = () => {
    if (allMedia.length === 0) return 'N/A';
    
    // Find latest modified date across all media
    const dates = allMedia.map(media => new Date(media.modifiedDate).getTime());
    const latestDate = new Date(Math.max(...dates));
    
    // Format as M/D/YYYY
    return `${latestDate.getMonth() + 1}/${latestDate.getDate()}/${latestDate.getFullYear()}`;
  };

  return (
    <div className="dashboard-container">
      <Typography variant="h4" className="dashboard-title">Admin Dashboard</Typography>
      
      {/* Dashboard Overview */}
      <div className="dashboard-overview">
        <Typography variant="h5" className="dashboard-overview-title">Overview</Typography>
        <div className="dashboard-overview-grid">
          {/* Media Stats Card */}
          <Paper elevation={2} className="dashboard-card stat-card">
            <Typography variant="h6" className="stat-title">Media Files</Typography>
            <Typography variant="h3" className="stat-value" sx={{ color: 'primary.main' }}>{allMedia.length}</Typography>
            <Typography variant="body2" className="stat-subtitle">Total media files</Typography>
          </Paper>
          
          {/* Media Types Card */}
          <Paper elevation={2} className="dashboard-card stat-card">
            <Typography variant="h6" className="stat-title">Media Types</Typography>
            <Typography variant="h3" className="stat-value" sx={{ color: 'success.main' }}>{mediaTypes.length}</Typography>
            <Typography variant="body2" className="stat-subtitle">Configured media types</Typography>
          </Paper>
          
          {/* Total Storage Card */}
          <Paper elevation={2} className="dashboard-card stat-card">
            <Typography variant="h6" className="stat-title">Storage Used</Typography>
            <Typography variant="h3" className="stat-value" sx={{ color: 'error.main' }}>
              {(allMedia.reduce((total, file) => total + (file.fileSize || 0), 0) / (1024 * 1024)).toFixed(2)} MB
            </Typography>
            <Typography variant="body2" className="stat-subtitle">Total storage used</Typography>
          </Paper>
          
          {/* Latest Upload Card */}
          <Paper elevation={2} className="dashboard-card stat-card">
            <Typography variant="h6" className="stat-title">Latest Upload</Typography>
            <Typography variant="h3" className="stat-value" sx={{ color: 'info.main' }}>
              {formatLatestUploadDate()}
            </Typography>
            <Typography variant="body2" className="stat-subtitle">Most recent upload date</Typography>
          </Paper>
        </div>
      </div>
      
      {/* Detailed Dashboard */}
      <Box sx={{ overflow: 'visible', minHeight: '500px' }}>
        <Tabs 
          value={activeTab} 
          onChange={handleTabChange} 
          aria-label="dashboard tabs"
          variant={isMobile ? "scrollable" : "standard"}
          scrollButtons={isMobile ? "auto" : undefined}
          allowScrollButtonsMobile
          className="dashboard-tabs"
        >
          <Tab 
            key="tab-0"
            label="Media Type Distribution" 
            {...a11yProps(0)} 
          />
          <Tab 
            key="tab-1"
            label="Storage Usage" 
            {...a11yProps(1)} 
          />
          <Tab 
            key="tab-2"
            label="User Activity" 
            {...a11yProps(2)} 
          />
          <Tab 
            key="tab-3"
            label="Database Stats" 
            {...a11yProps(3)} 
          />
          <Tab 
            key="tab-4"
            label="Recent Activity" 
            {...a11yProps(4)} 
          />
        </Tabs>
        
        <div className="dashboard-tab-content" style={{ minHeight: '500px' }}>
          <TabPanel value={activeTab} index={0}>
            <Suspense fallback={<LoadingFallback />}>
              <MediaTypeDistribution key="media-type-distribution" />
            </Suspense>
          </TabPanel>
          
          <TabPanel value={activeTab} index={1}>
            <Suspense fallback={<LoadingFallback />}>
              <StorageUsageChart key="storage-usage-chart" />
            </Suspense>
          </TabPanel>
          
          <TabPanel value={activeTab} index={2}>
            <Suspense fallback={<LoadingFallback />}>
              <UserActivity key="user-activity" />
            </Suspense>
          </TabPanel>
          
          <TabPanel value={activeTab} index={3}>
            <Suspense fallback={<LoadingFallback />}>
              <DatabaseStats key="database-stats" />
            </Suspense>
          </TabPanel>
          
          <TabPanel value={activeTab} index={4}>
            <Suspense fallback={<LoadingFallback />}>
              <RecentActivity key="recent-activity" />
            </Suspense>
          </TabPanel>
        </div>
      </Box>
    </div>
  );
};

export default AccountAdminDashboard;