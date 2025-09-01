/**
 * Async middleware wrapper that handles errors in async route handlers
 * @param {Function} fn - The async route handler function
 * @returns {Function} A middleware function that handles async/await errors
 */
const asyncHandler = (fn) => (req, res, next) => {
    // Wrap the async function in a promise chain to catch any errors
    // and pass them to Express's error handling middleware
    Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = asyncHandler;
