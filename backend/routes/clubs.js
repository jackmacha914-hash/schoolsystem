const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

console.log('Clubs router initialized');

// Log all incoming requests
router.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
    console.log('Request params:', req.params);
    console.log('Request body:', req.body);
    console.log('Request query:', req.query);
    console.log('Request headers:', req.headers);
    next();
});

// Try to get the Club model or require it if it doesn't exist
let Club;
try {
    Club = mongoose.model('Club');
    console.log('Using existing Club model');
} catch (error) {
    console.log('Requiring Club model...');
    Club = require('../models/Club');
}

// Debug middleware to log all requests to clubs routes
router.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
    next();
});

// Test route to verify the base route is working
router.get('/test', (req, res) => {
    console.log('Test endpoint hit!');
    res.json({ message: 'Clubs route is working!' });
});

// Test database connection and Club model
router.get('/test-db', async (req, res) => {
    try {
        const count = await Club.countDocuments();
        res.json({
            success: true,
            message: 'Successfully connected to database',
            clubCount: count
        });
    } catch (err) {
        console.error('Database connection test failed:', err);
        res.status(500).json({
            success: false,
            message: 'Database connection failed',
            error: err.message
        });
    }
});

// Test route to verify DELETE is working
router.delete('/test-delete', (req, res) => {
    console.log('Test DELETE route hit!');
    res.json({ success: true, message: 'DELETE test successful' });
});

// Remove a member from a club
router.delete('/:clubId/members/:memberId', async (req, res) => {
    console.log('DELETE /api/clubs/:clubId/members/:memberId - Request received');
    console.log('Request params:', req.params);
    console.log('Request headers:', req.headers);
    
    try {
        const { clubId, memberId } = req.params;
        console.log('Processing request for clubId:', clubId, 'memberId:', memberId);
        
        // Log the raw values before any processing
        console.log('Raw clubId:', typeof clubId, clubId);
        console.log('Raw memberId:', typeof memberId, memberId);
        
        // Convert string IDs to MongoDB ObjectIds for comparison
        const mongoose = require('mongoose');
        let memberObjectId;
        let clubObjectId;
        
        try {
            memberObjectId = new mongoose.Types.ObjectId(memberId);
            clubObjectId = new mongoose.Types.ObjectId(clubId);
        } catch (err) {
            console.error('Error creating ObjectId:', err);
            return res.status(400).json({ 
                error: 'Invalid ID format',
                details: err.message,
                clubId,
                memberId
            });
        }
        
        // Find the club and remove the member
        console.log('Looking for club with ID:', clubId);
        const club = await Club.findById(clubId);
        if (!club) {
            console.error('Club not found with ID:', clubId);
            return res.status(404).json({ 
                error: 'Club not found',
                clubId
            });
        }
        
        // Log current members before removal
        console.log('Club found. Current members:', club.members);
        console.log('Member IDs in club:', club.members.map(id => id.toString()));
        console.log('Looking for member with ID to remove:', memberId);
        
        // Check if member exists in the club
        const memberExists = club.members.some(id => id.toString() === memberId);
        if (!memberExists) {
            console.error('Member not found in club. Member ID:', memberId, 'Club members:', club.members);
            return res.status(404).json({ 
                error: 'Member not found in this club',
                memberId,
                clubId,
                memberIdsInClub: club.members.map(id => id.toString())
            });
        }
        
        // Remove member from the members array
        const initialLength = club.members.length;
        club.members = club.members.filter(id => id.toString() !== memberId);
        
        console.log('After removal - Members count:', club.members.length, 'was:', initialLength);
        
        // Save the updated club
        console.log('Saving updated club...');
        try {
            await club.save();
            console.log('Club updated successfully');
        } catch (saveError) {
            console.error('Error saving club:', saveError);
            throw new Error(`Failed to save club: ${saveError.message}`);
        }
        
        // Get the updated club data
        console.log('Fetching updated club data...');
        const updatedClub = await Club.findById(clubId).populate('members', 'name class admissionNumber');
        
        console.log('Member removed successfully');
        res.json({
            success: true,
            message: 'Member removed successfully',
            club: {
                _id: updatedClub._id,
                name: updatedClub.name,
                members: updatedClub.members.map(member => ({
                    _id: member._id,
                    name: member.name,
                    class: member.class,
                    admissionNumber: member.admissionNumber
                }))
            }
        });
        
    } catch (error) {
        console.error('Error removing member from club:', error);
        res.status(500).json({ 
            error: 'Failed to remove member from club',
            details: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
});

// Get all clubs
router.get('/', async (req, res) => {
  try {
    const clubs = await Club.find();
    res.json(clubs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create a new club
router.post('/', async (req, res) => {
  try {
    const { name, description } = req.body;
    if (!name || !description) {
      return res.status(400).json({ error: 'Name and description are required.' });
    }
    const newClub = new Club({ name, description });
    await newClub.save();
    res.status(201).json({ msg: 'Club created!', club: newClub });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get all students in a club
router.get('/:id/students', async (req, res) => {
    console.log('GET /api/clubs/:id/students - Request received');
    console.log('Club ID from params:', req.params.id);
    try {
        const { id: clubId } = req.params;
        
        const club = await Club.findById(clubId)
            .populate('members', 'name class admissionNumber')
            .select('name description members');
            
        if (!club) {
            return res.status(404).json({ error: 'Club not found' });
        }
        
        res.json({
            _id: club._id,
            name: club.name,
            description: club.description,
            members: club.members.map(member => ({
                _id: member._id,
                name: member.name,
                class: member.class,
                admissionNumber: member.admissionNumber
            }))
        });
    } catch (err) {
        console.error('Error fetching club members:', err);
        res.status(500).json({ error: 'Failed to fetch club members', details: err.message });
    }
});

// Add students to a club
router.post('/:id/students', async (req, res) => {
    try {
        const { id: clubId } = req.params;  // Extract clubId from URL parameter
        const { students } = req.body;

        if (!students || !Array.isArray(students) || students.length === 0) {
            return res.status(400).json({ error: 'Please provide an array of student IDs' });
        }

        const club = await Club.findById(clubId);
        if (!club) {
            return res.status(404).json({ error: 'Club not found' });
        }

        // Add students to the club if they're not already members
        const existingMembers = new Set(club.members.map(id => id.toString()));
        const newMembers = students.filter(id => !existingMembers.has(id));
        
        if (newMembers.length === 0) {
            return res.status(200).json({ 
                message: 'All selected students are already members of this club',
                club 
            });
        }

        club.members = [...club.members, ...newMembers];
        await club.save();

        res.status(200).json({ 
            message: 'Students added to club successfully',
            addedCount: newMembers.length,
            club 
        });

    } catch (err) {
        console.error('Error adding students to club:', err);
        res.status(500).json({ 
            error: 'Failed to add students to club',
            details: err.message 
        });
    }
});

// Add more CRUD routes as needed

module.exports = router;
