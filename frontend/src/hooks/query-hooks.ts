import { useQuery, useMutation, useQueryClient, UseQueryOptions, QueryKey } from '@tanstack/react-query';
import axios from 'axios';
import env from '../config/env';
import { toast } from 'react-toastify';

// ======================
// === Query Keys ===
// ======================
export const QueryKeys = {
  media: 'media',
  mediaTypes: 'mediaTypes',
  mediaDetail: 'mediaDetail',
  activityLogs: 'activityLogs',
  userActivities: 'userActivities',
  databaseStats: 'databaseStats',
  mediaTypeUsage: 'mediaTypeUsage',
  notificationSettings: 'notificationSettings',
  eligibleRecipients: 'eligibleRecipients',
  // Tags and Tag Categories
  tags: 'tags',
  tagCategories: 'tagCategories',
  tagCategoryById: (id: string) => ['tagCategories', 'id', id],
  // New more specific query keys for better caching control
  allMedia: ['media', 'all'],
  mediaById: (id: string) => ['media', 'id', id],
  mediaBySlug: (slug: string) => ['media', 'slug', slug],
  mediaByType: (typeId: string) => ['media', 'type', typeId],
  // User-related query keys
  userProfile: ['userProfile'] as const,
  allUsers: ['allUsers'] as const,
  userById: (userId: string) => ['user', userId] as const, // Adjusted query key pattern
  // Auth-related query keys (primarily for mutations, less for direct caching)
  login: ['auth', 'login'] as const,
  register: ['auth', 'register'] as const,
};

// ======================
// === Types ===
// ======================
export interface MediaFile {
  _id: string;
  id?: string;
  title?: string;
  slug?: string;
  location?: string;
  fileExtension?: string;
  mediaType?: string;
  modifiedDate: string;
  fileSize: number;
  metadata?: {
    fileName?: string;
    tags?: any[];
    [key: string]: any;
  };
  [key: string]: any;
}

export interface MediaType {
  _id: string;
  name: string;
  description: string;
  catColor: string;
  [key: string]: any;
}

// Tags and Tag Categories interfaces
export interface Tag {
  _id: string;
  name: string;
}

