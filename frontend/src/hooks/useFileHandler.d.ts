export declare const useFileHandler: () => {
    file: File | null;
    filePreview: string | null;
    handleFileChange: (acceptedFiles: File[]) => void;
    setFile: import("react").Dispatch<import("react").SetStateAction<File | null>>;
    setFilePreview: import("react").Dispatch<import("react").SetStateAction<string | null>>;
};
