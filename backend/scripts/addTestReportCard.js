const mongoose = require('mongoose');
const ReportCard = require('../models/ReportCard');
const User = require('../models/User');

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/school_management', {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
.then(() => console.log('Connected to MongoDB'))
.catch(err => console.error('MongoDB connection error:', err));

// Create a test report card
const createTestReportCard = async () => {
    try {
        // Get the student user
        const student = await User.findById('68342a65515d0db5e8dd227f');
        if (!student) {
            console.error('Student not found');
            return;
        }

        // Create a sample report card
        const reportCard = new ReportCard({
            studentId: student._id,
            studentName: student.name,
            year: '2024',
            term: 'Term 1',
            comments: 'Good progress in all subjects',
            status: 'published',
            htmlContent: `
                <div class="report-card">
                    <h1>Report Card</h1>
                    <p>Student: ${student.name}</p>
                    <p>Term: Term 1 2024</p>
                    <div class="grades">
                        <div class="subject">
                            <h3>Mathematics</h3>
                            <p>Grade: A</p>
                            <p>Comments: Excellent performance</p>
                        </div>
                        <div class="subject">
                            <h3>Science</h3>
                            <p>Grade: B+</p>
                            <p>Comments: Good work</p>
                        </div>
                    </div>
                </div>
            `
        });

        // Save the report card
        await reportCard.save();
        console.log('Test report card created successfully:', reportCard._id);

        // Add to student's report cards array
        student.reportCards = student.reportCards || [];
        student.reportCards.push(reportCard._id);
        await student.save();
        console.log('Updated student with report card ID');

        // Close the connection
        mongoose.connection.close();
    } catch (error) {
        console.error('Error creating test report card:', error);
        mongoose.connection.close();
    }
};

// Run the script
createTestReportCard();
