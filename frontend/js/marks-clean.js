// API base URL
const API_BASE_URL = 'http://localhost:3000';

// Global variables
let marksModal, classSelect, marksContainer, generateReportBtn, saveMarksBtn, cancelMarksBtn, 
    openMarksModalBtn, closeModalBtn, reportCardPreview, printReportBtn, studentSelect;

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
    
    console.log('DOM elements initialized');
}

// Initialize the application
async function initApp() {
    try {
        console.log('Initializing application...');
        
        // Initialize DOM elements
        initializeElements();
        
        // Set up event listeners
        initializeEventListeners();
        
        // Fetch students from the backend
        await fetchStudents();
        
        console.log('Application initialized successfully');
        
    } catch (error) {
        console.error('Error initializing application:', error);
    }
}

// Set up event listeners
function initializeEventListeners() {
    // Open modal button
    if (openMarksModalBtn) {
        openMarksModalBtn.addEventListener('click', openMarksModal);
    }
    
    // Close modal button (X in the corner)
    if (closeModalBtn) {
        closeModalBtn.addEventListener('click', closeMarksModal);
    }
    
    // Cancel button in the modal
    if (cancelMarksBtn) {
        cancelMarksBtn.addEventListener('click', closeMarksModal);
    }
    
    // Class selection change
    if (classSelect) {
        classSelect.addEventListener('change', filterStudentsByClass);
    }
    
    // Generate report button
    if (generateReportBtn) {
        generateReportBtn.addEventListener('click', generateReportCard);
    }
    
    // Print report button
    if (printReportBtn) {
        printReportBtn.addEventListener('click', () => window.print());
    }
    
    // Save marks button
    if (saveMarksBtn) {
        saveMarksBtn.addEventListener('click', saveMarks);
    }
    
    // Close modal when clicking outside the modal content
    if (marksModal) {
        marksModal.addEventListener('click', (e) => {
            if (e.target === marksModal) {
                closeMarksModal();
            }
        });
    }
}

