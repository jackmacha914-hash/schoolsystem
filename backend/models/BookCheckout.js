const mongoose = require('mongoose');

const bookCheckoutSchema = new mongoose.Schema({
    book: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Book',
        required: true
    },
    student: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Student',
        required: true
    },
    checkedOutDate: {
        type: Date,
        default: Date.now,
        required: true
    },
    dueDate: {
        type: Date,
        required: true
    },
    returnedDate: {
        type: Date
    },
    status: {
        type: String,
        enum: ['checked-out', 'returned', 'overdue'],
        default: 'checked-out'
    },
    fine: {
        type: Number,
        default: 0
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    school: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'School',
        required: true
    }
}, {
    timestamps: true
});

// Update status based on dates
bookCheckoutSchema.pre('save', function(next) {
    if (this.isModified('returnedDate') && this.returnedDate) {
        this.status = 'returned';
        // Calculate fine if returned after due date
        if (this.returnedDate > this.dueDate) {
            const daysLate = Math.ceil((this.returnedDate - this.dueDate) / (1000 * 60 * 60 * 24));
            // Example: $0.50 per day late
            this.fine = daysLate * 0.5;
        }
    } else if (this.dueDate < new Date() && this.status === 'checked-out') {
        this.status = 'overdue';
    }
    next();
});

// Indexes for faster queries
bookCheckoutSchema.index({ book: 1, status: 1 });
bookCheckoutSchema.index({ student: 1, status: 1 });
bookCheckoutSchema.index({ dueDate: 1 });

const BookCheckout = mongoose.model('BookCheckout', bookCheckoutSchema);

module.exports = BookCheckout;
