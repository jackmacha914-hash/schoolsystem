const express = require('express');
const router = express.Router();
const attendanceController = require('../controllers/attendanceController');
const { protect, authorize } = require('../middleware/auth');

// All routes are protected
router.use(protect);

// Apply authorization to all routes - allow both admin and teacher roles
const allowedRoles = ['admin', 'teacher'];
router.use((req, res, next) => {
  console.log('Checking authorization for roles:', allowedRoles);
  const userRole = req.user?.role?.toLowerCase();
  
  if (!userRole) {
    return res.status(401).json({ success: false, msg: 'No user role found' });
  }
  
  if (!allowedRoles.includes(userRole)) {
    return res.status(403).json({
      success: false,
      msg: `User role '${req.user.role}' is not authorized`,
      requiredRoles: allowedRoles,
      userRole: req.user.role
    });
  }
  
  next();
});

// Get attendance for a class on a specific date
// GET /api/attendance?class=Grade%201&date=2025-06-21
router.get('/', attendanceController.getAttendance);

// Get attendance history for a class within a date range
// GET /api/attendance/history?class=Grade%201&start=2025-06-01&end=2025-06-30
router.get('/history', attendanceController.getAttendanceHistory);

// Get a single attendance record
// GET /api/attendance/:id
router.get('/:id', attendanceController.getAttendanceById);

// Save attendance
// POST /api/attendance
// Body: { class: "Grade 1", date: "2025-06-21", records: [{ studentId: "...", status: "present", remarks: "" }] }
router.post('/', attendanceController.saveAttendance);

module.exports = router;
