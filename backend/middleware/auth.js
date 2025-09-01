const jwt = require('jsonwebtoken');
const config = require('config');

/**
 * Middleware to verify JWT token
 */
const protect = (req, res, next) => {
  // Skip authentication for preflight requests
  if (req.method === 'OPTIONS') {
    return next();
  }

  console.log('Auth middleware - Headers:', req.headers);
  
  // Get token from header (support both x-auth-token and Authorization: Bearer <token>)
  let token = req.header('x-auth-token');
  
  // If token is not in x-auth-token, check Authorization header
  if (!token && req.header('Authorization')) {
    const authHeader = req.header('Authorization');
    if (authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    } else {
      token = authHeader; // In case the token is sent without 'Bearer' prefix
    }
  }

  // Check if no token
  if (!token) {
    console.error('No token provided in request');
    return res.status(401).json({ 
      success: false, 
      msg: 'No token, authorization denied',
      headers: Object.keys(req.headers)
    });
  }

  // Verify token
  try {
    console.log('Verifying token:', token.substring(0, 30) + '...');
    
    // Log the JWT secret being used (first 5 chars for security)
    const jwtSecret = process.env.JWT_SECRET || config.get('jwtSecret');
    console.log('[AUTH] Using JWT secret:', jwtSecret ? `${jwtSecret.substring(0, 5)}...` : 'NOT SET');
    
    if (!jwtSecret) {
      console.error('[AUTH ERROR] JWT_SECRET is not set');
      return res.status(500).json({ 
        success: false, 
        message: 'Server configuration error' 
      });
    }
    
    const decoded = jwt.verify(token, jwtSecret);
    console.log('[AUTH] Decoded token:', JSON.stringify(decoded, null, 2));
    
    if (!decoded) {
      console.error('[AUTH ERROR] Token could not be decoded');
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid token' 
      });
    }
    
    // Handle different token formats
    if (decoded.user) {
      // Format: { user: { id, role } }
      req.user = {
        userId: decoded.user.id || decoded.user._id,
        role: decoded.user.role,
        ...decoded.user
      };
    } else if (decoded.id && decoded.role) {
      // Format: { id, role }
      req.user = { 
        userId: decoded.id,
        role: decoded.role,
        ...decoded 
      };
    } else if (decoded.userId) {
      // Another possible format: { userId, role }
      req.user = { 
        userId: decoded.userId, 
        role: decoded.role,
        ...decoded 
      };
    } else {
      console.error('Invalid token format:', decoded);
      throw new Error('Invalid token format: missing required fields');
    }
    
    console.log('Authenticated user:', req.user);
    next();
  } catch (err) {
    console.error('[AUTH ERROR] Token verification failed:', {
      message: err.message,
      name: err.name,
      expiredAt: err.expiredAt,
      stack: err.stack
    });
    
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        success: false, 
        message: 'Token has expired. Please log in again.'
      });
    }
    
    if (err.name === 'JsonWebTokenError') {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid token. Please log in again.'
      });
    }
    
    // For other types of errors
    return res.status(401).json({ 
      success: false, 
      message: 'Authentication failed',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
};

/**
 * Middleware to authorize based on user roles
 * @param {...string} roles - Roles that are allowed to access the route
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    console.log('Authorization check - User:', req.user);
    console.log('Required roles:', roles);
    
    if (!req.user) {
      console.error('No user in request');
      return res.status(401).json({ 
        success: false, 
        msg: 'Not authorized to access this route',
        debug: { hasUser: !!req.user }
      });
    }

    // Flatten the roles array in case it's nested
    const allowedRoles = Array.isArray(roles[0]) ? roles[0] : roles;
    
    // Convert to lowercase for case-insensitive comparison
    const userRole = String(req.user.role || '').toLowerCase().trim();
    const normalizedAllowedRoles = allowedRoles.map(role => 
      String(role || '').toLowerCase().trim()
    ).filter(Boolean);
    
    console.log('Checking authorization:', {
      userRole,
      allowedRoles: normalizedAllowedRoles,
      hasAccess: normalizedAllowedRoles.includes(userRole)
    });
    
    if (!normalizedAllowedRoles.includes(userRole)) {
      console.error('Access denied:', {
        userRole,
        allowedRoles: normalizedAllowedRoles,
        userId: req.user.userId
      });
      
      return res.status(403).json({ 
        success: false,
        msg: `User role '${req.user.role}' is not authorized to access this route`,
        requiredRoles: allowedRoles,
        userRole: req.user.role,
        debug: process.env.NODE_ENV === 'development' ? {
          userRole,
          allowedRoles: normalizedAllowedRoles
        } : undefined
      });
    }

    console.log('Access granted to role:', userRole);
    next();
  };
};

module.exports = {
  protect,
  authorize
};
