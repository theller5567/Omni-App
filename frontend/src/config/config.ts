export const fieldLabels = {
  description: 'Description',
  category: 'Category',
  isActive: 'Is Active',
  companyBrand: 'Company Brand',
  mediaType: 'Media Type',
  mediaSubType: 'Media Sub Type',
  fileSize: 'File Size',
  recordedDate: 'Recorded Date',
  uploadedBy: 'Uploaded By',
  modifiedBy: 'Modified By',
  metadata: 'Metadata',
  fileName: 'File Name',
  fileExtension: 'File Extension',
  modifiedDate: 'Modified Date',
  tags: 'Tags',
  title: 'Title',
  altText: 'Alt Text',
  productSKU: 'Product SKU',
  visibility: 'Visibility',
  imageWidth: 'Image Width',
  imageHeight: 'Image Height',
  // Add more field label mappings as needed
};

export const nonEditableFields = {
  _id: true,
  id: true,
  location: true,
  slug: true,
  fileExtension: true,
  modifiedDate: true,
  __t: true,
  __v: true,
  recordedDate: true,
  fileSize: true,
  uploadedBy: true,
  modifiedBy: true,
  mediaType: true,
  imageWidth: true,
  imageHeight: true,
};

export const fieldConfigurations = {
  description: { type: 'textarea', class: 'text-area-field', fullWidth: true },
  companyBrand: { type: 'select', class: 'select-field', options: [
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
        "Pfizer"], fullWidth: false 
  },
  isActive: { type: 'checkbox', class: 'checkbox-field', fullWidth: false },
  title: { type: 'text', class: 'text-field', fullWidth: false },
  mediaType: { type: 'text', class: 'text-field', fullWidth: false },
  fileName: { type: 'text', class: 'text-field', fullWidth: false },
  tags: { type: 'tag', class: 'text-field', fullWidth: false },
  visibility: { type: 'select', options: ['public', 'private'], class: 'select-field', fullWidth: false },
  altText: { type: 'text', class: 'text-field', fullWidth: false },
  productSKU: { type: 'text', class: 'text-field', fullWidth: false },
  imageWidth: { type: 'number', class: 'number-field', fullWidth: false },
  imageHeight: { type: 'number', class: 'number-field', fullWidth: false },
  sizeRequirements: { type: 'text', class: 'text-field', fullWidth: false },
  // Add more field configurations as needed
};

// Application config
export const API_BASE_URL = 'http://localhost:5002';

// Database settings
export const DB_CONFIG = {
  maxPageSize: 100,
  defaultPageSize: 25
};

// Storage limits
export const STORAGE_LIMITS = {
  maxFileSize: 100 * 1024 * 1024, // 100MB
  totalStorageLimit: 5 * 1024 * 1024 * 1024 // 5GB
};

// Activity log settings
export const ACTIVITY_CONFIG = {
  defaultFetchLimit: 20,
  actionsToTrack: [
    'UPLOAD',
    'DELETE',
    'EDIT',
    'CREATE',
    'VIEW',
    'LOGIN',
    'LOGOUT'
  ]
};

// Export default config
export default {
  API_BASE_URL,
  DB_CONFIG,
  STORAGE_LIMITS,
  ACTIVITY_CONFIG
};
