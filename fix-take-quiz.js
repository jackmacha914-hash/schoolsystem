const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'frontend', 'js', 'take-quiz.js');

// Read the file content
let content = fs.readFileSync(filePath, 'utf8');

// Fix the DOMContentLoaded event listener
content = content.replace(
    /^\/\/ Wait for the DOM to be fully loadeddocument\.addEventListener\('DOMContentLoaded', \/\/ Navigation function - defined in the outer scope to avoid declaration\s+let navigateToQuestion;\s+function\(\)/,
    '// Wait for the DOM to be fully loaded\ndocument.addEventListener(\'DOMContentLoaded\', function() {'
);

// Ensure we have proper variable declarations at the top
const header = `// Wait for the DOM to be fully loaded

// Track answered questions - defined in the outer scope to avoid redeclaration
const answeredQuestions = new Set();

// Navigation function - defined in the outer scope to avoid redeclaration
let navigateToQuestion;

document.addEventListener('DOMContentLoaded', function() {
`;

// Find the start of the main function body
const mainFunctionStart = content.indexOf('// DOM Elements');
if (mainFunctionStart !== -1) {
    // Remove any existing declarations before the main function body
    content = header + content.substring(mainFunctionStart);
}

// Remove any duplicate declarations inside the function
const duplicatePatterns = [
    /\b(const|let|var)\s+answeredQuestions\s*=/g,
    /\b(const|let|var)\s+navigateToQuestion\s*=/g,
    /function\s+navigateToQuestion\s*\(/g
];

duplicatePatterns.forEach(pattern => {
    content = content.replace(pattern, match => {
        // Replace all but the first occurrence with just the variable/function name
        if (match.includes('function')) {
            return 'navigateToQuestion = function(';
        }
        return match.startsWith('const') || match.startsWith('let') || match.startsWith('var') 
            ? '// ' + match // Comment out the declaration
            : match;
    });
});

// Write the fixed content back to the file
fs.writeFileSync(filePath, content, 'utf8');
console.log('Successfully fixed take-quiz.js');
