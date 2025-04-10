import React, { useState } from 'react';
import { Box, Typography, Grid, Button, Toolbar, IconButton, Tooltip } from '@mui/material';
import { motion } from 'framer-motion';
import './MediaLibrary.scss';
import HeaderComponent from './HeaderComponent';
import MediaCard from './MediaCard';
import { useNavigate, Link } from 'react-router-dom';
import { styled } from '@mui/material/styles';
import { FaTrash, FaEdit, FaFileVideo, FaFileAudio, FaFilePdf, FaFileWord, FaFileExcel, FaFile } from 'react-icons/fa';
import { BaseMediaFile } from '../../interfaces/MediaFile';
import { DataGrid, GridColDef, GridToolbar } from '@mui/x-data-grid';
import { formatFileSize } from '../../utils/formatFileSize';
import { toast } from 'react-toastify';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import ConfirmationModal from './ConfirmationModal';
import { alpha } from '@mui/material/styles';
import { useSelector } from 'react-redux';
import { RootState } from '../../store/store';

const CustomGrid = styled(Grid)({
  '&.grid-view': {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
    gap: '16px',
  },
  '&.list-view': {
    display: 'block',
    gap: '2px'
  },
});

interface MediaLibraryProps {
  mediaFilesData: BaseMediaFile[];
  setSearchQuery: React.Dispatch<React.SetStateAction<string>>;
  onAddMedia: () => void;
  onDeleteMedia: (id: string) => Promise<boolean>;
  selectedMediaType: string;
  handleMediaTypeChange: (type: string) => void;
}

// Define media types in the frontend


