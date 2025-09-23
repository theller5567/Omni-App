import React from 'react';
import { Toolbar, Typography, IconButton, Tooltip } from '@mui/material';
import { alpha } from '@mui/material/styles';
import { FaTrash, FaDownload, FaSpinner } from 'react-icons/fa';

interface Props {
  numSelected: number;
  onDelete: () => void;
  onDownload: () => void;
  isMobile: boolean;
  downloading: boolean;
  canDelete: boolean;
}

const EnhancedTableToolbar: React.FC<Props> = ({ numSelected, onDelete, onDownload, isMobile, downloading, canDelete }) => (
  <Toolbar
    className="toolbar"
    sx={{
      ...(numSelected > 0 && {
        bgcolor: (theme) => alpha(theme.palette.primary.main, theme.palette.action.activatedOpacity),
      }),
    }}
  >
    {numSelected > 0 && (
      <Typography sx={{ flex: '1 1 100%' }} color="inherit" variant="subtitle1" component="div">
        {numSelected} selected
      </Typography>
    )}
    {numSelected > 0 && (
      <>
        <Tooltip title={downloading ? 'Downloading...' : 'Download'}>
          <IconButton onClick={onDownload} size={isMobile ? 'small' : 'medium'} color="primary" disabled={downloading}>
            {downloading ? <FaSpinner className="fa-spin" /> : <FaDownload />}
          </IconButton>
        </Tooltip>
        {canDelete && (
          <Tooltip title="Delete">
            <IconButton onClick={onDelete} size={isMobile ? 'small' : 'medium'} color="error" disabled={downloading}>
              <FaTrash />
            </IconButton>
          </Tooltip>
        )}
      </>
    )}
  </Toolbar>
);

export default EnhancedTableToolbar;


