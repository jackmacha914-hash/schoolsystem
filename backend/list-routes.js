const app = require('./app');

console.log('=== Registered Routes ===');
function printRoutes(stack, parentPath = '') {
  stack.forEach(layer => {
    if (layer.route) {
      console.log(
        Object.keys(layer.route.methods).join(',').toUpperCase().padEnd(7),
        (parentPath + layer.route.path).replace(/\/\//g, '/')
      );
    } else if (layer.name === 'router' && layer.handle.stack) {
      const path = layer.regexp.toString()
        .replace('/^\\', '') // Remove leading ^\
        .replace('\\/?', '') // Remove optional / and ?
        .replace('(?=\\/|$)', '') // Remove lookahead
        .replace(/\/$/, ''); // Remove trailing /
      
      printRoutes(layer.handle.stack, parentPath + '/' + path);
    }
  });
}

printRoutes(app._router.stack);
process.exit(0);
