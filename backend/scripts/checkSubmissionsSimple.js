const mongoose = require('mongoose');

// Replace this with your MongoDB connection string
const MONGODB_URI = 'mongodb://localhost:27017/your_database_name';

async function checkSubmissions() {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(MONGODB_URI, { 
            useNewUrlParser: true, 
            useUnifiedTopology: true 
        });
        console.log('Connected to MongoDB');

        // Get the Submission model
        const Submission = mongoose.model('Submission', new mongoose.Schema({
            quiz: { type: mongoose.Schema.Types.ObjectId, ref: 'Quiz' },
            user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
            answers: [{
                question: { type: mongoose.Schema.Types.ObjectId },
                selectedOption: String,
                isCorrect: Boolean,
                pointsEarned: Number
            }],
            score: Number,
            totalScore: Number,
            percentage: Number,
            passed: Boolean,
            timeSpent: Number,
            submittedAt: Date,
            studentName: String,
            studentEmail: String,
            class: mongoose.Schema.Types.Mixed,
            className: String,
            quizTitle: String,
            subject: String
        }));

        // Get total count of submissions
        const count = await Submission.countDocuments();
        console.log('Total submissions in database:', count);

        if (count > 0) {
            // Get a few sample submissions
            const submissions = await Submission.find().limit(5).lean();
            console.log('Sample submissions:');
            console.log(JSON.stringify(submissions, null, 2));
            
            // Get the quiz IDs from submissions
            const quizIds = [...new Set(submissions.map(sub => sub.quiz && sub.quiz.toString()))];
            console.log('Quiz IDs found in submissions:', quizIds);
        } else {
            console.log('No submissions found in the database.');
        }

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await mongoose.disconnect();
        console.log('Disconnected from MongoDB');
    }
}

checkSubmissions();
