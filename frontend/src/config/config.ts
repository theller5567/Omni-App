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
  imageWidth: true,
  imageHeight: true,
};

export const fieldConfigurations = {
  description: { type: 'textarea', class: 'text-area-field' },
  category: { type: 'select', options: ['Option 1', 'Option 2', 'Option 3'] },
  isActive: { type: 'checkbox' },
  // Add more field configurations as needed
};
