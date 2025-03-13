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
  };
}

export interface ProductImageFile {
  _id: string;
  id: string;
  title: string;
  slug: string;
  fileSize: number;
  fileExtension: string;
  modifiedDate: Date;
  location: string;
  metadata: {
    fileName: string;
    tags: string[];
    visibility: string;
    altText: string;
    description: string;
    companyBrand: string;
    productSKU: string;
    uploadedBy: string;
    modifiedBy: string;
    sizeRequirements: string;
  };
}