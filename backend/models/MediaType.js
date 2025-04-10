import mongoose from 'mongoose';

const fieldSchema = new mongoose.Schema({
  name: { type: String, required: true },
  type: { type: String, required: true },
  options: { type: [String], default: [] },
  required: { type: Boolean, default: false }
}, { _id: false });

const mediaTypeSchema = new mongoose.Schema({
  name: { type: String, required: true },
  fields: [fieldSchema],
  status: { 
    type: String, 
    enum: ['active', 'deprecated', 'archived'], 
    default: 'active' 
  },
  usageCount: { type: Number, default: 0 },
  replacedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'mediaTypes', default: null },
  isDeleting: { type: Boolean, default: false },
  acceptedFileTypes: { type: [String], default: [] },
  baseType: { 
    type: String, 
    enum: ['BaseImage', 'BaseVideo', 'BaseAudio', 'BaseDocument', 'Media'],
    default: 'Media'
  },
  includeBaseFields: { type: Boolean, default: true },
  catColor: { type: String, default: '#2196f3' }
}, { timestamps: true });

const MediaType = mongoose.models.mediaTypes || mongoose.model('mediaTypes', mediaTypeSchema);

export default MediaType;
