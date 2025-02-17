import React, { useEffect, useState } from 'react';
import { Box, Typography, Grid, Button, Modal, Paper, ButtonGroup } from '@mui/material';
import axios from 'axios';
import { motion } from 'framer-motion';
import './MediaLibrary.scss';
import HeaderComponent from './HeaderComponent';
import MediaCard from './MediaCard';
import { styled } from '@mui/material/styles';
import SearchInput from '../SearchInput/SearchInput';
import MediaUploader from '../MediaUploader/MediaUploader';
import { FaPlus } from 'react-icons/fa';

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

interface Image {
  id: number;
  name: string;
  thumbnail: string;
}

interface Folder {
  id: string;
  name: string;
  subfolders?: Folder[];
  images?: Image[];
}

const MediaLibrary: React.FC = () => {
  const [folders, setFolders] = useState<Folder[]>([]);
  const [selectedFolder, setSelectedFolder] = useState<Folder | null>(null);
  const [view, setView] = useState<'list' | 'grid'>('grid');
  const [folderHistory, setFolderHistory] = useState<Folder[]>([]);
  const [open, setOpen] = useState(false);
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    axios.get<Folder[]>('/api/folders')
      .then((response) => {
        if (Array.isArray(response.data)) {
          setFolders(response.data);
        } else {
          console.error('Expected an array but got:', response.data);
        }
      })
      .catch((error) => {
        console.error('Error fetching folders:', error);
      });
  }, []);

  const toggleView = () => {
    setView((prevView) => (prevView === 'grid' ? 'list' : 'grid'));
  };

  const handleFolderClick = (folder: Folder) => {
    setFolderHistory((prevHistory) => {
      const newHistory = [...prevHistory, folder];
      console.log('Navigating to folder:', folder.name);
      console.log('Updated history:', newHistory);
      return newHistory;
    });
    setSelectedFolder(folder);
  };

  const handleBack = () => {
    setFolderHistory((prevHistory) => {
      const newHistory = [...prevHistory];
      newHistory.pop();
      const previousFolder = newHistory[newHistory.length - 1] || null;
      setSelectedFolder(previousFolder);
      console.log('Navigating back to:', previousFolder ? previousFolder.name : 'root');
      console.log('Updated history:', newHistory);
      return newHistory;
    });
  };

  const handleOpen = () => {
    setFadeOut(false);
    setOpen(true);
  };

  const handleClose = () => {
    setFadeOut(true);
    setTimeout(() => setOpen(false), 300); // Match the duration of the CSS transition
  };

  return (
    <Box className="media-library">
      <Typography variant="h2" align="left" sx={{paddingBottom: '2rem'}}>Media Library</Typography>
      <Box display="flex" justifyContent="start" gap={12} alignItems="center" mb={2}>
      <ButtonGroup variant="outlined" aria-label="Basic button group">
          <Button variant="contained"color="primary">View all</Button>
          <Button color="primary">Images</Button>
          <Button color="primary">Videos</Button>
          <Button color="primary">Documents</Button>
          <Button color="primary">PDFs</Button>
          <Button color="primary">App notes</Button>
          <Button variant="contained" color="secondary" onClick={handleOpen} startIcon={<FaPlus />}>Add Media</Button>
        </ButtonGroup>
        <Box display="flex" alignItems="center" gap={2}>
        
      <Modal open={open} onClose={handleClose}>
        <Box
          display="flex"
          justifyContent="center"
          alignItems="center"
          height="100vh"
          style={{
            opacity: fadeOut ? 0 : 1,
            transition: 'opacity 300ms ease-in-out',
          }}
        >
          <Paper
            style={{
              padding: '20px',
              maxWidth: '600px',
              width: '100%',
              boxShadow: '0 4px 8px rgba(0, 0, 0, 0.2)',
            }}
          >
            <MediaUploader onDone={handleClose} onCancel={handleClose} />
          </Paper>
        </Box>
      </Modal>
        </Box>
        <Box display="flex" alignItems="center" gap={2}>
          <SearchInput />
          <Button variant="outlined" color="primary">Filters</Button>
        </Box>
      </Box>
      <HeaderComponent
        folderName={selectedFolder ? selectedFolder.name : 'Media Library'}
        onBack={handleBack}
        view={view}
        toggleView={toggleView}
        isRoot={folderHistory.length === 0}
      />
      <CustomGrid container spacing={2} justifyContent="start" className={view === 'grid' ? 'grid-view' : 'list-view'}>
        {selectedFolder ? (
          selectedFolder.subfolders?.map((subfolder) => (
            <Grid item key={subfolder.id}>
              <motion.div
                initial="hidden"
                animate="visible"
                variants={{
                  hidden: { opacity: 0, y: 10 },
                  visible: { opacity: 1, y: 0 },
                }}
                transition={{ duration: 0.5 }}
              >
                <MediaCard title={subfolder.name} onClick={() => handleFolderClick(subfolder)} />
              </motion.div>
            </Grid>
          )) || selectedFolder.images?.map((image) => (
            <Grid item key={image.id}>
              <img src={image.thumbnail} alt={image.name} style={{ width: '100%' }} />
            </Grid>
          ))
        ) : (
          folders.map((folder) => (
            <Grid item key={folder.id}>
              <motion.div
                initial="hidden"
                animate="visible"
                variants={{
                  hidden: { opacity: 0, y: 10 },
                  visible: { opacity: 1, y: 0 },
                }}
                transition={{ duration: 0.5 }}
              >
                <MediaCard title={folder.name} onClick={() => handleFolderClick(folder)} />
              </motion.div>
            </Grid>
          ))
        )}
      </CustomGrid>
    </Box>
  );
};

export default MediaLibrary;