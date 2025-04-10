import React, { useState } from 'react';
import { 
  TextField, 
  Select, 
  MenuItem, 
  FormControlLabel, 
  Checkbox, 
  IconButton, 
} from '@mui/material';
import { FaPlus, FaCheck, FaTimes, FaStar } from 'react-icons/fa';
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

  // For handling select field options
  const handleAddOption = () => {
    if (!optionInput.trim() || !isSelectField(field)) return;
    
    const newOptions = [...field.options, optionInput.trim()];
    onFieldUpdate(updateFieldOptions(field as SelectField, newOptions));
    setOptionInput('');
  };

  const handleRemoveOption = (optIndex: number) => {
    if (!isSelectField(field)) return;
    
    const newOptions = field.options.filter((_, i) => i !== optIndex);
    onFieldUpdate(updateFieldOptions(field as SelectField, newOptions));
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
              className="remove-button"
              title="Cancel editing"
            >
              <FaTimes />
            </IconButton>
            <IconButton 
              onClick={() => onSave(field, index)}
              color="primary" 
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
      </div>
      <div className="select-field-options">
        {isSelectField(field) && (
          <span className="field-options">
            Options: {field.options.join(', ')}
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
          <FaTimes />
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