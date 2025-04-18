import React from 'react';
import { DataGrid, GridColDef, GridToolbar, GridRowSelectionModel } from '@mui/x-data-grid';
import { Link } from 'react-router-dom';
import { Button, Box } from '@mui/material';
import { FaEdit, FaTrash, FaFileVideo, FaFileAudio, FaFilePdf, FaFileWord, FaFileExcel, FaFile } from 'react-icons/fa';
import { formatFileSize } from '../../utils/formatFileSize';
import { useSelector } from 'react-redux';
import { RootState } from '../../store/store';

interface DataTableProps {
  rows: any[];
  onEdit?: (id: string) => void;
  onDelete: (id: string) => void;
  onSelectionChange: (selection: GridRowSelectionModel) => void;
}

const DataTable: React.FC<DataTableProps> = ({ 
  rows, 
  onEdit, 
  onDelete, 
  onSelectionChange 
}) => {
  // Access the current user's role
  const userRole = useSelector((state: RootState) => state.user.currentUser.role);
  
  // Get media types for color mapping
  const mediaTypes = useSelector((state: RootState) => state.mediaTypes.mediaTypes);
  
  // Helper function to determine if a file is an image based on extension
  const isImageFile = (extension?: string) => {
    if (!extension) return false;
    return ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp'].includes(
      extension.toLowerCase()
    );
  };

  // Helper function to determine if a file is a video based on extension
  const isVideoFile = (extension?: string) => {
    if (!extension) return false;
    return ['mp4', 'webm', 'mov', 'avi', 'mkv'].includes(
      extension.toLowerCase()
    );
  };

  // Helper function to get the appropriate icon based on file type
  const getFileIcon = (fileExtension?: string, mediaType?: string) => {
    const extension = fileExtension?.toLowerCase();
    
    // Video files
    if (extension && ['mp4', 'webm', 'mov', 'avi', 'mkv'].includes(extension) || 
        mediaType?.includes('Video')) {
      return <FaFileVideo size={24} color="#3b82f6" />;
    }
    
    // Audio files
    if (extension && ['mp3', 'wav', 'ogg', 'aac', 'flac'].includes(extension) || 
        mediaType?.includes('Audio')) {
      return <FaFileAudio size={24} color="#06b6d4" />;
    }
    
    // Document files
    if (extension === 'pdf') {
      return <FaFilePdf size={24} color="#ef4444" />;
    }
    
    if (extension && ['doc', 'docx'].includes(extension)) {
      return <FaFileWord size={24} color="#3b82f6" />;
    }
    
    if (extension && ['xls', 'xlsx'].includes(extension)) {
      return <FaFileExcel size={24} color="#10b981" />;
    }
    
    // Default file icon for other types
    return <FaFile size={24} />;
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
              width: 10, 
              height: 10, 
              bgcolor: mediaTypeColor, 
              className: 'media-type-color',
              borderRadius: '50%',
              border: '1px solid rgba(0,0,0,0.1)',
              boxShadow: `0 2px 4px ${mediaTypeColor}`
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
      const tags = params.row.metadata.tags;
      if (Array.isArray(tags)) {
        return tags.map((tag, index) => (
          <span key={index} className="tag">
            {tag}{index < params.row.metadata.tags.length - 1 ? ', ' : ''}
          </span>
        ));
      } else {
        return <span>No tags available</span>;
      }
    }},
    ...(userRole === 'superAdmin' ? [{
      field: 'actions',
      headerName: 'Actions',
      flex: 0.5,
      sortable: false,
      renderCell: (params: any) => (
        <div style={{ display: 'flex', gap: '8px' }}>
          <Button
            variant="contained"
            color="primary"
            size="small"
            onClick={() => onEdit && onEdit(params.row.id)}
          >
            <FaEdit />
          </Button>
          <Button
            variant="contained"
            color="error"
            size="small"
            onClick={() => onDelete(params.row.id)}
          >
            <FaTrash />
          </Button>
        </div>
      ),
    }] : []),
  ];

  return (
    <div style={{ height: '100%', width: '100%', overflow: 'auto' }}>
      <DataGrid
        slots={{
          toolbar: GridToolbar,
        }}
        rows={rows}
        columns={columns}
        getRowId={(row) => row.id}
        pageSizeOptions={[5, 10, 20]}
        initialState={{
          pagination: {
            paginationModel: { pageSize: 10 },
          },
          sorting: {
            sortModel: [{ field: 'modifiedDate', sort: 'desc' }],
          },
        }}
        checkboxSelection
        disableRowSelectionOnClick
        onRowSelectionModelChange={onSelectionChange}
      />
    </div>
  );
};

export default DataTable; 