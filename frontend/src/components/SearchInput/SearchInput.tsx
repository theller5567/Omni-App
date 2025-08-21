import React from 'react';
import TextField from '@mui/material/TextField';
import Autocomplete from '@mui/material/Autocomplete';
import { InputAdornment, Box, Typography } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import './searchInput.scss';
import { BaseMediaFile } from '../../interfaces/MediaFile';
import apiClient from '../../api/apiClient';

interface SearchInputProps {
  mediaFiles: BaseMediaFile[];
  setSearchQuery: React.Dispatch<React.SetStateAction<string>>;
}

const SearchInput: React.FC<SearchInputProps> = ({ mediaFiles, setSearchQuery }) => {
  const [value, setValue] = React.useState<BaseMediaFile | null>(null);
  const [inputValue, setInputValue] = React.useState('');
  const [options, setOptions] = React.useState<BaseMediaFile[]>(mediaFiles);
  const debounceRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  // Keep local options in sync when base list changes and there's no active query
  React.useEffect(() => {
    if (!inputValue || inputValue.length < 3) {
      setOptions(mediaFiles);
    }
  }, [mediaFiles, inputValue]);

  // Debounced semantic suggestions when typing
  const fetchSemantic = React.useCallback(async (q: string) => {
    try {
      const res = await apiClient.get<BaseMediaFile[]>(`/media/semantic-search`, {
        params: { q, limit: 10 }
      });
      if (Array.isArray(res.data) && q.length >= 3) {
        setOptions(res.data as BaseMediaFile[]);
      }
    } catch (_err) {
      // Silent failover to local options
      setOptions(mediaFiles);
    }
  }, [mediaFiles]);

  return (
    <Autocomplete
      className="ml-search-input"
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
        if (debounceRef.current) clearTimeout(debounceRef.current);
        if (newInputValue && newInputValue.length >= 3) {
          debounceRef.current = setTimeout(() => {
            fetchSemantic(newInputValue);
          }, 250);
        } else {
          setOptions(mediaFiles);
        }
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
      options={options}
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
