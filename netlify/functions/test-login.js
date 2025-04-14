// A simple test login page
exports.handler = async (event, context) => {
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
        <title>Test Login - Omni App</title>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body {
            font-family: sans-serif;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            line-height: 1.6;
          }
          .container {
            background: #f5f5f5;
            border: 1px solid #ddd;
            padding: 20px;
            border-radius: 5px;
          }
          button {
            background-color: #4CAF50;
            border: none;
            color: white;
            padding: 10px 20px;
            text-align: center;
            cursor: pointer;
            font-size: 16px;
            margin: 10px 0;
            border-radius: 4px;
          }
          input {
            padding: 8px;
            margin: 8px 0;
            display: block;
            border: 1px solid #ccc;
            width: 100%;
            border-radius: 4px;
            box-sizing: border-box;
          }
          pre {
            background: #f0f0f0;
            padding: 10px;
            overflow: auto;
            border-radius: 4px;
          }
          .success { color: green; }
          .error { color: red; }
        </style>
      </head>
      <body>
        <h1>Test Login</h1>
        <p>This is a simple test page to verify the function is working</p>
        
        <div class="container">
          <button id="testButton">Test Authentication</button>
          <div id="status"></div>
          <pre id="result"></pre>
        </div>

        <script>
          document.getElementById('testButton').addEventListener('click', async () => {
            const statusEl = document.getElementById('status');
            const resultEl = document.getElementById('result');
            
            statusEl.textContent = 'Testing...';
            statusEl.className = '';
            
            try {
              // Call the test function
              const response = await fetch('/.netlify/functions/test', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                  email: 'test@example.com', 
                  password: 'password123' 
                })
              });
              
              const data = await response.json();
              
              // Display the result
              resultEl.textContent = JSON.stringify(data, null, 2);
              
              if (response.ok) {
                statusEl.textContent = 'Success!';
                statusEl.className = 'success';
                
                // Store the test token
                localStorage.setItem('authToken', data.token);
                
                // Provide a button to continue to the app
                const continueBtn = document.createElement('button');
                continueBtn.textContent = 'Continue to App';
                continueBtn.onclick = () => { window.location.href = '/home'; };
                document.querySelector('.container').appendChild(continueBtn);
                
              } else {
                statusEl.textContent = 'Error: ' + (data.message || 'Unknown error');
                statusEl.className = 'error';
              }
            } catch (error) {
              statusEl.textContent = 'Error: ' + error.message;
              statusEl.className = 'error';
              resultEl.textContent = error.toString();
            }
          });
        </script>
      </body>
      </html>
    `
  };
}; 