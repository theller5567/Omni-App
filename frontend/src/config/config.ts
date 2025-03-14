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
};

export const fieldConfigurations = {
  description: { type: 'textarea', class: 'text-area-field' },
  category: { type: 'select', options: ['Option 1', 'Option 2', 'Option 3'] },
  isActive: { type: 'checkbox' },
  // Add more field configurations as needed
};
