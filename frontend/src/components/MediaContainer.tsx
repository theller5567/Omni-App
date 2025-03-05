import React, { useEffect, useState } from 'react';
import MediaUploader from './MediaUploader/MediaUploader';
import MediaLibrary from './MediaLibrary/MediaLibrary';
import axios from 'axios';
import MediaFile from '../interfaces/MediaFile';
import './mediaContainer.scss';



const MediaContainer: React.FC = () => {
  const [mediaFiles, setMediaFiles] = useState<MediaFile[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const fetchMediaFiles = async () => {
    try {
      const response = await axios.get<MediaFile[]>('http://localhost:5002/media/all');
      setMediaFiles(response.data);
      console.log(response.data, 'response.data');
    } catch (error) {
      console.error('Error fetching media files:', error);
    }
  };

  useEffect(() => {
    fetchMediaFiles(); // Call the function when the component mounts
  }, []);

  const handleOpen = () => {
    setIsModalOpen(true);
  };

  const handleClose = () => {
    setIsModalOpen(false);
  };

  const handleUploadComplete = (newFile: MediaFile | null) => {
    if (newFile) {
      console.log('Upload complete, refreshing media files...', newFile);
      setMediaFiles((prevFiles) => [...prevFiles, newFile]);
    }
    handleClose();
  };

  // Filter media files based on search query
  const filteredMediaFiles = mediaFiles.filter(file =>
    file.metadata.fileName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  

  return (
    <div id="media-container">
      <MediaLibrary
        mediaFilesData={filteredMediaFiles}
        setSearchQuery={setSearchQuery}
        onAddMedia={handleOpen}
      />
      <MediaUploader
        open={isModalOpen}
        onClose={handleClose}
        onUploadComplete={handleUploadComplete}
      />
    </div>
  );
};

export default MediaContainer;