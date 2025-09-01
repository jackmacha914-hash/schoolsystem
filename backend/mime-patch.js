// Custom MIME module to fix the 'Mime is not a constructor' error
const path = require('path');
const fs = require('fs');

// Path to the original mime module
const mimePath = path.dirname(require.resolve('mime'));
const mimeIndexPath = path.join(mimePath, 'index.js');

// Create a backup of the original file
const backupPath = path.join(mimePath, 'index.js.bak');
if (!fs.existsSync(backupPath)) {
  fs.copyFileSync(mimeIndexPath, backupPath);
}

// Write the patched version
const patchedContent = `// Patched MIME module
const Mime = require('./Mime');
module.exports = new Mime(require('./types/standard'), require('./types/other'));
`;

fs.writeFileSync(mimeIndexPath, patchedContent, 'utf8');
console.log('MIME module patched successfully!');
