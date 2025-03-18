import React from 'react';
import './MediaLibrary.scss';
import { MediaFile } from '../../interfaces/MediaFile';
import 'react-toastify/dist/ReactToastify.css';
interface MediaLibraryProps {
    mediaFilesData: MediaFile[];
    setSearchQuery: React.Dispatch<React.SetStateAction<string>>;
    onAddMedia: () => void;
    onDeleteMedia: (id: string) => Promise<boolean>;
}
declare const MediaLibrary: React.FC<MediaLibraryProps>;
export default MediaLibrary;
