const mongoose = require('mongoose');

// Replace with your MongoDB connection string
const MONGODB_URI = 'mongodb://localhost:27017/your_database_name';

async function checkSubmissions() {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(MONGODB_URI, { 
            useNewUrlParser: true, 
            useUnifiedTopology: true 
        });
        console.log('Connected to MongoDB');

        // Get the submissions collection directly
        const db = mongoose.connection.db;
        const submissions = await db.collection('submissions').find({}).toArray();
        
        console.log(`Found ${submissions.length} submissions in the database`);
        
        if (submissions.length > 0) {
            console.log('Sample submission:');
            console.log(JSON.stringify(submissions[0], null, 2));
            
            // Check for submissions with the specific quiz ID we know exists
            const quizId = '6877b198ec3565e998f3f215'; // From your logs
            const quizSubmissions = await db.collection('submissions').find({
                'quiz': new mongoose.Types.ObjectId(quizId)
            }).toArray();
            
            console.log(`Found ${quizSubmissions.length} submissions for quiz ${quizId}`);
            if (quizSubmissions.length > 0) {
                console.log('Quiz submission details:');
                console.log(JSON.stringify(quizSubmissions[0], null, 2));
            }
        }

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await mongoose.disconnect();
        console.log('Disconnected from MongoDB');
    }
}

checkSubmissions();
