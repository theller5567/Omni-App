import mongoose from 'mongoose';

const fieldSchema = new mongoose.Schema({
  name: { type: String, required: true },
  type: { type: String, required: true },
  options: { type: [String], default: [] },
  required: { type: Boolean, default: false }
}, { _id: false });

const mediaTypeSchema = new mongoose.Schema({
  name: { type: String, required: true },
  fields: [fieldSchema]
});

const MediaType = mongoose.models.mediaTypes || mongoose.model('mediaTypes', mediaTypeSchema);

export default MediaType;
