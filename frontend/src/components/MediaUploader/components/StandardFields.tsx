import React from "react";
import {
  Box,
  Typography,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  InputAdornment,
  Chip,
  SelectChangeEvent
} from "@mui/material";
import Autocomplete from "@mui/material/Autocomplete";
import FilterListIcon from "@mui/icons-material/FilterList";
import SearchIcon from "@mui/icons-material/Search";
import FieldLabel from "./FieldLabel";
import { MetadataState } from "../types";
import { useTags, Tag } from "../../../hooks/query-hooks";
import { useUserProfile } from "../../../hooks/query-hooks";
import { TagCategory } from "../../../hooks/query-hooks";

interface StandardFieldsProps {
  metadata: MetadataState;
  handleMetadataChange: (field: string, value: unknown) => void;
  showTagFilter: boolean;
  setShowTagFilter: React.Dispatch<React.SetStateAction<boolean>>;
  tagCategories: TagCategory[];
  getAvailableTags: () => string[];
  handleTagsChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  handleTagsBlur: () => void;
  handleTagsKeyDown: (event: React.KeyboardEvent<HTMLInputElement>) => void;
  handleTagCategoryChange: (event: SelectChangeEvent) => void;
  handleTagSearch: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

const StandardFields: React.FC<StandardFieldsProps> = ({
  metadata,
  handleMetadataChange,
  showTagFilter,
  setShowTagFilter,
  tagCategories,
  getAvailableTags,
  handleTagsChange,
  handleTagsBlur,
  handleTagsKeyDown,
  handleTagCategoryChange,
  handleTagSearch
}) => {
  // Load existing tags for selection
  const { data: userProfile } = useUserProfile();
  const { data: allTags = [] } = useTags(userProfile);
  const tagOptions = React.useMemo(() => allTags.map((t: Tag) => t.name), [allTags]);
  return (
    <Box className="standard-fields-container" sx={{ 
      display: 'grid', 
      gridTemplateColumns: 'repeat(12, 1fr)',
      gap: 2.5,
      height: '100%',
      overflow: 'auto',
      width: '100%'
    }}>
      <Box sx={{ gridColumn: 'span 12' }}>
        <FieldLabel 
          name="File Name" 
          required={true} 
          isValid={metadata.fileName ? true : false}
        />
        <TextField
          fullWidth
          value={metadata.fileName || ""}
          onChange={(e) => handleMetadataChange("fileName", e.target.value)}
          margin="none"
          variant="outlined"
          size="small"
          InputProps={{
            sx: { bgcolor: 'background.paper', borderRadius: 1 }
          }}
        />
      </Box>

      <Box sx={{ gridColumn: {xs: 'span 12', sm: 'span 6'} }}>
        <FieldLabel 
          name="Alt Text" 
          required={false} 
          isValid={null}
        />
        <TextField
          fullWidth
          value={metadata.altText || ""}
          onChange={(e) => handleMetadataChange("altText", e.target.value)}
          margin="none"
          variant="outlined"
          size="small"
          InputProps={{
            sx: { bgcolor: 'background.paper', borderRadius: 1 }
          }}
        />
      </Box>

      <Box sx={{ gridColumn: {xs: 'span 12', sm: 'span 6'} }}>
        <FieldLabel 
          name="Visibility" 
          required={false} 
          isValid={null}
        />
        <FormControl fullWidth size="small">
          <Select
            value={metadata.visibility || "public"}
            onChange={(e) => handleMetadataChange("visibility", e.target.value)}
            sx={{ bgcolor: 'background.paper', borderRadius: 1 }}
          >
            <MenuItem value="public">Public</MenuItem>
            <MenuItem value="private">Private</MenuItem>
            <MenuItem value="restricted">Restricted</MenuItem>
          </Select>
        </FormControl>
      </Box>

      <Box sx={{ gridColumn: 'span 12' }}>
        <FieldLabel 
          name="Description" 
          required={false} 
          isValid={null}
        />
        <TextField
          fullWidth
          multiline
          rows={3}
          value={metadata.description || ""}
          onChange={(e) => handleMetadataChange("description", e.target.value)}
          margin="none"
          variant="outlined"
          size="small"
          InputProps={{
            sx: { bgcolor: 'background.paper', borderRadius: 1 }
          }}
        />
      </Box>
      
      <Box sx={{ gridColumn: 'span 12' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
          <FieldLabel 
            name="Tags (comma-separated)" 
            required={false} 
            isValid={null}
          />
          <Button 
            onClick={() => setShowTagFilter(!showTagFilter)} 
            startIcon={<FilterListIcon />}
            size="small"
            variant="text"
            sx={{ minWidth: 0, p: '2px 8px' }}
          >
            Filter
          </Button>
        </Box>
        
        {showTagFilter && (
          <Box sx={{ mb: 1 }}>
            <FormControl fullWidth size="small" sx={{ mb: 0.5 }}>
              <InputLabel id="tag-category-select-label">Tag Category</InputLabel>
              <Select
                labelId="tag-category-select-label"
                id="tag-category-select"
                value={metadata.selectedTagCategoryId || ''}
                onChange={handleTagCategoryChange}
                label="Tag Category"
                sx={{ bgcolor: 'background.paper', borderRadius: 1 }}
              >
                <MenuItem value="">
                  <em>All Tags</em>
                </MenuItem>
                {tagCategories.map((category) => (
                  <MenuItem key={category._id} value={category._id}>
                    {category.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            
            <TextField
              fullWidth
              placeholder="Search tags..."
              size="small"
              value={metadata.tagSearchQuery || ""}
              onChange={handleTagSearch}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon fontSize="small" />
                  </InputAdornment>
                ),
                sx: { bgcolor: 'background.paper', borderRadius: 1 }
              }}
            />
          </Box>
        )}
        
        <Autocomplete
          multiple
          options={tagOptions}
          value={metadata.tags || []}
          onChange={(_e, newValue) => handleMetadataChange("tags", newValue)}
          filterSelectedOptions
          freeSolo
          renderTags={(value: readonly string[], getTagProps) =>
            value.map((option: string, index: number) => (
              <Chip variant="filled" label={option} {...getTagProps({ index })} key={`${option}-${index}`} />
            ))
          }
          renderInput={(params) => (
            <TextField
              {...params}
              placeholder="Add tags..."
              size="small"
              margin="none"
              variant="outlined"
              InputProps={{
                ...params.InputProps,
                sx: { bgcolor: 'background.paper', borderRadius: 1 }
              }}
            />
          )}
        />
        
        {showTagFilter && getAvailableTags().length > 0 && (
          <Box sx={{ mt: 0.5, display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
            {getAvailableTags().slice(0, 10).map((tag) => (
              <Chip
                key={tag}
                label={tag}
                className="tag-chip"
                size="small"
                onClick={() => {
                  // Add tag to the metadata tags array if not already there
                  if (!metadata.tags.includes(tag)) {
                    handleMetadataChange("tags", [...metadata.tags, tag]);
                  }
                }}
                sx={{ 
                  bgcolor: 'var(--accent-color)',
                  '&:hover': {
                    bgcolor: 'var(--accent-color)',
                  } 
                }}
              />
            ))}
            {getAvailableTags().length > 10 && (
              <Typography variant="caption" sx={{ alignSelf: 'center', ml: 1, color: 'text.secondary' }}>
                +{getAvailableTags().length - 10} more
              </Typography>
            )}
          </Box>
        )}
        
        {metadata.tags && metadata.tags.length > 0 && (
          <Box sx={{ mt: 2, mb: 1, display: 'flex', flexWrap: 'wrap', gap: 0.5, width: '100%', maxWidth: '100%' }}>
            {metadata.tags.map((tag) => (
              <Chip
                key={tag}
                label={tag}
                size="small"
                className="tag-chip"
                onDelete={() => {
                  const newTags = metadata.tags.filter(t => t !== tag);
                  handleMetadataChange("tags", newTags);
                }}
                sx={{ 
                  bgcolor: 'var(--accent-color)', 
                  '& .MuiChip-deleteIcon': {
                    color: 'rgba(0, 0, 0, 0.6)',
                    '&:hover': {
                      color: 'rgba(0, 0, 0, 0.8)'
                    }
                  }
                }}
              />
            ))}
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default StandardFields; 