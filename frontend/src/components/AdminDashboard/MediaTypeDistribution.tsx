import React from 'react';
import { Paper, Typography, Box, CircularProgress } from '@mui/material';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, LegendType } from 'recharts';
import { useTransformedMedia, useMediaTypesWithUsageCounts, TransformedMediaFile, useUserProfile } from '../../hooks/query-hooks';

const COLORS: Record<string, string> = {
  'Product Image': '#3f8cff',
  'Webinar Video': '#8bc34a',
  'Protocol': '#ff4081',
  'Application Note': '#ffc107',
  'Application Header Image': '#03a9f4'
};

const DEFAULT_COLORS = [
  '#3f8cff', // blue
  '#ffc107', // amber
  '#8bc34a', // light green
  '#ff4081', // pink
  '#03a9f4', // light blue
  '#9c27b0', // purple
  '#f44336', // red
  '#4caf50', // green
  '#ff9800', // orange
  '#2196f3', // blue
];

// Define types for Recharts custom components props
interface LegendPayloadEntry {
  value: string;
  color: string;
  type?: LegendType;
  [key: string]: any; // For other Recharts properties
}

interface CustomLegendProps {
  payload?: LegendPayloadEntry[];
}

// Custom legend with proper spacing
const CustomLegend = (props: CustomLegendProps) => {
  const { payload } = props;
  
  return (
    <ul style={{ 
      display: 'flex', 
      flexWrap: 'wrap', 
      justifyContent: 'center',
      padding: 0,
      margin: '10px 0 0 0',
      listStyle: 'none'
    }}>
      {payload?.map((entry: LegendPayloadEntry, index: number) => (
        <li 
          key={`legend-item-${index}`} 
          style={{ 
            display: 'flex', 
            alignItems: 'center', 
            marginRight: 20,
            marginBottom: 8,
            fontSize: '12px',
            color: 'var(--text-primary)'
          }}
        >
          <span style={{ 
            display: 'block',
            width: 10,
            height: 10,
            borderRadius: '50%',
            backgroundColor: entry.color,
            marginRight: 8
          }} />
          {entry.value}
        </li>
      ))}
    </ul>
  );
};

// Define types for CustomTooltip props focusing on used fields
interface ChartDataItemForTooltip {
  name: string;
  value: number;
  totalCount?: number; // From your data structure
  color?: string;
  [key: string]: any; // Original data item might have more fields
}

interface TooltipPayloadItem {
  name: string; 
  value: number; 
  payload: ChartDataItemForTooltip; // The original data item for this segment
  color?: string;
  [key: string]: any; // Other Recharts properties
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: TooltipPayloadItem[];
  label?: string | number;
}

const CustomTooltip: React.FC<CustomTooltipProps> = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const data = payload[0]; // data is TooltipPayloadItem
    const totalCount = data.payload.totalCount || 1;
    const percentage = ((data.value / totalCount) * 100).toFixed(1);
    
    return (
      <div style={{ 
        backgroundColor: '#333',
        padding: '10px',
        border: 'none',
        borderRadius: '4px', 
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.5)'
      }}>
        <p style={{ 
          color: '#fff', 
          fontWeight: 'bold',
          margin: '0 0 5px 0',
          fontSize: '13px'
        }}>{data.name}</p>
        <p style={{ 
          color: 'var(--text-primary)',
          margin: '0',
          fontSize: '12px' 
        }}>
          <span style={{ marginRight: '6px' }}>{data.value} files</span>
          <span style={{ 
            color: 'var(--text-primary)',
            fontSize: '11px'
          }}>({percentage}%)</span>
        </p>
      </div>
    );
  }

  return null;
};

