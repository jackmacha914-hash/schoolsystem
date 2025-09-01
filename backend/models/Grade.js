const mongoose = require('mongoose');

const GradeSchema = new mongoose.Schema({
    student: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User', 
        required: true 
    },
    studentName: { 
        type: String, 
        required: true 
    },
    class: { 
        type: String, 
        required: true 
    },
    subject: { 
        type: String, 
        required: true 
    },
    score: { 
        type: Number, 
        required: true,
        min: 0,
        max: 100
    },
    term: {
        type: String,
        required: true,
        enum: ['Term 1', 'Term 2', 'Term 3']
    },
    academicYear: {
        type: String,
        required: true,
        match: [/^\d{4}-\d{4}$/, 'Please enter a valid academic year (e.g., 2024-2025)']
    },
    teacher: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User', 
        required: true 
    },
    comments: {
        type: String,
        default: ''
    },
    isFinalized: {
        type: Boolean,
        default: false
    }
}, { 
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Index for faster querying
GradeSchema.index({ student: 1, subject: 1, term: 1, academicYear: 1 }, { unique: true });

// Virtual for grade letter
GradeSchema.virtual('grade').get(function() {
    if (this.score >= 80) return 'A';
    if (this.score >= 70) return 'A-';
    if (this.score >= 60) return 'B+';
    if (this.score >= 50) return 'B';
    if (this.score >= 40) return 'B-';
    if (this.score >= 30) return 'C+';
    if (this.score >= 20) return 'C';
    return 'E';
});

// Virtual for remarks
GradeSchema.virtual('remarks').get(function() {
    if (this.score >= 70) return 'Excellent';
    if (this.score >= 60) return 'Very Good';
    if (this.score >= 50) return 'Good';
    if (this.score >= 40) return 'Average';
    return 'Needs Improvement';
});

// Pre-save hook to ensure data consistency
GradeSchema.pre('save', async function(next) {
    // If student name is not provided, fetch it from the student document
    if (!this.studentName && this.student) {
        try {
            const User = mongoose.model('User');
            const student = await User.findById(this.student);
            if (student) {
                this.studentName = student.name;
            }
        } catch (error) {
            return next(error);
        }
    }
    next();
});

module.exports = mongoose.model('Grade', GradeSchema);
