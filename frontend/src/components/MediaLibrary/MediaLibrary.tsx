import React, { useState, useRef, useMemo } from 'react';
import { Box, Typography, Grid, Toolbar, IconButton, Tooltip, useMediaQuery, Theme } from '@mui/material';
import { motion } from 'framer-motion';
import './mediaLibrary.scss';
import { useNavigate } from 'react-router-dom';
import { styled } from '@mui/material/styles';
import { FaTrash } from 'react-icons/fa';
import { BaseMediaFile } from '../../interfaces/MediaFile';
import { alpha } from '@mui/material/styles';
import { toast } from 'react-toastify';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { GridRowSelectionModel } from '@mui/x-data-grid';
import { 
  DataTable, 
  HeaderComponent, 
  MediaCard, 
  ConfirmationModal 
} from './components';

const CustomGrid = styled(Grid)({
  '&.grid-view': {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
    gap: '16px',
  },
  '&.list-view': {
    display: 'block',
    width: '100%'
  },
});

interface MediaLibraryProps {
  mediaFilesData: BaseMediaFile[];
  setSearchQuery: React.Dispatch<React.SetStateAction<string>>;
  onAddMedia: () => void;
  onDeleteMedia: (id: string) => Promise<boolean>;
  selectedMediaType: string;
  handleMediaTypeChange: (type: string) => void;
}

