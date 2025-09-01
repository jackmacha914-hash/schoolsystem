const fs = require('fs').promises;
const path = require('path');
const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);

/**
 * Generate a PDF from HTML content using wkhtmltopdf
 * @param {string} html - The HTML content to convert to PDF
 * @param {string} [outputPath] - Optional path where to save the generated PDF
 * @returns {Promise<Buffer>} The generated PDF as a buffer
 */
const generatePdfFromHtml = async (html, outputPath) => {
    console.log('Generating PDF from HTML content...');
    
    try {
        // Create a temporary HTML file
        const tempHtmlPath = path.join(__dirname, '../temp', `report-${Date.now()}.html`);
        await fs.mkdir(path.dirname(tempHtmlPath), { recursive: true });
        await fs.writeFile(tempHtmlPath, html, 'utf8');
        
        // Generate a temporary output path if none provided
        const pdfOutputPath = outputPath || path.join(__dirname, '../temp', `report-${Date.now()}.pdf`);
        
        // Use wkhtmltopdf to convert HTML to PDF
        try {
            await execPromise(`wkhtmltopdf ${tempHtmlPath} ${pdfOutputPath}`);
            
            // Read the generated PDF
            const pdfBuffer = await fs.readFile(pdfOutputPath);
            
            // Clean up temporary files
            try {
                await fs.unlink(tempHtmlPath);
                if (!outputPath) {
                    await fs.unlink(pdfOutputPath);
                }
            } catch (cleanupError) {
                console.warn('Error cleaning up temporary files:', cleanupError);
            }
            
            return pdfBuffer;
            
        } catch (error) {
            console.error('Error executing wkhtmltopdf:', error);
            throw new Error('Failed to generate PDF. Make sure wkhtmltopdf is installed.');
        }
        
    } catch (error) {
        console.error('Error generating PDF:', error);
        throw new Error(`Failed to generate PDF: ${error.message}`);
    }
};

module.exports = {
    generatePdfFromHtml
};
