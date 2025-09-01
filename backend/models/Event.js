// models/Event.js
const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
  title: String,
  description: String,
  date: Date,
  location: String
});

module.exports = mongoose.models.Event || mongoose.model('Event', eventSchema);
