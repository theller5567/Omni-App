import React, { useRef } from 'react';
// Remove Redux imports
// import { useSelector } from 'react-redux';
// import { RootState } from '../../store/store';
import { Paper, Typography, Box, Tab, Tabs } from '@mui/material';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { formatFileSize } from '../../utils/formatFileSize';
import type { TransformedMediaFile, MediaType } from '../../hooks/query-hooks'; // Import types

// Same color scheme as MediaTypeDistribution for consistency
const DEFAULT_COLORS = [
  '#3f8cff', // blue
  '#8bc34a', // light green
  '#ff4081', // pink
  '#ffc107', // amber
  '#03a9f4', // light blue
  '#9c27b0', // purple
  '#f44336', // red
  '#4caf50', // green
  '#ff9800', // orange
  '#2196f3', // blue
];

interface StorageUsageChartProps {
  allMedia: TransformedMediaFile[];
  mediaTypes: MediaType[];
  isLoading?: boolean; // Optional loading prop
}

const StorageUsageChart: React.FC<StorageUsageChartProps> = ({ allMedia, mediaTypes, isLoading }) => {
  const [activeTab, setActiveTab] = React.useState(0);
  const chartContainerRef = useRef<HTMLDivElement>(null);
  
  // Remove Redux store access
  // const allMedia = useSelector((state: RootState) => state.media.allMedia);
  // const mediaTypes = useSelector((state: RootState) => state.mediaTypes.mediaTypes);
  
  // Calculate storage by media type
  const getStorageByMediaType = () => {
    const storageMap: {[key: string]: number} = {};
    
    allMedia.forEach(file => {
      const mediaType = file.mediaType || 'Uncategorized';
      storageMap[mediaType] = (storageMap[mediaType] || 0) + (file.fileSize || 0);
    });
    
    return Object.entries(storageMap).map(([name, size], index) => ({
      name,
      size,
      color: mediaTypes.find(type => type.name === name)?.catColor || DEFAULT_COLORS[index % DEFAULT_COLORS.length]
    })).sort((a, b) => b.size - a.size);
  };
  
  // Calculate storage by file extension
  const getStorageByExtension = () => {
    const storageMap: {[key: string]: number} = {};
    
    allMedia.forEach(file => {
      const extension = file.fileExtension ? file.fileExtension.toUpperCase() : 'Unknown';
      storageMap[extension] = (storageMap[extension] || 0) + (file.fileSize || 0);
    });
    
    // Sort by size and get top 10
    return Object.entries(storageMap)
      .map(([name, size], index) => ({ 
        name, 
        size, 
        color: DEFAULT_COLORS[index % DEFAULT_COLORS.length] 
      }))
      .sort((a, b) => b.size - a.size)
      .slice(0, 10);
  };
  
  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };
  
  const mediaTypeData = getStorageByMediaType();
  const extensionData = getStorageByExtension();
  
  // Calculate total storage
  const totalStorage = allMedia.reduce((total, file) => total + (file.fileSize || 0), 0);
  
  // Custom tooltip formatter
  const customTooltipFormatter = (value: number) => {
    return [formatFileSize(value), 'Storage Used'];
  };
  
  // Empty state or loading state
  if (isLoading) {
    return (
      <Paper elevation={2} className="dashboard-card storage-chart">
        <Typography variant="h6" gutterBottom>Storage Usage</Typography>
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          height: '400px',
          minHeight: '400px'
        }}>
          <Typography variant="body1" color="textSecondary">
            Loading storage data...
          </Typography>
        </Box>
      </Paper>
    );
  }

  if (!allMedia || allMedia.length === 0) {
    return (
      <Paper elevation={2} className="dashboard-card storage-chart">
        <Typography variant="h6" gutterBottom>Storage Usage</Typography>
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          height: '400px',
          minHeight: '400px'
        }}>
          <Typography variant="body1" color="textSecondary">
            No media files available to display storage usage.
          </Typography>
        </Box>
      </Paper>
    );
  }
  
  return (
    <div className="dashboard-grid" style={{ 
      display: 'grid',
      gridTemplateColumns: 'repeat(12, 1fr)',
      gap: '1.25rem',
      marginBottom: '1.25rem',
      minHeight: '500px'
    }}>
      <Paper 
        elevation={2} 
        className="dashboard-card storage-chart"
        style={{ gridColumn: 'span 7', minHeight: '500px' }}
      >
        <Typography variant="h6" gutterBottom>Storage Usage</Typography>
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
          <Tabs 
            value={activeTab} 
            onChange={handleTabChange} 
            aria-label="storage usage tabs"
            textColor="inherit"
            indicatorColor="primary"
          >
            <Tab label="By Media Type" />
            <Tab label="By File Extension" />
          </Tabs>
        </Box>
        
        <Box 
          ref={chartContainerRef}
          sx={{ 
            display: activeTab === 0 ? 'block' : 'none', 
            height: '400px',
            minHeight: '400px',
            width: '100%',
            position: 'relative'
          }}
        >
          <ResponsiveContainer width="100%" height={400} minHeight={400}>
            <BarChart
              width={500}
              height={400}
              data={mediaTypeData}
              margin={{ top: 20, right: 30, left: 20, bottom: 70 }}
              barSize={30}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.1)" />
              <XAxis 
                dataKey="name" 
                angle={-45} 
                textAnchor="end" 
                height={70} 
                interval={0}
                tick={{ fill: 'rgba(255, 255, 255, 0.7)', fontSize: 12 }}
              />
              <YAxis 
                tickFormatter={(value) => formatFileSize(value)}
                tick={{ fill: 'rgba(255, 255, 255, 0.7)', fontSize: 12 }}
              />
              <Tooltip 
                formatter={customTooltipFormatter}
                contentStyle={{ backgroundColor: '#333', border: 'none', borderRadius: '4px' }}
                labelStyle={{ color: '#fff', fontWeight: 'bold' }}
                itemStyle={{ color: '#fff' }}
              />
              <Bar 
                dataKey="size" 
                name="Storage Used" 
                radius={[4, 4, 0, 0]}
              >
                {mediaTypeData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Box>
        
        <Box 
          sx={{ 
            display: activeTab === 1 ? 'block' : 'none', 
            height: '400px',
            minHeight: '400px',
            width: '100%',
            position: 'relative'
          }}
        >
          <ResponsiveContainer width="100%" height={400} minHeight={400}>
            <BarChart
              width={500}
              height={400}
              data={extensionData}
              margin={{ top: 20, right: 30, left: 20, bottom: 70 }}
              barSize={30}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.1)" />
              <XAxis 
                dataKey="name" 
                angle={-45} 
                textAnchor="end" 
                height={70}
                interval={0}
                tick={{ fill: 'rgba(255, 255, 255, 0.7)', fontSize: 12 }}
              />
              <YAxis 
                tickFormatter={(value) => formatFileSize(value)}
                tick={{ fill: 'rgba(255, 255, 255, 0.7)', fontSize: 12 }}
              />
              <Tooltip 
                formatter={customTooltipFormatter}
                contentStyle={{ backgroundColor: '#333', border: 'none', borderRadius: '4px' }}
                labelStyle={{ color: '#fff', fontWeight: 'bold' }}
                itemStyle={{ color: '#fff' }}
              />
              <Bar 
                dataKey="size" 
                name="Storage Used" 
                radius={[4, 4, 0, 0]}
              >
                {extensionData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Box>
      </Paper>
      
      <Paper 
        elevation={2} 
        className="dashboard-card has-scroll"
        style={{ gridColumn: 'span 5', padding: '1rem', minHeight: '500px' }}
      >
        <Box sx={{ 
          display: 'flex', 
          flexDirection: 'column', 
          height: '100%'
        }}>
          {/* Total Storage Header */}
          <Box sx={{ 
            mb: 2, 
            pb: 2, 
            borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-end'
          }}>
            <Box>
              <Typography variant="subtitle2" color="textSecondary" sx={{ fontSize: '0.75rem' }}>
                Total Storage
              </Typography>
              <Typography variant="h4" color="primary" sx={{ mt: 0.5, fontWeight: 600 }}>
                {formatFileSize(totalStorage)}
              </Typography>
            </Box>
            
            <Box sx={{ textAlign: 'right' }}>
              <Typography variant="subtitle2" color="textSecondary" sx={{ fontSize: '0.75rem' }}>
                Files
              </Typography>
              <Typography variant="h6" sx={{ mt: 0.5 }}>
                {allMedia.length}
              </Typography>
            </Box>
          </Box>
          
          {/* Breakdown Title */}
          <Typography 
            variant="subtitle1" 
            sx={{ 
              mb: 1.5, 
              fontWeight: 500,
              fontSize: '0.95rem'
            }}
          >
            {activeTab === 0 ? 'Storage by Media Type' : 'Storage by File Extension'}
          </Typography>
          
          {/* Storage List */}
          <Box sx={{ flexGrow: 1, overflow: 'auto' }}>
            {(activeTab === 0 ? mediaTypeData : extensionData).map((item, index) => {
              const percentage = totalStorage ? (item.size / totalStorage * 100) : 0;
              
              return (
                <Box 
                  key={index} 
                  sx={{ 
                    mb: 1.25,
                    '&:last-child': { mb: 0 } 
                  }}
                >
                  <Box sx={{ 
                    display: 'flex', 
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    mb: 0.5 
                  }}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Box 
                        sx={{ 
                          width: 8, 
                          height: 8, 
                          borderRadius: '50%', 
                          bgcolor: item.color,
                          mr: 1
                        }} 
                      />
                      <Typography 
                        variant="body2" 
                        sx={{ 
                          fontSize: '0.85rem',
                          fontWeight: index === 0 ? 600 : 400 
                        }}
                      >
                        {item.name}
                      </Typography>
                    </Box>
                    <Typography 
                      variant="body2" 
                      sx={{ 
                        fontWeight: index === 0 ? 600 : 400,
                        fontSize: '0.85rem'
                      }}
                    >
                      {formatFileSize(item.size)}
                    </Typography>
                  </Box>
                  
                  {/* Progress Bar */}
                  <Box 
                    sx={{ 
                      width: '100%', 
                      height: 4, 
                      bgcolor: 'rgba(255, 255, 255, 0.1)', 
                      borderRadius: 2,
                      overflow: 'hidden'
                    }}
                  >
                    <Box 
                      sx={{ 
                        width: `${percentage}%`, 
                        height: '100%', 
                        bgcolor: item.color,
                        borderRadius: 2 
                      }} 
                    />
                  </Box>
                  
                  {/* Percentage */}
                  <Typography 
                    variant="caption" 
                    sx={{ 
                      color: 'text.secondary',
                      fontSize: '0.7rem',
                      mt: 0.25,
                      display: 'block',
                      textAlign: 'right'
                    }}
                  >
                    {percentage.toFixed(1)}%
                  </Typography>
                </Box>
              );
            })}
          </Box>
          
          {/* Note about top items */}
          {activeTab === 1 && extensionData.length >= 10 && (
            <Typography 
              variant="caption" 
              sx={{ 
                color: 'text.secondary', 
                mt: 1.5,
                pt: 1.5,
                borderTop: '1px solid rgba(255, 255, 255, 0.1)',
                textAlign: 'center'
              }}
            >
              Showing top 10 file extensions by storage usage
            </Typography>
          )}
        </Box>
      </Paper>
    </div>
  );
};

export default StorageUsageChart; 