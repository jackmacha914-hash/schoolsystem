// routes/reportCardRoutes.js
const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const { v4: uuidv4 } = require('uuid');
// Puppeteer is not available
const puppeteer = null;
const ReportCard = require('../models/ReportCard');
const User = require('../models/User');
const { 
    sendReportCard, 
    getStudentReportCards, 
    getReportCard,
    getAllReportCards 
} = require('../controllers/reportCardController');
const { protect, authorize } = require('../middleware/auth');
const { generatePdfFromHtml } = require('../utils/pdfGenerator');

// Alias for backward compatibility
const authenticateUser = protect;
const authorizeRoles = (...roles) => authorize(...roles);

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: async (req, file, cb) => {
        // Save to backend's public directory
        const uploadDir = path.join(__dirname, '../public/uploads/report-cards');
        await fs.mkdir(uploadDir, { recursive: true });
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1E9)}`;
        const ext = path.extname(file.originalname) || '.pdf'; // Default to .pdf if no extension
        const filename = `report-${uniqueSuffix}${ext}`;
        console.log('Saving report card to:', path.join(__dirname, '../public/uploads/report-cards', filename));
        cb(null, filename);
    }
});

const fileFilter = (req, file, cb) => {
    // Accept only PDF, DOCX, and HTML files
    const allowedTypes = ['.pdf', '.docx', '.html', '.htm'];
    const ext = path.extname(file.originalname).toLowerCase();
    
    if (allowedTypes.includes(ext)) {
        cb(null, true);
    } else {
        cb(new Error(`Invalid file type. Only ${allowedTypes.join(', ')} files are allowed.`), false);
    }
};

const upload = multer({ 
    storage, 
    fileFilter,
    limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

// Middleware to handle file upload errors
const handleFileUploadErrors = (err, req, res, next) => {
    if (err instanceof multer.MulterError) {
        // A Multer error occurred when uploading
        return res.status(400).json({
            success: false,
            message: `File upload error: ${err.message}`
        });
    } else if (err) {
        // An unknown error occurred
        return res.status(500).json({
            success: false,
            message: `Error processing file upload: ${err.message}`
        });
    }
    next();
};

/**
 * @route   POST /api/report-cards
 * @desc    Create a new report card (with or without file upload)
 * @access  Teacher, Admin
 */
router.post(
    '/',
    authenticateUser,
    authorizeRoles(['teacher', 'admin']),
    (req, res, next) => {
        // If no file is being uploaded, skip multer
        if (!req.is('multipart/form-data') || !req.headers['content-type']?.includes('multipart/form-data')) {
            return next();
        }
        // Otherwise, use multer for file upload
        upload.single('reportFile')(req, res, next);
    },
    handleFileUploadErrors,
    sendReportCard
);

/**
 * @route   POST /api/report-cards/generate
 * @desc    Generate a report card from HTML content
 * @access  Teacher, Admin
 */
// @route   POST /api/report-cards/generate
// @desc    Generate a report card from HTML content
// @access  Private (Teacher/Admin)
router.post(
    '/generate',
    upload.none(),
    express.json(),
    authenticateUser,
    authorize('teacher', 'admin'),
    async (req, res) => {
      console.log('=== REPORT CARD GENERATION REQUEST ===');
      console.log('Authenticated User:', {
        id: req.user?.id,
        role: req.user?.role,
        token: req.headers.authorization ? 
          `${req.headers.authorization.substring(0, 20)}...` : 'No token in headers'
      });
      console.log('Request Body:', {
        ...req.body,
        htmlContent: req.body.htmlContent ? '[HTML CONTENT]' : 'No HTML content'
      });
      console.log('Request Headers:', {
        'content-type': req.headers['content-type'],
        'authorization': req.headers.authorization ? 'Token present' : 'No token',
        'x-auth-token': req.headers['x-auth-token'] ? 'Present' : 'Not present'
      });
      console.log('Authenticated user:', {
        id: req.user?.id,
        role: req.user?.role,
        body: { ...req.body, htmlContent: req.body.htmlContent ? '[HTML CONTENT]' : 'No HTML content' }
      });
        console.log('Received request to generate report card:', {
            body: {
                ...req.body,
                htmlContent: req.body.htmlContent ? req.body.htmlContent.substring(0, 100) + '...' : 'No HTML content'
            },
            headers: req.headers,
            user: req.user
        });
        
        try {
            const { studentId, term, year, comments, htmlContent } = req.body;
            
            // Validate required fields
            if (!studentId || !term || !year || !htmlContent) {
                return res.status(400).json({
                    success: false,
                    message: 'Student ID, term, year, and HTML content are required'
                });
            }
            
            // Check if student exists
            const student = await User.findById(studentId);
            if (!student) {
                return res.status(404).json({
                    success: false,
                    message: 'Student not found'
                });
            }
            
            // Generate unique filenames for both HTML and PDF
            const timestamp = Date.now();
            const baseFilename = `report-${timestamp}`;
            const htmlFilename = `${baseFilename}.html`;
            const pdfFilename = `${baseFilename}.pdf`;
            
            // Define paths
            const uploadsDir = path.join(__dirname, '../public/uploads/report-cards');
            const htmlPath = path.join(uploadsDir, htmlFilename);
            const pdfPath = path.join(uploadsDir, pdfFilename);
            
            // Public URLs - using the new /report-cards endpoint
            const publicHtmlPath = `/report-cards/${htmlFilename}`;
            const publicPdfPath = `/report-cards/${pdfFilename}`;
            
            try {
                // 1. Ensure the directory exists
                await fs.mkdir(uploadsDir, { recursive: true });
                console.log(`Upload directory verified/created: ${uploadsDir}`);
                
                // 2. First save the HTML content as is
                console.log(`Saving HTML to: ${htmlPath}`);
                await fs.writeFile(htmlPath, htmlContent, 'utf8');
                console.log('HTML file saved successfully');
                
                // 3. Now generate PDF from the saved HTML file
                console.log(`Generating PDF at: ${pdfPath}`);
                const browser = await puppeteer.launch({
                    headless: 'new',
                    args: ['--no-sandbox', '--disable-setuid-sandbox']
                });
                
                try {
                    const page = await browser.newPage();
                    
                    // Load the HTML file directly from the filesystem
                    const fileUrl = `file://${htmlPath}`;
                    console.log(`Loading HTML from: ${fileUrl}`);
                    
                    await page.goto(fileUrl, {
                        waitUntil: 'networkidle0',
                        timeout: 30000
                    });
                    
                    // Wait for any dynamic content to load
                    await page.evaluateHandle('document.fonts.ready');
                    
                    // Generate PDF with proper margins and format
                    const pdfBuffer = await page.pdf({
                        path: pdfPath,
                        format: 'A4',
                        printBackground: true,
                        margin: {
                            top: '20mm',
                            right: '15mm',
                            bottom: '20mm',
                            left: '15mm'
                        },
                        timeout: 30000
                    });
                    
                    console.log(`PDF generated successfully at: ${pdfPath}`);
                } catch (pdfError) {
                    console.error('Error generating PDF:', pdfError);
                    // Don't fail the whole request if PDF generation fails
                } finally {
                    await browser.close().catch(e => console.error('Error closing browser:', e));
                }
                
                // Verify both files were created
                const filesExist = {
                    html: await fs.access(htmlPath).then(() => true).catch(() => false),
                    pdf: await fs.access(pdfPath).then(() => true).catch(() => false)
                };
                
                console.log('Files created:', filesExist);
                
                if (!filesExist.html) {
                    throw new Error('Failed to save HTML file');
                }
                
            } catch (error) {
                console.error('Error in report card generation:', {
                    error: error.message,
                    stack: error.stack
                });
                
                // Clean up any partially created files
                const cleanup = async (filePath) => {
                    try {
                        if (await fs.access(filePath).then(() => true).catch(() => false)) {
                            await fs.unlink(filePath);
                            console.log(`Cleaned up: ${filePath}`);
                        }
                    } catch (e) {
                        console.error(`Error cleaning up ${filePath}:`, e);
                    }
                };
                
                await cleanup(htmlPath);
                await cleanup(pdfPath);
                
                throw error;
            }
            
            // Create report card record with all required fields
            const reportCard = new ReportCard({
                studentId,
                studentName: `${student.firstName} ${student.lastName}`.trim(),
                term: term.trim(),
                year: year.trim(),
                comments: comments || '',
                path: publicPdfPath, // Public URL for the PDF
                htmlPath: publicHtmlPath, // Public URL for the HTML
                status: 'published', // Must be one of: 'draft', 'published', 'archived'
                uploadedBy: req.user.id,
                htmlContent: htmlContent
            });
            
            console.log('Creating report card with data:', {
                studentId: reportCard.studentId,
                studentName: reportCard.studentName,
                term: reportCard.term,
                year: reportCard.year,
                path: reportCard.path,
                htmlPath: reportCard.htmlPath,
                status: reportCard.status
            });
            
            await reportCard.save();
            
            res.status(201).json({
                success: true,
                message: 'Report card generated successfully',
                data: reportCard
            });
            
        } catch (error) {
            console.error('Error generating report card:', {
                error: error.toString(),
                stack: error.stack,
                request: {
                    body: req.body,
                    user: req.user,
                    params: req.params
                }
            });
            
            // More specific error messages based on error type
            let errorMessage = 'Error generating report card';
            let statusCode = 500;
            
            if (error.name === 'ValidationError') {
                errorMessage = 'Validation error: ' + error.message;
                statusCode = 400;
            } else if (error.code === 'ENOENT') {
                errorMessage = 'File system error: Could not access or create directory';
                statusCode = 500;
            } else if (error.name === 'MongoError') {
                errorMessage = 'Database error: ' + error.message;
                statusCode = 500;
            }
            
            res.status(statusCode).json({
                success: false,
                message: errorMessage,
                error: process.env.NODE_ENV === 'development' ? error.message : undefined,
                stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
            });
        }
    }
);

