import React from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../../store/store';
import { Paper, Typography, Box } from '@mui/material';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

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

// Custom legend with proper spacing
const CustomLegend = (props: any) => {
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
      {payload.map((entry: any, index: number) => (
        <li 
          key={`legend-item-${index}`} 
          style={{ 
            display: 'flex', 
            alignItems: 'center', 
            marginRight: 20,
            marginBottom: 8,
            fontSize: '12px',
            color: 'rgba(255, 255, 255, 0.7)'
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

// Custom tooltip component with typescript
interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<any>;
}

const CustomTooltip: React.FC<CustomTooltipProps> = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const data = payload[0];
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
          color: '#fff',
          margin: '0',
          fontSize: '12px' 
        }}>
          <span style={{ marginRight: '6px' }}>{data.value} files</span>
          <span style={{ 
            color: 'rgba(255, 255, 255, 0.7)',
            fontSize: '11px'
          }}>({percentage}%)</span>
        </p>
      </div>
    );
  }

  return null;
};

const MediaTypeDistribution: React.FC = () => {
  // Get media and media types from Redux store
  const allMedia = useSelector((state: RootState) => state.media.allMedia);
  const mediaTypes = useSelector((state: RootState) => state.mediaTypes.mediaTypes);
  
  // Calculate distribution data
  const getDistributionData = () => {
    // Create a count map of media types
    const mediaTypeCounts = allMedia.reduce((acc: {[key: string]: number}, media) => {
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
  
  // Create legend data from our data
  const legendPayload = data.map(item => ({
    value: `${item.name} (${item.value})`,
    type: 'circle',
    color: item.color,
    id: item.name,
  }));
  
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
          minHeight: '300px',
          position: 'relative'
        }}>
          <ResponsiveContainer width="100%" height="100%" minHeight={300}>
            <PieChart margin={{ top: 10, right: 10, bottom: 10, left: 10 }}>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                labelLine={false}
                outerRadius={100}
                innerRadius={60}
                paddingAngle={2}
                cornerRadius={3}
                dataKey="value"
                stroke="rgba(0, 0, 0, 0.2)"
                strokeWidth={1}
                // Add labels directly to the Pie component
                label={({ 
                  cx, cy, midAngle, outerRadius, percent, name, index
                }: any) => {
                  if (index >= 5 || percent < 0.08) return null;  // Only show for top 5 and significant slices
                  const RADIAN = Math.PI / 180;
                  const radius = outerRadius * 1.1;
                  const x = cx + radius * Math.cos(-midAngle * RADIAN);
                  const y = cy + radius * Math.sin(-midAngle * RADIAN);
                  
                  return (
                    <text
                      x={x}
                      y={y}
                      fill="#fff"
                      textAnchor={x > cx ? 'start' : 'end'}
                      dominantBaseline="central"
                      fontSize={12}
                    >
                      {`${name} ${(percent * 100).toFixed(0)}%`}
                    </text>
                  );
                }}
              >
                {data.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={entry.color} 
                  />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend 
                content={<CustomLegend />}
                layout="horizontal"
                verticalAlign="bottom"
                align="center"
              />
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