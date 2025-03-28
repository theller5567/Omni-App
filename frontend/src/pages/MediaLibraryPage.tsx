import React, { useEffect, useState } from 'react';
import MediaUploader from '../components/MediaUploader/MediaUploader';
import MediaLibrary from '../components/MediaLibrary/MediaLibrary';
import axios from 'axios';
import '../components/MediaLibrary/MediaContainer.scss';

const MediaContainer: React.FC = () => {
  const [mediaFiles, setMediaFiles] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMediaType, setSelectedMediaType] = useState<string>('All');

  const fetchMediaFiles = async () => {
    try {
      const response = await axios.get<any[]>('http://localhost:5002/media/all');
      setMediaFiles(response.data);
    } catch (error) {
      console.error('Error fetching media files:', error);
    }
  };

  useEffect(() => {
    console.log('Fetching media files...');
    fetchMediaFiles(); // Call the function when the component mounts
  }, []); // Empty dependency array ensures this runs only once

  const handleOpen = () => {
    setIsModalOpen(true);
  };

  const handleClose = () => {
    setIsModalOpen(false);
  };

  const handleUploadComplete = (newFile: any | null) => {
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

  const handleMediaTypeChange = (type: string) => {
    setSelectedMediaType(type);
  };

  // Filter media files based on search query
  const filteredMediaFiles = mediaFiles.filter(file => {
    // Check if metadata is defined before accessing it
    return file.metadata && file.metadata.fileName && file.metadata.fileName.toLowerCase().includes(searchQuery.toLowerCase());
  });

  return (
    <div id="media-container">
      <MediaLibrary
        mediaFilesData={filteredMediaFiles}
        setSearchQuery={setSearchQuery}
        onAddMedia={handleOpen}
        onDeleteMedia={handleDeleteMedia}
        selectedMediaType={selectedMediaType}
        handleMediaTypeChange={handleMediaTypeChange}
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