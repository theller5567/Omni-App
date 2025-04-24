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
  setProductImageDefaultTags,
  getFilesNeedingTags,
  getFilesNeedingTagsSummary,
  fixSpecificMediaFile
} from '../controllers/mediaTypeController.js';
import Media from '../models/Media.js';
import MediaType from '../models/MediaType.js';

const router = express.Router();

// Get all media types
router.get('/', getMediaTypes);

// Add a new endpoint to get all media types with usage counts in a single request
router.get('/with-usage-counts', async (req, res) => {
  try {
    console.log('Fetching all media types with usage counts in a single request');
    
    // Get all media types
    const mediaTypes = await MediaType.find();
    
    // Create a map to store counts for each media type
    const countMap = {};
    
    // For each media type, query the count in parallel (more efficient)
    const countPromises = mediaTypes.map(async (mediaType) => {
      try {
        const count = await Media.countDocuments({ mediaType: { $in: [mediaType._id, mediaType.name] } });
        countMap[mediaType._id] = count;
      } catch (err) {
        console.error(`Error getting count for media type ${mediaType.name}:`, err);
        countMap[mediaType._id] = 0;
      }
    });
    
    // Wait for all count operations to complete
    await Promise.all(countPromises);
    
    // Map media types with their counts
    const result = mediaTypes.map(mediaType => ({
      ...mediaType.toObject(),
      usageCount: countMap[mediaType._id] || 0
    }));
    
    console.log(`Returning ${result.length} media types with usage counts`);
    return res.status(200).json(result);
  } catch (error) {
    console.error('Error fetching media types with usage counts:', error);
    res.status(500).json({ error: 'Failed to fetch media types with usage counts' });
  }
});

// Summary endpoint for files needing tags (must come before :id routes)
router.get('/files-needing-tags-summary', getFilesNeedingTagsSummary);

// Utility endpoint for Product Image
router.post('/fix-product-image-tags', setProductImageDefaultTags);

// Get a specific media type
router.get('/:id', getMediaTypeById);

// Debug endpoint
router.get('/:id/debug', debugMediaType);

// Test debug endpoint for updating default tags
router.post('/test-update-tags/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { defaultTags } = req.body;
    
    console.log('🔍 Debug - Test update tags endpoint');
    console.log('ID:', id);
    console.log('Tags to set:', defaultTags);
    
    const MediaType = await import('../models/MediaType.js').then(m => m.default);
    const mediaType = await MediaType.findById(id);
    
    if (!mediaType) {
      return res.status(404).json({ message: 'Media type not found' });
    }
    
    // Direct update
    mediaType.defaultTags = defaultTags;
    const updatedType = await mediaType.save();
    
    console.log('✅ Updated media type with tags:', updatedType.defaultTags);
    
    res.status(200).json({
      message: 'Tags updated',
      mediaType: updatedType
    });
  } catch (error) {
    console.error('❌ Error in test update:', error);
    res.status(500).json({ message: 'Error updating tags', error: error.toString() });
  }
});

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

// Check files needing default tags
router.get('/:id/files-needing-tags', getFilesNeedingTags);

// Fix specific media file's tags
router.post('/:mediaTypeId/fix-file/:fileId', fixSpecificMediaFile);

export default router;
