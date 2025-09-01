const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
// Temporarily comment out auth for testing
// const auth = require('../middleware/auth');
const auth = (req, res, next) => { next(); }; // Mock auth for testing
const Class = require('../models/Class');

// @route   GET api/classes
// @desc    Get all classes
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const classes = await Class.find().sort({ level: 1, name: 1 });
    res.json(classes);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   POST api/classes
// @desc    Create a new class
// @access  Private
router.post(
  '/',
  [
    auth,
    [
      body('name', 'Class name is required').not().isEmpty(),
      body('level', 'Level is required').isIn(['Pre-School', 'Primary', 'Elementary', 'Middle School', 'High School']),
      body('capacity', 'Capacity is required').isNumeric(),
      body('academicYear', 'Academic year is required').not().isEmpty(),
    ],
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      name,
      level,
      section = '',
      capacity = 30,
      teacherInCharge = '',
      roomNumber = '',
      academicYear,
      notes = '',
    } = req.body;

    try {
      // Check if class already exists for this academic year
      const existingClass = await Class.findOne({ name, academicYear });
      if (existingClass) {
        return res.status(400).json({ 
          errors: [{ msg: 'A class with this name already exists for the selected academic year' }] 
        });
      }


      const newClass = new Class({
        name,
        level,
        section,
        capacity,
        teacherInCharge,
        roomNumber,
        academicYear,
        notes,
        studentCount: 0,
      });

      await newClass.save();
      res.json(newClass);
    } catch (err) {
      console.error(err.message);
      if (err.code === 11000) {
        return res.status(400).json({ 
          errors: [{ msg: 'A similar class already exists. Please check the level, section, and academic year.' }] 
        });
      }
      res.status(500).send('Server Error');
    }
  }
);

// @route   PUT api/classes/:id
// @desc    Update a class
// @access  Private
router.put(
  '/:id',
  [
    auth,
    [
      body('name', 'Class name is required').not().isEmpty(),
      body('level', 'Level is required').isIn(['Pre-School', 'Primary', 'Elementary', 'Middle School', 'High School']),
      body('capacity', 'Capacity is required').isNumeric(),
      body('academicYear', 'Academic year is required').not().isEmpty(),
    ],
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      name,
      level,
      section = '',
      capacity = 30,
      teacherInCharge = '',
      roomNumber = '',
      academicYear,
      notes = '',
    } = req.body;

    try {
      let classObj = await Class.findById(req.params.id);
      
      if (!classObj) {
        return res.status(404).json({ msg: 'Class not found' });
      }

      // Check if updating would cause a duplicate
      const existingClass = await Class.findOne({
        _id: { $ne: req.params.id },
        name,
        academicYear
      });

      if (existingClass) {
        return res.status(400).json({ 
          errors: [{ msg: 'A class with this name already exists for the selected academic year' }] 
        });
      }

      
      // Update class fields
      classObj.name = name;
      classObj.level = level;
      classObj.section = section;
      classObj.capacity = capacity;
      classObj.teacherInCharge = teacherInCharge;
      classObj.roomNumber = roomNumber;
      classObj.academicYear = academicYear;
      classObj.notes = notes;

      await classObj.save();
      res.json(classObj);
    } catch (err) {
      console.error(err.message);
      if (err.code === 11000) {
        return res.status(400).json({ 
          errors: [{ msg: 'A similar class already exists. Please check the level, section, and academic year.' }] 
        });
      }
      res.status(500).send('Server Error');
    }
  }
);

// @route   DELETE api/classes/:id
// @desc    Delete a class
// @access  Private
router.delete('/:id', auth, async (req, res) => {
  try {
    const classObj = await Class.findById(req.params.id);
    
    if (!classObj) {
      return res.status(404).json({ msg: 'Class not found' });
    }

    // Check if class has students
    if (classObj.studentCount > 0) {
      return res.status(400).json({ 
        msg: 'Cannot delete class with students. Please remove all students first.' 
      });
    }

    await classObj.remove();
    res.json({ msg: 'Class removed' });
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Class not found' });
    }
    res.status(500).send('Server Error');
  }
});

module.exports = router;
