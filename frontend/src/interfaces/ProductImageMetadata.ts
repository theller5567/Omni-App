import { BaseMediaMetadata } from './MediaFile';

export interface ProductImageMetadata extends BaseMediaMetadata {
  companyBrand: string;
  productSKU: string;
  uploadedBy: string;
  modifiedBy: string;
  sizeRequirements: string;
} 