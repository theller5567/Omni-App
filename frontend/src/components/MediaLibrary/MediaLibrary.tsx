import React, { useState, useRef, useMemo, useEffect } from 'react';
import { Box, Typography, Grid, Toolbar, IconButton, Tooltip, useMediaQuery, Theme } from '@mui/material';
import { motion } from 'framer-motion';
import './mediaLibrary.scss';
import { useNavigate } from 'react-router-dom';
import { FaTrash, FaDownload, FaSpinner } from 'react-icons/fa';
import { BaseMediaFile } from '../../interfaces/MediaFile';
import { alpha } from '@mui/material/styles';
import { toast } from 'react-toastify';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { GridRowSelectionModel } from '@mui/x-data-grid';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '../../store/store';
import axios from 'axios';
import env from '../../config/env';
import { 
  VirtualizedDataTable,
  HeaderComponent, 
  MediaCard, 
  ConfirmationModal 
} from './components';
import { fetchTagCategories } from '../../store/slices/tagCategorySlice';


interface MediaLibraryProps {
  mediaFilesData: BaseMediaFile[];
  setSearchQuery: React.Dispatch<React.SetStateAction<string>>;
  onAddMedia: () => void;
  onDeleteMedia: (id: string) => Promise<boolean>;
  selectedMediaType: string;
  handleMediaTypeChange: (type: string) => void;
}

