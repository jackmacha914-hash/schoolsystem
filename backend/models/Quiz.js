// backend/models/Quiz.js
const mongoose = require('mongoose');

const quizSchema = new mongoose.Schema({
    title: { 
        type: String, 
        required: [true, 'Quiz title is required'],
        trim: true
    },
    description: {
        type: String,
        trim: true
    },
    class: {
        type: String,
        required: [true, 'Class is required'],
        trim: true
    },
    subject: {
        type: String,
        required: [true, 'Subject is required'],
        trim: true
    },
    teacherId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User', 
        required: [true, 'Teacher ID is required'] 
    },
    questions: [
        {
            questionText: { 
                type: String, 
                required: [true, 'Question text is required'],
                trim: true
            },
            options: [{ 
                type: String, 
                required: [true, 'At least one option is required'],
                trim: true
            }],
            correctAnswer: { 
                type: Number, 
                required: [true, 'Correct answer index is required'],
                min: [0, 'Correct answer index must be a positive number']
            },
            points: {
                type: Number,
                default: 1,
                min: [0, 'Points must be a positive number']
            },
            explanation: {
                type: String,
                trim: true
            }
        }
    ],
    timeLimit: { 
        type: Number, 
        default: 30, // Default 30 minutes
        min: [1, 'Time limit must be at least 1 minute']
    },
    passingScore: {
        type: Number,
        default: 60, // Default 60%
        min: [0, 'Passing score must be at least 0%'],
        max: [100, 'Passing score cannot exceed 100%']
    },
    isPublished: { 
        type: Boolean, 
        default: false 
    },
    allowMultipleAttempts: {
        type: Boolean,
        default: false
    },
    showCorrectAnswers: {
        type: Boolean,
        default: true
    },
    createdAt: { 
        type: Date, 
        default: Date.now 
    },
    updatedAt: { 
        type: Date, 
        default: Date.now 
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Indexes for better query performance
quizSchema.index({ title: 'text', description: 'text' });
quizSchema.index({ teacherId: 1, isPublished: 1 });
quizSchema.index({ class: 1 }); // Add index for class field for faster lookups
quizSchema.index({ subject: 1 }); // Add index for subject field for faster lookups

// Virtual for total points
quizSchema.virtual('totalPoints').get(function() {
    return this.questions.reduce((sum, q) => sum + (q.points || 1), 0);
});

// Update the updatedAt field before saving
quizSchema.pre('save', function(next) {
    this.updatedAt = new Date();
    next();
});

module.exports = mongoose.model('Quiz', quizSchema);
