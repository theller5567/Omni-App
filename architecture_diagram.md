# Omni-App Architecture Diagrams

## System Architecture

```
┌─────────────────────────────────┐                ┌─────────────────────────────────┐
│                                 │                │                                 │
│          Client Browser         │                │         AWS Services           │
│                                 │                │                                 │
└───────────────┬─────────────────┘                └───────────────┬─────────────────┘
                │                                                  │
                ▼                                                  ▼
┌─────────────────────────────────┐                ┌─────────────────────────────────┐
│                                 │                │                                 │
│    Frontend React Application   │◄───REST API────►             S3 Storage          │
│        (Netlify Hosted)         │                │      (Files and Thumbnails)     │
│                                 │                │                                 │
└───────────────┬─────────────────┘                └─────────────────────────────────┘
                │
                │
                ▼
┌─────────────────────────────────┐                ┌─────────────────────────────────┐
│                                 │                │                                 │
│      Backend Node.js Server     │◄───Mongoose────►       MongoDB Database          │
│                                 │                │     (User and Media Data)       │
│                                 │                │                                 │
└─────────────────────────────────┘                └─────────────────────────────────┘
```

## Component Interaction Flow

```
┌────────────┐     ┌────────────┐     ┌────────────────┐     ┌───────────────┐
│            │     │            │     │                │     │               │
│   Media    │────►│   Media    │────►│ Thumbnail      │────►│ AWS S3        │
│  Library   │     │  Detail    │     │ Update Dialog  │     │ Storage       │
│            │     │            │     │                │     │               │
└────────────┘     └─────┬──────┘     └───────┬────────┘     └───────┬───────┘
                         │                    │                      │
                         │                    │                      │
                         ▼                    ▼                      │
                   ┌────────────┐     ┌─────────────────┐           │
                   │            │     │                 │           │
                   │ Edit Media │     │ Media Detail    │           │
                   │  Dialog    │     │ Thumbnail       │           │
                   │            │     │ Selector        │           │
                   └─────┬──────┘     └─────────┬───────┘           │
                         │                      │                   │
                         │                      │                   │
                         ▼                      ▼                   ▼
                   ┌────────────────────────────────────────────────────────┐
                   │                                                        │
                   │                 Redux Store & API                      │
                   │                                                        │
                   └────────────────────────────────────────────────────────┘
                                           │
                                           │
                                           ▼
                   ┌────────────────────────────────────────────────────────┐
                   │                                                        │
                   │                 MongoDB Database                       │
                   │                                                        │
                   └────────────────────────────────────────────────────────┘
```

## Video Thumbnail Generation Flow

```
┌──────────────┐     ┌──────────────────┐     ┌──────────────────┐
│              │     │                  │     │                  │
│ Media Detail │────►│ Thumbnail Update │────►│ Video Player     │
│    Page      │     │     Dialog       │     │  Component       │
│              │     │                  │     │                  │
└──────────────┘     └──────────────────┘     └────────┬─────────┘
                                                       │
                                                       │
                                                       ▼
                                              ┌──────────────────┐
                                              │                  │
                                              │ Frame Navigation │
                                              │    Controls      │
                                              │                  │
                                              └────────┬─────────┘
                                                       │
                                                       │
┌──────────────┐     ┌──────────────────┐              │
│              │     │                  │              │
│  AWS S3      │◄────┤ Thumbnail        │◄─────────────┘
│  Storage     │     │ Generation API   │
│              │     │                  │
└──────────────┘     └──────────────────┘
                              │
                              │
                              ▼
                     ┌──────────────────┐     ┌──────────────────┐
                     │                  │     │                  │
                     │ MongoDB Update   │────►│ UI Refresh with  │
                     │                  │     │  New Thumbnail   │
                     │                  │     │                  │
                     └──────────────────┘     └──────────────────┘
```

## Media Type and Metadata Structure

```
┌─────────────────────────────────────────────────────────┐
│                      MediaType                          │
├─────────────────────────────────────────────────────────┤
│ - name: string                                          │
│ - description: string                                   │
│ - fields: Field[]                                       │
│ - acceptedFileTypes: string[]                           │
│ - defaultTags: string[]                                 │
│ - catColor: string                                      │
└───────────────────────────┬─────────────────────────────┘
                            │
                            │ defines
                            │
                            ▼
┌─────────────────────────────────────────────────────────┐
│                       Media                             │
├─────────────────────────────────────────────────────────┤
│ - title: string                                         │
│ - slug: string                                          │
│ - fileExtension: string                                 │
│ - fileSize: number                                      │
│ - location: string (S3 URL)                             │
│ - mediaType: string (reference to MediaType)            │
│ - metadata:                                             │
│   - fileName: string                                    │
│   - altText: string                                     │
│   - description: string                                 │
│   - visibility: string                                  │
│   - tags: string[]                                      │
│   - v_thumbnail: string (S3 URL)                        │
│   - v_thumbnailTimestamp: string                        │
│   - [custom fields defined by MediaType]                │
│ - uploadedBy: User reference                            │
│ - uploadDate: Date                                      │
│ - modifiedDate: Date                                    │
└─────────────────────────────────────────────────────────┘
``` 