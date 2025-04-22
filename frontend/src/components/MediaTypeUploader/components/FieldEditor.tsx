import React, { useState, useEffect } from 'react';
import { 
  TextField, 
  Select, 
  MenuItem, 
  FormControlLabel, 
  Checkbox, 
  IconButton,
  FormControl,
  InputLabel,
  Switch,
  Typography,
  Box,
  Chip,
  Divider,
  Alert,
  SelectChangeEvent
} from '@mui/material';
import { FaPlus, FaCheck, FaTimes, FaStar, FaTags, FaEdit } from 'react-icons/fa';
import { 
  MediaTypeField, 
  FieldType, 
  SelectField 
} from '../../../types/mediaTypes';
import { 
  isSelectField, 
  createField, 
  updateFieldOptions 
} from '../../../utils/mediaTypeUploaderUtils';
import { useSelector } from 'react-redux';
import { RootState } from '../../../store/store';

interface FieldEditorProps {
  field: MediaTypeField;
  index: number | null;
  isEditing: boolean;
  activeField: number | null;
  inputOptions: string[];
  onSave: (field: MediaTypeField, index: number | null) => void;
  onCancel: () => void;
  onFieldUpdate: (field: MediaTypeField) => void;
  onFieldSelect: (index: number) => void;
  onEdit: (index: number) => void;
  onRemove: (index: number) => void;
}

