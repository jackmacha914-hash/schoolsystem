/**
 * Custom error response class that extends the native Error object
 * @extends Error
 */
class ErrorResponse extends Error {
    /**
     * Create a new ErrorResponse
     * @param {string} message - Error message
     * @param {number} statusCode - HTTP status code
     * @param {Array} [errors] - Optional array of validation errors
     */
    constructor(message, statusCode, errors = []) {
        super(message);
        this.statusCode = statusCode;
        this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
        this.errors = errors;
        this.isOperational = true;

        // Capture the stack trace, excluding the constructor call from it
        Error.captureStackTrace(this, this.constructor);
    }
}

module.exports = ErrorResponse;
