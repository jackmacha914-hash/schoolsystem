const debug = require('debug')('app:debug');

module.exports = function debugRequest(req, res, next) {
    console.log('\n=== Debug Request ===');
    console.log('Request URL:', req.url);
    console.log('Request Method:', req.method);
    console.log('Request Headers:', req.headers);
    console.log('Request Content-Type:', req.headers['content-type']);
    
    // Log request body if available
    if (req.body) {
        console.log('Request Body:', req.body);
    }

    // Log file information if available
    if (req.file) {
        console.log('Request File:', req.file);
    }

    // Log files array if available
    if (req.files) {
        console.log('Request Files:', req.files);
    }

    // Log raw request data
    let body = '';
    req.on('data', chunk => {
        body += chunk.toString();
    });

    req.on('end', () => {
        console.log('Raw Request Body:', body);
        next();
    });
};
