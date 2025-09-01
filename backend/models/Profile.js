const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');  // For password hashing

const profileSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  subjects: {
    type: [String],
    required: true,
  },
  password: {
    type: String,
    required: true,
  },
  photo: {
    type: String,  // URL or base64 data for the profile photo
    default: '',
  },
}, { timestamps: true });

// Hash password before saving
profileSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Compare entered password with hashed password
profileSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('Profile', profileSchema);
