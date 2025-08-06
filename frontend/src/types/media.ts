export interface MediaFile {
  id?: string;
  _id?: string; // MongoDB document ID
  title: string;
  fileName: string;
  visibility: 'public' | 'private';
  altText?: string;
  description?: string;
  tags: string[];
  customFields: Record<string, unknown>;
  fileType?: string;
  fileSize?: number;
  uploadDate?: string;
  lastModified?: string;
  url?: string;
  slug?: string; // URL slug
}

export interface MediaTypeField {
  name: string;
  label?: string;
  type: string;
  required?: boolean;
  options?: string[];
  defaultValue?: unknown;
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