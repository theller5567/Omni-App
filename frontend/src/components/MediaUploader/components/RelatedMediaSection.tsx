import React, { useState } from 'react';
import {
  Box, 
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Button,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import { MetadataState } from '../types';
import MediaPicker from '../../MediaPicker/MediaPicker';
import { BaseMediaFile } from '../../../interfaces/MediaFile';

interface RelatedMediaSectionProps {
  metadata: MetadataState;
  handleMetadataChange: (field: string, value: any) => void;
}

const RelatedMediaSection: React.FC<RelatedMediaSectionProps> = ({ 
  metadata, 
  handleMetadataChange 
}) => {
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [relationshipType, setRelationshipType] = useState('reference');
  const [note, setNote] = useState('');
  const relatedMedia = metadata.relatedMedia || [];

  // Handle selecting a media item from the picker
  const handleMediaSelect = (media: BaseMediaFile) => {
    const mediaId = media._id || media.id || '';
    if (!mediaId) return;

    // Check if this media is already related
    const alreadyExists = relatedMedia.some(item => item.mediaId === mediaId);
    if (alreadyExists) return;

    // Create the new related media item
    const newRelatedMedia = [
      ...relatedMedia,
      {
        mediaId,
        relationship: relationshipType,
        note: note.trim() || undefined,
        // Add display info for the UI (these won't be saved in the actual metadata)
        _display: {
          title: media.metadata?.fileName || media.title || 'Untitled',
          thumbnail: media.metadata?.v_thumbnail || media.location
        }
      }
    ];

    // Update the metadata
    handleMetadataChange('relatedMedia', newRelatedMedia);
    
    // Reset the form fields
    setRelationshipType('reference');
    setNote('');
  };

  // Handle removing a related media item
  const handleRemoveRelatedMedia = (index: number) => {
    const newRelatedMedia = [...relatedMedia];
    newRelatedMedia.splice(index, 1);
    handleMetadataChange('relatedMedia', newRelatedMedia);
  };

  return (
    <Box sx={{ mt: 2 }}>
      <Typography variant="subtitle1" gutterBottom>
        Related Media
      </Typography>
      
      <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-start', mb: 2 }}>
        <FormControl sx={{ minWidth: 150 }}>
          <InputLabel id="relationship-type-label">Relationship</InputLabel>
          <Select
            labelId="relationship-type-label"
            value={relationshipType}
            label="Relationship"
            size="small"
            onChange={(e) => setRelationshipType(e.target.value)}
          >
            <MenuItem value="reference">Reference</MenuItem>
            <MenuItem value="version">Version</MenuItem>
            <MenuItem value="attachment">Attachment</MenuItem>
            <MenuItem value="parent">Parent</MenuItem>
            <MenuItem value="child">Child</MenuItem>
          </Select>
        </FormControl>
        
        <TextField
          label="Note (optional)"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          size="small"
          sx={{ flexGrow: 1 }}
        />
        
        <Button 
          variant="outlined" 
          startIcon={<AddIcon />}
          onClick={() => setIsPickerOpen(true)}
        >
          Add Media
        </Button>
      </Box>
      
      {/* List of related media */}
      {relatedMedia.length > 0 ? (
        <List dense sx={{ bgcolor: 'background.paper', borderRadius: 1, mb: 2 }}>
          {relatedMedia.map((item, index) => (
            <ListItem key={item.mediaId} divider={index < relatedMedia.length - 1}>
              <ListItemText
                primary={item._display?.title || `Media ID: ${item.mediaId}`}
                secondary={
                  <>
                    <Typography component="span" variant="body2" color="text.secondary">
                      {item.relationship}
                    </Typography>
                    {item.note && (
                      <Typography component="span" variant="body2" color="text.secondary" sx={{ ml: 1 }}>
                        - {item.note}
                      </Typography>
                    )}
                  </>
                }
              />
              <ListItemSecondaryAction>
                <IconButton 
                  edge="end" 
                  aria-label="delete"
                  onClick={() => handleRemoveRelatedMedia(index)}
                >
                  <DeleteIcon />
                </IconButton>
              </ListItemSecondaryAction>
            </ListItem>
          ))}
        </List>
      ) : (
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          No related media added yet.
        </Typography>
      )}
      
      {/* Media picker */}
      <MediaPicker
        open={isPickerOpen}
        onClose={() => setIsPickerOpen(false)}
        onSelect={handleMediaSelect}
        title="Select Related Media"
        excludeIds={[
          // Exclude the current media item (if it has an ID)
          ...(metadata.mediaId ? [metadata.mediaId] : []),
          // Also exclude already related media
          ...relatedMedia.map(item => item.mediaId)
        ]}
      />
    </Box>
  );
};

export default RelatedMediaSection; 