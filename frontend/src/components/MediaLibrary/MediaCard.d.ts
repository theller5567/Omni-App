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
declare const MediaCard: React.FC<MediaCardProps>;
export default MediaCard;
