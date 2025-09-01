const Assignment = require('../models/Assignment');

// Create Assignment
exports.createAssignment = async (req, res) => {
    console.log('👤 Authenticated User:', req.user);
    try {
        console.log('User:', req.user);
        console.log('req.body:', req.body);
        console.log('req.file:', req.file);

        if (!req.body) {
            return res.status(400).json({ 
                error: 'No data provided',
                details: 'Please provide assignment title, description, due date, and class assigned'
            });
        }

        const { title, description, dueDate, classAssigned } = req.body;
        
        // Validate required fields
        if (!title || !dueDate || !classAssigned) {
            return res.status(400).json({ 
                error: 'Missing required fields',
                details: 'Please provide title, due date, and class assigned'
            });
        }

        let file = null;
        if (req.file) {
            file = req.file.filename;
        }

        const assignment = new Assignment({
            title,
            description,
            dueDate,
            classAssigned,
            teacher: req.user.id,
            file
        });

        await assignment.save();
        res.json({ msg: "Assignment created successfully!", assignment });
    } catch (err) {
        console.error('Assignment creation error:', err);
        res.status(500).json({ 
            error: 'Failed to create assignment',
            details: err.message 
        });
    }
};


// Get All Assignments
exports.getAssignments = async (req, res) => {
  try {
    console.log('Getting assignments...');
    const assignments = await Assignment.find();
    console.log('Found assignments:', assignments.length);
    
    // Send back the assignments as a JSON response
    res.json(assignments);
  } catch (err) {
    console.error('Error fetching assignments:', err);
    console.error('Stack trace:', err.stack);
    res.status(500).json({ 
      error: 'Failed to fetch assignments',
      details: err.message 
    });
  }
};

// Update Assignment
exports.updateAssignment = async (req, res) => {
    try {
        const { title, description, dueDate, classAssigned } = req.body;

        const assignment = await Assignment.findById(req.params.id);
        if (!assignment) return res.status(404).json({ msg: "Assignment not found" });

        assignment.title = title || assignment.title;
        assignment.description = description || assignment.description;
        assignment.dueDate = dueDate || assignment.dueDate;
        assignment.classAssigned = classAssigned || assignment.classAssigned;

        await assignment.save();
        res.json({ msg: "Assignment updated successfully", assignment });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Delete Assignment
exports.deleteAssignment = async (req, res) => {
    try {
        const assignment = await Assignment.findById(req.params.id);
        if (!assignment) return res.status(404).json({ msg: "Assignment not found" });

        await assignment.deleteOne();
        res.json({ msg: "Assignment deleted successfully" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
