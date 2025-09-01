// This script patches the MIME module to fix the 'Mime is not a constructor' error
const fs = require('fs');
const path = require('path');

const mimePath = path.join('node_modules', 'mime', 'index.js');
const mimeContent = `
// Patched MIME module
const Mime = require('./Mime');
module.exports = new Mime(
  require('./types/standard'),
  require('./types/other')
);
`;

// Apply the patch
fs.writeFileSync(mimePath, mimeContent, 'utf8');
console.log('MIME module patched successfully!');
