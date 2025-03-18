import React from 'react';
import './HeaderComponent.scss';
import { MediaFile } from '../../interfaces/MediaFile';
interface HeaderComponentProps {
    view: 'card' | 'grid';
    toggleView: () => void;
    mediaFilesData: MediaFile[];
    setSearchQuery: React.Dispatch<React.SetStateAction<string>>;
}
declare const HeaderComponent: React.FC<HeaderComponentProps>;
export default HeaderComponent;
