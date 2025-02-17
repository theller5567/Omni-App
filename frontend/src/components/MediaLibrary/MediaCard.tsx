import React from 'react';
import './MediaCard.scss';

interface MediaCardProps {
  title: string;
  onClick: () => void;
}

const MediaCard: React.FC<MediaCardProps> = ({ title, onClick }) => {
  return (
    <div className="media-card" onClick={onClick}>
      <div className="card-content">
        <p>{title}</p>
      </div>
    </div>
  );
};

export default MediaCard;
