// Production server entry point
const path = require('path');
const fs = require('fs');

// Patch MIME module before anything else loads it
const mimePath = path.dirname(require.resolve('mime'));
const mimeIndexPath = path.join(mimePath, 'index.js');

// Ensure the MIME module is patched
if (!fs.existsSync(path.join(mimePath, 'index.js.bak'))) {
  const patchedContent = `// Patched MIME module
const Mime = require('./Mime');
module.exports = new Mime(require('./types/standard'), require('./types/other'));
`;
  fs.writeFileSync(mimeIndexPath, patchedContent, 'utf8');
  console.log('MIME module patched at runtime');
}

// Now require the actual server
const server = require('./backend/server');

// Start the server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`Node.js version: ${process.version}`);
});
