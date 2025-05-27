import React from 'react';
import TextField from '@mui/material/TextField';
import Autocomplete from '@mui/material/Autocomplete';
import { InputAdornment, Box, Typography } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import './searchInput.scss';
import { BaseMediaFile } from '../../interfaces/MediaFile';

interface SearchInputProps {
  mediaFiles: BaseMediaFile[];
  setSearchQuery: React.Dispatch<React.SetStateAction<string>>;
}

const SearchInput: React.FC<SearchInputProps> = ({ mediaFiles, setSearchQuery }) => {
  const [value, setValue] = React.useState<BaseMediaFile | null>(null);
  const [inputValue, setInputValue] = React.useState('');

  return (
    <Autocomplete
      className="ml-search-input"
      options={mediaFiles}
      getOptionLabel={(option) => {
        if (typeof option === 'string') return option;
        return option.metadata?.fileName || option.title || '';
      }}
      isOptionEqualToValue={(option, value) => 
        option._id === value._id
      }
      value={value}
      inputValue={inputValue}
      onInputChange={(_, newInputValue) => {
        setInputValue(newInputValue);
        setSearchQuery(newInputValue);
      }}
      onChange={(_, newValue) => {
        if (newValue === null) {
          setValue(null);
        } 
        else if (typeof newValue !== 'string') {
          setValue(newValue);
          setSearchQuery(newValue.metadata?.fileName || newValue.title || '');
        }
      }}
      freeSolo
      renderInput={(params) => (
        <TextField 
          {...params} 
          placeholder="Search media..."
          variant="outlined"
          InputProps={{
            ...params.InputProps,
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon color="action" />
              </InputAdornment>
            ),
          }}
        />
      )}
      renderOption={(props, option) => {
        const key = option._id || option.id || (option.metadata?.fileName || option.title || Math.random().toString());
        return (
          <Box component="li" {...props} key={key}>
            <Typography variant="body2">
              {option.metadata?.fileName || option.title || 'Untitled'}
            </Typography>
          </Box>
        );
      }}
    />
  );
};

export default SearchInput;
