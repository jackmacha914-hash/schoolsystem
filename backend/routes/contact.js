const express = require('express');
const router = express.Router();
const Message = require('../models/Message');

// @route   POST /api/contact
// @desc    Handle contact form submission
router.post('/', async (req, res) => {
  const { name, email, message } = req.body;

  if (!name || !email || !message) {
    return res.status(400).json({ success: false, message: 'All fields are required' });
  }

  try {
    const newMessage = new Message({ name, email, message });
    await newMessage.save();
    res.status(201).json({ success: true, message: 'Message received! We’ll get back to you soon.' });
  } catch (err) {
    console.error('Error saving contact message:', err);
    res.status(500).json({ success: false, message: 'Something went wrong' });
  }
});

module.exports = router;
