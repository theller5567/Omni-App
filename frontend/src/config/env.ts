// Environment configuration
const env = {
  // Use environment variable, fallback to localhost for development
  BASE_URL: import.meta.env.VITE_BASE_URL || 'http://localhost:5002'
};

export default env; 