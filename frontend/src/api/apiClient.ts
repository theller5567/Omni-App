import axios from 'axios';
import env from '../config/env';

// Create axios instance with default config
const apiClient = axios.create({
  baseURL: `${env.BASE_URL}/api`,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - add auth token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - handle token refresh
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    
    // If 401 error and not already retrying
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        // Try refreshing token
        const refreshToken = localStorage.getItem('refreshToken');
        
        if (!refreshToken) {
          // No refresh token available
          throw new Error('No refresh token');
        }
        
        // Align with backend: POST /auth/refresh-token expects { refreshToken } and returns { accessToken }
        const response = await axios.post(`${env.BASE_URL}/api/auth/refresh-token`, { refreshToken });
        
        const { accessToken } = response.data as { accessToken: string };
        localStorage.setItem('authToken', accessToken);
        
        // Retry original request with new token
        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        }
        return apiClient(originalRequest);
      } catch (refreshError) {
        // Refresh failed, handle logout + soft redirect to auth page
        localStorage.removeItem('authToken');
        localStorage.removeItem('refreshToken');
        if (typeof window !== 'undefined') {
          const path = window.location.pathname;
          if (path !== '/' && !path.startsWith('/accept-invitation')) {
            window.location.href = '/';
          }
        }
        return Promise.reject(refreshError);
      }
    }
    
    return Promise.reject(error);
  }
);

export default apiClient;