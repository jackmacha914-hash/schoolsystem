const express = require('express');
const mongoose = require('mongoose');
const User = mongoose.models.User || require('../models/User');
const router = express.Router();
const schoolUserController = require('../controllers/schoolUserController');

// Get All Users (No Auth for dashboard compatibility)
router.get('/', async (req, res) => {
  try {
    const users = await User.find().select('-password');
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get Single User by ID
router.get('/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ✅ Create User (Accessible to Admins only)
router.post('/', schoolUserController.createUser);

// ✅ Delete User
router.delete('/:id', schoolUserController.deleteUser);

module.exports = router;
