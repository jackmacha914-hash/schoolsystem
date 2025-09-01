const Grade = require('../models/Grade');

// Add Grade
exports.addGrade = async (req, res) => {
    try {
        const { student, subject, score } = req.body;

        const grade = new Grade({
            student,
            subject,
            score,
            teacher: req.user.id
        });

        await grade.save();
        res.json({ msg: "Grade added successfully!", grade });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Get Student Grades
exports.getStudentGrades = async (req, res) => {
    try {
        const grades = req.user.role === 'Student' 
            ? await Grade.find({ student: req.user.id }).populate('student', 'name')
            : await Grade.find().populate('student', 'name');
        
        res.json(grades);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Update Grade
exports.updateGrade = async (req, res) => {
    try {
        const { score } = req.body;

        const grade = await Grade.findById(req.params.id);
        if (!grade) return res.status(404).json({ msg: "Grade not found" });

        grade.score = score || grade.score;
        await grade.save();
        res.json({ msg: "Grade updated successfully", grade });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Delete Grade
exports.deleteGrade = async (req, res) => {
    try {
        const grade = await Grade.findById(req.params.id);
        if (!grade) return res.status(404).json({ msg: "Grade not found" });

        await grade.deleteOne();
        res.json({ msg: "Grade deleted successfully" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
