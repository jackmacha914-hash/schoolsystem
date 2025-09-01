const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'frontend', 'js', 'take-quiz.js');

// Read the file content
let content = fs.readFileSync(filePath, 'utf8');

// Remove all const/let/var declarations of navigateToQuestion
content = content.replace(/(const|let|var)\s+navigateToQuestion\s*=/g, 'navigateToQuestion =');

// Remove all function declarations of navigateToQuestion
content = content.replace(/function\s+navigateToQuestion\s*\([^)]*\)\s*{/g, 'navigateToQuestion = function(');

// Add the main declaration at the top
const mainDeclaration = '// Navigation function - defined in the outer scope to avoid redeclaration\n    let navigateToQuestion;';

// Find the first occurrence of the answeredQuestions declaration and add after it
const answeredDeclaration = '// Track answered questions - defined in the outer scope to avoid redeclaration';
const answeredPattern = new RegExp(answeredDeclaration + '[\s\S]*?const answeredQuestions = new Set\(\);');

if (answeredPattern.test(content)) {
    content = content.replace(answeredPattern, match => {
        return match + '\n    ' + mainDeclaration;
    });
} else {
    // If we can't find the answeredQuestions declaration, add our declaration near the top
    const firstFunction = content.indexOf('function');
    content = content.slice(0, firstFunction) + 
              '// Navigation function - defined in the outer scope to avoid redeclaration\nlet navigateToQuestion;\n\n' + 
              content.slice(firstFunction);
}

// Write the fixed content back to the file
fs.writeFileSync(filePath, content, 'utf8');
console.log('Fixed navigateToQuestion declarations in take-quiz.js');
