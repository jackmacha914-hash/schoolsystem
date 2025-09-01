// API base URL
const API_BASE_URL = 'http://localhost:5000';

// Prevent multiple initializations
if (window.marksFixInitialized) {
    console.log('marks-fix.js already initialized');
} else {
    // Set flag to prevent multiple initializations
    window.marksFixInitialized = true;
    
    // Initialize the application when DOM is ready
    document.addEventListener('DOMContentLoaded', function() {
        console.log('Initializing marks-fix application...');
        
        // Don't initialize if report-cards.js is handling these elements
        if (document.getElementById('marks-class') && document.getElementById('marks-student')) {
            console.log('Report cards functionality is already initialized, skipping marks-fix initialization');
            return;
        }
        
        // Initialize the application
        initApp();
    });
}

// Global variables
let marksModal, classSelect, marksContainer, generateReportBtn, saveMarksBtn, 
    cancelMarksBtn, openMarksModalBtn, closeModalBtn, reportCardPreview, 
    printReportBtn, studentSelect;

// Initialize DOM elements
function initializeElements() {
    marksModal = document.getElementById('marks-modal');
    classSelect = document.getElementById('class-select');
    marksContainer = document.querySelector('#marks-container .marks-grid');
    generateReportBtn = document.getElementById('generate-report-btn');
    saveMarksBtn = document.getElementById('save-marks-btn');
    cancelMarksBtn = document.getElementById('cancel-marks-btn');
    openMarksModalBtn = document.getElementById('open-marks-modal');
    closeModalBtn = document.querySelector('.close-modal');
    reportCardPreview = document.getElementById('report-card-preview');
    printReportBtn = document.getElementById('print-report-btn');
    studentSelect = document.getElementById('student-select');
    
    console.log('DOM elements initialized:', {
        marksModal: !!marksModal,
        openMarksModalBtn: !!openMarksModalBtn,
        closeModalBtn: !!closeModalBtn,
        cancelMarksBtn: !!cancelMarksBtn
    });
}

// Open marks modal
function openMarksModal() {
    console.log('Opening marks modal...');
    console.log('Modal element:', marksModal);
    
    if (!marksModal) {
        console.error('Marks modal not found');
        return;
    }
    
    try {
        // Make sure the modal is visible
        marksModal.style.display = 'flex';
        marksModal.style.opacity = '1';
        marksModal.style.visibility = 'visible';
        document.body.style.overflow = 'hidden';
        
        // Force a reflow to ensure the display property is updated
        void marksModal.offsetWidth;
        
        // Add a class to handle the transition
        marksModal.classList.add('active');
        
        console.log('Modal display style:', window.getComputedStyle(marksModal).display);
        console.log('Modal visibility:', window.getComputedStyle(marksModal).visibility);
        
        // Load students when modal opens
        fetchStudents();
    } catch (error) {
        console.error('Error opening modal:', error);
    }
}

// Close marks modal
function closeMarksModal() {
    console.log('Closing marks modal...');
    
    if (!marksModal) {
        console.error('Marks modal not found');
        return;
    }
    
    try {
        // Remove the active class first
        marksModal.classList.remove('active');
        
        // Wait for the transition to complete before hiding
        setTimeout(() => {
            marksModal.style.display = 'none';
            document.body.style.overflow = 'auto';
        }, 300);
    } catch (error) {
        console.error('Error closing modal:', error);
    }
}

// Fetch students from the backend
async function fetchStudents() {
    try {
        console.log('Fetching students from:', `${API_BASE_URL}/api/students`);
        
        // Show loading state
        if (studentSelect) {
            studentSelect.disabled = true;
            studentSelect.innerHTML = '<option value="">Loading students...</option>';
        }
        
        const response = await fetch(`${API_BASE_URL}/api/students`);
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('Error response:', errorText);
            throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
        }
        
        const data = await response.json();
        console.log('Fetched students:', data);
        
        if (!Array.isArray(data)) {
            console.warn('Expected array of students but got:', data);
            // Try to handle if the response is an object with a students property
            const students = data.students || data.data || [];
            updateStudentDropdown(students);
        } else {
            updateStudentDropdown(data);
        }
    } catch (error) {
        console.error('Error fetching students:', error);
        // Show detailed error to user
        if (studentSelect) {
            studentSelect.innerHTML = `<option value="">Error loading students</option>`;
        }
        alert(`Failed to load students: ${error.message}. Please check the console for details.`);
    } finally {
        if (studentSelect) {
            studentSelect.disabled = false;
        }
    }
}

