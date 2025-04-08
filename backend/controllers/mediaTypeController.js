import MediaType from '../models/MediaType.js';
import Media from '../models/Media.js';

// Add a new media type
export const addMediaType = async (req, res) => {
  try {
    console.log(req.body);
    const { name, fields } = req.body;
    const newMediaType = new MediaType({ name, fields });
    await newMediaType.save();
    res.status(201).json(newMediaType);
  } catch (error) {
    res.status(400).json({ message: 'Error adding media type', error });
  }
};

// Get all media types
export const getMediaTypes = async (req, res) => {
    console.log('Getting media types', req.body);
  try {
    const mediaTypes = await MediaType.find().lean();
    console.log('Found media types:', mediaTypes);
    res.status(200).json(mediaTypes);
  } catch (error) {
    console.error('Error fetching media types:', error);
    res.status(500).json({ message: 'Error fetching media types', error });
  }
};

// Check usage of a media type
export const checkMediaTypeUsage = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Find the media type to get its name
    const mediaType = await MediaType.findById(id);
    
    if (!mediaType) {
      return res.status(404).json({ message: 'Media type not found' });
    }
    
    // Count how many media files use this type by either ID or name
    const count = await Media.countDocuments({
      $or: [
        { mediaType: id },
        { mediaType: mediaType.name }
      ]
    });
    
    // Update the usage count in the media type
    await MediaType.findByIdAndUpdate(id, { usageCount: count });
    
    res.status(200).json({ count, id });
  } catch (error) {
    console.error('Error checking media type usage:', error);
    res.status(500).json({ message: 'Error checking media type usage', error });
  }
};

// Deprecate a media type (soft delete)
export const deprecateMediaType = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Find the media type
    const mediaType = await MediaType.findById(id);
    
    if (!mediaType) {
      return res.status(404).json({ message: 'Media type not found' });
    }
    
    // Mark as deprecated
    mediaType.status = 'deprecated';
    await mediaType.save();
    
    res.status(200).json(mediaType);
  } catch (error) {
    console.error('Error deprecating media type:', error);
    res.status(500).json({ message: 'Error deprecating media type', error });
  }
};

// Archive a media type (complete soft delete)
export const archiveMediaType = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Find the media type
    const mediaType = await MediaType.findById(id);
    
    if (!mediaType) {
      return res.status(404).json({ message: 'Media type not found' });
    }
    
    // Check if there are any media files using this type (for informational purposes only)
    const count = await Media.countDocuments({
      $or: [
        { mediaType: id },
        { mediaType: mediaType.name }
      ]
    });
    
    // Mark as archived - we now allow archiving even if media files are using this type
    mediaType.status = 'archived';
    await mediaType.save();
    
    res.status(200).json({
      ...mediaType._doc,
      usageCount: count
    });
  } catch (error) {
    console.error('Error archiving media type:', error);
    res.status(500).json({ message: 'Error archiving media type', error });
  }
};

// Migrate media files from one type to another
export const migrateMediaFiles = async (req, res) => {
  try {
    const { sourceId, targetId } = req.body;
    
    if (sourceId === targetId) {
      return res.status(400).json({ message: 'Source and target media types cannot be the same' });
    }
    
    // Get both media types
    const sourceType = await MediaType.findById(sourceId);
    const targetType = await MediaType.findById(targetId);
    
    if (!sourceType || !targetType) {
      return res.status(404).json({ message: 'One or both media types not found' });
    }
    
    // Get all media files of the source type (check both ID and name references)
    const mediaFiles = await Media.find({
      $or: [
        { mediaType: sourceId },
        { mediaType: sourceType.name }
      ]
    });
    
    console.log(`Migrating ${mediaFiles.length} files from ${sourceType.name} to ${targetType.name}`);
    
    // Update all media files to use the target type
    for (const file of mediaFiles) {
      // Always use the target ID for consistency
      file.mediaType = targetId;
      
      // Preserve existing metadata during migration
      // Additional logic could be added here to transform metadata based on the target type's fields
      
      await file.save();
    }
    
    // Update usage counts
    sourceType.usageCount = 0;
    targetType.usageCount = await Media.countDocuments({
      $or: [
        { mediaType: targetId },
        { mediaType: targetType.name }
      ]
    });
    
    // Mark source as replaced by target
    sourceType.replacedBy = targetId;
    
    await sourceType.save();
    await targetType.save();
    
    res.status(200).json({
      message: `Successfully migrated ${mediaFiles.length} files`,
      source: sourceType,
      target: targetType
    });
  } catch (error) {
    console.error('Error migrating media files:', error);
    res.status(500).json({ message: 'Error migrating media files', error });
  }
};

// Permanently delete a media type (only if not in use)
export const deleteMediaType = async (req, res) => {
  try {
    const { id } = req.params;
    console.log('⭐ DELETE REQUEST RECEIVED for media type ID:', id);
    
    // Log the collection information
    console.log('📚 MediaType model info:');
    console.log('- Collection name:', MediaType.collection.name);
    console.log('- Model name:', MediaType.modelName);
    
    // Find the media type
    const mediaType = await MediaType.findById(id);
    
    if (!mediaType) {
      console.log('❌ Media type not found for ID:', id);
      return res.status(404).json({ message: 'Media type not found' });
    }
    
    console.log('✅ Found media type to delete:', mediaType.name, 'with ID:', mediaType._id.toString());
    
    // Check if there are any media files using this type
    const count = await Media.countDocuments({
      $or: [
        { mediaType: id },
        { mediaType: mediaType.name }
      ]
    });
    
    console.log('ℹ️ Count of media files using this type:', count);
    
    if (count > 0) {
      console.log('❌ Cannot delete media type that is still in use, found', count, 'media files using it');
      return res.status(400).json({ 
        message: 'Cannot delete media type that is still in use',
        count
      });
    }
    
    // If no files are using it, permanently delete it
    console.log('🗑️ Attempting to delete media type from database...');
    
    // Try direct deletion to see if it works better
    const directDeleteResult = await MediaType.deleteOne({ _id: id });
    console.log('🧹 Direct deleteOne result:', directDeleteResult);
    
    if (directDeleteResult.deletedCount === 0) {
      console.log('⚠️ deleteOne did not delete any document');
    }
    
    // Also try the findByIdAndDelete method
    const deleteResult = await MediaType.findByIdAndDelete(id);
    
    if (!deleteResult) {
      console.log('❌ Failed to delete media type with findByIdAndDelete, no document returned');
      // Don't return here, we already tried direct deletion
    } else {
      console.log('✅ Successfully deleted media type with findByIdAndDelete:', deleteResult._id.toString());
    }
    
    // Try a find after deletion to confirm it's gone
    const checkAfterDelete = await MediaType.findById(id);
    console.log('🔍 Media type after deletion attempt:', checkAfterDelete);
    
    res.status(200).json({ 
      message: 'Media type permanently deleted',
      id,
      deleteResultCount: directDeleteResult.deletedCount,
      stillExists: !!checkAfterDelete
    });
  } catch (error) {
    console.error('❌ Error deleting media type:', error);
    res.status(500).json({ message: 'Error deleting media type', error });
  }
};
