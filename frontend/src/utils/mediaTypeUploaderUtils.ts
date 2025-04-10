import { MediaTypeField, FieldType, SelectField, MediaTypeConfig } from '../types/mediaTypes';

// Define the file type category interface
export interface FileTypeCategory {
  name: string;
  label: string;
  icon: React.ReactNode;
  mimeTypes: string[];
}

// Define predefined colors for media types
export const predefinedColors = [
  { name: 'Red', hex: '#f44336' },
  { name: 'Pink', hex: '#e91e63' },
  { name: 'Purple', hex: '#9c27b0' },
  { name: 'Deep Purple', hex: '#673ab7' },
  { name: 'Indigo', hex: '#3f51b5' },
  { name: 'Blue', hex: '#2196f3' },
  { name: 'Light Blue', hex: '#03a9f4' },
  { name: 'Cyan', hex: '#00bcd4' },
  { name: 'Teal', hex: '#009688' },
  { name: 'Green', hex: '#4caf50' },
  { name: 'Light Green', hex: '#8bc34a' },
  { name: 'Lime', hex: '#cddc39' },
  { name: 'Yellow', hex: '#ffeb3b' },
  { name: 'Amber', hex: '#ffc107' },
  { name: 'Orange', hex: '#ff9800' },
  { name: 'Deep Orange', hex: '#ff5722' },
  { name: 'Brown', hex: '#795548' },
  { name: 'Grey', hex: '#9e9e9e' },
  { name: 'Blue Grey', hex: '#607d8b' }
];

// Field validation utilities
export const isSelectField = (field: MediaTypeField): field is SelectField => {
  return field.type === 'Select' || field.type === 'MultiSelect';
};

// Create a new field of the specified type
export const createField = (
  type: FieldType, 
  name: string = '', 
  required: boolean = false
): MediaTypeField => {
  if (type === 'Select' || type === 'MultiSelect') {
    return {
      type,
      name,
      options: [],
      required,
    };
  }
  return {
    type,
    name,
    required,
  };
};

// Update options in a select field
export const updateFieldOptions = (field: SelectField, options: string[]): SelectField => {
  return {
    ...field,
    options,
  };
};

// Transform config data for API
export const transformConfigToApiData = (config: MediaTypeConfig) => {
  return {
    name: config.name,
    fields: config.fields,
    baseType: config.baseType || 'Media',
    includeBaseFields: config.includeBaseFields !== false,
    acceptedFileTypes: config.acceptedFileTypes || [],
    status: config.status || 'active'
  };
};

// Check if a category is fully selected
export const isCategorySelected = (categoryName: string, fileTypeCategories: FileTypeCategory[], acceptedFileTypes: string[]) => {
  const category = fileTypeCategories.find(cat => cat.name === categoryName);
  if (!category) return false;
  
  // Check if all MIME types in this category are selected
  return category.mimeTypes.every(type => acceptedFileTypes.includes(type));
};

// Check if a category is partially selected
export const isCategoryPartiallySelected = (categoryName: string, fileTypeCategories: FileTypeCategory[], acceptedFileTypes: string[]) => {
  const category = fileTypeCategories.find(cat => cat.name === categoryName);
  if (!category) return false;
  
  // Check if some (but not all) MIME types in this category are selected
  const selectedCount = category.mimeTypes.filter(type => acceptedFileTypes.includes(type)).length;
  return selectedCount > 0 && selectedCount < category.mimeTypes.length;
}; 