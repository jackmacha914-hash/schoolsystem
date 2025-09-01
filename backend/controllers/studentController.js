const fs = require('fs');
const path = require('path');
const User = require('../models/User');
const bcrypt = require('bcrypt');
const getClassStudentModel = require('../models/ClassStudent');

// ✅ Get Students by Class
exports.getStudentsByClass = async (req, res) => {
    try {
        console.log('getStudentsByClass called with params:', req.params);
        const { className } = req.params;
        
        if (!className) {
            console.log('No className provided in request');
            return res.status(400).json({ 
                success: false, 
                message: 'Class name is required',
                receivedParams: req.params
            });
        }

        console.log(`Fetching students for class: ${className}`);
        
        const query = {
            role: 'student',
            $or: [
                { class: className },
                { 'profile.class': className }
            ]
        };
        
        console.log('MongoDB query:', JSON.stringify(query, null, 2));
        
        const students = await User.find(query)
            .select('name email profile.class class')
            .lean()
            .exec();
            
        console.log(`Found ${students.length} students for class ${className}`);
        
        // Log the first few students for debugging
        if (students.length > 0) {
            console.log('Sample students:', students.slice(0, 3).map(s => ({
                id: s._id,
                name: s.name,
                class: s.class,
                profileClass: s.profile?.class
            })));
        }

        res.json({
            success: true,
            data: students,
            count: students.length
        });
        
    } catch (err) {
        console.error('Error in getStudentsByClass:', err);
        
        // Log the full error for debugging
        console.error('Full error object:', JSON.stringify({
            name: err.name,
            message: err.message,
            stack: err.stack,
            ...err
        }, null, 2));
        
        res.status(500).json({ 
            success: false,
            message: 'Failed to fetch students',
            error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error',
            stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
        });
    }
};

// ✅ Get All Students
exports.getStudents = async (req, res) => {
    try {
        const role = req.path === '/teachers' ? 'teacher' : 'student';
        
        if (role === 'student') {
            const users = await User.find({ role: 'student' }).select('-password');
            res.json(users);
        } else {
            const users = await User.find({ role: 'teacher' }).select('-password');
            res.json(users);
        }
    } catch (err) {
        console.error('Error in getStudents:', err);
        res.status(500).json({ error: err.message });
    }
};

// ✅ Get User Profile (supports multiple roles)
exports.getStudentProfile = async (req, res) => {
    try {
        // Allow access to the user's own profile regardless of role
        const userId = req.params.id || req.user.id;
        
        console.log('Fetching profile for user ID:', userId);
        
        // If trying to access another user's profile, check permissions
        if (userId !== req.user.id.toString() && req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Access denied. You can only view your own profile.'
            });
        }

        const student = await User.findById(userId)
            .select('-password')
            .populate('profile.subjects', 'name')
            .lean();
            
        if (!student) {
            return res.status(404).json({ 
                success: false,
                message: 'Student not found' 
            });
        }

        // Ensure profile object exists
        if (!student.profile) {
            student.profile = {};
        }

        // Prepare response data
        const baseUrl = `${req.protocol}://${req.get('host')}`;
        let photoUrl = '';
        let photoPath = '';
        
        // Ensure we have a proper photo URL
        if (student.profile?.photo) {
            // If it's already a full URL, use it as is
            if (student.profile.photo.startsWith('http')) {
                photoUrl = student.profile.photo;
                photoPath = student.profile.photo;
            } 
            // If it's a path, prepend the base URL
            else if (student.profile.photo.startsWith('/')) {
                photoUrl = `${baseUrl}${student.profile.photo}`;
                photoPath = student.profile.photo;
            }
            // If it's just a filename, construct the full path
            else {
                photoUrl = `${baseUrl}/uploads/profile-photos/${student.profile.photo}`;
                photoPath = `/uploads/profile-photos/${student.profile.photo}`;
            }
        }

        // Get the class from root level, classAssigned, or profile, default to empty string
        const studentClass = student.class || student.classAssigned || (student.profile && student.profile.class) || '';
        console.log('Student class data:', { 
            rootClass: student.class, 
            profileClass: student.profile?.class,
            finalClass: studentClass 
        });
        
        const responseData = {
            success: true,
            id: student._id,
            name: student.name,
            email: student.email,
            role: student.role,
            class: studentClass,  // Add class at root level
            photoUrl: photoUrl,  // Add photoUrl at the root level for easy access
            photoPath: photoPath, // Add clean photo path
            profile: {
                ...(student.profile ? student.profile.toObject() : {}),
                class: studentClass,  // Ensure class is in profile
                grade: student.grade || (student.profile && student.profile.grade) || '',
                subjects: (student.profile && student.profile.subjects) || [],
                photo: photoUrl,  // Keep for backward compatibility
                photoPath: photoPath  // Keep for backward compatibility
            }
        };
        
        // If class is not at root level but is in profile, move it to root
        if (!responseData.class && responseData.profile?.class) {
            responseData.class = responseData.profile.class;
        }
        
        console.log('Returning profile data:', {
            id: responseData.id,
            email: responseData.email,
            role: responseData.role,
            photoUrl: photoUrl
        });

        res.json(responseData);
    } catch (err) {
        console.error('Error in getStudentProfile:', err);
        res.status(500).json({ 
            success: false,
            message: 'Server error',
            error: err.message 
        });
    }
};

