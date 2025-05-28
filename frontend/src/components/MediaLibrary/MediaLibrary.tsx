import React, { useState, useRef, useMemo, useEffect, lazy, Suspense } from 'react';
import { Box, Typography, Toolbar, IconButton, Tooltip, useMediaQuery, Theme, CircularProgress } from '@mui/material';
import { motion } from 'framer-motion';
import './mediaLibrary.scss';
import { useNavigate } from 'react-router-dom';
import { FaTrash, FaDownload, FaSpinner } from 'react-icons/fa';
import { BaseMediaFile } from '../../interfaces/MediaFile';
import { alpha } from '@mui/material/styles';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { GridRowSelectionModel } from '@mui/x-data-grid';
import axios from 'axios';
import env from '../../config/env';
import { useTagCategories, useUserProfile } from '../../hooks/query-hooks';
// import { MediaCardViewSwitcher } from './components/MediaCardViewSwitcher'; // Removed
// import { DebugMediaData } from './components/DebugMediaData'; // Removed

// Lazy load subcomponents
const HeaderComponent = lazy(() => import('./components/HeaderComponent'));
const VirtualizedDataTable = lazy(() => import('./components/VirtualizedDataTable'));
const MediaCard = lazy(() => import('./components/MediaCard'));
const ConfirmationModal = lazy(() => import('./components/ConfirmationModal'));

// Loading fallback component
const LoadingFallback = () => (
  <Box display="flex" justifyContent="center" alignItems="center" p={2}>
    <CircularProgress size={24} />
  </Box>
);

interface MediaLibraryProps {
  mediaFilesData: BaseMediaFile[];
  dataSourceForFilters?: BaseMediaFile[];
  setSearchQuery: React.Dispatch<React.SetStateAction<string>>;
  onAddMedia: () => void;
  onDeleteMedia: (id: string) => Promise<boolean>;
  selectedMediaType: string;
  handleMediaTypeChange: (type: string) => void;
  children?: React.ReactNode;
}

