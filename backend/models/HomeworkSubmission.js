const mongoose = require('mongoose');

const homeworkSubmissionSchema = new mongoose.Schema({
    homework: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Homework',
        required: true
    },
    student: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    submissionFile: {
        type: String,
        required: true
    },
    comments: {
        type: String,
        default: ''
    },
    grade: {
        type: Number,
        min: 0,
        max: 100
    },
    submittedAt: {
        type: Date,
        default: Date.now
    },
    gradedAt: {
        type: Date
    },
    teacherFeedback: {
        type: String,
        default: ''
    }
}, {
    timestamps: true
});

// Add index for faster queries
homeworkSubmissionSchema.index({ homework: 1, student: 1 }, { unique: true });

const HomeworkSubmission = mongoose.model('HomeworkSubmission', homeworkSubmissionSchema);

module.exports = HomeworkSubmission;
