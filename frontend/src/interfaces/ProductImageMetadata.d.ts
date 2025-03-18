import { MediaFile } from './MediaFile';
export interface ProductImageMetadata extends MediaFile {
    companyBrand: string;
    productSKU: string;
    uploadedBy: string;
    modifiedBy: string;
    sizeRequirements: string;
}
