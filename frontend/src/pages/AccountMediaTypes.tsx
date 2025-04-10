import React, { useEffect, useState } from 'react';
import { 
  Box, 
  Button, 
  Typography, 
  Grid,
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
  resetOperation
} from '../store/slices/mediaTypeSlice';
import { FaEdit, FaTrash, FaPlus,FaArrowRight } from 'react-icons/fa';
import MediaTypeCard from '../components/MediaTypeUploader/components/MediaTypeCard';

const AccountMediaTypes: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [migrationDialogOpen, setMigrationDialogOpen] = useState(false);
  const [migrationStep, setMigrationStep] = useState(0);
  const dispatch = useDispatch<AppDispatch>();
  const { 
    mediaTypes, 
    deletionTarget,
    migrationSource,
    migrationTarget,
    affectedMediaCount,
    status
  } = useSelector((state: RootState) => state.mediaTypes);

  useEffect(() => {
    const fetchMediaTypes = async () => {
      // Always refresh media types when the component mounts
      // This ensures we have up-to-date usage counts
      dispatch(initializeMediaTypes());
    };
    fetchMediaTypes();
  }, []); // Empty dependency array means this runs once on mount

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
        <Typography variant="h2" align="left" sx={{ paddingBottom: "2rem" }}>
          Account Media Types
        </Typography>

        <MediaTypeUploader open={open} onClose={() => setOpen(false)} />
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

        <Grid container spacing={2}>
          {mediaTypes.map((mediaType, index) => (
            <Grid item xs={12} sm={6} md={4} lg={3} key={index}>
              <MediaTypeCard 
                mediaType={mediaType}
                onDelete={handleDeleteClick}
                onEdit={() => console.log('Edit', mediaType._id)}
                onView={() => console.log('View', mediaType._id)}
              />
            </Grid>
          ))}
        </Grid>
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
      
      <ToastContainer />
    </motion.div>
  );
};

export default AccountMediaTypes;