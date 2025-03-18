import React from 'react';
import TextField from '@mui/material/TextField';
import Autocomplete, { createFilterOptions } from '@mui/material/Autocomplete';
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

const filter = createFilterOptions<MediaFile>();

const SearchInput: React.FC<SearchInputProps> = ({ mediaFiles, setSearchQuery }) => {
  const [value, setValue] = React.useState<MediaFile | null>(null);

  return (
    <Autocomplete
      className="ml-search-input"
      options={mediaFiles}
      getOptionLabel={(option) => option.metadata.fileName}
      value={value}
      onChange={(_, newValue) => {
        if (newValue) {
          setValue(newValue);
          setSearchQuery(newValue.metadata.fileName);
        } else {
          setValue(null);
          setSearchQuery('');
        }
      }}
      filterOptions={filter}
      renderInput={(params) => (
        <TextField className="search-input" {...params} label="Search media..." variant="outlined" />
      )}
    />
  );
};

export default SearchInput;