const MediaLibrary: React.FC<MediaLibraryProps> = ({ mediaFilesData, setSearchQuery, onAddMedia, onDeleteMedia }) => {
  const [viewMode, setViewMode] = useState<'list' | 'card'>('card');
  const [selectedMediaType, setSelectedMediaType] = useState<string>('All');
  const navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selected, setSelected] = useState<GridRowSelectionModel>([]);
  const [selectedFileId, setSelectedFileId] = useState<string | null>(null);
  const [isToolbarDelete, setIsToolbarDelete] = useState(false);
  const prevDataRef = useRef<string>('');
  const isMobile = useMediaQuery((theme: Theme) => theme.breakpoints.down('sm'));
  
  // Process rows only when mediaFilesData or filter changes
  const rows = useMemo(() => {
    const newRows = mediaFilesData
      .filter(file => selectedMediaType === 'All' || file.mediaType === selectedMediaType)
      .map((file) => ({
        id: file._id || file.id || crypto.randomUUID(),
        location: file.location || '',
        title: file.title || '',
        fileSize: file.fileSize || 0,
        fileExtension: file.fileExtension || '',
        modifiedDate: file.modifiedDate,
        metadata: {
          fileName: file.metadata?.fileName || 'Untitled',
          altText: file.metadata?.altText || '',
          description: file.metadata?.description || '',
          tags: file.metadata?.tags || [],
          visibility: file.metadata?.visibility || 'public',
          catColor: file.metadata?.catColor || null,
          v_thumbnail: file.metadata?.v_thumbnail || null,
          v_thumbnailTimestamp: file.metadata?.v_thumbnailTimestamp || null
        },
        slug: file.slug || '',
        mediaType: file.mediaType || 'Unknown'
      }));

    const dataString = JSON.stringify({ count: newRows.length, types: [...new Set(newRows.map(row => row.mediaType))] });
    if (newRows.length > 0 && dataString !== prevDataRef.current) {
      console.log('MediaLibrary - Data ready:', {
        count: newRows.length,
        types: [...new Set(newRows.map(row => row.mediaType))]
      });
      prevDataRef.current = dataString;
    }

    return newRows;
  }, [mediaFilesData, selectedMediaType]);

  const toggleView = () => {
    setViewMode((prevView) => (prevView === 'list' ? 'card' : 'list'));
  };

  const handleFileClick = (file: BaseMediaFile) => {
    navigate(`/media/slug/${file.slug}`);
  };

  const handleMediaTypeChange = (type: string) => {
    setSelectedMediaType(type);
  };

  const handleEdit = (id: string) => {
    // Implement edit logic here
    console.log(`Edit record with id: ${id}`);
  };

  const handleDeleteClick = (id: string) => {
    setSelectedFileId(id);
    setIsModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (isToolbarDelete) {
      // Handle multiple deletions
      const promises = selected.map(id => onDeleteMedia(id as string));
      const results = await Promise.all(promises);

      if (results.every(result => result)) {
        toast.success('Selected media deleted successfully');
        setSelected([]); // Clear selection after deletion
      } else {
        toast.error('Failed to delete some media');
      }
    } else if (selectedFileId) {
      // Handle single deletion
      const success = await onDeleteMedia(selectedFileId);
      if (success) {
        toast.success('Media deleted successfully');
        setSelectedFileId(null); // Clear the selected file ID
      } else {
        toast.error('Failed to delete media');
      }
    }
    setIsModalOpen(false);
    setIsToolbarDelete(false); // Reset the toolbar delete flag
  };

  const handleDeleteSelected = () => {
    if (selected.length > 0) {
      setIsToolbarDelete(true);
      setIsModalOpen(true);
    }
  };

  const EnhancedTableToolbar = ({ numSelected }: { numSelected: number }) => (
    <Toolbar
      className="toolbar"
      sx={{
        ...(numSelected > 0 && {
          bgcolor: (theme) =>
            alpha(theme.palette.primary.main, theme.palette.action.activatedOpacity),
        }),
      }}
    >
      {numSelected > 0 && (
        <Typography
          sx={{ flex: '1 1 100%' }}
          color="inherit"
          variant="subtitle1"
          component="div"
        >
          {numSelected} selected
        </Typography>
      )}
      {numSelected > 0 ? (
        <Tooltip title="Delete">
          <IconButton onClick={handleDeleteSelected} size={isMobile ? "small" : "medium"}>
            <FaTrash />
          </IconButton>
        </Tooltip>
      ) : null}
    </Toolbar>
  );

  // Motion animation adjusted for mobile
  const motionProps = {
    initial: { opacity: 0, x: isMobile ? -100 : -350 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: isMobile ? -100 : -350 },
    transition: { duration: isMobile ? 0.3 : 0.5 }
  };

  return (
    <motion.div
      id="media-library"
      {...motionProps}
    >
      <Box className="media-library" sx={{ width: '100%', overflow: 'hidden' }}>
        <Typography variant="h1" align="left" sx={{ paddingBottom: isMobile ? '1rem' : '2rem' }}>
          OMNI Media Library
        </Typography>
        <HeaderComponent
          view={viewMode}
          toggleView={toggleView}
          mediaFilesData={mediaFilesData}
          setSearchQuery={setSearchQuery}
          selectedMediaType={selectedMediaType}
          handleMediaTypeChange={handleMediaTypeChange}
          onAddMedia={onAddMedia}
        />
        <Box sx={{ 
          width: '100%', 
          height: 'calc(100% - 4rem)', 
          overflow: 'hidden',
          mt: isMobile ? 1 : 2
        }}>
          {selected.length > 0 && (
            <EnhancedTableToolbar numSelected={selected.length} />
          )}
          <CustomGrid
            id="media-library-container"
            container
            spacing={isMobile ? 1 : 2}
            justifyContent="start"
            className={viewMode === 'list' ? 'list-view' : 'grid-view'}
            sx={{ 
              height: '100%', 
              overflow: 'hidden', 
              pb: isMobile ? 6 : 2 // Add padding at bottom for mobile to account for bottom nav
            }}
          >
            {viewMode === 'list' ? (
              <DataTable 
                rows={rows}
                onEdit={handleEdit}
                onDelete={handleDeleteClick}
                onSelectionChange={setSelected}
              />
            ) : (
              rows.map((file) => (
                <MediaCard key={file.id} file={file} onClick={() => handleFileClick(file)} />
              ))
            )}
          </CustomGrid>
        </Box>
      </Box>
      <ToastContainer position={isMobile ? "bottom-center" : "top-right"} />
      <ConfirmationModal
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onConfirm={handleConfirmDelete}
      />
    </motion.div>
  );
};

export default MediaLibrary;

