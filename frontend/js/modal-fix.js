// API base URL
const API_BASE_URL = 'http://localhost:5000';

// Simple modal functionality
console.log('Modal fix script loaded');

// Add modal styles
const style = document.createElement('style');
style.textContent = `
    /* Modal styles */
    #marks-modal {
        display: none;
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-color: rgba(0, 0, 0, 0.7);
        z-index: 1000;
        justify-content: center;
        align-items: flex-start;
        padding: 40px 0;
        overflow-y: auto;
    }
    
    #marks-modal .modal-content {
        background: white;
        padding: 30px;
        border-radius: 8px;
        width: 90%;
        max-width: 800px;
        max-height: 90vh;
        overflow-y: auto;
        position: relative;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
    }
    
    #marks-modal .modal-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 20px;
        padding-bottom: 15px;
        border-bottom: 1px solid #eee;
    }
    
    #marks-modal .modal-header h3 {
        margin: 0;
        color: #333;
    }
    
    #marks-modal .close-modal {
        position: absolute;
        top: 15px;
        right: 20px;
        font-size: 28px;
        font-weight: bold;
        color: #666;
        cursor: pointer;
        background: none;
        border: none;
        padding: 0 10px;
        line-height: 1;
    }
    
    #marks-modal .close-modal:hover {
        color: #000;
    }
    
    .form-group {
        margin-bottom: 15px;
    }
    
    .form-group label {
        display: block;
        margin-bottom: 5px;
        font-weight: 500;
        color: #444;
    }
    
    .form-group input[type="text"],
    .form-group input[type="number"],
    .form-group select,
    .form-group textarea {
        width: 100%;
        padding: 10px 12px;
        border: 1px solid #ddd;
        border-radius: 4px;
        font-size: 14px;
    }
    
    .form-row {
        display: flex;
        gap: 15px;
        margin-bottom: 15px;
    }
    
    .form-row .form-group {
        flex: 1;
        margin-bottom: 0;
    }
    
    .btn {
        padding: 10px 20px;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        font-weight: 500;
        margin-right: 10px;
    }
    
    .btn-primary {
        background-color: #4a6cf7;
        color: white;
    }
    
    .btn-primary:hover {
        background-color: #3a5ce4;
    }
    
    .btn-secondary {
        background-color: #6c757d;
        color: white;
    }
    
    .btn-secondary:hover {
        background-color: #5a6268;
    }
    
    #marks-container {
        margin-top: 20px;
    }
    
    .marks-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
        gap: 15px;
        margin-top: 10px;
    }
    
    /* Loading spinner */
    @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
    }
    
    .spinner {
        display: inline-block;
        width: 30px;
        height: 30px;
        border: 4px solid rgba(0, 0, 0, 0.1);
        border-radius: 50%;
        border-top-color: #4a6cf7;
        animation: spin 1s ease-in-out infinite;
    }
    
    /* Form actions */
    .form-actions {
        display: flex;
        justify-content: flex-end;
        gap: 10px;
        margin-top: 20px;
        padding-top: 15px;
        border-top: 1px solid #eee;
    }
    
    .no-subjects {
        color: #666;
        font-style: italic;
        text-align: center;
        padding: 20px;
        background-color: #f9f9f9;
        border-radius: 4px;
    }
    
    /* Responsive adjustments */
    @media (max-width: 768px) {
        .form-row {
            flex-direction: column;
            gap: 10px;
        }
        
        .form-row .form-group {
            width: 100%;
        }
        
        .marks-grid {
            grid-template-columns: 1fr;
        }
    }
`;
document.head.appendChild(style);

// Mock student data for development
const MOCK_STUDENTS = [
    { id: 1, fullName: 'John Doe', admissionNumber: 'ADM001' },
    { id: 2, fullName: 'Jane Smith', admissionNumber: 'ADM002' },
    { id: 3, fullName: 'Michael Johnson', admissionNumber: 'ADM003' },
    { id: 4, fullName: 'Emily Williams', admissionNumber: 'ADM004' },
    { id: 5, fullName: 'Robert Brown', admissionNumber: 'ADM005' },
];