/**
 * @route   GET /api/report-cards/student/:studentId
 * @desc    Get report cards for a specific student (teachers/admins)
 * @access  Private
 */
router.get(
    '/student/:studentId',
    authenticateUser,
    getStudentReportCards
);

/**
 * @route   GET /api/report-cards/student
 * @desc    Get report cards for the current user (students)
 * @access  Private
 */
router.get(
    '/student',
    authenticateUser,
    (req, res, next) => {
        // Set req.params.studentId to null to indicate current user
        req.params.studentId = null;
        next();
    },
    getStudentReportCards
);

/**
 * @route   GET /api/report-cards/:id
 * @desc    Get a single report card by ID
 * @access  Private
 */
router.get(
    '/:id',
    authenticateUser,
    getReportCard
);

// Legacy upload endpoint (for backward compatibility)
router.post(
    '/',
    authenticateUser,
    authorizeRoles(['teacher', 'admin']),
    upload.single('reportCard'),
    handleFileUploadErrors,
    async (req, res, next) => {
        try {
            const { studentName, year, term, comments } = req.body;
            const file = req.file;

            if (!file) {
                return res.status(400).json({ 
                    success: false,
                    message: 'No file was uploaded' 
                });
            }


            const newReport = new ReportCard({
                studentName,
                year,
                term,
                comments,
                path: file.filename,
                uploadedBy: req.user.id,
                studentId: req.user.id // Default to current user if not specified
            });

            await newReport.save();
            
            res.status(201).json({ 
                success: true,
                message: 'Report card uploaded', 
                data: newReport 
            });
        } catch (error) {
            console.error('Error uploading report card:', error);
            res.status(500).json({ 
                success: false,
                message: 'Server error',
                error: error.message
            });
        }
    }
);

