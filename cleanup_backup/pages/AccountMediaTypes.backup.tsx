import React, { useEffect, useState } from 'react';
import { 
  Box, 
  Button, 
  Typography, 
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Alert,
  AlertTitle,
  Stepper,
  Step,
  StepLabel,
  CircularProgress
} from '@mui/material';
import './accountMediaTypes.scss';
import { motion } from 'framer-motion';
import { ToastContainer, toast } from 'react-toastify';
import MediaTypeUploader from '../components/MediaTypeUploader/MediaTypeUploader';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '../store/store';
import { 
  initializeMediaTypes, 
  checkMediaTypeUsage, 
  deprecateMediaType,
  archiveMediaType,
  migrateMediaFiles,
  deleteMediaType,
  setDeletionTarget,
  setMigrationTarget,
  resetOperation,
  forceRefresh,
  MediaType
} from '../store/slices/mediaTypeSlice';
import { FaEdit, FaTrash, FaPlus, FaArrowRight, FaSync } from 'react-icons/fa';
import MediaTypeCard from '../components/MediaTypeUploader/components/MediaTypeCard';
import axios from 'axios';
import env from '../config/env';

const AccountMediaTypes: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [migrationDialogOpen, setMigrationDialogOpen] = useState(false);
  const [migrationStep, setMigrationStep] = useState(0);
  const [editMediaTypeId, setEditMediaTypeId] = useState<string | null>(null);
  const [syncTagsDialogOpen, setSyncTagsDialogOpen] = useState(false);
  const [syncingMediaTypeId, setSyncingMediaTypeId] = useState<string | null>(null);
  const [syncingStatus, setSyncingStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [affectedFilesCount, setAffectedFilesCount] = useState(0);
  const [mediaTypesWithFilesNeedingTags, setMediaTypesWithFilesNeedingTags] = useState<Record<string, number>>({});
  const [checkingMediaTypes, setCheckingMediaTypes] = useState(false);
  const [initialCheckCompleted, setInitialCheckCompleted] = useState(false);
  const [effectCount, setEffectCount] = useState(0);
  const tagCheckRef = React.useRef(false);
  const specificChecksCompletedRef = React.useRef<Set<string>>(new Set());
  
  const dispatch = useDispatch<AppDispatch>();
  const { 
    mediaTypes, 
    deletionTarget,
    migrationSource,
    migrationTarget,
    affectedMediaCount,
    status
  } = useSelector((state: RootState) => state.mediaTypes);
  const userRole = useSelector((state: RootState) => state.user.currentUser.role);

  const checkMediaTypesWithDefaultTags = async () => {
    if (mediaTypes.length === 0 || checkingMediaTypes || !status || tagCheckRef.current) return;
    
    tagCheckRef.current = true;
    setCheckingMediaTypes(true);
    
    try {
      interface TagsSummaryResponse {
        totalMediaTypes: number;
        totalFilesNeedingTags: number;
        mediaTypes: Array<{
          id: string;
          name: string;
          count: number;
          totalFiles: number;
          hasDefaultTags: boolean;
          defaultTags?: string[];
          filesWithIssues: any[];
        }>;
        performanceMetrics?: {
          mediaTypesProcessed: number;
          executionTimeMs: number;
          mediaTypesWithErrors: number;
        };
      }
      
      const timestamp = new Date().getTime();
      const response = await axios.get<TagsSummaryResponse>(
        `${env.BASE_URL}/api/media-types/files-needing-tags-summary?_t=${timestamp}`,
        {
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
          }
        }
      );
      
      const results: Record<string, number> = {};
      
      if (response.data && response.data.mediaTypes) {
        response.data.mediaTypes.forEach((item) => {
          if (item.count > 0) {
            console.log(`Found ${item.count} files needing tags for ${item.name}`);
            results[item.id] = item.count;
          }
        });
      }
      
      console.log('Files needing tags by media type:', results);
      console.log('Summary response metrics:', response.data.performanceMetrics || 'No metrics available');
      setMediaTypesWithFilesNeedingTags(results);
      setInitialCheckCompleted(true);
    } catch (error) {
      console.error('Error checking files needing tags summary:', error);
      toast.error('Error checking files needing tags');
    }
    
    setCheckingMediaTypes(false);
  };

  useEffect(() => {
    const fetchMediaTypes = async () => {
      try {
        console.log('Starting media types fetch process with current state:', { status, mediaTypesCount: mediaTypes.length });
        console.log('Forcing media types refresh before initializing');
        await dispatch(forceRefresh());
        
        console.log('Initializing media types');
        try {
          const result = await dispatch(initializeMediaTypes()).unwrap();
          console.log('Media types initialization complete, loaded:', result.length);
          
          // If we have media types, check for those needing tags
          if (result.length > 0) {
            setTimeout(() => {
              checkMediaTypesWithDefaultTags();
            }, 500);
          } else {
            console.warn('Media types initialization returned 0 items - this is unexpected');
            
            // Force another attempt with explicit API call
            try {
              console.log('Making direct API call to fetch media types');
              const timestamp = new Date().getTime();
              const directResponse = await axios.get<MediaType[]>(`${env.BASE_URL}/api/media-types?_t=${timestamp}`, {
                headers: {
                  'Cache-Control': 'no-cache, no-store, must-revalidate',
                  'Pragma': 'no-cache',
                  'Expires': '0'
                }
              });
              
              console.log('Direct API call returned:', directResponse.data.length, 'items');
              
              if (directResponse.data.length > 0) {
                // Manually update Redux store
                dispatch({ 
                  type: 'mediaTypes/initialize/fulfilled', 
                  payload: directResponse.data 
                });
              }
            } catch (directError) {
              console.error('Direct API call failed:', directError);
            }
          }
        } catch (unwrapError) {
          console.error('Error unwrapping initialize result:', unwrapError);
          
          // Try a direct API call as fallback
          try {
            console.log('Making fallback direct API call');
            const timestamp = new Date().getTime();
            const fallbackResponse = await axios.get<MediaType[]>(`${env.BASE_URL}/api/media-types?_t=${timestamp}`, {
              headers: {
                'Cache-Control': 'no-cache, no-store, must-revalidate',
                'Pragma': 'no-cache',
                'Expires': '0'
              }
            });
            
            if (fallbackResponse.data.length > 0) {
              console.log('Fallback API call returned:', fallbackResponse.data.length, 'items');
              // Manually update Redux store
              dispatch({ 
                type: 'mediaTypes/initialize/fulfilled', 
                payload: fallbackResponse.data 
              });
            }
          } catch (fallbackError) {
            console.error('Fallback API call failed:', fallbackError);
          }
        }
      } catch (error) {
        console.error('Error fetching media types:', error);
        toast.error('Error loading media types. Please try again.');
        
        if (mediaTypes.length === 0) {
          setTimeout(() => {
            console.log('Retrying media types initialization...');
            dispatch(initializeMediaTypes());
          }, 2000);
        }
      }
    };
    
    fetchMediaTypes();
  }, [dispatch]);

  useEffect(() => {
    if (tagCheckRef.current) return;

    if (
      mediaTypes.length > 0 && 
      !checkingMediaTypes && 
      status === 'succeeded' &&
      !initialCheckCompleted
    ) {
      const timeoutId = setTimeout(() => {
        console.log('Executing tag check after successful media types load');
        checkMediaTypesWithDefaultTags();
      }, 500);
      
      return () => clearTimeout(timeoutId);
    }
  }, [mediaTypes.length, status, initialCheckCompleted, checkingMediaTypes, effectCount]);

  useEffect(() => {
    return () => {
      tagCheckRef.current = false;
      specificChecksCompletedRef.current.clear();
    };
  }, []);

  const refreshMediaTypeUsage = async (mediaTypeId?: string) => {
    try {
      if (mediaTypeId) {
        await dispatch(checkMediaTypeUsage(mediaTypeId));
        return;
      }
      
      console.log('Refreshing usage counts for all media types');
      for (const mediaType of mediaTypes) {
        if (mediaType._id) {
          await dispatch(checkMediaTypeUsage(mediaType._id));
        }
      }
    } catch (error) {
      console.error('Error refreshing media type usage counts:', error);
    }
  };

  const handleEditClick = (mediaTypeId: string) => {
    setEditMediaTypeId(mediaTypeId);
    setOpen(true);
  };
  
  const handleClose = () => {
    setOpen(false);
    setEditMediaTypeId(null);
  };

  const handleDeleteClick = async (mediaTypeId: string) => {
    await dispatch(checkMediaTypeUsage(mediaTypeId));
    dispatch(setDeletionTarget(mediaTypeId));
    setConfirmDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!deletionTarget) return;

    const mediaType = mediaTypes.find(type => type._id === deletionTarget);
    if (!mediaType) return;
    
    if (affectedMediaCount > 0) {
      try {
        await dispatch(archiveMediaType(deletionTarget));
        toast.success(`Media type "${mediaType.name}" has been archived`);
        setConfirmDialogOpen(false);
        dispatch(resetOperation());
      } catch (error) {
        toast.error('Failed to archive media type');
      }
      return;
    }
    
    setConfirmDialogOpen(false);
  };

  const handleArchiveUnusedMediaType = async () => {
    if (!deletionTarget) return;

    const mediaType = mediaTypes.find(type => type._id === deletionTarget);
    if (!mediaType) return;
    
    try {
      await dispatch(archiveMediaType(deletionTarget));
      toast.success(`Media type "${mediaType.name}" has been archived`);
      setConfirmDialogOpen(false);
      dispatch(resetOperation());
      
      console.log('Force refreshing media types after archiving');
      await dispatch(forceRefresh());
      await dispatch(initializeMediaTypes());
    } catch (error) {
      toast.error('Failed to archive media type');
    }
  };

  const handlePermanentlyDeleteMediaType = async () => {
    if (!deletionTarget) {
      console.error('No deletion target found');
      return;
    }

    const mediaType = mediaTypes.find(type => type._id === deletionTarget);
    if (!mediaType) {
      console.error('Media type not found:', deletionTarget);
      return;
    }
    
    console.log('Attempting to permanently delete media type:', mediaType.name, 'with ID:', deletionTarget);
    
    try {
      const result = await dispatch(deleteMediaType(deletionTarget)).unwrap();
      console.log('Delete result:', result);
      console.log('MediaTypes before fetching:', mediaTypes.length);
      
      toast.success(`Media type "${mediaType.name}" permanently deleted`);
      setConfirmDialogOpen(false);
      dispatch(resetOperation());
      
      console.log('Force refreshing media types after delete');
      await dispatch(forceRefresh());
      await dispatch(initializeMediaTypes());
      setTimeout(() => {
        refreshMediaTypeUsage();
      }, 1000);
    } catch (error: any) {
      console.error('Failed to delete media type:', error);
      toast.error(`Failed to delete media type: ${error.toString()}`);
      
      setConfirmDialogOpen(false);
      dispatch(resetOperation());
      
      console.log('Try one more time with force refresh');
      await dispatch(forceRefresh());
      await dispatch(initializeMediaTypes());
      setTimeout(() => {
        refreshMediaTypeUsage();
      }, 1000);
    }
  };

  const handleCancelDelete = () => {
    setConfirmDialogOpen(false);
    dispatch(resetOperation());
  };

  const handleSelectMigrationTarget = (targetId: string) => {
    dispatch(setMigrationTarget(targetId));
  };

  const handleMigrationStepNext = () => {
    if (migrationStep === 0 && !migrationTarget) {
      toast.error('Please select a target media type');
      return;
    }
    setMigrationStep(prevStep => prevStep + 1);
  };

  const handleMigrationStepBack = () => {
    setMigrationStep(prevStep => Math.max(0, prevStep - 1));
  };

  const handleConfirmMigration = async () => {
    if (!migrationSource || !migrationTarget) return;

    try {
      await dispatch(migrateMediaFiles({ sourceId: migrationSource, targetId: migrationTarget }));
      toast.success('Media files migrated successfully');
      
      await dispatch(deprecateMediaType(migrationSource));
      toast.info('Media type has been deprecated');
      
      setMigrationDialogOpen(false);
      setMigrationStep(0);
      dispatch(resetOperation());
    } catch (error) {
      toast.error('Migration failed');
    }
  };

  const handleCancelMigration = () => {
    setMigrationDialogOpen(false);
    setMigrationStep(0);
    dispatch(resetOperation());
  };

  const handleSyncDefaultTagsClick = async (mediaTypeId: string) => {
    setSyncingMediaTypeId(mediaTypeId);
    
    try {
      const timestamp = new Date().getTime();
      const response = await axios.get<{count: number}>(`${env.BASE_URL}/api/media-types/${mediaTypeId}/files-needing-tags?_t=${timestamp}`, {
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      });
      console.log(`Checking files for media type ${mediaTypeId}, response:`, response.data);
      const affectedFiles = response.data.count || 0;
      setAffectedFilesCount(affectedFiles);
      setSyncTagsDialogOpen(true);
    } catch (error) {
      console.error('Failed to check affected files:', error);
      toast.error('Failed to check affected files');
    }
  };

  const handleConfirmSyncTags = async () => {
    if (!syncingMediaTypeId) return;
    
    try {
      setSyncingStatus('loading');
      
      const mediaType = mediaTypes.find(type => type._id === syncingMediaTypeId);
      if (!mediaType || !mediaType.defaultTags || mediaType.defaultTags.length === 0) {
        throw new Error('No default tags to apply');
      }

      if (affectedFilesCount === 0) {
        setSyncingStatus('success');
        toast.info(`No media files found with type "${mediaType.name}" to update`);
        
        setTimeout(() => {
          setSyncTagsDialogOpen(false);
          setSyncingStatus('idle');
          setSyncingMediaTypeId(null);
        }, 2000);
        return;
      }

      const timestamp = new Date().getTime();
      
      const applyResponse = await axios.post<{
        count: number,
        totalFiles: number,
        tagsApplied: string[]
      }>(`${env.BASE_URL}/api/media-types/${syncingMediaTypeId}/apply-default-tags?_t=${timestamp}`);
      console.log('Applied default tags response:', applyResponse.data);
      
      const verifyTimestamp = new Date().getTime();
      const verifyResponse = await axios.get<{
        count: number,
        filesWithIssues?: Array<{
          id: string,
          title: string,
          existingTags: string[],
          missingTags: string[]
        }>
      }>(`${env.BASE_URL}/api/media-types/${syncingMediaTypeId}/files-needing-tags?_t=${verifyTimestamp}`, {
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      });
      console.log('Verification after applying tags:', verifyResponse.data);

      if (verifyResponse.data.count > 0) {
        console.warn('⚠️ There are still files needing tags after the update:', verifyResponse.data);
        toast.warning(`Applied tags, but ${verifyResponse.data.count} files still need updating. Please try again.`);
      }
      
      setSyncingStatus('success');
      toast.success(`Default tags applied to ${applyResponse.data.count} media files with type "${mediaType.name}"`);
      
      setMediaTypesWithFilesNeedingTags(prev => {
        const updated = {...prev};
        if (verifyResponse.data.count > 0) {
          updated[syncingMediaTypeId] = verifyResponse.data.count;
        } else {
          delete updated[syncingMediaTypeId];
        }
        return updated;
      });
      
      setTimeout(() => {
        try {
          dispatch(initializeMediaTypes());
          refreshMediaTypeUsage(syncingMediaTypeId);
        } catch (refreshError) {
          console.error('Error refreshing media types:', refreshError);
        }
      }, 1000);
      
      setTimeout(() => {
        setSyncTagsDialogOpen(false);
        setSyncingStatus('idle');
        setSyncingMediaTypeId(null);
      }, 2000);
    } catch (error) {
      console.error('Failed to sync default tags:', error);
      toast.error('Failed to apply default tags to existing files');
      setSyncingStatus('error');
    }
  };

  const handleCancelSyncTags = () => {
    setSyncTagsDialogOpen(false);
    setSyncingMediaTypeId(null);
    setSyncingStatus('idle');
  };

  // Use proper type checking since TypeScript warns about comparing incompatible types
  const isLoading = status === 'loading' as 'idle' | 'loading' | 'succeeded' | 'failed';
  
  // Add a debug log right before the check
  console.log("About to check loading status:", { status, isLoading, mediaTypesCount: mediaTypes.length });

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <CircularProgress />
        <Typography variant="h6" sx={{ ml: 2 }}>
          Loading media types...
        </Typography>
      </Box>
    );
  }

  // Add a function to update specific media types by name
  const updateSpecificMediaType = async (typeName: string) => {
    try {
      // Skip if already checked
      if (specificChecksCompletedRef.current.has(typeName)) {
        return;
      }
      
      // Find media type with the given name
      const mediaType = mediaTypes.find(type => type.name === typeName);
      if (!mediaType) {
        console.log(`Media type "${typeName}" not found`);
        return;
      }
      
      console.log(`Explicitly checking count for media type: ${typeName} (${mediaType._id})`);
      const timestamp = new Date().getTime();
      const response = await axios.get<{count: number}>(
        `${env.BASE_URL}/api/media-types/${mediaType._id}/usage?_t=${timestamp}`,
        {
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
          }
        }
      );
      
      const count = response.data.count;
      console.log(`Media type "${typeName}" has ${count} files`);
      
      // Update the media type in Redux store
      await dispatch(checkMediaTypeUsage(mediaType._id));
      
      // Mark as completed
      specificChecksCompletedRef.current.add(typeName);
      
      // Return the updated count
      return count;
    } catch (error) {
      console.error(`Error updating "${typeName}" count:`, error);
      return null;
    }
  };

  // Add a useEffect to specifically check "Application Note" when the page loads
  useEffect(() => {
    if (mediaTypes.length > 0 && status === 'succeeded') {
      // Delay slightly to let initial rendering complete
      setTimeout(async () => {
        await updateSpecificMediaType('Application Note');
        // Check Protocol too if needed
        await updateSpecificMediaType('Protocol');
      }, 1500);
    }
  }, [mediaTypes.length, status, dispatch]);

  // Add a debug useEffect to log when the component renders with mediaTypes
  useEffect(() => {
    console.log("AccountMediaTypes render state:", { 
      mediaTypesCount: mediaTypes.length, 
      status,
      isLoading,
      firstMediaType: mediaTypes.length > 0 ? mediaTypes[0].name : 'none'
    });
  }, [mediaTypes.length, status]);

  // Add a helper function to render a special refresh button for Application Note
  const renderSpecialRefreshButton = (mediaType: any) => {
    // Only show for Application Note
    if (mediaType.name !== 'Application Note') return null;
    
    return (
      <Button
        variant="outlined"
        color="secondary"
        size="small"
        startIcon={<FaSync />}
        onClick={(e) => {
          e.stopPropagation(); // Don't trigger card click
          updateSpecificMediaType('Application Note');
        }}
        sx={{ mt: 1, width: '100%' }}
      >
        Update File Count
      </Button>
    );
  };

  // Safety check - if we have no media types and we're either idle or failed
  if (mediaTypes.length === 0 && (status === 'idle' || status === 'failed')) {
    // Add a button to manually trigger loading
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '80vh' }}>
        <Typography variant="h6" sx={{ mb: 2 }}>
          No media types found. {status === 'failed' ? 'Loading failed.' : 'Loading...'}
        </Typography>
        <Button 
          variant="contained" 
          color="primary"
          onClick={() => {
            console.log("Manual refresh triggered");
            dispatch(forceRefresh());
            dispatch(initializeMediaTypes());
          }}
          sx={{ mt: 2 }}
        >
          Reload Media Types
        </Button>
      </Box>
    );
  }

  return (
    <motion.div
      id="account-media-types"
      initial={{ opacity: 0, y: 100 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -100 }}
      transition={{ duration: 0.5 }}
    >
      <Box
        className="account-media-types"
        sx={{ width: "100%", overflow: "hidden" }}
      >
        <Typography variant="h1" align="left" sx={{ paddingBottom: "2rem" }}>
          Account Media Types
          <Typography variant="caption" sx={{ fontSize: '0.8rem', ml: 1, color: '#999' }}>
            ({mediaTypes.length} types loaded)
          </Typography>
        </Typography>

        <MediaTypeUploader 
          open={open} 
          onClose={handleClose} 
          editMediaTypeId={editMediaTypeId} 
        />
        
        {mediaTypes.length > 0 && (
          <Box sx={{ mb: 2, p: 2, border: '1px solid #333', borderRadius: 1, display: 'none' }}>
            <Typography variant="body1">Debug: {mediaTypes.length} Media Types Available</Typography>
            <pre style={{ maxHeight: '200px', overflow: 'auto' }}>
              {JSON.stringify(mediaTypes.map(m => ({ id: m._id, name: m.name })), null, 2)}
            </pre>
          </Box>
        )}

        <Box
          className="header-component"
          display="flex"
          alignItems="center"
          justifyContent="space-between"
          padding="1rem"
          bgcolor="var(--secondary-color)"
        >
          <div className="media-types-container">
            <Typography
              variant="h5"
              align="left"
            >
              Existing Media Types
              {userRole === 'superAdmin' ? (
                <Typography variant="caption" color="primary" sx={{ ml: 1 }}>
                  (Super Admin: Full control)
                </Typography>
              ) : (
                <Typography variant="caption" color="text.secondary" sx={{ ml: 1 }}>
                  (Admin: Limited default tag editing)
                </Typography>
              )}
            </Typography>
            <Typography variant="caption" display="block" sx={{ mt: 0.5 }}>
              {mediaTypes.length} media types loaded | Status: {status}
            </Typography>
          </div>
          <div className="actions-container" style={{ display: 'flex', gap: '8px' }}>
            <Button
              variant="contained"
              color="secondary"
              onClick={() => setOpen(true)}
            >
              <FaPlus style={{ marginRight: "0.5rem" }} /> Create New Media Type
            </Button>
            <Button
              variant="outlined"
              color="primary"
              onClick={() => {
                tagCheckRef.current = false;
                // Clear specific checks to allow re-checking
                specificChecksCompletedRef.current.clear();
                // Refresh all counts
                refreshMediaTypeUsage(); 
                // Specifically update Application Note and Protocol
                setTimeout(async () => {
                  await updateSpecificMediaType('Application Note');
                  await updateSpecificMediaType('Protocol');
                }, 500);
                setTimeout(() => {
                  setEffectCount(prev => prev + 1);
                }, 1000);
              }}
              sx={{ ml: 2 }}
            >
              <FaSync style={{ marginRight: "0.5rem" }} /> Refresh Counts
            </Button>
            <Button
              variant="contained"
              color="error"
              onClick={() => {
                console.log("Hard refresh triggered");
                // Reset all state
                tagCheckRef.current = false;
                specificChecksCompletedRef.current.clear();
                dispatch(forceRefresh());
                setTimeout(() => {
                  dispatch(initializeMediaTypes());
                }, 100);
              }}
            >
              Hard Refresh
            </Button>
          </div>
        </Box>

        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: 2 }}>
          {/* Force eager rendering of mediaTypes */}
          {Array.isArray(mediaTypes) && mediaTypes.length > 0 ? (
            mediaTypes.map((mediaType, index) => (
              <Box 
                key={index} 
                sx={{ 
                  borderRadius: 1,
                  padding: 2,
                  height: '100%'
                }}
              >
                <MediaTypeCard 
                  mediaType={mediaType}
                  onDelete={handleDeleteClick}
                  onEdit={handleEditClick}
                  onView={() => console.log('View', mediaType._id)}
                />
                {mediaType.defaultTags && 
                 mediaType.defaultTags.length > 0 && 
                 mediaTypesWithFilesNeedingTags[mediaType._id] > 0 && (
                  <Button
                    variant="outlined"
                    color="primary"
                    size="small"
                    startIcon={<FaSync />}
                    onClick={() => handleSyncDefaultTagsClick(mediaType._id)}
                    sx={{ mt: 1, width: '100%' }}
                  >
                    Apply Default Tags ({mediaTypesWithFilesNeedingTags[mediaType._id]} files)
                  </Button>
                )}
                {/* Add special refresh button for Application Note */}
                {renderSpecialRefreshButton(mediaType)}
              </Box>
            ))
          ) : (
            // Fallback if mediaTypes array is empty or invalid
            <Box sx={{ gridColumn: '1/-1', p: 3, textAlign: 'center' }}>
              <Typography variant="h6" color="error">
                No media types to display. Status: {status}
              </Typography>
              <Button
                variant="contained"
                color="primary"
                onClick={() => {
                  dispatch(forceRefresh());
                  setTimeout(() => {
                    dispatch(initializeMediaTypes());
                  }, 100);
                }}
                sx={{ mt: 2 }}
              >
                Reload Data
              </Button>
              {/* Debug info */}
              <Typography variant="caption" display="block" sx={{ mt: 2, color: '#666' }}>
                Media types array: {JSON.stringify(mediaTypes).substring(0, 100)}...
              </Typography>
            </Box>
          )}
        </Box>
      </Box>

      <Dialog
        open={confirmDialogOpen}
        onClose={handleCancelDelete}
        aria-labelledby="delete-dialog-title"
        aria-describedby="delete-dialog-description"
      >
        <DialogTitle id="delete-dialog-title">
          {affectedMediaCount > 0 ? "Media Type In Use" : "Manage Media Type"}
        </DialogTitle>
        <DialogContent>
          {deletionTarget && (
            <DialogContentText id="delete-dialog-description" component="div">
              {affectedMediaCount > 0 ? (
                <>
                  <Alert severity="warning" sx={{ mb: 2 }}>
                    <AlertTitle>Warning: Media Type In Use</AlertTitle>
                    This media type is used by <strong>{affectedMediaCount}</strong> media files.
                  </Alert>
                  <Typography>
                    This media type is currently in use. The only available option is to archive it,
                    which will prevent new files from using this type.
                  </Typography>
                  <Typography variant="body2" sx={{ mt: 2 }}>
                    Existing files will continue to work normally.
                  </Typography>
                </>
              ) : (
                <>
                  <Alert severity="info" sx={{ mb: 2 }}>
                    <AlertTitle>Media Type Not In Use</AlertTitle>
                    This media type is not used by any media files.
                  </Alert>
                  <Typography variant="subtitle1" fontWeight="bold" sx={{ mt: 3, mb: 1 }}>
                    Choose an action:
                  </Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <Box sx={{ p: 2, border: '1px solid #ddd', borderRadius: 1 }}>
                      <Typography variant="subtitle1" color="primary.main">Archive</Typography>
                      <Typography variant="body2">
                        The media type will be archived but kept in the system. 
                        You can restore it later if needed.
                      </Typography>
                    </Box>
                    <Box sx={{ p: 2, border: '1px solid #ddd', borderRadius: 1 }}>
                      <Typography variant="subtitle1" color="error.main">Permanently Delete</Typography>
                      <Typography variant="body2">
                        The media type will be permanently removed from the system.
                        This action cannot be undone.
                      </Typography>
                    </Box>
                  </Box>
                </>
              )}
            </DialogContentText>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCancelDelete}>Cancel</Button>
          
          {affectedMediaCount > 0 ? (
            <Button 
              onClick={handleConfirmDelete} 
              color="warning" 
              autoFocus
            >
              Archive
            </Button>
          ) : (
            <>
              <Button 
                onClick={handleArchiveUnusedMediaType} 
                color="primary"
                startIcon={<FaEdit />}
              >
                Archive
              </Button>
              <Button 
                onClick={handlePermanentlyDeleteMediaType} 
                color="error" 
                startIcon={<FaTrash />}
                autoFocus
              >
                Delete Permanently
              </Button>
            </>
          )}
        </DialogActions>
      </Dialog>

      <Dialog
        open={migrationDialogOpen}
        onClose={handleCancelMigration}
        aria-labelledby="migration-dialog-title"
        maxWidth="md"
        fullWidth
      >
        <DialogTitle id="migration-dialog-title">
          Migrate Media Files
          {migrationSource && (
            <Typography variant="subtitle1" color="text.secondary">
              From: {mediaTypes.find(type => type._id === migrationSource)?.name}
            </Typography>
          )}
        </DialogTitle>
        <DialogContent>
          <Stepper activeStep={migrationStep} sx={{ mt: 2, mb: 4 }}>
            <Step>
              <StepLabel>Select Target</StepLabel>
            </Step>
            <Step>
              <StepLabel>Confirm Migration</StepLabel>
            </Step>
            <Step>
              <StepLabel>Migration Complete</StepLabel>
            </Step>
          </Stepper>

          {migrationStep === 0 && (
            <>
              <Alert severity="info" sx={{ mb: 3 }}>
                <AlertTitle>Select Target Media Type</AlertTitle>
                Choose a compatible media type to migrate your files to. Media types with similar fields are recommended.
              </Alert>
              
              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel id="migration-target-label">Target Media Type</InputLabel>
                <Select
                  labelId="migration-target-label"
                  value={migrationTarget || ''}
                  onChange={(e) => handleSelectMigrationTarget(e.target.value as string)}
                  label="Target Media Type"
                >
                  {mediaTypes
                    .filter(type => type._id !== migrationSource && type.status === 'active')
                    .map((type) => (
                      <MenuItem key={type._id} value={type._id}>
                        {type.name} ({type.fields.length} fields)
                      </MenuItem>
                    ))
                  }
                </Select>
              </FormControl>

              {migrationTarget && (
                <Box className="media-type-comparison" sx={{ mt: 3, display: 'flex', gap: 2 }}>
                  <Box flex={1}>
                    <Typography variant="subtitle1" fontWeight="bold">
                      Source Fields
                    </Typography>
                    {mediaTypes.find(type => type._id === migrationSource)?.fields.map((field, i) => (
                      <Box key={i} sx={{ mt: 1, p: 1, border: '1px solid #eee' }}>
                        <Typography variant="body2">
                          {field.name} <small>({field.type})</small>
                          {field.required && <span className="required-badge">*</span>}
                        </Typography>
                      </Box>
                    ))}
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <FaArrowRight size={24} />
                  </Box>
                  <Box flex={1}>
                    <Typography variant="subtitle1" fontWeight="bold">
                      Target Fields
                    </Typography>
                    {mediaTypes.find(type => type._id === migrationTarget)?.fields.map((field, i) => (
                      <Box key={i} sx={{ mt: 1, p: 1, border: '1px solid #eee' }}>
                        <Typography variant="body2">
                          {field.name} <small>({field.type})</small>
                          {field.required && <span className="required-badge">*</span>}
                        </Typography>
                      </Box>
                    ))}
                  </Box>
                </Box>
              )}
            </>
          )}

          {migrationStep === 1 && (
            <>
              <Alert severity="warning" sx={{ mb: 3 }}>
                <AlertTitle>Confirm Migration</AlertTitle>
                You are about to migrate {affectedMediaCount} media file{affectedMediaCount !== 1 ? 's' : ''} from{' '}
                <strong>{mediaTypes.find(type => type._id === migrationSource)?.name}</strong> to{' '}
                <strong>{mediaTypes.find(type => type._id === migrationTarget)?.name}</strong>.
              </Alert>
              
              <Typography variant="body1" gutterBottom>
                After migration:
              </Typography>
              
              <ul>
                <li>All media files will be updated to use the new media type</li>
                <li>The original media type will be marked as deprecated</li>
                <li>You'll still be able to view the original media type but not create new files with it</li>
              </ul>
              
              <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                This process may take some time depending on the number of files.
              </Typography>
            </>
          )}

          {migrationStep === 2 && (
            <>
              {status === 'loading' ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
                  <CircularProgress />
                </Box>
              ) : (
                <Alert severity="success" sx={{ mb: 3 }}>
                  <AlertTitle>Migration Complete</AlertTitle>
                  All media files have been successfully migrated.
                </Alert>
              )}
            </>
          )}
        </DialogContent>
        <DialogActions>
          {migrationStep < 2 && (
            <Button onClick={handleCancelMigration}>Cancel</Button>
          )}
          
          {migrationStep > 0 && migrationStep < 2 && (
            <Button onClick={handleMigrationStepBack}>Back</Button>
          )}
          
          {migrationStep < 1 && (
            <Button 
              onClick={handleMigrationStepNext} 
              variant="contained" 
              color="primary"
              disabled={!migrationTarget}
            >
              Next
            </Button>
          )}
          
          {migrationStep === 1 && (
            <Button 
              onClick={handleConfirmMigration} 
              variant="contained" 
              color="warning"
              startIcon={<FaArrowRight />}
              disabled={status === 'loading'}
            >
              Start Migration
            </Button>
          )}
          
          {migrationStep === 2 && (
            <Button 
              onClick={handleCancelMigration} 
              variant="contained" 
              color="primary"
            >
              Close
            </Button>
          )}
        </DialogActions>
      </Dialog>

      <Dialog
        open={syncTagsDialogOpen}
        onClose={handleCancelSyncTags}
        aria-labelledby="sync-tags-dialog-title"
      >
        <DialogTitle id="sync-tags-dialog-title">
          Apply Default Tags to Existing Files
        </DialogTitle>
        <DialogContent>
          {syncingStatus === 'loading' ? (
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', my: 2 }}>
              <CircularProgress sx={{ mb: 2 }} />
              <Typography>Applying default tags to existing files...</Typography>
            </Box>
          ) : syncingStatus === 'success' ? (
            <Alert severity="success" sx={{ my: 2 }}>
              <AlertTitle>Success!</AlertTitle>
              {affectedFilesCount > 0 
                ? 'Default tags have been applied to all existing files.'
                : 'No files needed to be updated.'}
            </Alert>
          ) : syncingStatus === 'error' ? (
            <Alert severity="error" sx={{ my: 2 }}>
              <AlertTitle>Error</AlertTitle>
              Failed to apply default tags. Please try again.
            </Alert>
          ) : (
            <>
              <Alert severity="info" sx={{ mb: 2 }}>
                <AlertTitle>Confirm Action</AlertTitle>
                {syncingMediaTypeId && (
                  <>
                    {affectedFilesCount > 0 ? (
                      <Typography variant="body1" gutterBottom>
                        You are about to apply the default tags from media type "{mediaTypes.find(type => type._id === syncingMediaTypeId)?.name}" 
                        to <strong>{affectedFilesCount}</strong> existing files.
                      </Typography>
                    ) : (
                      <Typography variant="body1" gutterBottom>
                        There are <strong>no files</strong> with media type "{mediaTypes.find(type => type._id === syncingMediaTypeId)?.name}" 
                        that need default tags applied.
                      </Typography>
                    )}
                    <Typography variant="body2">
                      Default tags: {mediaTypes.find(type => type._id === syncingMediaTypeId)?.defaultTags?.join(', ')}
                    </Typography>
                  </>
                )}
              </Alert>
              <Typography variant="body2" color="text.secondary">
                This will add the default tags to existing files that don't already have them. No existing tags will be removed.
              </Typography>
            </>
          )}
        </DialogContent>
        <DialogActions>
          {syncingStatus === 'idle' && (
            <>
              <Button onClick={handleCancelSyncTags}>Cancel</Button>
              <Button 
                onClick={handleConfirmSyncTags} 
                color="primary" 
                variant="contained"
                disabled={!syncingMediaTypeId}
              >
                {affectedFilesCount > 0 ? 'Apply Default Tags' : 'Continue'}
              </Button>
            </>
          )}
          {syncingStatus === 'error' && (
            <Button onClick={handleCancelSyncTags} color="primary">Close</Button>
          )}
          {syncingStatus === 'success' && (
            <Button onClick={handleCancelSyncTags} color="primary">Close</Button>
          )}
        </DialogActions>
      </Dialog>
      
      <ToastContainer />
    </motion.div>
  );
};

export default AccountMediaTypes;