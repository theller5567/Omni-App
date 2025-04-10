# MediaTypeUploader Component

This is a refactored version of the MediaTypeUploader component, organized into smaller, more maintainable pieces.

## Component Structure

- **MediaTypeUploader**: Main component that orchestrates all the sub-components
- **Components**:
  - **ColorPicker**: For selecting a color for the media type
  - **FieldEditor**: For editing individual fields in the media type
  - **FieldPreview**: For previewing fields in the media type
  - **FileTypeSelector**: For selecting accepted file types
  - **ReviewStep**: For reviewing the media type before saving

## Utilities

Shared utility functions have been moved to `utils/mediaTypeUploaderUtils.ts`:
- `predefinedColors`: Color options for media types
- `isSelectField`: Type guard for select fields
- `createField`: Helper for creating new fields
- `updateFieldOptions`: Helper for updating options in select fields
- `transformConfigToApiData`: Prepares data for API calls
- `isCategorySelected`: Checks if a file type category is selected
- `isCategoryPartiallySelected`: Checks if a category is partially selected

## Implementation Notes

1. The refactored component maintains all the functionality of the original
2. The styling is preserved using the existing SCSS file
3. TypeScript type definitions have been updated to support the refactored architecture
4. To use this instead of the old component:
   - Import from `../components/MediaTypeUploader` (the index file handles the correct export)

## Known Issues

1. There are still some TypeScript errors to resolve in the component:
   - Issue with dispatch and MediaTypeState type
   - Issue with null types in FieldEditor component

2. These can be addressed with additional type refinements in future updates. 