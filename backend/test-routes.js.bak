const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

// Test route
router.get('/test', (req, res) => {
    res.json({ 
        message: 'Test route is working!',
        mongoConnected: mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected'
    });
});

// Test MongoDB connection
router.get('/test-mongodb', async (req, res) => {
    try {
        const collections = await mongoose.connection.db.listCollections().toArray();
        res.json({
            status: 'MongoDB connected successfully!',
            collections: collections.map(c => c.name)
        });
    } catch (error) {
        res.status(500).json({
            status: 'Error connecting to MongoDB',
            error: error.message
        });
    }
});

// Import route files
const authRoutes = require('./routes/authRoutes');
const assignmentRoutes = require('./routes/assignmentRoutes');
const homeworkRoutes = require('./routes/homeworkRoutes');
const gradeRoutes = require('./routes/gradesRoutes');
const announcementRoutes = require('./routes/announcementRoutes');
const profileRoutes = require('./routes/profileRoutes');
const resourceRoutes = require('./routes/resourceRoutes');
const reportCardRoutes = require('./routes/reportCardRoutes');
const clubRoutes = require('./routes/clubs');
const bookRoutes = require('./routes/books');
const eventRoutes = require('./routes/events');
const accountRoutes = require('./routes/accounts');
const statsRoutes = require('./routes/stats');
const schoolUserRoutes = require('./routes/schoolUserRoutes');
const backupsRoutes = require('./routes/backups');
const feesRoutes = require('./routes/fees');
const libraryRoutes = require('./routes/library');
const roleRoutes = require('./routes/roles');
const studentRoutes = require('./routes/studentRoutes');
const classRoutes = require('./routes/classRoutes');
const marksRoutes = require('./routes/marksRoutes');

// Use routes
router.use('/auth', authRoutes);
router.use('/assignments', assignmentRoutes);
router.use('/homeworks', homeworkRoutes);
router.use('/grades', gradeRoutes);
router.use('/announcements', announcementRoutes);
router.use('/profile', profileRoutes);
router.use('/resources', resourceRoutes);
router.use('/report-cards', reportCardRoutes);
router.use('/clubs', clubRoutes);
router.use('/books', bookRoutes);
router.use('/events', eventRoutes);
router.use('/accounts', accountRoutes);
router.use('/users', schoolUserRoutes);
router.use('/homeworks', homeworkRoutes);
router.use('/roles', roleRoutes);
router.use('/backups', backupsRoutes);
router.use('/fees', feesRoutes);
router.use('/library', libraryRoutes);
router.use('/stats', statsRoutes);
router.use('/students', studentRoutes);
router.use('/classes', classRoutes);
router.use('/marks', marksRoutes);

module.exports = router;
