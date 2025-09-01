const jwt = require('jsonwebtoken');
const User = require('../models/User');
require('dotenv').config();

// Middleware to authenticate users
const authenticateUser = async (req, res, next) => {
    const authHeader = req.headers.authorization;
    console.log("User info from token:", req.user);

    
    console.log("🔐 Incoming Authorization Header:", authHeader);

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ msg: "No token, authorization denied" });
    }

    const token = authHeader.split(' ')[1]; // Extract token

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        console.log("✅ Token Decoded:", decoded);

        req.user = await User.findById(decoded.id).select("-password"); 

        if (!req.user) {
            return res.status(401).json({ msg: "User not found" });
        }
        console.log("🙋‍♂️ Authenticated user:", req.user.email);

        next();
    } catch (err) {
        if (err.name === 'TokenExpiredError') {
            console.error("Token expired:", err);
            return res.status(401).json({ 
                msg: "Token expired",
                error: "Your session has expired. Please login again."
            });
        }
        console.error("Token verification failed:", err);
        return res.status(401).json({ msg: "Invalid token" });
    }
};

// Middleware to authorize roles
const authorizeRoles = (...roles) => {
    // Flatten the roles array in case it's nested (happens when passing an array directly)
    const flattenedRoles = roles.flat();
    
    // Ensure all incoming roles are strings and lowercase
    const allowedRoles = flattenedRoles.map(role => {
        if (typeof role !== 'string') {
            console.warn(`Non-string role detected:`, role);
            return String(role).toLowerCase();
        }
        return role.toLowerCase();
    });

    return (req, res, next) => {
        if (!req.user || !req.user.role) {
            return res.status(403).json({ msg: "Access Denied: No role found for user" });
        }

        const userRole = String(req.user.role).toLowerCase();
        console.log("User Role:", userRole);
        console.log("Allowed Roles:", allowedRoles);

        if (!allowedRoles.includes(userRole)) {
            return res.status(403).json({ 
                msg: `Access Denied: You don't have permission to access this resource`,
                requiredRoles: allowedRoles,
                userRole: userRole
            });
        }

        next();
    };
};

module.exports = { authenticateUser, authorizeRoles };
