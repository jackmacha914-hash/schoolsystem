const express = require('express');
const { authenticateUser, authorizeRoles } = require('../middleware/authMiddleware');
const { getTeacherProfile, updateTeacherProfile } = require('../controllers/teacherController');

const router = express.Router();

// Get Teacher Profile
router.get('/profile', authenticateUser, authorizeRoles('Teacher'), getTeacherProfile);

// Update Teacher Profile
router.put('/profile', authenticateUser, authorizeRoles('Teacher'), updateTeacherProfile);

module.exports = router;
