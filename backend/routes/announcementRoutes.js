const express = require('express');
const { authenticateUser, authorizeRoles } = require('../middleware/authMiddleware');
const { createAnnouncement, getAnnouncements, deleteAnnouncement } = require('../controllers/announcementController');

const router = express.Router();

// 📝 Create a new announcement (teacher only)
router.post('/', authenticateUser, authorizeRoles('teacher'), createAnnouncement);

// 📄 Get all announcements (any logged-in user)
router.get('/', authenticateUser, getAnnouncements);

// 🗑️ Delete an announcement (teacher only)
router.delete('/:id', authenticateUser, authorizeRoles('teacher'), deleteAnnouncement);

module.exports = router;
