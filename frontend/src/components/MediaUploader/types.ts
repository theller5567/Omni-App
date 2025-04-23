import { BaseMediaFile } from "../../interfaces/MediaFile";
import { MediaType } from "../../store/slices/mediaTypeSlice";

export interface MediaTypeUploaderProps {
  open: boolean;
  onClose: () => void;
  onUploadComplete: (newFile: BaseMediaFile) => void;
}

export interface MetadataState {
  fileName: string;
  tags: string[];
  tagsInput?: string;
  visibility: string;
  altText: string;
  description: string;
  recordedDate: string;
  uploadedBy: string;
  modifiedBy: string;
  imageWidth?: number;
  imageHeight?: number;
  mediaTypeId?: string;
  mediaTypeName?: string;
  title: string;
  selectedTagCategoryId?: string;
  tagSearchQuery?: string;
  [key: string]: any; // Allow dynamic fields for media type specific fields
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