// ✅ Update Student Profile
exports.updateStudentProfile = async (req, res) => {
    try {
        console.log('Received update request with body:', JSON.stringify(req.body, null, 2));
        
        const { name, email, profile, class: rootClass } = req.body;
        const userId = req.user.id;
        
        console.log('Updating profile with:', { name, email, rootClass, profile });

        // Find the student
        const student = await User.findById(userId);
        if (!student) {
            return res.status(404).json({ 
                success: false,
                message: 'Student not found' 
            });
        }

        // Update basic info
        if (name) student.name = name;
        if (email) student.email = email;
        
        // Handle class at root level (for backward compatibility)
        if (req.body.class) {
            console.log('Updating class from root level:', req.body.class);
            student.class = req.body.class;
            // Also update in profile for consistency
            student.profile = student.profile || {};
            student.profile.class = req.body.class;
        } else {
            console.log('No class provided in root level');
        }

        // Update profile fields
        if (profile) {
            console.log('Updating from profile object:', profile);
            student.profile = student.profile || {};
            
            // If class is in profile, update it at root level too
            if (profile.class) {
                console.log('Updating class from profile:', profile.class);
                student.class = profile.class;
                student.profile.class = profile.class;
            } else if (student.class) {
                // If we have class at root but not in profile, ensure it's in both places
                console.log('Ensuring class is in profile:', student.class);
                student.profile.class = student.class;
            } else {
                console.log('No class in profile object or root level');
            }
            
            if (profile.grade) student.profile.grade = profile.grade;
            
            // Handle subjects if provided
            if (profile.subjects) {
                student.profile.subjects = Array.isArray(profile.subjects) 
                    ? profile.subjects 
                    : [profile.subjects].filter(Boolean);
            }
        }

        console.log('Saving student with data:', {
            id: student._id,
            class: student.class,
            profile: student.profile
        });
        
        await student.save();
        
        console.log('Student saved successfully');

        // Get updated student data
        const updatedStudent = await User.findById(userId)
            .select('-password')
            .populate('profile.subjects', 'name')
            .lean();

        res.json({
            success: true,
            message: 'Profile updated successfully',
            profile: updatedStudent
        });
    } catch (err) {
        console.error('Error updating student profile:', err);
        
        // Handle duplicate key error (e.g., duplicate email)
        if (err.code === 11000) {
            return res.status(400).json({
                success: false,
                message: 'Email already exists',
                field: 'email'
            });
        }

        res.status(500).json({ 
            success: false,
            message: 'Failed to update profile',
            error: err.message 
        });
    }
};

// ✅ Upload Profile Photo
exports.uploadProfilePhoto = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'No file uploaded'
            });
        }

        const userId = req.user.id;
        const filename = req.file.filename;
        
        // Store relative path in the database
        const photoPath = `/uploads/profile-photos/${filename}`;
        
        // Get the base URL (e.g., http://localhost:5000)
        const baseUrl = `${req.protocol}://${req.get('host')}`;
        const fullPhotoUrl = `${baseUrl}${photoPath}`;

        // Update user's profile photo with both full URL and relative path
        await User.findByIdAndUpdate(userId, {
            $set: { 
                'profile.photo': fullPhotoUrl,
                'profile.photoPath': photoPath, // Store relative path for future reference
                'profile.originalFilename': req.file.originalname,
                'profile.photoUploadedAt': new Date()
            }
        });
        
        // Delete old profile photo if it exists and is different
        const user = await User.findById(userId);
        if (user?.profile?.photoPath && user.profile.photoPath !== photoPath) {
            try {
                const fs = require('fs');
                const path = require('path');
                const oldPhotoPath = path.join(__dirname, '..', user.profile.photoPath);
                if (fs.existsSync(oldPhotoPath)) {
                    fs.unlinkSync(oldPhotoPath);
                    console.log(`Deleted old profile photo: ${oldPhotoPath}`);
                }
            } catch (err) {
                console.error('Error deleting old profile photo:', err);
                // Don't fail the request if deletion fails
            }
        }

        res.json({
            success: true,
            message: 'Profile photo updated successfully',
            photoUrl: fullPhotoUrl,
            photoPath: photoPath
        });
    } catch (err) {
        console.error('Error uploading profile photo:', err);
        res.status(500).json({
            success: false,
            message: 'Failed to upload profile photo',
            error: err.message
        });
    }
};

