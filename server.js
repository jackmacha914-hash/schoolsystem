// This is the main entry point for Render
// It simply imports and runs the backend server

// Set the port for the application
const PORT = process.env.PORT || 5000;

// Import the main server file from the backend directory
const server = require('./backend/server');

// Start the server
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
