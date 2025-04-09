import mongoose from 'mongoose';
import Media from '../Media.js';

// Base schema for all Image type media
const baseImageSchema = new mongoose.Schema({
  // Image-specific fields
  metadata: {
    imageWidth: { type: Number },
    imageHeight: { type: Number },
    resolution: { type: String },
    colorSpace: { type: String },
    orientation: { type: String },
    hasAlphaChannel: { type: Boolean },
  }
});

const BaseImage = Media.discriminator('BaseImage', baseImageSchema);

export default BaseImage; 