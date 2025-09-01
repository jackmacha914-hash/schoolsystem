const mongoose = require('mongoose');
require('dotenv').config();

// MongoDB connection URI
const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/SW';

async function clearGradesCollection() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('Connected to MongoDB');
    
    // Get the grades collection
    const gradesCollection = mongoose.connection.db.collection('grades');
    
    // Delete all documents
    console.log('Deleting all grades...');
    const result = await gradesCollection.deleteMany({});
    
    console.log(`\nSuccess! Deleted ${result.deletedCount} grade records.`);
    
    // Verify the collection is empty
    const count = await gradesCollection.countDocuments();
    console.log(`Grades collection now contains ${count} documents.`);
    
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  } finally {
    // Close the connection
    await mongoose.connection.close();
    console.log('MongoDB connection closed.');
  }
}

// Run the function
clearGradesCollection();
