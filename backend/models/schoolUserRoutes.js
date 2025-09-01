const express = require('express');
const SchoolUser = require('../models/SchoolUser');  // Use SchoolUser here
const authMiddleware = require('../middleware/authMiddleware');  // Assuming you have this middleware
const router = express.Router();

// Route for getting all users (admins, teachers, students)
router.get('/', authMiddleware, async (req, res) => {
  try {
    const users = await SchoolUser.find();
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err });
  }
});

// Route to add a new user (admin/teacher/student)
router.post('/', authMiddleware, async (req, res) => {
  const { name, email, password, role, subject, studentClass } = req.body;

  try {
    const newUser = new SchoolUser({
      name,
      email,
      password,
      role,
      subject: role === 'teacher' ? subject : undefined,
      studentClass: role === 'student' ? studentClass : undefined,
    });

    await newUser.save();
    res.status(201).json({ message: 'User created successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err });
  }
});

module.exports = router;
