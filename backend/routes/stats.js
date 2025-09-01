// routes/stats.js
const express = require('express');
const User = require('../models/User');
const Event = require('../models/Event');
const router = express.Router();

// Get stats (number of students, teachers, and events)
router.get('/', async (req, res) => {
    try {
        // Get number of students and teachers
        const studentsCount = await User.countDocuments({ role: 'student' });
        const teachersCount = await User.countDocuments({ role: 'teacher' });

        // Get number of events
        const eventsCount = await Event.countDocuments();

        // Return the stats
        res.status(200).json({
            students: studentsCount,
            teachers: teachersCount,
            events: eventsCount
        });
    } catch (err) {
        console.error('Error fetching stats:', err);
        res.status(500).json({ message: 'Error fetching stats' });
    }
});

module.exports = router;
