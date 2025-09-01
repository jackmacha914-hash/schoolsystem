const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configure upload directory for homework submissions
const homeworkUploadDir = path.join(__dirname, '..', 'uploads', 'homeworks');

// Create directory if it doesn't exist
if (!fs.existsSync(homeworkUploadDir)) {
  fs.mkdirSync(homeworkUploadDir, { recursive: true });
}

// Configure multer for homework submissions
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, homeworkUploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    const prefix = req.originalUrl.includes('submit') ? 'submission-' : 'homework-';
    cb(null, prefix + uniqueSuffix + ext);
  }
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = ['.pdf', '.doc', '.docx', '.jpg', '.jpeg', '.png'];
  const ext = path.extname(file.originalname).toLowerCase();
  if (allowedTypes.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error('Only PDF, Word documents, and images are allowed'));
  }
};

const uploadLimits = {
  fileSize: 5 * 1024 * 1024, // 5MB limit
  files: 1
};

// Create separate middleware for homework and submission uploads
const homeworkUpload = (req, res, next) => {
  const upload = multer({
    storage,
    fileFilter,
    limits: uploadLimits
  }).single(req.originalUrl.includes('submit') ? 'submissionFile' : 'homework-file');
  
  upload(req, res, (err) => {
    if (err) {
      return next(err);
    }
    next();
  });
};

module.exports = homeworkUpload;
