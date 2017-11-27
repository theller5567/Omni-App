
const express = require('express');
const path = require('path');
const http = require('http');
const app = express();
var mongoose = require('mongoose');
const db = "mongodb://theller5567:Noel1124#$@ds147377.mlab.com:47377/heroku_pwwmd9c8";
const productsApi = require('./server/routes/api');

mongoose.Promise = global.Promise;
const options = {
    useMongoClient: true
}
mongoose.connect(db, options, function (err) {
    if (err) {
        console.log('Connection Error');
    }
});

// Setup the app middleweare
require('./server/middleware/appMiddlewware.js')(app);
// serve static files
app.use(express.static(path.join(__dirname, 'dist')));

// Set up the API
app.use('/api/products/', productsApi);

app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'dist/index.html'));
});

const port = process.env.PORT || '3000';
app.set('port', port);

const server = http.createServer(app);

server.listen(port, () => console.log('running on localhost:' + port));