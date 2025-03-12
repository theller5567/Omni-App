import { TextField } from '@mui/material';
import { Box } from '@mui/material';
import React from 'react';
import { ProductImageMetadata } from '../../interfaces/ProductImageMetadata';

interface ProductImageFieldsProps {
  metadata: ProductImageMetadata;
  handleMetadataChange: (field: keyof ProductImageMetadata, value: string) => void;
}

const ProductImageFields: React.FC<ProductImageFieldsProps> = ({ metadata, handleMetadataChange }) => {
  return (
        <Box display="flex" flexWrap="wrap" justifyContent="space-between">
          <Box width="48%">
            <TextField
                label="Company Brand"
                required
                value={metadata.companyBrand || ''}
                onChange={(e) => handleMetadataChange('companyBrand', e.target.value)}
                fullWidth
                margin="normal"
              />
              <TextField
                label="Product SKU"
                required
                value={metadata.productSKU || ''}
                onChange={(e) => handleMetadataChange('productSKU', e.target.value)}
                fullWidth
                margin="normal"
              />
            <TextField
                label="Uploaded By"
                required
                value={metadata.uploadedBy || ''}
                onChange={(e) => handleMetadataChange('uploadedBy', e.target.value)}
                fullWidth
                margin="normal"
              />
            </Box>
            <Box width="48%">
            <TextField
                label="Modified By"
                required
                value={metadata.modifiedBy || ''}
                onChange={(e) => handleMetadataChange('modifiedBy', e.target.value)}
                fullWidth
                margin="normal"
              />
              <TextField
                label="Size Requirements"
                required
                value={metadata.sizeRequirements || ''}
                onChange={(e) => handleMetadataChange('sizeRequirements', e.target.value)}
                fullWidth
                margin="normal"
              />
          </Box>
        </Box>
      );
};

export default ProductImageFields; 