// ✅ Change Password
exports.changePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        const user = await User.findById(req.user.id);

        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        // Check if current password is correct
        const isMatch = await bcrypt.compare(currentPassword, user.password);
        if (!isMatch) {
            return res.status(401).json({ error: "Current password is incorrect" });
        }

        // Validate new password
        if (newPassword.length < 6) {
            return res.status(400).json({ error: "New password must be at least 6 characters long" });
        }

        // Hash new password
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(newPassword, salt);
        await user.save();

        res.json({ msg: "Password updated successfully" });
    } catch (err) {
        console.error('Error changing password:', err);
        res.status(500).json({ error: err.message });
    }
};

// ✅ Register New Student
exports.registerUser = async (req, res) => {
    try {
        console.log('Registration request received:', req.body);
        
        const {
            userType,
            name,
            dob,
            gender,
            email,
            phone,
            address,
            classAssigned,
            specialization,
            emergencyContactName,
            emergencyContactPhone,
            emergencyContactRelationship,
            bloodGroup,
            allergies,
            medicalConditions,
            medications
        } = req.body;

        // Validate required fields
        if (!name || !email || !phone || !userType) {
            return res.status(400).json({
                error: 'Missing required fields',
                details: 'Please provide: name, email, phone, and userType'
            });
        }

        // Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({
                error: 'User already exists',
                details: 'A user with this email already exists'
            });
        }

        // Log the incoming request data
        console.log('Registration request data:', {
            name,
            email,
            userType,
            classAssigned,
            profile: {
                dob,
                gender,
                // other profile fields
            }
        });

        // Log the incoming request data for debugging
        console.log('Registration request data:', {
            name,
            email,
            userType,
            classAssigned,
            profile: {
                dob,
                gender,
                // other profile fields
            }
        });

        // Ensure class is set for students
        if (userType.toLowerCase() === 'student' && !classAssigned) {
            console.warn('No class assigned for student registration!');
            return res.status(400).json({ 
                success: false, 
                message: 'Class is required for student registration' 
            });
        }

        // Create user object
        const user = new User({
            name,
            email,
            password: phone, // Using phone as password (will be hashed)
            role: userType.toLowerCase() === 'teacher' ? 'teacher' : 'student',
            ...(classAssigned && { 
                class: classAssigned,  // Save at root level
                classAssigned: classAssigned  // Also save as classAssigned for backward compatibility
            }),
            profile: {
                ...(classAssigned && { class: classAssigned }),  // Also save in profile
                dob,
                gender,
                ...(address && { address }),
                ...(specialization && { specialization }),
                emergencyContact: {
                    name: emergencyContactName,
                    phone: emergencyContactPhone,
                    relationship: emergencyContactRelationship
                },
                health: {
                    bloodGroup,
                    allergies,
                    medicalConditions,
                    medications
                }
            }
        });

        // Hash password before saving
        user.password = await bcrypt.hash(user.password, 10);
        
        // Save user
        const savedUser = await user.save();
        
        // Log the saved user data
        const savedUserPlain = savedUser.toObject();
        console.log('Saved user document:', JSON.stringify(savedUserPlain, null, 2));
        
        // Create response
        const response = { 
            msg: `${userType} registered successfully!`, 
            user: savedUserPlain
        };
        
        console.log('Registration successful. User data:', {
            id: savedUser._id,
            class: savedUser.class,
            classAssigned: savedUser.classAssigned,
            profileClass: savedUser.profile?.class
        });
        
        // Log successful registration
        console.log(`Successfully registered ${userType}:`, response);
        
        res.json(response);
    } catch (err) {
        console.error('User registration error:', err);
        
        // Handle specific errors
        if (err.code === 11000) { // Duplicate key error
            return res.status(400).json({ 
                error: 'Duplicate entry',
                details: 'A user with this email already exists'
            });
        }

        res.status(500).json({ 
            error: 'Failed to register user',
            details: err.message 
        });
    }
};

// ✅ Register New Student
exports.registerStudent = async (req, res) => {
    try {
        const { 
            name, 
            email, 
            password, 
            role,
            studentName,
            studentDob,
            studentGender,
            parentName,
            parentEmail,
        } = req.body;

        // Validate required fields
        if (!name || !email || !password || !role) {
            return res.status(400).json({ msg: "Please include all fields" });
        }

        // Check if user exists
        const user = await User.findOne({ email });
        if (user) {
            return res.status(400).json({ msg: "User already exists" });
        }

        // Create new user
        const newUser = new User({
            name,
            email,
            password,
            role,
            profile: {
                dob: studentDob,
                gender: studentGender,
                parent: {
                    name: parentName,
                    email: parentEmail,
                }
            }
        });

        // Hash password
        const salt = await bcrypt.genSalt(10);
        newUser.password = await bcrypt.hash(password, salt);

        // Save user
        await newUser.save();

        // Send success response
        res.status(201).json({
            msg: "User registered successfully",
            user: {
                id: newUser._id,
                name: newUser.name,
                email: newUser.email,
                role: newUser.role
            }
        });
    } catch (err) {
        console.error('Error in registerStudent:', err);
        res.status(500).json({ error: err.message });
    }
};
