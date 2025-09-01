const { allowedOrigins } = require('../config/cors');

const corsMiddleware = (req, res, next) => {
    const origin = req.headers.origin;
    
    // Log the request for debugging
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
    console.log('Origin:', origin);
    console.log('Method:', req.method);
    
    // Always set Vary header to avoid caching CORS responses
    res.header('Vary', 'Origin');
    
    // Check if the request origin is in the allowed origins
    if (origin && allowedOrigins.includes(origin)) {
        // For requests with credentials, we must specify the exact origin
        res.header('Access-Control-Allow-Origin', origin);
        res.header('Access-Control-Allow-Credentials', 'true');
        
        // For preflight requests
        if (req.method === 'OPTIONS') {
            res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
            res.header(
                'Access-Control-Allow-Headers',
                'Content-Type, Authorization, x-auth-token, X-Requested-With, Cache-Control, cache-control'
            );
            res.header('Access-Control-Expose-Headers', 'Content-Length,Content-Range');
            res.header('Access-Control-Max-Age', '86400'); // 24 hours
            return res.status(204).end();
        }
    } else if (origin) {
        // Origin not allowed
        console.warn('CORS: Blocked request from origin:', origin);
        return res.status(403).json({ message: 'Not allowed by CORS' });
    }
    
    // For non-CORS requests or allowed origins, continue
    next();
};

// Export a function that returns the middleware for app.use()
module.exports = corsMiddleware;

module.exports = corsMiddleware;
