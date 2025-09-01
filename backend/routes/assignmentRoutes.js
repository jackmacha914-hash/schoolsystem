const express = require('express');
const { authenticateUser, authorizeRoles } = require('../middleware/authMiddleware');
const Assignment = require('../models/Assignment');
const upload = require('../middleware/upload');

const router = express.Router();

// Create Assignment (Only for Teachers)
router.post(
  '/',
  authenticateUser,
  authorizeRoles('teacher'),
  upload.single('assignment-file'),
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

      const assignment = new Assignment({
        title,
        description,
        dueDate: new Date(dueDate),
        classAssigned,
        teacher: req.user.id,
        file: req.file ? req.file.filename : null
      });

      await assignment.save();
      
      res.json({ 
        msg: "Assignment created successfully!", 
        assignment 
      });
    } catch (err) {
      console.error('Assignment creation error:', err);
      res.status(500).json({ 
        error: 'Failed to create assignment',
        details: err.message 
      });
    }
  }
);

// Get All Assignments (Accessible to students + teachers)
router.get('/', authenticateUser, async (req, res) => {
  try {
    const assignments = await Assignment.find().populate('teacher', 'name email');
    res.json(assignments);
  } catch (err) {
    console.error('Error fetching assignments:', err);
    res.status(500).json({ 
      error: 'Failed to fetch assignments',
      details: err.message 
    });
  }
});

// Get Single Assignment (Accessible to students + teachers)
router.get('/:id', authenticateUser, async (req, res) => {
  try {
    const assignment = await Assignment.findById(req.params.id)
      .populate('teacher', 'name email')
      .populate('students.student', 'name email');
    
    if (!assignment) {
      return res.status(404).json({ error: 'Assignment not found' });
    }
    
    res.json(assignment);
  } catch (err) {
    console.error('Error fetching assignment:', err);
    res.status(500).json({ 
      error: 'Failed to fetch assignment',
      details: err.message 
    });
  }
});

// Update Assignment (Only for Teachers)
router.put('/:id', authenticateUser, authorizeRoles('teacher'), async (req, res) => {
  try {
    const assignment = await Assignment.findById(req.params.id);
    
    if (!assignment) {
      return res.status(404).json({ error: 'Assignment not found' });
    }

    // Only allow teacher who created the assignment to update it
    if (assignment.teacher.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized to update this assignment' });
    }

    const { title, description, dueDate, classAssigned } = req.body;
    
    assignment.title = title || assignment.title;
    assignment.description = description || assignment.description;
    assignment.dueDate = dueDate ? new Date(dueDate) : assignment.dueDate;
    assignment.classAssigned = classAssigned || assignment.classAssigned;
    
    if (req.file) {
      assignment.file = req.file.filename;
    }

    await assignment.save();
    res.json({ msg: "Assignment updated successfully!", assignment });
  } catch (err) {
    console.error('Assignment update error:', err);
    res.status(500).json({ 
      error: 'Failed to update assignment',
      details: err.message 
    });
  }
});

// Delete Assignment (Only for Teachers)
router.delete('/:id', authenticateUser, authorizeRoles('teacher'), async (req, res) => {
  try {
    const assignment = await Assignment.findById(req.params.id);
    
    if (!assignment) {
      return res.status(404).json({ error: 'Assignment not found' });
    }

    // Only allow teacher who created the assignment to delete it
    if (assignment.teacher.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized to delete this assignment' });
    }

    await assignment.deleteOne();
    res.json({ msg: "Assignment deleted successfully!" });
  } catch (err) {
    console.error('Assignment deletion error:', err);
    res.status(500).json({ 
      error: 'Failed to delete assignment',
      details: err.message 
    });
  }
});

// Submit Assignment (Only for Students)
router.post('/:id/submit', authenticateUser, authorizeRoles('student'), upload.single('submission-file'), async (req, res) => {
  try {
    const assignment = await Assignment.findById(req.params.id);
    
    if (!assignment) {
      return res.status(404).json({ error: 'Assignment not found' });
    }

    // Check if student has already submitted
    const existingSubmission = assignment.students.find(
      student => student.student.toString() === req.user.id
    );

    if (existingSubmission) {
      return res.status(400).json({ 
        error: 'You have already submitted this assignment' 
      });
    }

    // Add new submission
    assignment.students.push({
      student: req.user.id,
      submissionDate: new Date(),
      submissionFile: req.file ? req.file.filename : null
    });

    await assignment.save();
    res.json({ msg: "Assignment submitted successfully!" });
  } catch (err) {
    console.error('Assignment submission error:', err);
    res.status(500).json({ 
      error: 'Failed to submit assignment',
      details: err.message 
    });
  }
});

// Grade Assignment (Only for Teachers)
router.put('/:id/grade/:studentId', authenticateUser, authorizeRoles('teacher'), async (req, res) => {
  try {
    const assignment = await Assignment.findById(req.params.id);
    
    if (!assignment) {
      return res.status(404).json({ error: 'Assignment not found' });
    }

    // Only allow teacher who created the assignment to grade it
    if (assignment.teacher.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized to grade this assignment' });
    }

    const studentIndex = assignment.students.findIndex(
      student => student.student.toString() === req.params.studentId
    );

    if (studentIndex === -1) {
      return res.status(404).json({ error: 'Student submission not found' });
    }

    assignment.students[studentIndex].grade = req.body.grade;
    await assignment.save();

    res.json({ msg: "Assignment graded successfully!" });
  } catch (err) {
    console.error('Assignment grading error:', err);
    res.status(500).json({ 
      error: 'Failed to grade assignment',
      details: err.message 
    });
  }
});

module.exports = router;
