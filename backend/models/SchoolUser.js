const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const schoolUserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: {
    type: String,
    enum: ['admin', 'teacher', 'student'],
    required: true
  },
  subject: { type: String },        // Only for teachers
  studentClass: { type: String }    // Only for students
}, { timestamps: true });

schoolUserSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

module.exports = mongoose.model('SchoolUser', schoolUserSchema);
