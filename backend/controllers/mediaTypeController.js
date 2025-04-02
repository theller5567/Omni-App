import MediaType from '../models/MediaType.js';

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
    const mediaTypes = await MediaType.find();
    res.status(200).json(mediaTypes);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching media types', error });
  }
};
