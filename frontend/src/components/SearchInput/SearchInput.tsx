import React from 'react';
import TextField from '@mui/material/TextField';
import Autocomplete, { createFilterOptions } from '@mui/material/Autocomplete';
import './searchInput.scss';
import { BaseMediaFile } from '../../interfaces/MediaFile';

interface SearchInputProps {
  mediaFiles: BaseMediaFile[];
  setSearchQuery: React.Dispatch<React.SetStateAction<string>>;
}

const filter = createFilterOptions<BaseMediaFile>();

const SearchInput: React.FC<SearchInputProps> = ({ mediaFiles, setSearchQuery }) => {
  const [value, setValue] = React.useState<BaseMediaFile | null>(null);

  return (
    <Autocomplete
      className="ml-search-input"
      options={mediaFiles}
      getOptionLabel={(option) => option.metadata?.fileName || option.title || ''}
      value={value}
      onChange={(_, newValue) => {
        if (newValue) {
          setValue(newValue);
          setSearchQuery(newValue.metadata?.fileName || newValue.title || '');
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
