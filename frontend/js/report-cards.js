// API base URL - update this to your actual API URL
if (typeof API_BASE_URL === 'undefined') {
    window.API_BASE_URL = 'http://localhost:5000';
}

// Function to show alert messages
function showAlert(message, type = 'info') {
    // Remove any existing alerts
    const existingAlert = document.querySelector('.alert');
    if (existingAlert) {
        existingAlert.remove();
    }
    
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type}`;
    alertDiv.textContent = message;
    
    // Add close button
    const closeBtn = document.createElement('button');
    closeBtn.className = 'close';
    closeBtn.innerHTML = '&times;';
    closeBtn.onclick = () => alertDiv.remove();
    
    alertDiv.prepend(closeBtn);
    
    // Add to the top of the page
    const container = document.querySelector('.main-content') || document.body;
    container.insertBefore(alertDiv, container.firstChild);
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
        if (alertDiv.parentNode) {
            alertDiv.remove();
        }
    }, 5000);
}

// Function to load classes for the report card tab
async function loadClassesForReportCard() {
    try {
        const classSelect = document.getElementById('report-class');
        if (!classSelect) {
            console.error('Class select element not found');
            return;
        }

        // Clear existing options
        classSelect.innerHTML = '<option value="">-- Select Class --</option>';
        
        // Create the same class structure as in marks entry
        const classGroups = [
            {
                label: 'Pre-Primary',
                classes: [
                    { value: 'Baby Class', text: 'Baby Class' },
                    { value: 'PP1', text: 'PP1 (Pre-Primary 1)' },
                    { value: 'PP2', text: 'PP2 (Pre-Primary 2)' }
                ]
            },
            {
                label: 'Lower Primary (Grade 1-3)',
                classes: [
                    { value: 'Grade 1', text: 'Grade 1' },
                    { value: 'Grade 2', text: 'Grade 2' },
                    { value: 'Grade 3', text: 'Grade 3' }
                ]
            },
            {
                label: 'Upper Primary (Grade 4-6)',
                classes: [
                    { value: 'Grade 4', text: 'Grade 4' },
                    { value: 'Grade 5', text: 'Grade 5' },
                    { value: 'Grade 6', text: 'Grade 6' }
                ]
            },
            {
                label: 'Junior Secondary (Grade 7-9)',
                classes: [
                    { value: 'Grade 7', text: 'Grade 7' },
                    { value: 'Grade 8', text: 'Grade 8' },
                    { value: 'Grade 9', text: 'Grade 9' }
                ]
            },
            {
                label: 'Senior School (Grade 10-12)',
                classes: [
                    { value: 'Grade 10', text: 'Grade 10' },
                    { value: 'Grade 11', text: 'Grade 11' },
                    { value: 'Grade 12', text: 'Grade 12' }
                ]
            }
        ];

        // Add class groups and options
        classGroups.forEach(group => {
            const optgroup = document.createElement('optgroup');
            optgroup.label = group.label;
            
            group.classes.forEach(cls => {
                const option = document.createElement('option');
                option.value = cls.value;
                option.textContent = cls.text;
                optgroup.appendChild(option);
            });
            
            classSelect.appendChild(optgroup);
        });

        // Enable the select
        classSelect.disabled = false;

    } catch (error) {
        console.error('Error loading classes:', error);
        const classSelect = document.getElementById('report-class');
        if (classSelect) {
            classSelect.innerHTML = '<option value="">Error loading classes</option>';
            classSelect.disabled = true;
        }
        showAlert('Failed to load classes. Please try again.', 'error');
    }
}

// Function to load students for report card
async function loadStudentsForReportCard(className) {
    console.log('Loading students for class:', className);
    const reportStudentSelect = document.getElementById('report-student');
    
    if (!reportStudentSelect) {
        console.error('Student select element not found');
        return [];
    }
    
    try {
        // Disable and show loading state
        reportStudentSelect.disabled = true;
        reportStudentSelect.innerHTML = '<option value="">Loading students...</option>';
        
        const token = localStorage.getItem('token');
        if (!token) {
            throw new Error('Not authenticated. Please log in again.');
        }
        
        console.log('Fetching students from:', `${API_BASE_URL}/api/students/class/${encodeURIComponent(className)}`);
        const response = await fetch(`${API_BASE_URL}/api/students/class/${encodeURIComponent(className)}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (!response.ok) {
            let errorMessage = 'Failed to fetch students';
            try {
                const errorData = await response.json();
                errorMessage = errorData.message || errorMessage;
            } catch (e) {
                errorMessage = `HTTP ${response.status}: ${response.statusText}`;
            }
            throw new Error(errorMessage);
        }
        
        const data = await response.json();
        const students = Array.isArray(data) ? data : (data.data || data.students || []);
        
        console.log(`Fetched ${students.length} students for class ${className}`, students);
        
        // Update student dropdown
        reportStudentSelect.innerHTML = '<option value="">-- Select a student --</option>';
        
        if (students.length === 0) {
            const noStudentsOption = document.createElement('option');
            noStudentsOption.value = '';
            noStudentsOption.textContent = 'No students found in this class';
            reportStudentSelect.appendChild(noStudentsOption);
            reportStudentSelect.disabled = true;
            showAlert('No students found in the selected class.', 'warning');
            return [];
        }
        
        students.forEach(student => {
            const option = document.createElement('option');
            option.value = student._id || student.id;
            option.textContent = student.name || `Student ${student._id || student.id}`;
            reportStudentSelect.appendChild(option);
        });
        
        // Enable the student dropdown
        reportStudentSelect.disabled = false;
        console.log(`Successfully loaded ${students.length} students for class ${className}`);
        return students;
        
    } catch (error) {
        console.error('Error loading students for report card:', error);
        reportStudentSelect.innerHTML = '<option value="">Error loading students</option>';
        reportStudentSelect.disabled = true;
        
        const errorMessage = error.message || 'Failed to load students';
        showAlert(`Error: ${errorMessage}`, 'error');
        return [];
    }
}

