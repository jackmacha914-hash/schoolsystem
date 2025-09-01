// List of allowed origins for CORS
const allowedOrigins = [
    // Development
    'http://localhost:5000',
    'http://127.0.0.1:5000',
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    'http://localhost:8000',
    'http://127.0.0.1:8000',
    'http://localhost:8080',
    'http://127.0.0.1:8080',
    
    // Production - Update these with your actual Render frontend URL after deployment
    'https://school-management-frontend.onrender.com',
    'http://school-management-frontend.onrender.com'
];

module.exports = {
    allowedOrigins
};
