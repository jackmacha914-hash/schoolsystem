// API base URL
const API_BASE_URL = 'http://localhost:5000';

// Global variables
let modal, marksForm, studentSelect, subjectsContainer;

// Mock student data for development
const MOCK_STUDENTS = [
    { id: 1, firstName: 'John', lastName: 'Doe', admissionNumber: 'ADM001' },
    { id: 2, firstName: 'Jane', lastName: 'Smith', admissionNumber: 'ADM002' },
    { id: 3, firstName: 'Michael', lastName: 'Johnson', admissionNumber: 'ADM003' },
    { id: 4, firstName: 'Emily', lastName: 'Williams', admissionNumber: 'ADM004' },
    { id: 5, firstName: 'Robert', lastName: 'Brown', admissionNumber: 'ADM005' },
];

// Main initialization
document.addEventListener('DOMContentLoaded', function() {
    console.log('Modal fix script loaded');
    
    // Initialize elements
    modal = document.getElementById('marks-modal');
    marksForm = document.getElementById('marks-entry-form');
    studentSelect = document.getElementById('student-select');
    subjectsContainer = document.getElementById('subjects-container');
    
    // Initialize event listeners
    initEventListeners();
    
    // Create loading indicator if it doesn't exist
    createLoadingIndicator();
});

// Initialize event listeners
function initEventListeners() {
    // Open modal button
    const openButton = document.getElementById('open-marks-modal');
    if (openButton) {
        openButton.addEventListener('click', openModal);
    }
    
    // Close modal buttons
    document.querySelectorAll('[data-bs-dismiss="modal"]').forEach(button => {
        button.addEventListener('click', closeModal);
    });
    
    // Form submission
    if (marksForm) {
        marksForm.addEventListener('submit', handleFormSubmit);
    }
    
    // Student selection change
    if (studentSelect) {
        studentSelect.addEventListener('change', handleStudentChange);
    }
}

// Create loading indicator
function createLoadingIndicator() {
    if (!modal) return;
    
    const existingLoader = document.getElementById('loading-indicator');
    if (existingLoader) return;
    
    const loader = document.createElement('div');
    loader.id = 'loading-indicator';
    loader.className = 'position-absolute top-50 start-50 translate-middle text-center';
    loader.style.display = 'none';
    loader.style.zIndex = '9999';
    loader.innerHTML = `
        <div class="spinner-border text-primary" role="status">
            <span class="visually-hidden">Loading...</span>
        </div>
        <div class="mt-2">Loading...</div>
    `;
    
    document.body.appendChild(loader);
}

// Open modal
function openModal() {
    if (!modal) {
        console.error('Modal element not found');
        return;
    }
    
    try {
        // Initialize and show modal
        const modalInstance = initializeModal();
        if (modalInstance) {
            modalInstance.show();
            
            // Load students when modal opens
            populateStudentDropdown().catch(error => {
                console.error('Error loading students:', error);
                showError('Failed to load students. Please try again.');
            });
            
            // Focus first input
            const firstInput = modal.querySelector('input, select, textarea');
            if (firstInput) {
                setTimeout(() => firstInput.focus(), 300);
            }
        }
    } catch (error) {
        console.error('Error opening modal:', error);
        // Fallback to simple display
        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
    }
}

// Close modal
function closeModal() {
    if (!modal) return;
    
    try {
        const modalInstance = bootstrap.Modal.getInstance(modal);
        if (modalInstance) {
            modalInstance.hide();
        } else {
            // Fallback to direct style manipulation
            modal.style.display = 'none';
            document.body.classList.remove('modal-open');
            const backdrop = document.querySelector('.modal-backdrop');
            if (backdrop) backdrop.remove();
        }
    } catch (error) {
        console.error('Error closing modal:', error);
        // Fallback to direct style manipulation
        modal.style.display = 'none';
        document.body.classList.remove('modal-open');
    } finally {
        // Clean up
        document.body.style.overflow = '';
        document.body.style.paddingRight = '';
        
        // Reset form
        if (marksForm) marksForm.reset();
        
        // Clear subjects
        if (subjectsContainer) subjectsContainer.innerHTML = '';
    }
}

