declare const useFileUpload: () => {
    uploadProgress: number;
    setUploadProgress: import("react").Dispatch<import("react").SetStateAction<number>>;
    uploadComplete: boolean;
    uploadFile: (file: File) => void;
    resetUploadComplete: () => void;
};
export default useFileUpload;
