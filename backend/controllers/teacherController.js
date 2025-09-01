const User = require('../models/User');

// Get Teacher Profile
exports.getTeacherProfile = async (req, res) => {
    try {
        const teacher = await User.findById(req.user.id).select('-password');
        if (!teacher) return res.status(404).json({ msg: "Teacher not found" });

        res.json(teacher);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Update Teacher Profile
exports.updateTeacherProfile = async (req, res) => {
    try {
        const { name, subject } = req.body;

        const teacher = await User.findById(req.user.id);
        if (!teacher) return res.status(404).json({ msg: "Teacher not found" });

        teacher.name = name || teacher.name;
        teacher.subject = subject || teacher.subject;

        await teacher.save();
        res.json({ msg: "Profile updated successfully", teacher });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
