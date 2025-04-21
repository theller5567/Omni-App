import { Schema, model } from 'mongoose';
import TagCategory from '../models/TagCategory.js';
import mongoose from 'mongoose';


// Get all tag categories
export const getTagCategories = async (req, res) => {
  try {
    console.log('GET TAG CATEGORIES - Query params:', req.query);
    
    // Allow including inactive categories via query param
    const includeInactive = req.query.includeInactive === 'true';
    console.log(`GET TAG CATEGORIES - Include inactive: ${includeInactive}`);
    
    // Include query for debugging
    const filter = includeInactive ? {} : { isActive: true };
    console.log('GET TAG CATEGORIES - Filter:', filter);
    
    // Get all categories from database without populating tagIds
    const allCategories = await TagCategory.find({})
      .sort({ name: 1 });
      
    console.log(`GET TAG CATEGORIES - All categories (unfiltered): ${allCategories.length}`);
    
    if (allCategories.length > 0) {
      console.log('GET TAG CATEGORIES - First category sample:', {
        id: allCategories[0]._id,
        name: allCategories[0].name,
        isActive: allCategories[0].isActive
      });
    }
    
    // Apply filter after fetching all for debugging
    const tagCategories = await TagCategory.find(filter)
      .sort({ name: 1 });
    
    // Log the filtered results
    console.log(`GET TAG CATEGORIES - Filtered categories (${includeInactive ? 'including' : 'excluding'} inactive): ${tagCategories.length}`);
    
    res.json(tagCategories);
  } catch (error) {
    console.error('GET TAG CATEGORIES - Error:', error);
    res.status(500).json({ message: error.message });
  }
};

