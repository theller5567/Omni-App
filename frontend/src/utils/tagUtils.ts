/**
 * Utility functions for tag handling across the application
 */

/**
 * Normalizes tags for storage by preserving spaces and capitalization,
 * but trimming excess whitespace
 * 
 * @param tag - The tag string to normalize
 * @returns The normalized tag string
 */
export const normalizeTag = (tag: string): string => {
  return tag.trim();
};

/**
 * Normalizes a tag for comparison purposes (used for duplicate checking)
 * Converts to lowercase and trims whitespace
 * 
 * @param tag - The tag string to normalize for comparison
 * @returns The comparison-ready tag string
 */
export const normalizeTagForComparison = (tag: string): string => {
  return tag.trim().toLowerCase();
};

/**
 * Normalizes an array of tags
 * 
 * @param tags - Array of tag strings to normalize
 * @returns Array of normalized tag strings with duplicates removed (case-insensitive)
 */
export const normalizeTags = (tags: string[]): string[] => {
  // Use a map to track normalized versions while preserving the original capitalization
  const uniqueTags: Map<string, string> = new Map();
  
  // For each tag, use lowercase version as key but keep original as value
  tags.forEach(tag => {
    const normalized = normalizeTag(tag);
    const normalizedForComparison = normalizeTagForComparison(normalized);
    
    // Only add if we don't already have this tag (case-insensitive)
    if (!uniqueTags.has(normalizedForComparison)) {
      uniqueTags.set(normalizedForComparison, normalized);
    }
  });
  
  // Return only the values (original case preserved tags)
  return Array.from(uniqueTags.values());
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
 * - No special characters except hyphens, underscores, and spaces
 * 
 * @param tag - The tag string to validate
 * @returns An object containing validation result and error message
 */
export const validateTag = (tag: string): { valid: boolean; message?: string } => {
  if (!tag || tag.trim() === '') {
    return { valid: false, message: 'Tag cannot be empty' };
  }
  
  // Check for invalid characters (allow letters, numbers, hyphens, underscores, and spaces)
  if (!/^[a-zA-Z0-9_\- ]+$/.test(tag)) {
    return { 
      valid: false, 
      message: 'Tag can only contain letters, numbers, hyphens, underscores, and spaces' 
    };
  }
  
  return { valid: true };
};

/**
 * Checks if two tags are considered the same (case-insensitive comparison)
 * 
 * @param tag1 - First tag to compare
 * @param tag2 - Second tag to compare
 * @returns True if tags are considered equivalent
 */
export const areTagsEquivalent = (tag1: string, tag2: string): boolean => {
  return normalizeTagForComparison(tag1) === normalizeTagForComparison(tag2);
}; 