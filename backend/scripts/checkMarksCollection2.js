const mongoose = require('mongoose');
require('dotenv').config();

// MongoDB connection URI
const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/SW';

async function checkMarksCollection() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('Connected to MongoDB');
    
    // Get the marks collection
    const marksCollection = mongoose.connection.db.collection('marks');
    
    // Count documents
    const count = await marksCollection.countDocuments();
    console.log(`\nTotal documents in 'marks' collection: ${count}`);
    
    // Get one document to see its structure
    if (count > 0) {
      const sampleDoc = await marksCollection.findOne();
      console.log('\nSample document structure:');
      console.log(JSON.stringify(sampleDoc, null, 2));
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    // Close the connection
    await mongoose.connection.close();
    console.log('\nMongoDB connection closed.');
  }
}

// Run the function
checkMarksCollection();