const MediaLibrary: React.FC<MediaLibraryProps> = ({ 
  mediaFilesData, 
  dataSourceForFilters,
  setSearchQuery, 
  onAddMedia, 
  onDeleteMedia, 
  selectedMediaType,
  handleMediaTypeChange,
  children 
}) => {
  // Move all hook calls to the top level
  const [viewMode, setViewMode] = useState<'list' | 'card'>(() => {
    return localStorage.getItem('mediaLibraryViewMode') as 'list' | 'card' || 'card';
  });
  const navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selected, setSelected] = useState<GridRowSelectionModel>([]);
  const [selectedFileId, setSelectedFileId] = useState<string | null>(null);
  const [isToolbarDelete, setIsToolbarDelete] = useState(false);
  const prevDataRef = useRef<string>('');
  const isMobile = useMediaQuery((theme: Theme) => theme.breakpoints.down('sm'));
  const { data: userProfile } = useUserProfile();
  const userRole = userProfile?.role;
  const [downloading, setDownloading] = useState<boolean>(false);
  const [toastSettings] = useState({
    disableTagNotifications: true,
    initialLoadComplete: false
  });
  const { refetch: refetchTagCategories } = useTagCategories(userProfile);
  const tagsFetchedRef = useRef(false);

  // useEffect and useMemo hooks remain here as they are not conditional on 'children'
  useEffect(() => {
    const tagLoadTimer = setTimeout(() => {
      if (!tagsFetchedRef.current) {
        tagsFetchedRef.current = true;
        refetchTagCategories();
      }
    }, 2000);
    return () => clearTimeout(tagLoadTimer);
  }, [refetchTagCategories, viewMode]);

  useEffect(() => {
    return () => {
      tagsFetchedRef.current = false;
    };
  }, []);

  const safeToast = (type: 'success' | 'error' | 'info' | 'warning', message: string, options = {}) => {
    if (toastSettings.disableTagNotifications &&
        !toastSettings.initialLoadComplete &&
        (message.includes('tag') || message.includes('Tag') || message.includes('category') || message.includes('Category'))) {
      console.log('Suppressing tag-related toast:', message);
      return;
    }
    toast[type](message, {
      position: isMobile ? "bottom-center" : "top-right",
      autoClose: 3000,
      ...options
    });
  };

  const rows = useMemo(() => {
    const newRows = mediaFilesData
      .filter(file => selectedMediaType === 'All' || file.mediaType === selectedMediaType)
      .map((file) => ({
        _id: file._id || file.id || crypto.randomUUID(),
        id: file._id || file.id || crypto.randomUUID(),
        location: file.location || '',
        title: file.title || '',
        displayTitle: file.metadata?.fileName || file.title || 'Untitled',
        thumbnailUrl: file.metadata?.v_thumbnail || file.location,
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

  // If children are provided (compound usage), render them directly
  if (children) {
    return <div className="media-library-container">{children}</div>;
  }

  const toggleView = () => {
    const newViewMode = viewMode === 'list' ? 'card' : 'list';
    setViewMode(newViewMode);
    // Save to localStorage
    localStorage.setItem('mediaLibraryViewMode', newViewMode);
  };

  const handleFileClick = (file: BaseMediaFile) => {
    if (file.slug) {
      navigate(`/media/slug/${file.slug}`);
    } else if (file._id || file.id) {
      // Fallback to ID if slug is not available
      navigate(`/media/id/${file._id || file.id}`);
    }
  };

  const handleDeleteClick = (id: string) => {
    setSelectedFileId(id);
    setIsModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    let successfullyDeletedIds: string[] = [];
    if (isToolbarDelete) {
      // Handle multiple deletions
      const numSelected = selected.length;
      if (numSelected === 0) {
        safeToast('info', 'No files were selected for deletion.');
        setIsModalOpen(false);
        setIsToolbarDelete(false);
        return;
      }

      const promises = selected.map(id => onDeleteMedia(id as string).then(success => ({ id: id as string, success })));
      const results = await Promise.all(promises);

      successfullyDeletedIds = results.filter(r => r.success).map(r => r.id);
      const successfulDeletionsCount = successfullyDeletedIds.length;

      if (successfulDeletionsCount === numSelected && numSelected > 0) {
        safeToast('success', `${successfulDeletionsCount} media file${successfulDeletionsCount > 1 ? 's' : ''} deleted successfully.`);
      } else if (successfulDeletionsCount > 0 && successfulDeletionsCount < numSelected) {
        safeToast('warning', `${successfulDeletionsCount} out of ${numSelected} media files deleted. Some deletions may have failed.`);
      } else if (numSelected > 0 && successfulDeletionsCount === 0) {
        safeToast('error', `Failed to delete ${numSelected} selected media file${numSelected > 1 ? 's' : ''}.`);
      }
    } else if (selectedFileId) {
      // Handle single deletion
      const fileToDelete = rows.find(row => row.id === selectedFileId);
      const fileName = fileToDelete?.title || fileToDelete?.metadata?.fileName || 'this media file';

      const success = await onDeleteMedia(selectedFileId);
      if (success) {
        successfullyDeletedIds = [selectedFileId];
        safeToast('success', `Media file '${fileName}' deleted successfully.`);
        setSelectedFileId(null); // Clear the selected file ID
      } else {
        safeToast('error', `Failed to delete media file '${fileName}'.`);
      }
    }

    // After deletions, filter the 'selected' state to remove IDs of deleted items
    // This requires knowing the updated rows data. 
    // Since onDeleteMedia updates the parent (MediaContainer) which then updates mediaFilesData (and thus rows),
    // we might need a slight delay or ensure 'rows' is fresh before this filter.
    // For now, let's assume 'rows' will be updated by the time this runs or shortly after.
    // A more robust way would be to get the updated list of rows or rely on the parent to clear selection.
    
    // Update the selected state by removing successfully deleted IDs
    setSelected(currentSelected => currentSelected.filter(id => !successfullyDeletedIds.includes(id as string)));

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
            `${env.BASE_URL}/api/media/batch-download`,
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

  // Motion animation adjusted for mobile
  const motionProps = {
    initial: { opacity: 0, x: isMobile ? -100 : -350 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: isMobile ? -100 : -350 },
    transition: { duration: isMobile ? 0.3 : 0.5 }
  };

  // Only log on dev environment and only once per render cycle with a stable key
  if (process.env.NODE_ENV === 'development' && rows.length > 0 && !prevDataRef.current.includes(rows.length.toString())) {
    console.log('MediaLibrary - Rendering with:', {
      rows: rows.length,
      viewMode,
      userRole
    });
  }

  // Restore EnhancedTableToolbar as a local component
  const EnhancedTableToolbar = ({ numSelected, onDelete }: { numSelected: number, onDelete: () => void }) => (
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
          {(userRole === 'superAdmin' || userRole === 'admin') && (
            <Tooltip title="Delete">
              <IconButton 
                onClick={onDelete} // Use the passed onDelete prop
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

  return (
    <motion.div
      id="media-library"
      {...motionProps}
    >
      <Box className="media-library" sx={{ width: '100%', overflow: 'hidden' }}>
        <Typography variant="h1" align="left" sx={{ paddingBottom: isMobile ? '1rem' : '2rem' }}>
          OMNI Media Library
        </Typography>
        <Suspense fallback={<LoadingFallback />}>
          <HeaderComponent
            view={viewMode}
            toggleView={toggleView}
            mediaFilesData={dataSourceForFilters || mediaFilesData}
            setSearchQuery={setSearchQuery}
            selectedMediaType={selectedMediaType}
            handleMediaTypeChange={handleMediaTypeChange}
            onAddMedia={onAddMedia}
          />
        </Suspense>
        <Box sx={{ 
          width: '100%', 
          height: 'calc(100% - 4rem)', 
          overflow: 'hidden',
          mt: isMobile ? 1 : 2
        }}>
          {selected.length > 0 && (
            <EnhancedTableToolbar numSelected={selected.length} onDelete={handleDeleteSelected} />
          )}
          
          {viewMode === 'list' ? (
            <Suspense fallback={<LoadingFallback />}>
              <VirtualizedDataTable
                rows={rows}
                onSelectionChange={setSelected}
                selectionModel={selected}
                key="virtualized-data-table"
              />
            </Suspense>
          ) : (
            <Box className="media-card-grid" sx={{ p: 2, overflow: 'auto' }}>
              <Box sx={{ 
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
                gap: 2
              }}>
                {/* {viewMode === 'card' && <MediaCardViewSwitcher onViewChange={handleViewChange} currentView={viewMode} />} Commented out */}
                {rows.map((row) => (
                  <Box key={`${row.id}-${row.metadata?.v_thumbnailTimestamp || ''}`}>
                    <Suspense fallback={<LoadingFallback />}>
                      <MediaCard
                        file={row}
                        handleFileClick={() => handleFileClick(row)}
                        onDeleteClick={userRole === 'superAdmin' || userRole === 'admin' ? () => handleDeleteClick(row.id) : undefined}
                      />
                    </Suspense>
                  </Box>
                ))}
                {rows.length === 0 && (
                  <Typography variant="body1" color="textSecondary" sx={{ gridColumn: '1/-1', textAlign: 'center', py: 4 }}>
                    No media files found. Try changing your filter or upload new media.
                  </Typography>
                )}
              </Box>
            </Box>
          )}
        </Box>
      </Box>
      {isModalOpen && (
        <Suspense fallback={<LoadingFallback />}>
          <ConfirmationModal
            open={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            onConfirm={handleConfirmDelete}
            title="Delete Media"
            message={`Are you sure you want to delete ${isToolbarDelete ? 'the selected items' : 'this media file'}? This action cannot be undone.`}
          />
        </Suspense>
      )}
    </motion.div>
  );
};

// Modified component exports to support both direct and lazy loading
export { HeaderComponent, VirtualizedDataTable, MediaCard, ConfirmationModal };
export default MediaLibrary;