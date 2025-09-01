const express = require('express');
const { authenticateUser, authorizeRoles } = require('../middleware/authMiddleware');
const Homework = require('../models/Homework');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configure upload directory for homework submissions
const homeworkUploadDir = path.join(__dirname, '..', 'uploads', 'homeworks');

// Create directory if it doesn't exist
if (!fs.existsSync(homeworkUploadDir)) {
  fs.mkdirSync(homeworkUploadDir, { recursive: true });
}

// Configure multer for homework submissions
const homeworkUpload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, homeworkUploadDir);
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      const ext = path.extname(file.originalname);
      cb(null, 'submission-' + uniqueSuffix + ext);
    }
  }),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
    files: 1
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['.pdf', '.doc', '.docx', '.jpg', '.jpeg', '.png'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedTypes.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Only PDF, Word documents, and images are allowed'));
    }
  }
});

const router = express.Router();

// Create Homework (Only for Teachers)
router.post(
  '/',
  authenticateUser,
  authorizeRoles('teacher'),
  homeworkUpload.single('homework-file'),
  async (req, res) => {
    try {
      const { title, description, dueDate, classAssigned } = req.body;
      
      // Validate required fields
      if (!title || !dueDate || !classAssigned) {
        return res.status(400).json({
          error: 'Missing required fields',
          details: 'Please provide title, due date, and class assigned'
        });
      }

      const homework = new Homework({
        title,
        description,
        dueDate: new Date(dueDate),
        classAssigned,
        teacher: req.user.id,
        file: req.file ? `/uploads/homeworks/${req.file.filename}` : null
      });

      await homework.save();
      
      res.json({ 
        msg: "Homework created successfully!", 
        homework 
      });
    } catch (err) {
      console.error('Homework creation error:', err);
      res.status(500).json({ 
        error: 'Failed to create homework',
        details: err.message 
      });
    }
  }
);

// Get All Homeworks (Accessible to students + teachers)
router.get('/', authenticateUser, async (req, res) => {
  try {
    let query = {};
    
    if (req.user.role === 'student') {
      const studentClass = req.user.profile?.class || req.user.class;
      if (studentClass) {
        query = { classAssigned: studentClass };
      } else {
        return res.json([]);
      }
    } else {
      // For teachers, show all homeworks they've created
      query = { teacher: req.user.id };
    }

    const homeworks = await Homework.find(query)
      .populate('teacher', 'name')
      .populate('submissions.student', 'name')
      .sort({ dueDate: 1 });
    
    res.json(homeworks);
  } catch (err) {
    console.error('Error fetching homeworks:', err);
    res.status(500).json({ 
      error: 'Failed to fetch homeworks',
      details: err.message 
    });
  }
});

// Submit Homework (Only for Students)
router.post(
  '/submit/:homeworkId',
  authenticateUser,
  authorizeRoles('student'),
  homeworkUpload.single('submission-file'),
  async (req, res) => {
    try {
      const homework = await Homework.findById(req.params.homeworkId);
      if (!homework) {
        return res.status(404).json({ error: 'Homework not found' });
      }

      // Check if student has already submitted
      const existingSubmission = homework.submissions.find(
        sub => sub.student.toString() === req.user.id
      );

      if (existingSubmission) {
        return res.status(400).json({
          error: 'You have already submitted this homework'
        });
      }

      homework.submissions.push({
        student: req.user.id,
        file: req.file ? req.file.filename : null,
        submittedAt: new Date()
      });

      await homework.save();
      
      res.json({
        msg: 'Homework submitted successfully!',
        submission: homework.submissions[homework.submissions.length - 1]
      });
    } catch (err) {
      console.error('Homework submission error:', err);
      res.status(500).json({ 
        error: 'Failed to submit homework',
        details: err.message 
      });
    }
  }
);

// Get a single homework with submissions
router.get('/:id', authenticateUser, async (req, res) => {
  try {
    const homework = await Homework.findById(req.params.id)
      .populate('teacher', 'name email')
      .populate('submissions.student', 'name email');
      
    if (!homework) {
      return res.status(404).json({ error: 'Homework not found' });
    }

    // Check if the user is the teacher who created the homework or a student who submitted it
    const isTeacher = req.user.role === 'teacher' && homework.teacher._id.toString() === req.user.id;
    const isStudent = req.user.role === 'student' && 
      homework.submissions.some(sub => sub.student._id.toString() === req.user.id);
    
    if (!isTeacher && !isStudent) {
      return res.status(403).json({ error: 'Not authorized to view this homework' });
    }

    // If student, only show their own submission
    if (req.user.role === 'student') {
      homework.submissions = homework.submissions.filter(
        sub => sub.student._id.toString() === req.user.id
      );
    }

    res.json(homework);
  } catch (err) {
    console.error('Error fetching homework:', err);
    res.status(500).json({ 
      error: 'Failed to fetch homework',
      details: err.message 
    });
  }
});

// Grade Homework (Only for Teachers)
router.put(
  '/grade/:homeworkId/:submissionId',
  authenticateUser,
  authorizeRoles('teacher'),
  async (req, res) => {
    try {
      const { grade, comments } = req.body;
      const homework = await Homework.findById(req.params.homeworkId);
      
      if (!homework) {
        return res.status(404).json({ error: 'Homework not found' });
      }

      const submission = homework.submissions.id(req.params.submissionId);
      if (!submission) {
        return res.status(404).json({ error: 'Submission not found' });
      }

      submission.grade = grade;
      submission.comments = comments;
      
      await homework.save();
      
      res.json({
        msg: 'Homework graded successfully!',
        submission
      });
    } catch (err) {
      console.error('Homework grading error:', err);
      res.status(500).json({
        error: 'Failed to grade homework',
        details: err.message
      });
    }
  }
);

// Delete Homework (Only for Teachers)
router.delete(
  '/:id',
  authenticateUser,
  authorizeRoles('teacher'),
  async (req, res) => {
    try {
      const homework = await Homework.findByIdAndDelete(req.params.id);
      
      if (!homework) {
        return res.status(404).json({ error: 'Homework not found' });
      }
      
      res.json({
        msg: 'Homework deleted successfully!'
      });
    } catch (err) {
      console.error('Homework deletion error:', err);
      res.status(500).json({
        error: 'Failed to delete homework',
        details: err.message
      });
    }
  }
);

module.exports = router;
