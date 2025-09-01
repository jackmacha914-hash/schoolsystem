// Custom module loader to fix MIME module issues
const Module = require('module');
const path = require('path');
const fs = require('fs');

// Store the original require
const originalRequire = Module.prototype.require;

// Override require
Module.prototype.require = function(modulePath) {
  // If this is the MIME module being required
  if (modulePath === 'mime' || modulePath.endsWith('/mime')) {
    // Create a custom MIME implementation
    const mime = {
      getType: (path) => 'application/octet-stream',
      getExtension: (type) => '',
      define: () => {},
      Mime: class Mime {
        constructor() {
          this.getType = () => 'application/octet-stream';
          this.getExtension = () => '';
        }
      }
    };
    
    // Create a proxy to handle property access
    return new Proxy(mime, {
      get: (target, prop) => {
        if (prop in target) {
          return target[prop];
        }
        return 'application/octet-stream';
      }
    });
  }
  
  // For all other modules, use the original require
  return originalRequire.apply(this, [modulePath]);
};

// Now load the server
require('./server-prod');
