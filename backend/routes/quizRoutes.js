// backend/routes/quizRoutes.js
const express = require('express');
const mongoose = require('mongoose');
const Quiz = require('../models/Quiz');
const User = require('../models/User');
const Submission = require('../models/Submission');
const Class = require('../models/Class'); // Add Class model import
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');

// Simple request logger
router.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
    next();
});

// Create a new quiz
router.post('/create', protect, async (req, res) => {
    console.log('=== NEW QUIZ CREATION REQUEST ===');
    console.log('Headers:', req.headers);
    
    // Log the raw request body and parsed body
    console.log('Raw request body:', JSON.stringify(req.body, null, 2));
    console.log('Parsed request body:', {
        title: req.body.title,
        description: req.body.description,
        subject: req.body.subject,
        class: req.body.class,
        questions: req.body.questions ? {
            count: req.body.questions.length,
            firstQuestion: req.body.questions[0] ? {
                questionText: req.body.questions[0].questionText,
                options: req.body.questions[0].options,
                correctAnswer: req.body.questions[0].correctAnswer,
                points: req.body.questions[0].points
            } : 'No questions'
        } : 'No questions array',
        timeLimit: req.body.timeLimit,
        passingScore: req.body.passingScore,
        teacherId: req.user?.id
    });
    
    try {
        const { title, description, questions, timeLimit, passingScore, class: classId, subject } = req.body;
        
        console.log('Parsed request data:', {
            title,
            description,
            subject,
            class: classId,
            timeLimit,
            passingScore,
            questionsLength: questions?.length,
            teacherId: req.user?.id
        });
        
        if (!req.user || !req.user.id) {
            console.error('No user ID in request');
            return res.status(401).json({ success: false, message: 'Authentication required' });
        }
        
        // Basic validation
        if (!title) {
            return res.status(400).json({ 
                success: false,
                message: 'Quiz title is required' 
            });
        }
        
        if (!subject) {
            return res.status(400).json({
                success: false,
                message: 'Subject is required'
            });
        }
        
        if (!questions || !Array.isArray(questions) || questions.length === 0) {
            return res.status(400).json({ 
                success: false,
                message: 'At least one question is required' 
            });
        }
        
        // Validate each question
        const questionErrors = [];
        questions.forEach((q, index) => {
            if (!q.questionText || q.questionText.trim() === '') {
                questionErrors.push(`Question ${index + 1}: Question text is required`);
            }
            
            if (!q.options || !Array.isArray(q.options) || q.options.length < 2) {
                questionErrors.push(`Question ${index + 1}: At least two options are required`);
            } else if (q.options.some(opt => !opt || opt.trim() === '')) {
                questionErrors.push(`Question ${index + 1}: Options cannot be empty`);
            }
            
            if (q.correctAnswer === undefined || q.correctAnswer === null || 
                q.correctAnswer < 0 || q.correctAnswer >= q.options.length) {
                questionErrors.push(`Question ${index + 1}: A valid correct answer is required`);
            }
            
            if (q.points === undefined || q.points === null || q.points < 0) {
                questionErrors.push(`Question ${index + 1}: Points must be a positive number`);
            }
        });
        
        if (questionErrors.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors: questionErrors
            });
        }
        
        console.log('Received quiz data:', {
            title,
            description,
            subject,
            questions: questions.length,
            timeLimit,
            passingScore,
            class: classId,
            teacherId: req.user.id
        });

        const newQuiz = new Quiz({
            title,
            description,
            subject,
            questions,
            timeLimit,
            passingScore,
            class: classId,
            teacherId: req.user.id
        });

        console.log('Saving quiz to database with data:', {
            title,
            description,
            subject,
            class: classId,
            teacherId: req.user.id,
            questionsCount: questions ? questions.length : 0,
            timeLimit,
            passingScore
        });
        
        console.log('First question sample:', questions && questions[0] ? {
            questionText: questions[0].questionText,
            options: questions[0].options,
            correctAnswer: questions[0].correctAnswer,
            points: questions[0].points
        } : 'No questions');
        console.log('Quiz data being saved:', JSON.stringify({
            title: newQuiz.title,
            description: newQuiz.description,
            subject: newQuiz.subject,
            class: newQuiz.class,
            teacherId: newQuiz.teacherId,
            questions: newQuiz.questions.map(q => ({
                questionText: q.questionText,
                options: q.options,
                correctAnswer: q.correctAnswer,
                points: q.points,
                explanation: q.explanation
            }))
        }, null, 2));
        
        try {
            const savedQuiz = await newQuiz.save();
            console.log('Quiz created successfully:', savedQuiz);
            return res.status(201).json({ 
                success: true, 
                data: savedQuiz 
            });
        } catch (saveError) {
            console.error('Database save error:', {
                name: saveError.name,
                message: saveError.message,
                code: saveError.code,
                keyPattern: saveError.keyPattern,
                keyValue: saveError.keyValue,
                errors: saveError.errors,
                stack: saveError.stack
            });
            
            // Handle duplicate key errors
            if (saveError.code === 11000) {
                const field = Object.keys(saveError.keyPattern)[0];
                const value = saveError.keyValue[field];
                return res.status(409).json({
                    success: false,
                    message: `A quiz with this ${field} (${value}) already exists`
                });
            }
            
            // Handle validation errors
            if (saveError.name === 'ValidationError') {
                const errors = Object.entries(saveError.errors).map(([field, error]) => ({
                    field,
                    message: error.message,
                    value: error.value
                }));
                
                return res.status(400).json({
                    success: false,
                    message: 'Validation failed',
                    errors: errors.map(e => `${e.field}: ${e.message}`)
                });
            }
            
            throw saveError; // Re-throw for the outer catch block
        }
        
    } catch (error) {
        console.error('Error in quiz creation:', {
            name: error.name,
            message: error.message,
            stack: error.stack,
            code: error.code,
            keyPattern: error.keyPattern,
            keyValue: error.keyValue,
            ...(error.errors && {
                validationErrors: Object.entries(error.errors).reduce((acc, [key, err]) => ({
                    ...acc,
                    [key]: {
                        message: err.message,
                        value: err.value,
                        kind: err.kind,
                        path: err.path,
                        reason: err.reason
                    }
                }), {})
            })
        });

        // More specific error handling
        let statusCode = 500;
        let errorMessage = 'Error creating quiz';
        let errorDetails = {};

        if (error.name === 'ValidationError') {
            statusCode = 400;
            errorMessage = 'Validation failed';
            errorDetails = Object.keys(error.errors).reduce((acc, key) => ({
                ...acc,
                [key]: error.errors[key].message
            }), {});
        } else if (error.code === 11000) {
            // Duplicate key error
            statusCode = 409;
            errorMessage = 'A quiz with this title already exists';
            errorDetails = { duplicateKey: error.keyValue };
        }

        return res.status(statusCode).json({
            success: false,
            message: errorMessage,
            ...(process.env.NODE_ENV === 'development' && {
                error: {
                    name: error.name,
                    message: error.message,
                    ...(Object.keys(errorDetails).length > 0 && { details: errorDetails })
                }
            })
        });
    }
});

