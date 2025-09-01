const mongoose = require('mongoose');

const schoolUserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, unique: true },
  password: { type: String, required: true }, // stored as plain text
  role: { type: String, enum: ['Admin', 'Teacher', 'Student'], required: true },
  subject: { type: String },
  studentClass: { type: String },
}, { timestamps: true });

module.exports = mongoose.model('SchoolUserModel', schoolUserSchema);