// Delete a report card (admin/teacher only)
router.delete('/:id', 
    authenticateUser, 
    authorizeRoles(['admin', 'teacher']),
    async (req, res) => {
        try {
            const report = await ReportCard.findById(req.params.id);
            
            if (!report) {
                return res.status(404).json({ 
                    success: false,
                    message: 'Report card not found' 
                });
            }
            
            // Delete the file from the filesystem
            const filePath = require('path').join(__dirname, '../uploads/report-cards', report.path);
            if (require('fs').existsSync(filePath)) {
                require('fs').unlinkSync(filePath);
            }
            
            await ReportCard.findByIdAndDelete(req.params.id);
            
            res.json({ 
                success: true, 
                message: 'Report card deleted successfully' 
            });
        } catch (error) {
            console.error('Error deleting report card:', error);
            res.status(500).json({ 
                success: false,
                message: 'Server error',
                error: error.message
            });
        }
    }
);

// Debug route to list all report cards (temporary, remove in production)
router.get('/debug/all', authenticateUser, async (req, res) => {
  try {
    // Only allow admins to use this debug endpoint
    if (req.user.role !== 'Admin') {
      return res.status(403).json({ msg: 'Access denied' });
    }
    
    const allReportCards = await ReportCard.find({}).populate('studentId', 'name email role');
    console.log('All report cards in database:', allReportCards);
    
    res.json({
      count: allReportCards.length,
      reportCards: allReportCards
    });
  } catch (err) {
    console.error('Error in debug route:', err);
    res.status(500).json({ 
      msg: 'Error fetching all report cards',
      error: err.message 
    });
  }
});

