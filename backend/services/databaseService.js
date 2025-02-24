import Media from '../models/Media.js';

export const saveMediaToDatabase = async (mediaData) => {
  try {
    const media = new Media(mediaData);
    await media.save();
    console.log('Media data saved successfully');
  } catch (error) {
    console.error('Error saving media data:', error);
    throw error;
  }
}; 