// Update student dropdown
function updateStudentDropdown(students) {
    console.log('Updating student dropdown with:', students);
    
    if (!studentSelect) {
        console.error('Student select element not found');
        return;
    }
    
    try {
        // Clear existing options
        studentSelect.innerHTML = '';
        
        // Add default option
        const defaultOption = document.createElement('option');
        defaultOption.value = '';
        defaultOption.textContent = students.length === 0 ? 'No students found' : 'Select a student';
        defaultOption.disabled = true;
        defaultOption.selected = true;
        studentSelect.appendChild(defaultOption);
        
        if (!Array.isArray(students) || students.length === 0) {
            console.warn('No students data received or empty array');
            return;
        }
        
        // Add student options
        students.forEach((student, index) => {
            try {
                if (!student) {
                    console.warn('Skipping invalid student at index', index);
                    return;
                }
                
                const option = document.createElement('option');
                // Handle different possible ID fields
                option.value = student._id || student.id || `student-${index}`;
                
                // Handle different possible name fields and formats
                let displayName = 'Unknown Student';
                if (student.name) {
                    displayName = student.name;
                } else if (student.firstName || student.lastName) {
                    displayName = `${student.firstName || ''} ${student.lastName || ''}`.trim();
                } else if (student.username) {
                    displayName = student.username;
                }
                
                // Handle class/grade information
                const classInfo = student.class || student.grade || student.className || 'No Class';
                
                option.textContent = `${displayName} (${classInfo})`;
                studentSelect.appendChild(option);
                
                console.log('Added student option:', {
                    value: option.value,
                    text: option.textContent,
                    rawData: student
                });
                
            } catch (error) {
                console.error('Error processing student at index', index, ':', error);
            }
        });
        
        console.log('Student dropdown updated with', students.length, 'students');
        
    } catch (error) {
        console.error('Error updating student dropdown:', error);
        studentSelect.innerHTML = '<option value="">Error loading students</option>';
    }
}

// Sample subjects - in a real app, these would come from your backend
const SAMPLE_SUBJECTS = [
    'Mathematics', 'English', 'Kiswahili', 'Chemistry', 'Physics',
    'Biology', 'History', 'Geography', 'CRE', 'Business Studies',
    'Computer Studies', 'Agriculture', 'Home Science'
];

// Initialize the application
function initApp() {
    console.log('Initializing marks-fix application...');
    
    // Don't initialize if report-cards.js is handling these elements
    if (document.getElementById('marks-class') && document.getElementById('marks-student')) {
        console.log('Report cards functionality is already initialized, skipping marks-fix initialization');
        return;
    }
    
    try {
        // Initialize DOM elements
        initializeElements();
        
        // Set up event listeners
        if (openMarksModalBtn) {
            console.log('Adding click event to openMarksModalBtn');
            openMarksModalBtn.addEventListener('click', function(e) {
                console.log('Open marks modal button clicked');
                e.preventDefault();
                e.stopPropagation();
                openMarksModal();
            });
        } else {
            console.error('Open marks modal button not found');
        }
        
        // Close modal with close button
        if (closeModalBtn) {
            closeModalBtn.addEventListener('click', closeMarksModal);
        } else {
            console.warn('Close modal button not found');
        }
        
        // Close modal with cancel button
        if (cancelMarksBtn) {
            cancelMarksBtn.addEventListener('click', closeMarksModal);
        } else {
            console.warn('Cancel button not found');
        }
        
        // Handle student selection change
        if (studentSelect) {
            studentSelect.addEventListener('change', handleStudentSelect);
        }
        
        // Handle form submission
        const marksForm = document.getElementById('marks-entry-form');
        if (marksForm) {
            marksForm.addEventListener('submit', handleSubmitMarks);
        }
        
        // Close modal when clicking outside
        window.addEventListener('click', function(e) {
            if (marksModal && e.target === marksModal) {
                closeMarksModal();
            }
        });
        
        console.log('Application initialization complete');
    } catch (error) {
        console.error('Error initializing application:', error);
    }
}

