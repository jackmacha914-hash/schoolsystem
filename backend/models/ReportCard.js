// models/ReportCard.js
const mongoose = require('mongoose');
const path = require('path');

const reportCardSchema = new mongoose.Schema({
  studentId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true,
    index: true
  },
  studentName: { 
    type: String, 
    required: true 
  },
  year: { 
    type: String, 
    required: true,
    index: true
  },
  term: { 
    type: String, 
    required: true,
    index: true
  },
  comments: { 
    type: String 
  },
  path: { 
    type: String, 
    required: true 
  },
  htmlPath: {
    type: String,
    required: true
  },
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  status: {
    type: String,
    enum: ['draft', 'published', 'archived'],
    default: 'published'
  },
  htmlContent: {
    type: String,
    default: ''
  }
}, { 
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for file URL
reportCardSchema.virtual('fileUrl').get(function() {
  if (!this.path) return null;
  return `/uploads/report-cards/${this.path}`;
});

// Indexes for better query performance
reportCardSchema.index({ studentId: 1, year: 1, term: 1 });
reportCardSchema.index({ uploadedBy: 1 });
reportCardSchema.index({ status: 1 });

// Pre-save hook to ensure consistent data
reportCardSchema.pre('save', function(next) {
  // Ensure studentName is properly formatted
  if (this.studentName) {
    this.studentName = this.studentName.trim();
  }
  
  // Ensure term is properly formatted (e.g., 'Term 1' instead of 'term 1')
  if (this.term) {
    this.term = this.term.trim();
    // Capitalize first letter of each word in term
    this.term = this.term.split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  }
  
  next();
});

module.exports = mongoose.model('ReportCard', reportCardSchema);
