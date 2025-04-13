// A simple HTML login form that posts directly to the auth function
exports.handler = async (event, context) => {
  // CORS headers
  const headers = {
    'Content-Type': 'text/html',
    'Access-Control-Allow-Origin': '*'
  };

  return {
    statusCode: 200,
    headers,
    body: `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Login - Omni App</title>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            padding: 2rem;
            max-width: 500px;
            margin: 0 auto;
            background-color: #f5f5f5;
            color: #333;
          }
          h1 { margin-bottom: 2rem; color: #2c3e50; }
          .form-group { margin-bottom: 1rem; }
          label { display: block; margin-bottom: 0.5rem; font-weight: 500; }
          input {
            width: 100%;
            padding: 0.75rem;
            border: 1px solid #ddd;
            border-radius: 4px;
            font-size: 1rem;
          }
          button {
            background-color: #3498db;
            color: white;
            border: none;
            padding: 0.75rem 1.5rem;
            font-size: 1rem;
            border-radius: 4px;
            cursor: pointer;
            margin-top: 1rem;
          }
          button:hover { background-color: #2980b9; }
          .message { color: #e74c3c; margin-top: 1rem; }
          .success { color: #27ae60; }
          .note { 
            background-color: #f8f9fa;
            border-left: 4px solid #3498db;
            padding: 1rem;
            margin: 1rem 0;
            font-size: 0.9rem;
          }
        </style>
      </head>
      <body>
        <h1>Omni App Login</h1>
        <div class="note">
          <strong>Test Account:</strong> You can use <code>test@example.com</code> with password <code>password123</code> for testing.
        </div>
        <div id="message"></div>
        <form id="loginForm">
          <div class="form-group">
            <label for="email">Email:</label>
            <input type="email" id="email" name="email" required>
          </div>
          <div class="form-group">
            <label for="password">Password:</label>
            <input type="password" id="password" name="password" required>
          </div>
          <button type="submit">Log In</button>
        </form>

        <script>
          document.getElementById('loginForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const messageEl = document.getElementById('message');
            messageEl.innerHTML = 'Logging in...';
            messageEl.className = '';
            
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            
            try {
              // Direct API call to the auth function
              const response = await fetch('/.netlify/functions/auth', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
              });
              
              const data = await response.json();
              
              if (response.ok) {
                // Login successful
                messageEl.innerHTML = 'Login successful! Redirecting...';
                messageEl.className = 'success';
                
                // Store tokens
                localStorage.setItem('authToken', data.token);
                if (data.refreshToken) {
                  localStorage.setItem('refreshToken', data.refreshToken);
                }
                
                // Redirect to home page after a brief delay
                setTimeout(() => {
                  window.location.href = '/home';
                }, 1000);
              } else {
                // Login failed
                messageEl.innerHTML = data.message || 'Login failed';
                messageEl.className = 'message';
              }
            } catch (error) {
              console.error('Login error:', error);
              messageEl.innerHTML = 'An error occurred during login';
              messageEl.className = 'message';
            }
          });
        </script>
      </body>
      </html>
    `
  };
}; 