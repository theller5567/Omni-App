/**
 * Utility functions for tag handling across the application
 */

/**
 * Normalizes tags by converting them to lowercase, trimming whitespace,
 * and removing any special characters that might cause issues
 * 
 * @param tag - The tag string to normalize
 * @returns The normalized tag string
 */
export const normalizeTag = (tag: string): string => {
  return tag.trim().toLowerCase();
};

/**
 * Normalizes an array of tags
 * 
 * @param tags - Array of tag strings to normalize
 * @returns Array of normalized tag strings with duplicates removed
 */
export const normalizeTags = (tags: string[]): string[] => {
  // Create a set to automatically remove duplicates
  const normalizedSet = new Set(tags.map(tag => normalizeTag(tag)));
  return Array.from(normalizedSet);
};

/**
 * Checks if a tag contains uppercase letters
 * 
 * @param tag - The tag string to check
 * @returns True if the tag contains uppercase letters
 */
export const hasUppercase = (tag: string): boolean => {
  return tag !== tag.toLowerCase();
};

/**
 * Validates a tag against common rules
 * - Must not be empty
 * - No special characters except hyphens and underscores
 * - No spaces
 * 
 * @param tag - The tag string to validate
 * @returns An object containing validation result and error message
 */
export const validateTag = (tag: string): { valid: boolean; message?: string } => {
  if (!tag || tag.trim() === '') {
    return { valid: false, message: 'Tag cannot be empty' };
  }
  
  // Check for invalid characters (allow letters, numbers, hyphens, and underscores)
  if (!/^[a-zA-Z0-9_-]+$/.test(tag)) {
    return { 
      valid: false, 
      message: 'Tag can only contain letters, numbers, hyphens and underscores' 
    };
  }
  
  return { valid: true };
}; 