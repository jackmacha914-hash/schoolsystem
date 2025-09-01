const express = require('express');
const { 
    saveMarks, 
    saveStudentMarks,
    getStudentMarks, 
    getClassMarks, 
    getSubjectMarks, 
    finalizeMarks, 
    getStudentReportCard,
    deleteStudentMarks 
} = require('../controllers/marksController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// All routes are protected and require authentication
router.use(protect);

// Teacher routes
router.post('/', authorize('Teacher'), saveMarks);
router.post('/students/:studentId/marks', authorize('Teacher'), saveStudentMarks);
router.get('/class/:className', authorize('Teacher'), getClassMarks);
router.get('/subject/:subject', authorize('Teacher'), getSubjectMarks);
router.put('/finalize/:id', authorize('Teacher'), finalizeMarks);

// Student and Teacher routes
router.get('/student/:studentId', authorize('Student', 'Teacher'), getStudentMarks);
router.get('/report-card/:studentId', authorize('Student', 'Teacher'), getStudentReportCard);
router.delete('/:studentId/term/:term', authorize('Teacher'), deleteStudentMarks);

module.exports = router;
