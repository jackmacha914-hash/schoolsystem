#!/bin/bash
# Exit on error
set -e

# Install root dependencies
echo "Installing root dependencies..."
npm install

# Go to backend directory
echo "Installing backend dependencies..."
cd backend

# Remove node_modules if it exists
rm -rf node_modules

# Install backend dependencies with specific MIME version
echo "Installing specific MIME version..."
npm install mime@2.6.0 --save

# Install other dependencies
echo "Installing other dependencies..."
npm install --production=false

# Go back to root
cd ..

echo "Build completed successfully!"
