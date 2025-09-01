#!/bin/bash
# Exit on error
set -e

echo "=== Starting build process ==="

# Install root dependencies
echo "Installing root dependencies..."
npm install

# Go to backend directory
echo "=== Setting up backend ==="
cd backend

# Clean up any existing node_modules
echo "Cleaning up existing node_modules..."
rm -rf node_modules package-lock.json

# Install specific versions of problematic packages
echo "Installing specific package versions..."
npm install mime@2.6.0 --save-exact
npm install send@0.17.2 --save-exact

# Install all other dependencies
echo "Installing backend dependencies..."
npm install --production=false

# Go back to root
cd ..

echo "=== Build completed successfully! ==="
echo "Node.js version: $(node -v)"
echo "npm version: $(npm -v)"
