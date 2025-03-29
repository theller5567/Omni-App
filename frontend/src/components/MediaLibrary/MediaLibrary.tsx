import React, { useState } from 'react';
import { Box, Typography, Grid, Button, Toolbar, IconButton, Tooltip } from '@mui/material';
import { motion } from 'framer-motion';
import './MediaLibrary.scss';
import HeaderComponent from './HeaderComponent';
import MediaCard from './MediaCard';
import { useNavigate, Link } from 'react-router-dom';
import { styled } from '@mui/material/styles';
import { FaTrash, FaEdit } from 'react-icons/fa';
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


const MediaLibrary: React.FC<MediaLibraryProps> = ({ mediaFilesData, setSearchQuery, onDeleteMedia, onAddMedia }) => {
  const [viewMode, setViewMode] = useState<'list' | 'card'>('list');
  const [selectedMediaType, setSelectedMediaType] = useState<string>('All');
  const navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selected, setSelected] = useState<readonly (string | number)[]>([]);
  const [selectedFileId, setSelectedFileId] = useState<string | null>(null);
  const [isToolbarDelete, setIsToolbarDelete] = useState(false);

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

  const columns: GridColDef[] = [
    { field: 'image', headerName: 'Image', flex: 0.5, renderCell: (params) => (
      <img src={params.row.location} alt={params.row.title} style={{ width: '40px', height: '40px', padding: '0.3rem', alignSelf: 'center' }} />
    )},
    { field: 'fileName', headerName: 'Title', flex: 0.5, renderCell: (params) => (
      <Link to={`/media/slug/${params.row.slug}`} >{params.row.metadata.fileName}</Link>
    )},
    { field: 'mediaType', headerName: 'Media Type', flex: 0.5, renderCell: (params) => (
      <span>{params.row.mediaType}</span>
    )},
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
    ...(userRole === 'super-admin' ? [{
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

  const rows = mediaFilesData
    .filter(file => selectedMediaType === 'All' || file.mediaType === selectedMediaType)
    .map((file) => ({
      ...file,
      id: file.id,
      image: file.location,
      title: file.metadata.fileName,
      fileSize: file.fileSize,
      fileExtension: file.fileExtension,
      modifiedDate: file.modifiedDate,
      fileName: file.metadata.fileName,
      tags: file.metadata.tags,
      mediaType: file.mediaType
    }));

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

