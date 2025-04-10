import React from 'react';
import {
  Card,
  CardContent,
  CardActions,
  Typography,
  Box,
  Chip,
  Button
} from '@mui/material';
import { FaEye, FaEdit, FaTrash } from 'react-icons/fa';

interface MediaTypeCardProps {
  mediaType: any; // Using any to avoid complex typing issues
  onDelete: (id: string) => void;
  onEdit?: (id: string) => void;
  onView?: (id: string) => void;
}

const MediaTypeCard: React.FC<MediaTypeCardProps> = ({ 
  mediaType, 
  onDelete,
  onEdit,
  onView
}) => {
  return (
    <Card className={`media-type-card ${mediaType.status && mediaType.status !== 'active' ? 'media-type-card--' + mediaType.status : ''}`}>
      {mediaType.catColor && (
        <span className="media-type-color" style={{ 
          backgroundColor: mediaType.catColor, 
          boxShadow: `0 0 5px 0 ${mediaType.catColor}` 
        }}></span>
      )}
      
      {mediaType.status && mediaType.status !== 'active' && (
        <div className="media-type-status">
          <Chip 
            label={(mediaType.status || 'active').toUpperCase()} 
            color={mediaType.status === 'deprecated' ? 'warning' : 'error'}
            size="small"
          />
        </div>
      )}
      
      <CardContent>
        <Typography variant="h6" className="media-type-title">
          {mediaType.name}
        </Typography>

        <Box className="field-count-chip">
          <Chip
            label={`${mediaType.fields.length} field${
              mediaType.fields.length !== 1 ? "s" : ""
            }`}
            color="primary"
            size="small"
          />
          <Chip
            label={`${mediaType.usageCount} media file${
              mediaType.usageCount !== 1 ? "s" : ""
            }`}
            color={mediaType.usageCount > 0 ? "secondary" : "default"}
            variant={mediaType.usageCount > 0 ? "filled" : "outlined"}
            size="small"
            sx={{ ml: 1 }}
          />
        </Box>

        <Box className="field-type-chips" sx={{ mt: 1 }}>
          {Array.from(
            new Set(mediaType.fields.map((field: any) => field.type))
          ).map((type: any, idx: number) => (
            <Chip
              key={idx}
              label={type}
              variant="outlined"
              size="small"
              sx={{ mr: 0.5, mb: 0.5 }}
            />
          ))}
        </Box>

        <Box className="fields-preview" sx={{ mt: 2 }}>
          {mediaType.fields
            .slice(0, 3)
            .map((field: any, fieldIndex: number) => (
              <Box key={fieldIndex} sx={{ mb: 1 }}>
                <Typography
                  variant="body2"
                  component="div"
                  className="field-name"
                >
                  {field.name}{" "}
                  {field.required && (
                    <span className="required-badge">*</span>
                  )}
                  <span className="field-type">({field.type})</span>
                </Typography>
                {field.options && field.options.length > 0 && (
                  <Typography
                    variant="caption"
                    className="field-options"
                  >
                    Options: {field.options.slice(0, 3).join(", ")}
                    {field.options.length > 3 && "..."}
                  </Typography>
                )}
              </Box>
            ))}
          {mediaType.fields.length > 3 && (
            <Typography variant="caption" color="text.secondary">
              + {mediaType.fields.length - 3} more field
              {mediaType.fields.length - 3 !== 1 ? "s" : ""}
            </Typography>
          )}
        </Box>
      </CardContent>
      
      <CardActions className="card-actions">
        <Button 
          size="small" 
          startIcon={<FaEye />}
          onClick={() => onView && onView(mediaType._id)}
        >
          View
        </Button>
        <Button 
          size="small" 
          startIcon={<FaEdit />}
          disabled={mediaType.status === 'archived'}
          onClick={() => onEdit && onEdit(mediaType._id)}
        >
          Edit
        </Button>
        <Button 
          size="small" 
          color="error" 
          startIcon={<FaTrash />}
          onClick={() => onDelete(mediaType._id)}
          disabled={mediaType.status === 'archived'}
        >
          {mediaType.status === 'deprecated' ? 'Archive' : 'Delete'}
        </Button>
      </CardActions>
    </Card>
  );
};

export default MediaTypeCard; 