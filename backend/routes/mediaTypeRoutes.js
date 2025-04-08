import express from 'express';
import { 
  addMediaType, 
  getMediaTypes,
  checkMediaTypeUsage,
  deprecateMediaType,
  archiveMediaType,
  migrateMediaFiles,
  deleteMediaType
} from '../controllers/mediaTypeController.js';

const router = express.Router();

// Basic CRUD operations
router.post('/', addMediaType);
router.get('/', getMediaTypes);

// Media type status management
router.get('/:id/usage', checkMediaTypeUsage);
router.put('/:id/deprecate', deprecateMediaType);
router.put('/:id/archive', archiveMediaType);

// Migration
router.post('/migrate', migrateMediaFiles);

// Delete
router.delete('/:id', deleteMediaType);

export default router;
