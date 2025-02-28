import React, { useState } from 'react';
import { Box, Typography, Grid, Button, ButtonGroup } from '@mui/material';
// import { motion } from 'framer-motion';
import './MediaLibrary.scss';
import HeaderComponent from './HeaderComponent';
import MediaCard from './MediaCard';
import { useNavigate, Link } from 'react-router-dom';
import { styled } from '@mui/material/styles';
import SearchInput from '../SearchInput/SearchInput';
import { FaPlus } from 'react-icons/fa';
import MediaFile from '../../interfaces/MediaFile';
import { DataGrid, GridColDef,  } from '@mui/x-data-grid';
import { formatFileSize } from '../../utils/formatFileSize';
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
  mediaFilesData: MediaFile[];
  setSearchQuery: React.Dispatch<React.SetStateAction<string>>;
  onAddMedia: () => void;
}

const MediaLibrary: React.FC<MediaLibraryProps> = ({ mediaFilesData, setSearchQuery, onAddMedia }) => {
  const [viewMode, setViewMode] = useState<'grid' | 'card'>('grid');
  const navigate = useNavigate();
  const toggleView = () => {
    setViewMode((prevView) => (prevView === 'grid' ? 'card' : 'grid'));
  };
  const handleFileClick = (file: MediaFile) => {
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
      flex: 1, 
      valueFormatter: (value: string) => {
        if (!value) return 'N/A';
        return new Date(value).toLocaleDateString();
      }
    },
    // Add more columns as needed
  ];

  const rows = mediaFilesData.map((file) => ({
    ...file,
    id: file.id,
    image: file.location,
    title: file.metadata.fileName,
    fileSize: file.fileSize,
    fileExtension: file.fileExtension,
    modifiedDate: file.modifiedDate,
    fileName: file.metadata.fileName
  }));

  return (
    <Box className="media-library">
      <Typography variant="h2" align="left" sx={{paddingBottom: '2rem'}}>OMNI Media Library</Typography>
      <Box display="flex" justifyContent="space-between" gap={12} alignItems="center" mb={2}>
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
              rows={rows}
              columns={columns}
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
  );
};

export default MediaLibrary;