import mongoose from 'mongoose';

const mediaSchema = new mongoose.Schema({
  id: { type: String, required: true },
  title: String,
  location: String,
  slug: String,
  fileSize: Number,
  fileExtension: String,
  modifiedDate: Date,
  uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  modifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  // Store mediaType as ObjectId going forward; keep string compatibility via migration and read helpers
  mediaType: { type: mongoose.Schema.Types.ObjectId, ref: 'MediaType' },
  approvalStatus: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'needs_revision'],
    default: 'pending',
  },
  approvalFeedback: { type: String },
  approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // Assuming you have a User model
  approvedAt: { type: Date },
  pendingVersionData: { type: Object }, // For storing proposed changes during an edit approval workflow
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