// Helper function to calculate grade from marks
function calculateGradeFromMarks(marks) {
    const numericMarks = parseFloat(marks) || 0;
    if (numericMarks >= 70) return 'Exceed Expectation';
    if (numericMarks >= 50) return 'Meet Expectation';
    return 'Below Expectation';
}

// Helper function to get grade remarks (kept for backward compatibility)
function getGradeRemarks(grade) {
    // Since we're now using the full remark as grade, just return the grade
    return grade || 'N/A';
}

// Function to update the report card preview
function updateReportCardPreview(marksData) {
    console.log('=== updateReportCardPreview called ===');
    console.log('Marks data received:', marksData);
    
    try {
        // Update student info
        const studentSelect = document.getElementById('report-student');
        console.log('Student select element:', studentSelect);
        
        const studentName = studentSelect ? studentSelect.options[studentSelect.selectedIndex].text : 'N/A';
        console.log('Selected student name:', studentName);
        
        const studentNameElement = document.getElementById('student-name');
        console.log('Student name element:', studentNameElement);
        
        if (studentNameElement) {
            studentNameElement.textContent = studentName;
        } else {
            console.error('Student name element not found');
        }
        
        // Update class
        const classSelect = document.getElementById('class-select');
        if (classSelect) {
            document.getElementById('student-class').textContent = classSelect.options[classSelect.selectedIndex].text;
        }
        
        // Update term
        const termSelect = document.getElementById('report-term');
        if (termSelect) {
            document.getElementById('term-display').textContent = termSelect.value;
        }
        
        // Update marks table
        const marksTableBody = document.getElementById('marks-table-body');
        if (marksTableBody) {
            marksTableBody.innerHTML = '';
            
            if (marksData.subjects && (Array.isArray(marksData.subjects) ? marksData.subjects.length > 0 : Object.keys(marksData.subjects).length > 0)) {
                let totalMarks = 0;
                let subjectCount = 0;
                
                // Convert subjects to array if it's an object
                const subjectsArray = Array.isArray(marksData.subjects) 
                    ? marksData.subjects 
                    : Object.entries(marksData.subjects).map(([subject, data]) => ({
                        subject: subject,
                        marks: data.marks,
                        grade: data.grade,
                        remarks: data.remarks
                    }));
                
                console.log('Processed subjects array:', subjectsArray);
                
                // Process each subject
                subjectsArray.forEach(item => {
                    const row = document.createElement('tr');
                    
                    // Get subject name, defaulting to 'Subject N' if not available
                    const subjectName = item.subject || `Subject ${subjectCount + 1}`;
                    const marks = item.marks || item.mark; // Handle both marks and mark property
                    const grade = item.grade || (typeof marks === 'number' ? calculateGradeFromMarks(marks) : 'N/A');
                    
                    // Format the subject name for display
                    const formattedSubject = subjectName
                        .toString()
                        .replace(/-/g, ' ') // Replace hyphens with spaces
                        .replace(/\b(\w)/g, l => l.toUpperCase()) // Capitalize first letter of each word
                        .replace(/\s+/g, ' ') // Replace multiple spaces with single space
                        .trim();
                    
                    console.log(`Processing subject: ${formattedSubject}, marks: ${marks}, grade: ${grade}`);
                    
                    const subjectCell = document.createElement('td');
                    subjectCell.textContent = formattedSubject;
                    
                    const marksCell = document.createElement('td');
                    marksCell.textContent = marks !== undefined ? marks : 'N/A';
                    
                    const gradeCell = document.createElement('td');
                    gradeCell.textContent = grade;
                    
                    const remarksCell = document.createElement('td');
                    remarksCell.textContent = item.remarks || getGradeRemarks(grade);
                    
                    row.appendChild(subjectCell);
                    row.appendChild(marksCell);
                    row.appendChild(gradeCell);
                    row.appendChild(remarksCell);
                    
                    marksTableBody.appendChild(row);
                    
                    // Calculate total for average
                    if (typeof marks === 'number') {
                        totalMarks += marks;
                        subjectCount++;
                    } else if (typeof marks === 'string' && !isNaN(parseFloat(marks))) {
                        totalMarks += parseFloat(marks);
                        subjectCount++;
                    }
                });
                
                // Calculate and display average
                const average = subjectCount > 0 ? (totalMarks / subjectCount).toFixed(2) : 0;
                const averageGrade = calculateGradeFromMarks(average);
                
                // Update the summary section
                const totalMarksElement = document.getElementById('total-marks');
                const averageScoreElement = document.getElementById('average-score');
                const overallGradeElement = document.getElementById('overall-grade');
                const remarksElement = document.getElementById('teacher-remarks-preview');
                
                if (totalMarksElement) totalMarksElement.textContent = totalMarks.toFixed(2);
                if (averageScoreElement) averageScoreElement.textContent = `${average}%`;
                if (overallGradeElement) overallGradeElement.textContent = averageGrade;
                if (remarksElement) remarksElement.textContent = marksData.teacherRemarks || 'No remarks provided';
                
                // Show action buttons
                const downloadBtn = document.getElementById('download-pdf');
                const sendBtn = document.getElementById('send-to-student');
                const deleteBtn = document.getElementById('delete-report');
                
                if (downloadBtn) downloadBtn.style.display = 'inline-block';
                if (sendBtn) sendBtn.style.display = 'inline-block';
                if (deleteBtn) deleteBtn.style.display = 'inline-block';
                
            } else {
                marksTableBody.innerHTML = '<tr><td colspan="4" class="text-center">No marks data available</td></tr>';
            }
        }
        
        // Show the preview section
        const previewSection = document.querySelector('.preview-section');
        if (previewSection) {
            previewSection.style.display = 'block';
        }
        
    } catch (error) {
        console.error('Error updating report card preview:', error);
        showAlert('Failed to update report card preview. Please try again.', 'error');
    }
}

