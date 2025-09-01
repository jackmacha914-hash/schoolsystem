const express = require('express');
const User = require('../models/User');
const router = express.Router();
const { protect } = require('../middleware/auth');

// Debug middleware to log all requests to user routes
router.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] User route accessed: ${req.method} ${req.originalUrl}`);
    console.log('Request origin:', req.headers.origin);
    console.log('Request headers:', req.headers);
    next();
});

/**
 * @route   GET /api/users/me
 * @desc    Get current user's profile
 * @access  Private
 */
router.get('/me', protect, async (req, res) => {
    console.log('[DEBUG] GET /api/users/me - Start');
    console.log('[DEBUG] Authenticated user:', req.user);
    
    try {
        // Get user ID from the token
        const userId = req.user.userId || req.user.id || req.user._id;
        console.log('[DEBUG] Fetching user profile for user ID:', userId);
        
        if (!userId) {
            console.error('[ERROR] No user ID found in request');
            return res.status(400).json({ 
                success: false,
                message: 'User ID not found in token',
                user: req.user // For debugging
            });
        }
        
        // First, get the user without populating to check if user exists
        const user = await User.findById(userId).select('-password').lean();
            
        if (!user) {
            console.error('[ERROR] User not found with ID:', userId);
            return res.status(404).json({ 
                success: false,
                message: 'User not found' 
            });
        }
        
        console.log('[DEBUG] User found:', {
            _id: user._id,
            email: user.email,
            role: user.role,
            class: user.class,
            completedQuizzesCount: user.completedQuizzes ? user.completedQuizzes.length : 0
        });
        
        // If user has no completed quizzes, return early with empty array
        if (!user.completedQuizzes || user.completedQuizzes.length === 0) {
            console.log('[DEBUG] No completed quizzes found for user:', user._id);
            return res.json({
                success: true,
                user: {
                    _id: user._id,
                    email: user.email,
                    firstName: user.firstName || '',
                    lastName: user.lastName || '',
                    role: user.role,
                    class: user.class || '',
                    completedQuizzes: []
                }
            });
        }
        
        console.log('[DEBUG] User has', user.completedQuizzes.length, 'completed quizzes');
        
        console.log('[DEBUG] Attempting to populate completed quizzes');
        
        // Populate completed quizzes with better error handling
        const populatedUser = await User.findById(user._id)
            .select('-password')
            .populate({
                path: 'completedQuizzes.quizId',
                select: 'title description subject class',
                options: { 
                    lean: true,
                    // Handle cases where referenced quiz might not exist
                    transform: (doc) => doc || null
                }
            })
            .lean();
        
        if (!populatedUser) {
            console.error('[ERROR] User not found after population attempt');
            throw new Error('User not found after population');
        }
        
        // Filter out any null quiz references or invalid quiz objects
        const validCompletedQuizzes = (populatedUser.completedQuizzes || []).filter(item => 
            item && 
            item.quizId && 
            typeof item.quizId === 'object' && 
            !Array.isArray(item.quizId)
        );
        
        console.log(`[DEBUG] Successfully populated ${validCompletedQuizzes.length} valid quizzes out of ${populatedUser.completedQuizzes?.length || 0} for user ${user._id}`);
        
        // Create a clean user object with only the necessary fields
        const userResponse = {
            _id: populatedUser._id,
            email: populatedUser.email,
            firstName: populatedUser.firstName || '',
            lastName: populatedUser.lastName || '',
            role: populatedUser.role,
            class: populatedUser.class || '',
            completedQuizzes: validCompletedQuizzes.map(quiz => ({
                quizId: quiz.quizId._id,
                score: quiz.score,
                totalQuestions: quiz.totalQuestions,
                completedAt: quiz.completedAt,
                title: quiz.quizId.title,
                description: quiz.quizId.description,
                subject: quiz.quizId.subject,
                class: quiz.quizId.class
            }))
        };
        
        res.json({
            success: true,
            user: userResponse
        });
        
    } catch (error) {
        console.error('[ERROR] Unhandled error in /api/users/me:', {
            message: error.message,
            stack: error.stack,
            userId: req.user?.userId,
            timestamp: new Date().toISOString()
        });
        
        // If there's an error, return a minimal safe user object
        const safeUser = {
            _id: req.user?.userId,
            email: req.user?.email || '',
            firstName: req.user?.firstName || '',
            lastName: req.user?.lastName || '',
            role: req.user?.role || 'student',
            class: req.user?.class || '',
            completedQuizzes: []
        };
        
        res.json({
            success: true,
            user: safeUser
        });
    } finally {
        console.log(`[DEBUG] GET /api/users/me - Completed for user ${req.user?.userId}`);
    }
});

module.exports = router;