const MediaTypeDistribution: React.FC = () => {
  const { data: userProfile, isLoading: isLoadingUserProfile } = useUserProfile();

  const { 
    data: allMedia = [], 
    isLoading: isLoadingMedia, 
    isError: isMediaError 
  } = useTransformedMedia(userProfile);
  
  const { 
    data: mediaTypes = [], 
    isLoading: isLoadingMediaTypes, 
    isError: isMediaTypesError 
  } = useMediaTypesWithUsageCounts(userProfile);
  
  // Loading state
  if (isLoadingUserProfile || isLoadingMedia || isLoadingMediaTypes) {
    return (
      <Paper elevation={2} className="dashboard-card media-types-chart">
        <Typography variant="h6" gutterBottom>Media Type Distribution</Typography>
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          height: '300px' 
        }}>
          <CircularProgress />
        </Box>
      </Paper>
    );
  }
  
  // Error state
  if (isMediaError || isMediaTypesError) {
    return (
      <Paper elevation={2} className="dashboard-card media-types-chart">
        <Typography variant="h6" gutterBottom>Media Type Distribution</Typography>
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          height: '300px' 
        }}>
          <Typography variant="body1" color="error">
            Error loading data. Please try refreshing the page.
          </Typography>
        </Box>
      </Paper>
    );
  }
  
  // Calculate distribution data
  const getDistributionData = () => {
    // Create a count map of media types
    const mediaTypeCounts = allMedia.reduce((acc: Record<string, number>, media: TransformedMediaFile) => {
      const type = media.mediaType || 'Uncategorized';
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {});
    
    // Convert to array format for the chart and assign consistent colors
    return Object.entries(mediaTypeCounts).map(([name, value], index) => ({
      name,
      value,
      totalCount: allMedia.length, // Add total count to each item for percentage calculation
      // Use predefined color if available, otherwise use color from mediaTypes or default colors
      color: COLORS[name] || mediaTypes.find(type => type.name === name)?.catColor || DEFAULT_COLORS[index % DEFAULT_COLORS.length]
    })).sort((a, b) => b.value - a.value); // Sort by count descending
  };
  
  const data = getDistributionData();
  
  // Empty state
  if (data.length === 0) {
    return (
      <Paper elevation={2} className="dashboard-card media-types-chart">
        <Typography variant="h6" gutterBottom>Media Type Distribution</Typography>
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          height: '300px' 
        }}>
          <Typography variant="body1" color="textSecondary">
            No media files available to display distribution.
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
      marginBottom: '1.25rem'
    }}>
      <Paper 
        elevation={2} 
        className="dashboard-card media-types-chart" 
        style={{ gridColumn: 'span 7' }}
      >
        <Typography variant="h6" sx={{ mb: 1 }}>Media Type Distribution</Typography>
        <Box sx={{ 
          width: '100%', 
          height: 'calc(100% - 40px)', 
          minHeight: '350px',
          position: 'relative'
        }}>
          <ResponsiveContainer width="100%" height="100%" minHeight={350}>
            <PieChart 
              width={500} 
              height={360}
              margin={{ top: 0, right: 0, bottom: 0, left: 0 }}
            >
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={(entry: ChartDataItemForTooltip) => `${entry.name} (${((entry.value / allMedia.length) * 100).toFixed(0)}%)`}
                outerRadius={100}
                innerRadius={60}
                paddingAngle={2}
                dataKey="value"
                nameKey="name"
                stroke="none"
              >
                {data.map((_entry: ChartDataItemForTooltip, index: number) => (
                  <Cell key={`cell-${index}`} fill={_entry.color || DEFAULT_COLORS[index % DEFAULT_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend content={<CustomLegend />} verticalAlign="bottom" wrapperStyle={{ marginTop: 20 }} />
            </PieChart>
          </ResponsiveContainer>
        </Box>
      </Paper>
      
      <Paper 
        elevation={2} 
        className="dashboard-card has-scroll" 
        style={{ gridColumn: 'span 5', padding: '1rem' }}
      >
        <Box sx={{ 
          display: 'flex', 
          flexDirection: 'column', 
          height: '100%'
        }}>
          {/* Total Files Header */}
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
                Total Files
              </Typography>
              <Typography variant="h4" color="primary" sx={{ mt: 0.5, fontWeight: 600 }}>
                {allMedia.length}
              </Typography>
            </Box>
            
            <Box sx={{ textAlign: 'right' }}>
              <Typography variant="subtitle2" color="textSecondary" sx={{ fontSize: '0.75rem' }}>
                Media Types
              </Typography>
              <Typography variant="h6" sx={{ mt: 0.5 }}>
                {data.length}
              </Typography>
            </Box>
          </Box>
          
          {/* Media Types List */}
          <Box sx={{ flexGrow: 1, overflow: 'auto' }}>
            {data.map((item, index) => {
              const percentage = allMedia.length ? (item.value / allMedia.length * 100) : 0;
              
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
                    <Box sx={{ display: 'flex', alignItems: 'center', maxWidth: '75%' }}>
                      <Box 
                        sx={{ 
                          width: 8, 
                          height: 8, 
                          borderRadius: '50%', 
                          bgcolor: item.color,
                          flexShrink: 0,
                          mr: 1
                        }} 
                      />
                      <Typography 
                        variant="body2" 
                        sx={{ 
                          fontSize: '0.85rem',
                          fontWeight: index === 0 ? 600 : 400,
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis'
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
                      {item.value}
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
        </Box>
      </Paper>
    </div>
  );
};

export default MediaTypeDistribution; 