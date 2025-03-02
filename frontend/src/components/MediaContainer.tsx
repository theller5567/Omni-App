import React, { useEffect, useState, createContext } from 'react';
import MediaUploader from './MediaUploader/MediaUploader';
import MediaLibrary from './MediaLibrary/MediaLibrary';
import axios from 'axios';
import MediaFile from '../interfaces/MediaFile';
import './mediaContainer.scss';
import User from '../interfaces/User';
import { useSelector } from 'react-redux';
import { RootState } from '../store/store';

interface UserContextType {
  user: User | null;
  setUser: React.Dispatch<React.SetStateAction<User | null>>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider: React.FC<React.PropsWithChildren<{}>> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const userId = 'user-id-from-auth'; // Replace with actual user ID from authentication
    const fetchUserInfo = async (userId: string) => {
      try {
        const response = await axios.get<User>(`/api/users/${userId}`);
        setUser(response.data);
      } catch (error) {
        console.error('Error fetching user information:', error);
      }
    };

    fetchUserInfo(userId);
  }, []);

  return (
    <UserContext.Provider value={{ user, setUser }}>
      {children}
    </UserContext.Provider>
  );
};

const MediaContainer: React.FC = () => {
  const user = useSelector((state: RootState) => state.auth.user);
  const [mediaFiles, setMediaFiles] = useState<MediaFile[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
console.log(user, 'user');
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