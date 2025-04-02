import mongoose from 'mongoose';

const fieldSchema = new mongoose.Schema({
  name: { type: String, required: true },
  type: { type: String, required: true },
  options: [String], // Optional array of options for select/multiselect fields
  required: { type: Boolean, required: true },
  default: { type: String, required: false },
  min: { type: Number, required: false },
  max: { type: Number, required: false },
  minLength: { type: Number, required: false },
  maxLength: { type: Number, required: false },
  unique: { type: Boolean, required: false },
  description: { type: String, required: false },
});

const mediaTypeSchema = new mongoose.Schema({
  name: { type: String, required: true },
  fields: [fieldSchema], // Array of field objects
});

const MediaType = mongoose.model('MediaType', mediaTypeSchema);

export default MediaType;
