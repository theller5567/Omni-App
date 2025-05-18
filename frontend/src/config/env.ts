// Environment configuration
const env = {
  // Use environment variable, fallback to localhost for development
  BASE_URL: import.meta.env.VITE_BASE_URL || 'http://127.0.0.1:5002'
};

export default env; 