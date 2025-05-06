import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
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
  }
  
  return response.data;
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
    const response = await axios.get<any>(`${env.BASE_URL}/api/media-types`, {
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

// ======================
// === React Query Hooks ===
// ======================

// -- Media --
export const useMedia = () => {
  return useQuery({
    queryKey: [QueryKeys.media],
    queryFn: fetchMedia,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
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

// -- Media Detail --
export const useMediaDetail = (slug: string | undefined) => {
  return useQuery({
    queryKey: [QueryKeys.mediaDetail, slug],
    queryFn: () => fetchMediaBySlug(slug),
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled: !!slug, // Only run if slug is provided
  });
};

export const useUpdateMedia = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: updateMediaItem,
    onSuccess: (data) => {
      // Invalidate both the detail query and the media list query
      queryClient.invalidateQueries({ queryKey: [QueryKeys.mediaDetail, data.slug] });
      queryClient.invalidateQueries({ queryKey: [QueryKeys.media] });
      
      // Optionally, directly update the cache
      queryClient.setQueryData([QueryKeys.mediaDetail, data.slug], data);
      
      // Remove toast notification - it's handled in the component
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Error updating media';
      // Remove toast notification - it's handled in the component
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
export const useActivityLogs = (limit = 20) => {
  return useQuery({
    queryKey: [QueryKeys.activityLogs, limit],
    queryFn: () => fetchActivityLogs(limit),
    staleTime: 60 * 1000, // 1 minute
    retry: 1
  });
};

// -- User Activities --
export const useUserActivities = (page = 1, limit = 10) => {
  return useQuery({
    queryKey: [QueryKeys.userActivities, page, limit],
    queryFn: () => fetchUserActivities(page, limit),
    staleTime: 60 * 1000, // 1 minute
    placeholderData: (prev) => prev
  });
};

// -- Database Stats --
export const useDatabaseStats = () => {
  return useQuery({
    queryKey: [QueryKeys.databaseStats],
    queryFn: fetchDatabaseStats,
    staleTime: 2 * 60 * 1000, // 2 minutes
    retry: 1
  });
}; 