const mongoose = require('mongoose');
require('dotenv').config();

// MongoDB connection URI
const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/SW';

async function clearGrades() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('Connected to MongoDB');
    
    // Get the collection
    const collection = mongoose.connection.db.collection('grades');
    
    // Delete all documents
    console.log('Deleting all grades...');
    const result = await collection.deleteMany({});
    
    console.log(`\nSuccess! Deleted ${result.deletedCount} grade records.`);
    
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
clearGrades();