// Get a specific tag category
export const getTagCategory = async (req, res) => {
  try {
    const tagCategory = await TagCategory.findById(req.params.id);
    if (!tagCategory) {
      return res.status(404).json({ message: 'Tag category not found' });
    }
    res.json(tagCategory);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Create a tag category
export const createTagCategory = async (req, res) => {
  try {
    console.log('CREATING TAG CATEGORY - Request body:', req.body);
    console.log('CREATING TAG CATEGORY - User from request:', req.user);
    
    const { name, description, tags } = req.body;
    
    // Make sure there's a name
    if (!name || name.trim() === '') {
      console.log('CREATING TAG CATEGORY - Failed: Name is required');
      return res.status(400).json({ message: 'Category name is required' });
    }
    
    // Check if a tag category with this name already exists (case-insensitive)
    // Include both active and inactive categories in this check
    console.log(`CREATING TAG CATEGORY - Checking if name "${name}" already exists (case-insensitive)`);
    
    const existingCategory = await TagCategory.findOne({ 
      name: { $regex: new RegExp(`^${name}$`, 'i') }
    });
    
    if (existingCategory) {
      console.log(`CREATING TAG CATEGORY - Found existing category:`, {
        id: existingCategory._id,
        name: existingCategory.name,
        isActive: existingCategory.isActive,
        createdAt: existingCategory.createdAt
      });
      
      // If the category exists but is inactive, consider reactivating it
      if (!existingCategory.isActive) {
        console.log(`CREATING TAG CATEGORY - Category "${name}" exists but is inactive. Reactivating.`);
        existingCategory.isActive = true;
        const reactivatedCategory = await existingCategory.save();
        
        return res.status(200).json({ 
          ...reactivatedCategory.toObject(), 
          message: 'Existing category reactivated' 
        });
      }
      
      console.log(`CREATING TAG CATEGORY - Failed: Category with name "${name}" already exists`);
      return res.status(400).json({ message: `Category "${name}" already exists` });
    }
    
    console.log(`CREATING TAG CATEGORY - No existing category found with name "${name}", proceeding with creation`);
    
    // Use the tags array as provided or initialize empty
    const tagsArray = Array.isArray(tags) ? tags : [];
    
    // Log the final data being saved
    console.log('CREATING TAG CATEGORY - Final data being saved:', {
      name,
      description,
      tags: tagsArray
    });
    
    const newTagCategory = new TagCategory({
      name,
      description,
      tags: tagsArray,
      // Only set createdBy if user is available in request
      ...(req.user && { createdBy: req.user.id })
    });
    
    console.log('CREATING TAG CATEGORY - New category object:', newTagCategory);
    
    try {
      const savedCategory = await newTagCategory.save();
      console.log('CREATING TAG CATEGORY - Saved successfully:', savedCategory);
      
      // Double-check that we can retrieve the category after saving
      const retrievedCategory = await TagCategory.findById(savedCategory._id);
      console.log('CREATING TAG CATEGORY - Retrieved saved category:', retrievedCategory);
      
      return res.status(201).json(savedCategory);
    } catch (saveError) {
      console.error('CREATING TAG CATEGORY - Error saving to database:', saveError);
      return res.status(500).json({ message: 'Database error while saving category', error: saveError.message });
    }
  } catch (error) {
    console.error('CREATING TAG CATEGORY - Unexpected error:', error);
    res.status(400).json({ message: error.message });
  }
};

// Update a tag category
export const updateTagCategory = async (req, res) => {
  try {
    console.log('UPDATING TAG CATEGORY - Request body:', req.body);
    const { name, description, tags, isActive } = req.body;
    
    const tagCategory = await TagCategory.findById(req.params.id);
    if (!tagCategory) {
      return res.status(404).json({ message: 'Tag category not found' });
    }
    
    if (name) tagCategory.name = name;
    if (description !== undefined) tagCategory.description = description;
    
    // Handle tags update if provided
    if (tags && Array.isArray(tags) && tags.length > 0) {
      console.log('UPDATING TAG CATEGORY - Using provided tags array:', tags);
      // Ensure proper format: each tag should have id and name
      const formattedTags = tags.map(tag => ({
        id: typeof tag.id === 'string' ? tag.id : tag.id.toString(),
        name: tag.name
      }));
      
      tagCategory.tags = formattedTags;
      console.log('UPDATING TAG CATEGORY - Formatted tags:', formattedTags);
    }
    
    if (isActive !== undefined) tagCategory.isActive = isActive;
    
    console.log('UPDATING TAG CATEGORY - Final category data before save:', {
      name: tagCategory.name,
      description: tagCategory.description,
      tags: tagCategory.tags,
      isActive: tagCategory.isActive
    });
    
    const updatedCategory = await tagCategory.save();
    console.log('UPDATING TAG CATEGORY - Successfully saved');
    res.json(updatedCategory);
  } catch (error) {
    console.error('UPDATING TAG CATEGORY - Error:', error);
    res.status(400).json({ message: error.message });
  }
};

// Delete a tag category
export const deleteTagCategory = async (req, res) => {
  try {
    console.log('DELETE TAG CATEGORY - Processing delete for ID:', req.params.id);
    console.log('DELETE TAG CATEGORY - Query params:', req.query);
    
    // Check if hard delete was requested (completely remove from database)
    const hardDelete = req.query.hard === 'true';
    console.log('DELETE TAG CATEGORY - Hard delete requested:', hardDelete);
    
    const tagCategory = await TagCategory.findById(req.params.id);
    if (!tagCategory) {
      console.log('DELETE TAG CATEGORY - Category not found');
      return res.status(404).json({ message: 'Tag category not found' });
    }
    
    if (hardDelete) {
      // Hard delete - completely remove from database
      console.log('DELETE TAG CATEGORY - Performing hard delete');
      await TagCategory.deleteOne({ _id: req.params.id });
      console.log('DELETE TAG CATEGORY - Hard delete successful');
      return res.json({ message: 'Tag category permanently deleted', hardDelete: true });
    } else {
      // Soft delete - just mark as inactive
      console.log('DELETE TAG CATEGORY - Performing soft delete (marking inactive)');
      tagCategory.isActive = false;
      await tagCategory.save();
      console.log('DELETE TAG CATEGORY - Soft delete successful');
      return res.json({ message: 'Tag category deleted successfully', hardDelete: false });
    }
  } catch (error) {
    console.error('DELETE TAG CATEGORY - Error:', error);
    res.status(500).json({ message: error.message });
  }
};

export default {
  getTagCategories,
  getTagCategory,
  createTagCategory,
  updateTagCategory,
  deleteTagCategory
};