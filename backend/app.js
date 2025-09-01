console.log('__dirname at startup:', __dirname);

// Load config
const config = require('config');

// --- MONGODB CONNECTION ---
const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

const mongoURI = process.env.MONGODB_URI || config.get('mongoURI');

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
const path = require('path');
const { protect } = require('./middleware/auth');
const corsConfig = require('./config/cors');
const authRoutes = require('./routes/authRoutes');
const assignmentRoutes = require('./routes/assignmentRoutes');
const homeworkRoutes = require('./routes/homeworkRoutes');
const gradeRoutes = require('./routes/gradesRoutes');
const announcementRoutes = require('./routes/announcementRoutes');
const attendanceRoutes = require('./routes/attendanceRoutes');
const studentRoutes = require('./routes/studentRoutes');
const profileRoutes = require('./routes/profileRoutes');
const resourceRoutes = require('./routes/resourceRoutes');
// Temporarily disabled report card routes to avoid Puppeteer dependency
// const reportCardRoutes = require('./routes/reportCardRoutes');
const clubRoutes = require('./routes/clubs');
const bookRoutes = require('./routes/books');
const eventRoutes = require('./routes/events');
const accountRoutes = require('./routes/accounts');
const statsRoutes = require('./routes/stats');
const schoolUserRoutes = require('./routes/schoolUserRoutes');
const backupsRoutes = require('./routes/backups');
const feesRoutes = require('./routes/fees');
const libraryRoutes = require('./routes/library');
const roleRoutes = require('./routes/roles');
const quizRoutes = require('./routes/quizRoutes');
const classRoutes = require('./routes/class');
const marksRoutes = require('./routes/marksRoutes');
const userRoutes = require('./routes/userRoutes');
const bypassAuth = require('./middleware/publicRoutes');

// Debug: Log the quiz routes to ensure they're properly imported
console.log('Quiz routes loaded:', quizRoutes.stack ? 'Yes' : 'No');
if (quizRoutes.stack) {
    console.log('Available quiz routes:');
    quizRoutes.stack.forEach(route => {
        if (route.route && route.route.path) {
            console.log(`- ${Object.keys(route.route.methods).join(', ').toUpperCase()} ${route.route.path}`);
        }
    });
}

// Initialize Express app
const app = express();

// Request logging middleware
const requestLogger = require('./middleware/requestLogger');
app.use(requestLogger);

// CORS configuration
const corsOptions = {
  origin: function (origin, callback) {
    if (!origin || corsConfig.allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  optionsSuccessStatus: 200,
  allowedHeaders: ['Content-Type', 'Authorization', 'Cache-Control', 'Pragma', 'x-auth-token', 'X-Requested-With'],
  exposedHeaders: ['Content-Range', 'X-Content-Range'],
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS']
};

// Enable CORS pre-flight across all routes
app.options('*', cors(corsOptions));
app.use(cors(corsOptions));

// Log requests for debugging
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
  console.log('Headers:', req.headers);
  console.log('Body:', req.body);
  next();
});

// Global middleware for JSON and URL encoding
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Only use express.json() and express.urlencoded() for non-multipart routes!
// Remove or comment out global express.json and express.urlencoded for file upload compatibility
// app.use(express.json());

// Configure static file serving
const uploadsDir = path.join(__dirname, 'uploads');
const profilePhotosDir = path.join(uploadsDir, 'profile-photos');
const reportCardsDir = path.join(__dirname, '..', 'frontend', 'public', 'uploads', 'report-cards');

// Ensure directories exist
[uploadsDir, profilePhotosDir, reportCardsDir].forEach(dir => {
  if (!require('fs').existsSync(dir)) {
    require('fs').mkdirSync(dir, { recursive: true });
    console.log(`Created directory: ${dir}`);
  }
});

// Log directory paths for debugging
console.log('Uploads directory:', uploadsDir);
console.log('Report cards directory:', reportCardsDir);

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

// Serve static files from the public directory
app.use((req, res, next) => {
  // Log all requests for debugging
  console.log('Request URL:', req.url);
  next();
});

// Serve report cards from the public directory
app.use('/report-cards', express.static(
  path.join(__dirname, 'public', 'uploads', 'report-cards'),
  staticOptions
));

// Serve other uploads from the public directory
app.use('/uploads', express.static(
  path.join(__dirname, 'public', 'uploads'),
  staticOptions
));

// Serve homework uploads from the uploads/homeworks directory
app.use('/uploads/homeworks', express.static(
  path.join(__dirname, 'uploads', 'homeworks'),
  staticOptions
));

