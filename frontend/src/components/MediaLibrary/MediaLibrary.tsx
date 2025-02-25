import React, { useState } from 'react';
import { Box, Typography, Grid, Button, ButtonGroup } from '@mui/material';
// import { motion } from 'framer-motion';
import './MediaLibrary.scss';
import HeaderComponent from './HeaderComponent';
import MediaCard from './MediaCard';
import { useNavigate } from 'react-router-dom';
import { styled } from '@mui/material/styles';
import SearchInput from '../SearchInput/SearchInput';
import { FaPlus } from 'react-icons/fa';
import MediaFile from '../../interfaces/MediaFile';

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
  const [view, setView] = useState<'list' | 'grid'>('grid');
  //const [isModalOpen, setIsModalOpen] = useState(false);
  // Explicitly type the state as an array of MediaFile
  //const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  // const filteredMediaFiles = mediaFilesData.filter(file => {
  //   return file.metadata.fileName.toLowerCase().includes(searchQuery.toLowerCase());
  // });
  const toggleView = () => {
    setView((prevView) => (prevView === 'grid' ? 'list' : 'grid'));
  };

  const handleFileClick = (file: MediaFile) => {
    navigate(`/media/slug/${file.slug}`);
  };

  
  return (
    <Box className="media-library">
      <Typography variant="h2" align="left" sx={{paddingBottom: '2rem'}}>Omni Media Library</Typography>
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
        view={view}
        toggleView={toggleView}
      />
      <CustomGrid id="media-library-container" container spacing={2} justifyContent="start" className={view === 'grid' ? 'grid-view '  : 'list-view'}>
      {mediaFilesData.map((file) => (
        <MediaCard key={file.id} file={file} onClick={() => handleFileClick(file)} />
          
        ))}
      </CustomGrid>
    </Box>
  );
};

export default MediaLibrary;