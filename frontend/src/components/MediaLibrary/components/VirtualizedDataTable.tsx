import React from 'react';
import { DataGrid, GridColDef, GridToolbar, GridRowSelectionModel, GridRowParams } from '@mui/x-data-grid';
import { Link, useNavigate } from 'react-router-dom';
import { Box, Chip, Stack } from '@mui/material';
import { formatFileSize } from '../../../utils/formatFileSize';
import { useSelector } from 'react-redux';
import { RootState } from '../../../store/store';
import { isImageFile, isVideoFile, getFileIcon } from '../utils';

interface VirtualizedDataTableProps {
  rows: any[];
  onSelectionChange: (selection: GridRowSelectionModel) => void;
}

const VirtualizedDataTable: React.FC<VirtualizedDataTableProps> = ({ 
  rows,
  onSelectionChange 
}) => {
  const navigate = useNavigate();
  
  // Get media types for color mapping
  const mediaTypes = useSelector((state: RootState) => state.mediaTypes.mediaTypes);
  
  // Handle row click to navigate to detail view
  const handleRowClick = (params: GridRowParams) => {
    navigate(`/media/slug/${params.row.slug}`);
  };
  
  const columns: GridColDef[] = [
    { field: 'image', headerName: 'Preview', flex: 0.5, renderCell: (params) => {
      if (isImageFile(params.row.fileExtension)) {
        return (
          <div style={{
            width: '100%',
            display: 'flex',
            justifyContent: 'flex-start',
            alignItems: 'center',
            height: '100%',
          }}>
            <div style={{
              width: 'calc(100% - 10px)',
              height: 'calc(100% - 10px)',
              maxWidth: '40px',
              maxHeight: '40px',
              borderRadius: '4px',
              overflow: 'hidden',
              backgroundColor: '#f0f0f0',
              display: 'flex',
              justifyContent: 'flex-start',
              alignItems: 'center',
              position: 'relative',
            }}>
              <img 
                src={params.row.location} 
                alt={params.row.title} 
                style={{ 
                  position: 'absolute',
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  objectPosition: 'center',
                }} 
                loading="lazy" // Add lazy loading for images
              />
            </div>
          </div>
        );
      }
      
      if (isVideoFile(params.row.fileExtension) || params.row.mediaType?.includes('Video')) {
        if (params.row.metadata?.v_thumbnail) {
          // Add a cache-busting parameter using timestamp to ensure fresh image on every render
          const timestamp = params.row.metadata?.v_thumbnailTimestamp || Date.now();
          const thumbnailUrl = params.row.metadata.v_thumbnail.split('?')[0]; // Get clean URL
          const thumbnailWithCacheBuster = `${thumbnailUrl}?t=${timestamp}&id=${params.row.id || ''}`;
          return (
            <div style={{
              width: '100%',
              display: 'flex',
              justifyContent: 'flex-start',
              alignItems: 'center',
              height: '100%',
            }}>
              <div style={{
                width: 'calc(100% - 10px)',
                height: 'calc(100% - 10px)',
                maxWidth: '40px',
                maxHeight: '40px',
                borderRadius: '4px',
                overflow: 'hidden',
                backgroundColor: '#f0f0f0',
                display: 'flex',
                justifyContent: 'flex-start',
                alignItems: 'center',
                position: 'relative',
              }}>
                <img 
                  src={thumbnailWithCacheBuster} 
                  alt={params.row.title} 
                  style={{ 
                    position: 'absolute',
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    objectPosition: 'center',
                  }} 
                  loading="lazy" 
                  key={`thumb-${params.row.id}-${timestamp}`} // Add key to force re-render
                />
              </div>
            </div>
          );
        }
      }
      
      return (
        <div style={{
          width: '100%',
          display: 'flex',
          justifyContent: 'flex-start',
          alignItems: 'center',
          height: '100%',
        }}>
          <div style={{
            width: 'calc(100% - 10px)',
            height: 'calc(100% - 10px)',
            maxWidth: '40px',
            maxHeight: '40px',
            borderRadius: '4px',
            backgroundColor: '#f0f0f0',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
          }}>
            {getFileIcon(params.row.fileExtension, params.row.mediaType)}
          </div>
        </div>
      );
    }},
    { field: 'fileName', headerName: 'Title', flex: 0.5, renderCell: (params) => (
      <Link to={`/media/slug/${params.row.slug}`} >{params.row.metadata.fileName}</Link>
    )},
    { field: 'mediaType', headerName: 'Media Type', flex: 0.5, renderCell: (params) => {
      // Get media type and its color
      const mediaTypeColor = mediaTypes.find(type => type.name === params.row.mediaType)?.catColor || '#999';
      
      return (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Box 
            sx={{ 
              width: 10, 
              height: 10, 
              bgcolor: mediaTypeColor, 
              borderRadius: '50%',
              border: '1px solid rgba(0,0,0,0.1)',
              boxShadow: `0 0 3px ${mediaTypeColor}`
            }}
          />
          <span>{params.row.mediaType}</span>
        </Box>
      );
    }},
    { 
      field: 'fileSize', 
      headerName: 'Size', 
      flex: 0.5, 
      valueFormatter: (value: number) => {
        if (value === undefined || value === null) return 'N/A';
        return formatFileSize(value);
      }
    },
    { field: 'fileExtension', headerName: 'Extension', flex: 0.5 },
    { 
      field: 'modifiedDate', 
      headerName: 'Modified Date',
      flex: 0.5,
      valueFormatter: (value: string) => {
        if (!value) return 'N/A';
        return new Date(value).toLocaleDateString();
      }
    },
    { field: 'tags', headerName: 'Tags', flex: 1, renderCell: (params) => {
      const tags = params.row.metadata.tags;
      if (Array.isArray(tags) && tags.length > 0) {
        // Get the media type to check for default tags
        const mediaType = mediaTypes.find(type => type.name === params.row.mediaType);
        const defaultTags = mediaType?.defaultTags || [];
        
        // Sort tags to display default tags first
        const sortedTags = [...tags].sort((a, b) => {
          const aIsDefault = defaultTags.includes(a);
          const bIsDefault = defaultTags.includes(b);
          if (aIsDefault === bIsDefault) return 0;
          return aIsDefault ? -1 : 1;
        });
        
        return (
          <Stack 
            direction="row" 
            spacing={0.5} 
            sx={{ 
              flexWrap: 'wrap', 
              gap: '4px',
              alignItems: 'center',
              justifyContent: 'flex-start',
              height: '100%',
              overflow: 'hidden',
              py: 0.5
            }}
          >
            {sortedTags.slice(0, 3).map((tag, index) => {
              const isDefaultTag = defaultTags.includes(tag);
              return (
                <Chip 
                  key={index} 
                  label={tag} 
                  size="small" 
                  variant={isDefaultTag ? "filled" : "outlined"}
                  className={isDefaultTag ? "default-tag" : "custom-tag"}
                  sx={{ 
                    fontSize: '0.7rem', 
                    height: '20px',
                    maxWidth: '80px',
                    my: 0,
                    ...(isDefaultTag && {
                      backgroundColor: 'var(--secondary-color)',
                      color: 'white',
                    }),
                    '& .MuiChip-label': {
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      py: 0,
                      px: 2
                    }
                  }}
                />
              );
            })}
            {tags.length > 3 && (
              <Chip 
                label={`+${tags.length - 3}`}
                size="small"
                sx={{ 
                  fontSize: '0.7rem',
                  height: '20px',
                  my: 0,
                  backgroundColor: 'rgba(0,0,0,0.1)'
                }}
              />
            )}
          </Stack>
        );
      } else {
        return (
          <Box sx={{ height: '100%', display: 'flex', alignItems: 'center' }}>
            <span style={{ opacity: 0.5 }}>No tags</span>
          </Box>
        );
      }
    }},
  ];

  // Set up DataGrid with virtualization features
  return (
    <div style={{ height: '100%', width: '100%', overflow: 'auto' }}>
      <DataGrid
        rows={rows}
        columns={columns}
        getRowId={(row) => row.id}
        pageSizeOptions={[5, 10, 20, 50, 100]}
        initialState={{
          pagination: {
            paginationModel: { pageSize: 10 },
          },
          sorting: {
            sortModel: [{ field: 'modifiedDate', sort: 'desc' }],
          },
        }}
        slots={{
          toolbar: GridToolbar,
        }}
        checkboxSelection
        onRowClick={handleRowClick}
        onRowSelectionModelChange={onSelectionChange}
        rowHeight={52} // Fixed row height for better virtualization
        rowBufferPx={100} // Increase buffer size for smoother scrolling
        columnBufferPx={100} // Increase column buffer for smoother horizontal scrolling
        loading={rows.length === 0}
        getRowClassName={(params) => `row-${params.indexRelativeToCurrentPage % 2 === 0 ? 'even' : 'odd'}`}
        sx={{
          '& .row-even': {
            backgroundColor: theme => theme.palette.mode === 'dark' ? 'rgba(45, 45, 45, 0.4)' : 'rgba(245, 245, 245, 0.5)',
          },
          '& .MuiDataGrid-cell': {
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          },
        }}
      />
    </div>
  );
};

export default VirtualizedDataTable; 