import React, { useState, useRef, useMemo, useEffect, lazy, Suspense } from 'react';
import { Box, Typography, useMediaQuery, Theme } from '@mui/material';
import { motion } from 'framer-motion';
import './mediaLibrary.scss';
import { useNavigate } from 'react-router-dom';
import { BaseMediaFile } from '../../interfaces/MediaFile';
// import { alpha } from '@mui/material/styles';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import LoadingFallback from '../common/LoadingFallback';
import { GridRowSelectionModel } from '@mui/x-data-grid';
import EnhancedTableToolbar from './components/EnhancedTableToolbar';
import { handleDownloadSelected as doHandleDownloadSelected, handleConfirmDelete as doHandleConfirmDelete, handleDeleteSelected as doHandleDeleteSelected } from './utils/handlers';
import { useTagCategories, useUserProfile } from '../../hooks/query-hooks';
import { buildMediaRows } from '../../utils/mediaRows';
// import { MediaCardViewSwitcher } from './components/MediaCardViewSwitcher'; // Removed
// import { DebugMediaData } from './components/DebugMediaData'; // Removed

// Lazy load subcomponents
const HeaderComponent = lazy(() => import('./components/HeaderComponent'));
const VirtualizedDataTable = lazy(() => import('./components/VirtualizedDataTable'));
const MediaCard = lazy(() => import('./components/MediaCard'));
const ConfirmationModal = lazy(() => import('./components/ConfirmationModal'));

// Loading fallback moved to common component

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
    // Default to 'list' when nothing stored
    const stored = localStorage.getItem('mediaLibraryViewMode');
    return (stored === 'list' || stored === 'card') ? (stored as 'list' | 'card') : 'list';
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
      if (process.env.NODE_ENV === 'development') {
        console.log('Suppressing tag-related toast:', message);
      }
      return;
    }
    toast[type](message, {
      position: isMobile ? "bottom-center" : "top-right",
      autoClose: 3000,
      ...options
    });
  };

  const rows = useMemo<any[]>(() => {
    const newRows = buildMediaRows(mediaFilesData, selectedMediaType) as any[];
    const dataString = JSON.stringify({ count: newRows.length, types: [...new Set(newRows.map(row => row.mediaType))] });
    if (newRows.length > 0 && dataString !== prevDataRef.current) {
      if (process.env.NODE_ENV === 'development') {
        console.log('MediaLibrary - Data ready:', {
          count: newRows.length,
          types: [...new Set(newRows.map(row => row.mediaType))]
        });
      }
      prevDataRef.current = dataString;
    }
    return newRows as any[];
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

  const handleFileClick = (file: any) => {
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

  const handleConfirmDelete = async () => doHandleConfirmDelete(
    isToolbarDelete,
    selected,
    rows as any[],
    onDeleteMedia,
    (type, message) => safeToast(type as any, message),
    selectedFileId,
    setSelectedFileId,
    setSelected,
    setIsModalOpen,
    setIsToolbarDelete
  );

  const handleDeleteSelected = () => doHandleDeleteSelected(selected, setIsToolbarDelete, setIsModalOpen);

  const handleDownloadSelected = async () => doHandleDownloadSelected(selected, rows as any[], safeToast, setDownloading);

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

  // Externalized toolbar via static import

  return (
    <motion.div
      id="media-library"
      {...motionProps}
    >
      <Box className="media-library" sx={{ width: '100%', overflow: 'hidden', minWidth: 0, minHeight: 0 }}>
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
          minWidth: 0,
          minHeight: 0,
          mt: isMobile ? 1 : 2
        }}>
          {selected.length > 0 && (
            <EnhancedTableToolbar 
              numSelected={selected.length} 
              onDelete={handleDeleteSelected}
              onDownload={handleDownloadSelected}
              isMobile={isMobile}
              downloading={downloading}
              canDelete={userRole === 'superAdmin' || userRole === 'admin'}
            />
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
            <Box className="media-card-grid" sx={{ p: 2, overflow: 'auto', minWidth: 0, minHeight: 0 }}>
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