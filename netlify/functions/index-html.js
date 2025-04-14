// Super simple HTML page
exports.handler = async (event, context) => {
  return {
    statusCode: 200, 
    headers: {
      'Content-Type': 'text/html',
    },
    body: `
      <html>
        <head>
          <title>Basic Test</title>
          <style>
            body { 
              font-family: sans-serif; 
              padding: 20px; 
              background: white; 
              color: black;
            }
          </style>
        </head>
        <body>
          <h1>This is a basic test page</h1>
          <p>If you can see this, the function is working correctly.</p>
          <button onclick="testApi()">Test API</button>
          <div id="result" style="margin-top: 20px; padding: 10px; background: #f0f0f0;"></div>
          
          <script>
            function testApi() {
              document.getElementById('result').innerText = 'Testing...';
              
              fetch('/.netlify/functions/hello')
                .then(response => response.json())
                .then(data => {
                  document.getElementById('result').innerText = JSON.stringify(data, null, 2);
                })
                .catch(error => {
                  document.getElementById('result').innerText = 'Error: ' + error.message;
                });
            }
          </script>
        </body>
      </html>
    `
  };
}; 