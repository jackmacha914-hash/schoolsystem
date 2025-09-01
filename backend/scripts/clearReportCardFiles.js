const fs = require('fs');
const path = require('path');

// Path to the report cards upload directory
const uploadDir = path.join(__dirname, '..', 'uploads', 'report-cards');

// Function to delete all files in a directory
function clearReportCardFiles() {
  try {
    console.log(`Checking directory: ${uploadDir}`);
    
    // Check if directory exists
    if (!fs.existsSync(uploadDir)) {
      console.log('Report cards directory does not exist. Nothing to delete.');
      return;
    }
    
    // Read all files in the directory
    const files = fs.readdirSync(uploadDir);
    
    if (files.length === 0) {
      console.log('No report card files found in the directory.');
      return;
    }
    
    console.log(`Found ${files.length} report card file(s) to delete.`);
    
    // Delete each file
    let deletedCount = 0;
    files.forEach(file => {
      try {
        const filePath = path.join(uploadDir, file);
        fs.unlinkSync(filePath);
        console.log(`Deleted: ${file}`);
        deletedCount++;
      } catch (err) {
        console.error(`Error deleting file ${file}:`, err.message);
      }
    });
    
    console.log(`\nSuccessfully deleted ${deletedCount} report card file(s).`);
    
  } catch (error) {
    console.error('Error clearing report card files:', error.message);
    process.exit(1);
  }
}

// Run the function
clearReportCardFiles();
