import React from 'react';
import {
  Card,
  CardContent,
  CardActions,
  Typography,
  Box,
  Chip,
  Button,
  Divider
} from '@mui/material';
import { FaEye, FaEdit, FaTrash, FaTags } from 'react-icons/fa';

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
    <Card 
      className={`media-type-card ${mediaType.status && mediaType.status !== 'active' ? 'media-type-card--' + mediaType.status : ''}`}
      sx={{
        backgroundColor: 'var(--secondary-color)',
        borderRadius: '8px',
        boxShadow: '0 4px 8px rgba(0, 0, 0, 0.15)',
        overflow: 'visible'
      }}
    >
      {mediaType.catColor && (
        <span className="media-type-color" style={{ 
          backgroundColor: mediaType.catColor, 
          boxShadow: `0 0 5px 0 ${mediaType.catColor}`,
          top: '12px'
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
      
      <CardContent sx={{ p: 2, pb: 1 }}>
        <Typography 
          variant="h6" 
          className="media-type-title"
          sx={{ 
            fontSize: '1.1rem', 
            mb: 1.5, 
            fontWeight: 500,
            textAlign: 'center'
          }}
        >
          {mediaType.name}
        </Typography>

        <Box 
          className="field-count-chip" 
          sx={{ 
            display: 'flex', 
            justifyContent: 'center', 
            gap: 1, 
            mb: 1.5 
          }}
        >
          <Chip
            label={`${mediaType.fields.length} field${
              mediaType.fields.length !== 1 ? "s" : ""
            }`}
            color="primary"
            size="small"
            sx={{ fontWeight: 400, fontSize: '0.75rem' }}
          />
          <Chip
            label={`${mediaType.usageCount} media file${
              mediaType.usageCount !== 1 ? "s" : ""
            }`}
            color={mediaType.usageCount > 0 ? "secondary" : "default"}
            variant={mediaType.usageCount > 0 ? "filled" : "outlined"}
            size="small"
            sx={{ fontWeight: 400, fontSize: '0.75rem' }}
          />
        </Box>

        <Box 
          className="field-type-chips" 
          sx={{ 
            display: 'flex',
            justifyContent: 'center',
            mb: 1.5
          }}
        >
          {Array.from(
            new Set(mediaType.fields.map((field: any) => field.type))
          ).slice(0, 3).map((type: any, idx: number) => (
            <Chip
              key={idx}
              label={type}
              variant="outlined"
              size="small"
              sx={{ mr: 0.5, fontSize: '0.7rem' }}
            />
          ))}
        </Box>

        <Box 
          className="fields-preview" 
          sx={{ 
            backgroundColor: 'rgba(0,0,0,0.2)',
            p: 1.5,
            borderRadius: '6px',
            mb: 1.5
          }}
        >
          {mediaType.fields
            .slice(0, 3)
            .map((field: any, fieldIndex: number) => (
              <Box 
                key={fieldIndex} 
                sx={{ 
                  mb: fieldIndex !== 2 ? 1 : 0,
                  display: 'flex',
                  justifyContent: 'space-between'
                }}
              >
                <Typography
                  variant="body2"
                  component="span"
                  className="field-name"
                  sx={{ 
                    fontSize: '0.8rem',
                    fontWeight: 500,
                    color: field.required ? 'var(--accent-color)' : 'inherit'
                  }}
                >
                  {field.name}{" "}
                  {field.required && (
                    <span className="required-badge">*</span>
                  )}
                </Typography>
                <Typography 
                  variant="caption" 
                  component="span"
                  className="field-type" 
                  sx={{ 
                    fontSize: '0.75rem',
                    opacity: 0.7,
                    fontWeight: 'normal',
                    fontStyle: 'italic'
                  }}
                >
                  ({field.type})
                </Typography>
              </Box>
            ))}
        </Box>

        {/* Default Tags Section */}
        {mediaType.defaultTags && mediaType.defaultTags.length > 0 && (
          <Box className="default-tags-section">
            <Box 
              sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                mb: 0.5,
                justifyContent: 'center'
              }}
            >
              <FaTags size={13} style={{ color: 'var(--accent-color)' }} />
              <Typography 
                variant="body2" 
                color="primary" 
                sx={{ ml: 0.5, fontSize: '0.8rem' }}
              >
                Default Tags
              </Typography>
            </Box>
            <Box 
              sx={{ 
                display: 'flex', 
                flexWrap: 'wrap', 
                gap: 0.5, 
                justifyContent: 'center' 
              }}
            >
              {mediaType.defaultTags.slice(0, 3).map((tag: string, index: number) => (
                <Chip
                  key={index}
                  label={tag}
                  size="small"
                  color="primary"
                  variant="outlined"
                  sx={{ 
                    fontSize: '0.7rem',
                    height: '20px'
                  }}
                />
              ))}
              {mediaType.defaultTags.length > 3 && (
                <Chip
                  label={`+${mediaType.defaultTags.length - 3}`}
                  size="small"
                  variant="outlined"
                  sx={{ 
                    fontSize: '0.7rem',
                    height: '20px'
                  }}
                />
              )}
            </Box>
          </Box>
        )}
      </CardContent>
      
      <CardActions 
        className="card-actions"
        sx={{ 
          p: 0, 
          mt: 0.5, 
          display: 'flex',
          justifyContent: 'space-between',
          backgroundColor: 'rgba(0,0,0,0.15)',
          borderTop: '1px solid rgba(255,255,255,0.05)'
        }}
      >
        <Button 
          size="small" 
          startIcon={<FaEye style={{ fontSize: '0.8rem' }} />}
          onClick={() => onView && onView(mediaType._id)}
          sx={{ 
            fontSize: '0.75rem', 
            py: 0.75,
            flex: 1,
            borderRadius: 0
          }}
        >
          View
        </Button>
        <Divider orientation="vertical" flexItem sx={{ m: 0 }} />
        <Button 
          size="small" 
          startIcon={<FaEdit style={{ fontSize: '0.8rem' }} />}
          disabled={mediaType.status === 'archived'}
          onClick={() => onEdit && onEdit(mediaType._id)}
          sx={{ 
            fontSize: '0.75rem', 
            py: 0.75,
            flex: 1,
            borderRadius: 0
          }}
        >
          Edit
        </Button>
        <Divider orientation="vertical" flexItem sx={{ m: 0 }} />
        <Button 
          size="small" 
          color="error" 
          startIcon={<FaTrash style={{ fontSize: '0.8rem' }} />}
          onClick={() => onDelete(mediaType._id)}
          disabled={mediaType.status === 'archived' && mediaType.usageCount != 0}
          sx={{ 
            fontSize: '0.75rem', 
            py: 0.75,
            flex: 1,
            borderRadius: 0
          }}
        >
          {mediaType.status === 'deprecated' ? 'Archive' : 'Delete'}
        </Button>
      </CardActions>
    </Card>
  );
};

export default MediaTypeCard; 