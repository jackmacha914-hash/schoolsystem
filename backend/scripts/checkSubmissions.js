const mongoose = require('mongoose');
const config = require('../config/config');
const Submission = require('../models/Submission');

async function checkSubmissions() {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(config.mongoURI, { 
            useNewUrlParser: true, 
            useUnifiedTopology: true 
        });
        console.log('Connected to MongoDB');

        // Get total count of submissions
        const count = await Submission.countDocuments();
        console.log('Total submissions in database:', count);

        if (count > 0) {
            // Get a few sample submissions
            const submissions = await Submission.find().limit(5).lean();
            console.log('Sample submissions:');
            console.log(JSON.stringify(submissions, null, 2));
            
            // Get the quiz IDs from submissions
            const quizIds = [...new Set(submissions.map(sub => sub.quiz))];
            console.log('Quiz IDs found in submissions:', quizIds);
        }

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await mongoose.disconnect();
        console.log('Disconnected from MongoDB');
    }
}

checkSubmissions();
