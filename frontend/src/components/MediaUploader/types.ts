import { BaseMediaFile } from "../../interfaces/MediaFile";
import { MediaType } from "../../store/slices/mediaTypeSlice";

export interface MediaTypeUploaderProps {
  open: boolean;
  onClose: () => void;
  onUploadComplete: (file: any | null) => void;
}

export interface MetadataState {
  fileName: string;
  tags: string[];
  tagsInput: string;
  visibility: string;
  altText: string;
  description: string;
  recordedDate: string;
  uploadedBy?: string;
  modifiedBy?: string;
  mediaTypeId: string;
  mediaTypeName: string;
  title: string;
  relatedMedia?: RelatedMedia[];
  [key: string]: any; // Allow for additional properties
}

export interface UploaderState {
  completionPending: boolean;
  isClosing: boolean;
  uploadedFileData: BaseMediaFile | null;
}

export interface FieldLabelProps {
  name: string;
  required: boolean;
  isValid: boolean | null;
}

export interface RelatedMedia {
  mediaId: string;
  relationship: string; // e.g., "reference", "version", "attachment"
  note?: string;
  _display?: {
    title?: string;
    thumbnail?: string;
  };
} 