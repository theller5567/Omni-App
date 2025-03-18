import React from 'react';
import { SelectChangeEvent } from '@mui/material/Select';
import './MediaUploader.scss';
interface Step1Props {
    selectedMediaType: string;
    onChange: (event: SelectChangeEvent<string>) => void;
    onNext: () => void;
}
declare const Step1: React.FC<Step1Props>;
export default Step1;