const MediaLibrary: React.FC<MediaLibraryProps> = ({ mediaFilesData, setSearchQuery, onAddMedia, onDeleteMedia }) => {
  const [viewMode, setViewMode] = useState<'list' | 'card'>('list');
  const [selectedMediaType, setSelectedMediaType] = useState<string>('All');
  const navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selected, setSelected] = useState<readonly (string | number)[]>([]);
  const [selectedFileId, setSelectedFileId] = useState<string | null>(null);
  const [isToolbarDelete, setIsToolbarDelete] = useState(false);
  const prevDataRef = React.useRef<string>('');
  
  // Get media types for color mapping
  const mediaTypes = useSelector((state: RootState) => state.mediaTypes.mediaTypes);

  // Process rows only when mediaFilesData or filter changes
  const rows = React.useMemo(() => {
    const newRows = mediaFilesData
      .filter(file => selectedMediaType === 'All' || file.mediaType === selectedMediaType)
      .map((file) => ({
        id: file._id || file.id || crypto.randomUUID(),
        location: file.location || '',
        title: file.title || '',
        fileSize: file.fileSize || 0,
        fileExtension: file.fileExtension || '',
        modifiedDate: file.modifiedDate,
        metadata: {
          fileName: file.metadata?.fileName || 'Untitled',
          altText: file.metadata?.altText || '',
          description: file.metadata?.description || '',
          tags: file.metadata?.tags || [],
          visibility: file.metadata?.visibility || 'public',
          catColor: file.metadata?.catColor || null,
          v_thumbnail: file.metadata?.v_thumbnail || null,
          v_thumbnailTimestamp: file.metadata?.v_thumbnailTimestamp || null
        },
        slug: file.slug || '',
        mediaType: file.mediaType || 'Unknown'
      }));

    const dataString = JSON.stringify({ count: newRows.length, types: [...new Set(newRows.map(row => row.mediaType))] });
    if (newRows.length > 0 && dataString !== prevDataRef.current) {
      console.log('MediaLibrary - Data ready:', {
        count: newRows.length,
        types: [...new Set(newRows.map(row => row.mediaType))]
      });
      prevDataRef.current = dataString;
    }

    if (newRows.length > 0) {
      console.log('Row data sample:', {
        firstRow: newRows[0],
        hasVideoThumbnails: newRows.some(row => row.metadata?.v_thumbnail),
        totalRows: newRows.length
      });
    }

    return newRows;
  }, [mediaFilesData, selectedMediaType]);

  const toggleView = () => {
    setViewMode((prevView) => (prevView === 'list' ? 'card' : 'list'));
  };

  const handleFileClick = (file: BaseMediaFile) => {
    navigate(`/media/slug/${file.slug}`);
  };

  const handleMediaTypeChange = (type: string) => {
    setSelectedMediaType(type);
  };

  const renderCell = (params: any) => {
    const tags = params.row.metadata.tags;
    // Ensure tags is an array before using map
    if (Array.isArray(tags)) {
      return tags.map((tag, index) => (
         <span key={index} className="tag">
            {tag}{index < params.row.metadata.tags.length - 1 ? ', ' : ''}
          </span>
      ));
    } else {
      console.warn('Expected tags to be an array, but got:', typeof tags);
      return <span>No tags available</span>;
    }
  };

  // Access the current user's role
  const userRole = useSelector((state: RootState) => state.user.currentUser.role);

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
      if (isVideoFile(params.row.fileExtension) || params.row.mediaType?.includes('Video')) {
        console.log('Video file preview:', {
          fileExtension: params.row.fileExtension,
          mediaType: params.row.mediaType,
          hasThumbnail: Boolean(params.row.metadata?.v_thumbnail),
          thumbnailUrl: params.row.metadata?.v_thumbnail
        });
      }

      if (isImageFile(params.row.fileExtension)) {
        return (
          <img 
            src={params.row.location} 
            alt={params.row.title} 
            style={{ 
              width: '60px', 
              height: '60px', 
              padding: '0.3rem', 
              alignSelf: 'center', 
              objectFit: 'cover',
              borderRadius: '4px'
            }} 
          />
        );
      }
      
      if (isVideoFile(params.row.fileExtension) || params.row.mediaType?.includes('Video')) {
        if (params.row.metadata?.v_thumbnail) {
          return (
            <img 
              src={params.row.metadata.v_thumbnail} 
              alt={params.row.title} 
              style={{ 
                width: '60px', 
                height: '60px', 
                padding: '0.3rem', 
                alignSelf: 'center', 
                objectFit: 'cover',
                borderRadius: '4px'
              }} 
            />
          );
        }
      }
      
      return (
        <div style={{ 
          width: '60px', 
          height: '60px', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          backgroundColor: 'rgba(0,0,0,0.04)',
          borderRadius: '4px'
        }}>
          {getFileIcon(params.row.fileExtension, params.row.mediaType)}
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
    { field: 'tags', headerName: 'Tags', flex: 0.5, renderCell: renderCell },
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
            onClick={() => handleEdit(params.row.id)}
          >
            <FaEdit />
          </Button>
          <Button
            variant="contained"
            color="error"
            size="small"
            onClick={() => handleDeleteClick(params.row.id)}
          >
            <FaTrash />
          </Button>
        </div>
      ),
    }] : []),
  ];

  const containerVariants = {
    hidden: { opacity: 0, x: -350 },
    visible: { opacity: 1, x: 0, transition: { duration: 0.5 } },
    exit: { opacity: 0, x: -350, transition: { duration: 0.5 } },
  };

  const handleEdit = (id: string) => {
    // Implement edit logic here
    console.log(`Edit record with id: ${id}`);
  };

  const handleDeleteClick = (id: string) => {
    setSelectedFileId(id);
    setIsModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (isToolbarDelete) {
      // Handle multiple deletions
      const promises = selected.map(id => onDeleteMedia(id as string));
      const results = await Promise.all(promises);

      if (results.every(result => result)) {
        toast.success('Selected media deleted successfully');
        setSelected([]); // Clear selection after deletion
      } else {
        toast.error('Failed to delete some media');
      }
    } else if (selectedFileId) {
      // Handle single deletion
      const success = await onDeleteMedia(selectedFileId);
      if (success) {
        toast.success('Media deleted successfully');
        setSelectedFileId(null); // Clear the selected file ID
      } else {
        toast.error('Failed to delete media');
      }
    }
    setIsModalOpen(false);
    setIsToolbarDelete(false); // Reset the toolbar delete flag
  };

  const handleDeleteSelected = () => {
    if (selected.length > 0) {
      setIsToolbarDelete(true);
      setIsModalOpen(true);
    }
  };

  const EnhancedTableToolbar = ({ numSelected }: { numSelected: number }) => (
    
    <Toolbar
      className="toolbar"
      sx={{
        ...(numSelected > 0 && {
          bgcolor: (theme) =>
            alpha(theme.palette.primary.main, theme.palette.action.activatedOpacity),
        }),
      }}
    >
      {numSelected > 0 && (
        <Typography
          sx={{ flex: '1 1 100%' }}
          color="inherit"
          variant="subtitle1"
          component="div"
        >
          {numSelected} selected
        </Typography>
      )}
      {numSelected > 0 ? (
        <Tooltip title="Delete">
          <IconButton onClick={handleDeleteSelected}>
            <FaTrash />
          </IconButton>
        </Tooltip>
      ) : null}
    </Toolbar>
  );

  return (
    <motion.div
      id="media-library"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
    >
      <Box className="media-library" sx={{ width: '100%', overflow: 'hidden' }}>
        <Typography variant="h2" align="left" sx={{ paddingBottom: '2rem' }}>OMNI Media Library</Typography>
        <HeaderComponent
          view={viewMode}
          toggleView={toggleView}
          mediaFilesData={mediaFilesData}
          setSearchQuery={setSearchQuery}
          selectedMediaType={selectedMediaType}
          handleMediaTypeChange={handleMediaTypeChange}
          onAddMedia={onAddMedia}
        />
        <Box sx={{ width: '100%', height: 'calc(100% - 4rem)', overflow: 'hidden' }}>
          {selected.length > 0 && (
            <EnhancedTableToolbar numSelected={selected.length} />
          )}
          <CustomGrid
            id="media-library-container"
            container
            spacing={2}
            justifyContent="start"
            className={viewMode === 'list' ? 'list-view' : 'grid-view'}
            sx={{ height: '100%', overflow: 'hidden' }}
          >
            {viewMode === 'list' ? (
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
                  onRowSelectionModelChange={(newSelection) => {
                    setSelected(newSelection);
                  }}
                />
              </div>
            ) : (
              rows.map((file) => (
                <MediaCard key={file.id} file={file} onClick={() => handleFileClick(file)} />
              ))
            )}
          </CustomGrid>
        </Box>
      </Box>
      <ToastContainer />
      <ConfirmationModal
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onConfirm={handleConfirmDelete}
      />
    </motion.div>
  );
};

export default MediaLibrary;

