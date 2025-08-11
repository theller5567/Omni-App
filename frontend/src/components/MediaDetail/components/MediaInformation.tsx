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
import { formatFileSize } from '../../../utils/formatFileSize';
import { shouldHideField } from '../../../config/mediaInfoConfig';
import '../styles/MediaInformation.scss';
import { MediaDetailTags } from '../MediaDetail';
import { useUsername } from '../../../hooks/useUsername';
import { MediaFile } from '../../../hooks/query-hooks';

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
  mediaFile: MediaFile;
  mediaTypeConfig: MediaTypeConfig | null;
  baseFields: Record<string, unknown>;
  getMetadataField: (mediaFile: MediaFile, fieldName: string, defaultValue?: unknown) => unknown;
}

// Helper function to check if a field is part of the base schema
const isBaseSchemaField = (fieldName: string, baseFields: Record<string, unknown>): boolean => {
  return Object.keys(baseFields).includes(fieldName);
};

const MediaInformation: React.FC<MediaInformationProps> = ({ 
  mediaFile, 
  mediaTypeConfig, 
  baseFields,
  getMetadataField
}) => {
  const isMobile = useMediaQuery((theme: Theme) => theme.breakpoints.down('sm'));
  
  // Filter for standard/base fields - keeps existing behavior for these sections
  const filterStandardAndBaseFields = (fields: { label: string; value: unknown }[]) => {
    return fields.filter(field => 
      !shouldHideField(field.label) && 
      field.value !== undefined && 
      field.value !== null && 
      (typeof field.value === 'string' ? field.value.trim() !== '' : true) &&
      field.value !== 'N/A' && // Avoid hiding our N/A placeholder
      // Keep specific placeholders for description/altText if they are the value
      !(field.label === 'Description' && field.value === 'No description') &&
      !(field.label === 'Alt Text' && field.value === 'No alt text')
    );
  };

  const userId = getMetadataField(mediaFile, 'uploadedBy', '') as string;
  const { username: uploaderUsername, loading: uploaderLoading } = useUsername(userId);

  const basicFileInfoRaw = [
    { label: 'Title', value: mediaFile.title || 'Untitled' },
    { label: 'File Name', value: getMetadataField(mediaFile, 'fileName') || mediaFile.title || 'Unknown' },
    { label: 'File Size', value: mediaFile.fileSize ? formatFileSize(mediaFile.fileSize) : 'Unknown' },
    { label: 'File Type', value: mediaFile.fileExtension ? `.${mediaFile.fileExtension}` : 'Unknown' },
    { label: 'Media Type', value: mediaFile.mediaType || 'Unknown' },
    { label: 'Visibility', value: getMetadataField(mediaFile, 'visibility', 'Public') },
    { label: 'Uploaded By', value: uploaderLoading ? 'Loading...' : (uploaderUsername || userId || 'Unknown') },
    { label: 'Uploaded On', value: getMetadataField(mediaFile, 'modifiedDate', 'Unknown') 
      ? new Date(getMetadataField(mediaFile, 'modifiedDate') as string).toLocaleDateString(undefined, {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        })
      : 'Unknown' }
  ];
  const displayableBasicFileInfo = filterStandardAndBaseFields(basicFileInfoRaw);

  const standardMetadataRaw = [
    { label: 'Description', value: getMetadataField(mediaFile, 'description', 'No description') },
    { label: 'Alt Text', value: getMetadataField(mediaFile, 'altText', 'No alt text') }
  ];
  const displayableStandardMetadata = filterStandardAndBaseFields(standardMetadataRaw);

  const baseSchemaPropertiesRaw = Object.entries(baseFields).map(([fieldName, fieldProps]: [string, any]) => ({
      label: fieldName,
      value: getMetadataField(mediaFile, fieldName) !== undefined 
        ? (fieldProps as MediaTypeField).type === 'Boolean' 
          ? (getMetadataField(mediaFile, fieldName) ? 'Yes' : 'No')
          : String(getMetadataField(mediaFile, fieldName))
      : undefined // Explicitly undefined if not present
  }));
  const displayableBaseSchemaProperties = filterStandardAndBaseFields(baseSchemaPropertiesRaw);

  // New approach for customFields:
  const allCustomFieldsDefinedByType = mediaTypeConfig?.fields
    ? mediaTypeConfig.fields
          .filter(field => 
            !['fileName', 'tags', 'altText', 'description', 'visibility'].includes(field.name) &&
          !isBaseSchemaField(field.name, baseFields) &&
          !shouldHideField(field.name) 
          )
          .map(field => {
            const value = getMetadataField(mediaFile, field.name);
          let displayValue: string;

          if (value === undefined || value === null || String(value).trim() === '') {
            displayValue = 'N/A'; // Display 'N/A' for empty or undefined values
          } else if (field.type === 'Boolean') {
            displayValue = value ? 'Yes' : 'No';
          } else {
            displayValue = String(value);
          }
          
            return {
              label: field.name,
            value: displayValue,
            };
          })
    : [];

  return (
    <div className="media-information">
      
      {displayableBasicFileInfo.length > 0 && (
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
              {displayableBasicFileInfo.map((info, index) => (
                <Box key={index} className="info-item">
                  <Typography variant="subtitle2">{info.label}</Typography>
                  <Typography variant="body2">{info.value as string}</Typography>
                </Box>
              ))}
            </Box>
          </AccordionDetails>
        </Accordion>
      )}

     

      {displayableStandardMetadata.length > 0 && (
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
              {displayableStandardMetadata.map((info, index) => (
                <Box key={index} className="info-item">
                  <Typography variant="subtitle2">{info.label}</Typography>
                    <Typography variant="body2">{info.value as string}</Typography>
                </Box>
              ))}
            </Box>
          </AccordionDetails>
        </Accordion>
      )}

      {displayableBaseSchemaProperties.length > 0 && (
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
              {displayableBaseSchemaProperties.map((info, index) => (
                <Box key={index} className="info-item">
                  <Typography variant="subtitle2">{info.label}</Typography>
                  <Typography variant="body2">{info.value as string}</Typography>
                </Box>
              ))}
            </Box>
          </AccordionDetails>
        </Accordion>
      )}
      
      

      {/* Show the accordion if there are ANY custom fields defined for the type (after initial filtering) */}
      {mediaTypeConfig && mediaTypeConfig.fields && 
       mediaTypeConfig.fields.filter(f => 
         !['fileName', 'tags', 'altText', 'description', 'visibility'].includes(f.name) && 
         !isBaseSchemaField(f.name, baseFields) && 
         !shouldHideField(f.name)
       ).length > 0 && (
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
              {allCustomFieldsDefinedByType.map((info, index) => (
                <Box key={index} className="info-item">
                  <Typography variant="subtitle2">{info.label}</Typography>
                  <Typography variant="body2">{info.value as string}</Typography>
                </Box>
              ))}
            </Box>
          </AccordionDetails>
        </Accordion>
      )}

{mediaFile.metadata?.tags && mediaFile.metadata?.tags.length > 0 && (
        <Accordion>
          <AccordionSummary
            expandIcon={<ExpandMoreIcon fontSize={isMobile ? "small" : "medium"} />}
          >
            <Typography variant={isMobile ? "body1" : "subtitle1"}>Tags</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Box>
            <MediaDetailTags 
            tags={getMetadataField(mediaFile, 'tags', []) as string[] | undefined} 
            isMobile={isMobile}
            />
            </Box>
          </AccordionDetails>
        </Accordion>
      )}
    </div>
  );
};

// Export as both named and default export to support both usage patterns
export { MediaInformation };
export default MediaInformation; 