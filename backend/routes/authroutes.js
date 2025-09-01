const express = require('express');
const { registerUser, loginUser } = require('../controllers/authController');

const router = express.Router();

// Signup/Register Routes (both /signup and /register point to the same handler)
router.post('/signup', registerUser);
router.post('/register', registerUser);

// Login Route
router.post('/login', loginUser);

module.exports = router;
