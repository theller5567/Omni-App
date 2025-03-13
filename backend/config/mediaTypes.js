// backend/config/mediaTypes.js
export const mediaTypes = {
    ProductImage: {
      schema: {
        companyBrand: { type: String, required: true },
        productSKU: { type: String, required: true },
        uploadedBy: { type: String, required: true },
        modifiedBy: { type: String, required: true },
        sizeRequirements: String,
      },
    },
    WebinarVideo: {
      schema: {
        presenter: { type: String, required: true },
        duration: { type: String, required: true },
        recordedDate: { type: Date, required: true },
      },
    },
    // Add more media types here
  };
  