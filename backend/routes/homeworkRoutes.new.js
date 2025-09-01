const express = require('express');
const router = express.Router();
const path = require('path');
const Homework = require('../models/Homework');
const { authenticateUser, authorizeRoles } = require('../middleware/authMiddleware');
const homeworkUpload = require('../middleware/homeworkUpload');
const fs = require('fs');
const multer = require('multer');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, '..', 'uploads', 'homeworks');
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'image/jpeg',
      'image/png',
      'image/gif'
    ];
    
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF, Word documents, and images are allowed.'));
    }
  }
});

// Get a single homework with submissions
router.get('/:homeworkId', authenticateUser, async (req, res) => {
  try {
    // First, get the homework without populating submissions
    let homework = await Homework.findById(req.params.homeworkId)
      .populate('teacher', 'name');

    if (!homework) {
      return res.status(404).json({ error: 'Homework not found' });
    }

    // Check if user has permission to view this homework
    if (req.user.role === 'student') {
      const studentClass = req.user.profile?.class || req.user.class;
      if (homework.classAssigned !== studentClass) {
        return res.status(403).json({ error: 'Not authorized to view this homework' });
      }
      
      // For students, only include their own submission
      const studentSubmission = homework.submissions.find(sub => 
        sub.student && sub.student.toString() === req.user.id
      );
      
      // Create a new homework object with only the student's submission
      const homeworkObj = homework.toObject();
      homeworkObj.submissions = studentSubmission ? [studentSubmission] : [];
      
      // Populate student info for the submission
      if (studentSubmission) {
        const populated = await Homework.populate(homeworkObj, {
          path: 'submissions.student',
          select: 'name email'
        });
        return res.json(populated);
      }
      
      return res.json(homeworkObj);
      
    } else if (req.user.role === 'teacher') {
      // For teachers, check if they are the owner of the homework
      if (homework.teacher._id.toString() !== req.user.id) {
        return res.status(403).json({ error: 'Not authorized to view this homework' });
      }
      
      // For teachers, populate all submissions
      const populated = await Homework.populate(homework, [
        { path: 'submissions.student', select: 'name email' },
        { path: 'submissions.gradedBy', select: 'name' }
      ]);
      
      return res.json(populated);
    }
    
    // If user is not a student or teacher, deny access
    return res.status(403).json({ error: 'Not authorized to view this homework' });
  } catch (err) {
    console.error('Error fetching homework:', err);
    res.status(500).json({ 
      error: 'Failed to fetch homework',
      details: err.message 
    });
  }
});

// Get All Homeworks (Accessible to students + teachers)
router.get('/', authenticateUser, async (req, res) => {
  try {
    console.log('Homework GET request received');
    console.log('User info:', req.user);
    
    // For students, only show homeworks assigned to their class
    // For teachers, show all homeworks they've created
    let query = {};
    
    if (req.user.role === 'student') {
        const studentClass = req.user.profile?.class || req.user.class;
        console.log('Student class:', studentClass);
        
        if (studentClass) {
            query = { classAssigned: studentClass };
        } else {
            // If no class is set, return no homeworks
            console.log('No class assigned to student');
            return res.json([]);
        }
    } else {
        // For teachers, show all homeworks they've created
        query = { teacher: req.user.id };
    }
    
    console.log('Query:', query);
    
    const homeworks = await Homework.find(query)
      .populate('teacher', 'name')
      .populate('submissions.student', 'name')
      .sort({ dueDate: 1 }); // Sort by due date
    
    console.log('Found homeworks:', homeworks.length);
    res.json(homeworks);
  } catch (err) {
    console.error('Error fetching homeworks:', err);
    res.status(500).json({ 
      error: 'Failed to fetch homeworks',
      details: err.message 
    });
  }
});

