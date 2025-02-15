import React from 'react';
import TextField from '@mui/material/TextField';
import Autocomplete, { createFilterOptions } from '@mui/material/Autocomplete';

interface MediaOptionType {
  inputValue?: string;
  title: string;
}

const filter = createFilterOptions<MediaOptionType>();

const mockData: readonly MediaOptionType[] = [
  { title: 'Image 1' },
  { title: 'Document 1' },
  { title: 'Spreadsheet 1' },
  // Add more mock data as needed
];

const SearchInput: React.FC = () => {
  const [value, setValue] = React.useState<MediaOptionType | null>(null);

  return (
    <Autocomplete
      className="ml-search-input"
      value={value}
      onChange={(_, newValue) => {
        if (typeof newValue === 'string') {
          setValue({
            title: newValue,
          });
        } else if (newValue && newValue.inputValue) {
          setValue({
            title: newValue.inputValue,
          });
        } else {
          setValue(newValue);
        }
      }}
      filterOptions={(options, params) => {
        const filtered = filter(options, params);
        const { inputValue } = params;
        const isExisting = options.some((option) => inputValue === option.title);
        if (inputValue !== '' && !isExisting) {
          filtered.push({
            inputValue,
            title: `Add "${inputValue}"`,
          });
        }
        return filtered;
      }}
      selectOnFocus
      clearOnBlur
      handleHomeEndKeys
      options={mockData}
      getOptionLabel={(option) => {
        if (typeof option === 'string') {
          return option;
        }
        if (option.inputValue) {
          return option.inputValue;
        }
        return option.title;
      }}
      renderOption={(props, option) => (
        <li {...props}>{option.title}</li>
      )}
      sx={{
        width: 300,
        '& .MuiOutlinedInput-root': {
          backgroundColor: 'var(--primary-color)',
          '&::placeholder': {
            color: 'var(--accent-color)',
          },
          color: 'var(--accent-color)',
          '& fieldset': {
            borderColor: 'var(--accent-color)',
          },
          '&:hover fieldset': {
            borderColor: 'var(--accent-color)',
          },
          '&.Mui-focused fieldset': {
            borderColor: 'var(--accent-color)',
          },
        },
      }}
      freeSolo
      renderInput={(params) => (
        <TextField {...params} label="Search Media" variant="outlined" size="small" className="ml-search-input" />
      )}
    />
  );
};

export default SearchInput;
