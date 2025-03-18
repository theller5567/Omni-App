import React from 'react';
import { ProductImageMetadata } from '../../interfaces/ProductImageMetadata';
interface ProductImageFieldsProps {
    metadata: ProductImageMetadata;
    handleMetadataChange: (field: keyof ProductImageMetadata, value: string) => void;
}
declare const ProductImageFields: React.FC<ProductImageFieldsProps>;
export default ProductImageFields;
