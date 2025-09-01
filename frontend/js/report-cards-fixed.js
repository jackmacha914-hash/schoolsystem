// Global variables
let isClearingMarks = false;
const API_BASE_URL = 'http://localhost:5000';

// Report Cards functionality for teacher dashboard
document.addEventListener('DOMContentLoaded', function() {
    // Event listener for marks clearing
    document.addEventListener('marksCleared', function() {
        console.log('Received marks cleared event');
        // Clear any marks data that might be in localStorage
        const marksKeys = Object.keys(localStorage)
            .filter(key => key.startsWith('marks-'))
            .forEach(key => localStorage.removeItem(key));
        
        // Clear the marks entry form
        const marksEntry = document.getElementById('marks-entry');
        if (marksEntry) {
            marksEntry.innerHTML = '';
        }
    });

    // Initialize marks entry system
    initializeMarksEntrySystem();

    // Initialize report card section
    function initializeReportCardSection() {
        try {
            console.log('Initializing report card section');
            
            // Get DOM elements
            const reportStudentSelect = document.getElementById('report-student');
            const reportTermSelect = document.getElementById('report-term');
            const generateReportCardBtn = document.getElementById('generate-report-card');
            
            if (!reportStudentSelect || !reportTermSelect || !generateReportCardBtn) {
                console.error('Report card elements not found');
                return;
            }

            // Add event listener for report card generation
            generateReportCardBtn.addEventListener('click', previewReportCard);

            console.log('Report card section initialized successfully');
        } catch (error) {
            console.error('Error initializing report card section:', error);
            showAlert('Failed to initialize report card section. Please refresh the page.');
        }
    }
    
    initializeReportCardSection();

    // Function to preview the report card
    async function previewReportCard() {
        try {
            console.log('Generating report card...');
            
            // Get selected values
            const studentSelect = document.getElementById('report-student');
            const termSelect = document.getElementById('report-term');
            const studentId = studentSelect ? studentSelect.value : '';
            const term = termSelect ? termSelect.value : '';

            console.log('Selected student:', studentId, 'Term:', term);

            // Validate selections
            if (!studentId) {
                showAlert('Please select a student', 'error');
                return;
            }
            if (!term) {
                showAlert('Please select a term', 'error');
                return;
            }

            // Show loading state
            const generateBtn = document.getElementById('generate-report-card');
            const originalBtnText = generateBtn.innerHTML;
            generateBtn.disabled = true;
            generateBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Generating...';
            
            try {
                // Try to load from localStorage first
                const marksKey = `marks-${studentId}-${term}`;
                let marksData = localStorage.getItem(marksKey);
                
                if (marksData) {
                    // Parse the marks data
                    marksData = JSON.parse(marksData);
                    console.log('Loaded marks from localStorage:', marksData);
                    
                    // Update the report card preview
                    if (typeof updateReportCardPreview === 'function') {
                        updateReportCardPreview(marksData);
                        showAlert('Report card generated successfully', 'success');
                    } else {
                        throw new Error('Update report card function not found');
                    }
                } else {
                    // If not in localStorage, try to fetch from API
                    console.log('No marks found in localStorage, trying to fetch from API...');
                    const token = localStorage.getItem('token');
                    if (token) {
                        const response = await fetch(`${API_BASE_URL}/api/marks/student/${studentId}/${term}`, {
                            method: 'GET',
                            headers: {
                                'Authorization': `Bearer ${token}`,
                                'Content-Type': 'application/json'
                            }
                        });

                        if (response.ok) {
                            const data = await response.json();
                            if (data.success && data.marks) {
                                // Save to localStorage for future use
                                localStorage.setItem(marksKey, JSON.stringify(data.marks));
                                console.log('Loaded marks from API:', data.marks);
                                
                                // Update the report card preview
                                if (typeof updateReportCardPreview === 'function') {
                                    updateReportCardPreview(data.marks);
                                    showAlert('Report card generated successfully', 'success');
                                } else {
                                    throw new Error('Update report card function not found');
                                }
                            } else {
                                throw new Error(data.message || 'Failed to load marks');
                            }
                        } else {
                            const error = await response.json().catch(() => ({}));
                            throw new Error(error.message || 'Failed to fetch marks');
                        }
                    } else {
                        throw new Error('Not authenticated');
                    }
                }
            } catch (error) {
                console.error('Error loading marks:', error);
                showAlert(`Failed to load marks: ${error.message || 'Please try again later'}`, 'error');
            } finally {
                // Restore button state
                if (generateBtn) {
                    generateBtn.disabled = false;
                    generateBtn.innerHTML = originalBtnText;
                }
            }
        } catch (error) {
            console.error('Error in previewReportCard:', error);
            showAlert('An error occurred while generating the report card', 'error');
        }
    }

    // Function to update the report card preview with marks data
    function updateReportCardPreview(marksData) {
        try {
            console.log('Updating report card preview with data:', marksData);
            
            // Get the student name from the select element
            const studentSelect = document.getElementById('report-student');
            const studentName = studentSelect ? studentSelect.options[studentSelect.selectedIndex].text : 'Student';
            
            // Update student name in the preview
            const studentNameElement = document.getElementById('student-name');
            if (studentNameElement) {
                studentNameElement.textContent = studentName;
            }
            
            // Update term in the preview
            const termSelect = document.getElementById('report-term');
            const term = termSelect ? termSelect.value : '';
            const termElement = document.getElementById('report-term-display');
            if (termElement && term) {
                termElement.textContent = term.charAt(0).toUpperCase() + term.slice(1) + ' Term';
            }
            
            // Update the marks table
            const marksTableBody = document.getElementById('marks-table-body');
            if (marksTableBody) {
                // Clear existing rows
                marksTableBody.innerHTML = '';
                
                // Add a row for each subject
                let totalMarks = 0;
                let subjectCount = 0;
                
                for (const [subject, data] of Object.entries(marksData.subjects || {})) {
                    const row = document.createElement('tr');
                    const marks = data.marks || 0;
                    const grade = calculateGradeFromMarks(marks);
                    const remarks = getGradeRemarks(grade);
                    
                    row.innerHTML = `
                        <td>${subject}</td>
                        <td>${marks}</td>
                        <td>${grade}</td>
                        <td>${remarks}</td>
                    `;
                    
                    marksTableBody.appendChild(row);
                    
                    // Update totals
                    if (!isNaN(marks)) {
                        totalMarks += parseFloat(marks);
                        subjectCount++;
                    }
                }
                
                // Calculate and display average
                const averageMarks = subjectCount > 0 ? (totalMarks / subjectCount).toFixed(2) : 0;
                const averageGrade = calculateGradeFromMarks(averageMarks);
                const averageRemarks = getGradeRemarks(averageGrade);
                
                // Add average row
                const averageRow = document.createElement('tr');
                averageRow.className = 'table-active fw-bold';
                averageRow.innerHTML = `
                    <td>Average</td>
                    <td>${averageMarks}</td>
                    <td>${averageGrade}</td>
                    <td>${averageRemarks}</td>
                `;
                marksTableBody.appendChild(averageRow);
                
                // Update teacher's remarks if available
                const teacherRemarksElement = document.getElementById('teacher-remarks');
                if (teacherRemarksElement && marksData.remarks) {
                    teacherRemarksElement.textContent = marksData.remarks;
                }
                
                // Show the report card container
                const reportCardContainer = document.getElementById('report-card-container');
                if (reportCardContainer) {
                    reportCardContainer.style.display = 'block';
                }
                
                // Show the action buttons
                const downloadPdfBtn = document.getElementById('download-pdf');
                const sendToStudentBtn = document.getElementById('send-to-student');
                if (downloadPdfBtn) downloadPdfBtn.style.display = 'inline-block';
                if (sendToStudentBtn) sendToStudentBtn.style.display = 'inline-block';
            }
            
            console.log('Report card preview updated successfully');
            return true;
            
        } catch (error) {
            console.error('Error updating report card preview:', error);
            showAlert('Failed to update report card preview', 'error');
            return false;
        }
    }
    
    // Helper function to calculate grade from marks
    function calculateGradeFromMarks(marks) {
        const numericMarks = parseFloat(marks) || 0;
        if (numericMarks >= 75) return 'A';
        if (numericMarks >= 65) return 'B';
        if (numericMarks >= 50) return 'C';
        if (numericMarks >= 40) return 'D';
        return 'F';
    }
    
    // Helper function to get grade remarks
    function getGradeRemarks(grade) {
        const remarks = {
            'A': 'Excellent',
            'B': 'Very Good',
            'C': 'Good',
            'D': 'Pass',
            'F': 'Fail'
        };
        return remarks[grade] || '';
    }

    // Function to show alert messages
    function showAlert(message, type = 'info') {
        const existingAlert = document.querySelector('.report-card-alert');
        if (existingAlert) existingAlert.remove();
        
        const alertDiv = document.createElement('div');
        alertDiv.className = `alert alert-${type} report-card-alert`;
        alertDiv.style.position = 'fixed';
        alertDiv.style.top = '20px';
        alertDiv.style.right = '20px';
        alertDiv.style.zIndex = '9999';
        alertDiv.style.minWidth = '300px';
        alertDiv.style.boxShadow = '0 2px 10px rgba(0,0,0,0.1)';
        
        alertDiv.innerHTML = `
            <div class="d-flex justify-content-between align-items-center">
                <span>${message}</span>
                <button type="button" class="btn-close" aria-label="Close"></button>
            </div>
        `;
        
        // Add to document
        document.body.appendChild(alertDiv);
        
        // Auto-remove after 5 seconds
        setTimeout(() => {
            if (alertDiv.parentNode) {
                alertDiv.style.opacity = '0';
                alertDiv.style.transition = 'opacity 0.5s';
                setTimeout(() => {
                    if (alertDiv.parentNode) {
                        alertDiv.remove();
                    }
                }, 500);
            }
        }, 5000);
        
        // Add close button functionality
        const closeBtn = alertDiv.querySelector('.btn-close');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                if (alertDiv.parentNode) {
                    alertDiv.remove();
                }
            });
        }
    }
}); // Close the DOMContentLoaded event listener
