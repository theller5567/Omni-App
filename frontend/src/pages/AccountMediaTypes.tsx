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
  forceRefresh
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

  // Move the function outside useEffect to component scope
  const checkMediaTypesWithDefaultTags = async () => {
    if (mediaTypes.length === 0 || checkingMediaTypes) return;
    
    setCheckingMediaTypes(true);
    
    try {
      // Use the new consolidated endpoint instead of making individual requests
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
      
      // Add timestamp to URL to force fresh response
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
      
      // Process the response and create a record of mediaTypeId -> count
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
    } catch (error) {
      console.error('Error checking files needing tags summary:', error);
      toast.error('Error checking files needing tags');
    }
    
    setCheckingMediaTypes(false);
  };

  useEffect(() => {
    const fetchMediaTypes = async () => {
      try {
        // First force a refresh to ensure we don't use cached data
        console.log('Forcing media types refresh before initializing');
        dispatch(forceRefresh());
        
        // Then initialize media types
        console.log('Initializing media types');
        await dispatch(initializeMediaTypes());
        console.log('Media types initialization complete, loaded:', mediaTypes.length);
        
        // Trigger the check for files needing tags after a short delay
        setTimeout(() => {
          checkMediaTypesWithDefaultTags();
        }, 1000); // Wait 1 second before checking tags
      } catch (error) {
        console.error('Error fetching media types:', error);
        toast.error('Error loading media types. Please try again.');
      }
    };
    
    fetchMediaTypes();
  }, []); // Empty dependency array means this runs once on mount

  useEffect(() => {
    // Only run this check when the component mounts and when mediaTypes actually changes
    // in a meaningful way (like after a create/update/delete operation)
    const timeoutId = setTimeout(() => {
      checkMediaTypesWithDefaultTags();
    }, 500); // Debounce by 500ms
    
    return () => clearTimeout(timeoutId);
  }, [mediaTypes.length]); // Only depend on the length, not the entire array

  const handleEditClick = (mediaTypeId: string) => {
    setEditMediaTypeId(mediaTypeId);
    setOpen(true);
  };
  
  const handleClose = () => {
    setOpen(false);
    setEditMediaTypeId(null);
  };

  const handleDeleteClick = async (mediaTypeId: string) => {
    // First check how many media files use this type
    await dispatch(checkMediaTypeUsage(mediaTypeId));
    dispatch(setDeletionTarget(mediaTypeId));
    setConfirmDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!deletionTarget) return;

    const mediaType = mediaTypes.find(type => type._id === deletionTarget);
    if (!mediaType) return;
    
    if (affectedMediaCount > 0) {
      // Media files are using this type, we need to archive it
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
    
    // For unused media types, this is now handled by separate buttons in the dialog
    // for either archiving or permanent deletion
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
      
      // Force a refresh of the media types list after a short delay
      setTimeout(() => {
        console.log('Refreshing media types list...');
        dispatch(initializeMediaTypes());
      }, 500);
    } catch (error: any) {
      console.error('Failed to delete media type:', error);
      toast.error(`Failed to delete media type: ${error.toString()}`);
      
      // Still close the dialog and reset
      setConfirmDialogOpen(false);
      dispatch(resetOperation());
      
      // Force a refresh to ensure UI is in sync with backend
      dispatch(initializeMediaTypes());
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
      
      // Now we can deprecate the source type
      await dispatch(deprecateMediaType(migrationSource));
      toast.info('Media type has been deprecated');
      
      // Reset
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
    
    // Find affected media files count
    try {
      // Add timestamp to URL to force fresh response
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

      // If there are no affected files, show success without API call
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

      // Add timestamp to prevent caching
      const timestamp = new Date().getTime();
      
      // Call backend API to update all media files with this media type
      const applyResponse = await axios.post<{
        count: number,
        totalFiles: number,
        tagsApplied: string[]
      }>(`${env.BASE_URL}/api/media-types/${syncingMediaTypeId}/apply-default-tags?_t=${timestamp}`);
      console.log('Applied default tags response:', applyResponse.data);
      
      // Directly check the files-needing-tags endpoint again to verify the changes
      // Add timestamp to prevent caching
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

      // If there are still files needing tags, show a warning
      if (verifyResponse.data.count > 0) {
        console.warn('⚠️ There are still files needing tags after the update:', verifyResponse.data);
        toast.warning(`Applied tags, but ${verifyResponse.data.count} files still need updating. Please try again.`);
      }
      
      setSyncingStatus('success');
      toast.success(`Default tags applied to ${applyResponse.data.count} media files with type "${mediaType.name}"`);
      
      // Update the count for this media type in the state
      setMediaTypesWithFilesNeedingTags(prev => {
        const updated = {...prev};
        if (verifyResponse.data.count > 0) {
          updated[syncingMediaTypeId] = verifyResponse.data.count;
        } else {
          delete updated[syncingMediaTypeId];
        }
        return updated;
      });
      
      // Refresh all media types to ensure the state is up to date
      // Add a try-catch to prevent errors during refresh from breaking the UI flow
      setTimeout(() => {
        try {
          dispatch(initializeMediaTypes());
        } catch (refreshError) {
          console.error('Error refreshing media types:', refreshError);
        }
      }, 1000); // Increased delay to allow backend processing to complete
      
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

  // Check if status is loading - use a type assertion to fix TypeScript error
  const isLoading = status === 'loading' as any;
  
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
        </Typography>

        <MediaTypeUploader 
          open={open} 
          onClose={handleClose} 
          editMediaTypeId={editMediaTypeId} 
        />
        
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
            <Button
              variant="contained"
              color="secondary"
              onClick={() => setOpen(true)}
            >
              <FaPlus style={{ marginRight: "0.5rem" }} /> Create New Media Type
            </Button>
          </div>
        </Box>

        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: 2 }}>
          {mediaTypes.map((mediaType, index) => (
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
            </Box>
          ))}
        </Box>
      </Box>

      {/* Deletion Confirmation Dialog */}
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

      {/* Migration Dialog */}
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

      {/* Sync Default Tags Dialog */}
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