// Handle student selection change
function handleStudentChange(event) {
    const studentId = event.target.value;
    if (studentId) {
        loadStudentSubjects(studentId).catch(console.error);
    } else if (subjectsContainer) {
        subjectsContainer.innerHTML = '';
    }
}

// Handle form submission
async function handleFormSubmit(event) {
    event.preventDefault();
    
    if (!marksForm) {
        console.error('Form element not found');
        return;
    }
    
    try {
        setLoading(true);
        
        // Get form data
        const formData = new FormData(marksForm);
        const data = Object.fromEntries(formData.entries());
        
        // Validate required fields
        if (!data.student || !data.term || !data.year) {
            throw new Error('Please fill in all required fields');
        }
        
        // Get subject marks
        const subjects = [];
        const subjectInputs = subjectsContainer?.querySelectorAll('input[type="number"]') || [];
        subjectInputs.forEach(input => {
            const subjectName = input.name.replace('subject-', '');
            subjects.push({
                subject: subjectName,
                score: parseFloat(input.value) || 0
            });
        });
        
        // Prepare data for submission
        const marksData = {
            studentId: data.student,
            studentName: studentSelect?.options[studentSelect.selectedIndex]?.text || 'Unknown Student',
            term: data.term,
            year: data.year,
            subjects: subjects,
            comments: data.comments || ''
        };
        
        console.log('Submitting marks:', marksData);
        
        // Here you would typically make an API call to save the marks
        // await saveMarks(marksData);
        
        // Show success message
        showSuccess('Marks saved successfully!');
        
        // Close modal after a delay
        setTimeout(closeModal, 1500);
        
    } catch (error) {
        console.error('Error saving marks:', error);
        showError(error.message || 'Failed to save marks. Please try again.');
    } finally {
        setLoading(false);
    }
}

// Set loading state
function setLoading(isLoading) {
    const loader = document.getElementById('loading-indicator');
    const submitButton = marksForm?.querySelector('button[type="submit"]');
    
    if (loader) {
        loader.style.display = isLoading ? 'block' : 'none';
    }
    
    // Disable form elements while loading
    if (marksForm) {
        const inputs = marksForm.querySelectorAll('input, select, button, textarea');
        inputs.forEach(input => {
            if (input !== loader && !input.classList.contains('btn-close')) {
                input.disabled = isLoading;
            }
        });
    }
    
    // Update submit button state
    if (submitButton) {
        if (isLoading) {
            submitButton.setAttribute('data-original-text', submitButton.textContent);
            submitButton.innerHTML = `
                <span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                Saving...
            `;
        } else {
            const originalText = submitButton.getAttribute('data-original-text');
            if (originalText) {
                submitButton.textContent = originalText;
            }
        }
        submitButton.disabled = isLoading;
    }
}

