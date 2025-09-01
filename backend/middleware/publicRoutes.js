const bypassAuth = (req, res, next) => {
    // If the request is to one of our public routes, bypass authentication
    const publicPaths = [
        '/api/students',
        '/api/students/teachers'
    ];
    
    if (publicPaths.includes(req.path)) {
        return next();
    }
    next();
};

module.exports = bypassAuth;
