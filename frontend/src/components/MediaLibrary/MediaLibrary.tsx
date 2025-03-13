import React, { useState } from 'react';
import { Box, Typography, Grid, Button, ButtonGroup } from '@mui/material';
import { motion } from 'framer-motion';
import './MediaLibrary.scss';
import HeaderComponent from './HeaderComponent';
import MediaCard from './MediaCard';
import { useNavigate, Link } from 'react-router-dom';
import { styled } from '@mui/material/styles';
import SearchInput from '../SearchInput/SearchInput';
import { FaPlus, FaTrash, FaEdit } from 'react-icons/fa';
import { MediaFile, ProductImageFile } from '../../interfaces/MediaFile';
import { DataGrid, GridColDef, GridToolbar } from '@mui/x-data-grid';
import { formatFileSize } from '../../utils/formatFileSize';
import { toast } from 'react-toastify';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import ConfirmationModal from './ConfirmationModal';

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
  mediaFilesData: (MediaFile | ProductImageFile)[];
  setSearchQuery: React.Dispatch<React.SetStateAction<string>>;
  onAddMedia: () => void;
  onDeleteMedia: (id: string) => Promise<boolean>;
}

const MediaLibrary: React.FC<MediaLibraryProps> = ({ mediaFilesData, setSearchQuery, onAddMedia, onDeleteMedia }) => {
  const [viewMode, setViewMode] = useState<'grid' | 'card'>('grid');
  const navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedFileId, setSelectedFileId] = useState<string | null>(null);

  const toggleView = () => {
    setViewMode((prevView) => (prevView === 'grid' ? 'card' : 'grid'));
  };

  const handleFileClick = (file: MediaFile | ProductImageFile) => {
    navigate(`/media/slug/${file.slug}`);
  };

  const columns: GridColDef[] = [
    { field: 'image', headerName: 'Image', flex: 0.5, renderCell: (params) => (
      <img src={params.row.location} alt={params.row.title} style={{ width: '40px', height: '40px', padding: '0.3rem', alignSelf: 'center' }} />
    )},
    { field: 'fileName', headerName: 'Title', flex: 0.5, renderCell: (params) => (
      <Link to={`/media/slug/${params.row.slug}`} >{params.row.metadata.fileName}</Link>
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
    { field: 'tags', headerName: 'Tags', flex: 0.5, renderCell: (params) => (
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
        {params.row.metadata.tags.map((tag: string, index: number) => (
          <span key={index} className="tag">
            {tag}{index === params.row.metadata.tags.length - 1 ? '' : ', '}
          </span>
        ))}
      </div>
    ), },
    {
      field: 'actions',
      headerName: 'Actions',
      flex: 0.5,
      sortable: false,
      renderCell: (params) => (
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
    },
  ];

  const rows = mediaFilesData.map((file) => ({
    ...file,
    id: file.id,
    image: file.location,
    title: file.metadata.fileName,
    fileSize: file.fileSize,
    fileExtension: file.fileExtension,
    modifiedDate: file.modifiedDate,
    fileName: file.metadata.fileName,
    tags: file.metadata.tags
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
    if (selectedFileId) {
      const response: boolean = await onDeleteMedia(selectedFileId);
      if (response) {
        toast.success('Media deleted successfully');
      }
    }
  };

  return (
    <motion.div
      id="media-library"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
    >
      <Box className="media-library">
        <Typography variant="h2" align="left" sx={{paddingBottom: '2rem'}}>OMNI Media Library</Typography>
        <Box display="flex" justifyContent="space-between" gap={12} alignItems="center">
        <ButtonGroup variant="outlined" aria-label="Basic button group">
            <Button variant="contained"color="primary">View all</Button>
            <Button color="primary">Images</Button>
            <Button color="primary">Videos</Button>
            <Button color="primary">Documents</Button>
            <Button color="primary">PDFs</Button>
            <Button color="primary">App notes</Button>
            <Button variant="contained" color="secondary" onClick={onAddMedia} startIcon={<FaPlus />}>Add Media</Button>
          </ButtonGroup>
          <Box display="flex" alignItems="center" gap={2}>
            <SearchInput mediaFiles={mediaFilesData} setSearchQuery={setSearchQuery} />
            <Button variant="outlined" color="primary">Filters</Button>
          </Box>
        </Box>
        <HeaderComponent
          view={viewMode}
          toggleView={toggleView}
        />
        
        <CustomGrid id="media-library-container" container spacing={2} justifyContent="start" className={viewMode === 'grid' ? 'grid-view '  : 'card-view'}>
          {viewMode === 'grid' ? (
            <div style={{ height: 600, width: '100%' }}>
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
              />
            </div>
          ) : (
            mediaFilesData.map((file) => (
              <MediaCard key={file.id} file={file} onClick={() => handleFileClick(file)} />
            ))
          )}
        </CustomGrid>
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
