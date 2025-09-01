// controllers/schoolUserController.js
const SchoolUser = require('../models/SchoolUser');
const User = require('../models/User');  // Import the User model

// Delete a user
exports.deleteUser = async (req, res) => {
  try {
    const userId = req.params.id;
    
    // First try to delete from SchoolUser collection
    let deletedUser = await SchoolUser.findByIdAndDelete(userId);
    
    // If not found in SchoolUser, try the User collection
    if (!deletedUser) {
      deletedUser = await User.findByIdAndDelete(userId);
    }
    
    if (!deletedUser) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.json({ message: 'User deleted successfully' });
  } catch (err) {
    console.error('Error deleting user:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Get all users (admins, teachers, students) with filtering support
exports.getAllUsers = async (req, res) => {
  try {
    const { search, role, status } = req.query;
    let filter = {};

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { username: { $regex: search, $options: 'i' } }
      ];
    }
    if (role) filter.role = role;
    if (status) filter.status = status;

    const users = await SchoolUser.find(filter);
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err });
  }
};

// Create a new user (teacher/student)
exports.createUser = async (req, res) => {
  const { name, email, password, role, subject, studentClass } = req.body;

  try {
    const newUser = new SchoolUser({
      name,
      email,
      password,  // Consider hashing the password for security
      role,
      subject: role === 'teacher' ? subject : undefined,
      studentClass: role === 'student' ? studentClass : undefined,
    });

    await newUser.save();  // Save the new user to the database
    res.status(201).json({ message: 'User created successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err });
  }
};
