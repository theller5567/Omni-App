import { BaseMediaFile } from '../interfaces/MediaFile';

export interface MediaRow {
  _id: string;
  id: string;
  location: string;
  title: string;
  displayTitle: string;
  thumbnailUrl: string | null;
  fileSize: number;
  fileExtension: string;
  modifiedDate: string | undefined | null;
  metadata: {
    fileName: string;
    altText: string;
    description: string;
    tags: string[];
    visibility: string;
    catColor: string | null;
    v_thumbnail: string | null;
    v_thumbnailTimestamp: string | null;
  };
  slug: string;
  mediaTypeId?: string;
  mediaTypeName: string;
  mediaType: string;
}

export const buildMediaRows = (
  mediaFilesData: BaseMediaFile[],
  selectedMediaType: string
): MediaRow[] => {
  const filtered = mediaFilesData.filter(file => {
    const label = (file as any).mediaTypeName || (typeof file.mediaType === 'string' ? file.mediaType : '');
    return selectedMediaType === 'All' || label === selectedMediaType;
  });

  const mapped: MediaRow[] = filtered.map((file) => ({
    _id: (file._id || file.id || crypto.randomUUID()) as string,
    id: (file._id || file.id || crypto.randomUUID()) as string,
    location: file.location || '',
    title: file.title || '',
    displayTitle: file.metadata?.fileName || file.title || 'Untitled',
    thumbnailUrl: (file.metadata as any)?.v_thumbnail || file.location || null,
    fileSize: file.fileSize || 0,
    fileExtension: file.fileExtension || '',
    modifiedDate: file.modifiedDate,
    metadata: {
      fileName: file.metadata?.fileName || 'Untitled',
      altText: (file.metadata as any)?.altText || '',
      description: file.metadata?.description || '',
      tags: file.metadata?.tags || [],
      visibility: file.metadata?.visibility || 'public',
      catColor: (file.metadata as any)?.catColor || null,
      v_thumbnail: (file.metadata as any)?.v_thumbnail || null,
      v_thumbnailTimestamp: (file.metadata as any)?.v_thumbnailTimestamp || null
    },
    slug: file.slug || '',
    mediaTypeId: (file as any).mediaTypeId || (typeof (file as any).mediaType === 'string' ? (file as any).mediaType : undefined),
    mediaTypeName: (file as any).mediaTypeName || (typeof file.mediaType === 'string' ? file.mediaType : 'Unknown'),
    mediaType: (file as any).mediaTypeName || (typeof file.mediaType === 'string' ? file.mediaType : 'Unknown')
  }));

  // Sort newest to oldest by modifiedDate for consistent grid/card order
  const sorted = [...mapped].sort((a, b) => {
    const ta = a.modifiedDate ? new Date(a.modifiedDate as any).getTime() : 0;
    const tb = b.modifiedDate ? new Date(b.modifiedDate as any).getTime() : 0;
    return tb - ta; // desc
  });

  return sorted;
};


