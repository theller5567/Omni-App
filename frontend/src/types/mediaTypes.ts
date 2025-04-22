// Base interfaces for media data
export interface BaseMetadata {
  fileName: string;
  altText?: string;
  description?: string;
  visibility: 'public' | 'private';
  tags: string[];
}

// Field type definitions
export type FieldType = 'Text' | 'TextArea' | 'Number' | 'Date' | 'Boolean' | 'Select' | 'MultiSelect';
export type NonSelectFieldType = Exclude<FieldType, 'Select' | 'MultiSelect'>;
export type SelectFieldType = Extract<FieldType, 'Select' | 'MultiSelect'>;

export interface BaseField {
  name: string;
  type: NonSelectFieldType;
  required: boolean;
  label?: string;
}

export interface SelectField {
  name: string;
  type: SelectFieldType;
  required: boolean;
  label?: string;
  options: string[];
  useTagCategory?: boolean;
  tagCategoryId?: string;
}

export type MediaTypeField = BaseField | SelectField;

// Media type configuration
export interface MediaTypeConfig {
  name: string;
  fields: MediaTypeField[];
  baseType?: string;
  includeBaseFields?: boolean;
  acceptedFileTypes: string[];
  status?: 'active' | 'deprecated' | 'archived';
  catColor?: string;
  defaultTags?: string[];
  _id?: string;
}

// Store types
export interface MediaTypeState extends MediaTypeConfig {
  _id: string;
  usageCount: number;
  replacedBy: string | null;
  isDeleting: boolean;
}

// Form data interfaces
export interface MediaFormData {
  title: string;
  fileName: string;
  altText?: string;
  description?: string;
  visibility: 'public' | 'private';
  tags: string[];
  customFields: Record<string, any>;
}

// API data interfaces
export interface ApiMediaTypeRequest {
  name: string;
  fields: MediaTypeField[];
  baseType?: 'BaseImage' | 'BaseVideo' | 'BaseAudio' | 'BaseDocument' | 'Media';
  includeBaseFields: boolean;
  acceptedFileTypes: string[];
  status: 'active' | 'deprecated' | 'archived';
  defaultTags?: string[];
}

export interface ApiMediaTypeResponse {
  _id: string;
  name: string;
  fields: MediaTypeField[];
  status: 'active' | 'deprecated' | 'archived';
  acceptedFileTypes: string[];
  baseType?: 'BaseImage' | 'BaseVideo' | 'BaseAudio' | 'BaseDocument' | 'Media';
  includeBaseFields?: boolean;
  catColor?: string;
  defaultTags?: string[];
}

export interface ApiMediaData {
  title: string;
  metadata: {
    fileName: string;
    altText?: string;
    description?: string;
    visibility: 'public' | 'private';
    tags: string[];
    [key: string]: any;
  };
}

// Type guards
export const isSelectField = (field: MediaTypeField): field is SelectField => {
  return field.type === 'Select' || field.type === 'MultiSelect';
};

export const isSelectFieldType = (type: FieldType): type is SelectFieldType => {
  return type === 'Select' || type === 'MultiSelect';
};

// Field update utilities
export const updateFieldType = (field: MediaTypeField, newType: FieldType): MediaTypeField => {
  const baseField = {
    name: field.name,
    type: newType,
    required: field.required,
    label: field.label
  };

  if (isSelectFieldType(newType)) {
    return {
      ...baseField,
      type: newType,
      options: isSelectField(field) ? field.options : []
    } as SelectField;
  }

  return baseField as BaseField;
};

export const updateFieldName = (field: MediaTypeField, name: string): MediaTypeField => {
  return { ...field, name };
};

export const updateFieldRequired = (field: MediaTypeField, required: boolean): MediaTypeField => {
  return { ...field, required };
};

export const updateFieldOptions = (field: SelectField, options: string[]): SelectField => {
  return { ...field, options };
};

// Transform functions
export const transformFormToApiData = (formData: MediaFormData): ApiMediaData => {
  return {
    title: formData.title,
    metadata: {
      fileName: formData.fileName,
      altText: formData.altText,
      description: formData.description,
      visibility: formData.visibility,
      tags: formData.tags,
      ...formData.customFields
    }
  };
};

export const transformConfigToApiData = (config: MediaTypeConfig): ApiMediaTypeRequest => {
  const { name, fields, baseType, includeBaseFields, acceptedFileTypes, status, defaultTags } = config;
  return {
    name,
    fields,
    baseType: baseType as 'BaseImage' | 'BaseVideo' | 'BaseAudio' | 'BaseDocument' | 'Media' | undefined,
    includeBaseFields: includeBaseFields ?? true,
    acceptedFileTypes,
    status: status ?? 'active',
    defaultTags
  };
};

// Utility functions
export const createField = (type: FieldType, name: string = '', required: boolean = false): MediaTypeField => {
  if (isSelectFieldType(type)) {
    return {
      name,
      type,
      required,
      options: []
    };
  }
  return {
    name,
    type,
    required
  };
};

// Logging utilities
export const createLogger = (component: string) => ({
  formData: (action: string, data: MediaFormData) => {
    console.log(`[${component}] ${action}:`, {
      standardFields: {
        title: data.title,
        fileName: data.fileName,
        altText: data.altText,
        description: data.description,
        visibility: data.visibility,
        tags: data.tags
      },
      customFields: data.customFields
    });
  },
  
  apiData: (action: string, data: ApiMediaTypeRequest | ApiMediaData) => {
    console.log(`[${component}] ${action}:`, data);
  },
  
  error: (action: string, error: any) => {
    console.error(`[${component}] Error in ${action}:`, {
      message: error.message,
      code: error.code,
      details: error.response?.data
    });
  }
}); 