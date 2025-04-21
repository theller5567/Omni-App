import mongoose from 'mongoose';
const { Schema } = mongoose;

const tagCategorySchema = new Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  tags: [{
    id: {
      type: Schema.Types.ObjectId,
      ref: 'Tags'
    },
    name: {
      type: String,
      required: true
    }
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

const TagCategory = mongoose.model('TagCategory', tagCategorySchema);
export default TagCategory;