// Handle student selection
function handleStudentSelect() {
    const studentId = this.value;
    if (!studentId) {
        clearSubjectInputs();
        return;
    }
    
    // Show loading state
    const subjectsContainer = document.getElementById('subjects-container');
    if (subjectsContainer) {
        subjectsContainer.innerHTML = `
            <div style="text-align: center; padding: 20px 0;">
                <div class="spinner" style="border: 4px solid #f3f3f3; border-top: 4px solid #3498db; border-radius: 50%; width: 30px; height: 30px; animation: spin 1s linear infinite; margin: 0 auto 10px;"></div>
                <p>Loading subjects...</p>
            </div>`;
    }
    
    // Simulate API call to get student's subjects
    // In a real app, you would fetch this from your backend
    setTimeout(() => {
        renderSubjectInputs(SAMPLE_SUBJECTS);
    }, 500);
}

// Clear subject inputs
function clearSubjectInputs() {
    const subjectsContainer = document.getElementById('subjects-container');
    if (subjectsContainer) {
        subjectsContainer.innerHTML = `
            <p class="no-subjects" style="text-align: center; color: #666; font-style: italic; padding: 20px 0;">
                Select a student to enter marks
            </p>`;
    }
}

// Render subject inputs
function renderSubjectInputs(subjects) {
    const subjectsContainer = document.getElementById('subjects-container');
    if (!subjectsContainer) return;
    
    if (!subjects || subjects.length === 0) {
        subjectsContainer.innerHTML = `
            <p class="no-subjects" style="text-align: center; color: #666; font-style: italic; padding: 20px 0;">
                No subjects found for this student
            </p>`;
        return;
    }
    
    let html = `
        <div style="display: grid; grid-template-columns: 2fr 1fr 1fr; gap: 10px; margin-bottom: 10px; font-weight: 500; border-bottom: 1px solid #eee; padding-bottom: 8px;">
            <div>Subject</div>
            <div>Score</div>
            <div>Grade</div>
        </div>`;
    
    subjects.forEach((subject, index) => {
        html += `
        <div style="display: grid; grid-template-columns: 2fr 1fr 1fr; gap: 10px; margin-bottom: 10px; align-items: center;">
            <div>${subject}</div>
            <div>
                <input type="number" min="0" max="100" step="0.01" 
                       name="subject-${index}" data-subject="${subject}" 
                       class="score-input" 
                       style="width: 100%; padding: 6px; border: 1px solid #ddd; border-radius: 4px;">
            </div>
            <div class="grade-display" style="font-weight: 500;">-</div>
        </div>`;
    });
    
    subjectsContainer.innerHTML = html;
    
    // Add event listeners to score inputs
    const scoreInputs = subjectsContainer.querySelectorAll('.score-input');
    scoreInputs.forEach(input => {
        input.addEventListener('input', updateGrade);
    });
}

// Update grade based on score
function updateGrade(e) {
    const score = parseFloat(e.target.value) || 0;
    const gradeDisplay = e.target.closest('div').nextElementSibling;
    
    let grade = '-';
    if (!isNaN(score)) {
        if (score >= 80) grade = 'A';
        else if (score >= 70) grade = 'A-';
        else if (score >= 65) grade = 'B+';
        else if (score >= 60) grade = 'B';
        else if (score >= 55) grade = 'B-';
        else if (score >= 50) grade = 'C+';
        else if (score >= 45) grade = 'C';
        else if (score >= 40) grade = 'C-';
        else if (score >= 35) grade = 'D+';
        else if (score >= 30) grade = 'D';
        else if (score > 0) grade = 'D-';
        else if (score === 0) grade = 'E';
    }
    
    gradeDisplay.textContent = grade;
}