// Function to preview the report card
async function previewReportCard(event) {
    console.log('=== previewReportCard called ===');
    
    // Prevent default form submission if any
    if (event) event.preventDefault();
    
    console.log('Event target:', event ? event.target : 'no event');
    
    try {
        // Get selected values
        const studentSelect = document.getElementById('report-student');
        const termSelect = document.getElementById('report-term');
        const classSelect = document.getElementById('report-class');
        
        console.log('Form elements:', {
            studentSelect: studentSelect ? 'found' : 'not found',
            termSelect: termSelect ? 'found' : 'not found',
            classSelect: classSelect ? 'found' : 'not found',
            studentValue: studentSelect ? studentSelect.value : 'N/A',
            termValue: termSelect ? termSelect.value : 'N/A',
            classValue: classSelect ? classSelect.value : 'N/A'
        });
        
        if (!studentSelect || !termSelect || !classSelect) {
            const errorMsg = 'Required form elements not found. Please refresh the page and try again.';
            console.error(errorMsg, {studentSelect, termSelect, classSelect});
            showAlert(errorMsg, 'error');
            return;
        }
        
        const studentId = studentSelect.value.trim();
        const term = termSelect.value.trim();
        const className = classSelect.value.trim();

        console.log('Form values:', {studentId, term, className});

        // Validate selections
        if (!studentId) {
            const msg = 'Please select a student';
            console.warn(msg);
            showAlert(msg, 'error');
            return;
        }
        if (!term) {
            const msg = 'Please select a term';
            console.warn(msg);
            showAlert(msg, 'error');
            return;
        }
        if (!className) {
            const msg = 'Please select a class first';
            console.warn(msg);
            showAlert(msg, 'error');
            return;
        }
        
        console.log('All validations passed, proceeding to load marks...');

        // Show loading state
        const generateBtn = document.getElementById('generate-report-card');
        if (!generateBtn) {
            console.error('Generate button not found');
            return;
        }
        
        const originalBtnText = generateBtn.innerHTML;
        generateBtn.disabled = true;
        generateBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Generating...';
        
        // Show loading state in the preview section
        const marksTableBody = document.getElementById('marks-table-body');
        if (marksTableBody) {
            marksTableBody.innerHTML = '<tr><td colspan="4" class="text-center">Loading report card...</td></tr>';
        }
        
        try {
            // Try to load from localStorage first
            const marksKey = `marks-${studentId}-${term}`;
            let marksData = localStorage.getItem(marksKey);
            let loadedFromCache = true;
            
            // If not in localStorage, try to fetch from API
            if (!marksData) {
                console.log('No marks found in localStorage, fetching from API...');
                const token = localStorage.getItem('token');
                if (!token) throw new Error('Not authenticated');
                
                // First, try to get the report card which includes marks by term
                const reportCardResponse = await fetch(`${API_BASE_URL}/api/marks/report-card/${studentId}`, {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                });
                
                if (!reportCardResponse.ok) {
                    // If report card endpoint fails, try the basic marks endpoint
                    console.log('Report card endpoint failed, trying basic marks endpoint...');
                    const marksResponse = await fetch(`${API_BASE_URL}/api/marks/student/${studentId}`, {
                        headers: {
                            'Authorization': `Bearer ${token}`,
                            'Content-Type': 'application/json'
                        }
                    });
                    
                    if (!marksResponse.ok) {
                        const error = await marksResponse.json().catch(() => ({}));
                        throw new Error(error.message || 'Failed to fetch marks');
                    }
                    
                    marksData = await marksResponse.json();
                    // Filter marks by the selected term if needed
                    if (marksData && marksData.marks) {
                        marksData.marks = marksData.marks.filter(mark => mark.term === term);
                    }
                    return marksData;
                }
                
                // If we get here, we have a successful report card response
                const reportCardData = await reportCardResponse.json();
                // If the report card has term-specific data, filter by the selected term
                if (reportCardData.terms && reportCardData.terms[term]) {
                    marksData = reportCardData.terms[term];
                } else {
                    marksData = reportCardData;
                }
                loadedFromCache = false;
                
                // Save to localStorage for future use
                localStorage.setItem(marksKey, JSON.stringify(marksData));
            } else {
                // Parse the marks data from cache
                marksData = JSON.parse(marksData);
            }
            
            console.log(loadedFromCache ? 'Loaded marks from localStorage:' : 'Fetched marks from API:', marksData);
            
            // Log the marks data structure for debugging
            console.log('Marks data structure:', marksData);
            console.log('Marks data keys:', Object.keys(marksData));
            if (marksData && marksData.subjects) {
                console.log('Subjects data:', marksData.subjects);
                console.log('Subjects keys:', Object.keys(marksData.subjects));
            }
            
            // Update the report card preview
            updateReportCardPreview(marksData);
            showAlert('Report card generated successfully', 'success');
            
        } catch (error) {
            console.error('Error loading marks:', error);
            showAlert(`Failed to load marks: ${error.message || 'Please try again later'}`, 'error');
            
            // Clear the loading state in the table
            if (marksTableBody) {
                marksTableBody.innerHTML = '<tr><td colspan="4" class="text-center text-danger">Failed to load marks. Please try again.</td></tr>';
            }
        } finally {
            // Restore the button state
            if (generateBtn) {
                generateBtn.disabled = false;
                generateBtn.innerHTML = originalBtnText;
            }
        }
    } catch (error) {
        console.error('Error in previewReportCard:', error);
        showAlert('An unexpected error occurred. Please check the console for details.', 'error');
    }
}

