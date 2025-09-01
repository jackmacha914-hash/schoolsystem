const mongoose = require('mongoose');

// Validate class format (e.g., 'Grade 1', 'Form 1')
const validateClass = (value) => {
  if (!value) return true; // Allow empty for non-students
  return /^(Grade\s\d{1,2}|Form\s[1-4]|PP[12])$/i.test(value);
};

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { 
    type: String, 
    required: true, 
    enum: ['student', 'teacher', 'admin'],
    default: 'student'
  },
  class: { 
    type: String, 
    default: '',
    validate: {
      validator: function(v) {
        // Only validate class for students
        return this.role !== 'student' || validateClass(v);
      },
      message: props => `${props.value} is not a valid class. Please use format 'Grade X' or 'Form X'`
    }
  },
  classAssigned: { type: String, default: '' }, // For backward compatibility
  completedQuizzes: [{
    quizId: { type: mongoose.Schema.Types.ObjectId, ref: 'Quiz' },
    score: Number,
    totalQuestions: Number,
    completedAt: { type: Date, default: Date.now }
  }],
  profile: {
    dob: Date,
    gender: String,
    address: String,
    class: { type: String, default: '' }, // Ensure class is defined in profile
    specialization: String,
    subjects: [String],
    photo: String,
    emergencyContact: {
      name: String,
      phone: String,
      relationship: String
    },
    health: {
      bloodGroup: String,
      allergies: [String],
      medicalConditions: [String],
      medications: [String]
    }
  }
});

// Pre-save hook to keep class in sync between root and profile
userSchema.pre('save', function(next) {
  console.log('Pre-save hook - Current class data:', {
    rootClass: this.class,
    classAssigned: this.classAssigned,
    profileClass: this.profile?.class,
    isNew: this.isNew
  });

  // If class is set at root level, ensure it's in profile and classAssigned
  if (this.class) {
    this.profile = this.profile || {};
    this.profile.class = this.class;
    this.classAssigned = this.class;
  } 
  // If class is set in profile, ensure it's at root level and in classAssigned
  else if (this.profile?.class) {
    this.class = this.profile.class;
    this.classAssigned = this.profile.class;
  }
  // If classAssigned is set but not class, use it for both
  else if (this.classAssigned) {
    this.class = this.classAssigned;
    this.profile = this.profile || {};
    this.profile.class = this.classAssigned;
  }
  
  // Final check to ensure all are in sync
  if (this.class) {
    this.classAssigned = this.class;
    this.profile = this.profile || {};
    this.profile.class = this.class;
  }
  
  console.log('Pre-save hook - Updated class data:', {
    rootClass: this.class,
    classAssigned: this.classAssigned,
    profileClass: this.profile?.class
  });
  
  next();
});

module.exports = mongoose.models.User || mongoose.model('User', userSchema);
