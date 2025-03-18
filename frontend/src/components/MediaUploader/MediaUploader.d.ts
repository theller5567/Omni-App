import React from 'react';
import './MediaUploader.scss';
import { MediaFile } from '../../interfaces/MediaFile';
interface MediaUploaderProps {
    open: boolean;
    onClose: () => void;
    onUploadComplete: (newFile: MediaFile) => void;
}
declare const MediaUploader: React.FC<MediaUploaderProps>;
export default MediaUploader;
