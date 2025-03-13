import React, { useEffect, useState } from 'react';
import MediaUploader from '../components/MediaUploader/MediaUploader';
import MediaLibrary from '../components/MediaLibrary/MediaLibrary';
import axios from 'axios';
import { MediaFile } from '../interfaces/MediaFile';
import '../components/MediaLibrary/MediaContainer.scss';

const MediaContainer: React.FC = () => {
  const [mediaFiles, setMediaFiles] = useState<MediaFile[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchMediaFiles = async () => {
    try {
      const response = await axios.get<MediaFile[]>('http://localhost:5002/media/all');
      setMediaFiles(response.data);
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
      setMediaFiles((prevFiles) => [...prevFiles, newFile]);
    }
    handleClose();
  };

  const handleDeleteMedia = async (id: string): Promise<boolean> => {
    try {
      await axios.delete(`http://localhost:5002/media/delete/${id}`);
      setMediaFiles((prevFiles) => prevFiles.filter(file => file.id !== id));
      return true; // Return true on success
    } catch (error) {
      console.error('Error deleting media file:', error);
      return false; // Return false on failure
    }
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
        onDeleteMedia={handleDeleteMedia}
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