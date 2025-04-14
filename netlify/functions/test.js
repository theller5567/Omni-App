// Ultra simple test function with no dependencies
exports.handler = async (event, context) => {
  // Set headers for CORS
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
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
    // Return a simple success response
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        message: 'Netlify Function is working!',
        timestamp: new Date().toISOString(),
        method: event.httpMethod,
        path: event.path,
        envCheck: {
          hasMongoUri: !!process.env.MONGODB_URI,
          hasJwtSecret: !!process.env.JWT_SECRET,
          hasMyAwsRegion: !!process.env.MY_AWS_REGION
        },
        token: 'test-token-' + Date.now(),
        user: {
          id: 'test-user-123',
          email: 'test@example.com',
          firstName: 'Test',
          lastName: 'User',
          role: 'user'
        }
      })
    };
  } catch (error) {
    // Return any errors
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        message: 'Error in function',
        error: error.message,
        stack: error.stack
      })
    };
  }
}; 