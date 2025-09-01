const express = require('express');
const router = express.Router();
const DashboardStats = require('../models/DashboardStats');
const { protect } = require('../middleware/auth');

// @route   GET /api/dashboard/stats
// @desc    Get dashboard statistics
// @access  Private
router.get('/stats', protect, async (req, res) => {
    try {
        const stats = await DashboardStats.getStats();
        
        // Get recent activities with populated data if needed
        const activities = await Promise.all(
            stats.recentActivities.map(async (activity) => {
                // You can populate user data here if needed
                return {
                    type: activity.type,
                    description: activity.description,
                    timestamp: activity.timestamp,
                    // Add any additional populated fields
                };
            })
        );
        
        res.json({
            success: true,
            data: {
                totalStudents: stats.totalStudents,
                totalTeachers: stats.totalTeachers,
                totalClasses: stats.totalClasses,
                attendanceRate: stats.attendanceRate,
                recentActivities: activities,
                lastUpdated: stats.lastUpdated
            }
        });
    } catch (error) {
        console.error('Error fetching dashboard stats:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
});

// @route   GET /api/dashboard/quick-stats
// @desc    Get quick stats for the dashboard
// @access  Private
router.get('/quick-stats', protect, async (req, res) => {
    try {
        // In a real app, you might want to calculate these from your actual data
        const stats = await DashboardStats.getStats();
        
        res.json({
            success: true,
            data: {
                totalStudents: stats.totalStudents,
                totalTeachers: stats.totalTeachers,
                totalClasses: stats.totalClasses,
                attendanceRate: stats.attendanceRate
            }
        });
    } catch (error) {
        console.error('Error fetching quick stats:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
});

// @route   GET /api/dashboard/recent-activities
// @desc    Get recent activities for the dashboard
// @access  Private
router.get('/recent-activities', protect, async (req, res) => {
    try {
        const stats = await DashboardStats.getStats();
        
        res.json({
            success: true,
            data: stats.recentActivities
                .sort((a, b) => b.timestamp - a.timestamp)
                .slice(0, 10) // Get only the 10 most recent
        });
    } catch (error) {
        console.error('Error fetching recent activities:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
});

module.exports = router;
