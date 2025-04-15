import React from 'react';
import { 
  Typography, 
  Box, 
  Accordion, 
  AccordionSummary, 
  AccordionDetails,
  useMediaQuery,
  Theme,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { formatFileSize } from '../../utils/formatFileSize';
import { shouldHideField } from '../../config/mediaInfoConfig';
import './MediaInformation.scss';

interface MediaTypeField {
  name: string;
  type: string;
  required?: boolean;
  options?: string[];
  [key: string]: any;
}

interface MediaTypeConfig {
  fields: MediaTypeField[];
  name: string;
  baseType?: string;
  [key: string]: any;
}

interface MediaInformationProps {
  mediaFile: any;
  mediaTypeConfig: MediaTypeConfig | null;
  baseFields: Record<string, any>;
  getMetadataField: (mediaFile: any, fieldName: string, defaultValue?: any) => any;
}

// Helper function to check if a field is part of the base schema
const isBaseSchemaField = (fieldName: string, baseFields: Record<string, any>): boolean => {
  return Object.keys(baseFields).includes(fieldName);
};

const MediaInformation: React.FC<MediaInformationProps> = ({ 
  mediaFile, 
  mediaTypeConfig, 
  baseFields,
  getMetadataField
}) => {
  const isMobile = useMediaQuery((theme: Theme) => theme.breakpoints.down('sm'));
  
  // Filter out fields we don't want to display
  const filterFields = (fields: { label: string; value: any }[]) => {
    return fields.filter(field => 
      !shouldHideField(field.label) && 
      field.value !== undefined && 
      field.value !== null && 
      field.value !== ''
    );
  };

  // Group basic file information
  const basicFileInfo = filterFields([
    { label: 'Title', value: mediaFile.title || 'Untitled' },
    { label: 'File Name', value: getMetadataField(mediaFile, 'fileName') || mediaFile.title || 'Unknown' },
    { label: 'File Size', value: mediaFile.fileSize ? formatFileSize(mediaFile.fileSize) : 'Unknown' },
    { label: 'File Type', value: mediaFile.fileExtension ? `.${mediaFile.fileExtension}` : 'Unknown' },
    { label: 'Media Type', value: mediaFile.mediaType || 'Unknown' },
    { label: 'Visibility', value: getMetadataField(mediaFile, 'visibility', 'Public') }
  ]);

  // Standard metadata
  const standardMetadata = filterFields([
    { label: 'Description', value: getMetadataField(mediaFile, 'description', 'No description') },
    { label: 'Alt Text', value: getMetadataField(mediaFile, 'altText', 'No alt text') }
  ]);

  // Get base schema properties
  const baseSchemaProperties = filterFields(
    Object.entries(baseFields).map(([fieldName, fieldProps]: [string, any]) => ({
      label: fieldName,
      value: getMetadataField(mediaFile, fieldName) !== undefined 
        ? fieldProps.type === 'Boolean' 
          ? (getMetadataField(mediaFile, fieldName) ? 'Yes' : 'No')
          : String(getMetadataField(mediaFile, fieldName))
        : undefined
    }))
  );

  // Get custom media type specific fields
  const customFields = mediaTypeConfig?.fields
    ? filterFields(
        mediaTypeConfig.fields
          .filter(field => 
            !['fileName', 'tags', 'altText', 'description', 'visibility'].includes(field.name) &&
            !isBaseSchemaField(field.name, baseFields)
          )
          .map(field => {
            const value = getMetadataField(mediaFile, field.name);
            return {
              label: field.name,
              value: value !== undefined
                ? field.type === 'Boolean'
                  ? (value ? 'Yes' : 'No')
                  : String(value)
                : undefined
            };
          })
      )
    : [];

  return (
    <div className="media-information">
      <Typography 
        variant={isMobile ? "h5" : "h4"} 
        gutterBottom 
        style={{ 
          color: 'var(--accent-color)',
          fontSize: isMobile ? '1.25rem' : '2rem',
          marginBottom: isMobile ? '0.5rem' : '1rem'
        }}
      >
        {getMetadataField(mediaFile, 'fileName') || mediaFile.title || 'Untitled Media'}
      </Typography>

      {basicFileInfo.length > 0 && (
        <Accordion defaultExpanded>
          <AccordionSummary
            expandIcon={<ExpandMoreIcon fontSize={isMobile ? "small" : "medium"} />}
            aria-controls="basic-info-content"
            id="basic-info-header"
          >
            <Typography variant={isMobile ? "body1" : "subtitle1"}>Basic Information</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Box className="info-grid">
              {basicFileInfo.map((info, index) => (
                <Box key={index} className="info-item">
                  <Typography variant="subtitle2">{info.label}</Typography>
                  <Typography variant="body2">{info.value}</Typography>
                </Box>
              ))}
            </Box>
          </AccordionDetails>
        </Accordion>
      )}

      {standardMetadata.length > 0 && (
        <Accordion defaultExpanded>
          <AccordionSummary
            expandIcon={<ExpandMoreIcon fontSize={isMobile ? "small" : "medium"} />}
            aria-controls="content-info-content"
            id="content-info-header"
          >
            <Typography variant={isMobile ? "body1" : "subtitle1"}>Content Information</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Box className="info-grid">
              {standardMetadata.map((info, index) => (
                <Box key={index} className="info-item">
                  <Typography variant="subtitle2">{info.label}</Typography>
                    <Typography variant="body2">{info.value}</Typography>
                </Box>
              ))}
            </Box>
          </AccordionDetails>
        </Accordion>
      )}

      {baseSchemaProperties.length > 0 && (
        <Accordion>
          <AccordionSummary
            expandIcon={<ExpandMoreIcon fontSize={isMobile ? "small" : "medium"} />}
            aria-controls="base-schema-content"
            id="base-schema-header"
          >
            <Typography variant={isMobile ? "body1" : "subtitle1"}>
              {mediaTypeConfig?.baseType?.replace('Base', '') || 'Media'} Technical Properties
            </Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Box className="info-grid">
              {baseSchemaProperties.map((info, index) => (
                <Box key={index} className="info-item">
                  <Typography variant="subtitle2">{info.label}</Typography>
                  <Typography variant="body2">{info.value}</Typography>
                </Box>
              ))}
            </Box>
          </AccordionDetails>
        </Accordion>
      )}

      {customFields.length > 0 && (
        <Accordion>
          <AccordionSummary
            expandIcon={<ExpandMoreIcon fontSize={isMobile ? "small" : "medium"} />}
            aria-controls="custom-fields-content"
            id="custom-fields-header"
          >
            <Typography variant={isMobile ? "body1" : "subtitle1"}>
              {mediaTypeConfig?.name} Specific Fields
            </Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Box className="info-grid">
              {customFields.map((info, index) => (
                <Box key={index} className="info-item">
                  <Typography variant="subtitle2">{info.label}</Typography>
                  <Typography variant="body2">{info.value}</Typography>
                </Box>
              ))}
            </Box>
          </AccordionDetails>
        </Accordion>
      )}
    </div>
  );
};

export default MediaInformation; 