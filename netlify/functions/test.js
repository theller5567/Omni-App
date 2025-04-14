// Simple test function with no dependencies
exports.handler = async (event, context) => {
  // CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json'
  };

  // Handle preflight
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ message: 'OK' })
    };
  }

  // Basic response for all HTTP methods
  try {
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        message: 'Function is working!',
        method: event.httpMethod,
        path: event.path,
        timestamp: new Date().toISOString(),
        env: {
          hasMongoUri: !!process.env.MONGODB_URI,
          hasJwtSecret: !!process.env.JWT_SECRET,
          nodeEnv: process.env.NODE_ENV
        },
        // Return a test user token
        token: 'test-token-123',
        user: {
          id: 'test123',
          email: 'test@example.com',
          firstName: 'Test',
          lastName: 'User',
          role: 'user'
        }
      })
    };
  } catch (error) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        message: 'Error in function',
        error: error.message
      })
    };
  }
}; 