export interface BaseMediaFile {
  _id?: string; // MongoDB's ObjectId
  id?: string; // Custom UUID
  title?: string;
  location: string; // Keep required as it's essential for displaying media
  slug: string; // Keep required as it's used for routing
  fileSize?: number;
  fileExtension?: string;
  modifiedDate: string; // Changed from Date to string
  uploadedBy?: string;
  modifiedBy?: string;
  mediaType?: string;
  __t?: string;
  metadata?: {
    fileName?: string;
    tags?: string[];
    visibility?: string;
    altText?: string;
    description?: string;
    mediaType?: string;
    [key: string]: any; // Allow additional fields
  };
}
