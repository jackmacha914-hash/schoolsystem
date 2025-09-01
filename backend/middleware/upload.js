// middleware/upload.js
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configure upload directories for both assignments and homework
const uploadDirs = {
  assignments: path.join(__dirname, '..', 'uploads', 'assignments'),
  homeworks: path.join(__dirname, '..', 'uploads', 'homeworks')
};

// Create directories if they don't exist
Object.values(uploadDirs).forEach(dir => {
  try {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      console.log(`Created directory: ${dir}`);
    }
    console.log(`Directory exists: ${dir}`);
  } catch (err) {
    console.error(`Error creating directory ${dir}:`, err);
  }
});

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Determine which directory to use based on the field name
    const dir = file.fieldname === 'assignment-file' ? uploadDirs.assignments : 
                (file.fieldname === 'homework-file' || file.fieldname === 'submissionFile') ? uploadDirs.homeworks : 
                uploadDirs.assignments;
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, uniqueSuffix + ext);
  }
});

const upload = multer({ storage });

module.exports = upload;
