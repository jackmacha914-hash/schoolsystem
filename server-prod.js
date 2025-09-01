// Production server entry point
const path = require('path');

// Patch MIME module before anything else loads it
const mime = require('mime');
const Mime = require('mime/Mime');
mime.Mime = Mime;

// Now require the actual server
const server = require('./backend/server');

// Start the server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
