// scripts/updateReportCards.js
require('dotenv').config();
const mongoose = require('mongoose');
const ReportCard = require('../models/ReportCard');
const User = require('../models/User');

async function updateReportCards() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('Connected to MongoDB');

    // Find all report cards that are missing studentId or uploadedBy
    const reportCards = await ReportCard.find({
      $or: [
        { studentId: { $exists: false } },
        { uploadedBy: { $exists: false } }
      ]
    });

    console.log(`Found ${reportCards.length} report cards to update`);

    // Update each report card
    for (const reportCard of reportCards) {
      // Find a user with a matching name
      const user = await User.findOne({
        name: new RegExp(reportCard.studentName, 'i')
      });

      if (user) {
        reportCard.studentId = user._id;
        reportCard.uploadedBy = user._id; // Assuming the student uploaded their own report card
        await reportCard.save();
        console.log(`Updated report card ${reportCard._id} for student ${reportCard.studentName}`);
      } else {
        console.log(`No user found for report card ${reportCard._id} (student: ${reportCard.studentName})`);
      }
    }

    console.log('Update complete');
    process.exit(0);
  } catch (error) {
    console.error('Error updating report cards:', error);
    process.exit(1);
  }
}

updateReportCards();