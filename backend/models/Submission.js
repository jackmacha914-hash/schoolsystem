const mongoose = require('mongoose');

// Custom validator for class field that accepts both ObjectId and string
const classValidator = {
    validator: function(v) {
        // Allow ObjectId or string
        return mongoose.Types.ObjectId.isValid(v) || typeof v === 'string';
    },
    message: props => `${props.value} is not a valid class identifier!`
};

const submissionSchema = new mongoose.Schema({
    quiz: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Quiz',
        required: true
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    answers: [{
        question: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Quiz.questions._id'
        },
        selectedOption: {
            type: String,
            required: true
        },
        isCorrect: {
            type: Boolean,
            default: false
        },
        pointsEarned: {
            type: Number,
            default: 0
        }
    }],
    score: {
        type: Number,
        default: 0
    },
    totalScore: {
        type: Number,
        required: true
    },
    percentage: {
        type: Number,
        required: true
    },
    passed: {
        type: Boolean,
        default: false
    },
    timeSpent: {
        type: Number, // in seconds
        default: 0
    },
    submittedAt: {
        type: Date,
        default: Date.now
    },
    // Additional fields for student information that might be useful
    studentName: {
        type: String,
        required: true
    },
    studentEmail: {
        type: String,
        required: true
    },
    // Reference to the class (can be either ObjectId or string)
    class: {
        type: mongoose.Schema.Types.Mixed,
        required: true,
        validate: classValidator
    },
    // Store class name separately for easier querying
    className: {
        type: String,
        required: true
    },
    // Additional fields for better querying
    quizTitle: {
        type: String,
        required: true
    },
    subject: {
        type: String,
        required: true
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Indexes for better query performance
submissionSchema.index({ quiz: 1, user: 1 });
submissionSchema.index({ user: 1, submittedAt: -1 });

// Virtual for time spent in minutes
submissionSchema.virtual('timeSpentMinutes').get(function() {
    return Math.ceil(this.timeSpent / 60);
});

// Method to calculate score and update submission
submissionSchema.methods.calculateScore = async function() {
    const quiz = await mongoose.model('Quiz').findById(this.quiz);
    if (!quiz) return;

    let score = 0;
    let totalPossible = 0;

    this.answers.forEach(answer => {
        const question = quiz.questions.id(answer.question);
        if (!question) return;

        totalPossible += question.points || 1;
        
        if (answer.selectedOption === question.correctAnswer) {
            answer.isCorrect = true;
            answer.pointsEarned = question.points || 1;
            score += answer.pointsEarned;
        } else {
            answer.isCorrect = false;
            answer.pointsEarned = 0;
        }
    });

    this.score = score;
    this.totalScore = totalPossible;
    this.percentage = totalPossible > 0 ? Math.round((score / totalPossible) * 100) : 0;
    this.passed = this.percentage >= (quiz.passingScore || 70);

    return this.save();
};

const Submission = mongoose.model('Submission', submissionSchema);

module.exports = Submission;
