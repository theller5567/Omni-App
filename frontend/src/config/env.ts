// Environment configuration
const env = {
  // Use environment variable, fallback to localhost for development
  BASE_URL: import.meta.env.VITE_BASE_URL || 'http://localhost:5002',
  
  // Helper function to get proper API URL
  getApiUrl: (path: string): string => {
    const baseUrl = import.meta.env.VITE_BASE_URL || 'http://localhost:5002';
    
    // Handle paths differently based on environment
    if (baseUrl.includes('/.netlify/functions')) {
      // In Netlify Functions environment
      // Remove any leading slash from path
      const cleanPath = path.startsWith('/') ? path.substring(1) : path;
      
      // For Netlify Functions, don't add /api prefix
      return `${baseUrl}/auth/${cleanPath}`;
    } else {
      // In standard backend environment
      // Remove any leading slash from path
      const cleanPath = path.startsWith('/') ? path.substring(1) : path;
      
      // For standard backend, add /api prefix
      return `${baseUrl}/api/auth/${cleanPath}`;
    }
  }
};

export default env; 