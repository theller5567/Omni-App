import BaseImage from '../models/baseSchemas/BaseImage.js';
import BaseVideo from '../models/baseSchemas/BaseVideo.js';
import BaseAudio from '../models/baseSchemas/BaseAudio.js';
import BaseDocument from '../models/baseSchemas/BaseDocument.js';
import Media from '../models/Media.js';

/**
 * Determines the appropriate base schema model for a given MIME type
 * 
 * @param {string} mimeType - The MIME type of the file
 * @returns {mongoose.Model} - The appropriate Mongoose model for the media type
 */
export const getBaseModelForMimeType = (mimeType) => {
  if (!mimeType) {
    return Media; // Fallback to generic Media
  }

  const mainType = mimeType.split('/')[0];
  
  switch (mainType) {
    case 'image':
      return BaseImage;
    case 'video':
      return BaseVideo;
    case 'audio':
      return BaseAudio;
    case 'application':
      // For PDF, Word, Excel, etc.
      if (
        mimeType.includes('pdf') ||
        mimeType.includes('word') ||
        mimeType.includes('excel') ||
        mimeType.includes('powerpoint') ||
        mimeType.includes('text') ||
        mimeType.includes('rtf') ||
        mimeType.includes('json') ||
        mimeType.includes('xml')
      ) {
        return BaseDocument;
      }
      return Media;
    default:
      return Media;
  }
};

/**
 * Gets a list of base fields that should be included for a given file type
 * 
 * @param {string} mimeType - The MIME type of the file
 * @returns {Object} - Object containing field definitions for the base type
 */
export const getBaseFieldsForMimeType = (mimeType) => {
  if (!mimeType) {
    return {};
  }

  const mainType = mimeType.split('/')[0];
  
  switch (mainType) {
    case 'image':
      return {
        imageWidth: { type: 'Number', required: false },
        imageHeight: { type: 'Number', required: false },
        resolution: { type: 'Text', required: false },
        colorSpace: { type: 'Text', required: false },
        orientation: { type: 'Text', required: false },
        hasAlphaChannel: { type: 'Boolean', required: false },
      };
    case 'video':
      return {
        duration: { type: 'Number', required: false },
        frameRate: { type: 'Number', required: false },
        videoWidth: { type: 'Number', required: false },
        videoHeight: { type: 'Number', required: false },
        codec: { type: 'Text', required: false },
        aspectRatio: { type: 'Text', required: false },
        hasAudio: { type: 'Boolean', required: false },
        audioCodec: { type: 'Text', required: false },
      };
    case 'audio':
      return {
        duration: { type: 'Number', required: false },
        sampleRate: { type: 'Number', required: false },
        channels: { type: 'Number', required: false },
        bitRate: { type: 'Number', required: false },
        codec: { type: 'Text', required: false },
        artist: { type: 'Text', required: false },
        album: { type: 'Text', required: false },
        genre: { type: 'Text', required: false },
        trackNumber: { type: 'Number', required: false },
      };
    case 'application':
      // For PDF, Word, Excel, etc.
      if (
        mimeType.includes('pdf') ||
        mimeType.includes('word') ||
        mimeType.includes('excel') ||
        mimeType.includes('powerpoint') ||
        mimeType.includes('text') ||
        mimeType.includes('rtf')
      ) {
        return {
          pageCount: { type: 'Number', required: false },
          author: { type: 'Text', required: false },
          creationDate: { type: 'Date', required: false },
          lastModified: { type: 'Date', required: false },
          documentTitle: { type: 'Text', required: false },
          keywords: { type: 'Text', required: false },
          documentLanguage: { type: 'Text', required: false },
        };
      }
      return {};
    default:
      return {};
  }
}; 