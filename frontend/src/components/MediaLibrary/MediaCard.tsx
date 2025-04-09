import React from 'react';
import './MediaCard.scss';
import { FaFileVideo, FaFileAudio, FaFilePdf, FaFileWord, FaFileExcel, FaFile } from 'react-icons/fa';

interface MediaCardProps {
  file: {
    id: string;
    location: string;
    fileExtension?: string;
    mediaType?: string;
    metadata: {
      fileName: string;
      altText: string;
      description: string;
    };
  };
  onClick: () => void;
} 

const MediaCard: React.FC<MediaCardProps> = ({ file, onClick }) => {
  const getFileTypeIcon = () => {
    const extension = file.fileExtension?.toLowerCase();
    
    // Handle no extension
    if (!extension) return <FaFile size={50} />;
    
    // Video files
    if (['mp4', 'webm', 'mov', 'avi', 'mkv'].includes(extension) || 
        file.mediaType?.includes('Video')) {
      return <FaFileVideo size={50} color="#3b82f6" />;
    }
    
    // Audio files
    if (['mp3', 'wav', 'ogg', 'aac', 'flac'].includes(extension) || 
        file.mediaType?.includes('Audio')) {
      return <FaFileAudio size={50} color="#06b6d4" />;
    }
    
    // Document files
    if (extension === 'pdf') {
      return <FaFilePdf size={50} color="#ef4444" />;
    }
    
    if (['doc', 'docx'].includes(extension)) {
      return <FaFileWord size={50} color="#3b82f6" />;
    }
    
    if (['xls', 'xlsx'].includes(extension)) {
      return <FaFileExcel size={50} color="#10b981" />;
    }
    
    // Default file icon for other types
    return <FaFile size={50} />;
  };
  
  const isImageFile = () => {
    const extension = file.fileExtension?.toLowerCase();
    return extension && ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp'].includes(extension);
  };

  return (
    <div className="media-card" onClick={onClick}>
      <div className="content">
        <div className="img-wrapper">
          {isImageFile() ? (
            <img src={file.location} alt={file.metadata.altText} />
          ) : (
            <div className="file-icon-wrapper">
              {getFileTypeIcon()}
            </div>
          )}
        </div>
        <h3>{file.metadata.fileName}</h3>
        <div className="media-type-badge">
          {file.mediaType || 'Unknown'}
        </div>
      </div>
      {/* Add more UI elements as needed */}
    </div>
  );
};

export default MediaCard;