const FieldEditor: React.FC<FieldEditorProps> = ({
  field,
  index,
  isEditing,
  activeField,
  inputOptions,
  onSave,
  onCancel,
  onFieldUpdate,
  onFieldSelect,
  onEdit,
  onRemove
}) => {
  const [optionInput, setOptionInput] = useState('');
  const tagCategories = useSelector((state: RootState) => state.tagCategories.tagCategories);

  // Effect to update options when tag category changes
  useEffect(() => {
    if (isSelectField(field) && field.useTagCategory && field.tagCategoryId) {
      const selectedCategory = tagCategories.find(cat => cat._id === field.tagCategoryId);
      if (selectedCategory && selectedCategory.tags) {
        // Update field options with tags from the selected category
        const tagOptions = selectedCategory.tags.map(tag => tag.name);
        onFieldUpdate(updateFieldOptions(field as SelectField, tagOptions, true, field.tagCategoryId));
      }
    }
  }, [isSelectField(field) && field.tagCategoryId]);

  // For handling select field options
  const handleAddOption = () => {
    if (!optionInput.trim() || !isSelectField(field)) return;
    
    const newOptions = [...field.options, optionInput.trim()];
    onFieldUpdate(updateFieldOptions(field as SelectField, newOptions, field.useTagCategory, field.tagCategoryId));
    setOptionInput('');
  };

  const handleRemoveOption = (optIndex: number) => {
    if (!isSelectField(field)) return;
    
    const newOptions = field.options.filter((_, i) => i !== optIndex);
    onFieldUpdate(updateFieldOptions(field as SelectField, newOptions, field.useTagCategory, field.tagCategoryId));
  };

  const handleUseTagCategoryChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!isSelectField(field)) return;
    
    const useTagCategory = event.target.checked;
    if (useTagCategory) {
      onFieldUpdate(updateFieldOptions(field as SelectField, [], useTagCategory, ''));
    } else {
      // Clear the tag category reference and options when disabling
      onFieldUpdate(updateFieldOptions(field as SelectField, [], useTagCategory, ''));
    }
  };

  const handleTagCategoryChange = (event: SelectChangeEvent<string>) => {
    if (!isSelectField(field)) return;
    
    const tagCategoryId = event.target.value;
    const selectedCategory = tagCategories.find(cat => cat._id === tagCategoryId);
    
    if (selectedCategory && selectedCategory.tags) {
      // Update field options with tags from the selected category
      const tagOptions = selectedCategory.tags.map(tag => tag.name);
      onFieldUpdate(updateFieldOptions(field as SelectField, tagOptions, true, tagCategoryId));
    } else {
      onFieldUpdate(updateFieldOptions(field as SelectField, [], true, tagCategoryId));
    }
  };

  // Render edit mode
  if (isEditing) {
    return (
      <div 
        key={index} 
        className={`new-input-field-container ${activeField === index ? 'active' : ''}`}
      >
        <div className="input-row">
          <div className="field-group">
            <Select
              value={field.type}
              onChange={(e) => {
                const newType = e.target.value as FieldType;
                const newField = createField(newType, field.name, field.required);
                onFieldUpdate(newField);
              }}
              fullWidth
              displayEmpty
              className="input-field select-input"
            >
              {inputOptions.map((option) => (
                <MenuItem key={option} value={option}>
                  {option}
                </MenuItem>
              ))}
            </Select>
          
            <TextField
              label="Field Name"
              value={field.name}
              onChange={(e) => {
                onFieldUpdate({ ...field, name: e.target.value });
              }}
              fullWidth
              className="input-field text-input"
            />
          </div>
          
          <FormControlLabel
            label='Required'
            className='required-checkbox'
            control={
              <Checkbox 
                checked={field.required}
                onChange={(e) => {
                  onFieldUpdate({ ...field, required: e.target.checked });
                }}
              />
            }
          />
          
          <div className="button-wrapper">
            
            <IconButton 
              onClick={onCancel}
              color="error"
              size="small"
              className="remove-button"
              title="Cancel editing"
            >
              <FaTimes />
            </IconButton>
            <IconButton 
              onClick={() => onSave(field, index)}
              color="primary"
              size="small"
              className="add-button"
              title="Save changes"
            >
              <FaCheck />
            </IconButton>
          </div>
        </div>
        
        {isSelectField(field) && (
          <div className="options-container">
            <div className="options-header">
              <span className="title">Define Options</span>
            </div>
            
            {/* Tag Category Selector */}
            <Box sx={{ mb: 2, mt: 1 }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={field.useTagCategory || false}
                    onChange={handleUseTagCategoryChange}
                    color="primary"
                  />
                }
                label={
                  <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center' }}>
                    <FaTags style={{ marginRight: '8px' }} />
                    Use Predefined List
                  </Typography>
                }
              />
              
              {field.useTagCategory && (
                <Box sx={{ mt: 1 }}>
                  {tagCategories.length > 0 ? (
                    <FormControl fullWidth size="small">
                      <InputLabel>Select Predefined Lists</InputLabel>
                      <Select
                        value={field.tagCategoryId || ''}
                        onChange={handleTagCategoryChange}
                        label="Select Tag Category"
                      >
                        {tagCategories.map(category => (
                          <MenuItem key={category._id} value={category._id}>
                            {category.name} ({category.tags?.length || 0} tags)
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  ) : (
                    <Alert severity="info" sx={{ mt: 1 }}>
                      No predefined lists available. Please create predefined lists first.
                    </Alert>
                  )}
                  
                  {field.tagCategoryId && field.options.length > 0 && (
                    <Box sx={{ mt: 2 }}>
                      <Typography variant="body2" fontWeight="medium">
                        Options from Predefined List:
                      </Typography>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 1 }}>
                        {field.options.map((option, i) => (
                          <Chip key={i} label={option} size="small" />
                        ))}
                      </Box>
                    </Box>
                  )}
                </Box>
              )}
            </Box>
            
            <Divider sx={{ my: 2 }} />
            
            {!field.useTagCategory && (
              <>
                <div className="add-option-container">
                  <TextField
                    label="Option Value"
                    value={optionInput}
                    onChange={(e) => setOptionInput(e.target.value)}
                    fullWidth
                    className="input-field text-input"
                  />
                  <IconButton 
                    onClick={handleAddOption} 
                    color="primary" 
                    disabled={!optionInput.trim()}
                  >
                    <FaPlus />
                  </IconButton>
                </div>
                
                {field.options.length > 0 && (
                  <div className="option-chips">
                    {field.options.map((option, optIndex) => (
                      <div key={optIndex} className="option-chip">
                        {option}
                        <span 
                          className="remove-icon" 
                          onClick={() => handleRemoveOption(optIndex)}
                        >
                          <FaTimes size={10} />
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>
    );
  }
  
  // Render display mode
  return (
    <div 
      key={index}
      className={`compact-field-item ${activeField === index ? 'active' : ''}`}
      onClick={() => index !== null && onFieldSelect(index)}
    >
      <div className="field-info">
        <span className="field-type-badge">{field.type}</span>
        <span className="field-name">{field.name}</span>
        {field.required && (
          <span className="field-required">
            <FaStar size={8} /> Required
          </span>
        )}
        {isSelectField(field) && field.useTagCategory && field.tagCategoryId && (
          <span className="field-tag-category">
            <FaTags size={8} /> Using Predefined List
          </span>
        )}
      </div>
      <div className="select-field-options">
        {isSelectField(field) && (
          <span className="field-options">
            {field.useTagCategory && field.tagCategoryId ? (
              <>From Predefined List: {tagCategories.find(cat => cat._id === field.tagCategoryId)?.name || 'Unknown'}</>
            ) : (
              <>Options: {field.options.join(', ')}</>
            )}
          </span>
        )}
      </div>
      
      <div className="field-actions">
        <div 
          className="edit-button" 
          onClick={(e) => {
            e.stopPropagation();
            if (index !== null) onEdit(index);
          }}
          title="Edit field"
        >
          <FaEdit />
        </div>
        <div 
          className="remove-button"
          onClick={(e) => {
            e.stopPropagation();
            if (index !== null) onRemove(index);
          }}
          title="Remove field"
        >
          <FaTimes />
        </div>
      </div>
    </div>
  );
};

export default FieldEditor; 