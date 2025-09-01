const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { check, validationResult } = require('express-validator');
const User = require('../models/User');
require('dotenv').config();

// User Registration with Validation
exports.registerUser = [
    check("name").notEmpty().withMessage("Name is required"),
    check("email").isEmail().withMessage("Invalid email"),
    check("password").isLength({ min: 6 }).withMessage("Password must be at least 6 characters"),
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        console.log('Registration request body:', JSON.stringify(req.body, null, 2));
        
        const { name, email, password, role = "student", profile = {} } = req.body;
        
        try {
            // Check if user already exists
            let user = await User.findOne({ email });
            if (user) {
                return res.status(400).json({ 
                    success: false,
                    message: "User with this email already exists"
                });
            }

            // Validate class for students
            if (role === 'student' && !req.body.class) {
                return res.status(400).json({ 
                    success: false,
                    message: "Class is required for student registration"
                });
            }

            // Hash password
            const hashedPassword = await bcrypt.hash(password, 10);
            
            // Prepare user data
            const userData = { 
                name, 
                email, 
                password: hashedPassword, 
                role,
                profile: { ...profile }
            };
            
            // Handle class assignment
            if (req.body.class) {
                const classValue = req.body.class.trim();
                console.log('Processing class:', classValue);
                
                // Validate class format
                if (!/^(Grade\s\d{1,2}|Form\s[1-4]|PP[12])$/i.test(classValue)) {
                    return res.status(400).json({
                        success: false,
                        message: "Invalid class format. Please use format 'Grade X' or 'Form X'"
                    });
                }
                
                // Standardize class format (e.g., 'grade 1' -> 'Grade 1')
                const formattedClass = classValue
                    .toLowerCase()
                    .split(' ')
                    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                    .join(' ');
                
                userData.class = formattedClass;
                userData.classAssigned = formattedClass;
                userData.profile = userData.profile || {};
                userData.profile.class = formattedClass;
                
                console.log('Formatted class:', formattedClass);
            }
            
            console.log('Creating user with data:', JSON.stringify({
                name,
                email,
                role,
                class: userData.class,
                profileClass: userData.profile?.class
            }, null, 2));
            
            // Create and save user
            const newUser = new User(userData);
            await newUser.save();

            // Generate JWT token
            const payload = { 
                id: newUser.id, 
                role: newUser.role,
                class: newUser.class
            };
            
            const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: "24h" });

            res.status(201).json({ 
                success: true,
                message: "User registered successfully", 
                token, 
                role: newUser.role,
                class: newUser.class
            });
        } catch (err) {
            console.error(err);
            res.status(500).json({ msg: "Server error" });
        }
    }
];

// User Login
exports.loginUser = async (req, res) => {
    const { email, password } = req.body;
    try {
        let user = await User.findOne({ email });
        if (!user) {
            return res.status(401).json({ msg: "Invalid email or password" });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ msg: "Invalid email or password" });
        }

        if (!process.env.JWT_SECRET) {
            return res.status(500).json({ msg: "JWT Secret is missing" });
        }

        const payload =  { id: user.id, role: user.role }; // Ensure consistent payload
        const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: "1h" });

        res.json({ msg: "Login successful", token, role: user.role }); // Include role in response
    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: "Server error" });
    }
};

// Get User Profile
exports.getUserProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select("-password");
        if (!user) {
            return res.status(404).json({ msg: "User not found" });
        }
        res.json(user);
    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: "Server error" });
    }
};
