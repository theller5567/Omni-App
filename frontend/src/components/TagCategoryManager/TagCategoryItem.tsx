import React from 'react';
import {
  ListItem,
  ListItemText,
  Typography,
  Box,
  IconButton,
  Chip,
  Divider
} from '@mui/material';
import { FaEdit, FaTrash, FaTag } from 'react-icons/fa';
import { TagCategory } from '../../store/slices/tagCategorySlice';

interface TagCategoryItemProps {
  category: TagCategory;
  index: number;
  totalCount: number;
  onEdit: () => void;
  onDelete: () => void;
}

export const TagCategoryItem: React.FC<TagCategoryItemProps> = ({
  category,
  index,
  totalCount,
  onEdit,
  onDelete
}) => {
  return (
    <React.Fragment>
      {index > 0 && <Divider />}
      <ListItem
        secondaryAction={
          <Box>
            <IconButton onClick={onEdit} size="small">
              <FaEdit />
            </IconButton>
            <IconButton 
              onClick={onDelete} 
              size="small" 
              color="error"
              sx={{ ml: 1 }}
            >
              <FaTrash />
            </IconButton>
          </Box>
        }
      >
        <ListItemText
          primary={
            <Typography variant="subtitle1" fontWeight="medium">
              {category.name}
            </Typography>
          }
          secondary={
            <>
              {category.description && (
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }} component="span">
                  {category.description}
                </Typography>
              )}
              <Typography component="div" variant="body2" sx={{ mt: 1 }}>
                {category.tags && category.tags.length > 0 ? (
                  <Box display="flex" flexWrap="wrap" gap={0.5}>
                    {category.tags.map(tag => (
                      <Chip 
                        key={tag.id}
                        label={tag.name}
                        size="small"
                        icon={<FaTag />}
                      />
                    ))}
                  </Box>
                ) : (
                  <Typography variant="body2" color="text.secondary" fontStyle="italic" component="span">
                    No tags assigned
                  </Typography>
                )}
              </Typography>
            </>
          }
          secondaryTypographyProps={{ component: 'div' }}
        />
      </ListItem>
    </React.Fragment>
  );
}; 