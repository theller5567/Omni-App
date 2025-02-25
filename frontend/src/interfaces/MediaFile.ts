export default interface MediaFile {
    id: string;
    location: string;
    slug: string;
    title: string;
    metadata: {
      fileName: string;
      altText: string;
      description: string;
      tags: Array<string>;
    };
    fileSize: number; // in bytes
    modifiedDate: Date;
    fileExtension: string;
}