const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { authenticateUser, authorizeRoles } = require('../middleware/authMiddleware');
const Resource = require('../models/Resource'); // Ensure Resource model is imported

const router = express.Router();

// Ensure the upload directory exists
const uploadDir = path.join(__dirname, '../uploads/resources');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Multer file filter to allow only PDFs and DOC/DOCX
const fileFilter = (req, file, cb) => {
  const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
  if (!allowedTypes.includes(file.mimetype)) {
    return cb(new Error('Only PDF, DOC, and DOCX files are allowed'), false);
  }
  if (file.size && file.size > 10 * 1024 * 1024) { // 10MB
    return cb(new Error('File size must be less than 10MB'), false);
  }
  cb(null, true);
};

// Multer storage setup
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});

const upload = multer({ storage: storage, fileFilter: fileFilter }).single('resource');

// POST route for uploading a file
router.post('/upload', authenticateUser, authorizeRoles('teacher'), function (req, res, next) {
  upload(req, res, function (err) {
    if (err instanceof multer.MulterError) {
      return res.status(400).json({ success: false, message: err.message });
    } else if (err) {
      return res.status(400).json({ success: false, message: err.message });
    }
    if (!req.file) {
      return res.status(400).json({ msg: 'No file uploaded or invalid file type' });
    }

    // Get class from request body or user's profile
    const classAssigned = req.body.classAssigned || req.user.profile?.class || 'General';

    // Save resource to the database
    const newResource = new Resource({
      name: req.file.originalname,
      path: req.file.filename,
      classAssigned: classAssigned,
      uploadedBy: req.user._id,
    });

    newResource.save()
      .then(resource => {
        res.status(200).json({
          success: true,
          message: 'Resource uploaded successfully',
          resource: {
            _id: resource._id,
            name: resource.name,
            path: resource.path,
          },
        });
      })
      .catch(error => {
        res.status(500).json({ success: false, message: error.message });
      });
  });
});

// GET route for fetching uploaded resources (now from the database)
router.get('/', authenticateUser, async (req, res) => {
  try {
    const { class: classFilter } = req.query;
    const userRole = req.user.role;
    const userId = req.user._id.toString();
    // Check both locations for class
    const userClass = req.user.class || (req.user.profile && req.user.profile.class);
    
    console.log('=== BACKEND RESOURCE DEBUG ===');
    console.log('User ID:', userId);
    console.log('User Role:', userRole);
    console.log('User Class:', userClass);
    console.log('Class Filter:', classFilter);
    console.log('Request Query:', req.query);
    console.log('User Object:', JSON.stringify(req.user, null, 2));
    console.log('===============================');
    
    // Build query
    const query = {};
    
    console.log('Resource query - userRole:', userRole, 'userClass:', userClass, 'classFilter:', classFilter, 'req.query:', req.query);
    console.log('Full user object:', JSON.stringify(req.user, null, 2));
    
    // If user is a student, only show resources for their class
    if (userRole === 'student') {
      console.log('Processing student request. User class:', userClass, 'Type:', typeof userClass);
      
      if (!userClass) {
        console.log('No class found for student:', req.user._id);
        return res.status(400).json({ 
          success: false, 
          message: 'Student is not assigned to any class. Please contact an administrator.' 
        });
      }
      
      // Ensure class is a string and trim any whitespace
      const normalizedClass = String(userClass).trim();
      console.log('Filtering resources for class:', normalizedClass);
      query.classAssigned = normalizedClass;
    } 
    // For teachers, show all their resources by default, with optional class filter
    else if (userRole === 'teacher') {
      console.log('Processing teacher request');
      query.uploadedBy = req.user._id;
      
      // Only apply class filter if specifically requested (not 'all' or undefined)
      if (classFilter && classFilter !== 'all') {
        console.log('Applying class filter for teacher:', classFilter);
        query.classAssigned = classFilter;
      } else {
        console.log('No class filter applied - showing all teacher resources');
      }
    } 
    // For admins, show all resources by default, with optional class filter
    else if (userRole === 'admin') {
      console.log('Processing admin request');
      // Only apply class filter if specifically requested (not 'all' or undefined)
      if (classFilter && classFilter !== 'all') {
        console.log('Applying class filter for admin:', classFilter);
        query.classAssigned = classFilter;
      } else {
        console.log('No class filter applied - showing all resources');
      }
    }
    
    console.log('Database query:', query);
    
    // Log all resources before filtering for debugging
    const allResources = await Resource.find({}).populate('uploadedBy', 'name').lean();
    console.log('All resources in database:', allResources.map(r => ({
      name: r.name,
      classAssigned: r.classAssigned,
      uploadedBy: r.uploadedBy?.name
    })));
    
    // Execute the actual query with filtering
    const resources = await Resource.find(query).populate('uploadedBy', 'name').lean();
    
    console.log('Filtered resources:', resources.map(r => ({
      name: r.name,
      classAssigned: r.classAssigned,
      uploadedBy: r.uploadedBy?.name
    })));
    
    // Add canDelete flag
    const resourcesWithDelete = resources.map(r => ({
      ...r,
      canDelete: userRole === 'admin' || (r.uploadedBy && r.uploadedBy._id.toString() === userId)
    }));
    
    // Get unique classes for filter dropdown based on user's role
    let classes = [];
    if (userRole === 'teacher') {
      // For teachers, only show classes they have resources for
      classes = await Resource.distinct('classAssigned', { uploadedBy: req.user._id });
    } else {
      // For admins, show all classes
      classes = await Resource.distinct('classAssigned');
    }
    
    console.log('Sending response with', resourcesWithDelete.length, 'resources');
    res.json({ 
      resources: resourcesWithDelete,
      classes,
      userClass: userRole === 'student' ? userClass : null
    });
  } catch (err) {
    console.error('Failed to fetch resources from database:', err);
    res.status(500).json({ msg: 'Failed to load resources' });
  }
});

// DELETE resource endpoint
router.delete('/:resourceId', authenticateUser, authorizeRoles('teacher'), async (req, res) => {
  const { resourceId } = req.params;
  
  try {
    // First find the resource to get the filename
    const resource = await Resource.findById(resourceId);
    
    if (!resource) {
      return res.status(404).json({ success: false, msg: 'Resource not found in the database' });
    }
    
    const filePath = path.join(uploadDir, resource.path);
    
    // Delete the file from the filesystem
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    } else {
      console.warn(`File not found at path: ${filePath}, but proceeding with database deletion`);
    }

    // Remove the resource from the database
    await Resource.findByIdAndDelete(resourceId);

    // Send success response
    res.status(200).json({ 
      success: true, 
      msg: 'Resource deleted successfully',
      resourceId: resourceId
    });
  } catch (err) {
    console.error('Error deleting file or database record:', err);
    res.status(500).json({ 
      success: false, 
      msg: 'Failed to delete resource',
      error: err.message 
    });
  }
});

module.exports = router;
