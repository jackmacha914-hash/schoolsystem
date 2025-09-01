const User = require('../models/User');
const bcrypt = require('bcryptjs');

// Update profile
exports.updateProfile = async (req, res) => {
  try {
    console.log('=== UPDATE PROFILE REQUEST ===');
    console.log('Request body:', JSON.stringify(req.body, null, 2));
    console.log('User from token:', req.user);
    
    const { name, email, subjects, photo } = req.body;

    // Log received data
    console.log('Processing update for user ID:', req.user.id);
    console.log('Update data:', { name, email, subjects: subjects?.length || 0, hasPhoto: !!photo });

    // Find user by ID (this should be in the token)
    const user = await User.findById(req.user.id);
    console.log('Found user:', user ? 'Yes' : 'No');

    if (!user) {
      console.error('User not found with ID:', req.user.id);
      return res.status(404).json({ message: 'User not found' });
    }

    // Update user information
    console.log('Updating user fields...');
    user.name = name || user.name;
    user.email = email || user.email;
    
    // Initialize profile if it doesn't exist
    user.profile = user.profile || {};
    
    // Update profile fields if they exist in the request
    if (subjects !== undefined) {
      console.log('Updating subjects:', subjects);
      user.profile.subjects = Array.isArray(subjects) ? subjects : [subjects].filter(Boolean);
    }
    
    if (photo !== undefined) {
      console.log('Updating photo');
      user.profile.photo = photo;
    }
    
    // Ensure health object exists
    user.profile.health = user.profile.health || {};
    
    // Convert string health fields to arrays if they're not already
    const healthFields = ['allergies', 'medicalConditions', 'medications'];
    healthFields.forEach(field => {
      if (user.profile.health[field] && !Array.isArray(user.profile.health[field])) {
        user.profile.health[field] = [user.profile.health[field]].filter(Boolean);
      }
    });

    console.log('Saving user...');
    const updatedUser = await user.save();
    console.log('User saved successfully');

    // Prepare response data
    const responseData = {
      _id: updatedUser._id,
      name: updatedUser.name,
      email: updatedUser.email,
      role: updatedUser.role,
      profile: {
        ...(updatedUser.profile || {}),
        subjects: updatedUser.profile?.subjects || []
      }
    };

    console.log('Sending success response');
    res.status(200).json({
      message: 'Profile updated successfully',
      profile: responseData,
    });
  } catch (err) {
    console.error('Error updating profile:');
    console.error('Error name:', err.name);
    console.error('Error message:', err.message);
    console.error('Error stack:', err.stack);
    
    // Check for validation errors
    if (err.name === 'ValidationError') {
      console.error('Validation errors:', err.errors);
      return res.status(400).json({ 
        error: 'Validation Error',
        details: Object.values(err.errors).map(e => e.message)
      });
    }
    
    // Check for duplicate key error (e.g., duplicate email)
    if (err.code === 11000) {
      const field = Object.keys(err.keyPattern)[0];
      return res.status(400).json({ 
        error: 'Duplicate Field',
        message: `${field} already exists`
      });
    }
    
    res.status(500).json({ 
      error: 'Internal Server Error',
      message: err.message 
    });
  }
};

// Change password
exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    // Find user by ID (this should be in the token)
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if the current password matches
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Current password is incorrect' });
    }

    // Hash and update the new password
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    await user.save();

    res.status(200).json({ message: 'Password changed successfully' });
  } catch (err) {
    console.error('Error changing password:', err);
    res.status(500).json({ error: err.message });
  }
};

// Get profile
exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Prepare response data
    const responseData = {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      profile: user.profile || {}
    };

    res.status(200).json(responseData);
  } catch (err) {
    console.error('Error fetching profile:', err);
    res.status(500).json({ error: err.message });
  }
};