import Tags from '../models/Tags.js';
import { v4 as uuidv4 } from 'uuid'; // Import UUID library

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
      const newTag = new Tags({
        name,
      });
      await newTag.save();
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
    const updatedTag = await Tags.findByIdAndUpdate(id, { name }, { new: true });
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
    await Tags.findByIdAndDelete(id);
    res.status(204).send();
  } catch (error) {
    res.status(400).json({ message: 'Error deleting tag' });
  }
};
