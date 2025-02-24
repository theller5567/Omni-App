import mongoose from 'mongoose';

const mediaSchema = new mongoose.Schema({
  id: String,
  title: String,
  slug: String,
  metadata: Object,
  location: String,
  // Add other fields as needed
});

const Media = mongoose.model('Media', mediaSchema);

export default Media; 