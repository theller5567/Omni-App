import { MetadataState } from "../types";
import { MediaType } from "../../../hooks/query-hooks";

/**
 * Validates if all required fields are filled
 */
export const validateRequiredFields = (
  metadata: MetadataState,
  selectedType: MediaType | null
): boolean => {
  // If no media type is selected, validation fails
  if (!selectedType || !selectedType.fields) return false;
  
  // Check if all required fields in metadata have values
  const requiredFields = [
    // Standard required fields
    ...(metadata.fileName.trim() === '' ? ['fileName'] : []),
    
    // Check media type specific required fields
    ...(selectedType.fields || [])
      .filter(field => field.required)
      .filter(field => {
        // For different field types, check if they have valid values
        if (field.type === 'MultiSelect') {
          return !metadata[field.name] || (Array.isArray(metadata[field.name]) && metadata[field.name].length === 0);
        }
        
        // For all other field types
        return metadata[field.name] === undefined || metadata[field.name] === "";
      })
      .map(field => field.name)
  ];
  
  // If any required fields are missing values, validation fails
  return requiredFields.length === 0;
};

/**
 * Checks if standard fields (like fileName) are incomplete
 */
export const hasIncompleteStandardFields = (metadata: MetadataState): boolean => {
  return metadata.fileName.trim() === '';
};

/**
 * Checks if media type specific fields are incomplete
 */
export const hasIncompleteCustomFields = (
  metadata: MetadataState,
  mediaType: MediaType | null
): boolean => {
  if (!mediaType || !mediaType.fields) return false;
  
  return mediaType.fields
    .filter(field => field.required)
    .some(field => {
      if (field.type === 'MultiSelect') {
        return !metadata[field.name] || 
          (Array.isArray(metadata[field.name]) && metadata[field.name].length === 0);
      }
      return metadata[field.name] === undefined || metadata[field.name] === "";
    });
};

/**
 * Checks if base fields are incomplete
 */
export const hasIncompleteBaseFields = (
  metadata: MetadataState,
  baseFields: Record<string, any>
): boolean => {
  return Object.entries(baseFields)
    .filter(([_, fieldProps]: [string, any]) => fieldProps.required)
    .some(([fieldName]) => 
      metadata[fieldName] === undefined || metadata[fieldName] === "");
};

/**
 * Normalizes a tag string (trims whitespace, removes special characters)
 */
export const normalizeTag = (tag: string): string => {
  // Remove any leading/trailing whitespace and make lowercase for consistency
  return tag.trim().toLowerCase();
};

export const areRequiredFieldsFilled = (
  metadata: MetadataState,
  selectedType: MediaType | null
): boolean => {
  if (!selectedType || !selectedType.fields) {
    return true; // No fields to check, so considered filled
  }
  return !(selectedType.fields || [])
    .filter(field => field.required)
    .some(field => {
      if (field.type === 'MultiSelect') {
        return !metadata[field.name] || 
          (Array.isArray(metadata[field.name]) && metadata[field.name].length === 0);
      }
      return metadata[field.name] === undefined || metadata[field.name] === "";
    });
}; 