import mongoose from 'mongoose';
import { mediaTypes } from '../config/mediaTypes.js';

// Base Media Schema
const baseMediaSchema = new mongoose.Schema({
  id: { type: String, required: true },
  title: String,
  location: String,
  slug: String,
  fileSize: Number,
  fileExtension: String,
  modifiedDate: Date,
  metadata: {
    fileName: String,
    tags: [String],
    visibility: String,
    altText: String,
    description: String,
  },
});

// Create base model
const Media = mongoose.model('Media', baseMediaSchema);

// Dynamically create and register media type schemas
Object.keys(mediaTypes).forEach((type) => {
  const schema = new mongoose.Schema({
    ...baseMediaSchema.obj,
    metadata: {
      ...baseMediaSchema.obj.metadata,
      ...mediaTypes[type].schema,
    },
  });
  Media.discriminator(type, schema);
});

export { Media };
