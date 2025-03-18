import React from 'react';
import './searchInput.scss';
interface MediaFile {
    id: string;
    location: string;
    metadata: {
        fileName: string;
        altText: string;
        description: string;
    };
    title: string;
}
interface SearchInputProps {
    mediaFiles: MediaFile[];
    setSearchQuery: React.Dispatch<React.SetStateAction<string>>;
}
declare const SearchInput: React.FC<SearchInputProps>;
export default SearchInput;
