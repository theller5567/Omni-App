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
  metadata: {
    // Standardized fields for all media types
    fileName: { type: String },
    altText: { type: String },
    visibility: { type: String, enum: ['public', 'private'], default: 'public' },
    tags: { type: [String], default: [] },
    description: { type: String },
    // Other metadata will be added dynamically
  },
}, { 
  discriminatorKey: '__t', // This is the key that will identify the specific media type
  timestamps: true,
  strict: false // Allow additional fields to be added to metadata
});

// Check if the model already exists before defining it
const Media = mongoose.models.Media || mongoose.model('Media', mediaSchema);

export default Media;
