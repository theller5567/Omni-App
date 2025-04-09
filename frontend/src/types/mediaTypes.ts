// Base interfaces for media data
export interface BaseMetadata {
  fileName?: string;
  altText?: string;
  description?: string;
  visibility?: 'public' | 'private';
  tags?: string[];
}

export interface WebinarFields {
  'Webinar Title'?: string;
  'Webinar Summary'?: string;
  'Webinar CTA'?: string;
}

export interface MediaFormData {
  title?: string;
  fileName?: string;
  altText?: string;
  description?: string;
  visibility?: 'public' | 'private';
  tags?: string[];
  customFields?: WebinarFields & Record<string, any>;
}

export interface ApiMediaData {
  title?: string;
  metadata: BaseMetadata & WebinarFields & {
    [key: string]: any;
  };
}

// Type guard functions
export const isWebinarFields = (fields: any): fields is WebinarFields => {
  return (
    typeof fields === 'object' &&
    ('Webinar Title' in fields ||
    'Webinar Summary' in fields ||
    'Webinar CTA' in fields)
  );
};

// Data transformers
export const transformFormToApiData = (formData: MediaFormData): ApiMediaData => {
  return {
    title: formData.title,
    metadata: {
      fileName: formData.fileName,
      altText: formData.altText,
      description: formData.description,
      visibility: formData.visibility,
      tags: formData.tags || [],
      ...(formData.customFields || {})
    }
  };
};

export const transformApiToFormData = (apiData: ApiMediaData): MediaFormData => {
  const { title, metadata } = apiData;
  const {
    fileName,
    altText,
    description,
    visibility,
    tags,
    ...customFields
  } = metadata;

  return {
    title,
    fileName,
    altText,
    description,
    visibility,
    tags: Array.isArray(tags) ? tags : [],
    customFields
  };
};

// Structured logging utility
export const createLogger = (component: string) => ({
  formData: (stage: string, data: MediaFormData) => {
    console.log(`[${component}] ${stage}:`, {
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
  apiData: (stage: string, data: ApiMediaData) => {
    console.log(`[${component}] ${stage}:`, {
      title: data.title,
      metadata: {
        standardFields: {
          fileName: data.metadata.fileName,
          altText: data.metadata.altText,
          description: data.metadata.description,
          visibility: data.metadata.visibility,
          tags: data.metadata.tags
        },
        customFields: Object.entries(data.metadata)
          .filter(([key]) => !['fileName', 'altText', 'description', 'visibility', 'tags'].includes(key))
          .reduce((acc, [key, value]) => ({ ...acc, [key]: value }), {})
      }
    });
  },
  error: (stage: string, error: any) => {
    console.error(`[${component}] Error in ${stage}:`, {
      message: error.message,
      stack: error.stack,
      data: error.response?.data
    });
  }
}); 