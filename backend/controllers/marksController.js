const Grade = require('../models/Grade');
const ReportCard = require('../models/ReportCard');
const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middleware/async');
const path = require('path');
const fs = require('fs').promises;
const { v4: uuidv4 } = require('uuid');
// Puppeteer is not available
const puppeteer = null;
const User = require('../models/User');

// Helper function to generate PDF from HTML
const generatePdfFromHtml = async (html, outputPath) => {
    console.log(`Attempting to generate PDF at: ${outputPath}`);
    
    if (!puppeteer) {
        throw new Error('PDF generation is not available. Puppeteer is not installed.');
    }
    
    const browser = await puppeteer.launch({
        headless: 'new',
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
    
    try {
        const page = await browser.newPage();
        await page.setContent(html, { waitUntil: 'networkidle0' });
        await page.pdf({
            path: outputPath,
            format: 'A4',
            printBackground: true,
            margin: { top: '20px', right: '20px', bottom: '20px', left: '20px' }
        });
    } finally {
        await browser.close();
    }
};

// @desc    Save multiple subjects' marks for a student
// @route   POST /api/students/:studentId/marks
// @access  Private/Teacher
exports.saveStudentMarks = asyncHandler(async (req, res, next) => {
    const { studentId } = req.params;
    const { term, subjects, remarks } = req.body;
    
    // Validate input
    if (!term || !subjects || !Array.isArray(subjects) || subjects.length === 0) {
        return next(new ErrorResponse('Term and subjects array are required', 400));
    }

    // Check if student exists
    const student = await User.findById(studentId);
    if (!student) {
        return next(new ErrorResponse('Student not found', 404));
    }

    // Save each subject's marks
    const savedMarks = [];
    const currentYear = new Date().getFullYear();
    const nextYear = currentYear + 1;
    const academicYear = req.user?.schoolYear || `${currentYear}-${nextYear}`;
    
    // Track all subjects being saved
    const subjectsData = [];
    
    for (const item of subjects) {
        const { subject, marks, grade } = item;
        
        if (!subject || marks === undefined) {
            continue; // Skip invalid entries
        }
        
        try {
            // Use findOneAndUpdate with upsert to handle concurrent updates atomically
            const filter = {
                student: studentId,
                subject,
                term: term || 'Term 1',
                academicYear
            };
            
            const update = {
                $set: {
                    studentName: `${student.firstName} ${student.lastName}`,
                    class: student.className || 'Grade 8',
                    score: marks,
                    grade: grade || calculateGrade(marks),
                    teacher: req.user.id,
                    comments: remarks || '',
                    updatedAt: new Date()
                },
                $setOnInsert: {
                    createdAt: new Date()
                }
            };
            
            const options = {
                new: true,      // Return the modified document
                upsert: true,   // Create a document if one doesn't exist
                setDefaultsOnInsert: true
            };
            
            const gradeRecord = await Grade.findOneAndUpdate(filter, update, options);
            savedMarks.push(gradeRecord);
            
            // Add to subjects data for report card
            subjectsData.push({
                subject,
                mark: marks,
                grade: grade || calculateGrade(marks)
            });
            
        } catch (error) {
            console.error(`Error saving marks for subject ${subject}:`, error);
            // Continue with other subjects even if one fails
            continue;
        }
    }
    
    // Generate report card if we have subjects
    if (subjectsData.length > 0) {
        try {
            // Generate HTML for the report card
            const studentInfo = await User.findById(studentId).select('firstName lastName className').lean();
            const studentName = studentInfo ? `${studentInfo.firstName} ${studentInfo.lastName}` : 'Student';
            const className = studentInfo?.className || 'Unknown';
            
            // Generate HTML content for the report card
            const htmlContent = `
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="UTF-8">
                    <title>Report Card - ${studentName} - ${term} ${academicYear}</title>
                    <style>
                        body { font-family: Arial, sans-serif; line-height: 1.6; margin: 20px; }
                        .header { text-align: center; margin-bottom: 20px; }
                        .student-info { margin-bottom: 20px; }
                        table { width: 100%; border-collapse: collapse; margin: 20px 0; }
                        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                        th { background-color: #f2f2f2; }
                        .footer { margin-top: 30px; text-align: right; }
                    </style>
                </head>
                <body>
                    <div class="header">
                        <h1>${process.env.SCHOOL_NAME || 'School'} Report Card</h1>
                        <h2>${term} ${academicYear}</h2>
                    </div>
                    
                    <div class="student-info">
                        <p><strong>Student Name:</strong> ${studentName}</p>
                        <p><strong>Class:</strong> ${className}</p>
                        <p><strong>Term:</strong> ${term}</p>
                        <p><strong>Academic Year:</strong> ${academicYear}</p>
                    </div>
                    
                    <table>
                        <thead>
                            <tr>
                                <th>Subject</th>
                                <th>Marks</th>
                                <th>Grade</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${subjectsData.map(subj => `
                                <tr>
                                    <td>${subj.subject}</td>
                                    <td>${subj.mark}</td>
                                    <td>${subj.grade}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                    
                    <div class="footer">
                        <p>Teacher's Remarks: ${remarks || 'N/A'}</p>
                        <p>Date: ${new Date().toLocaleDateString()}</p>
                    </div>
                </body>
                </html>
            `;
            
            // Save report card
            await ReportCard.findOneAndUpdate(
                { 
                    studentId: studentId,
                    term: term,
                    academicYear: academicYear
                },
                {
                    $set: {
                        studentName: studentName,
                        className: className,
                        htmlContent: htmlContent,
                        generatedAt: new Date(),
                        generatedBy: req.user.id,
                        status: 'generated',
                        term: term,
                        academicYear: academicYear,
                        teacherRemarks: remarks || ''
                    }
                },
                { upsert: true, new: true }
            );
            
            console.log(`Report card generated for ${studentName} (${term} ${academicYear})`);
            
        } catch (error) {
            console.error('Error generating report card:', error);
            // Don't fail the request if report card generation fails
        }
    }
    
    // Return success response
    res.status(200).json({
        success: true,
        count: savedMarks.length,
        data: savedMarks
    });
});

// @desc    Save student marks (single subject)
// @route   POST /api/v1/marks
// @access  Private/Teacher
exports.saveMarks = asyncHandler(async (req, res, next) => {
    const { student, studentName, class: className, subject, score, term, academicYear, comments } = req.body;
    
    // Check if marks already exist for this student, subject, term, and year
    const existingGrade = await Grade.findOne({
        student,
        subject,
        term,
        academicYear
    });

    let grade;
    
    if (existingGrade) {
        // Update existing grade
        existingGrade.score = score;
        existingGrade.comments = comments || existingGrade.comments;
        grade = await existingGrade.save();
    } else {
        // Create new grade
        grade = await Grade.create({
            student,
            studentName,
            class: className,
            subject,
            score,
            term,
            academicYear,
            teacher: req.user.id,
            comments: comments || ''
        });
    }

    // Generate a report card
    try {
        // Get all marks for this student, term, and year
        const marks = await Grade.find({
            student,
            term,
            academicYear
        });

        if (marks.length > 0) {
            // Generate HTML for the report card
            const studentInfo = await User.findById(student).select('firstName lastName className').lean();
            const studentName = studentInfo ? `${studentInfo.firstName} ${studentInfo.lastName}` : studentName || 'Student';
            const className = studentInfo?.className || className || 'Unknown';

            // Calculate average score
            const totalScore = marks.reduce((sum, mark) => sum + mark.score, 0);
            const averageScore = marks.length > 0 ? totalScore / marks.length : 0;
            const overallGrade = calculateGrade(averageScore);

            // Generate HTML content for the report card
            const htmlContent = `
                <!DOCTYPE html>
                <html>
                <head>
                    <title>Report Card - ${studentName}</title>
                    <style>
                        body { font-family: Arial, sans-serif; line-height: 1.6; }
                        .header { text-align: center; margin-bottom: 20px; }
                        .student-info { margin-bottom: 20px; }
                        table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
                        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                        th { background-color: #f2f2f2; }
                        .footer { margin-top: 30px; text-align: right; }
                    </style>
                </head>
                <body>
                    <div class="header">
                        <h1>School Report Card</h1>
                    </div>
                    
                    <div class="student-info">
                        <p><strong>Student Name:</strong> ${studentName}</p>
                        <p><strong>Class:</strong> ${className}</p>
                        <p><strong>Term:</strong> ${term} ${academicYear}</p>
                    </div>
                    
                    <table>
                        <thead>
                            <tr>
                                <th>Subject</th>
                                <th>Score</th>
                                <th>Grade</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${marks.map(mark => `
                                <tr>
                                    <td>${mark.subject}</td>
                                    <td>${mark.score}%</td>
                                    <td>${calculateGrade(mark.score)}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                        <tfoot>
                            <tr>
                                <td><strong>Average</strong></td>
                                <td><strong>${averageScore.toFixed(2)}%</strong></td>
                                <td><strong>${overallGrade}</strong></td>
                            </tr>
                        </tfoot>
                    </table>
                    
                    <div class="footer">
                        <p>Generated on: ${new Date().toLocaleDateString()}</p>
                    </div>
                </body>
                </html>
            `;

            // Create directories if they don't exist
            const reportsDir = path.join(__dirname, '../public/reports');
            const pdfDir = path.join(reportsDir, 'pdf');
            const htmlDir = path.join(reportsDir, 'html');
            
            await fs.mkdir(pdfDir, { recursive: true });
            await fs.mkdir(htmlDir, { recursive: true });

            // Generate unique filenames
            const reportId = uuidv4();
            const pdfFilename = `${reportId}.pdf`;
            const htmlFilename = `${reportId}.html`;
            const pdfPath = path.join(pdfDir, pdfFilename);
            const htmlPath = path.join(htmlDir, htmlFilename);

            // Save HTML file
            await fs.writeFile(htmlPath, htmlContent);

            // Generate PDF
            await generatePdfFromHtml(htmlContent, pdfPath);

            // Check if a report card already exists for this student, term, and year
            const existingReportCard = await ReportCard.findOne({
                studentId: student,
                term,
                year: academicYear
            });

            if (existingReportCard) {
                // Update existing report card
                existingReportCard.htmlContent = htmlContent;
                existingReportCard.path = `/reports/pdf/${pdfFilename}`;
                existingReportCard.htmlPath = `/reports/html/${htmlFilename}`;
                existingReportCard.uploadedBy = req.user.id;
                await existingReportCard.save();
            } else {
                // Create new report card
                await ReportCard.create({
                    studentId: student,
                    studentName,
                    term,
                    year: academicYear,
                    comments: 'Automatically generated from marks',
                    path: `/reports/pdf/${pdfFilename}`,
                    htmlPath: `/reports/html/${htmlFilename}`,
                    uploadedBy: req.user.id,
                    status: 'published',
                    htmlContent
                });
            }
        }
    } catch (error) {
        console.error('Error generating report card:', error);
        // Don't fail the request if report card generation fails
    }

    res.status(200).json({
        success: true,
        data: grade
    });
});

// @desc    Get student marks
// @route   GET /api/v1/marks/student/:studentId
// @access  Private
exports.getStudentMarks = asyncHandler(async (req, res, next) => {
    const { term, academicYear } = req.query;
    const query = { student: req.params.studentId };
    
    if (term) query.term = term;
    if (academicYear) query.academicYear = academicYear;
    
    const marks = await Grade.find(query)
        .populate('student', 'name email')
        .populate('teacher', 'name');
        
    res.status(200).json({
        success: true,
        count: marks.length,
        data: marks
    });
});

// @desc    Get class marks
// @route   GET /api/v1/marks/class/:className
// @access  Private/Teacher
exports.getClassMarks = asyncHandler(async (req, res, next) => {
    const { term, academicYear } = req.query;
    const query = { class: req.params.className };
    
    if (term) query.term = term;
    if (academicYear) query.academicYear = academicYear;
    
    const marks = await Grade.find(query)
        .populate('student', 'name email')
        .populate('teacher', 'name');
        
    res.status(200).json({
        success: true,
        count: marks.length,
        data: marks
    });
});

// @desc    Get subject marks
// @route   GET /api/v1/marks/subject/:subject
// @access  Private/Teacher
exports.getSubjectMarks = asyncHandler(async (req, res, next) => {
    const { term, academicYear } = req.query;
    const query = { subject: req.params.subject };
    
    if (term) query.term = term;
    if (academicYear) query.academicYear = academicYear;
    
    const marks = await Grade.find(query)
        .populate('student', 'name email')
        .populate('teacher', 'name');
        
    res.status(200).json({
        success: true,
        count: marks.length,
        data: marks
    });
});

// @desc    Finalize marks
// @route   PUT /api/v1/marks/finalize/:id
// @access  Private/Teacher
exports.finalizeMarks = asyncHandler(async (req, res, next) => {
    const grade = await Grade.findById(req.params.id);
    
    if (!grade) {
        return next(new ErrorResponse(`Grade not found with id of ${req.params.id}`, 404));
    }
    
    // Check if user is the teacher who created the grade or an admin
    if (grade.teacher.toString() !== req.user.id && req.user.role !== 'admin') {
        return next(new ErrorResponse(`User ${req.user.id} is not authorized to update this grade`, 401));
    }
    
    grade.status = 'finalized';
    await grade.save();
    
    res.status(200).json({
        success: true,
        data: grade
    });
});

// @desc    Get student report card
// @route   GET /api/v1/marks/report-card/:studentId
// @access  Private
exports.getStudentReportCard = asyncHandler(async (req, res, next) => {
    try {
        const { term, academicYear } = req.query;
        
        if (!term || !academicYear) {
            return res.status(400).json({
                success: false,
                message: 'Please provide both term and academic year'
            });
        }
        
        // First, get the student information
        const student = await User.findById(req.params.studentId)
            .select('firstName lastName email className')
            .lean();
            
        if (!student) {
            return res.status(404).json({
                success: false,
                message: 'Student not found'
            });
        }
        
        // Then get the marks
        const marks = await Grade.find({
            student: req.params.studentId,
            term,
            academicYear
        }).sort('subject');
        
        if (marks.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'No marks found for the specified criteria'
            });
        }
        
        // Calculate average score
        const totalScore = marks.reduce((sum, mark) => sum + (parseFloat(mark.score) || 0), 0);
        const averageScore = marks.length > 0 ? totalScore / marks.length : 0;
        
        // Format the response
        res.status(200).json({
            success: true,
            data: {
                student: {
                    id: student._id,
                    name: student.firstName ? `${student.firstName} ${student.lastName}`.trim() : 'Unknown Student',
                    email: student.email || '',
                    className: student.className || ''
                },
                term,
                academicYear,
                subjects: marks.map(mark => ({
                    subject: mark.subject,
                    score: parseFloat(mark.score) || 0,
                    grade: calculateGrade(parseFloat(mark.score) || 0),
                    comments: mark.comments || ''
                })),
                averageScore: parseFloat(averageScore.toFixed(2)),
                overallGrade: calculateGrade(averageScore)
            }
        });
    } catch (error) {
        console.error('Error in getStudentReportCard:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while fetching report card',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// @desc    Delete student marks for a specific term
// @route   DELETE /api/marks/:studentId/term/:term
// @access  Private/Teacher
exports.deleteStudentMarks = asyncHandler(async (req, res, next) => {
    const { studentId, term } = req.params;
    const { academicYear } = req.query;

    // Validate input
    if (!studentId || !term) {
        return next(new ErrorResponse('Student ID and term are required', 400));
    }

    try {
        // Build query
        const query = {
            student: studentId,
            term: term
        };

        // Add academic year to query if provided
        if (academicYear) {
            query.academicYear = academicYear;
        } else {
            // If no academic year provided, use current academic year
            const currentYear = new Date().getFullYear();
            query.academicYear = `${currentYear}-${currentYear + 1}`;
        }

        // Delete marks
        const result = await Grade.deleteMany(query);

        // Also delete corresponding report card
        await ReportCard.findOneAndDelete({
            studentId: studentId,
            term: term,
            academicYear: query.academicYear
        });

        // Clear cache
        const cacheKey = `marks-${studentId}-${term}-${query.academicYear}`;
        if (req.redisClient) {
            await req.redisClient.del(cacheKey);
        }

        res.status(200).json({
            success: true,
            data: {},
            message: `Successfully deleted ${result.deletedCount} marks records`
        });

    } catch (error) {
        console.error('Error deleting student marks:', error);
        return next(new ErrorResponse('Failed to delete student marks', 500));
    }
});

// Helper function to calculate grade based on the specified criteria
function calculateGrade(score) {
    if (score >= 90) return 'A+';
    if (score >= 80) return 'A';
    if (score >= 70) return 'B';
    if (score >= 60) return 'C';
    if (score >= 50) return 'D';
    return 'F';
}
