import mongoose from 'mongoose';

const productImageSchema = new mongoose.Schema({
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
    tags: [String],
    visibility: String,
    altText: String,
    description: String,
    companyBrand: { 
      type: String, 
      required: true, 
      options: [
        "Omni",
        "Revvity",
        "BioLegend",
        "ThermoFisher",
        "PerkinElmer",
        "Merck",
        "Sigma-Aldrich",
        "Invitrogen",
        "Roche",
        "Novartis",
        "Pfizer",
      ] 
    },
    productSKU: { type: String, required: true },
    imageWidth: { type: Number, required: true },
    imageHeight: { type: Number, required: true },
    sizeRequirements: { type: String },
  },
});

// Check if the model already exists before defining it
const ProductImage = mongoose.models.ProductImage || mongoose.model('ProductImage', productImageSchema);

export default ProductImage;