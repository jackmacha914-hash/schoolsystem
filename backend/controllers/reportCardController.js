const ReportCard = require('../models/ReportCard');
const User = require('../models/User');
const fs = require('fs').promises;
const fsSync = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
// Puppeteer is not available
const puppeteer = null;
const { promisify } = require('util');
const writeFileAsync = promisify(fsSync.writeFile);
const mkdirAsync = promisify(fsSync.mkdir);
const accessAsync = promisify(fsSync.access);

// Ensure directory exists helper with promise
const ensureDirExists = async (dir) => {
    try {
        await accessAsync(dir);
    } catch (error) {
        if (error.code === 'ENOENT') {
            await mkdirAsync(dir, { recursive: true });
        } else {
            throw error;
        }
    }
};

// Helper function to ensure directory exists
const ensureDirectoryExists = async (dir) => {
    try {
        await fs.mkdir(dir, { recursive: true });
    } catch (err) {
        if (err.code !== 'EEXIST') {
            throw err;
        }
    }
};

// Helper function to generate PDF from HTML
const generatePdfFromHtml = async (html, outputPath) => {
    console.log(`Attempting to generate PDF at: ${outputPath}`);
    
    if (!puppeteer) {
        throw new Error('PDF generation is not available. Puppeteer is not installed.');
    }
    
    console.log(`Generating PDF at: ${outputPath}`);
    
    const browser = await puppeteer.launch({
        headless: 'new',
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-accelerated-2d-canvas',
            '--no-first-run',
            '--no-zygote',
            '--single-process',
            '--disable-gpu'
        ]
    });

    try {
        const page = await browser.newPage();
        await page.setContent(html, { waitUntil: 'networkidle0' });
        
        // Generate PDF
        await page.pdf({
            path: outputPath,
            format: 'A4',
            printBackground: true,
            margin: {
                top: '20mm',
                right: '15mm',
                bottom: '20mm',
                left: '15mm'
            }
        });
        
        console.log(`PDF generated successfully at: ${outputPath}`);
        return outputPath;
    } catch (error) {
        console.error('Error generating PDF:', error);
        throw error;
    } finally {
        await browser.close();
    }
};

// Send report card to student
const sendReportCard = async (req, res) => {
    const session = await ReportCard.startSession();
    session.startTransaction();
    
    try {
        const { studentId, term, year, comments } = req.body;
        const file = req.file;
        
        // Validate required fields
        if (!studentId || !term || !year) {
            return res.status(400).json({
                success: false,
                message: 'Student ID, term, and year are required'
            });
        }
        
        // Check if student exists
        const student = await User.findById(studentId).session(session);
        if (!student) {
            return res.status(404).json({
                success: false,
                message: 'Student not found'
            });
        }
        
        // Create report card record
        const reportCard = new ReportCard({
            studentId,
            studentName: `${student.firstName} ${student.lastName}`,
            term,
            year,
            comments: comments || '',
            status: 'sent',
            uploadedBy: req.user.id
        });
        
        // If file was uploaded, save file path
        if (file) {
            const fileExt = path.extname(file.originalname);
            const fileName = `report-${Date.now()}${fileExt}`;
            const filePath = path.join('uploads', 'report-cards', fileName);
            
            // Ensure directory exists
            await ensureDirectoryExists(path.dirname(filePath));
            
            // Move file to uploads directory
            await fs.rename(file.path, filePath);
            
            // Update report card with file path
            reportCard.fileUrl = `/uploads/report-cards/${fileName}`;
        }
        
        // Save report card to database
        await reportCard.save({ session });
        
        // Commit transaction
        await session.commitTransaction();
        
        res.status(201).json({
            success: true,
            message: 'Report card sent successfully',
            data: reportCard
        });
        
    } catch (error) {
        await session.abortTransaction();
        console.error('Error sending report card:', error);
        res.status(500).json({
            success: false,
            message: 'Error sending report card',
            error: error.message
        });
    } finally {
        session.endSession();
    }
};

// Get report cards for a student
const getStudentReportCards = async (req, res) => {
    try {
        const { studentId } = req.params;
        
        // Build query based on user role
        let query = {};
        
        // If no studentId is provided, use the current user's ID for students
        // Admins and teachers can see all report cards
        if (req.user.role === 'student' && !studentId) {
            query.studentId = req.user.id;
        } else if (studentId) {
            // If a specific studentId is provided, check permissions
            if (req.user.role === 'student' && req.user.id !== studentId) {
                return res.status(403).json({
                    success: false,
                    message: 'Not authorized to view these report cards'
                });
            }
            query.studentId = studentId;
        }
        // If no studentId and user is admin/teacher, query will be empty to return all
        
        console.log('Fetching report cards with query:', {
            query,
            userRole: req.user.role,
            userId: req.user.id,
            requestedStudentId: studentId
        });
        
        // Find all matching report cards
        const reportCards = await ReportCard.find(query)
            .sort({ year: -1, term: -1 })
            .populate('studentId', 'firstName lastName email')
            .populate('uploadedBy', 'firstName lastName');
        
        console.log(`Found ${reportCards.length} report cards`);
        
        res.status(200).json({
            success: true,
            count: reportCards.length,
            data: reportCards
        });
        
    } catch (error) {
        console.error('Error fetching student report cards:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching report cards',
            error: error.message
        });
    }
};

// Get a single report card
const getReportCard = async (req, res) => {
    const session = await ReportCard.startSession();
    session.startTransaction();
    
    try {
        const { id } = req.params;
        
        // Find the report card
        const reportCard = await ReportCard.findById(id).session(session);
        
        if (!reportCard) {
            return res.status(404).json({
                success: false,
                message: 'Report card not found'
            });
        }
        
        // Check if the user is authorized to view this report card
        if (req.user.role !== 'admin' && req.user.role !== 'teacher' && req.user.id !== reportCard.studentId.toString()) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to view this report card'
            });
        }
        
        // If the report card has a file URL, read the file
        let fileContent = null;
        if (reportCard.fileUrl) {
            try {
                const filePath = path.join(__dirname, '..', reportCard.fileUrl);
                fileContent = await fs.readFile(filePath, 'utf8');
            } catch (fileError) {
                console.warn(`Report card file not found: ${reportCard.fileUrl}`);
                // Continue without file content if not found
            }
        }
        
        // Format the response
        const responseData = {
            id: reportCard._id,
            studentId: reportCard.studentId,
            studentName: reportCard.studentName,
            year: reportCard.year,
            term: reportCard.term,
            status: reportCard.status,
            comments: reportCard.comments,
            htmlContent: reportCard.htmlContent || fileContent,
            fileUrl: reportCard.fileUrl,
            uploadedBy: reportCard.uploadedBy,
            createdAt: reportCard.createdAt,
            updatedAt: reportCard.updatedAt
        };
        
        await session.commitTransaction();
        
        res.status(200).json({
            success: true,
            data: responseData
        });
        
    } catch (error) {
        console.error('Error in getReportCard:', error);
        
        if (session.inTransaction()) {
            await session.abortTransaction();
        }
        
        res.status(500).json({
            success: false,
            message: 'Failed to fetch report card',
            error: error.message
        });
    } finally {
        session.endSession();
    }
};

// Get all report cards
const getAllReportCards = async (req, res) => {
    try {
        // Get all report cards with student information
        const reportCards = await ReportCard.find()
            .populate('studentId', 'firstName lastName email')
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            count: reportCards.length,
            data: reportCards
        });
    } catch (error) {
        console.error('Error fetching report cards:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

module.exports = {
    sendReportCard,
    getStudentReportCards,
    getReportCard,
    getAllReportCards
};
