const mongoose = require('mongoose');

const dashboardStatsSchema = new mongoose.Schema({
    totalStudents: {
        type: Number,
        required: true,
        default: 0
    },
    totalTeachers: {
        type: Number,
        required: true,
        default: 0
    },
    totalClasses: {
        type: Number,
        required: true,
        default: 0
    },
    attendanceRate: {
        type: Number,
        required: true,
        default: 0
    },
    recentActivities: [{
        type: {
            type: String,
            enum: ['student_added', 'teacher_added', 'attendance_taken', 'grade_updated', 'assignment_added'],
            required: true
        },
        description: {
            type: String,
            required: true
        },
        timestamp: {
            type: Date,
            default: Date.now
        },
        metadata: {
            studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
            teacherId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
            classId: { type: mongoose.Schema.Types.ObjectId, ref: 'Class' },
            // Add other relevant metadata fields
        }
    }],
    lastUpdated: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

// Add a static method to get the latest stats
// This ensures we always have a single document for stats
dashboardStatsSchema.statics.getStats = async function() {
    let stats = await this.findOne().sort({ createdAt: -1 });
    
    if (!stats) {
        // Create default stats if none exist
        stats = await this.create({
            totalStudents: 0,
            totalTeachers: 0,
            totalClasses: 0,
            attendanceRate: 0,
            recentActivities: []
        });
    }
    
    return stats;
};

// Update stats when a new student is added
dashboardStatsSchema.statics.updateStudentCount = async function(change) {
    const stats = await this.getStats();
    stats.totalStudents += change;
    await stats.save();
    return stats;
};

// Update stats when a new teacher is added
dashboardStatsSchema.statics.updateTeacherCount = async function(change) {
    const stats = await this.getStats();
    stats.totalTeachers += change;
    await stats.save();
    return stats;
};

// Add a recent activity
dashboardStatsSchema.statics.addActivity = async function(activity) {
    const stats = await this.getStats();
    
    // Add new activity to the beginning of the array
    stats.recentActivities.unshift({
        type: activity.type,
        description: activity.description,
        metadata: activity.metadata || {}
    });
    
    // Keep only the 10 most recent activities
    if (stats.recentActivities.length > 10) {
        stats.recentActivities = stats.recentActivities.slice(0, 10);
    }
    
    await stats.save();
    return stats;
};

module.exports = mongoose.model('DashboardStats', dashboardStatsSchema);
