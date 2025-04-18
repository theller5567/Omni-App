export interface MediaFile {
  id?: string;
  title: string;
  fileName: string;
  visibility: 'public' | 'private';
  altText?: string;
  description?: string;
  tags: string[];
  customFields: Record<string, any>;
  fileType?: string;
  fileSize?: number;
  uploadDate?: string;
  lastModified?: string;
  url?: string;
}

export interface MediaTypeField {
  name: string;
  label?: string;
  type: string;
  required?: boolean;
  options?: string[];
  defaultValue?: any;
}

export interface MediaType {
  id: string;
  name: string;
  description?: string;
  fields: MediaTypeField[];
  acceptedFileTypes: string[];
  defaultTags?: string[];
  createdAt?: string;
  updatedAt?: string;
} 