// Function to initialize tab switching
function initializeTabSwitching() {
    console.log('Initializing tab switching...');
    const tabButtons = document.querySelectorAll('.tab-btn');
    const tabPanes = document.querySelectorAll('.tab-pane');
    
    console.log(`Found ${tabButtons.length} tab buttons and ${tabPanes.length} tab panes`);
    
    // Add click event to each tab button
    tabButtons.forEach(button => {
        console.log(`Adding click handler for tab button with data-tab: ${button.getAttribute('data-tab')}`);
        button.addEventListener('click', function() {
            console.log(`Tab button clicked: ${this.textContent}`);
            
            // Remove active class from all buttons and hide all panes
            tabButtons.forEach(btn => {
                btn.classList.remove('active');
                btn.style.borderBottom = '1px solid #ddd';
                btn.style.background = '#f8f9fa';
            });
            
            tabPanes.forEach(pane => {
                console.log(`Hiding pane: ${pane.id}`);
                pane.style.display = 'none';
            });
            
            // Add active class to clicked button and style it
            this.classList.add('active');
            this.style.borderBottom = '2px solid #007bff';
            this.style.background = '#fff';
            
            // Show the corresponding tab pane
            const targetTab = this.getAttribute('data-tab');
            console.log(`Target tab: ${targetTab}`);
            const targetPane = document.getElementById(targetTab);
            
            if (targetPane) {
                console.log(`Showing tab pane: ${targetTab}`);
                targetPane.style.display = 'block';
                
                // If we're switching to the report card tab, load classes
                if (targetTab === 'report-card-tab') {
                    console.log('Switched to report card tab, loading classes...');
                    loadClassesForReportCard();
                }
            } else {
                console.error(`Could not find target tab pane with id: ${targetTab}`);
            }
        });
    });
    
    // Add event listener for class selection change in report card tab
    document.addEventListener('change', function(e) {
        if (e.target && e.target.id === 'report-class') {
            const className = e.target.value;
            console.log('Class selected in report card tab:', className);
            loadStudentsForReportCard(className);
        }
    });
    
    // Activate the first tab by default if none are active
    if (tabButtons.length > 0) {
        const activeTab = document.querySelector('.tab-btn.active');
        if (activeTab) {
            console.log('Found active tab, clicking it to initialize');
            activeTab.click();
        } else {
            console.log('No active tab found, activating first tab');
            tabButtons[0].click();
        }
    } else {
        console.error('No tab buttons found for initialization');
    }
    
    console.log('Tab switching initialization complete');
}
async function deleteReportCard() {
    console.log('Delete report card function called');
    
    let deleteBtn;
    let originalBtnText;
    
    try {
        // Get form elements
        const studentSelect = document.getElementById('report-student');
        const termSelect = document.getElementById('report-term');
        const classSelect = document.getElementById('report-class');
        deleteBtn = document.getElementById('confirmDeleteBtn');
        
        console.log('Form elements:', { 
            studentSelect: studentSelect ? 'found' : 'not found', 
            termSelect: termSelect ? 'found' : 'not found', 
            classSelect: classSelect ? 'found' : 'not found',
            deleteBtn: deleteBtn ? 'found' : 'not found'
        });
        
        // Validate form elements exist
        if (!studentSelect || !termSelect || !classSelect || !deleteBtn) {
            const missingElements = [];
            if (!studentSelect) missingElements.push('student select');
            if (!termSelect) missingElements.push('term select');
            if (!classSelect) missingElements.push('class select');
            if (!deleteBtn) missingElements.push('delete button');
            
            const errorMsg = `Required elements not found: ${missingElements.join(', ')}`;
            console.error(errorMsg);
            showAlert('Error: Could not find required page elements', 'error');
            return;
        }
        
        // Get form values
        const studentId = studentSelect.value.trim();
        const term = termSelect.value.trim();
        const className = classSelect.value.trim();
        
        console.log('Form values:', { studentId, term, className });
        
        // Validate form values
        if (!studentId || !term || !className) {
            const missingFields = [];
            if (!studentId) missingFields.push('student');
            if (!term) missingFields.push('term');
            if (!className) missingFields.push('class');
            
            console.error('Missing required fields:', missingFields);
            showAlert(`Please select ${missingFields.join(', ')}`, 'error');
            return;
        }
        
        // Disable the delete button and show loading state
        originalBtnText = deleteBtn.innerHTML;
        deleteBtn.disabled = true;
        deleteBtn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Deleting...';
    
        const token = localStorage.getItem('token');
        if (!token) {
            console.error('No authentication token found');
            throw new Error('Not authenticated');
        }
        
        // Get current academic year
        const currentYear = new Date().getFullYear();
        const academicYear = `${currentYear}-${currentYear + 1}`;
        
        const url = `${API_BASE_URL}/api/marks/${studentId}/term/${encodeURIComponent(term)}?academicYear=${encodeURIComponent(academicYear)}`;
        console.log('Making DELETE request to:', url);
        
        // Call the delete endpoint
        const response = await fetch(url, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        console.log('Delete response status:', response.status);
        
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            console.error('Delete failed:', errorData);
            throw new Error(errorData.message || 'Failed to delete report card');
        }
        
        // Show success message
        showAlert('Report card deleted successfully', 'success');
        
        // Reset the form
        if (studentSelect) studentSelect.value = '';
        if (termSelect) termSelect.value = '';
        if (classSelect) classSelect.value = '';
        
        // Hide the preview
        const previewContainer = document.getElementById('report-card-preview');
        if (previewContainer) {
            previewContainer.style.display = 'none';
        }
        // Hide action buttons
        const downloadBtn = document.getElementById('download-pdf');
        const sendBtn = document.getElementById('send-to-student');
        const deleteReportBtn = document.getElementById('delete-report');
        
        if (downloadBtn) downloadBtn.style.display = 'none';
        if (sendBtn) sendBtn.style.display = 'none';
        if (deleteReportBtn) deleteReportBtn.style.display = 'none';
        
        // Hide the modal
        const modal = document.getElementById('confirmDeleteModal');
        if (modal) {
            modal.style.display = 'none';
            document.body.style.overflow = ''; // Re-enable scrolling
        }
    } catch (error) {
        console.error('Error in deleteReportCard:', error);
        showAlert(error.message || 'Failed to delete report card', 'error');
    } finally {
        // Restore the delete button
        if (deleteBtn) {
            deleteBtn.disabled = false;
            deleteBtn.innerHTML = originalBtnText;
        }
    }
}