// Get all quizzes (for admin) or quizzes created by teacher
router.get('/all', protect, async (req, res) => {
    try {
        let query = {};
        if (req.user.role === 'teacher') {
            query.teacherId = req.user.id;
        }
        const quizzes = await Quiz.find(query).sort({ createdAt: -1 });
        res.status(200).json({ success: true, data: quizzes });
    } catch (error) {
        console.error('Error fetching quizzes:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error fetching quizzes',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// Get quiz by ID
router.get('/quiz/:id', protect, async (req, res) => {
    try {
        const quiz = await Quiz.findById(req.params.id);
        if (!quiz) {
            return res.status(404).json({ 
                success: false, 
                message: 'Quiz not found' 
            });
        }
        res.status(200).json({ success: true, data: quiz });
    } catch (error) {
        console.error('Error fetching quiz:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error fetching quiz',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// Submit quiz answers
router.post('/submit', protect, async (req, res) => {
    console.log('=== QUIZ SUBMISSION REQUEST ===');
    console.log('Request body:', JSON.stringify(req.body, null, 2));
    console.log('User ID:', req.user.id);
    
    try {
        const { quizId, answers, timeSpent, totalQuestions } = req.body;
        const userId = req.user.id;
        
        // Validate input
        if (!quizId || !answers || !Array.isArray(answers)) {
            console.error('Validation failed - missing required fields');
            return res.status(400).json({ 
                success: false, 
                message: 'Quiz ID and answers array are required' 
            });
        }

        console.log('Looking up quiz:', quizId);
        const quiz = await Quiz.findById(quizId);
        if (!quiz) {
            console.error('Quiz not found:', quizId);
            return res.status(404).json({ 
                success: false, 
                message: 'Quiz not found' 
            });
        }

        console.log('Processing answers...');
        let score = 0;
        const processedAnswers = [];
        
        for (const answer of answers) {
            try {
                const question = quiz.questions.id(answer.question);
                if (!question) {
                    console.error('Question not found in quiz:', answer.question);
                    continue;
                }
                
                // Get the correct answer from the question
                const correctAnswer = question.options[question.correctAnswer];
                const isCorrect = answer.selectedOption === correctAnswer;
                
                if (isCorrect) {
                    score++;
                }
                
                const processedAnswer = {
                    question: answer.question,
                    selectedOption: answer.selectedOption,
                    isCorrect,
                    pointsEarned: isCorrect ? 1 : 0,
                    // Include debug info if present
                    ...(answer.debug && { debug: answer.debug })
                };
                
                processedAnswers.push(processedAnswer);
                
                console.log(`Processed answer for question ${answer.question}:`, {
                    questionText: question.questionText,
                    selected: answer.selectedOption,
                    correct: correctAnswer,
                    isCorrect,
                    options: question.options,
                    correctAnswerIndex: question.correctAnswer
                });
            } catch (error) {
                console.error('Error processing answer:', error);
                console.error('Answer object:', answer);
                // Instead of continuing, throw the error to see it in the response
                throw new Error(`Error processing answer: ${error.message}`);
            }
        }

        console.log('Looking up user details...');
        const user = await User.findById(userId);
        if (!user) {
            console.error('User not found:', userId);
            return res.status(404).json({ 
                success: false, 
                message: 'User not found' 
            });
        }

        console.log('Creating submission...');
        
        // Get class information
        let classId = quiz.classId || quiz.class;
        const quizClassName = quiz.className || (typeof quiz.class === 'string' ? quiz.class : null);
        
        console.log('Initial class info:', { 
            classFromQuiz: quiz.class,
            classIdFromQuiz: quiz.classId,
            classNameFromQuiz: quiz.className,
            resolvedClassId: classId,
            resolvedClassName: quizClassName
        });
        
        // If we have a class name but no ID, try to find the class by name
        if ((!classId || typeof classId === 'string') && quizClassName) {
            console.log(`Looking up class by name: ${quizClassName}`);
            try {
                // First try to find by exact name match
                let classDoc = await Class.findOne({ name: quizClassName });
                
                // If not found, try case-insensitive search
                if (!classDoc) {
                    classDoc = await Class.findOne({ 
                        name: { $regex: new RegExp(`^${quizClassName}$`, 'i') }
                    });
                }
                
                if (classDoc) {
                    console.log(`Found class: ${classDoc.name} (${classDoc._id})`);
                    classId = classDoc._id;
                    quizClassName = classDoc.name; // Update quizClassName to match the found document
                } else {
                    console.warn(`Class not found: ${quizClassName}. Will try to use as is.`);
                }
            } catch (classError) {
                console.error('Error looking up class:', classError);
                // Continue with the original classId/className even if there was an error
            }
        }
        
        // If we still don't have a valid class ID, use the class name as is
        if (!classId) {
            // If we have a class name, use that
            if (className) {
                classId = className;
                console.log(`Using class name as ID: ${classId}`);
            } else {
                console.warn('No class ID or name found, using default class');
                classId = 'Default Class';
            }
        }
        
        // Determine the class name to store (use a different variable name to avoid redeclaration)
        const classNameToStore = typeof classId === 'string' ? classId : 
                               (quiz.className || quiz.class || 'Unnamed Class');
        
        const submissionData = {
            quiz: quizId,
            user: userId,
            studentName: req.body.studentName || `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Anonymous',
            studentEmail: req.body.studentEmail || user.email || 'no-email@example.com',
            class: classId, // Can be either ObjectId or string
            className: classNameToStore, // Store the class name separately for easier querying
            answers: processedAnswers,
            score,
            totalScore: totalQuestions || quiz.questions.length,
            percentage: Math.round((score / (totalQuestions || quiz.questions.length)) * 100),
            passed: score >= (quiz.passingScore || Math.ceil(quiz.questions.length * 0.7)),
            timeSpent: timeSpent || 0,
            quizTitle: req.body.quizTitle || quiz.title,
            subject: req.body.subject || quiz.subject
        };
        
        console.log('Prepared submission data:', JSON.stringify(submissionData, null, 2));
        
        console.log('Submission data:', JSON.stringify(submissionData, null, 2));
        
        try {
            const submission = new Submission(submissionData);
            console.log('Saving submission...');
            
            // Validate the submission before saving
            const validationError = submission.validateSync();
            if (validationError) {
                console.error('Validation error:', validationError);
                throw validationError;
            }
            
            const savedSubmission = await submission.save();
            console.log('Submission saved successfully:', savedSubmission._id);
            
            res.status(201).json({ 
                success: true, 
                data: savedSubmission.toObject()
            });
        } catch (saveError) {
            console.error('Error saving submission:', {
                name: saveError.name,
                message: saveError.message,
                errors: saveError.errors,
                code: saveError.code,
                keyPattern: saveError.keyPattern,
                keyValue: saveError.keyValue
            });
            throw saveError;
        }
    } catch (error) {
        console.error('Error in quiz submission:', {
            name: error.name,
            message: error.message,
            stack: error.stack,
            code: error.code,
            keyPattern: error.keyPattern,
            keyValue: error.keyValue,
            errors: error.errors
        });
        
        let errorMessage = 'Error submitting quiz';
        if (error.errors) {
            // Get the first validation error message
            const firstError = Object.values(error.errors)[0];
            if (firstError) {
                errorMessage = firstError.message || errorMessage;
            }
        }
        
        res.status(500).json({ 
            success: false, 
            message: errorMessage,
            error: process.env.NODE_ENV === 'development' ? {
                message: error.message,
                name: error.name,
                code: error.code,
                keyPattern: error.keyPattern,
                keyValue: error.keyValue,
                errors: error.errors
            } : undefined
        });
    }
});

// Get all submissions for a quiz (teacher/admin only)
router.get('/submissions/quiz/:quizId', protect, async (req, res) => {
    try {
        if (req.user.role !== 'admin' && req.user.role !== 'teacher') {
            return res.status(403).json({ 
                success: false, 
                message: 'Not authorized to view submissions' 
            });
        }

        const submissions = await Submission.find({ quiz: req.params.quizId })
            .populate('user', 'firstName lastName email')
            .sort({ submittedAt: -1 });

        res.status(200).json({ success: true, data: submissions });
    } catch (error) {
        console.error('Error fetching submissions:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error fetching submissions',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// Get submission details
router.get('/submissions/detail/:submissionId', protect, async (req, res) => {
    try {
        const submission = await Submission.findById(req.params.submissionId)
            .populate('studentId', 'firstName lastName email')
            .populate('quizId', 'title questions');

        if (!submission) {
            return res.status(404).json({ 
                success: false, 
                message: 'Submission not found' 
            });
        }

        // Only allow the student who submitted or admin/teacher to view
        if (req.user.role === 'student' && submission.studentId._id.toString() !== req.user.id) {
            return res.status(403).json({ 
                success: false, 
                message: 'Not authorized to view this submission' 
            });
        }

        res.status(200).json({ success: true, data: submission });
    } catch (error) {
        console.error('Error fetching submission:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error fetching submission',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// Publish/Unpublish quiz
router.patch('/publish/:id', protect, async (req, res) => {
    try {
        const { isPublished } = req.body;
        
        if (typeof isPublished !== 'boolean') {
            return res.status(400).json({ 
                success: false, 
                message: 'isPublished must be a boolean' 
            });
        }

        const quiz = await Quiz.findByIdAndUpdate(
            req.params.id,
            { isPublished },
            { new: true, runValidators: true }
        );

        if (!quiz) {
            return res.status(404).json({ 
                success: false, 
                message: 'Quiz not found' 
            });
        }

        res.status(200).json({ 
            success: true, 
            message: `Quiz ${isPublished ? 'published' : 'unpublished'} successfully`,
            data: quiz
        });
    } catch (error) {
        console.error('Error updating quiz:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error updating quiz',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// Delete a quiz
router.delete('/delete/:id', protect, async (req, res) => {
    try {
        const quiz = await Quiz.findById(req.params.id);
        
        if (!quiz) {
            return res.status(404).json({ 
                success: false, 
                message: 'Quiz not found' 
            });
        }

        // Only allow the teacher who created the quiz or admin to delete
        if (req.user.role !== 'admin' && quiz.teacherId.toString() !== req.user.id) {
            return res.status(403).json({ 
                success: false, 
                message: 'Not authorized to delete this quiz' 
            });
        }

        await Quiz.findByIdAndDelete(req.params.id);
        
        // Also delete all submissions for this quiz
        await Submission.deleteMany({ quizId: req.params.id });

        res.status(200).json({ 
            success: true, 
            message: 'Quiz deleted successfully' 
        });
    } catch (error) {
        console.error('Error deleting quiz:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error deleting quiz',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// Get quizzes by class
router.get('/class/:classId', protect, async (req, res) => {
    try {
        const { classId } = req.params;
        const quizzes = await Quiz.find({ 
            classId,
            isPublished: true 
        }).sort({ createdAt: -1 });

        res.status(200).json({ success: true, data: quizzes });
    } catch (error) {
        console.error('Error fetching class quizzes:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error fetching class quizzes',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

module.exports = router;
