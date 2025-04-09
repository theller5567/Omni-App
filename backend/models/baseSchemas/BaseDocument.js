import mongoose from 'mongoose';
import Media from '../Media.js';

// Base schema for all Document type media
const baseDocumentSchema = new mongoose.Schema({
  // Document-specific fields
  metadata: {
    pageCount: { type: Number },
    author: { type: String },
    creationDate: { type: Date },
    lastModified: { type: Date },
    documentTitle: { type: String },
    keywords: { type: [String] },
    documentLanguage: { type: String },
  }
});

const BaseDocument = Media.discriminator('BaseDocument', baseDocumentSchema);

export default BaseDocument; 