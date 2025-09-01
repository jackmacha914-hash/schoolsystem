const Class = require('../models/Class');
const User = require('../models/User');

// Create a new class
const createClass = async (req, res) => {
  try {
    const { name, description, subject, schedule, academicYear } = req.body;
    
    const newClass = new Class({
      name,
      description,
      teacher: req.user.id,
      subject,
      schedule,
      academicYear,
      students: []
    });

    await newClass.save();
    res.status(201).json(newClass);
  } catch (error) {
    console.error('Error creating class:', error);
    res.status(500).json({ message: 'Server error creating class' });
  }
};

// Get all classes for a teacher
const getTeacherClasses = async (req, res) => {
  try {
    const classes = await Class.find({ teacher: req.user.id })
      .populate('students', 'name email')
      .sort({ createdAt: -1 });
    
    res.json(classes);
  } catch (error) {
    console.error('Error fetching classes:', error);
    res.status(500).json({ message: 'Server error fetching classes' });
  }
};

// Get class by ID
const getClassById = async (req, res) => {
  try {
    const classData = await Class.findById(req.params.id)
      .populate('teacher', 'name email')
      .populate('students', 'name email');
    
    if (!classData) {
      return res.status(404).json({ message: 'Class not found' });
    }
    
    res.json(classData);
  } catch (error) {
    console.error('Error fetching class:', error);
    res.status(500).json({ message: 'Server error fetching class' });
  }
};

// Update class
const updateClass = async (req, res) => {
  try {
    const { name, description, subject, schedule, academicYear } = req.body;
    
    const updatedClass = await Class.findOneAndUpdate(
      { _id: req.params.id, teacher: req.user.id },
      { name, description, subject, schedule, academicYear },
      { new: true, runValidators: true }
    );
    
    if (!updatedClass) {
      return res.status(404).json({ message: 'Class not found or not authorized' });
    }
    
    res.json(updatedClass);
  } catch (error) {
    console.error('Error updating class:', error);
    res.status(500).json({ message: 'Server error updating class' });
  }
};

// Delete class
const deleteClass = async (req, res) => {
  try {
    const deletedClass = await Class.findOneAndDelete({
      _id: req.params.id,
      teacher: req.user.id
    });
    
    if (!deletedClass) {
      return res.status(404).json({ message: 'Class not found or not authorized' });
    }
    
    res.json({ message: 'Class deleted successfully' });
  } catch (error) {
    console.error('Error deleting class:', error);
    res.status(500).json({ message: 'Server error deleting class' });
  }
};

// Add student to class
const addStudentToClass = async (req, res) => {
  try {
    const { studentId } = req.body;
    
    // Check if student exists and is a student
    const student = await User.findById(studentId);
    if (!student || student.role !== 'student') {
      return res.status(400).json({ message: 'Invalid student' });
    }
    
    const updatedClass = await Class.findOneAndUpdate(
      { _id: req.params.id, teacher: req.user.id },
      { $addToSet: { students: studentId } },
      { new: true }
    );
    
    if (!updatedClass) {
      return res.status(404).json({ message: 'Class not found or not authorized' });
    }
    
    res.json(updatedClass);
  } catch (error) {
    console.error('Error adding student to class:', error);
    res.status(500).json({ message: 'Server error adding student to class' });
  }
};

// Remove student from class
const removeStudentFromClass = async (req, res) => {
  try {
    const { studentId } = req.body;
    
    const updatedClass = await Class.findOneAndUpdate(
      { _id: req.params.id, teacher: req.user.id },
      { $pull: { students: studentId } },
      { new: true }
    );
    
    if (!updatedClass) {
      return res.status(404).json({ message: 'Class not found or not authorized' });
    }
    
    res.json(updatedClass);
  } catch (error) {
    console.error('Error removing student from class:', error);
    res.status(500).json({ message: 'Server error removing student from class' });
  }
};

module.exports = {
  createClass,
  getTeacherClasses,
  getClassById,
  updateClass,
  deleteClass,
  addStudentToClass,
  removeStudentFromClass
};
