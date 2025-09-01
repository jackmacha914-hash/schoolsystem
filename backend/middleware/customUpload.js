const multer = require('multer');
const path = require('path');

// Configure storage
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadPath = path.join(__dirname, '../uploads/assignments');
        cb(null, uploadPath);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

// File filter
const fileFilter = (req, file, cb) => {
    if (file.mimetype.startsWith('application/')) {
        cb(null, true);
    } else {
        cb(new Error('File type not supported'));
    }
};

// Create upload instance
const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 20 * 1024 * 1024 // 20MB limit
    }
});

// Custom file upload middleware
const customFileUpload = async (req, res, next) => {
    try {
        console.log('\n=== Custom File Upload Middleware ===');
        console.log('Request Content-Type:', req.headers['content-type']);
        console.log('Request Headers:', req.headers);
        
        // Create a buffer to store the incoming data
        let chunks = [];
        
        // Collect all chunks of data
        req.on('data', chunk => {
            chunks.push(chunk);
        });
        
        req.on('end', async () => {
            // Combine chunks into a single buffer
            const buffer = Buffer.concat(chunks);
            
            // Create a new request object with the buffer
            const newReq = {
                ...req,
                body: buffer.toString(),
                file: buffer
            };
            
            // Use multer to process the file
            await upload.single('assignment-file')(newReq, res, (err) => {
                if (err) {
                    console.error('Multer error:', err);
                    return res.status(400).json({
                        success: false,
                        error: err.message
                    });
                }
                
                // Update the original request with multer's processed file
                req.file = newReq.file;
                next();
            });
        });
    } catch (error) {
        console.error('Custom upload error:', error);
        return res.status(400).json({
            success: false,
            error: error.message
        });
    }
};

module.exports = customFileUpload;
