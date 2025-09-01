const mongoose = require('mongoose');

// Dynamic model name based on class name
const getClassStudentModel = (className) => {
    const modelName = `Student_${className.replace(/[^a-zA-Z0-9]/g, '_')}`;
    const schema = new mongoose.Schema({
        studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        name: { type: String, required: true },
        email: { type: String, required: true },
        class: { type: String, required: true },
        createdAt: { type: Date, default: Date.now },
        updatedAt: { type: Date, default: Date.now }
    });

    // Create or get the model
    return mongoose.models[modelName] || mongoose.model(modelName, schema);
};

module.exports = getClassStudentModel;
