// backend/config/mediaTypes.js
export const mediaTypes = {
    ProductImage: {
      schema: {
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