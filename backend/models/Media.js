import mongoose from 'mongoose';

const mediaSchema = new mongoose.Schema({
  id: { type: String, required: true },
  title: String,
  location: String,
  slug: String,
  fileSize: Number,
  fileExtension: String,
  modifiedDate: Date,
  uploadedBy: String,
  modifiedBy: String,
  mediaType: String,
  metadata: mongoose.Schema.Types.Mixed, // Use a flexible type for metadata
});

// Check if the model already exists before defining it
const Media = mongoose.models.Media || mongoose.model('Media', mediaSchema);

export default Media;
