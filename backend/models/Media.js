import mongoose from 'mongoose';

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
}, { discriminatorKey: 'mediaType' });

// Product Image Schema
const productImageSchema = new mongoose.Schema({
  companyBrand: { type: String, required: true },
  productSKU: { type: String, required: true },
  uploadedBy: { type: String, required: true },
  modifiedBy: { type: String, required: true },
  sizeRequirements: String,
});

// Create models
const Media = mongoose.model('Media', baseMediaSchema);
const ProductImage = Media.discriminator('ProductImage', productImageSchema);

export { Media, ProductImage }; 