// Error handling middleware
const handleErrors = (err, req, res, next) => {
  console.error('Error in homework route:', err);
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({
      success: false,
      error: 'File size too large. Maximum size is 5MB.'
    });
  } else if (err.message.includes('Invalid file type')) {
    return res.status(400).json({
      success: false,
      error: 'Invalid file type. Only PDF, Word documents, and images are allowed.'
    });
  }
  res.status(500).json({
    success: false,
    error: 'An error occurred while processing your request.'
  });
};

// Create a new homework (Only for Teachers)
router.post(
  '/',
  (req, res, next) => {
    console.log('Request received at /api/homeworks');
    console.log('Request headers:', req.headers);
    console.log('Request body:', req.body);
    console.log('Request files:', req.file);
    next();
  },
  authenticateUser,
  authorizeRoles('teacher'),
  (req, res, next) => {
    // Use the homeworkUpload middleware that's already configured with .single('homework-file')
    homeworkUpload(req, res, (err) => {
      if (err) {
        console.error('File upload error:', err);
        return res.status(400).json({
          success: false,
          error: err.message || 'Error uploading file'
        });
      }
      next();
    });
  },
  async (req, res, next) => {
    try {
      console.log('Processing homework creation...');
      const { title, description, classAssigned, dueDate, maxPoints } = req.body;
      
      console.log('Received data:', { title, classAssigned, dueDate });
      
      // Validate required fields
      if (!title || !classAssigned || !dueDate) {
        console.log('Missing required fields:', { title, classAssigned, dueDate });
        // Clean up the uploaded file if there was an error
        if (req.file) {
          fs.unlink(path.join(req.file.destination, req.file.filename), (err) => {
            if (err) console.error('Error deleting file:', err);
          });
        }
        return res.status(400).json({
          success: false,
          error: 'Title, class, and due date are required.'
        });
      }
      
      try {
        // Create new homework
        console.log('Creating homework document...');
        const homework = new Homework({
          title,
          description: description || '',
          classAssigned,
          dueDate: new Date(dueDate),
          maxPoints: maxPoints || 100,
          teacher: req.user.id,
          file: req.file ? path.basename(req.file.path) : null,
          originalFilename: req.file ? req.file.originalname : null
        });
        
        console.log('Saving homework to database...');
        await homework.save();
        
        // Populate teacher info
        console.log('Populating teacher info...');
        await homework.populate('teacher', 'name');
        
        console.log('Homework created successfully:', {
          homeworkId: homework._id,
          title: homework.title,
          class: homework.classAssigned
        });
        
        res.status(201).json({
          success: true,
          message: 'Homework created successfully!',
          homework
        });
      } catch (saveError) {
        console.error('Error saving homework:', saveError);
        // Clean up the uploaded file if there was an error
        if (req.file) {
          fs.unlink(path.join(req.file.destination, req.file.filename), (err) => {
            if (err) console.error('Error cleaning up file:', err);
          });
        }
        throw saveError; // This will be caught by the outer catch block
      }
      
    } catch (err) {
      console.error('Error creating homework:', err);
      
      // Clean up the uploaded file if there was an error
      if (req.file) {
        fs.unlink(path.join(req.file.destination, req.file.filename), () => {});
      }
      
      next(err);
    }
  },
  handleErrors
);

