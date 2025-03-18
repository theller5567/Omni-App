export interface MediaFile {
    _id: string;
    id: string;
    title: string;
    location: string;
    slug: string;
    fileSize: number;
    fileExtension: string;
    modifiedDate: Date;
    uploadedBy: string;
    modifiedBy: string;
    __t: string;
    metadata: {
        fileName: string;
        tags: string[];
        visibility: string;
        altText: string;
        description: string;
        mediaType: string;
        [key: string]: any;
    };
}
export interface BaseMediaMetadata {
}
