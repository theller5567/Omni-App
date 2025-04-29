import React from 'react';
import { DataGrid, GridColDef, GridToolbar, GridRowSelectionModel, GridRowParams } from '@mui/x-data-grid';
import { Link, useNavigate } from 'react-router-dom';
import { Box, Chip, Tooltip, Typography } from '@mui/material';
import { formatFileSize } from '../../../utils/formatFileSize';
import { useSelector } from 'react-redux';
import { RootState } from '../../../store/store';
import { isImageFile, isVideoFile, getFileIcon } from '../utils';

interface DataTableProps {
  rows: any[];
  onSelectionChange: (selection: GridRowSelectionModel) => void;
}

const DataTable: React.FC<DataTableProps> = ({ 
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
              />
            </div>
          </div>
        );
      }
      
      if (isVideoFile(params.row.fileExtension) || params.row.mediaType?.includes('Video')) {
        if (params.row.metadata?.v_thumbnail) {
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
                  src={params.row.metadata.v_thumbnail} 
                  alt={params.row.title} 
                  style={{ 
                    position: 'absolute',
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    objectPosition: 'center',
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
      <Link to={`/media/slug/${params.row.slug}`} >{params.row.metadata.fileName}</Link>
    )},
    { field: 'mediaType', headerName: 'Media Type', flex: 0.5, renderCell: (params) => {
      // Get media type and its color
      const mediaTypeColor = mediaTypes.find(type => type.name === params.row.mediaType)?.catColor || '#999';
      
      return (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Box 
            sx={{ 
              width: 12, 
              height: 12, 
              bgcolor: mediaTypeColor, 
              borderRadius: '50%',
              border: '1px solid rgba(0,0,0,0.1)'
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
    { field: 'tags', headerName: 'Tags', flex: 0.5, renderCell: (params) => {
      const tags = params.row.metadata?.tags || [];
      
      // Check if we have tags to display
      if (!tags || !Array.isArray(tags) || tags.length === 0) {
        return <span className="no-tags">No tags</span>;
      }
      
      // Limit displayed tags to 3
      const MAX_DISPLAYED_TAGS = 3;
      const displayedTags = tags.slice(0, MAX_DISPLAYED_TAGS);
      const remainingCount = tags.length - MAX_DISPLAYED_TAGS;
      
      return (
        <Box sx={{ 
          display: 'flex', 
          flexWrap: 'nowrap', 
          gap: '4px', 
          overflow: 'hidden',
          maxWidth: '100%'
        }}>
          {displayedTags.map((tag: string, index: number) => (
            <Tooltip key={index} title={tag} arrow placement="top">
              <Chip
                label={tag}
                size="small"
                sx={{ 
                  backgroundColor: 'var(--accent-color)',
                  color: 'var(--color-text-invert)',
                  height: '20px',
                  fontSize: '0.7rem',
                  maxWidth: '80px',
                  textOverflow: 'ellipsis'
                }}
              />
            </Tooltip>
          ))}
          
          {remainingCount > 0 && (
            <Tooltip 
              title={
                <Box>
                  <Typography variant="caption" sx={{ fontWeight: 'bold', mb: 1, display: 'block' }}>
                    {remainingCount} more tag{remainingCount > 1 ? 's' : ''}:
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: '4px', maxWidth: '200px' }}>
                    {tags.slice(MAX_DISPLAYED_TAGS).map((tag: string, i: number) => (
                      <Chip
                        key={i}
                        label={tag}
                        size="small"
                        sx={{ 
                          backgroundColor: 'var(--accent-color)',
                          color: 'var(--color-text-invert)',
                          height: '20px',
                          fontSize: '0.7rem'
                        }}
                      />
                    ))}
                  </Box>
                </Box>
              }
              arrow
              placement="top"
            >
              <Chip
                label={`+${remainingCount}`}
                size="small"
                sx={{ 
                  height: '20px',
                  fontSize: '0.7rem',
                  backgroundColor: 'var(--bg-secondary)',
                  color: 'var(--text-secondary)',
                  fontWeight: 'bold'
                }}
              />
            </Tooltip>
          )}
        </Box>
      );
    }},
  ];

  return (
    <div style={{ height: '100%', width: '100%', overflow: 'auto' }}>
      <DataGrid
        slots={{
          toolbar: GridToolbar,
        }}
        slotProps={{
          toolbar: {
            showQuickFilter: false,
            quickFilterProps: { debounceMs: 500 },
          },
        }}
        rows={rows}
        columns={columns}
        getRowId={(row) => row.id}
        initialState={{
          pagination: {
            paginationModel: { pageSize: 25 },
          },
          sorting: {
            sortModel: [{ field: 'modifiedDate', sort: 'desc' }],
          },
        }}
        pageSizeOptions={[10, 25, 50, 100]}
        checkboxSelection
        onRowClick={handleRowClick}
        onRowSelectionModelChange={onSelectionChange}
      />
    </div>
  );
};

export default DataTable; 