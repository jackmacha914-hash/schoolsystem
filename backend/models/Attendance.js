const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
  class: { type: String, required: true },
  date: { type: Date, required: true, default: Date.now },
  records: [{
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    status: { 
      type: String, 
      enum: ['present', 'absent', 'late', 'excused'], 
      default: 'present' 
    },
    remarks: { type: String, default: '' }
  }],
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  createdAt: { type: Date, default: Date.now }
});

// Create a compound index to ensure one attendance record per class per day
attendanceSchema.index({ class: 1, date: 1, createdBy: 1 }, { unique: true });

module.exports = mongoose.model('Attendance', attendanceSchema);
