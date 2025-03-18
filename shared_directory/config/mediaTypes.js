// backend/config/mediaTypes.js
export const mediaTypes = {
    ProductImage: {
      schema: {
        fileName: String,
        tags: [String],
        visibility: String,
        altText: String,
        description: String,
        recordedDate: Date,
        imageWidth: Number,
        imageHeight: Number,
      },
      frontendConfig: {
        fields: {
          fileName: { type: 'text', required: true, label: 'File Name' },
          tags: { type: 'text', required: true, label: 'Tags' },
          visibility: { type: 'select', options: ['public', 'private'], required: true, label: 'Visibility' },
          altText: { type: 'text', required: true, label: 'Alt Text' },
          description: { type: 'textarea', required: true, label: 'Description' },
          recordedDate: { type: 'date', required: true, label: 'Recorded Date' },
          productSKU: { type: 'text', required: true, label: 'Product SKU' }
        }
      }
    },
    WebinarVideo: {
      schema: {
        fileName: String,
        tags: [String],
        visibility: String,
        description: String,
        duration: Number,
      },
      frontendConfig: {
        fields: {
          fileName: { type: 'text', required: true, label: 'File Name' },
          tags: { type: 'text', required: true, label: 'Tags' },
          visibility: { type: 'select', options: ['public', 'private'], required: true, label: 'Visibility' },
          description: { type: 'textarea', required: true, label: 'Description' },
          duration: { type: 'number', required: true, label: 'Duration' }
        }
      }
    },
    // Add more media types here
  };
  