// Handle form submission
async function handleSubmitMarks(e) {
    e.preventDefault();
    
    const studentId = studentSelect ? studentSelect.value : null;
    const studentName = studentSelect ? studentSelect.options[studentSelect.selectedIndex].text.split(' (')[0] : '';
    const term = document.getElementById('term-select') ? document.getElementById('term-select').value : '';
    const year = document.getElementById('academic-year') ? document.getElementById('academic-year').value : '';
    const comments = document.getElementById('teacher-comments') ? document.getElementById('teacher-comments').value : '';
    
    if (!studentId) {
        alert('Please select a student');
        return;
    }
    
    if (!term) {
        alert('Please select a term');
        return;
    }
    
    // Collect subject scores and calculate total score
    const scores = [];
    const scoreInputs = document.querySelectorAll('.score-input');
    let totalScore = 0;
    let subjectCount = 0;
    
    scoreInputs.forEach(input => {
        const subject = input.getAttribute('data-subject');
        const score = parseFloat(input.value) || 0;
        
        if (score > 0) {  // Only process subjects with valid scores > 0
            const grade = calculateGrade(score);
            scores.push({
                subject: subject,
                score: score,
                grade: grade
            });
            
            totalScore += score;
            subjectCount++;
        }
    });
    
    if (scores.length === 0) {
        alert('Please enter at least one subject score');
        return false;
    }
    
    // Calculate average score and overall grade
    const averageScore = subjectCount > 0 ? totalScore / subjectCount : 0;
    const overallGrade = calculateGrade(averageScore);
    
    // Get the first subject (assuming we're handling one subject at a time for now)
    const firstSubject = scores[0];
    
    // Prepare marks data for API submission
    const marksData = {
        student: studentSelect.value, // Changed from studentId to student
        studentName: studentSelect.options[studentSelect.selectedIndex].text.split(' (')[0],
        class: document.getElementById('class-select')?.value || 'Unknown', // Add class if available
        subject: firstSubject.subject, // Single subject instead of array
        score: firstSubject.score,     // Single score
        term: document.getElementById('term-select').value,
        academicYear: document.getElementById('academic-year').value, // Changed from year to academicYear
        comments: document.getElementById('teacher-comments').value || ''
        // Removed averageScore and overallGrade as they might be calculated on the server
    };
    
    console.log('Prepared marks data:', marksData);
    
    try {
        // Show loading state
        const saveButton = document.getElementById('save-marks-btn');
        const originalButtonText = saveButton.innerHTML;
        saveButton.disabled = true;
        saveButton.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Saving...';
        
        // Get authentication token and decode it to check user role
        const token = localStorage.getItem('token');
        if (!token) {
            throw new Error('No authentication token found. Please log in again.');
        }
        
        // Decode token to check user role
        try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            console.log('User role from token:', payload.role);
            console.log('Token payload:', payload);
        } catch (e) {
            console.error('Error decoding token:', e);
        }

        console.log('Submitting marks data:', marksData);

        // Make API call to save marks
        console.log('Making request to:', `${API_BASE_URL}/api/marks`);
        console.log('Using token:', token ? `${token.substring(0, 10)}...` : 'No token');

        const response = await fetch(`${API_BASE_URL}/api/marks`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify(marksData)
        });

        console.log('Response status:', response.status, response.statusText);

        if (response.status === 401) {
            // Token might be expired or invalid
            localStorage.removeItem('token');
            window.location.href = '/pages/login.html?session=expired';
            return;
        }

        if (!response.ok) {
            let errorMessage = `Server responded with ${response.status}: ${response.statusText}`;
            try {
                // First, get the response as text to handle both JSON and HTML responses
                const responseText = await response.text();
                console.error('Raw error response:', responseText);
                
                try {
                    // Try to parse as JSON
                    const errorData = JSON.parse(responseText);
                    console.error('Error details:', errorData);
                    errorMessage = errorData.message || errorMessage;
                } catch (jsonError) {
                    // If not JSON, use the raw text
                    console.error('Response is not JSON, using raw text');
                    errorMessage = responseText || errorMessage;
                }
            } catch (e) {
                console.error('Error processing error response:', e);
            }
            throw new Error(errorMessage);
        }

        const savedMarks = await response.json();
        
        // Generate and display the report card with the saved data
        generateReportCard({
            studentName: savedMarks.studentName || marksData.studentName,
            term: savedMarks.term || marksData.term,
            year: savedMarks.year || marksData.year,
            comments: savedMarks.comments || marksData.comments,
            subjects: savedMarks.subjects || marksData.subjects,
            averageScore: savedMarks.averageScore || marksData.averageScore,
            overallGrade: savedMarks.overallGrade || marksData.overallGrade,
            createdAt: savedMarks.createdAt || new Date().toISOString()
        });
        
        // Show success message and scroll to report card
        const successAlert = document.createElement('div');
        successAlert.className = 'alert alert-success';
        successAlert.style.margin = '10px 0';
        successAlert.style.padding = '10px 15px';
        successAlert.style.borderRadius = '4px';
        successAlert.innerHTML = 'Marks saved successfully! Scroll down to view the report card.';
        
        const modalBody = document.querySelector('#marks-modal .modal-body');
        if (modalBody) {
            modalBody.insertBefore(successAlert, modalBody.firstChild);
            
            // Auto-hide the alert after 5 seconds
            setTimeout(() => {
                successAlert.style.transition = 'opacity 0.5s';
                successAlert.style.opacity = '0';
                setTimeout(() => successAlert.remove(), 500);
            }, 5000);
        }
        
        // Close the modal after a short delay
        setTimeout(() => {
            const modal = bootstrap.Modal.getInstance(document.getElementById('marksEntryModal'));
            if (modal) modal.hide();
            
            // Scroll to the report card
            const reportCardPreview = document.getElementById('report-card-preview');
            if (reportCardPreview) {
                reportCardPreview.scrollIntoView({ behavior: 'smooth' });
            }
        }, 1000);
        
    } catch (error) {
        console.error('Error saving marks:', error);
        alert('Failed to save marks. Please try again.');
    } finally {
        // Restore button state
        const saveButton = document.getElementById('save-marks-btn');
        if (saveButton) {
            saveButton.disabled = false;
            saveButton.innerHTML = 'Save Marks & Generate Report';
        }
    }
    
    return false;
}

