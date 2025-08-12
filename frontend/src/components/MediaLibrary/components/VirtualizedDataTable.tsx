import React from 'react';
import { DataGrid, GridColDef, GridToolbar, GridRowSelectionModel, GridRowParams } from '@mui/x-data-grid';
import { Link, useNavigate } from 'react-router-dom';
import { Box, Chip, Stack } from '@mui/material';
import { formatFileSize } from '../../../utils/formatFileSize';
import { useMediaTypes, TransformedMediaFile } from '../../../hooks/query-hooks';
import { isImageFile, isVideoFile, getFileIcon } from '../utils';
import { cdnUrl, cdnSrcSet } from '../../../utils/imageCdn';

interface VirtualizedDataTableProps {
  rows: TransformedMediaFile[];
  onSelectionChange?: (selection: GridRowSelectionModel) => void;
  showCheckboxes?: boolean;
  selectionModel?: GridRowSelectionModel;
}

const VirtualizedDataTable: React.FC<VirtualizedDataTableProps> = ({ 
  rows,
  onSelectionChange,
  showCheckboxes = true,
  selectionModel
}) => {
  const navigate = useNavigate();
  
  // Get media types using TanStack Query instead of Redux
  const { data: mediaTypes = [] } = useMediaTypes({ enabled: true });
  
  // Handle row click to navigate to detail view
  const handleRowClick = (params: GridRowParams) => {
    if (params.row.slug) {
      navigate(`/media/slug/${params.row.slug}`);
    } else if (params.row.id) {
      // Fallback to ID if slug is not available
      navigate(`/media/id/${params.row.id}`);
    }
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
                src={cdnUrl(params.row.location, { w: 80 })}
                srcSet={cdnSrcSet(params.row.location, [40, 60, 80, 120])}
                sizes="40px"
                alt={params.row.title} 
                style={{ 
                  position: 'absolute',
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  objectPosition: 'center',
                }} 
                loading="lazy" // Add lazy loading for images
                decoding="async"
                width={40}
                height={40}
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).src = params.row.location;
                  (e.currentTarget as HTMLImageElement).srcset = '';
                }}
              />
            </div>
          </div>
        );
      }
      
      const mtName = (params.row as any).mediaTypeName || params.row.mediaType;
      if (isVideoFile(params.row.fileExtension) || (typeof mtName === 'string' && mtName.includes('Video'))) {
        console.log("HIIIIIIIII",params.row.metadata);
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
                  src={cdnUrl(thumbnailWithCacheBuster, { w: 80 })}
                  srcSet={cdnSrcSet(thumbnailWithCacheBuster, [40, 60, 80, 120])}
                  sizes="40px"
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
                  decoding="async"
                  width={40}
                  height={40}
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).src = thumbnailWithCacheBuster;
                    (e.currentTarget as HTMLImageElement).srcset = '';
                  }}
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
      <Link to={params.row.slug ? `/media/slug/${params.row.slug}` : `/media/id/${params.row.id}`}>
        {params.row.metadata.fileName || params.row.title || 'Untitled'}
      </Link>
    )},
    { field: 'mediaType', headerName: 'Media Type', flex: 0.5, renderCell: (params) => {
      const mtId = (params.row as any).mediaTypeId;
      const mtName = (params.row as any).mediaTypeName || params.row.mediaType;
      const found = mtId ? mediaTypes.find(t => (t as any)._id === mtId) : mediaTypes.find(t => t.name === mtName);
      const mediaTypeColor = found?.catColor || '#999';
      const label = found?.name || mtName || 'Unknown';
      return (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Box sx={{ width: 10, height: 10, bgcolor: mediaTypeColor, borderRadius: '50%', border: '1px solid rgba(0,0,0,0.1)', boxShadow: `0 0 3px ${mediaTypeColor}` }} />
          <span>{label}</span>
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
        try {
          // Parse the date - handle both ISO strings and Date objects
          const date = new Date(value);
          // Check if date is valid before formatting
          if (isNaN(date.getTime())) return 'Invalid date';
          // Format using browser locale for consistent display
          return date.toLocaleDateString(undefined, {
            year: 'numeric',
            month: 'numeric',
            day: 'numeric'
          });
        } catch (err) {
          console.error('Date parsing error:', err);
          return 'Error';
        }
      }
    },
    { field: 'tags', headerName: 'Tags', flex: 1, renderCell: (params) => {
      const tags = params.row.metadata.tags;
      if (Array.isArray(tags) && tags.length > 0) {
        const mtId = (params.row as any).mediaTypeId;
        const mtName = (params.row as any).mediaTypeName || params.row.mediaType;
        const mediaType = mtId ? mediaTypes.find(type => (type as any)._id === mtId) : mediaTypes.find(type => type.name === mtName);
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
                      color: 'var(--text-on-secondary)',
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
        checkboxSelection={showCheckboxes}
        onRowClick={handleRowClick}
        onRowSelectionModelChange={onSelectionChange}
        rowSelectionModel={selectionModel}
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