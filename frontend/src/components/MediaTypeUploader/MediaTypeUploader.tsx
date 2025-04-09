import { getBaseFieldsForMimeType } from '../../utils/mediaTypeUtils';

interface BaseType {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
}

const [selectedBaseType, setSelectedBaseType] = useState<string>('Media');
const [includeBaseFields, setIncludeBaseFields] = useState<boolean>(true);

const baseTypes: BaseType[] = [
  { 
    id: 'BaseImage', 
    name: 'Image', 
    description: 'Base schema for all image files with common image metadata fields',
    icon: <FaImage /> 
  },
  { 
    id: 'BaseVideo', 
    name: 'Video', 
    description: 'Base schema for all video files with common video metadata fields',
    icon: <FaVideo /> 
  },
  { 
    id: 'BaseAudio', 
    name: 'Audio', 
    description: 'Base schema for all audio files with common audio metadata fields',
    icon: <FaFileAudio /> 
  },
  { 
    id: 'BaseDocument', 
    name: 'Document', 
    description: 'Base schema for all document files with common document metadata fields',
    icon: <FaFileWord /> 
  },
  { 
    id: 'Media', 
    name: 'Generic Media', 
    description: 'Basic schema without specialized fields',
    icon: <FaUpload /> 
  }
];

const renderBaseFields = () => {
  if (selectedBaseType === 'Media' || !includeBaseFields) {
    return null;
  }

  let mimeTypePrefix = '';
  switch (selectedBaseType) {
    case 'BaseImage':
      mimeTypePrefix = 'image/';
      break;
    case 'BaseVideo':
      mimeTypePrefix = 'video/';
      break;
    case 'BaseAudio':
      mimeTypePrefix = 'audio/';
      break;
    case 'BaseDocument':
      mimeTypePrefix = 'application/pdf';
      break;
    default:
      return null;
  }

  const baseFields = getBaseFieldsForMimeType(mimeTypePrefix);
  
  return (
    <Box sx={{ mb: 4, mt: 2 }}>
      <Typography variant="h6">
        Base Fields (Automatically Included)
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        These fields are included automatically for all {baseTypes.find(t => t.id === selectedBaseType)?.name} files.
      </Typography>
      <Box sx={{ 
        p: 2, 
        border: '1px dashed', 
        borderColor: 'divider',
        borderRadius: 1,
        bgcolor: 'background.paper',
        opacity: 0.8
      }}>
        {Object.entries(baseFields).map(([fieldName, fieldProps]) => (
          <Box key={fieldName} sx={{ mb: 1, display: 'flex', alignItems: 'center' }}>
            <Typography variant="body2" fontWeight="bold" sx={{ mr: 1 }}>
              {fieldName}:
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {fieldProps.type} {fieldProps.required ? '(Required)' : '(Optional)'}
            </Typography>
          </Box>
        ))}
      </Box>
    </Box>
  );
};

const renderBaseTypeSelector = () => {
  return (
    <Box sx={{ mb: 4 }}>
      <Typography variant="h6" gutterBottom>
        Select Base Type
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Choose the base schema that provides standard fields for this media type.
      </Typography>
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
        {baseTypes.map((type) => (
          <Box
            key={type.id}
            onClick={() => setSelectedBaseType(type.id)}
            sx={{
              p: 2,
              border: '1px solid',
              borderColor: selectedBaseType === type.id ? 'primary.main' : 'divider',
              borderRadius: 1,
              cursor: 'pointer',
              width: '180px',
              bgcolor: selectedBaseType === type.id ? 'action.selected' : 'background.paper',
              transition: 'all 0.2s',
              '&:hover': {
                bgcolor: 'action.hover',
                borderColor: 'primary.light',
              },
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
            }}
          >
            <Box sx={{ fontSize: '2rem', mb: 1, color: 'primary.main' }}>
              {type.icon}
            </Box>
            <Typography variant="subtitle1" fontWeight="bold">
              {type.name}
            </Typography>
            <Typography variant="body2" color="text.secondary" align="center" sx={{ mt: 1 }}>
              {type.description}
            </Typography>
          </Box>
        ))}
      </Box>
      <Box sx={{ mt: 2 }}>
        <FormControlLabel
          control={
            <Checkbox
              checked={includeBaseFields}
              onChange={(e) => setIncludeBaseFields(e.target.checked)}
            />
          }
          label="Include base schema fields automatically"
        />
      </Box>
      {renderBaseFields()}
    </Box>
  );
};

const saveMediaTypeToBackend = async (mediaType: Omit<MediaType, '_id'>) => {
  const mediaTypeData = {
    ...mediaType,
    baseType: selectedBaseType,
    includeBaseFields: includeBaseFields
  };

  // ... continue with the existing code ...
};

{activeStep === 0 && (
  <Box>
    <TextField
      label="Media Type Name"
      value={mediaTypeName}
      onChange={(e) => setMediaTypeName(e.target.value)}
      variant="outlined"
      fullWidth
      required
      margin="normal"
    />
    {renderBaseTypeSelector()}
  </Box>
)} 