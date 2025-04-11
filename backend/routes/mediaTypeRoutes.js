import express from 'express';
import { 
  addMediaType, 
  getMediaTypes,
  getMediaTypeById,
  checkMediaTypeUsage,
  deprecateMediaType,
  archiveMediaType,
  migrateMediaFiles,
  deleteMediaType,
  updateMediaType,
  applyDefaultTagsToExistingFiles,
  debugMediaType,
  setProductImageDefaultTags
} from '../controllers/mediaTypeController.js';

const router = express.Router();

// Get all media types
router.get('/', getMediaTypes);

// Get a specific media type
router.get('/:id', getMediaTypeById);

// Debug endpoint
router.get('/:id/debug', debugMediaType);

// Utility endpoint for Product Image
router.post('/fix-product-image-tags', setProductImageDefaultTags);

// Add a new media type
router.post('/', addMediaType);

// Update a media type
router.put('/:id', updateMediaType);

// Delete a media type
router.delete('/:id', deleteMediaType);

// Media type status management
router.get('/:id/usage', checkMediaTypeUsage);
router.patch('/:id/deprecate', deprecateMediaType);
router.patch('/:id/archive', archiveMediaType);

// Migration
router.post('/migrate', migrateMediaFiles);

// Apply default tags to existing media files
router.post('/:id/apply-default-tags', applyDefaultTagsToExistingFiles);

export default router;
