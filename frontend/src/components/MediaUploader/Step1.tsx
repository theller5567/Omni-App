import React from 'react';
import { Box, Typography, FormControl, InputLabel, Select, MenuItem, Button } from '@mui/material';
import { SelectChangeEvent } from '@mui/material/Select';
import './MediaUploader.scss';

interface Step1Props {
  selectedMediaType: string;
  onChange: (event: SelectChangeEvent<string>) => void;
  onNext: () => void;
}

const Step1: React.FC<Step1Props> = ({ selectedMediaType, onChange, onNext }) => (
  <Box className="step step-1">
    <Typography variant="h6">Select the type of media you want to upload</Typography>
    <FormControl fullWidth>
      <InputLabel id="media-type-label">Media Type</InputLabel>
      <Select
        labelId="media-type-label"
        value={selectedMediaType}
        onChange={onChange} // Ensure this matches the expected type
      >
        <MenuItem value={'Image'}>Image</MenuItem>
        <MenuItem value={'Video'}>Video</MenuItem>
        <MenuItem value={'App note'}>App note</MenuItem>
        <MenuItem value={'PDF'}>PDF</MenuItem>
      </Select>
    </FormControl>
    <Button variant="contained" onClick={onNext} disabled={!selectedMediaType}>Next</Button>
  </Box>
);

export default Step1;