const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { authenticateUser, authorizeRoles } = require('../middleware/authMiddleware');
const { 
    getStudents, 
    getStudentsByClass,
    getStudentProfile, 
    updateStudentProfile, 
    registerStudent, 
    registerUser,
    uploadProfilePhoto 
} = require('../controllers/studentController');

// Configure multer for file uploads
const uploadsDir = path.join(__dirname, '..', 'uploads', 'profile-photos');

// Ensure the uploads directory exists
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadsDir);
    },
    filename: (req, file, cb) => {
        // Get the user's email from the authenticated request
        const userEmail = req.user?.email || 'unknown';
        // Sanitize the email to be filesystem-safe
        const sanitizedEmail = userEmail
            .toLowerCase()
            .replace(/[^a-z0-9]/g, '-')  // Replace special characters with hyphens
            .replace(/-+/g, '-')          // Replace multiple hyphens with a single one
            .replace(/^-+|-+$/g, '');     // Remove leading/trailing hyphens
            
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9).toString(36);
        const ext = path.extname(file.originalname).toLowerCase();
        
        // Format: profile-{sanitized-email}-{timestamp}-{random}.{ext}
        const filename = `profile-${sanitizedEmail}-${uniqueSuffix}${ext}`;
        cb(null, filename);
    }
});

const upload = multer({ 
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
    fileFilter: (req, file, cb) => {
        const filetypes = /jpeg|jpg|png|gif/;
        const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = filetypes.test(file.mimetype);
        
        if (extname && mimetype) {
            return cb(null, true);
        } else {
            cb(new Error('Only image files are allowed (jpeg, jpg, png, gif)'));
        }
    }
});

const router = express.Router();

// Get students by class
router.get('/class/:className', authenticateUser, getStudentsByClass);

// ✅ Register User (Student or Teacher) - Public endpoint
router.post('/register', (req, res, next) => {
    console.log('Received registration request:', {
        method: req.method,
        url: req.url,
        headers: req.headers,
        body: req.body
    });
    next();
}, registerUser);

// Register New Student - Public endpoint
router.post('/register/student', (req, res, next) => {
    console.log('Received student registration request:', {
        method: req.method,
        url: req.url,
        headers: req.headers,
        body: req.body
    });
    next();
}, registerStudent);

// Change Password
router.put('/change-password', authenticateUser, (req, res) => {
    console.log('Received change password request:', {
        method: req.method,
        url: req.url,
        headers: req.headers
    });
    changePassword(req, res);
});

// User Profile Routes
// Handle both /profile and /profile/:id with separate routes for better compatibility
router.get('/profile', authenticateUser, (req, res, next) => {
    // If no ID is provided, use the current user's ID
    req.params = {}; // Clear any existing params
    console.log('Received get current user profile request:', {
        method: req.method,
        url: req.url,
        user: req.user
    });
    getStudentProfile(req, res);
});

// Get profile by ID
router.get('/profile/:id', authenticateUser, (req, res, next) => {
    // Get profile for the specified ID
    console.log('Received get user profile by ID request:', {
        method: req.method,
        url: req.url,
        user: req.user,
        params: req.params
    });
    getStudentProfile(req, res);
});

// Update student profile
router.put('/profile', authenticateUser, (req, res, next) => {
    console.log('Received update student profile request:', {
            method: req.method,
            url: req.url,
            user: req.user,
            body: req.body
        });
        updateStudentProfile(req, res);
    });

// Student Profile Photo Upload
router.post('/profile/photo', 
    authenticateUser, 
    upload.single('photo'), 
    uploadProfilePhoto,
    (err, req, res, next) => {
        // Handle multer errors specifically
        if (err instanceof multer.MulterError) {
            return res.status(400).json({
                success: false,
                message: err.message || 'File upload error',
                code: err.code
            });
        } else if (err) {
            return res.status(400).json({
                success: false,
                message: err.message || 'Error uploading file'
            });
        }
        next();
    }
);

// Get All Students - Public endpoint
router.get('/', (req, res) => {
    console.log('Received get all students request:', {
        method: req.method,
        url: req.url,
        headers: req.headers,
        query: req.query
    });
    getStudents(req, res);
});

router.get('/teachers', (req, res) => {
    console.log('Received get teachers request:', {
        method: req.method,
        url: req.url,
        headers: req.headers,
        query: req.query
    });
    getStudents(req, res);
});

// Get Student Profile (Only the student)
router.get('/profile', (req, res, next) => {
    console.log('Received get student profile request:', {
        method: req.method,
        url: req.url,
        headers: req.headers,
        query: req.query
    });
    next();
}, authenticateUser, authorizeRoles('Student'), getStudentProfile);

// Update Student Profile (Only the student)
router.put('/profile', authenticateUser, authorizeRoles('Student'), updateStudentProfile);

module.exports = router;