// Import CORS middleware and config
const corsMiddleware = require('./middleware/cors');
const { allowedOrigins } = require('./config/cors');

// Apply CORS middleware
app.use(corsMiddleware);

// Log all requests for debugging
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
    console.log('Origin:', req.headers.origin);
    console.log('Method:', req.method);
    next();
});

// Middleware to serve static files with CORS
const serveStaticWithCors = (path, options = {}) => {
    return [
        corsMiddleware, // Use our custom CORS middleware
        express.static(path, { ...staticOptions, ...options })
    ];
};

// Serve files from the profile-photos directory with CORS
app.use('/uploads/profile-photos', ...serveStaticWithCors(path.join(__dirname, 'uploads', 'profile-photos')));

// Serve report cards from the frontend public directory with CORS
// Temporarily disabled report card static files
// app.use('/uploads/report-cards', ...serveStaticWithCors(reportCardsDir));

// Serve static assets (css, js, images) from /css and /js
app.use('/css', express.static(path.join(__dirname, '../frontend/css')));
app.use('/js', express.static(path.join(__dirname, '../frontend/js')));

// Optionally serve favicon if you have one
// app.use('/favicon.ico', express.static(path.join(__dirname, '../frontend/favicon.ico')));

// Serve static files from uploads directories
app.use('/uploads/resources', express.static(path.join(__dirname, 'uploads/resources')));
// Temporarily disabled report card static files
// app.use('/uploads/report-cards', express.static(path.join(__dirname, 'uploads/report-cards')));
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

app.get('/', (req, res) => {
    const resolvedPath = path.join(__dirname, '../frontend/pages/index.html');
    console.log('Serving index.html from:', resolvedPath);
    res.sendFile(resolvedPath);
});

// Use body parsers only for specific routes that do not handle file uploads
app.use('/api/auth', express.json(), express.urlencoded({ extended: true }), authRoutes);
app.use('/api/grades', express.json(), express.urlencoded({ extended: true }), gradeRoutes);
app.use('/api/announcements', express.json(), express.urlencoded({ extended: true }), announcementRoutes);
app.use('/api/profile', express.json(), express.urlencoded({ extended: true }), profileRoutes);
app.use('/api/resources', express.json(), express.urlencoded({ extended: true }), resourceRoutes);
// Temporarily disabled report card routes to avoid Puppeteer dependency
// app.use('/api/report-cards', express.json(), express.urlencoded({ extended: true }), reportCardRoutes);
app.use('/api/clubs', express.json(), express.urlencoded({ extended: true }), clubRoutes);
app.use('/api/books', express.json(), express.urlencoded({ extended: true }), bookRoutes);
app.use('/api/events', express.json(), express.urlencoded({ extended: true }), eventRoutes);
app.use('/api/accounts', express.json(), express.urlencoded({ extended: true }), accountRoutes);

// Mount user routes with proper middleware
app.use('/api/users', express.json(), express.urlencoded({ extended: true }), [
  schoolUserRoutes,  // Public user routes first
  userRoutes         // Protected user routes (with protect middleware on individual routes)
]);

app.use('/api/homeworks', express.json(), express.urlencoded({ extended: true }), homeworkRoutes);
app.use('/api/roles', express.json(), express.urlencoded({ extended: true }), roleRoutes);
app.use('/api/backups', express.json(), express.urlencoded({ extended: true }), backupsRoutes);
app.use('/api/fees', express.json(), express.urlencoded({ extended: true }), feesRoutes);
app.use('/api/library', express.json(), express.urlencoded({ extended: true }), libraryRoutes);
app.use('/api/stats', express.json(), express.urlencoded({ extended: true }), statsRoutes);

// Student routes
app.use('/api/students', express.json(), studentRoutes);

// Attendance routes
app.use('/api/attendance', express.json(), attendanceRoutes);

// Quiz routes - mount with minimal middleware
console.log('Mounting quiz routes at /api/quizzes');
app.use('/api/quizzes', express.json(), express.urlencoded({ extended: true }), quizRoutes);

// Resource and announcement routes are already mounted above with their middleware

// Class management routes
app.use('/api/classes', express.json(), express.urlencoded({ extended: true }), classRoutes);

// Marks routes
app.use('/api/marks', express.json(), express.urlencoded({ extended: true }), marksRoutes);

// Assignment routes must NOT use express.json or express.urlencoded globally, so multer can handle multipart/form-data
app.use('/api/assignments', assignmentRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});

module.exports = app;
