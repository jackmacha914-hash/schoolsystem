const mongoose = require('mongoose');

const classSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Class name is required'],
    trim: true
  },
  level: {
    type: String,
    enum: ['Pre-School', 'Primary', 'Elementary', 'Middle School', 'High School'],
    required: [true, 'Education level is required']
  },
  section: {
    type: String,
    trim: true,
    default: ''
  },
  capacity: {
    type: Number,
    required: [true, 'Class capacity is required'],
    min: [1, 'Capacity must be at least 1'],
    default: 30
  },
  studentCount: {
    type: Number,
    default: 0
  },
  teacherInCharge: {
    type: String,
    trim: true,
    default: ''
  },
  roomNumber: {
    type: String,
    trim: true,
    default: ''
  },
  academicYear: {
    type: String,
    required: [true, 'Academic year is required'],
    trim: true
  },
  notes: {
    type: String,
    trim: true,
    default: ''
  },
  // Reference to students (if needed in the future)
  students: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student'
  }],
  // Reference to teacher (if needed in the future)
  teacher: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, { timestamps: true });

// Indexes for faster queries and data integrity
classSchema.index({ name: 1, academicYear: 1 }, { unique: true });
classSchema.index({ level: 1, section: 1, academicYear: 1 }, { unique: true });
classSchema.index({ teacherInCharge: 1 });

module.exports = mongoose.model('Class', classSchema);