// Calculate grade from score
function calculateGrade(score) {
    if (score >= 80) return 'A';
    if (score >= 70) return 'A-';
    if (score >= 65) return 'B+';
    if (score >= 60) return 'B';
    if (score >= 55) return 'B-';
    if (score >= 50) return 'C+';
    if (score >= 45) return 'C';
    if (score >= 40) return 'C-';
    if (score >= 35) return 'D+';
    if (score >= 30) return 'D';
    if (score > 0) return 'D-';
    return 'E';
}

// Generate and display report card
function generateReportCard(marksData) {
    const { studentName, term, academicYear, comments, subject, score } = marksData;
    
    // Get current date in a readable format
    const currentDate = new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
    
    // Calculate grade for the single subject
    const grade = calculateGrade(score);
    
    // Generate subject row HTML
    const subjectRow = `
        <tr>
            <td>${subject}</td>
            <td class="text-center">${score}</td>
            <td class="text-center">${grade}</td>
        </tr>`;
        
    // For backward compatibility, create a subjects array with the single subject
    const subjects = [{ subject, score, grade }];
    const averageScore = score; // Since we only have one subject
    const overallGrade = grade; // Overall grade is the same as the subject grade
    
    // Create report card HTML
    const reportCardHtml = `
        <div class="report-card" style="background: white; padding: 25px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
            <div style="text-align: center; margin-bottom: 20px; border-bottom: 2px solid #007bff; padding-bottom: 15px;">
                <h2 style="margin: 0 0 10px 0; color: #007bff;">SCHOOL REPORT CARD</h2>
                <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
                    <div><strong>Name:</strong> ${studentName}</div>
                    <div><strong>Term:</strong> ${term} ${academicYear}</div>
                </div>
                <div style="display: flex; justify-content: space-between;">
                    <div><strong>Date:</strong> ${currentDate}</div>
                    <div><strong>Overall Grade:</strong> ${overallGrade}</div>
                </div>
            </div>
            
            <div style="margin-bottom: 20px;">
                <table style="width: 100%; border-collapse: collapse; margin-bottom: 15px;">
                    <thead>
                        <tr style="background-color: #f8f9fa; border-bottom: 2px solid #dee2e6;">
                            <th style="padding: 12px; text-align: left; border-bottom: 1px solid #dee2e6;">Subject</th>
                            <th style="padding: 12px; text-align: center; border-bottom: 1px solid #dee2e6; width: 100px;">Score</th>
                            <th style="padding: 12px; text-align: center; border-bottom: 1px solid #dee2e6; width: 100px;">Grade</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${subjectRow}
                    </tbody>
                    <tfoot>
                        <tr>
                            <td style="padding: 12px; text-align: right; font-weight: bold; border-top: 2px solid #dee2e6;">Result:</td>
                            <td style="padding: 12px; text-align: center; font-weight: bold; border-top: 2px solid #dee2e6;">${score}%</td>
                            <td style="padding: 12px; text-align: center; font-weight: bold; border-top: 2px solid #dee2e6;">${grade}</td>
                        </tr>
                    </tfoot>
                </table>
            </div>
            
            <div style="margin-top: 20px; padding-top: 15px; border-top: 1px solid #eee;">
                <h4 style="margin: 0 0 10px 0; color: #333;">Teacher's Comments:</h4>
                <p style="margin: 0; padding: 10px; background: #f8f9fa; border-radius: 4px; min-height: 60px;">
                    ${comments || 'No comments provided.'}
                </p>
            </div>
            
            <div style="margin-top: 30px; display: flex; justify-content: space-between;">
                <div style="text-align: center;">
                    <div style="border-top: 1px solid #333; width: 150px; margin: 0 auto 5px;"></div>
                    <div>Class Teacher's Signature</div>
                </div>
                <div style="text-align: center;">
                    <div style="border-top: 1px solid #333; width: 150px; margin: 0 auto 5px;"></div>
                    <div>Head Teacher's Signature</div>
                </div>
            </div>
        </div>
        
        <div style="margin-top: 20px; text-align: center;">
            <button id="print-report-btn" class="btn btn-primary" style="margin-right: 10px;" onclick="window.print()">
                Print Report Card
            </button>
            <button id="download-pdf-btn" class="btn btn-secondary" onclick="downloadAsPDF()">
                Download as PDF
            </button>
        </div>
    `;
    
    // Display the report card in the preview section
    const reportCardContainer = document.getElementById('report-card');
    if (reportCardContainer) {
        reportCardContainer.innerHTML = reportCardHtml;
        
        // Show the report card preview section
        const reportCardPreview = document.getElementById('report-card-preview');
        if (reportCardPreview) {
            reportCardPreview.style.display = 'block';
            
            // Scroll to the report card
            reportCardPreview.scrollIntoView({ behavior: 'smooth' });
        }
    }
}

// Function to download report as PDF
function downloadAsPDF() {
    const reportCard = document.querySelector('.report-card');
    if (!reportCard) return;
    
    // Use html2pdf.js to generate PDF
    const opt = {
        margin: 10,
        filename: 'report-card.pdf',
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };
    
    // Generate PDF
    html2pdf().from(reportCard).set(opt).save();
}

// Initialize the application when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM fully loaded, initializing app...');
    initApp();
});
