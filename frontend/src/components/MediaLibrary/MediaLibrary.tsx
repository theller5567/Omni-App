// MediaLibrary.tsx
import React, { useEffect, useState } from 'react';
import { Box, Typography, Grid, Card, CardContent, CardActionArea } from '@mui/material';
import axios from 'axios';
import './MediaLibrary.scss';

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

  return (
    <Box className="media-library">
      <Typography variant="h6" align="center">Media Library</Typography>
      {/* Breadcrumbs component will go here */}

      {/* Folder Grid */}
      <Grid container spacing={2} justifyContent="center">
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
            <Grid container spacing={2} justifyContent="center">
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
            <Grid item xs={12} sm={6} md={4} lg={1.5} key={folder.id}>
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