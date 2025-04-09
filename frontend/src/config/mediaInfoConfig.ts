// List of fields that should be hidden from the media information display
export const hiddenFields = [
  'id',
  '_id',
  '__v',
  'createdAt',
  'updatedAt',
  'location',
  'slug',
  'isDeleting',
  'replacedBy',
  'status',
  'baseType',
  'thumbnailUrl',
  'tags',
  // Add any other fields you want to hide
];

// Function to check if a field should be hidden
export const shouldHideField = (fieldName: string): boolean => {
  return hiddenFields.includes(fieldName) || 
    // Hide internal fields that start with underscore
    fieldName.startsWith('_') ||
    // Hide any empty or null values
    fieldName === '' || 
    fieldName === null;
}; 