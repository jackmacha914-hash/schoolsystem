// backend/routes/quizRoutes.js
const express = require('express');
const Quiz = require('../models/Quiz');
const User = require('../models/User');
const Submission = require('../models/Submission');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');

// Simple request logger
router.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
    next();
});

// Create a new quiz
router.post('/create', protect, async (req, res) => {
    try {
        const { title, description, questions, timeLimit, passingScore, classId } = req.body;
        
        // Basic validation
        if (!title || !questions || !Array.isArray(questions) || questions.length === 0) {
            return res.status(400).json({ 
                success: false,
                message: 'Title and at least one question are required' 
            });
        }

        const newQuiz = new Quiz({
            title,
            description,
            questions,
            timeLimit,
            passingScore,
            teacherId: req.user.id,
            classId
        });

        const savedQuiz = await newQuiz.save();
        res.status(201).json({ success: true, data: savedQuiz });
    } catch (error) {
        console.error('Error creating quiz:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error creating quiz',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
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
    try {
        const { quizId, answers, timeSpent } = req.body;
        const userId = req.user.id;
        
        // Validate input
        if (!quizId || !answers || !Array.isArray(answers)) {
            return res.status(400).json({ 
                success: false, 
                message: 'Quiz ID and answers array are required' 
            });
        }

        // Calculate score
        const quiz = await Quiz.findById(quizId);
        if (!quiz) {
            return res.status(404).json({ 
                success: false, 
                message: 'Quiz not found' 
            });
        }

        let score = 0;
        answers.forEach(answer => {
            const question = quiz.questions.id(answer.questionId);
            if (question && question.correctAnswer === answer.selectedOption) {
                score++;
            }
        });

        const submission = new Submission({
            quizId,
            studentId: userId,
            answers,
            score,
            totalQuestions: quiz.questions.length,
            timeSpent
        });

        const savedSubmission = await submission.save();
        res.status(201).json({ 
            success: true, 
            data: {
                ...savedSubmission.toObject(),
                percentage: Math.round((score / quiz.questions.length) * 100),
                passed: score >= (quiz.passingScore || Math.ceil(quiz.questions.length * 0.7))
            }
        });
    } catch (error) {
        console.error('Error submitting quiz:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error submitting quiz',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
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

        const submissions = await Submission.find({ quizId: req.params.quizId })
            .populate('studentId', 'firstName lastName email')
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
