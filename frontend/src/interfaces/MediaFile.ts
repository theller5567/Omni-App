export interface MediaFile {
  _id: string; // MongoDB's ObjectId
  id: string; // Custom UUID
  title: string;
  location: string;
  slug: string;
  fileSize: number;
  fileExtension: string;
  modifiedDate: Date;
  metadata: {
    fileName: string;
    tags: string[];
    visibility: string;
    altText: string;
    description: string;
    [key: string]: any; // Allow additional fields
  };
}
