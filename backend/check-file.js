const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'uploads', 'profile-photos', 'profile-1747864287897-920630716.png');

console.log('Checking file:', filePath);

// Check if file exists
fs.access(filePath, fs.constants.F_OK, (err) => {
    if (err) {
        console.error('File does not exist or cannot be accessed:', err);
        return;
    }
    console.log('File exists');
    
    // Check read permission
    fs.access(filePath, fs.constants.R_OK, (err) => {
        if (err) {
            console.error('File cannot be read:', err);
            return;
        }
        console.log('File is readable');
    });
});

// Get file stats
fs.stat(filePath, (err, stats) => {
    if (err) {
        console.error('Error getting file stats:', err);
        return;
    }
    console.log('File stats:', stats);
});
