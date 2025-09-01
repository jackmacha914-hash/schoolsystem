// Override the MIME module to prevent the 'Mime is not a constructor' error
const mime = require('mime');

// Create a simple MIME type lookup function
const getMimeType = (path) => {
  return mime.getType(path) || 'application/octet-stream';
};

// Export the patched functions
module.exports = {
  getType: getMimeType,
  getExtension: mime.getExtension,
  default_type: 'application/octet-stream'
};

// Patch the original mime module
module.exports.define = mime.define;
module.exports.Mime = mime.Mime;
