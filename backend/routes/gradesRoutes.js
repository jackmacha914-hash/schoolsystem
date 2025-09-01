const express = require('express');
const { authenticateUser, authorizeRoles } = require('../middleware/authMiddleware');
const { addGrade, getStudentGrades, updateGrade, deleteGrade } = require('../controllers/gradesController');

const gradesRouter = express.Router();

// Add Grade (Only for Teachers)
gradesRouter.post('/', authenticateUser, authorizeRoles('Teacher'), addGrade);

// Get Student Grades (For Students & Teachers)
gradesRouter.get('/', authenticateUser, authorizeRoles('Student', 'Teacher'), getStudentGrades);

// Update Grade (Only for Teachers)
gradesRouter.put('/:id', authenticateUser, authorizeRoles('Teacher'), updateGrade);

// Delete Grade (Only for Teachers)
gradesRouter.delete('/:id', authenticateUser, authorizeRoles('Teacher'), deleteGrade);

module.exports = gradesRouter;
