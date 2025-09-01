console.log('__dirname at startup:', __dirname);

// --- MONGODB CONNECTION ---
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables from .env file
dotenv.config({ path: path.resolve(__dirname, '.env') });

// Use MONGODB_URI from environment variables
const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/school_management';

// Log the MongoDB connection URI (without password for security)
console.log('Connecting to MongoDB...');

// MongoDB connection options
const mongoOptions = {
  useNewUrlParser: true,
  useUnifiedTopology: true
};

// Connect to MongoDB
mongoose.connect(mongoURI, mongoOptions)
  .then(() => console.log('✅ MongoDB connected'))
  .catch(err => console.error('❌ MongoDB connection error:', err));

const express = require('express');
const multer = require('multer');
const cors = require('cors');
const rateLimit = require('express-rate-limit');

// Initialize Express app
const app = express();

// Create uploads directories if they don't exist
const uploadsDir = path.join(__dirname, 'uploads');
const profilePhotosDir = path.join(uploadsDir, 'profile-photos');

// Ensure directories exist
[uploadsDir, profilePhotosDir].forEach(dir => {
  if (!require('fs').existsSync(dir)) {
    require('fs').mkdirSync(dir, { recursive: true });
  }
  console.log(`Directory exists: ${dir}`);
});

// Serve static files with proper headers
const staticOptions = {
  etag: true,
  lastModified: true,
  setHeaders: (res, filePath) => {
    // Set cache control headers for images
    if (/\.(jpg|jpeg|png|gif|webp)$/i.test(path.extname(filePath))) {
      res.setHeader('Cache-Control', 'public, max-age=31536000');
    }
  }
};

// Serve files from the uploads directory
app.use('/uploads', (req, res, next) => {
  // Set CORS headers
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  next();
}, express.static(path.join(__dirname, 'uploads'), staticOptions));

// Also serve files directly from the profile-photos directory
app.use('/uploads/profile-photos', (req, res, next) => {
  // Set CORS headers
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  next();
}, express.static(path.join(__dirname, 'uploads', 'profile-photos'), staticOptions));

// Enable CORS
app.use(cors({
    origin: [
        'http://localhost:8000',
        'http://127.0.0.1:8000',
        'http://localhost:64197',
        'http://127.0.0.1:64197',
        'http://localhost',
        'http://127.0.0.1'
    ],
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true,
}));

// Serve static assets (css, js, images) from /css and /js
app.use('/css', express.static(path.join(__dirname, '../frontend/css')));
app.use('/js', express.static(path.join(__dirname, '../frontend/js')));

// Serve static files from uploads directories
app.use('/uploads/resources', express.static(path.join(__dirname, 'uploads/resources')));
app.use('/uploads/report-cards', express.static(path.join(__dirname, 'uploads/report-cards')));
app.use('/uploads/assignments', express.static(path.join(__dirname, 'uploads/assignments')));
app.use('/uploads/homeworks', express.static(path.join(__dirname, 'uploads/homeworks')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Serve static HTML pages from /frontend/pages
app.use(express.static(path.join(__dirname, '../frontend/pages')));

// Log all incoming requests for debugging static file issues
app.use((req, res, next) => {
  console.log('Request:', req.method, req.url);
  next();
});

// Home route
app.get('/', (req, res) => {
    const resolvedPath = path.join(__dirname, '../frontend/pages/index.html');
    console.log('Serving index.html from:', resolvedPath);
    res.sendFile(resolvedPath);
});

// Apply JSON and URL-encoded body parsers to all API routes
app.use('/api', [
    express.json({ limit: '50mb' }),
    express.urlencoded({ extended: true, limit: '50mb' })
]);

// Import and use test routes
const testRoutes = require('./test-routes');
app.use('/api', testRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Error:', err);
    
    // Handle JWT authentication errors
    if (err.name === 'JsonWebTokenError') {
        return res.status(401).json({
            success: false,
            message: 'Invalid token',
            error: process.env.NODE_ENV === 'development' ? err.message : undefined
        });
    }
    
    // Handle validation errors
    if (err.name === 'ValidationError') {
        return res.status(400).json({
            success: false,
            message: 'Validation error',
            error: process.env.NODE_ENV === 'development' ? err.message : undefined,
            errors: err.errors
        });
    }
    
    // Handle other errors
    res.status(err.status || 500).json({
        success: false,
        message: err.message || 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
});

// 404 handler for API routes
app.use('/api/*', (req, res) => {
    res.status(404).json({
        success: false,
        message: 'API endpoint not found',
        path: req.originalUrl
    });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log(`Test the API at http://localhost:${PORT}/api/test`);
});

module.exports = app;
