import Tags from '../models/Tags.js';
import ActivityTrackingService from '../services/activityTrackingService.js';

// Helper function for case-insensitive tag existence check
const tagExistsIgnoreCase = async (name, excludeId = null) => {
  const regex = new RegExp(`^${name}$`, 'i'); // Case-insensitive regex
  const query = { name: regex };
  
  // If we're excluding a specific tag (for updates), add that to query
  if (excludeId) {
    query._id = { $ne: excludeId };
  }
  
  const existingTag = await Tags.findOne(query);
  return !!existingTag;
};

// Fetch all tags
export const getTags = async (req, res) => {
    console.log('Getting tags');
  try {
    const tags = await Tags.find();
    console.log('Tags fetched:', tags);
    res.json(tags);
  } catch (error) {
    console.error('Error fetching tags:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Add a new tag
export const addTag = async (req, res) => {
    console.log('Adding tag');
    try {
      const { name } = req.body;
      
      // Check if tag already exists (case-insensitive)
      if (await tagExistsIgnoreCase(name)) {
        return res.status(400).json({ 
          message: `Tag "${name}" already exists (case-insensitive match)` 
        });
      }
      
      const newTag = new Tags({
        name,
      });
      await newTag.save();
      
      // Track tag creation activity
      if (req.user) {
        await ActivityTrackingService.trackTagCreation(req.user, newTag);
      }
      
      res.status(201).json(newTag);
    } catch (error) {
      res.status(400).json({ message: 'Error adding tag', error });
    }
  };

// Update a tag
export const updateTag = async (req, res) => {
  console.log('Updating tag');
  try {
    const { id } = req.params;
    const { name } = req.body;
    
    // Check if tag already exists (case-insensitive, excluding current tag)
    if (await tagExistsIgnoreCase(name, id)) {
      return res.status(400).json({ 
        message: `Tag "${name}" already exists (case-insensitive match)` 
      });
    }
    
    // Get the original tag for tracking changes
    const originalTag = await Tags.findById(id);
    if (!originalTag) {
      return res.status(404).json({ message: 'Tag not found' });
    }
    
    // Track what fields were changed
    const changedFields = [];
    if (originalTag.name !== name) {
      changedFields.push('name');
    }
    
    const updatedTag = await Tags.findByIdAndUpdate(id, { name }, { new: true });
    
    // Track tag update activity
    if (req.user && changedFields.length > 0) {
      await ActivityTrackingService.trackTagUpdate(req.user, updatedTag, changedFields);
    }
    
    res.json(updatedTag);
  } catch (error) {
    res.status(400).json({ message: 'Error updating tag' });
  }
};

// Delete a tag
export const deleteTag = async (req, res) => {
  console.log('Deleting tag');
  try {
    const { id } = req.params;
    
    // Find the tag before deleting for activity tracking
    const tagToDelete = await Tags.findById(id);
    if (!tagToDelete) {
      return res.status(404).json({ message: 'Tag not found' });
    }
    
    await Tags.findByIdAndDelete(id);
    
    // Track tag deletion activity
    if (req.user) {
      await ActivityTrackingService.trackTagDeletion(req.user, tagToDelete);
    }
    
    res.status(204).send();
  } catch (error) {
    res.status(400).json({ message: 'Error deleting tag' });
  }
};