// Submit Homework (Only for Students)
router.post(
  '/submit/:homeworkId',
  authenticateUser,
  authorizeRoles('student'),
  (req, res, next) => {
    console.log('Homework submission request received');
    // Use the homeworkUpload middleware to handle the file upload
    homeworkUpload(req, res, async (err) => {
      try {
        if (err) {
          console.error('File upload error:', err);
          if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({ 
              success: false,
              error: 'File size too large. Maximum size is 5MB.' 
            });
          }
          return res.status(400).json({ 
            success: false,
            error: err.message || 'Invalid file type. Only PDF, Word documents, and images are allowed.'
          });
        }

        // If no file was uploaded
        if (!req.file) {
          return res.status(400).json({
            success: false,
            error: 'Please upload a file for your submission.'
          });
        }

        // Find the homework
        const homework = await Homework.findById(req.params.homeworkId);
        if (!homework) {
          // Clean up the uploaded file if homework not found
          if (req.file) {
            fs.unlink(path.join(req.file.destination, req.file.filename), () => {});
          }
          return res.status(404).json({ 
            success: false,
            error: 'Homework not found' 
          });
        }

        // Check if student has already submitted
        const existingSubmission = homework.submissions.find(
          sub => sub.student && sub.student.toString() === req.user.id
        );

        if (existingSubmission) {
          // Clean up the uploaded file if submission exists
          if (req.file) {
            fs.unlink(path.join(req.file.destination, req.file.filename), () => {});
          }
          return res.status(400).json({
            success: false,
            error: 'You have already submitted this homework'
          });
        }

        // Add the submission
        const submission = {
          student: req.user.id,
          submittedAt: new Date(),
          file: req.file.filename,
          originalFilename: req.file.originalname,
          comments: req.body.comments || ''
        };

        homework.submissions.push(submission);
        await homework.save();
        
        console.log('Homework submitted successfully:', {
          homeworkId: homework._id,
          submissionId: submission._id,
          filename: req.file.filename
        });
        
        res.json({
          success: true,
          message: 'Homework submitted successfully!',
          submission: homework.submissions[homework.submissions.length - 1]
        });
      } catch (err) {
        console.error('Homework submission error:', err);
        // Clean up the uploaded file if there was an error
        if (req.file) {
          fs.unlink(path.join(req.file.destination, req.file.filename), () => {});
        }
        res.status(500).json({ 
          success: false,
          error: 'Failed to submit homework',
          details: process.env.NODE_ENV === 'development' ? err.message : undefined
        });
      }
    });
  }
);

// Grade a homework submission (Only for Teachers)
router.put(
  '/grade/:homeworkId/:submissionId',
  authenticateUser,
  authorizeRoles('teacher'),
  async (req, res) => {
    try {
      const { grade, comments } = req.body;
      
      // Validate input
      if (typeof grade !== 'number' || grade < 0 || grade > 100) {
        return res.status(400).json({
          success: false,
          error: 'Please provide a valid grade between 0 and 100'
        });
      }
      
      if (!comments || typeof comments !== 'string' || comments.trim().length === 0) {
        return res.status(400).json({
          success: false,
          error: 'Please provide feedback for the student'
        });
      }
      
      // Find the homework
      const homework = await Homework.findById(req.params.homeworkId);
      if (!homework) {
        return res.status(404).json({
          success: false,
          error: 'Homework not found'
        });
      }
      
      // Find the submission
      const submission = homework.submissions.id(req.params.submissionId);
      if (!submission) {
        return res.status(404).json({
          success: false,
          error: 'Submission not found'
        });
      }
      
      // Check if the teacher is the owner of this homework
      if (homework.teacher.toString() !== req.user.id) {
        return res.status(403).json({
          success: false,
          error: 'You are not authorized to grade this submission'
        });
      }
      
      // Update the submission
      submission.grade = grade;
      submission.gradeComments = comments.trim();
      submission.gradedAt = new Date();
      submission.gradedBy = req.user.id;
      
      await homework.save();
      
      // Populate the student and teacher details for the response
      await homework.populate([
        { path: 'teacher', select: 'name email' },
        { path: 'submissions.student', select: 'name email' },
        { path: 'submissions.gradedBy', select: 'name email' }
      ]);
      
      // Get the updated submission
      const updatedSubmission = homework.submissions.id(req.params.submissionId);
      
      res.json({
        success: true,
        message: 'Grade submitted successfully',
        submission: updatedSubmission
      });
      
    } catch (err) {
      console.error('Error grading submission:', err);
      res.status(500).json({
        success: false,
        error: 'Failed to submit grade',
        details: process.env.NODE_ENV === 'development' ? err.message : undefined
      });
    }
  }
);

module.exports = router;
