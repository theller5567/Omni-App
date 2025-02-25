import mongoose from 'mongoose';

const mediaSchema = new mongoose.Schema({
  location: String,
  metadata: {
    title: String,
    altText: String,
    description: String,
  },
  // Add other fields as necessary
});

const Media = mongoose.model('Media', mediaSchema);

export default Media; 