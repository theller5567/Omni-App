// Simple auth function that doesn't use MongoDB
exports.handler = async (event, context) => {
  // CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json'
  };

  // Handle preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ message: 'OK' })
    };
  }

  try {
    // Accept any email/password - this is just for testing
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        token: 'test-jwt-token-' + Date.now(),
        refreshToken: 'test-refresh-token-' + Date.now(),
        user: {
          id: 'user-123',
          firstName: 'Demo',
          lastName: 'User',
          email: 'demo@example.com',
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