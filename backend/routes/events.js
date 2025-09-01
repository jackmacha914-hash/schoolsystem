// routes/events.js
const express = require('express');
const mongoose = require('mongoose');
const Event = mongoose.models.Event || require('../models/Event');
const router = express.Router();

// Get all events
router.get('/', async (req, res) => {
  try {
    const events = await Event.find();
    res.json(events);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create a new event
router.post('/', async (req, res) => {
    const { title, description, date, location } = req.body;
    const event = new Event({ title, description, date, location });

    try {
        await event.save();
        res.status(201).json(event);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

module.exports = router;
