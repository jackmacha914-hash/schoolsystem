const express = require('express');
const User = require('../models/User');
const { protect } = require('../middleware/auth');
const { updateProfile, changePassword, getProfile } = require('../controllers/profileController');

const router = express.Router();

// Get current user's profile (alternative to /api/users/me)
router.get('/me', protect, async (req, res) => {
    console.log('[DEBUG] GET /api/profile/me - Start');
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
        
        // Get the user without populating first to check if exists
        const user = await User.findById(userId).select('-password').lean();
            
        if (!user) {
            console.error('[ERROR] User not found with ID:', userId);
            return res.status(404).json({ 
                success: false,
                message: 'User not found' 
            });
        }
        
        // Get completed quizzes separately to avoid population issues
        const userWithQuizzes = await User.findById(userId)
            .select('completedQuizzes')
            .populate({
                path: 'completedQuizzes.quizId',
                select: 'title subject totalMarks',
                model: 'Quiz'
            })
            .lean();
        
        // Safely get completedQuizzes or default to empty array
        const completedQuizzes = (userWithQuizzes && userWithQuizzes.completedQuizzes) || [];
        
        console.log('[DEBUG] Successfully fetched user profile');
        res.json({ 
            success: true, 
            user: {
                _id: user._id,
                email: user.email,
                role: user.role,
                class: user.class,
                firstName: user.firstName,
                lastName: user.lastName,
                name: user.firstName ? 
                    `${user.firstName} ${user.lastName || ''}`.trim() : 
                    (user.name || 'User'),
                completedQuizzes: completedQuizzes
            }
        });
        
    } catch (error) {
        console.error('[ERROR] Error in GET /api/profile/me:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Server error',
            error: error.message 
        });
    }
});

// Route to get the profile (GET request)
router.get('/', protect, getProfile);

// Route to update profile (PUT request)
router.put('/', protect, updateProfile);

// Route to change password (POST request)
router.post('/change-password', protect, changePassword);

module.exports = router;