// Add any additional routes here if needed

// Export the router
/**
 * @route   GET /api/report-cards
 * @desc    Get all report cards (admin and teacher)
 * @access  Private (Admin/Teacher)
 */
router.get(
    '/',
    authenticateUser,
    authorize('admin', 'teacher'),
    async (req, res) => {
        console.log('User accessing report cards:', {
            id: req.user.id,
            role: req.user.role
        });
        await getAllReportCards(req, res);
    }
);

/**
 * @route   GET /api/report-cards/download/:id
 * @desc    Download a report card PDF
 * @access  Private
 */
router.get(
    '/download/:id',
    authenticateUser,
    async (req, res) => {
        try {
            const reportCard = await ReportCard.findById(req.params.id);
            
            if (!reportCard) {
                return res.status(404).json({
                    success: false,
                    message: 'Report card not found'
                });
            }

            // Check if the user has permission to access this report card
            if (req.user.role === 'student' && reportCard.studentId.toString() !== req.user.id) {
                return res.status(403).json({
                    success: false,
                    message: 'Not authorized to access this report card'
                });
            }

            // If the report card has a file path, serve that file
            if (reportCard.path) {
                const filePath = path.join(__dirname, '../public/uploads/report-cards', reportCard.path);
                
                if (require('fs').existsSync(filePath)) {
                    return res.download(filePath, `Report-Card-${reportCard.year}-${reportCard.term}.pdf`);
                } else {
                    return res.status(404).json({
                        success: false,
                        message: 'Report card file not found'
                    });
                }
            } else if (reportCard.htmlContent) {
                // If there's HTML content but no file, generate a PDF on the fly
                try {
                    const pdfBuffer = await generatePdfFromHtml(reportCard.htmlContent);
                    
                    res.set({
                        'Content-Type': 'application/pdf',
                        'Content-Disposition': `attachment; filename=Report-Card-${reportCard.year}-${reportCard.term}.pdf`,
                        'Content-Length': pdfBuffer.length
                    });
                    
                    res.send(pdfBuffer);
                } catch (error) {
                    console.error('Error generating PDF:', error);
                    return res.status(500).json({
                        success: false,
                        message: 'Error generating PDF',
                        error: error.message
                    });
                }
            } else {
                return res.status(404).json({
                    success: false,
                    message: 'No report card content available'
                });
            }
        } catch (error) {
            console.error('Error downloading report card:', error);
            res.status(500).json({
                success: false,
                message: 'Server error',
                error: error.message
            });
        }
    }
);

module.exports = router;