export interface TagCategory {
  _id: string;
  name: string;
  description?: string;
  tags?: Array<{
    id: string;
    name: string;
  }>;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

// Add User type
export interface User {
  _id: string;
  id?: string;
  username: string;
  email: string;
  firstName?: string;
  lastName?: string;
  avatar?: string;
  role: 'user' | 'admin' | 'distributor' | 'superAdmin';
  createdAt?: string;
  updatedAt?: string;
  token?: string;
  profile?: any;
}

// Auth-related types
export interface UserLoginCredentials {
  email: string;
  password: string;
}

export interface UserRegistrationData {
  firstName: string;
  lastName: string;
  email: string;
  username: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  refreshToken: string;
  user: User; // Use the existing User type
  message?: string;
}

// For registration, the API might only return a message without user/token
export interface RegistrationResponse {
  message: string;
  // Optionally, if the API returns user data or other fields on register:
  // user?: User; 
  // token?: string; // etc.
}

// Add a type for the data expected by addMediaFile
export interface NewMediaData {
  // Define based on what your backend expects for a new media item
  // This is a placeholder; adjust as needed.
  title: string;
  file: File; // Assuming a file object is part of the upload
  mediaType?: string;
  tags?: string[];
  // Any other relevant fields
}

// Type for the data sent to create a tag category
export interface NewTagCategoryData {
  name: string;
  description?: string;
  tags?: Array<{ id: string; name: string }>; // Match TagCategoryFormData in TagCategoryManager
}

// Type for invitation data
export interface InvitationData {
  email: string;
  firstName: string;
  lastName: string;
  role: 'user' | 'admin' | 'distributor' | 'superAdmin'; // Or more specific roles
  message?: string;
  invitedBy: string; // User ID of the inviter
}

// Type for invitation response
export interface InvitationResponse {
  message: string;
  // Include other fields if your API returns more data upon sending an invitation
  // For example: invitationId?: string;
}

// ======================
// === API Functions ===
// ======================

// -- Media --
export const fetchMedia = async (): Promise<MediaFile[]> => {
  const token = localStorage.getItem('authToken');
  if (!token) {
    throw new Error('Authentication token missing');
  }
  
  const response = await axios.get<MediaFile[]>(`${env.BASE_URL}/media/all`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
  
  // Log in development only
  if (process.env.NODE_ENV === 'development') {
    console.log(`Fetched ${response.data.length} media items`);
    if (response.data.length > 0) {
      console.log('%%%%% RAW MEDIA ITEM SAMPLE (fetchMedia) %%%%%', JSON.stringify(response.data[0], null, 2));
      console.log('%%%%% TYPEOF RAW fileSize (fetchMedia) %%%%%', typeof response.data[0].fileSize);
    }
  }
  
  // Process the data to ensure consistent formatting
  return response.data.map(media => {
    const processedMedia: MediaFile = {
      ...media, // Spread first to get all existing fields
      _id: media._id, // Ensure _id is present
      // Explicitly use the fileSize from the API, fallback to 0 if not a number or missing
      fileSize: typeof media.fileSize === 'number' ? media.fileSize : 0,
      // Use the original modifiedDate if it's a valid string, otherwise fallback
      modifiedDate: typeof media.modifiedDate === 'string' && media.modifiedDate.length > 0 
                      ? media.modifiedDate 
                      : new Date().toISOString(),
      // Ensure metadata exists
      metadata: media.metadata || {},
    };
    
    // Add cache parameter to video thumbnails to prevent browser caching
    if (processedMedia.metadata?.v_thumbnail) {
      const uniqueId = processedMedia._id || processedMedia.id || '';
      const separator = processedMedia.metadata.v_thumbnail.includes('?') ? '&' : '?';
      processedMedia.metadata.v_thumbnail = `${processedMedia.metadata.v_thumbnail}${separator}mediaId=${uniqueId}`;
    }
    
    return processedMedia;
  });
};

// Enhanced function to fetch media by type
export const fetchMediaByType = async (typeId: string): Promise<MediaFile[]> => {
  const token = localStorage.getItem('authToken');
  if (!token) {
    throw new Error('Authentication token missing');
  }
  
  if (typeId === 'All') {
    return fetchMedia(); // This will use the updated fetchMedia logic
  }
  
  const response = await axios.get<MediaFile[]>(`${env.BASE_URL}/media/byType/${typeId}`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
  
  if (process.env.NODE_ENV === 'development') {
    console.log(`Fetched ${response.data.length} media items for type ${typeId}`);
    if (response.data.length > 0) {
      console.log('%%%%% RAW MEDIA ITEM SAMPLE (fetchMediaByType) %%%%%', JSON.stringify(response.data[0], null, 2));
      console.log('%%%%% TYPEOF RAW fileSize (fetchMediaByType) %%%%%', typeof response.data[0].fileSize);
    }
  }
  
  // Process the data like in fetchMedia
  return response.data.map(media => {
    const processedMedia: MediaFile = {
      ...media, // Spread first
      _id: media._id,
      fileSize: typeof media.fileSize === 'number' ? media.fileSize : 0,
      modifiedDate: typeof media.modifiedDate === 'string' && media.modifiedDate.length > 0 
                      ? media.modifiedDate 
                      : new Date().toISOString(),
      metadata: media.metadata?.v_thumbnail ? {
        ...(media.metadata || {}),
        v_thumbnail: `${media.metadata.v_thumbnail}${media.metadata.v_thumbnail.includes('?') ? '&' : '?'}mediaId=${media._id || media.id || ''}`
      } : (media.metadata || {}),
    };
    return processedMedia;
  });
};

export const deleteMediaItem = async (id: string): Promise<{ id: string }> => {
  const token = localStorage.getItem('authToken');
  if (!token) {
    throw new Error('Authentication token missing');
  }
  
  await axios.delete(`${env.BASE_URL}/api/media/${id}`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
  
  return { id };
};

// -- Media Types --
export const fetchMediaTypes = async (): Promise<MediaType[]> => {
  const token = localStorage.getItem('authToken');
  if (!token) {
    throw new Error('Authentication token missing');
  }
  
  const response = await axios.get<MediaType[]>(`${env.BASE_URL}/api/media-types`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
  
  // Log in development only
  if (process.env.NODE_ENV === 'development') {
    console.log(`Fetched ${response.data.length} media types`);
  }
  
  return response.data;
};

// New function to fetch media types with usage counts
export const fetchMediaTypesWithUsageCounts = async (): Promise<MediaType[]> => {
  const token = localStorage.getItem('authToken');
  if (!token) {
    throw new Error('Authentication token missing');
  }
  
  // Add timestamp to prevent caching
  const timestamp = new Date().getTime();
  const response = await axios.get<MediaType[]>(
    `${env.BASE_URL}/api/media-types/with-usage-counts?_t=${timestamp}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    }
  );
  
  if (process.env.NODE_ENV === 'development') {
    console.log(`Fetched ${response.data.length} media types with usage counts`);
  }
  
  // Process the response data to ensure consistent structure
  return response.data.map(mediaType => ({
    ...mediaType,
    usageCount: mediaType.usageCount || 0,
    status: mediaType.status || 'active',
    replacedBy: mediaType.replacedBy || null,
    isDeleting: mediaType.isDeleting || false
  }));
};

// Function to check a specific media type's usage
export const checkMediaTypeUsage = async (id: string): Promise<{ id: string, count: number }> => {
  const token = localStorage.getItem('authToken');
  if (!token) {
    throw new Error('Authentication token missing');
  }
  
  // Add timestamp to URL to force fresh response
  const timestamp = new Date().getTime();
  const response = await axios.get<{ count: number }>(
    `${env.BASE_URL}/api/media-types/${id}/usage?_t=${timestamp}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    }
  );
  
  return { id, count: response.data.count };
};

// Function to create a new media type
export const createMediaType = async (mediaTypeData: Partial<MediaType>): Promise<MediaType> => {
  const token = localStorage.getItem('authToken');
  if (!token) {
    throw new Error('Authentication token missing');
  }
  
  const response = await axios.post<MediaType>(
    `${env.BASE_URL}/api/media-types`,
    mediaTypeData,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    }
  );
  
  return response.data;
};

// Function to update a media type
export const updateMediaType = async ({ id, updates }: { id: string, updates: Partial<MediaType> }): Promise<MediaType> => {
  const token = localStorage.getItem('authToken');
  if (!token) {
    throw new Error('Authentication token missing');
  }
  
  const response = await axios.put<MediaType>(
    `${env.BASE_URL}/api/media-types/${id}`,
    updates,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    }
  );
  
  return response.data;
};

// Function to delete a media type
export const deleteMediaType = async (id: string): Promise<string> => {
  const token = localStorage.getItem('authToken');
  if (!token) {
    throw new Error('Authentication token missing');
  }
  
  await axios.delete(`${env.BASE_URL}/api/media-types/${id}`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
  
  return id;
};

// Function to archive a media type
export const archiveMediaType = async (id: string): Promise<MediaType> => {
  const token = localStorage.getItem('authToken');
  if (!token) {
    throw new Error('Authentication token missing');
  }
  
  const response = await axios.put<MediaType>(
    `${env.BASE_URL}/api/media-types/${id}/archive`,
    {},
    {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    }
  );
  
  return response.data;
};

// Function to deprecate a media type
export const deprecateMediaType = async (id: string): Promise<MediaType> => {
  const token = localStorage.getItem('authToken');
  if (!token) {
    throw new Error('Authentication token missing');
  }
  
  const response = await axios.put<MediaType>(
    `${env.BASE_URL}/api/media-types/${id}/deprecate`,
    {},
    {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    }
  );
  
  return response.data;
};

// -- Media Detail --
export const fetchMediaBySlug = async (slug: string | undefined): Promise<MediaFile> => {
  const token = localStorage.getItem('authToken');
  if (!token) {
    throw new Error('Authentication token missing');
  }
  
  if (!slug) {
    throw new Error('Media slug is required');
  }
  
  if (process.env.NODE_ENV === 'development') {
    console.log(`Attempting to fetch media for: ${slug}`);
  }
  
  // Check if the slug looks like just an ID itself
  const isIdOnly = /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(slug);
  
  if (isIdOnly) {
    // If the slug is just an ID, try the ID endpoint directly
    try {
      if (process.env.NODE_ENV === 'development') {
        console.log(`Slug appears to be an ID, trying ID endpoint directly: ${slug}`);
      }
      
      const idResponse = await axios.get<MediaFile>(`${env.BASE_URL}/api/media/id/${slug}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      return idResponse.data;
    } catch (idError: any) {
      if (idError.response) {
        const { status } = idError.response;
        
        if (status === 500) {
          console.error('Server error fetching media by ID:', idError.response.data);
          throw new Error(`Server error: The media file could not be loaded.`);
        } else if (status === 404) {
          throw new Error(`Media not found: The file with ID "${slug}" does not exist or has been deleted.`);
        } else if (status === 403) {
          throw new Error('Access denied: You do not have permission to view this media.');
        }
      }
      
      throw idError;
    }
  }
  
  try {
    // Attempt to fetch by slug first - use the correct slug endpoint format
    if (process.env.NODE_ENV === 'development') {
      console.log(`Trying primary slug endpoint: ${env.BASE_URL}/media/slug/${slug}`);
    }
    
    const response = await axios.get<MediaFile>(`${env.BASE_URL}/media/slug/${slug}`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    
    // Log in development only
    if (process.env.NODE_ENV === 'development') {
      console.log(`Fetched media details for slug: ${slug}`);
    }
    
    return response.data;
  } catch (error: any) {
    // If we get a 404 for the slug, try to extract a potential ID from the slug
    if (error.response && error.response.status === 404) {
      // First try the old endpoint pattern as fallback
      if (process.env.NODE_ENV === 'development') {
        console.log(`Slug endpoint failed. Trying original format: ${env.BASE_URL}/media/${slug}`);
      }
      
      try {
        const oldFormatResponse = await axios.get<MediaFile>(`${env.BASE_URL}/media/${slug}`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        
        if (process.env.NODE_ENV === 'development') {
          console.log(`Successfully fetched media with original format endpoint`);
        }
        
        return oldFormatResponse.data;
      } catch (oldFormatError: any) {
        // Continue to ID extraction if old format also fails
        if (process.env.NODE_ENV === 'development') {
          console.log(`Original format endpoint also failed. Trying ID extraction.`);
        }
      }
      
      // Try to extract ID pattern (UUID format) from the slug
      const idMatch = slug.match(/([a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12})/i);
      
      if (idMatch && idMatch[1]) {
        const extractedId = idMatch[1];
        
        if (process.env.NODE_ENV === 'development') {
          console.log(`Slug not found. Trying with extracted ID: ${extractedId}`);
        }
        
        try {
          // Try fetching by ID instead - try different API paths
          // First try the API endpoint pattern
          const apiEndpoints = [
            `${env.BASE_URL}/api/media/id/${extractedId}`, 
            `${env.BASE_URL}/media/id/${extractedId}`,
            `${env.BASE_URL}/api/media/${extractedId}`,
            `${env.BASE_URL}/media/by-id/${extractedId}`,
            `${env.BASE_URL}/media/${extractedId}`
          ];
          
          let idResponse = null;
          let successEndpoint = '';
          
          // Try each endpoint until one works
          for (const endpoint of apiEndpoints) {
            try {
              if (process.env.NODE_ENV === 'development') {
                console.log(`Trying endpoint: ${endpoint}`);
              }
              
              idResponse = await axios.get<MediaFile>(endpoint, {
                headers: {
                  Authorization: `Bearer ${token}`
                }
              });
              
              successEndpoint = endpoint;
              break; // Exit the loop if successful
            } catch (endpointError: any) {
              // Log the failed endpoint attempt with status code if available
              if (process.env.NODE_ENV === 'development') {
                const status = endpointError.response?.status;
                console.log(`Endpoint ${endpoint} failed: ${status ? `Status ${status}` : endpointError.message}`);
              }
              // Continue to next endpoint
            }
          }
          
          if (idResponse) {
            if (process.env.NODE_ENV === 'development') {
              console.log(`Successfully fetched media using ID fallback: ${extractedId} with endpoint ${successEndpoint}`);
            }
            
            return idResponse.data;
          } else {
            // Log that all endpoints were tried and failed
            if (process.env.NODE_ENV === 'development') {
              console.error(`All ID fallback endpoints failed for ID: ${extractedId}`);
            }
            throw new Error(`Media not found: The file with ID "${extractedId}" could not be found on the server.`);
          }
        } catch (idError: any) {
          // Handle errors from the ID-based request
          if (idError.response) {
            const { status } = idError.response;
            
            if (status === 500) {
              console.error('Server error fetching media by ID:', idError.response.data);
              throw new Error(`Server error: The media file could not be loaded. The server may be having issues with this specific media.`);
            } else if (status === 404) {
              throw new Error(`Media not found: The file with ID "${extractedId}" does not exist or has been deleted.`);
            } else if (status === 403) {
              throw new Error('Access denied: You do not have permission to view this media.');
            }
          }
          
          // If no specific error was handled, throw a more detailed error
          throw new Error(`Failed to fetch media with ID ${extractedId}: ${idError.message}`);
        }
      } else {
        // No UUID pattern found in the slug, so we can't try the ID fallback
        throw new Error(`Media not found: The file with slug "${slug}" does not exist or has been deleted.`);
      }
    }
    
    // Handle specific status codes from the original slug request
    if (error.response) {
      const { status } = error.response;
      
      if (status === 500) {
        console.error('Server error fetching media:', error.response.data);
        throw new Error(`Server error: The media file could not be loaded. The server may be having issues with this specific media.`);
      } else if (status === 404) {
        throw new Error(`Media not found: The file with slug "${slug}" does not exist or has been deleted.`);
      } else if (status === 403) {
        throw new Error('Access denied: You do not have permission to view this media.');
      }
    }
    
    // Re-throw the original error if not handled above
    throw error;
  }
};

export const updateMediaItem = async (mediaData: Partial<MediaFile> & { changedFields?: string[] }): Promise<MediaFile> => {
  const token = localStorage.getItem('authToken');
  if (!token) {
    throw new Error('Authentication token missing');
  }
  
  const mediaId = mediaData._id || '';
  const mediaSlug = mediaData.slug || '';
  
  if (!mediaId && !mediaSlug) {
    throw new Error('Missing media ID or slug');
  }
  
  // Prepare the update payload - only include what's necessary
  const updatePayload: {
    title?: string;
    metadata?: Record<string, any>;
    changedFields?: string[];
  } = {};
  
  // Only include title if it's in changedFields
  if (mediaData.changedFields?.includes('title') && mediaData.title !== undefined) {
    updatePayload.title = mediaData.title;
  }
  
  // Only include metadata fields that were actually changed
  if (mediaData.metadata && mediaData.changedFields) {
    const metadataFields = mediaData.changedFields
      .filter(field => field.startsWith('metadata.'))
      .map(field => field.replace('metadata.', ''));
      
    if (metadataFields.length > 0) {
      updatePayload.metadata = {};
      
      // Only add the specific fields that changed
      metadataFields.forEach(fieldName => {
        if (mediaData.metadata && mediaData.metadata[fieldName] !== undefined) {
          if (!updatePayload.metadata) updatePayload.metadata = {};
          updatePayload.metadata[fieldName] = mediaData.metadata[fieldName];
        }
      });
    }
  }
  
  // Include changed fields if provided - this is needed for the server to know what changed
  if (mediaData.changedFields && mediaData.changedFields.length > 0) {
    updatePayload.changedFields = mediaData.changedFields;
    
    // Log what we're about to send
    if (process.env.NODE_ENV === 'development') {
      console.log('Sending update with changed fields:', updatePayload.changedFields);
      console.log('Update payload:', JSON.stringify(updatePayload, null, 2));
    }
  }
  
  let response;
  
  // Try the ID endpoint first
  try {
    if (process.env.NODE_ENV === 'development') {
      console.log('Trying to update media using ID endpoint for:', mediaId);
    }
    response = await axios.put<MediaFile>(
      `${env.BASE_URL}/media/update-by-id/${mediaId}`,
      updatePayload,
      { 
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );
  } catch (error: any) {
    // If ID endpoint fails with 404, try the slug endpoint
    if (error.response && error.response.status === 404 && mediaSlug) {
      if (process.env.NODE_ENV === 'development') {
        console.log('ID endpoint failed, trying slug endpoint for:', mediaSlug);
      }
      response = await axios.put<MediaFile>(
        `${env.BASE_URL}/media/update/${mediaSlug}`,
        updatePayload,
        { 
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
    } else {
      // Re-throw the error if it's not a 404 or we don't have a slug
      throw error;
    }
  }
  
  return response.data;
};

// API Health Check
export const checkApiHealth = async (): Promise<{ status: string }> => {
  try {
    // Try using the media-types endpoint which is more likely to exist
    await axios.get<any>(`${env.BASE_URL}/api/media-types`, {
      timeout: 5000, // 5 second timeout for health check
      headers: {
        Authorization: `Bearer ${localStorage.getItem('authToken') || ''}`
      }
    });
    
    // If we got a response, the API is working
    return { status: 'online' };
  } catch (error: any) {
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      
      // If we get a 401/403, the API is working but we're not authorized
      if (error.response.status === 401 || error.response.status === 403) {
        return { status: 'online (auth required)' };
      }
      
      throw new Error(`API responded with status: ${error.response.status}`);
    } else if (error.request) {
      // The request was made but no response was received
      throw new Error('API server is not responding');
    } else {
      // Something happened in setting up the request that triggered an Error
      throw new Error(`API request setup error: ${error.message}`);
    }
  }
};

// API function to add/upload a new media item - REMOVED as MediaUploader handles the upload directly.
// export const addMediaFile = async (mediaData: FormData): Promise<MediaFile> => { ... };

// ======================
// === React Query Hooks ===
// ======================

// Define a custom options type that includes onSuccess
type CustomQueryOptions<TData, TError> = Omit<UseQueryOptions<TData, TError, TData, any>, 'queryKey' | 'queryFn'> & {
  onSuccess?: (data: TData) => void;
};

// Extended MediaFile type for useTransformedMedia output
export type TransformedMediaFile = MediaFile & {
  displayTitle: string;
  thumbnailUrl?: string;
  // id field is added for DataGrid compatibility if not present
  id: string; 
};

// -- Media --
export const useMedia = (options?: CustomQueryOptions<MediaFile[], Error>) => {
  const queryClient = useQueryClient();
  
  // Use custom onSuccess callback outside the options
  const onSuccessCallback = (data: MediaFile[]) => {
    // Cache individual media items for faster detail page loading
    data.forEach((media: MediaFile) => {
      queryClient.setQueryData(
        QueryKeys.mediaById(media._id),
        media
      );
      if (media.slug) {
        queryClient.setQueryData(
          QueryKeys.mediaBySlug(media.slug),
          media
        );
      }
    });
    
    // Call original onSuccess if it exists
    if (options?.onSuccess) {
      options.onSuccess(data);
    }
  };
  
  // Create a new options object with our custom callbacks
  const queryOptions = {
    queryKey: QueryKeys.allMedia,
    queryFn: fetchMedia,
    staleTime: 1000 * 60 * 5, // 5 minutes
    refetchOnWindowFocus: false,
    ...options,
    onSuccess: onSuccessCallback
  };
  
  return useQuery<MediaFile[], Error, MediaFile[]>(queryOptions as any); // Cast to any to avoid linter error
};

export const useDeleteMedia = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: deleteMediaItem,
    onSuccess: (data) => {
      // Invalidate the media query to trigger a refetch
      queryClient.invalidateQueries({ queryKey: [QueryKeys.media] });
      
      // OR, optionally, update the cache directly for faster UI updates
      queryClient.setQueryData<MediaFile[]>([QueryKeys.media], (oldData) => {
        if (!oldData) return [];
        return oldData.filter(item => item._id !== data.id);
      });
      
      toast.success('Media deleted successfully');
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Error deleting media';
      toast.error(message);
    }
  });
};

// -- Media Types --
export const useMediaTypes = () => {
  return useQuery({
    queryKey: [QueryKeys.mediaTypes],
    queryFn: fetchMediaTypes,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
};

// New hook to get media types with usage counts
export const useMediaTypesWithUsageCounts = (userProfile: User | null | undefined) => {
  return useQuery({
    queryKey: [QueryKeys.mediaTypes, 'withUsageCounts'],
    queryFn: fetchMediaTypesWithUsageCounts,
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled: !!userProfile && (userProfile.role === 'admin' || userProfile.role === 'superAdmin')
  });
};

// Hook to check a specific media type's usage
export const useCheckMediaTypeUsage = (id: string) => {
  return useQuery({
    queryKey: [QueryKeys.mediaTypeUsage, id],
    queryFn: () => checkMediaTypeUsage(id),
    staleTime: 1 * 60 * 1000, // 1 minute
    enabled: !!id // Only run if id is provided
  });
};

// Hook to create a new media type
export const useCreateMediaType = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: createMediaType,
    onSuccess: () => {
      // Invalidate all media types queries to trigger refetch
      queryClient.invalidateQueries({ queryKey: [QueryKeys.mediaTypes] });
      toast.success('Media type created successfully');
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Error creating media type';
      toast.error(message);
    }
  });
};

// Hook to update a media type
export const useUpdateMediaType = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: updateMediaType,
    onSuccess: (updatedMediaType) => {
      // Invalidate all media types queries to trigger refetch
      queryClient.invalidateQueries({ queryKey: [QueryKeys.mediaTypes] });
      
      // Optionally update the cache directly
      queryClient.setQueryData<MediaType[]>([QueryKeys.mediaTypes], (oldData) => {
        if (!oldData) return [];
        return oldData.map(item => item._id === updatedMediaType._id ? updatedMediaType : item);
      });
      
      toast.success('Media type updated successfully');
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Error updating media type';
      toast.error(message);
    }
  });
};

// Hook to delete a media type
export const useDeleteMediaType = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: deleteMediaType,
    onSuccess: (id) => {
      // Invalidate all media types queries to trigger refetch
      queryClient.invalidateQueries({ queryKey: [QueryKeys.mediaTypes] });
      
      // Optionally update the cache directly
      queryClient.setQueryData<MediaType[]>([QueryKeys.mediaTypes], (oldData) => {
        if (!oldData) return [];
        return oldData.filter(item => item._id !== id);
      });
      
      toast.success('Media type deleted successfully');
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Error deleting media type';
      toast.error(message);
    }
  });
};

// Hook to archive a media type
export const useArchiveMediaType = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: archiveMediaType,
    onSuccess: (updatedMediaType) => {
      // Invalidate all media types queries to trigger refetch
      queryClient.invalidateQueries({ queryKey: [QueryKeys.mediaTypes] });
      
      // Optionally update the cache directly
      queryClient.setQueryData<MediaType[]>([QueryKeys.mediaTypes], (oldData) => {
        if (!oldData) return [];
        return oldData.map(item => item._id === updatedMediaType._id ? updatedMediaType : item);
      });
      
      toast.success('Media type archived successfully');
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Error archiving media type';
      toast.error(message);
    }
  });
};

// Hook to deprecate a media type
export const useDeprecateMediaType = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: deprecateMediaType,
    onSuccess: (updatedMediaType) => {
      // Invalidate all media types queries to trigger refetch
      queryClient.invalidateQueries({ queryKey: [QueryKeys.mediaTypes] });
      
      // Optionally update the cache directly
      queryClient.setQueryData<MediaType[]>([QueryKeys.mediaTypes], (oldData) => {
        if (!oldData) return [];
        return oldData.map(item => item._id === updatedMediaType._id ? updatedMediaType : item);
      });
      
      toast.success('Media type deprecated successfully');
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Error deprecating media type';
      toast.error(message);
    }
  });
};

// -- Media Detail --
export const useMediaDetail = (userProfile: User | null | undefined, slug: string | undefined) => {
  return useQuery<MediaFile>({
    queryKey: slug ? (slug.includes('-') ? QueryKeys.mediaBySlug(slug) : QueryKeys.mediaById(slug)) : ['media', 'unknown'],
    queryFn: () => fetchMediaBySlug(slug),
    enabled: !!userProfile && !!slug, // Check for userProfile and slug
    staleTime: 1000 * 60 * 10, // 10 minutes
    retry: (failureCount, error: any) => {
      // Don't retry if we get a 404 (not found)
      if (error.response?.status === 404) return false;
      // Only retry other errors a limited number of times
      return failureCount < 2;
    }
  });
};

export const useUpdateMedia = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: updateMediaItem,
    onMutate: async (updatedMedia) => {
      const mediaId = updatedMedia._id;
      if (!mediaId) return { previousMedia: null };
      
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: QueryKeys.mediaById(mediaId) });
      
      // Snapshot the previous media
      const previousMedia = queryClient.getQueryData<MediaFile>(QueryKeys.mediaById(mediaId));
      
      // Optimistically update the cache
      queryClient.setQueryData<MediaFile>(QueryKeys.mediaById(mediaId), old => {
        if (!old) return updatedMedia as MediaFile;
        
        // Create a merged version with old and new data
        return {
          ...old,
          ...updatedMedia,
          // For nested metadata, merge properly
          metadata: {
            ...old.metadata,
            ...(updatedMedia.metadata || {})
          }
        };
      });
      
      // If we have the media in the all media list, update it there too
      queryClient.setQueryData<MediaFile[]>(QueryKeys.allMedia, old => {
        if (!old) return [];
        
        // Make sure we're returning a properly typed array
        return old.map(item => {
          if (item._id === mediaId) {
            const updated = {
              ...item,
              ...updatedMedia,
              metadata: {
                ...item.metadata,
                ...(updatedMedia.metadata || {})
              }
            };
            // Ensure the item is properly typed as MediaFile
            return updated as MediaFile;
          }
          return item;
        });
      });
      
      return { previousMedia };
    },
    onError: (_err, variables, context) => {
      // If the mutation fails, revert the optimistic update
      if (context?.previousMedia && variables._id) {
        queryClient.setQueryData(QueryKeys.mediaById(variables._id), context.previousMedia);
        
        // Also revert in the all media list
        queryClient.setQueryData<MediaFile[]>(QueryKeys.allMedia, old => {
          if (!old) return [];
          
          // Ensure we're returning a properly typed array
          return old.map(item => {
            if (item._id === variables._id && context.previousMedia) {
              return context.previousMedia as MediaFile;
            }
            return item;
          });
        });
      }
      
      toast.error('Failed to update media');
    },
    onSuccess: (data) => {
      // Update all relevant queries
      queryClient.setQueryData(QueryKeys.mediaById(data._id), data);
      if (data.slug) {
        queryClient.setQueryData(QueryKeys.mediaBySlug(data.slug), data);
      }
      
      // Invalidate affected queries to ensure consistency
      queryClient.invalidateQueries({ queryKey: QueryKeys.allMedia });
      queryClient.invalidateQueries({ queryKey: QueryKeys.mediaByType(data.mediaType || '') });
      
      toast.success('Media updated successfully');
    }
  });
};

export const useApiHealth = () => {
  return useQuery({
    queryKey: ['apiHealth'],
    queryFn: checkApiHealth,
    retry: 2,
    staleTime: 60 * 1000, // 1 minute
    refetchOnWindowFocus: false
  });
};

// =====================
// === Admin Functions ===
// =====================

// -- Activity Logs --
export const fetchActivityLogs = async (limit = 20): Promise<any[]> => {
  const token = localStorage.getItem('authToken');
  if (!token) {
    throw new Error('Authentication token missing');
  }
  
  const response = await axios.get<{data: any[], success: boolean}>(`${env.BASE_URL}/api/admin/activity-logs`, {
    headers: {
      Authorization: `Bearer ${token}`
    },
    params: {
      limit
    }
  });
  
  if (process.env.NODE_ENV === 'development') {
    console.log(`Fetched ${response.data.data.length} activity logs`);
  }
  
  return response.data.data;
};

// -- User Activities --
export const fetchUserActivities = async (page = 1, limit = 10): Promise<{data: any[], total: number}> => {
  const token = localStorage.getItem('authToken');
  if (!token) {
    throw new Error('Authentication token missing');
  }
  
  const response = await axios.get<{data: any[], total: number, success: boolean}>(`${env.BASE_URL}/api/admin/user-activities`, {
    headers: {
      Authorization: `Bearer ${token}`
    },
    params: {
      page,
      limit
    }
  });
  
  if (process.env.NODE_ENV === 'development') {
    console.log(`Fetched ${response.data.data.length} user activities`);
  }
  
  return {
    data: response.data.data,
    total: response.data.total || response.data.data.length
  };
};

// -- Database Stats --
export const fetchDatabaseStats = async (): Promise<any> => {
  const token = localStorage.getItem('authToken');
  if (!token) {
    throw new Error('Authentication token missing');
  }
  
  const response = await axios.get<{data: any, success: boolean}>(`${env.BASE_URL}/api/admin/database-stats`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
  
  if (process.env.NODE_ENV === 'development') {
    console.log(`Fetched database stats`);
  }
  
  return response.data.data;
};

// =====================
// === Admin Query Hooks ===
// =====================

// -- Activity Logs --
export const useActivityLogs = (userProfile: User | null | undefined, limit = 20) => {
  return useQuery({
    queryKey: [QueryKeys.activityLogs, limit],
    queryFn: () => fetchActivityLogs(limit),
    staleTime: 60 * 1000, // 1 minute
    retry: 1,
    enabled: !!userProfile && (userProfile.role === 'admin' || userProfile.role === 'superAdmin')
  });
};

// -- User Activities --
export const useUserActivities = (userProfile: User | null | undefined, page = 1, limit = 10) => {
  return useQuery({
    queryKey: [QueryKeys.userActivities, page, limit],
    queryFn: () => fetchUserActivities(page, limit),
    staleTime: 60 * 1000, // 1 minute
    placeholderData: (prev) => prev,
    enabled: !!userProfile && (userProfile.role === 'admin' || userProfile.role === 'superAdmin')
  });
};

// -- Database Stats --
export const useDatabaseStats = (userProfile: User | null | undefined) => {
  return useQuery({
    queryKey: [QueryKeys.databaseStats],
    queryFn: fetchDatabaseStats,
    staleTime: 2 * 60 * 1000, // 2 minutes
    retry: 1,
    enabled: !!userProfile && (userProfile.role === 'admin' || userProfile.role === 'superAdmin')
  });
};

// =====================
// === Notification Settings API Functions ===
// =====================

// Fetch notification settings
export const fetchNotificationSettings = async (): Promise<any> => {
  const token = localStorage.getItem('authToken');
  if (!token) {
    throw new Error('Authentication token missing');
  }

  const response = await axios.get<{success: boolean, data: any}>(`${env.BASE_URL}/api/admin/notification-settings`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
  
  if (process.env.NODE_ENV === 'development') {
    console.log('Fetched notification settings:', response.data);
  }
  
  return response.data.data;
};

// Update notification settings
export const updateNotificationSettings = async (settings: any): Promise<any> => {
  const token = localStorage.getItem('authToken');
  if (!token) {
    throw new Error('Authentication token missing');
  }
  
  const response = await axios.put<{success: boolean, data: any}>(`${env.BASE_URL}/api/admin/notification-settings`, settings, {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });
  
  return response.data.data;
};

// Add a new notification rule
export const addNotificationRule = async (rule: any): Promise<any> => {
  const token = localStorage.getItem('authToken');
  if (!token) {
    throw new Error('Authentication token missing');
  }
  
  const response = await axios.post<{success: boolean, data: any}>(`${env.BASE_URL}/api/admin/notification-settings/rules`, rule, {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });
  
  return response.data.data;
};

// Update a notification rule
export const updateNotificationRule = async ({ ruleId, updates }: { ruleId: string, updates: any }): Promise<any> => {
  const token = localStorage.getItem('authToken');
  if (!token) {
    throw new Error('Authentication token missing');
  }
  
  const response = await axios.put<{success: boolean, data: any}>(`${env.BASE_URL}/api/admin/notification-settings/rules/${ruleId}`, updates, {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });
  
  return response.data.data;
};

// Delete a notification rule
export const deleteNotificationRule = async (ruleId: string): Promise<void> => {
  const token = localStorage.getItem('authToken');
  if (!token) {
    throw new Error('Authentication token missing');
  }
  
  await axios.delete(`${env.BASE_URL}/api/admin/notification-settings/rules/${ruleId}`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
};

// Get eligible recipients for notifications
export const fetchEligibleRecipients = async (): Promise<any[]> => {
  const token = localStorage.getItem('authToken');
  if (!token) {
    throw new Error('Authentication token missing');
  }
  
  const response = await axios.get<{success: boolean, data: any[]}>(`${env.BASE_URL}/api/admin/notification-settings/eligible-recipients`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
  
  return response.data.data;
};

// Send a test notification
export const sendTestNotification = async (recipients?: string[]): Promise<void> => {
  const token = localStorage.getItem('authToken');
  if (!token) {
    throw new Error('Authentication token missing');
  }
  
  await axios.post(`${env.BASE_URL}/api/admin/notification-settings/test`, 
    { recipients },
    {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    }
  );
};

// =====================
// === Notification Settings Query Hooks ===
// =====================

// Hook to fetch notification settings
export const useNotificationSettings = (userProfile: User | null | undefined) => {
  return useQuery({
    queryKey: [QueryKeys.notificationSettings],
    queryFn: fetchNotificationSettings,
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled: !!userProfile && (userProfile.role === 'admin' || userProfile.role === 'superAdmin')
  });
};

// Hook to update notification settings
export const useUpdateNotificationSettings = (_userProfile: User | null | undefined) => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: updateNotificationSettings,
    onSuccess: (_data) => {
      queryClient.invalidateQueries({ queryKey: [QueryKeys.notificationSettings] });
      toast.success('Notification settings updated successfully');
    },
    onError: (error: any) => {
      toast.error(`Failed to update notification settings: ${error.message}`);
    }
  });
};

// Hook to add a notification rule
export const useAddNotificationRule = (_userProfile: User | null | undefined) => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: addNotificationRule,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QueryKeys.notificationSettings] });
      toast.success('Notification rule added successfully');
    },
    onError: (error: any) => {
      toast.error(`Failed to add notification rule: ${error.message}`);
    }
  });
};

// Hook to update a notification rule
export const useUpdateNotificationRule = (_userProfile: User | null | undefined) => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: updateNotificationRule,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QueryKeys.notificationSettings] });
      toast.success('Notification rule updated successfully');
    },
    onError: (error: any) => {
      toast.error(`Failed to update notification rule: ${error.message}`);
    }
  });
};

// Hook to delete a notification rule
export const useDeleteNotificationRule = (_userProfile: User | null | undefined) => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: deleteNotificationRule,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QueryKeys.notificationSettings] });
      toast.success('Notification rule deleted successfully');
    },
    onError: (error: any) => {
      toast.error(`Failed to delete notification rule: ${error.message}`);
    }
  });
};

// Hook to fetch eligible recipients
export const useEligibleRecipients = (_userProfile: User | null | undefined) => {
  return useQuery({
    queryKey: [QueryKeys.eligibleRecipients],
    queryFn: fetchEligibleRecipients,
    staleTime: 10 * 60 * 1000, // 10 minutes
    enabled: !!_userProfile && (_userProfile.role === 'admin' || _userProfile.role === 'superAdmin')
  });
};

// Hook to send a test notification
export const useSendTestNotification = (_userProfile: User | null | undefined) => {
  return useMutation({
    mutationFn: sendTestNotification,
    onSuccess: () => {
      toast.success('Test notification sent successfully');
    },
    onError: (error: any) => {
      toast.error(`Failed to send test notification: ${error.message}`);
    }
  });
};

// ======================
// === User Query Hooks ===
// ======================

// Drastically simplified useUserProfile: No options, internal handlers only for now.
export const useUserProfile = () => {
  const hasToken = !!localStorage.getItem('authToken'); // Check token status

  // Original useQuery call
  const queryResult = useQuery<User, Error, User>({
    queryKey: QueryKeys.userProfile,
    queryFn: async () => {
      console.log('[useUserProfile] Fetching user profile. Current authToken:', localStorage.getItem('authToken'));
      return fetchUserProfile();
    },
    staleTime: 1000 * 60 * 15, 
    enabled: hasToken, // Query is enabled only if token exists
    retry: (failureCount: number, error: Error) => {
      if (error && typeof error === 'object' && 'response' in error && 
          (error as any).response && typeof (error as any).response.status === 'number') {
        if ((error as any).response.status === 401 || (error as any).response.status === 403) {
          if (process.env.NODE_ENV === 'development') {
            console.warn('Auth error in useUserProfile retry (401/403). Not retrying.');
          }
          return false;
        }
      }
      return failureCount < 2;
    },
    // Remove onSuccess and onError from here
  });

  // If there's no token, explicitly return a state indicating no user
  if (!hasToken) {
    return {
      ...queryResult, // Spread other properties like error, refetch, etc.
      data: undefined,
      isLoading: false, // Not loading if no token
      isSuccess: false, // Not successful if no token
      status: 'idle' as const, // Or 'error' if you prefer, but 'idle' seems fit if disabled
    };
  }

  return queryResult; // Return original result if token exists
};

export const useAllUsers = (options?: Omit<UseQueryOptions<User[], Error, User[], QueryKey>, 'queryKey' | 'queryFn'>) => {
  return useQuery<User[], Error, User[], QueryKey>({
    queryKey: QueryKeys.allUsers,
    queryFn: fetchAllUsers,
    staleTime: 1000 * 60 * 5, // 5 minutes
    ...options,
  });
};

export const useUpdateUserProfile = () => {
  const queryClient = useQueryClient();
  return useMutation<User, Error, Partial<User> & { _id: string }>({
    mutationFn: updateUserProfile,
    onSuccess: (updatedUser) => {
      queryClient.invalidateQueries({ queryKey: QueryKeys.userProfile });
      queryClient.setQueryData<User[]>(QueryKeys.allUsers, (oldData) => {
        if (!oldData) return [];
        return oldData.map(user => user._id === updatedUser._id ? updatedUser : user);
      });
      toast.success('Profile updated successfully!');
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || error.message || 'Failed to update profile.';
      toast.error(message);
    },
  });
};

// -- User API Functions --
export const fetchUserProfile = async (): Promise<User> => {
  const token = localStorage.getItem('authToken');
  if (!token) {
    throw new Error('Authentication token missing');
  }
  const response = await axios.get<User>(`${env.BASE_URL}/api/user/profile`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  // The response might be directly the user object, or nested under 'data' or 'user'
  // Adjust based on your actual API response structure
  // For now, assuming the response.data is the User object
  if (process.env.NODE_ENV === 'development') {
    console.log('Fetched user profile:', response.data);
  }
  return response.data;
};

export const fetchAllUsers = async (): Promise<User[]> => {
  const token = localStorage.getItem('authToken');
  if (!token) {
    throw new Error('Authentication token missing');
  }
  const response = await axios.get<User[]>(`${env.BASE_URL}/api/users`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  if (process.env.NODE_ENV === 'development') {
    console.log(`Fetched ${response.data.length} users`);
  }
  return response.data;
};

export const updateUserProfile = async (userData: Partial<User> & { _id: string }): Promise<User> => {
  const token = localStorage.getItem('authToken');
  if (!token) {
    throw new Error('Authentication token missing');
  }
  const { _id, ...updateData } = userData;
  const response = await axios.put<User>(`${env.BASE_URL}/api/users/${_id}`, updateData, {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });
  if (process.env.NODE_ENV === 'development') {
    console.log('Updated user profile:', response.data);
  }
  return response.data;
};

// === Auth API Functions ===

export const loginUser = async (credentials: UserLoginCredentials): Promise<AuthResponse> => {
  console.log("Logging in with:", credentials.email);
  const response = await axios.post<AuthResponse>(`${env.BASE_URL}/api/auth/login`, credentials);
  
  // Type assertion for response data
  const authData = response.data;
  
  // Store tokens in localStorage
  localStorage.setItem("authToken", authData.token);
  localStorage.setItem("refreshToken", authData.refreshToken);
  
  if (process.env.NODE_ENV === 'development') {
    console.log('Login successful, tokens stored. User data:', authData.user);
  }
  return authData;
};

export const registerUser = async (userData: UserRegistrationData): Promise<RegistrationResponse> => {
  console.log("Sending registration data:", userData);
  // Assuming the register endpoint returns a message, not full AuthResponse for immediate login
  // Based on authSlice, it expects { message: string }
  const response = await axios.post<RegistrationResponse>(`${env.BASE_URL}/api/auth/register`, userData);
  
  if (process.env.NODE_ENV === 'development') {
    console.log('Registration response:', response.data);
  }
  // If your API returns user and tokens on register and you want to auto-login:
  // 1. Change RegistrationResponse to AuthResponse
  // 2. Store tokens: localStorage.setItem("authToken", response.data.token); etc.
  // 3. The useRegister hook's onSuccess could then populate userProfile query
  return response.data; 
};

// === Auth Query Hooks ===

export const useLogin = () => {
  const queryClient = useQueryClient();
  return useMutation<AuthResponse, Error, UserLoginCredentials>({
    mutationFn: loginUser,
    onSuccess: (data) => {
      // Set the user profile data in the cache
      queryClient.setQueryData(QueryKeys.userProfile, data.user);
      // Invalidate to ensure freshness if other parts of user data might be stale,
      // though setQueryData often suffices for immediate UI update.
      queryClient.invalidateQueries({ queryKey: QueryKeys.userProfile });
      
      // Prefetch related data if user is admin/superAdmin
      if (data.user && (data.user.role === 'admin' || data.user.role === 'superAdmin')) {
        queryClient.prefetchQuery({ queryKey: QueryKeys.allUsers, queryFn: fetchAllUsers, staleTime: 1000 * 60 * 5 });
      }
      toast.success(data.message || 'Login successful!');
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || error.message || 'Login failed. Please check your credentials.';
      toast.error(message);
      // Optionally, clear user profile on certain auth errors if not handled by useUserProfile's own onError
      // For example, if a 401/403 still gets through here:
      // if (error.response?.status === 401 || error.response?.status === 403) {
      //   queryClient.removeQueries({ queryKey: QueryKeys.userProfile });
      // }
    },
  });
};

export const useRegister = () => {
  // const queryClient = useQueryClient(); // Not typically needed for register if not auto-logging in
  return useMutation<RegistrationResponse, Error, UserRegistrationData>({
    mutationFn: registerUser,
    onSuccess: (data) => {
      toast.success(data.message || 'Registration successful! Please check your email or try logging in.');
      // If registration immediately logs the user in (API returns user/token and loginUser stores it):
      // queryClient.setQueryData(QueryKeys.userProfile, data.user);
      // queryClient.invalidateQueries({ queryKey: QueryKeys.userProfile });
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || error.message || 'Registration failed. Please try again.';
      toast.error(message);
    },
  });
};

// New hook for transformed media data
export const useTransformedMedia = (userProfile: User | null | undefined, mediaTypeId: string = 'All') => {
  const queryFn = mediaTypeId === 'All' || !mediaTypeId
    ? fetchMedia
    : () => fetchMediaByType(mediaTypeId);

  const queryKey = mediaTypeId === 'All' || !mediaTypeId
    ? QueryKeys.allMedia
    : QueryKeys.mediaByType(mediaTypeId);
  
  // Ensure that the query key is always an array, even if QueryKeys.allMedia is already an array.
  const finalQueryKey = Array.isArray(queryKey) ? queryKey : [queryKey];

  return useQuery<MediaFile[], Error, TransformedMediaFile[]>({
    queryKey: finalQueryKey, // Use finalQueryKey
    queryFn: queryFn,
    staleTime: 1000 * 60 * 5, // 5 minutes
    refetchOnWindowFocus: false,
    enabled: !!userProfile, // Only enable if userProfile exists
    select: (data: MediaFile[]): TransformedMediaFile[] => {
      return data.map(media => ({
        ...media,
        id: media.id || media._id, // Ensure id for DataGrid
        displayTitle: media.title || media.metadata?.fileName || 'Untitled',
        thumbnailUrl: media.metadata?.v_thumbnail || media.location,
        // Ensure fileSize and modifiedDate are correctly typed (already handled in fetchMedia/fetchMediaByType)
        fileSize: typeof media.fileSize === 'number' ? media.fileSize : 0,
        modifiedDate: typeof media.modifiedDate === 'string' && media.modifiedDate.length > 0
                        ? media.modifiedDate
                        : new Date().toISOString(),
      }));
    },
  });
};

export const useAddMedia = () => {
  const queryClient = useQueryClient();
  // The mutation function now expects the already uploaded media data (MediaFile).
  // It doesn't perform an API call itself, as MediaUploader handles that.
  // Its main job is to update the client-side cache and provide feedback.
  return useMutation<MediaFile, Error, MediaFile>({
    mutationFn: async (newlyUploadedMedia: MediaFile) => {
      // This function is now primarily for cache updates and side effects.
      // The actual upload happened in MediaUploader.
      // We just return the data to be used in onSuccess.
      if (process.env.NODE_ENV === 'development') {
        console.log('useAddMedia mutationFn called with:', newlyUploadedMedia);
      }
      return newlyUploadedMedia;
    },
    onSuccess: (data: MediaFile) => {
      toast.success(`Media "${data.title || data.metadata?.fileName || 'New Media'}" processed successfully!`);
      
      // Invalidate queries to refetch media lists
      queryClient.invalidateQueries({ queryKey: QueryKeys.allMedia });
      if (data.mediaType) { // Assuming mediaType field holds the ID
        queryClient.invalidateQueries({ queryKey: QueryKeys.mediaByType(data.mediaType) });
      }
      // Also invalidate media types with usage counts as a new media item might change these counts
      queryClient.invalidateQueries({ queryKey: [QueryKeys.mediaTypes, 'withUsageCounts'] });

      // Optional: Optimistically update or directly set data in the cache
      // This can make the UI feel faster. Example for useTransformedMedia cache:
      const transformedNewItem: TransformedMediaFile = {
        ...data,
        id: data.id || data._id,
        displayTitle: data.title || data.metadata?.fileName || 'Untitled',
        thumbnailUrl: data.metadata?.v_thumbnail || data.location,
        // Ensure other fields for TransformedMediaFile are present if not directly on MediaFile
        fileSize: typeof data.fileSize === 'number' ? data.fileSize : 0,
        modifiedDate: typeof data.modifiedDate === 'string' && data.modifiedDate.length > 0
                        ? data.modifiedDate
                        : new Date().toISOString(),
      };

      // Update cache for useTransformedMedia (all media)
      queryClient.setQueryData<TransformedMediaFile[]>(QueryKeys.allMedia, (oldData) => {
        if (!oldData) return [transformedNewItem];
        // Add to start, or filter out if it somehow was already there (e.g. from another source)
        const filteredOldData = oldData.filter(item => item._id !== transformedNewItem._id);
        return [transformedNewItem, ...filteredOldData];
      });

      // Update cache for useTransformedMedia (specific media type)
      if (data.mediaType) {
        queryClient.setQueryData<TransformedMediaFile[]>(QueryKeys.mediaByType(data.mediaType), (oldData) => {
          if (!oldData) return [transformedNewItem];
          const filteredOldData = oldData.filter(item => item._id !== transformedNewItem._id);
          return [transformedNewItem, ...filteredOldData];
        });
      }

      if (process.env.NODE_ENV === 'development') {
        console.log('useAddMedia onSuccess: Cache updated for QueryKeys.allMedia and specific mediaType if available.');
      }
    },
    onError: (error: any) => {
      // This error is now less likely to be an API error from this mutation
      // but could be an error in the mutationFn logic or optimistic updates.
      const message = error.message || 'An error occurred while processing the new media.';
      toast.error(message);
      if (process.env.NODE_ENV === 'development') {
        console.error("Error in useAddMedia:", error);
      }
    },
  });
};

// ... existing useTransformedMedia, prefetchMediaDetail, useMediaByType, migrateMediaFiles, useMigrateMediaFiles ...

// ... User Query Hooks ...

// -- Tags and Tag Categories API Functions --
export const fetchTagCategories = async (): Promise<TagCategory[]> => {
  const token = localStorage.getItem('authToken');
  if (!token) {
    throw new Error('Authentication token missing');
  }
  const response = await axios.get<TagCategory[]>(`${env.BASE_URL}/api/tag-categories`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  if (process.env.NODE_ENV === 'development') {
    console.log(`Fetched ${response.data.length} tag categories`);
  }
  return response.data;
};

// Placeholder for fetchTags - THIS SECTION SHOULD BE REPLACED
// export const fetchTags = async (): Promise<Tag[]> => { ... };

// New fetchTags function - REPLACING THE PLACEHOLDER ABOVE
export const fetchTags = async (): Promise<Tag[]> => {
  const token = localStorage.getItem('authToken');
  if (!token) {
    throw new Error('Authentication token missing');
  }
  const response = await axios.get<Tag[]>(`${env.BASE_URL}/api/tags`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  if (process.env.NODE_ENV === 'development') {
    console.log(`Fetched ${response.data.length} tags`);
  }
  return response.data;
};

// New createTag function - ADDED HERE
export const createTag = async (tagName: string): Promise<Tag> => {
  const token = localStorage.getItem('authToken');
  if (!token) {
    throw new Error('Authentication token missing');
  }
  const response = await axios.post<Tag>(
    `${env.BASE_URL}/api/tags`,
    { name: tagName }, // Send name in the request body
    {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    }
  );
  if (process.env.NODE_ENV === 'development') {
    console.log('Created tag:', response.data);
  }
  return response.data;
};

// -- Tags and Tag Categories Hooks --
export const useTagCategories = (userProfile: User | null | undefined) => {
  return useQuery<TagCategory[], Error>({
    queryKey: [QueryKeys.tagCategories],
    queryFn: fetchTagCategories,
    staleTime: 1000 * 60 * 10, // 10 minutes
    enabled: !!userProfile,
  });
};

// useTags hook - ENSURING THIS IS CORRECTLY PLACED
export const useTags = (userProfile: User | null | undefined) => {
  return useQuery<Tag[], Error>({
    queryKey: [QueryKeys.tags],
    queryFn: fetchTags, // Uses the fetchTags function defined above
    staleTime: 1000 * 60 * 5, // 5 minutes
    enabled: !!userProfile, // Only fetch if userProfile exists
  });
};

// useCreateTag hook - ENSURING THIS IS CORRECTLY PLACED
export const useCreateTag = () => {
  const queryClient = useQueryClient();
  return useMutation<Tag, Error, string>({
    mutationFn: createTag, // Uses the createTag function defined above
    onSuccess: (newTag) => {
      queryClient.invalidateQueries({ queryKey: [QueryKeys.tags] });
      queryClient.setQueryData<Tag[]>([QueryKeys.tags], (oldTags = []) => [
        ...oldTags,
        newTag,
      ]);
      toast.success(`Tag "${newTag.name}" created successfully!`);
    },
    onError: (error: any) => {
      const message =
        error.response?.data?.message ||
        error.message ||
        'Failed to create tag. Please try again.';
      toast.error(message);
    },
  });
};

// ... existing useTransformedMedia, prefetchMediaDetail, useMediaByType, migrateMediaFiles, useMigrateMediaFiles ...

// ... User Query Hooks ...

// --- New: Fetch User by ID ---
export const fetchUserById = async (userId: string): Promise<User | null> => {
  if (!userId) {
    // Or throw an error, or return a specific object indicating no ID was provided
    console.warn('fetchUserById called without a userId');
    return null;
  }
  const token = localStorage.getItem('authToken');
  if (!token) {
    // Depending on whether this is a public or private route,
    // you might allow this or throw an error.
    // For now, let's assume it might be used for public profiles,
    // but usually, an API would handle auth internally.
    // Consider if a token is always required for /api/users/:userId
    // For consistency with other user fetches, let's require a token for now.
    // If a public version is needed, a separate endpoint/logic might be better.
    // throw new Error('Authentication token missing for fetchUserById');
  }
  try {
    // Expecting the API to return the User object directly
    const response = await axios.get<User>(`${env.BASE_URL}/api/users/${userId}`, {
      headers: {
        // Conditionally add Authorization header if token exists
        ...(token && { Authorization: `Bearer ${token}` }),
      },
    });
    return response.data;
  } catch (error: any) {
    console.error(`Error fetching user by ID (${userId}):`, error.response?.data?.message || error.message);
    // It's good practice to throw the error so React Query can handle it (e.g., set isError state)
    throw error;
  }
};

// React Query hook to get user by ID
export const useUserById = (userId: string | undefined) => {
  return useQuery<User | null, Error>({
    queryKey: QueryKeys.userById(userId || 'invalid_user_id'), // Ensure a valid string for queryKey
    queryFn: () => {
      if (!userId) {
        // Return a promise that resolves to null or rejects if userId is not available
        // This prevents the query from attempting to fetch with an undefined ID
        return Promise.resolve(null); 
      }
      return fetchUserById(userId);
    },
    enabled: !!userId, // Only run the query if userId is available
    staleTime: 1000 * 60 * 5, // 5 minutes
    retry: (failureCount, error: any) => {
      // Do not retry on 404 errors
      if (error.response?.status === 404) {
        return false;
      }
      // Standard retry for other errors (e.g., up to 2 times)
      return failureCount < 2;
    },
  });
};

// ... existing code ...

// API function to create a tag category
export const createTagCategory = async (data: NewTagCategoryData): Promise<TagCategory> => {
  const token = localStorage.getItem('authToken');
  if (!token) {
    throw new Error('Authentication token missing');
  }
  const response = await axios.post<TagCategory>(
    `${env.BASE_URL}/api/tag-categories`,
    data,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    }
  );
  if (process.env.NODE_ENV === 'development') {
    console.log('Created tag category:', response.data);
  }
  return response.data;
};

// Hook to create a tag category
export const useCreateTagCategory = () => {
  const queryClient = useQueryClient();
  return useMutation<TagCategory, Error, NewTagCategoryData>({
    mutationFn: createTagCategory,
    onSuccess: (newCategory) => {
      queryClient.invalidateQueries({ queryKey: [QueryKeys.tagCategories] });
      // Optionally, update cache directly
      queryClient.setQueryData<TagCategory[]>([QueryKeys.tagCategories], (oldCategories = []) => [
        ...oldCategories,
        newCategory,
      ]);
      toast.success(`Tag category "${newCategory.name}" created successfully!`);
    },
    onError: (error: any) => {
      const message =
        error.response?.data?.message ||
        error.message ||
        'Failed to create tag category.';
      toast.error(message);
    },
  });
};

// ... existing useTransformedMedia, prefetchMediaDetail, useMediaByType, migrateMediaFiles, useMigrateMediaFiles ...

// ... User Query Hooks ...

// ... existing code ...

// API function to send an invitation
export const sendInvitation = async (invitationData: InvitationData): Promise<InvitationResponse> => {
  const token = localStorage.getItem('authToken');
  if (!token) {
    throw new Error('Authentication token missing. You must be logged in to send invitations.');
  }
  const response = await axios.post<InvitationResponse>(
    `${env.BASE_URL}/api/invitations`,
    invitationData,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    }
  );
  if (process.env.NODE_ENV === 'development') {
    console.log('Invitation sent successfully:', response.data);
  }
  return response.data;
};

// Hook to send an invitation
export const useSendInvitation = () => {
  return useMutation<InvitationResponse, Error, InvitationData>({
    mutationFn: sendInvitation,
    onSuccess: (data) => {
      toast.success(data.message || 'Invitation sent successfully!');
    },
    onError: (error: any) => {
      const message =
        error.response?.data?.message ||
        error.message ||
        'Failed to send invitation. Please try again.';
      toast.error(message);
    },
  });
};

// ... existing useTransformedMedia, prefetchMediaDetail, useMediaByType, migrateMediaFiles, useMigrateMediaFiles ...

// ... User Query Hooks ...

// ... existing code ... 