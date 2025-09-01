const fs = require('fs');
const path = require('path');

// Create logs directory if it doesn't exist
const logDir = path.join(__dirname, '../logs');
if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
}

const requestLogger = (req, res, next) => {
    const start = Date.now();
    const timestamp = new Date().toISOString();
    
    // Log basic request info
    console.log(`[${timestamp}] ${req.method} ${req.originalUrl}`);
    
    // Log headers
    console.log('Headers:', JSON.stringify(req.headers, null, 2));
    
    // Log query parameters
    if (Object.keys(req.query).length > 0) {
        console.log('Query params:', JSON.stringify(req.query, null, 2));
    }
    
    // Log request body (for POST, PUT, PATCH)
    if (['POST', 'PUT', 'PATCH'].includes(req.method)) {
        console.log('Request body:', JSON.stringify(req.body, null, 2));
        
        // Save request to file for debugging
        const logFile = path.join(logDir, 'requests.log');
        const logEntry = `[${timestamp}] ${req.method} ${req.originalUrl}\n` +
                       `Headers: ${JSON.stringify(req.headers, null, 2)}\n` +
                       `Body: ${JSON.stringify(req.body, null, 2)}\n` +
                       '----------------------------------------\n';
        
        fs.appendFile(logFile, logEntry, (err) => {
            if (err) console.error('Error writing to request log:', err);
        });
    }
    
    // Log response time
    res.on('finish', () => {
        const duration = Date.now() - start;
        console.log(`[${timestamp}] ${req.method} ${req.originalUrl} - ${res.statusCode} (${duration}ms)`);
    });
    
    next();
};

module.exports = requestLogger;
