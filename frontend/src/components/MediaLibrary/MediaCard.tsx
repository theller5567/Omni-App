import React from 'react';
import './MediaCard.scss';

interface MediaCardProps {
  file: {
    id: string;
    location: string;
    metadata: {
      fileName: string;
      altText: string;
      description: string;
    };
  };
  onClick: () => void;
} 

const MediaCard: React.FC<MediaCardProps> = ({ file, onClick }) => (
  <div className="media-card" onClick={onClick}>
    <div className="content">
      <div className="img-wrapper">
        <img src={file.location} alt={file.metadata.altText} />
      </div>
      <h3>{file.metadata.fileName}</h3>
    </div>
    {/* Add more UI elements as needed */}
  </div>
);

export default MediaCard;
