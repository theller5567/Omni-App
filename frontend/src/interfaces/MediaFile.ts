export interface BaseMediaMetadata {
  fileName: string;
  visibility: string;
  altText: string;
  description: string;
  tags: string[];
}

export interface BaseMediaFile {
  _id: string;
  id: string;
  title: string;
  slug: string;
  fileSize: number;
  fileExtension: string;
  modifiedDate: Date;
  location: string;
  metadata: BaseMediaMetadata;
}

export default interface MediaFile {
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
  };
}