// Initialize the report card system when the page loads
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM fully loaded, initializing report card system...');
    
    // Initialize tab switching
    initializeTabSwitching();
    
    // Debug: Log all elements with ID containing 'delete'
    console.log('Debug: Elements with ID containing "delete":', 
        Array.from(document.querySelectorAll('[id*="delete"]')).map(el => ({
            id: el.id,
            tagName: el.tagName,
            classList: Array.from(el.classList)
        }))
    );
    
    // Modal elements
    const modal = document.getElementById('confirmDeleteModal');
    const deleteReportBtn = document.getElementById('delete-report');
    const closeModalBtn = document.getElementById('closeDeleteModal');
    const cancelDeleteBtn = document.getElementById('cancelDeleteBtn');
    const confirmDeleteBtn = document.getElementById('confirmDeleteBtn');

    // Function to show modal
    function showModal() {
        if (modal) {
            modal.style.display = 'block';
            document.body.style.overflow = 'hidden'; // Prevent scrolling
            // Focus trap for accessibility
            modal.setAttribute('aria-hidden', 'false');
        }
    }

    // Function to hide modal
    function hideModal() {
        if (modal) {
            modal.style.display = 'none';
            document.body.style.overflow = ''; // Re-enable scrolling
            modal.setAttribute('aria-hidden', 'true');
        }
    }

    // Handle delete report button click
    if (deleteReportBtn) {
        deleteReportBtn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            showModal();
        });
    }

    // Handle close button
    if (closeModalBtn) {
        closeModalBtn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            hideModal();
        });
    }

    // Handle cancel button
    if (cancelDeleteBtn) {
        cancelDeleteBtn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            hideModal();
        });
    }

    // Handle confirm delete button
    if (confirmDeleteBtn) {
        confirmDeleteBtn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            deleteReportCard();
            hideModal();
        });
    }

    // Close modal when clicking outside content
    if (modal) {
        modal.addEventListener('click', function(e) {
            if (e.target === modal) {
                hideModal();
            }
        });
    }

    // Close on Escape key
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && modal && modal.style.display === 'block') {
            hideModal();
        }
    });
    
    // Add event listener to class select to load students when class changes
    const classSelect = document.getElementById('marks-class');
    if (classSelect) {
        classSelect.addEventListener('change', function() {
            const className = this.value;
            if (className) {
                loadStudentsForReportCard(className);
            }
        });
        
        // If there's a class already selected, load its students
        if (classSelect.value) {
            console.log('Initializing with current class:', classSelect.value);
            loadStudentsForReportCard(classSelect.value);
        } else {
            console.log('No class selected initially');
        }
    } else {
        console.error('Class select element not found');
    }
    
    // Add event listener to generate button
    const generateBtn = document.getElementById('generate-report-card');
    if (generateBtn) {
        console.log('Generate button found, adding click event listener');
        generateBtn.addEventListener('click', function(e) {
            console.log('Generate button clicked');
            previewReportCard(e);
        });
    } else {
        console.error('Generate report card button not found');
    }
    
    console.log('Report card system initialization complete');
});
