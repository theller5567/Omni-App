// MediaLibrary.tsx
import React, { useEffect, useState } from 'react';
import { Box, Typography, Grid, Card, CardContent, CardActionArea, Button } from '@mui/material';
import axios from 'axios';
import './MediaLibrary.scss';
import SearchInput from '../SearchInput/SearchInput';
import HeaderComponent from './HeaderComponent';

interface Folder {
  id: number;
  name: string;
  fileCount: number;
  subfolders?: Folder[];
  images?: { id: number; name: string; thumbnail: string }[];
}

const MediaLibrary: React.FC = () => {
  const [folders, setFolders] = useState<Folder[]>([]);
  const [selectedFolder, setSelectedFolder] = useState<Folder | null>(null);
  const [selectedSubfolder, setSelectedSubfolder] = useState<Folder | null>(null);
  const [view, setView] = useState<'list' | 'grid'>('grid');
  //const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    axios.get<Folder[]>('http://localhost:5002/api/folders')
      .then((response) => {
        setFolders(response.data);
      })
      .catch((error) => {
        console.error('Error fetching folders:', error);
      });
  }, []);

  const handleFolderClick = (folder: Folder) => {
    setSelectedFolder(folder);
    setSelectedSubfolder(null);
  };

  const handleSubfolderClick = (subfolder: Folder) => {
    setSelectedSubfolder(subfolder);
  };

  const handleBackClick = () => {
    if (selectedSubfolder) {
      setSelectedSubfolder(null);
    } else {
      setSelectedFolder(null);
    }
  };

  const toggleView = () => {
    setView(view === 'grid' ? 'list' : 'grid');
  };

  // const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
  //   setSearchTerm(event.target.value);
  // };

  return (
    <Box className="media-library">
      <Typography variant="h2" align="left" sx={{paddingBottom: '2rem'}}>Media Library</Typography>
      <Box display="flex" justifyContent="space-between" gap={12} alignItems="center" mb={2}>
        <Box>
          <Button variant="contained" color="primary">View all</Button>
          <Button variant="outlined" color="primary">Images</Button>
          <Button variant="outlined" color="primary">Videos</Button>
          <Button variant="outlined" color="primary">Documents</Button>
          <Button variant="outlined" color="primary">PDFs</Button>
          <Button variant="outlined" color="primary">App notes</Button>
          
        </Box>
        <Box display="flex" alignItems="center" gap={2}>
          <SearchInput />
          <Button variant="outlined" color="primary">Filters</Button>
        </Box>
      </Box>
      <HeaderComponent view={view} toggleView={toggleView} />
      {/* Folder Grid */}
      <Grid container spacing={2} justifyContent="left">
        {selectedSubfolder ? (
          <Grid item xs={12} className="folder-content">
            <button onClick={handleBackClick}>Back</button>
            <Typography variant="h6">{selectedSubfolder.name}</Typography>
            <Grid container spacing={2} justifyContent="center">
              {selectedSubfolder.images?.map((image) => (
                <Grid item xs={12} sm={6} md={4} lg={1.5} key={image.id}>
                  <Card>
                    <CardContent>
                      <img src={image.thumbnail} alt={image.name} style={{ width: '100%' }} />
                      <Typography variant="body2" align="center">{image.name}</Typography>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Grid>
        ) : selectedFolder ? (
          <Grid item xs={12} className="folder-content">
            <button onClick={handleBackClick}>Back</button>
            <Typography variant="h6">{selectedFolder.name}</Typography>
            <Grid container spacing={2} justifyContent="left">
              {selectedFolder.subfolders?.map((subfolder) => (
                <Grid item xs={12} sm={6} md={4} lg={1.5} key={subfolder.id}>
                  <Card className="subfolder">
                    <CardActionArea onClick={() => handleSubfolderClick(subfolder)}>
                      <CardContent>
                        <Typography variant="body2">{subfolder.name}</Typography>
                      </CardContent>
                    </CardActionArea>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Grid>
        ) : (
          folders.map((folder) => (
            <Grid item xs={12} sm={6} md={4} lg={view === 'grid' ? 1.5 : 12} key={folder.id}>
              <Card className="folder">
                <CardActionArea onClick={() => handleFolderClick(folder)}>
                  <CardContent>
                    <Typography variant="body1">{folder.name}</Typography>
                    <Typography variant="body2">{folder.fileCount} files</Typography>
                  </CardContent>
                </CardActionArea>
              </Card>
            </Grid>
          ))
        )}
      </Grid>
    </Box>
  );
};

export default MediaLibrary;