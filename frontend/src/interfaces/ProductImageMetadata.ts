import { BaseMediaFile } from './MediaFile';

export interface ProductImageMetadata extends BaseMediaFile {
  companyBrand: string;
  productSKU: string;
  uploadedBy: string;
  modifiedBy: string;
  sizeRequirements: string;
} 