const MediaLibrary: React.FC<MediaLibraryProps> = ({ mediaFilesData, setSearchQuery, onAddMedia, onDeleteMedia }) => {
  const [viewMode, setViewMode] = useState<'list' | 'card'>(() => {
    // Get saved view mode from localStorage or default to 'card'
    return localStorage.getItem('mediaLibraryViewMode') as 'list' | 'card' || 'card';
  });
  const [selectedMediaType, setSelectedMediaType] = useState<string>('All');
  const navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selected, setSelected] = useState<GridRowSelectionModel>([]);
  const [selectedFileId, setSelectedFileId] = useState<string | null>(null);
  const [isToolbarDelete, setIsToolbarDelete] = useState(false);
  const prevDataRef = useRef<string>('');
  const isMobile = useMediaQuery((theme: Theme) => theme.breakpoints.down('sm'));
  // Get user role from Redux store
  const userRole = useSelector((state: RootState) => state.user.currentUser.role);
  const [downloading, setDownloading] = useState<boolean>(false);
  const dispatch = useDispatch<AppDispatch>();
  const [toastSettings] = useState({
    disableTagNotifications: true,
    initialLoadComplete: false
  });
  
  // Handle initial data loading silently
  useEffect(() => {
    const loadTagData = async () => {
      try {
        // Fetch tag categories silently (without showing error toasts)
        await dispatch(fetchTagCategories()).unwrap();
      } catch (error) {
        // Don't show toast for initial tag category fetch errors
        console.warn('Error fetching tag categories during MediaLibrary load:', error);
      } finally {
        // Mark initial load as complete after 2 seconds
        setTimeout(() => {
          toastSettings.initialLoadComplete = true;
        }, 2000);
      }
    };
    
    loadTagData();
  }, [dispatch]);
  
  // Custom toast function that avoids showing tag-related errors during initial page load
  const safeToast = (type: 'success' | 'error' | 'info', message: string, options = {}) => {
    // Skip tag-related notifications if disabled and not from user action
    if (toastSettings.disableTagNotifications && 
        !toastSettings.initialLoadComplete && 
        (message.includes('tag') || message.includes('Tag') || message.includes('category') || message.includes('Category'))) {
      console.log('Suppressing tag-related toast:', message);
      return;
    }
    
    // Otherwise show the toast
    toast[type](message, {
      position: isMobile ? "bottom-center" : "top-right",
      autoClose: 3000,
      ...options
    });
  };

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
    const newViewMode = viewMode === 'list' ? 'card' : 'list';
    setViewMode(newViewMode);
    // Save to localStorage
    localStorage.setItem('mediaLibraryViewMode', newViewMode);
  };

  const handleFileClick = (file: BaseMediaFile) => {
    navigate(`/media/slug/${file.slug}`);
  };

  const handleMediaTypeChange = (type: string) => {
    setSelectedMediaType(type);
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
        safeToast('success', 'Selected media deleted successfully');
        setSelected([]); // Clear selection after deletion
      } else {
        safeToast('error', 'Failed to delete some media');
      }
    } else if (selectedFileId) {
      // Handle single deletion
      const success = await onDeleteMedia(selectedFileId);
      if (success) {
        safeToast('success', 'Media deleted successfully');
        setSelectedFileId(null); // Clear the selected file ID
      } else {
        safeToast('error', 'Failed to delete media');
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

  const handleDownloadSelected = async () => {
    if (selected.length === 0) {
      safeToast('info', 'No files selected for download', {
        autoClose: 2000
      });
      return;
    }

    try {
      setDownloading(true);
      
      // Get file IDs from selected items
      const fileIds = selected.map(id => {
        const file = rows.find(row => row.id === id);
        return file?.id || '';
      }).filter(id => id !== '');
      
      if (fileIds.length > 0) {
        safeToast('info', `Preparing ${fileIds.length} files for download...`, {
          autoClose: 2000
        });
        
        try {
          // Use axios to make the request with responseType blob
          const response = await axios.post<Blob>(
            `${env.BASE_URL}/media/batch-download`,
            { fileIds }, // Send as JSON in request body
            { 
              responseType: 'blob',
              timeout: fileIds.length > 10 ? 60000 : 30000 // Longer timeout for larger batches
            }
          );
          
          // Create a download link for the blob
          const blob = new Blob([response.data]);
          const url = window.URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.setAttribute('download', `omni_media_${Date.now()}.zip`);
          document.body.appendChild(link);
          link.click();
          
          // Clean up
          window.URL.revokeObjectURL(url);
          document.body.removeChild(link);
          
          safeToast('success', `Downloaded ${selected.length} files`, {
            autoClose: 3000
          });
        } catch (downloadError: unknown) {
          console.error('Download error:', downloadError);
          
          // Check if error is an object with a code property
          if (downloadError && typeof downloadError === 'object' && 'code' in downloadError) {
            const error = downloadError as { code?: string, response?: { status?: number } };
            
            if (error.code === 'ECONNABORTED') {
              safeToast('error', 'Download timed out. Please try downloading fewer files at once.', {
                autoClose: 4000
              });
            } else if (error.response && error.response.status === 413) {
              safeToast('error', 'Batch too large. Please select fewer files and try again.', {
                autoClose: 4000
              });
            } else {
              safeToast('error', 'Failed to download files. Please try again.', {
                autoClose: 4000
              });
            }
          } else {
            safeToast('error', 'Failed to download files. Please try again.', {
              autoClose: 4000
            });
          }
        }
      }
    } catch (error) {
      console.error('Download preparation error:', error);
      safeToast('error', 'Failed to prepare files for download. Please try again.', {
        autoClose: 4000
      });
    } finally {
      setDownloading(false);
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
      {numSelected > 0 && (
        <>
          <Tooltip title={downloading ? "Downloading..." : "Download"}>
            <IconButton 
              onClick={handleDownloadSelected} 
              size={isMobile ? "small" : "medium"} 
              color="primary"
              disabled={downloading}
            >
              {downloading ? <FaSpinner className="fa-spin" /> : <FaDownload />}
            </IconButton>
          </Tooltip>
          {userRole === 'superAdmin' && (
            <Tooltip title="Delete">
              <IconButton 
                onClick={handleDeleteSelected} 
                size={isMobile ? "small" : "medium"} 
                color="error" 
                disabled={downloading}
              >
                <FaTrash />
              </IconButton>
            </Tooltip>
          )}
        </>
      )}
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
          
          {viewMode === 'list' ? (
            <Box sx={{ width: '100%', height: '100%', overflow: 'auto' }}>
              <VirtualizedDataTable 
                rows={rows}
                onSelectionChange={setSelected}
              />
            </Box>
          ) : (
            <Box sx={{ width: '100%', height: '100%', overflow: 'auto', p: 2 }}>
              <Grid 
                container 
                spacing={2}
                sx={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 220px))',
                  gap: '16px',
                  justifyContent: 'center'
                }}
              >
                {rows.map((file) => (
                  <Box key={file.id} sx={{ width: '100%', maxWidth: '220px' }}>
                    <MediaCard 
                      file={file} 
                      handleFileClick={() => handleFileClick(file)} 
                      onDeleteClick={userRole === 'superAdmin' ? () => handleDeleteClick(file.id) : undefined}
                    />
                  </Box>
                ))}
              </Grid>
            </Box>
          )}
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

