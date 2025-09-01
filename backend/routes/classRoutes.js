const express = require('express');
const { 
  createClass,
  getTeacherClasses,
  getClassById,
  updateClass,
  deleteClass,
  addStudentToClass,
  removeStudentFromClass
} = require('../controllers/classController');
const { authenticateUser, authorizeRoles } = require('../middleware/authMiddleware');

const router = express.Router();

// All routes are protected and require authentication
router.use(authenticateUser);

// Create a new class (Teacher only)
router.post('/', authorizeRoles('teacher'), createClass);

// Get all classes for the logged-in teacher
router.get('/my-classes', authorizeRoles('teacher'), getTeacherClasses);

// Get class by ID (Teacher only)
router.get('/:id', authorizeRoles('teacher'), getClassById);

// Update class (Teacher only)
router.put('/:id', authorizeRoles('teacher'), updateClass);

// Delete class (Teacher only)
router.delete('/:id', authorizeRoles('teacher'), deleteClass);

// Add student to class (Teacher only)
router.post('/:id/students', authorizeRoles('teacher'), addStudentToClass);

// Remove student from class (Teacher only)
router.delete('/:id/students/:studentId', authorizeRoles('teacher'), removeStudentFromClass);

module.exports = router;
