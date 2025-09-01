// scripts/checkReportCards.js
require('dotenv').config();
const mongoose = require('mongoose');
const ReportCard = require('../models/ReportCard');

async function checkReportCards() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/SW', {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('Connected to MongoDB');

    // Count total report cards
    const count = await ReportCard.countDocuments({});
    console.log(`Total report cards in database: ${count}`);

    if (count > 0) {
      // Sample a few report cards
      const sampleCards = await ReportCard.find({}).limit(3);
      console.log('Sample report cards:', JSON.stringify(sampleCards, null, 2));
      
      // Check if any report cards have a studentId
      const withStudentId = await ReportCard.countDocuments({ studentId: { $exists: true, $ne: null } });
      console.log(`Report cards with studentId: ${withStudentId}/${count}`);
      
      // Check for any report cards without studentId
      if (withStudentId < count) {
        const noStudentId = await ReportCard.find({ $or: [
          { studentId: { $exists: false } },
          { studentId: null }
        ]}).limit(3);
        console.log('Sample report cards without studentId:', JSON.stringify(noStudentId, null, 2));
      }
    }
  } catch (error) {
    console.error('Error checking report cards:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

checkReportCards();
