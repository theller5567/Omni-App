import mongoose from 'mongoose';
import Media from '../Media.js';

// Base schema for all Video type media
const baseVideoSchema = new mongoose.Schema({
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
    fileName: String,
    altText: String,
    visibility: String,
    tags: [String],
    description: String,
    // Video specific metadata
    v_thumbnail: {
      type: String,
      required: true,
      description: 'S3 location or ID of the video thumbnail'
    },
    v_thumbnailTimestamp: {
      type: String,
      required: true,
      default: '00:00:01',
      description: 'Timestamp where the thumbnail was taken (HH:MM:SS)'
    },
    duration: { type: Number },
    frameRate: { type: Number },
    width: { type: Number },
    height: { type: Number },
    codec: { type: String },
    aspectRatio: { type: String },
    hasAudio: { type: Boolean },
    audioCodec: { type: String }
  },
});

// Check if the model already exists before defining it
const BaseVideo = mongoose.models.BaseVideo || mongoose.model('BaseVideo', baseVideoSchema);

export default BaseVideo; 