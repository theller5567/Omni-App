import { useState } from 'react';

const useFileUpload = () => {
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [uploadComplete, setUploadComplete] = useState<boolean>(false);

  const uploadFile = (file: File) => {
    const interval = setInterval(() => {
      setUploadProgress((prevProgress) => {
        if (prevProgress < 100) {
          return prevProgress + 10;
        } else {
          clearInterval(interval);
          setUploadComplete(true);
          console.log('File uploaded:', file);
          // Implement actual saving logic here
          return prevProgress;
        }
      });
    }, 500);
  };

  const resetUploadComplete = () => {
    setUploadComplete(false);
  };

  return {
    uploadProgress,
    setUploadProgress,
    uploadComplete,
    uploadFile,
    resetUploadComplete,
  };
};

export default useFileUpload; 