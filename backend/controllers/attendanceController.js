const Attendance = require('../models/Attendance');
const User = require('../models/User');

// Get attendance for a specific class and date
exports.getAttendance = async (req, res) => {
  try {
    const { class: className, date } = req.query;
    const teacherId = req.user.id;

    const attendance = await Attendance.findOne({
      class: className,
      date: new Date(date),
      createdBy: teacherId
    }).populate('records.studentId', 'name email');

    if (attendance) {
      return res.json(attendance);
    }

    // If no attendance record exists, fetch students for the class
    const response = await fetch(`http://localhost:${process.env.PORT || 5000}/api/students/class/${encodeURIComponent(className)}`, {
      headers: {
        'Authorization': req.headers.authorization
      }
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to fetch students for class');
    }
    
    const { data: students } = await response.json();
    
    const records = students.map(student => ({
      studentId: student._id,
      status: 'present',
      remarks: ''
    }));

    res.json({
      class: className,
      date: new Date(date),
      records
    });

  } catch (error) {
    console.error('Error fetching attendance:', error);
    res.status(500).json({ message: 'Error fetching attendance', error: error.message });
  }
};

// Save attendance
exports.saveAttendance = async (req, res) => {
  try {
    const { class: className, date, records } = req.body;
    const teacherId = req.user.id;

    // Validate input
    if (!className || !date || !Array.isArray(records)) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    // Create or update attendance record
    const attendance = await Attendance.findOneAndUpdate(
      {
        class: className,
        date: new Date(date),
        createdBy: teacherId
      },
      {
        $set: {
          records: records.map(record => ({
            studentId: record.studentId,
            status: record.status,
            remarks: record.remarks || ''
          }))
        }
      },
      { 
        new: true,
        upsert: true,
        runValidators: true
      }
    ).populate('records.studentId', 'name email');

    res.status(201).json(attendance);
  } catch (error) {
    console.error('Error saving attendance:', error);
    res.status(500).json({ message: 'Error saving attendance', error: error.message });
  }
};

// Get a single attendance record by ID
exports.getAttendanceById = async (req, res) => {
  try {
    const { id } = req.params;
    const teacherId = req.user.id;

    // Validate ID format
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ message: 'Invalid attendance record ID' });
    }

    // Find attendance record
    const attendance = await Attendance.findOne({
      _id: id,
      createdBy: teacherId
    }).populate('records.studentId', 'name email');

    if (!attendance) {
      console.error(`Attendance record not found for ID: ${id}`);
      return res.status(404).json({ message: 'Attendance record not found' });
    }

    // Format the response with proper structure
    const response = {
      date: attendance.date,
      class: attendance.class,
      createdBy: {
        id: attendance.createdBy,
        name: 'Teacher' // We don't have teacher name in our data model
      },
      records: attendance.records.map(record => ({
        studentId: {
          id: record.studentId._id,
          name: record.studentId.name,
          email: record.studentId.email
        },
        status: record.status,
        remarks: record.remarks || ''
      }))
    };

    res.json(response);
  } catch (error) {
    console.error('Error fetching attendance record:', error);
    res.status(500).json({ 
      message: 'Error fetching attendance record', 
      error: error.message 
    });
  }
};

// Get attendance history for a specific class within a date range
exports.getAttendanceHistory = async (req, res) => {
  try {
    const { class: className, start, end } = req.query;
    const { id: userId, role } = req.user;

    console.log('=== Attendance History Request ===');
    console.log('Query params:', { className, start, end });
    console.log('User:', { userId, role });

    // Validate input
    if (!className || !start || !end) {
      console.error('Missing required parameters');
      return res.status(400).json({ message: 'Missing required parameters' });
    }

    // Parse dates
    const startDate = new Date(start);
    const endDate = new Date(end);
    endDate.setHours(23, 59, 59, 999); // Include end of day

    // Build initial query
    let query = {
      class: className,
      date: { $gte: startDate, $lte: endDate }
    };

    console.log('Initial query:', JSON.stringify(query, null, 2));

    // For debugging: Try a more permissive query
    const testQuery = { class: className };
    console.log('Test query (all records for class):', JSON.stringify(testQuery, null, 2));
    
    // Find all records for this class (for debugging)
    const allClassRecords = await Attendance.find(testQuery);
    console.log(`Found ${allClassRecords.length} total records for class ${className}`);
    if (allClassRecords.length > 0) {
      console.log('Sample record:', {
        _id: allClassRecords[0]._id,
        class: allClassRecords[0].class,
        date: allClassRecords[0].date,
        createdBy: allClassRecords[0].createdBy,
        recordCount: allClassRecords[0].records?.length || 0
      });
    }

    // Only filter by createdBy if the user is a teacher
    if (role === 'teacher') {
      query.createdBy = userId;
    }

    console.log('Final query with role-based filters:', JSON.stringify(query, null, 2));

    // Execute the query
    const attendanceRecords = await Attendance.find(query)
      .populate('records.studentId', 'name email')
      .populate('createdBy', 'name email');

    console.log(`Found ${attendanceRecords.length} matching attendance records`);
    
    // For debugging: Return more information
    const response = {
      success: true,
      count: attendanceRecords.length,
      query: {
        class: className,
        dateRange: { start: startDate, end: endDate },
        userRole: role,
        filteredByTeacher: role === 'teacher' ? userId : 'no (admin user)'
      },
      data: attendanceRecords
    };

    console.log('=== End of Attendance History Request ===');
    res.json(response.data);
  } catch (error) {
    console.error('Error in getAttendanceHistory:', {
      error: error.message,
      stack: error.stack,
      request: {
        query: req.query,
        user: req.user
      }
    });
    
    res.status(500).json({ 
      success: false,
      message: 'Error fetching attendance history', 
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};