// Function to fetch students from the API
async function fetchStudents() {
    // First try to fetch from the API
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

// Function to populate student dropdown
async function populateStudentDropdown() {
    const studentSelect = document.getElementById('student-select');
    if (!studentSelect) {
        console.error('Student select element not found');
        return;
    }
    
    // Show loading state
    studentSelect.innerHTML = '<option value="">Loading students...</option>';
    studentSelect.disabled = true;
    
    try {
        const students = await fetchStudents();
        
        // Clear existing options
        studentSelect.innerHTML = '<option value="">-- Select Student --</option>';
        
        if (!students || students.length === 0) {
            console.warn('No students found');
            showError('No students found in the system.', 'warning');
            studentSelect.innerHTML = '<option value="">-- No students available --</option>';
            return;
        }
        
        console.log(`Loaded ${students.length} students`);
        
        // Process and sort students
        const processedStudents = students.map(student => ({
            id: student._id,  // Use _id as id
            name: student.name || 'Unnamed Student',
            email: student.email || '',
            admissionNumber: student.admissionNumber || student.email.split('@')[0] || 'N/A'
        })).filter(student => student.id);  // Filter out any entries without an ID
        
        // Sort students by name
        const sortedStudents = [...processedStudents].sort((a, b) => 
            a.name.localeCompare(b.name)
        );
        
        // Add students to dropdown
        sortedStudents.forEach(student => {
            const option = document.createElement('option');
            option.value = student.id;
            const displayText = student.admissionNumber !== 'N/A' 
                ? `${student.name} (${student.admissionNumber})`
                : student.name;
                
            option.textContent = displayText;
            option.setAttribute('data-name', student.name);
            option.setAttribute('data-email', student.email);
            studentSelect.appendChild(option);
        });
        
        console.log(`Successfully processed ${sortedStudents.length} students`);
        
        // Enable the select and show success message if we have students
        studentSelect.disabled = false;
        
        // If we're using mock data, show a more prominent message
        if (students === MOCK_STUDENTS) {
            showError('Using demo data. Connect to the server for real student data.', 'info');
        }
        
    } catch (error) {
        console.error('Error populating student dropdown:', error);
        
        // If we're here, even the mock data failed, which shouldn't happen
        studentSelect.innerHTML = '<option value="">-- Error loading students --</option>';
        studentSelect.disabled = true;
        
        showError(
            'Failed to load students. Please check your connection and try again.',
            'error'
        );
    }
}

// Function to show message (error, warning, or info)
function showError(message, type = 'error') {
    // Remove any existing messages first
    const existingMessages = document.querySelectorAll('.message');
    existingMessages.forEach(msg => {
        if (msg.parentNode) {
            msg.parentNode.removeChild(msg);
        }
    });
    
    // Create message element
    const messageDiv = document.createElement('div');
    messageDiv.className = `message message-${type}`;
    
    // Set styles based on message type
    const styles = {
        marginTop: '10px',
        padding: '12px 15px',
        borderRadius: '4px',
        marginBottom: '15px',
        display: 'flex',
        alignItems: 'center',
        gap: '10px'
    };
    
    // Apply base styles
    Object.assign(messageDiv.style, styles);
    
    // Apply type-specific styles
    switch (type) {
        case 'warning':
            messageDiv.style.backgroundColor = '#fff3cd';
            messageDiv.style.border = '1px solid #ffeeba';
            messageDiv.style.color = '#856404';
            break;
        case 'info':
            messageDiv.style.backgroundColor = '#d1ecf1';
            messageDiv.style.border = '1px solid #bee5eb';
            messageDiv.style.color = '#0c5460';
            break;
        case 'success':
            messageDiv.style.backgroundColor = '#d4edda';
            messageDiv.style.border = '1px solid #c3e6cb';
            messageDiv.style.color = '#155724';
            break;
        case 'error':
        default:
            messageDiv.style.backgroundColor = '#f8d7da';
            messageDiv.style.border = '1px solid #f5c6cb';
            messageDiv.style.color = '#721c24';
            break;
    }
    
    // Add icon based on type
    let icon = '⚠️';
    if (type === 'info') icon = 'ℹ️';
    if (type === 'success') icon = '✅';
    if (type === 'error') icon = '❌';
    
    messageDiv.innerHTML = `
        <span style="font-size: 1.2em; margin-right: 5px;">${icon}</span>
        <span>${message}</span>
    `;
    
    // Add to form or modal
    const form = document.getElementById('marks-entry-form');
    const modal = document.getElementById('marks-modal');
    const target = form || modal;
    
    if (target) {
        // Insert after the header or at the top of the modal
        const header = target.querySelector('.modal-header');
        if (header && header.nextSibling) {
            target.insertBefore(messageDiv, header.nextSibling);
        } else {
            target.prepend(messageDiv);
        }
        
        // Auto-remove after delay (longer for info messages)
        const delay = type === 'info' ? 8000 : 5000;
        setTimeout(() => {
            if (messageDiv.parentNode) {
                messageDiv.style.opacity = '0';
                messageDiv.style.transition = 'opacity 0.5s ease';
                setTimeout(() => {
                    if (messageDiv.parentNode) {
                        messageDiv.parentNode.removeChild(messageDiv);
                    }
                }, 500);
            }
        }, delay);
    }
    
    return messageDiv;
}

document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM fully loaded');
    
    // Get elements - using the correct modal ID from your HTML
    const modal = document.getElementById('studentSelectionModal') || document.getElementById('marks-modal');
    const openButton = document.querySelector('[data-bs-toggle="modal"][data-bs-target="#studentSelectionModal"], #open-marks-modal');
    const closeButton = document.querySelector('.close-btn, .close-modal');
    const marksForm = document.querySelector('#marks-form, form');
    const studentSelect = document.getElementById('student-select');
    const subjectsContainer = document.getElementById('subjects-container');
    const loadingIndicator = document.getElementById('loading-indicator');
    
    console.log('Modal elements:', { modal, openButton, closeButton, marksForm, studentSelect });
    
    // Create loading indicator if it doesn't exist
    if (!loadingIndicator && modal) {
        const loader = document.createElement('div');
        loader.id = 'loading-indicator';
        loader.style.display = 'none';
        loader.textContent = 'Loading...';
        modal.appendChild(loader);
    }
    
    // Function to show loading state
    function setLoading(isLoading) {
        const loader = document.getElementById('loading-indicator');
        if (loader) {
            loader.style.display = isLoading ? 'block' : 'none';
        }
        if (marksForm) {
            const inputs = marksForm.querySelectorAll('input, select, button, textarea');
            inputs.forEach(input => {
                input.disabled = isLoading;
            });
        }
    }

    // Function to open modal
    function openModal() {
        console.log('Opening modal...');
        
        // Make sure the modal exists
        if (!modal) {
            console.error('Modal element not found');
            return;
        }
        
        // Reset form and show loading state
        if (marksForm) marksForm.reset();
        
        // Show modal using Bootstrap's modal method if available
        const modalInstance = bootstrap.Modal.getOrCreateInstance(modal);
        if (modalInstance) {
            modalInstance.show();
        } else {
            // Fallback to direct style manipulation
            modal.style.display = 'flex';
        }
        
        document.body.style.overflow = 'hidden'; // Prevent scrolling when modal is open
        
        // Load students when modal opens
        populateStudentDropdown().catch(error => {
            console.error('Error loading students:', error);
            showError('Failed to load students. Please try again.', 'error');
        });
        
        // Set focus on first input for better UX
        const firstInput = modal.querySelector('input, select, textarea');
        if (firstInput) {
            setTimeout(() => firstInput.focus(), 100);
        }
    }
    
    // Function to close modal
    function closeModal() {
        console.log('Closing modal');
        if (modal) {
            modal.style.display = 'none';
            document.body.style.overflow = '';
            
            // Reset form when closing
            if (marksForm) {
                marksForm.reset();
            }
            
            // Clear subjects container
            if (subjectsContainer) {
                subjectsContainer.innerHTML = '';
            }
        }
    }
    
    // Function to load student's subjects
    async function loadStudentSubjects(studentId) {
        if (!subjectsContainer) return;
        
        try {
            setLoading(true);
            subjectsContainer.innerHTML = '';
            
            // In a real app, you would fetch the student's subjects from your API
            // For now, we'll use a placeholder
            const placeholderSubjects = [
                'Mathematics', 'English', 'Kiswahili', 'Physics', 'Chemistry',
                'Biology', 'History', 'Geography', 'CRE', 'Business Studies'
            ];
            
            // Create subject inputs
            const subjectInputs = document.createElement('div');
            subjectInputs.className = 'marks-grid';
            
            placeholderSubjects.forEach((subject, index) => {
                const subjectDiv = document.createElement('div');
                subjectDiv.className = 'form-group';
                subjectDiv.innerHTML = `
                    <label for="subject-${index}">${subject}</label>
                    <input type="number" id="subject-${index}" name="${subject}" 
                           min="0" max="100" placeholder="Enter marks">
                `;
                subjectInputs.appendChild(subjectDiv);
            });
            
            subjectsContainer.appendChild(subjectInputs);
            
        } catch (error) {
            console.error('Error loading subjects:', error);
            showError('Failed to load subjects. Please try again.');
        } finally {
            setLoading(false);
        }
    }
    
    // Event listeners
    if (openButton) {
        openButton.addEventListener('click', function(e) {
            e.preventDefault();
            openModal();
        });
        console.log('Added click listener to open button');
    } else {
        console.error('Open button not found');
    }
    
    if (closeButton) {
        closeButton.addEventListener('click', function(e) {
            e.preventDefault();
            closeModal();
        });
        console.log('Added click listener to close button');
    }
    
    // Handle student selection change
    if (studentSelect) {
        studentSelect.addEventListener('change', async function(e) {
            const studentId = e.target.value;
            if (studentId) {
                await loadStudentSubjects(studentId);
            } else {
                if (subjectsContainer) {
                    subjectsContainer.innerHTML = '';
                }
            }
        });
    }
    
    // Handle form submission
    if (marksForm) {
        marksForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            // Disable form while submitting
            const submitButton = marksForm.querySelector('button[type="submit"]');
            const originalButtonText = submitButton.textContent;
            submitButton.disabled = true;
            submitButton.textContent = 'Saving...';
            
            try {
                const formData = new FormData(marksForm);
                const studentId = formData.get('student');
                const selectedStudent = document.querySelector(`#student-select option[value="${studentId}"]`);
                const studentName = selectedStudent ? selectedStudent.getAttribute('data-name') : 'Unknown Student';
                
                // Prepare marks data
                const marksData = {
                    studentId: studentId,
                    studentName: studentName,
                    term: formData.get('term'),
                    year: formData.get('year'),
                    subjects: {},
                    comments: formData.get('comments') || ''
                };
                
                // Collect subject marks
                const subjectInputs = subjectsContainer.querySelectorAll('input[type="number"]');
                subjectInputs.forEach(input => {
                    if (input.value !== '') {
                        marksData.subjects[input.name] = parseInt(input.value, 10);
                    }
                });
                
                console.log('Submitting marks:', marksData);
                
                // Get token and user data from localStorage
                const token = localStorage.getItem('token');
                let role = localStorage.getItem('role');
                const userData = JSON.parse(localStorage.getItem('userData') || '{}');
                
                // Enhanced logging for debugging
                console.group('Auth Debug');
                console.log('Token:', token ? 'exists' : 'missing');
                console.log('Role from localStorage:', role || 'not set');
                console.log('User data from localStorage:', userData);
                console.log('All localStorage:', { ...localStorage });
                console.groupEnd();
                
                // Try to get role from userData if not in localStorage
                if (!role && userData.role) {
                    role = userData.role;
                    console.log('Using role from userData:', role);
                }
                
                // If still no role, try to infer from email
                if (!role && userData.email) {
                    if (userData.email.includes('@teacher.') || userData.email.includes('teacher@')) {
                        role = 'teacher';
                    } else if (userData.email.includes('@admin.') || userData.email.includes('admin@')) {
                        role = 'admin';
                    } else if (userData.email.includes('@student.') || userData.email.includes('student@')) {
                        role = 'student';
                    }
                    if (role) {
                        console.log('Inferred role from email:', role);
                        localStorage.setItem('role', role);
                    }
                }
                
                // Final check for token and role
                if (!token) {
                    const errorMsg = 'You need to be logged in to save marks. Please log in and try again.';
                    console.error('Authentication error:', errorMsg);
                    showError(errorMsg, 'error');
                    return;
                }
                
                if (!role) {
                    console.warn('No role found, defaulting to teacher');
                    role = 'teacher'; // Default role
                    localStorage.setItem('role', role);
                }
                
                try {
                    // Clean the token (remove any quotes or extra spaces)
                    const cleanToken = token.replace(/^['"]|['"]$/g, '').trim();
                    
                    // Prepare the request with different auth header formats
                    const requestOptions = {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Accept': 'application/json'
                        },
                        body: JSON.stringify({
                            ...marksData,
                            userRole: role
                        })
                    };

                    // Try different auth header formats
                    const authAttempts = [
                        { name: 'Bearer Token', header: `Bearer ${cleanToken}` },
                        { name: 'x-auth-token', header: cleanToken },
                        { name: 'Token', header: `Token ${cleanToken}` },
                        { name: 'No Auth Header', header: null } // Last resort
                    ];

                    let response;
                    let lastError;

                    // Try each auth method until one works
                    for (const attempt of authAttempts) {
                        console.log(`Trying auth method: ${attempt.name}`);
                        
                        const headers = { ...requestOptions.headers };
                        if (attempt.header) {
                            if (attempt.name === 'x-auth-token') {
                                headers['x-auth-token'] = attempt.header;
                            } else {
                                headers['Authorization'] = attempt.header;
                            }
                        }
                        
                        try {
                            const attemptResponse = await fetch(`${API_BASE_URL}/api/marks`, {
                                ...requestOptions,
                                headers
                            });
                            
                            console.log(`Auth method ${attempt.name} status:`, attemptResponse.status);
                            
                            if (attemptResponse.ok) {
                                response = attemptResponse;
                                break; // Success!
                            }
                            
                            const errorData = await attemptResponse.json().catch(() => ({}));
                            lastError = errorData.msg || errorData.message || attemptResponse.statusText;
                            console.warn(`Auth method ${attempt.name} failed:`, lastError);
                            
                        } catch (error) {
                            console.error(`Error with auth method ${attempt.name}:`, error);
                            lastError = error.message;
                        }
                    }
                    
                    if (!response) {
                        throw new Error(lastError || 'All authentication methods failed');
                    }
                    
                    console.log('Response status:', response.status, response.statusText);
                    
                    if (!response.ok) {
                        const errorData = await response.json().catch(() => ({}));
                        const errorMessage = errorData.msg || errorData.message || 'Failed to save marks';
                        console.error('API Error:', {
                            status: response.status,
                            statusText: response.statusText,
                            error: errorData
                        });

                        console.log(`Auth method ${attempt.name} status:`, attemptResponse.status);

                        if (attemptResponse.ok) {
                            response = attemptResponse;
                            break; // Success!
                        }

                        const errorData = await attemptResponse.json().catch(() => ({}));
                        lastError = errorData.msg || errorData.message || attemptResponse.statusText;
                        console.warn(`Auth method ${attempt.name} failed:`, lastError);

                    } catch (error) {
                        console.error(`Error with auth method ${attempt.name}:`, error);
                        lastError = error.message;
                    }
                }

                if (!response) {
                    throw new Error(lastError || 'All authentication methods failed');
                }

                console.log('Response status:', response.status, response.statusText);

                if (!response.ok) {
                    const errorData = await response.json().catch(() => ({}));
                    const errorMessage = errorData.msg || errorData.message || 'Failed to save marks';
                    console.error('API Error:', {
                        status: response.status,
                        statusText: response.statusText,
                        error: errorData
                    });
                    throw new Error(errorMessage);
                }

                // If we get here, the request was successful
                const result = await response.json().catch(err => ({}));
                console.log('Marks saved successfully:', result);

                // Show success message
                showError('Marks saved successfully!', 'success');

                // Close the modal after a short delay
                setTimeout(() => {
                    const modals = [
                        document.getElementById('studentSelectionModal'),
                        document.getElementById('marksModal')
                    ].filter(Boolean);
                    
                    modals.forEach(modal => {
                        try {
                            const modalInstance = bootstrap.Modal.getInstance(modal);
                            if (modalInstance) {
                                modalInstance.hide();
                            } else {
                                modal.style.display = 'none';
                            }
                        } catch (e) {
                            console.error('Error closing modal:', e);
                            modal.style.display = 'none';
                        }
                    });
                }, 1500);

                return result;

            } catch (error) {
                console.error('Error in form submission:', error);
                showError(`Failed to save marks: ${error.message}`, 'error');
                throw error;
            } finally {
                if (submitButton) {
                    submitButton.disabled = false;
                    submitButton.textContent = originalButtonText;
                }
            }
        });
    }
    
    // Close when clicking outside
    window.addEventListener('click', function(e) {
        if (e.target === modal) {
            closeModal();
        }
    });
});