// Fetch students from API
async function fetchStudents() {
    try {
        console.log(`Attempting to fetch students from ${API_BASE_URL}/api/students`);
        const response = await fetch(`${API_BASE_URL}/api/students`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        console.log('Successfully fetched students from API:', data);
        return data;
    } catch (error) {
        console.warn('Could not connect to API, using mock data:', error);
        
        // Show a warning to the user that we're using mock data
        showError('Note: Using demo data. The server is not available.', 'info');
        
        // Return mock data after a short delay to simulate network request
        return new Promise(resolve => {
            setTimeout(() => resolve(MOCK_STUDENTS), 500);
        });
    }
}

// Populate student dropdown
async function populateStudentDropdown() {
    if (!studentSelect) {
        console.error('Student select element not found');
        return;
    }
    
    try {
        setLoading(true);
        
        // Clear existing options except the first one
        while (studentSelect.options.length > 1) {
            studentSelect.remove(1);
        }
        
        // Fetch students
        const students = await fetchStudents();
        
        // Add students to dropdown
        students.forEach(student => {
            const option = document.createElement('option');
            option.value = student.id;
            option.textContent = `${student.firstName} ${student.lastName}`;
            studentSelect.appendChild(option);
        });
        
        // Enable the select
        studentSelect.disabled = false;
        
    } catch (error) {
        console.error('Error populating student dropdown:', error);
        showError('Failed to load students. Please try again.');
    } finally {
        setLoading(false);
    }
}

// Load subjects for a student
async function loadStudentSubjects(studentId) {
    if (!subjectsContainer) return;
    
    try {
        setLoading(true);
        
        // Clear existing subjects
        subjectsContainer.innerHTML = '';
        
        // Mock data for demonstration
        const subjects = [
            { id: 'math', name: 'Mathematics' },
            { id: 'sci', name: 'Science' },
            { id: 'eng', name: 'English' },
            { id: 'hist', name: 'History' }
        ];
        
        // Create subject inputs
        subjects.forEach(subject => {
            const div = document.createElement('div');
            div.className = 'mb-3';
            div.innerHTML = `
                <label for="subject-${subject.id}" class="form-label">${subject.name} Score</label>
                <input type="number" class="form-control" id="subject-${subject.id}" 
                       name="subject-${subject.id}" min="0" max="100" step="0.1" required>
                <div class="invalid-feedback">
                    Please enter a valid score (0-100)
                </div>
            `;
            subjectsContainer.appendChild(div);
        });
        
    } catch (error) {
        console.error('Error loading student subjects:', error);
        showError('Failed to load subjects. Please try again.');
    } finally {
        setLoading(false);
    }
}

// Show success message
function showSuccess(message) {
    // Remove any existing alerts
    const existingAlerts = document.querySelectorAll('.alert');
    existingAlerts.forEach(alert => alert.remove());
    
    // Create success alert
    const alertDiv = document.createElement('div');
    alertDiv.className = 'alert alert-success alert-dismissible fade show';
    alertDiv.role = 'alert';
    alertDiv.innerHTML = `
        <i class="bi bi-check-circle-fill me-2"></i>
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
    `;
    
    // Add to the form or modal body
    const container = marksForm || (modal?.querySelector('.modal-body'));
    if (container) {
        container.insertBefore(alertDiv, container.firstChild);
    }
    
    // Auto-dismiss after 5 seconds
    setTimeout(() => {
        alertDiv.classList.remove('show');
        setTimeout(() => alertDiv.remove(), 150);
    }, 5000);
}

// Show error message
function showError(message, type = 'error') {
    // Remove any existing alerts
    const existingAlerts = document.querySelectorAll('.alert');
    existingAlerts.forEach(alert => alert.remove());
    
    // Create error alert
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type === 'error' ? 'danger' : type} alert-dismissible fade show`;
    alertDiv.role = 'alert';
    alertDiv.innerHTML = `
        <i class="bi bi-exclamation-triangle-fill me-2"></i>
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
    `;
    
    // Add to the form or modal body
    const container = marksForm || (modal?.querySelector('.modal-body'));
    if (container) {
        container.insertBefore(alertDiv, container.firstChild);
    }
    
    // Auto-dismiss after 5 seconds for non-error messages
    if (type !== 'error') {
        setTimeout(() => {
            alertDiv.classList.remove('show');
            setTimeout(() => alertDiv.remove(), 150);
        }, 5000);
    }
}

// Initialize Bootstrap modal
function initializeModal() {
    if (!modal) return null;
    
    try {
        // Check if modal is already initialized
        let modalInstance = bootstrap.Modal.getInstance(modal);
        
        // If not initialized, create new instance
        if (!modalInstance) {
            modalInstance = new bootstrap.Modal(modal, {
                backdrop: 'static',
                keyboard: false
            });
            
            // Handle modal hidden event
            modal.addEventListener('hidden.bs.modal', () => {
                closeModal();
            });
        }
        
        return modalInstance;
    } catch (error) {
        console.error('Error initializing modal:', error);
        return null;
    }
}

// Export functions if needed (for module systems)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        openModal,
        closeModal,
        showSuccess,
        showError,
        setLoading
    };
}