// Fetch students from the backend
async function fetchStudents() {
    try {
        const token = localStorage.getItem('token');
        if (!token) {
            console.warn('No authentication token found. User needs to log in.');
            return [];
        }

        const response = await fetch(`${API_BASE_URL}/api/students`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            credentials: 'include'
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Error response:', errorText);
            throw new Error(`Failed to fetch students: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        console.log('Fetched students data:', data);
        
        // Update the student dropdown
        updateStudentDropdown(Array.isArray(data) ? data : []);
        
        return data;
        
    } catch (error) {
        console.error('Error fetching students:', error);
        throw error;
    }
}

// Update student dropdown with the provided students
function updateStudentDropdown(students) {
    if (!studentSelect) return;
    
    // Clear existing options except the first one
    while (studentSelect.options.length > 1) {
        studentSelect.remove(1);
    }
    
    // Add students to the dropdown
    students.forEach(student => {
        const option = document.createElement('option');
        option.value = student._id || student.id;
        option.textContent = student.name || `Student ${student._id || student.id}`;
        studentSelect.appendChild(option);
    });
    
    console.log('Student dropdown updated');
}

// Filter students by class
function filterStudentsByClass() {
    const selectedClass = classSelect ? classSelect.value : '';
    if (!selectedClass) return;
    
    console.log(`Filtering students by class: ${selectedClass}`);
    // Add your filtering logic here
}

// Open marks modal
function openMarksModal() {
    if (!marksModal) return;
    
    marksModal.style.display = 'block';
    document.body.style.overflow = 'hidden';
    
    // Add animation class
    const modalContent = marksModal.querySelector('.modal-content');
    if (modalContent) {
        modalContent.classList.add('animate-in');
    }
    
    // Set focus to the first form element
    const firstInput = marksModal.querySelector('input, select, textarea');
    if (firstInput) {
        firstInput.focus();
    }
}

// Close marks modal
function closeMarksModal() {
    if (!marksModal) return;
    
    // Add animation class
    const modalContent = marksModal.querySelector('.modal-content');
    if (modalContent) {
        modalContent.classList.remove('animate-in');
        modalContent.classList.add('animate-out');
    }
    
    // Wait for animation to complete before hiding the modal
    setTimeout(() => {
        marksModal.style.display = 'none';
        document.body.style.overflow = '';
        
        // Reset animation classes
        if (modalContent) {
            modalContent.classList.remove('animate-out');
        }
        
        // Reset the form
        resetForm();
    }, 300);
}

// Reset form fields
function resetForm() {
    const form = document.getElementById('marks-form');
    if (form) {
        form.reset();
    }
    
    // Clear any dynamic content
    if (marksContainer) {
        marksContainer.innerHTML = '';
    }
    
    // Reset any other form-related state here
}

// Generate report card
function generateReportCard() {
    console.log('Generating report card...');
    // Add your report card generation logic here
}

// Save marks to the server
async function saveMarks() {
    try {
        if (!studentSelect || !classSelect) {
            console.error('Required form elements not found');
            return;
        }
        
        const studentId = studentSelect.value;
        const className = classSelect.value;
        const term = document.getElementById('term-select')?.value;
        const academicYear = document.getElementById('academic-year')?.value;
        const comments = document.getElementById('teacher-comments')?.value;
        
        if (!studentId || !className || !term || !academicYear) {
            console.error('Missing required fields');
            alert('Please fill in all required fields');
            return;
        }
        
        // Collect marks from the form
        const marks = [];
        const markInputs = marksContainer.querySelectorAll('input[type="number"]');
        
        markInputs.forEach(input => {
            const subject = input.getAttribute('data-subject');
            const score = parseFloat(input.value) || 0;
            
            if (subject) {
                marks.push({
                    subject,
                    score,
                    grade: calculateGrade(score),
                    remarks: getRemarks(calculateGrade(score))
                });
            }
        });
        
        // Prepare the data to send to the server
        const data = {
            studentId,
            className,
            term,
            academicYear,
            marks,
            comments: comments || ''
        };
        
        console.log('Saving marks:', data);
        
        const token = localStorage.getItem('token');
        if (!token) {
            console.error('No authentication token found');
            alert('Please log in to save marks');
            return;
        }
        
        const response = await fetch(`${API_BASE_URL}/api/marks`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(data)
        });
        
        if (!response.ok) {
            const error = await response.json().catch(() => ({}));
            throw new Error(error.message || 'Failed to save marks');
        }
        
        const result = await response.json();
        console.log('Marks saved successfully:', result);
        
        // Show success message
        showSuccess('Marks saved successfully!');
        
        // Close the modal
        closeMarksModal();
        
    } catch (error) {
        console.error('Error saving marks:', error);
        showError(error.message || 'Failed to save marks. Please try again.');
    }
}

// Calculate grade based on score
function calculateGrade(score) {
    if (score >= 80) return 'A';
    if (score >= 70) return 'A-';
    if (score >= 60) return 'B';
    if (score >= 50) return 'B-';
    if (score >= 40) return 'C';
    return 'D';
}

// Get remarks based on grade
function getRemarks(grade) {
    const remarks = {
        'A': 'Excellent performance! Keep up the good work!',
        'A-': 'Very good performance!',
        'B': 'Good job! You are doing well.',
        'B-': 'Satisfactory performance. Room for improvement.',
        'C': 'Needs improvement. Please review the material.',
        'D': 'Failed. Please seek additional help.'
    };
    return remarks[grade] || 'No remarks available.';
}

// Show success message
function showSuccess(message) {
    // You can implement a toast notification here
    alert(`Success: ${message}`);
}

// Show error message
function showError(message) {
    // You can implement a toast notification here
    alert(`Error: ${message}`);
}

// Add animation styles
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from { transform: translateY(-20px); opacity: 0; }
        to { transform: translateY(0); opacity: 1; }
    }
    
    @keyframes slideOut {
        from { transform: translateY(0); opacity: 1; }
        to { transform: translateY(-20px); opacity: 0; }
    }
    
    .animate-in {
        animation: slideIn 0.3s ease-out forwards;
    }
    
    .animate-out {
        animation: slideOut 0.3s ease-in forwards;
    }
`;
document.head.appendChild(style);

// Initialize the application when the DOM is fully loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
} else {
    initApp();
}
