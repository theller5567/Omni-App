// A very simple test login page
exports.handler = async (event, context) => {
  const headers = {
    'Content-Type': 'text/html',
    'Cache-Control': 'no-cache',
    'Access-Control-Allow-Origin': '*'
  };

  return {
    statusCode: 200,
    headers,
    body: `<!DOCTYPE html>
<html>
<head>
  <title>Omni App - Simple Test</title>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body {
      font-family: Arial, sans-serif;
      background-color: white;
      color: black;
      max-width: 600px;
      margin: 20px auto;
      padding: 20px;
    }
    h1 {
      color: #333;
      border-bottom: 1px solid #ddd;
      padding-bottom: 10px;
    }
    .test-button {
      background-color: #4CAF50;
      color: white;
      border: none;
      padding: 10px 15px;
      font-size: 16px;
      cursor: pointer;
      border-radius: 4px;
    }
    #result {
      margin-top: 20px;
      padding: 10px;
      background-color: #f5f5f5;
      border: 1px solid #ddd;
      border-radius: 4px;
      white-space: pre-wrap;
    }
    .success { color: green; font-weight: bold; }
    .error { color: red; font-weight: bold; }
  </style>
</head>
<body>
  <h1>Omni App - Simple Test Page</h1>
  <p>This page tests if Netlify Functions are working correctly.</p>
  
  <button class="test-button" id="testButton">Test Function</button>
  <div id="status"></div>
  <div id="result"></div>

  <script>
    document.getElementById('testButton').addEventListener('click', async () => {
      const statusEl = document.getElementById('status');
      const resultEl = document.getElementById('result');
      
      statusEl.textContent = 'Testing...';
      statusEl.className = '';
      
      try {
        resultEl.textContent = 'Making request to /.netlify/functions/test...';
        
        const response = await fetch('/.netlify/functions/test', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ test: true })
        });
        
        const text = await response.text();
        let data;
        
        try {
          data = JSON.parse(text);
          resultEl.textContent = JSON.stringify(data, null, 2);
        } catch (e) {
          resultEl.textContent = 'Received non-JSON response: ' + text;
        }
        
        if (response.ok) {
          statusEl.textContent = 'Function works! Status: ' + response.status;
          statusEl.className = 'success';
          
          if (data && data.token) {
            localStorage.setItem('authToken', data.token);
            
            const continueBtn = document.createElement('button');
            continueBtn.textContent = 'Continue to App';
            continueBtn.className = 'test-button';
            continueBtn.style.marginTop = '10px';
            continueBtn.onclick = () => { window.location.href = '/home'; };
            document.body.appendChild(continueBtn);
          }
        } else {
          statusEl.textContent = 'Error: Status ' + response.status;
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
</html>`
  };
}; 