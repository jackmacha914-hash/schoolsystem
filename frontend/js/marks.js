// API base URL
const API_BASE_URL = 'http://localhost:3000';

// Global variables
let marksModal, classSelect, marksContainer, generateReportBtn, saveMarksBtn, cancelMarksBtn, openMarksModalBtn, closeModalBtn, reportCardPreview, printReportBtn, studentSelect;

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
    
    console.log('DOM elements initialized');
}

// Function to check for CSS conflicts
function checkForCssConflicts() {
    console.group('🔍 Checking for CSS Conflicts');
    
    try {
        // Check for any CSS that might be hiding the select
        const allStyles = document.styleSheets;
        let conflictingRules = [];
        
        for (let i = 0; i < allStyles.length; i++) {
            try {
                const rules = allStyles[i].cssRules || [];
                for (let j = 0; j < rules.length; j++) {
                    const rule = rules[j];
                    if (rule.selectorText && 
                        (rule.selectorText.includes('#student-select') || 
                         rule.selectorText.includes('.modal select') ||
                         rule.selectorText.includes('select[disabled]') ||
                         rule.selectorText.includes('select:disabled'))) {
                        console.log(`Found rule: ${rule.selectorText}`, rule.style);
                        conflictingRules.push({
                            selector: rule.selectorText,
                            styles: rule.style
                        });
                    }
                }
            } catch (e) {
                // Skip cross-origin stylesheets
                console.log(`⚠️ Could not access stylesheet ${i}:`, e.message);
            }
        }
        
        if (conflictingRules.length > 0) {
            console.log('⚠️ Found potentially conflicting CSS rules:', conflictingRules);
        } else {
            console.log('✅ No conflicting CSS rules found');
        }
        
        // Check for any inline styles on the select
        const select = document.getElementById('student-select');
        if (select) {
            console.log('ℹ️ Inline styles on select:', select.getAttribute('style'));
            
            // Check for any parent elements that might be hiding the select
            let current = select.parentElement;
            let depth = 0;
            const maxDepth = 5;
            
            while (current && depth < maxDepth) {
                const display = window.getComputedStyle(current).display;
                const visibility = window.getComputedStyle(current).visibility;
                const opacity = window.getComputedStyle(current).opacity;
                const position = window.getComputedStyle(current).position;
                const zIndex = window.getComputedStyle(current).zIndex;
                
                if (display === 'none' || visibility === 'hidden' || opacity === '0') {
                    console.warn(`⚠️ Parent element might be hiding the select:`, {
                        tag: current.tagName,
                        id: current.id,
                        class: current.className,
                        display,
                        visibility,
                        opacity,
                        position,
                        zIndex
                    });
                }
                
                current = current.parentElement;
                depth++;
            }
        }
        
    } catch (error) {
        console.error('❌ Error checking for CSS conflicts:', error);
    }
    
    console.groupEnd();
}

// Test function to check student selection elements
function testStudentSelection() {
    console.group('🛠️ Testing Student Selection Elements');
    
    try {
        // Check if modal exists
        const modal = document.getElementById('studentSelectionModal');
        console.log('✅ Modal exists:', !!modal);
        
        if (modal) {
            const modalStyle = window.getComputedStyle(modal);
            console.log('ℹ️ Modal display:', modalStyle.display);
            console.log('ℹ️ Modal visibility:', modalStyle.visibility);
            console.log('ℹ️ Modal opacity:', modalStyle.opacity);
            console.log('ℹ️ Modal position:', modalStyle.position);
            console.log('ℹ️ Modal z-index:', modalStyle.zIndex);
            
            // Force show the modal with important styles
            modal.style.display = 'flex';
            modal.style.visibility = 'visible';
            modal.style.opacity = '1';
            modal.style.position = 'fixed';
            modal.style.zIndex = '9999';
            modal.style.top = '0';
            modal.style.left = '0';
            modal.style.width = '100%';
            modal.style.height = '100%';
            modal.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
            modal.style.alignItems = 'center';
            modal.style.justifyContent = 'center';
            modal.style.padding = '2rem';
            modal.style.overflowY = 'auto';
            
            console.log('ℹ️ Modal styles updated');
        }
        
        // Check if select exists
        const select = document.getElementById('student-select');
        console.log('✅ Select exists:', !!select);
        
        if (select) {
            const selectStyle = window.getComputedStyle(select);
            console.log('ℹ️ Select display:', selectStyle.display);
            console.log('ℹ️ Select visibility:', selectStyle.visibility);
            console.log('ℹ️ Select opacity:', selectStyle.opacity);
            console.log('ℹ️ Select disabled:', select.disabled);
            console.log('ℹ️ Select width:', selectStyle.width);
            console.log('ℹ️ Select height:', selectStyle.height);
            
            // Make select visible and enabled for testing
            select.style.display = 'block';
            select.style.visibility = 'visible';
            select.style.opacity = '1';
            select.style.position = 'static';
            select.style.width = '100%';
            select.style.padding = '0.875rem 1.25rem';
            select.style.fontSize = '1.1rem';
            select.style.border = '2px solid #4a90e2';
            select.style.borderRadius = '8px';
            select.style.backgroundColor = '#fff';
            select.style.color = '#1a1a1a';
            select.style.transition = 'all 0.2s ease-in-out';
            select.style.webkitAppearance = 'menulist';
            select.style.mozAppearance = 'menulist';
            select.style.appearance = 'menulist';
            select.disabled = false;
            
            // Force a reflow to ensure styles are applied
            void select.offsetHeight;
            
            console.log('ℹ️ Select styles updated');
            
            // Add test options if none exist
            if (select.options.length <= 1) {  // Only default option exists
                console.log('ℹ️ Adding test options to select');
                const testStudents = [
                    { id: 'test1', name: 'Test Student 1', class: 'Form 1' },
                    { id: 'test2', name: 'Test Student 2', class: 'Form 2' },
                    { id: 'test3', name: 'Test Student 3', class: 'Form 3' }
                ];
                
                testStudents.forEach(student => {
                    const option = document.createElement('option');
                    option.value = student.id;
                    option.textContent = `${student.name} (${student.class})`;
                    select.appendChild(option);
                });
            }
        } else {
            console.error('❌ Student select element not found');
            
            // Try to create a test select if it doesn't exist
            const modalContent = modal ? modal.querySelector('.modal-content') : null;
            if (modalContent) {
                console.log('⚠️ Creating a test select element');
                const testSelect = document.createElement('select');
                testSelect.id = 'test-student-select';
                testSelect.className = 'form-select form-select-lg';
                testSelect.style.width = '100%';
                testSelect.style.padding = '0.875rem 1.25rem';
                testSelect.style.fontSize = '1.1rem';
                testSelect.style.border = '2px solid #4a90e2';
                testSelect.style.borderRadius = '8px';
                testSelect.style.backgroundColor = '#fff';
                
                const defaultOption = document.createElement('option');
                defaultOption.value = '';
                defaultOption.textContent = '-- Test Select --';
                defaultOption.disabled = true;
                defaultOption.selected = true;
                testSelect.appendChild(defaultOption);
                
                const testStudents = [
                    { id: 'test1', name: 'Test Student 1', class: 'Form 1' },
                    { id: 'test2', name: 'Test Student 2', class: 'Form 2' },
                    { id: 'test3', name: 'Test Student 3', class: 'Form 3' }
                ];
                
                testStudents.forEach(student => {
                    const option = document.createElement('option');
                    option.value = student.id;
                    option.textContent = `${student.name} (${student.class})`;
                    testSelect.appendChild(option);
                });
                
                modalContent.insertBefore(testSelect, modalContent.firstChild);
                console.log('✅ Created test select element');
            }
        }
    } catch (error) {
        console.error('❌ Error in testStudentSelection:', error);
    } finally {
        console.groupEnd();
    }
}

document.addEventListener('DOMContentLoaded', async function() {
    // Run the test function immediately
    testStudentSelection();
    
    // Import API configuration
    const API_BASE_URL = 'http://localhost:5000';
    
    // Add event listener for the 'Add New Mark' button
    const openMarksModalBtn = document.getElementById('open-marks-modal');
    const marksModal = document.getElementById('marks-modal');
    const closeMarksModalBtn = document.querySelector('.close-modal');
    
    if (openMarksModalBtn && marksModal) {
        openMarksModalBtn.addEventListener('click', () => {
            console.log('Opening marks modal');
            marksModal.style.display = 'block';
        });
        
        if (closeMarksModalBtn) {
            closeMarksModalBtn.addEventListener('click', () => {
                marksModal.style.display = 'none';
            });
        }
        
        // Close modal when clicking outside the modal content
        window.addEventListener('click', (e) => {
            if (e.target === marksModal) {
                marksModal.style.display = 'none';
            }
        });
    }
    
    // DOM Elements
    const studentSelect = document.getElementById('student-select');
    const classFilter = document.getElementById('class-filter');
    const studentModal = document.getElementById('studentSelectionModal');
    const closeBtn = document.getElementById('closeStudentModal');
    const selectBtn = document.getElementById('select-student-btn');
    const cancelBtn = document.getElementById('cancel-student-select');
    
    // Sample subjects - In a real app, this would come from your backend
    const subjects = [
        'Mathematics', 'English', 'Kiswahili', 'Physics', 'Chemistry', 
        'Biology', 'History', 'Geography', 'CRE', 'Computer Studies', 'Business', 'Agriculture'
    ];

    let students = [];
    let selectedStudent = null;
    
    // Event Listeners
    if (closeBtn) closeBtn.addEventListener('click', closeStudentModal);
    if (selectBtn) selectBtn.addEventListener('click', handleStudentSelect);
    if (cancelBtn) cancelBtn.addEventListener('click', closeStudentModal);
    
    // Add click event listener to the test button
    const testBtn = document.getElementById('test-select-btn');
    if (testBtn) {
        testBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            console.clear(); // Clear console for fresh output
            console.log('🔍 Running student selection test...');
            
            // Run all diagnostic tests
            checkForCssConflicts();
            testStudentSelection();
            
            // Force show the modal if it's hidden
            const modal = document.getElementById('studentSelectionModal');
            if (modal) {
                modal.style.display = 'flex';
                modal.style.visibility = 'visible';
                modal.style.opacity = '1';
            }
            
            // Force enable and show the select
            const select = document.getElementById('student-select');
            if (select) {
                select.disabled = false;
                select.style.display = 'block';
                select.style.visibility = 'visible';
                select.style.opacity = '1';
                select.style.position = 'static';
                select.focus();
            }
            
            console.log('✅ Tests completed. Check the console for details.');
            
            // Show a visual indicator
            const indicator = document.createElement('div');
            indicator.textContent = '✅ Tests completed. Check console (F12)';
            indicator.style.position = 'fixed';
            indicator.style.top = '10px';
            indicator.style.right = '10px';
            indicator.style.backgroundColor = '#4CAF50';
            indicator.style.color = 'white';
            indicator.style.padding = '10px';
            indicator.style.borderRadius = '4px';
            indicator.style.zIndex = '99999';
            document.body.appendChild(indicator);
            
            // Remove the indicator after 5 seconds
            setTimeout(() => {
                indicator.remove();
            }, 5000);
        });
        
        console.log('✅ Added click listener to test button');
    } else {
        console.warn('⚠️ Test button not found');
    }
    
    // Add event listeners to both select student buttons
    document.querySelectorAll('#select-student-btn, #select-student-btn-2').forEach(btn => {
        if (btn) {
            btn.addEventListener('click', (e) => {
                console.log('Select student button clicked');
                e.stopPropagation();
                console.log('Student select element exists:', !!document.getElementById('student-select'));
                console.log('Student modal exists:', !!document.getElementById('studentSelectionModal'));
                openStudentModal();
            });
        } else {
            console.error('Button not found');
        }
    });
    
    // Also log when the modal is opened through other means
    const modal = document.getElementById('studentSelectionModal');
    if (modal) {
        modal.addEventListener('show.bs.modal', function() {
            console.log('Modal shown event triggered');
            console.log('Student select element exists:', !!document.getElementById('student-select'));
        });
    }
    
    // Close modal when clicking outside the modal content
    window.addEventListener('click', (e) => {
        if (e.target === studentModal) {
            closeStudentModal();
        }
    });

    // Initialize the application
    async function initApp() {
        try {
            console.log('Initializing application...');
            
            // Initialize DOM elements first
            initializeElements();
            
            // Then initialize the form to set up event listeners
            initializeForm();
            
            // Fetch students from the backend
            await fetchStudents();
            
            // Render subject inputs
            renderSubjectInputs();
            
            console.log('Application initialized successfully');
            
        } catch (error) {
            console.error('Error initializing application:', error);
        }
    }
    
    // Fetch students from the backend
    async function fetchStudents() {
        console.group('Fetching Students');
        
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
            
            // Ensure we have an array and filter for students if needed
            let students = Array.isArray(data) ? data : [];
            
            // If the first item has a role property, filter for students
            if (students.length > 0 && students[0].role) {
                console.log('Filtering for student role...');
                students = students.filter(student => {
                    const isStudent = student.role === 'student';
                    if (!isStudent) {
                        console.log(`Skipping non-student:`, student);
                    }
                    return isStudent;
                });
            }
            
            console.log(`Found ${students.length} students`);
            return students;
            
        } catch (error) {
            console.error('Error in fetchStudents:', error);
            return [];
        } finally {
            console.groupEnd();
        }
    }
    
    // Update student dropdown with the provided students
    function updateStudentDropdown(students) {
        if (!studentSelect) {
            console.warn('Student select element not found');
            return;
        }
        
        // Save the current selection
        const currentStudentId = studentSelect.value;
        
        // Clear existing options except the first one
        while (studentSelect.options.length > 1) {
            studentSelect.remove(1);
        }
        
        // Add actual students if any
        if (students && students.length > 0) {
            students.forEach(student => {
                const option = document.createElement('option');
                option.value = student._id || student.id;
                option.textContent = `${student.name} (${student.class || 'No Class'})`;
                studentSelect.appendChild(option);
            });
            
            // Restore selection if it still exists
            if (currentStudentId && students.some(s => (s._id === currentStudentId) || (s.id === currentStudentId))) {
                studentSelect.value = currentStudentId;
            }
            
            // Enable the select
            studentSelect.disabled = false;
        } else {
            // Disable the select if no students
            studentSelect.disabled = true;
            
            // Add a disabled option
            const noStudentsOption = document.createElement('option');
            noStudentsOption.value = '';
            noStudentsOption.textContent = 'No students found';
            noStudentsOption.disabled = true;
            noStudentsOption.selected = true;
            studentSelect.appendChild(noStudentsOption);
        }
    }

    // DOM Elements are now initialized in the initializeElements() function

    // Simple function to filter students by class
    function filterStudentsByClass() {
        const selectedClass = classSelect ? classSelect.value : '';
        if (!selectedClass) return;
        
        console.log(`Filtering students by class: ${selectedClass}`);
        // Add your filtering logic here
    }
    
    // Initialize the form and set up event listeners
    function initializeForm() {
        console.log('Initializing form...');
        
        // Make sure all required elements exist
        if (!marksModal) {
            console.error('Marks modal not found in the DOM');
        }

        const data = await response.json();
        console.log('Fetched students data:', data);
        
        // Ensure we have an array and filter for students if needed
        let students = Array.isArray(data) ? data : [];
        
        // If the first item has a role property, filter for students
        if (students.length > 0 && students[0].role) {
            console.log('Filtering for student role...');
            students = students.filter(student => {
                const isStudent = student.role === 'student';
                if (!isStudent) {
                    console.log(`Skipping non-student:`, student);
                    return false;
                }
                return true;
            });
        }
        
        // Initialize close modal button
        if (closeModalBtn) {
            closeModalBtn.addEventListener('click', closeMarksModal);
        } else {
            console.warn('closeModalBtn not found');
        }
        
        // Initialize cancel button
        if (cancelMarksBtn) {
            cancelMarksBtn.addEventListener('click', closeMarksModal);
        } else {
            console.warn('cancelMarksBtn not found');
        }
            
            // Class selection change
            if (classSelect) {
                classSelect.addEventListener('change', filterStudentsByClass);
                
                // Trigger change event to load initial students
                setTimeout(() => {
                    classSelect.dispatchEvent(new Event('change'));
                }, 100);
            } else {
                console.warn('classSelect not found');
            }
            
            // Generate report button
            if (generateReportBtn) {
                generateReportBtn.addEventListener('click', generateReportCard);
            } else {
                console.warn('generateReportBtn not found');
            }
            
            // Print report button
            if (printReportBtn) {
                printReportBtn.addEventListener('click', printReportCard);
            } else {
                console.warn('printReportBtn not found');
            }
            
            // Save marks button
            if (saveMarksBtn) {
                saveMarksBtn.addEventListener('click', saveMarks);
            } else {
                console.warn('saveMarksBtn not found');
            }
            
            // Close modal when clicking outside the modal content
            marksModal.addEventListener('click', (e) => {
                if (e.target === marksModal) {
                    closeMarksModal();
                }
            });
            
            console.log('Form initialization complete');
            
        } catch (error) {
            console.error('Error initializing form:', error);
        }
    }
    
    // Open marks modal
    function openMarksModal() {
        console.log('Opening marks modal...');
        
        // Make sure the modal exists
        if (!marksModal) {
            console.error('Marks modal not found in the DOM');
            return;
        }
        
        try {
            // Reset the form
            console.log('Resetting form...');
            resetForm();
            
            // Show the modal
            console.log('Showing modal...');
            marksModal.style.display = 'block';
            document.body.style.overflow = 'hidden'; // Prevent scrolling
            
            // Always render subjects when opening the modal
            console.log('Rendering subjects...');
            renderSubjectInputs();
            
            // Log the container state for debugging
            const container = document.getElementById('marks-container');
            if (container) {
                console.log('Marks container found, child count:', container.children.length);
                console.log('Marks container HTML:', container.innerHTML);
            } else {
                console.error('Marks container not found in DOM');
            }
            
            // Log all the buttons for debugging
            console.log('Save button:', saveMarksBtn);
            console.log('Generate report button:', generateReportBtn);
            console.log('Cancel button:', cancelMarksBtn);
            
        } catch (error) {
            console.error('Error opening marks modal:', error);
        }
    }
    
    // Close marks modal
    function closeMarksModal() {
        console.log('Closing marks modal...');
        
        // Make sure the modal exists
        if (!marksModal) {
            console.error('Marks modal not found when trying to close');
            return;
        }
        
        try {
            // Hide the modal
            console.log('Hiding modal...');
            marksModal.style.display = 'none';
            document.body.style.overflow = 'auto'; // Re-enable scrolling
            
            console.log('Modal closed');
        } catch (error) {
            console.error('Error closing marks modal:', error);
        }
    }
    
    // Reset form fields
    function resetForm() {
        // Find any form that might be related to marks
        const marksForm = document.getElementById('marks-entry-form') || document.getElementById('marks-form');
        if (marksForm) {
            marksForm.reset();
        }
        
        // Only reset the student select if it exists and is not the main student selection
        if (studentSelect && studentSelect.id !== 'student-select') {
            studentSelect.innerHTML = '<option value="">-- Select Class First --</option>';
            studentSelect.disabled = true;
        }
        
        // Reset any mark inputs
        document.querySelectorAll('.mark-input').forEach(input => {
            input.value = '';
            input.classList.remove('is-invalid');
        });
        
        // Clear any error messages
        const errorElements = document.querySelectorAll('.error-message');
        errorElements.forEach(el => el.remove());
    }

    // Populate student dropdown with all students
    function populateStudentDropdown() {
        console.group('📋 Populating Student Dropdown');
        
        try {
            // Use the existing studentSelect from the outer scope
            if (!studentSelect) {
                const errorMsg = '❌ Student select element not found in the DOM';
                console.error(errorMsg);
                throw new Error(errorMsg);
            }
            
            console.log('✅ Student select element found:', studentSelect);
            
            // Make sure the select is visible and enabled
            studentSelect.style.display = 'block';
            studentSelect.style.visibility = 'visible';
            studentSelect.style.opacity = '1';
            studentSelect.disabled = false;
            
            // Clear existing options
            console.log('ℹ️ Clearing existing options');
            studentSelect.innerHTML = '';
            
            // Add default option
            const defaultOption = document.createElement('option');
            defaultOption.value = '';
            defaultOption.textContent = '-- Select a student --';
            defaultOption.disabled = true;
            defaultOption.selected = true;
            studentSelect.appendChild(defaultOption);
            
            if (!Array.isArray(students) || students.length === 0) {
                const warningMsg = '⚠️ No students available to display';
                console.warn(warningMsg);
                
                const option = document.createElement('option');
                option.value = '';
                option.textContent = 'No students available';
                option.disabled = true;
                studentSelect.appendChild(option);
                
                // Keep it enabled but with no options
                studentSelect.disabled = false; 
                
                // Show a more visible warning
                showError('No students found. Please check if students are properly registered.');
                
                return;
            }
            
            console.log(`ℹ️ Adding ${students.length} students to dropdown`);
            
            // Sort students by name for better UX
            const sortedStudents = [...students].sort((a, b) => {
                const nameA = (a.name || '').toLowerCase();
                const nameB = (b.name || '').toLowerCase();
                return nameA.localeCompare(nameB);
            });
            
            // Track if we have any valid students
            let validStudents = 0;
            
            // Add each student as an option
            sortedStudents.forEach((student, index) => {
                try {
                    if (!student || (typeof student !== 'object')) {
                        console.warn(`Skipping invalid student at index ${index}:`, student);
                        return;
                    }
                    
                    const studentId = student._id || student.id;
                    const studentName = student.name || `Student ${index + 1}`;
                    const studentClass = student.class || student.grade || '';
                    
                    if (!studentId) {
                        console.warn(`Skipping student with missing ID at index ${index}:`, student);
                        return;
                    }
                    
                    const option = document.createElement('option');
                    option.value = studentId;
                    option.textContent = studentClass ? `${studentName} (${studentClass})` : studentName;
                    option.dataset.studentData = JSON.stringify(student);
                    
                    // Add additional data as data attributes if needed
                    if (student.email) option.dataset.email = student.email;
                    if (student.class) option.dataset.class = student.class;
                    
                    studentSelect.appendChild(option);
                    validStudents++;
                    
                } catch (error) {
                    console.error(`Error processing student at index ${index}:`, error, student);
                }
            });
            
            if (validStudents === 0) {
                console.warn('⚠️ No valid students found in the data');
                const option = document.createElement('option');
                option.value = '';
                option.textContent = 'No valid students found';
                option.disabled = true;
                studentSelect.appendChild(option);
                
                showError('No valid student records found. Please check the data.');
            } else {
                console.log(`✅ Successfully added ${validStudents} students to dropdown`);
                
                // If there's only one student, select it by default
                if (validStudents === 1) {
                    studentSelect.selectedIndex = 1; // Skip the default option
                    console.log('Auto-selected the only available student');
                }
            }
            
            // Ensure the select is visible and interactive
            studentSelect.style.opacity = '1';
            studentSelect.style.pointerEvents = 'auto';
            
            // Clear any previous error messages
            const errorMsg = document.getElementById('student-select-error');
            if (errorMsg) {
                errorMsg.textContent = '';
                errorMsg.style.display = 'none';
                console.log('ℹ️ Cleared previous error messages');
            }
            
        } catch (error) {
            console.error('❌ Error in populateStudentDropdown:', error);
            
            // Show error to user
            showError(`Failed to load students: ${error.message}`);
            
            // Ensure we have at least a disabled select with error message
            if (studentSelect) {
                studentSelect.innerHTML = '';
                const option = document.createElement('option');
                option.value = '';
                option.textContent = 'Error loading students';
                option.disabled = true;
                studentSelect.appendChild(option);
                studentSelect.disabled = false; // Keep it enabled to allow retry
                console.log('ℹ️ Added error state to dropdown');
            }
            
        } finally {
            console.groupEnd(); // End of populateStudentDropdown
        }
    }


    // Render subject input fields
    function renderSubjectInputs() {
        console.log('Rendering subject inputs...');
        
        // Make sure the container exists
        const marksContainer = document.getElementById('marks-container');
        if (!marksContainer) {
            console.error('Marks container not found in the DOM');
            return;
        }
        
        // Find or create the marks grid
        let marksGrid = marksContainer.querySelector('.marks-grid');
        if (!marksGrid) {
            marksGrid = document.createElement('div');
            marksGrid.className = 'marks-grid';
            marksContainer.innerHTML = ''; // Clear any existing content
            marksContainer.appendChild(document.createElement('h4')).textContent = 'Subject Marks';
            marksContainer.appendChild(marksGrid);
        }
        
        // Clear existing content
        marksGrid.innerHTML = '';
        
        // Add a loading message temporarily
        const loadingMsg = document.createElement('p');
        loadingMsg.textContent = 'Loading subjects...';
        marksGrid.appendChild(loadingMsg);
        
        // Add subjects after a short delay to allow UI to update
        setTimeout(() => {
            marksGrid.innerHTML = ''; // Remove loading message
            
            if (subjects.length === 0) {
                const noSubjectsMsg = document.createElement('p');
                noSubjectsMsg.textContent = 'No subjects found';
                marksGrid.appendChild(noSubjectsMsg);
                return;
            }
            
            subjects.forEach(subject => {
                const subjectDiv = document.createElement('div');
                subjectDiv.className = 'mark-item';
                
                const label = document.createElement('label');
                label.htmlFor = subject.toLowerCase().replace(/\s+/g, '-');
                label.textContent = `${subject}:`;
                
                const input = document.createElement('input');
                input.type = 'number';
                input.id = subject.toLowerCase().replace(/\s+/g, '-');
                input.min = '0';
                input.max = '100';
                input.className = 'mark-input';
                input.dataset.subject = subject;
                input.placeholder = 'Enter marks (0-100)';
                
                subjectDiv.appendChild(label);
                subjectDiv.appendChild(document.createElement('br'));
                subjectDiv.appendChild(input);
                
                marksGrid.appendChild(subjectDiv);
            });
            
            console.log('Subjects rendered successfully');
        }, 100);
    }


    // Generate report card
    function generateReportCard() {
        // Get the selected option
        const selectedOption = studentSelect.options[studentSelect.selectedIndex];
        
        if (!selectedOption || !selectedOption.value) {
            alert('Please select a student first');
            return;
        }

        // Get student data from data attributes
        let studentName = 'N/A';
        let studentClass = 'N/A';
        
        try {
            const studentData = selectedOption.dataset.studentData ? JSON.parse(selectedOption.dataset.studentData) : null;
            if (studentData) {
                studentName = studentData.name || 'N/A';
                studentClass = studentData.class || studentData.grade || 'N/A';
            } else {
                // Fallback to parsing from text content if data attribute is not available
                const textParts = selectedOption.textContent.split(' (');
                studentName = textParts[0] || 'N/A';
                if (textParts.length > 1) {
                    studentClass = textParts[1].replace(')', '') || 'N/A';
                }
            }
        } catch (error) {
            console.error('Error parsing student data:', error);
            // Fallback to basic parsing if JSON parse fails
            const textParts = selectedOption.textContent.split(' (');
            studentName = textParts[0] || 'N/A';
            if (textParts.length > 1) {
                studentClass = textParts[1].replace(')', '') || 'N/A';
            }
        }
        
        const studentId = selectedOption.value;

        const term = document.getElementById('term-select').value;
        const academicYear = document.getElementById('academic-year').value || new Date().getFullYear();
        const teacherComments = document.getElementById('teacher-comments')?.value || 'No comments provided.';

        // Get all marks
        const marks = [];
        document.querySelectorAll('.mark-input').forEach(input => {
            const subject = input.dataset.subject;
            const score = input.value ? parseInt(input.value) : 0;
            const grade = calculateGrade(score);
            marks.push({ 
                subject, 
                score: score + '%', // Add percentage sign
                grade,
                remarks: getRemarks(grade)
            });
        });

        // Calculate average
        const totalMarks = marks.reduce((sum, mark) => sum + parseInt(mark.score), 0);
        const average = marks.length > 0 ? Math.round(totalMarks / marks.length) : 0;
        const averageGrade = calculateGrade(average);

        // Generate report card HTML
        const reportCard = document.getElementById('report-card');
        if (!reportCard) {
            console.error('Report card container not found');
            return;
        }

        reportCard.innerHTML = `
            <div class="report-header" style="text-align: center; margin-bottom: 20px;">
                <h2>${document.querySelector('.sidebar-logo h2')?.textContent || 'School Name'}</h2>
                <p>P.O. Box 12345, City, Country</p>
                <p>Email: info@school.edu | Phone: +123 456 7890</p>
                <h3>ACADEMIC REPORT CARD</h3>
                <p>${term || 'Term 3'} - ${academicYear || ''}</p>
                <p>Issued: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
            </div>
            
            <div class="student-info" style="margin: 20px 0;">
                <div style="margin-bottom: 10px;">
                    <p><strong>Student:</strong> ${studentName || 'N/A'}</p>
                    <p><strong>Class:</strong> ${studentClass || 'N/A'}</p>
                </div>
            </div>
            
            <div class="overall-grade" style="text-align: center; margin: 20px 0; font-size: 1.2em;">
                <p><strong>Overall Grade:</strong> ${averageGrade || 'N/A'}</p>
                <p><strong>Average Score:</strong> ${average}%</p>
            </div>
            
            <table class="marks-table" style="width: 100%; border-collapse: collapse; margin: 20px 0;">
                <thead>
                    <tr style="background-color: #f5f5f5;">
                        <th style="padding: 10px; text-align: left; border: 1px solid #ddd;">Subject</th>
                        <th style="padding: 10px; text-align: center; border: 1px solid #ddd;">Score</th>
                        <th style="padding: 10px; text-align: center; border: 1px solid #ddd;">Grade</th>
                        <th style="padding: 10px; text-align: left; border: 1px solid #ddd;">Comments</th>
                    </tr>
                </thead>
                <tbody>
                    ${marks.map(mark => `
                        <tr>
                            <td style="padding: 10px; border: 1px solid #ddd;">${mark.subject || 'N/A'}</td>
                            <td style="padding: 10px; text-align: center; border: 1px solid #ddd;">${mark.score}</td>
                            <td style="padding: 10px; text-align: center; border: 1px solid #ddd;">${mark.grade}</td>
                            <td style="padding: 10px; border: 1px solid #ddd;">${mark.remarks || 'No comments'}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
            
            <div class="teacher-comments" style="margin: 20px 0;">
                <h4>Teacher's Comments:</h4>
                <p style="border: 1px solid #ddd; padding: 10px; min-height: 50px;">${teacherComments}</p>
            </div>
            
            <div class="signature-line" style="display: flex; justify-content: space-between; margin-top: 50px;">
                <div class="signature" style="text-align: center; width: 30%;">
                    <div style="border-top: 1px solid #000; width: 80%; margin: 0 auto; padding-top: 5px;"></div>
                    <p>Class Teacher</p>
                </div>
                <div class="signature" style="text-align: center; width: 30%;">
                    <div style="border-top: 1px solid #000; width: 80%; margin: 0 auto; padding-top: 5px;"></div>
                    <p>Head Teacher</p>
                </div>
                <div class="signature" style="text-align: center; width: 30%;">
                    <div style="border-top: 1px solid #000; width: 80%; margin: 0 auto; padding-top: 5px;"></div>
                    <p>Date: ${new Date().toLocaleDateString()}</p>
                </div>
            </div>

        // Show the report card preview
        if (reportCardPreview) {
            reportCardPreview.style.display = 'block';
            // Only try to enable print button if it exists
            if (printReportBtn) {
                printReportBtn.disabled = false;
            }
            // Scroll to the report card
            reportCardPreview.scrollIntoView({ behavior: 'smooth' });
        }
    }


    // Save marks to the server
    async function saveMarks() {
        try {
            // Get form values
            const studentSelect = document.getElementById('student-select');
            const studentId = studentSelect ? studentSelect.value : null;
            const studentName = studentSelect && studentSelect.selectedIndex >= 0 
                ? studentSelect.options[studentSelect.selectedIndex].text 
                : 'Unknown';
            
            const classSelect = document.getElementById('class-select');
            const className = classSelect ? classSelect.value : null;
            
            const termSelect = document.getElementById('term-select');
            const term = termSelect ? termSelect.value : null;
            
            const academicYearInput = document.getElementById('academic-year');
            const academicYear = academicYearInput ? academicYearInput.value : null;
            
            console.log('Form values:', { studentId, studentName, className, term, academicYear });
            
            // Validate form
            if (!studentId || !className || !term || !academicYear) {
                const missingFields = [];
                if (!studentId) missingFields.push('student');
                if (!className) missingFields.push('class');
                if (!term) missingFields.push('term');
                if (!academicYear) missingFields.push('academic year');
                
                throw new Error(`Please fill in all required fields: ${missingFields.join(', ')}`);
            }

            // Get all marks
            const markInputs = document.querySelectorAll('.mark-input');
            const marks = [];
            
            // Validate all marks
            markInputs.forEach(input => {
                const subject = input.dataset.subject;
                const score = input.value.trim() === '' ? null : parseInt(input.value);
                
                // Validate score
                if (score !== null && (isNaN(score) || score < 0 || score > 100)) {
                    throw new Error(`Invalid score for ${subject}. Please enter a number between 0 and 100.`);
                }
                
                if (score !== null) {
                    const grade = calculateGrade(score);
                    marks.push({
                        subject,
                        score,
                        grade,
                        remarks: getRemarks(grade)
                    });
                }
            });
            
            if (marks.length === 0) {
                throw new Error('Please enter at least one mark');
            }

            // Show confirmation dialog
            const confirmSave = window.confirm('Are you sure you want to save these marks?\n\n' +
                `Student: ${studentName}\n` +
                `Class: ${className}\n` +
                `Term: ${term} ${academicYear}\n` +
                `Subjects with marks: ${marks.length}\n\n` +
                'Click OK to confirm or Cancel to review.');
            
            if (!confirmSave) {
                return; // User cancelled
            }

            // Prepare marks data
            const marksData = {
                studentId,
                studentName,
                className,
                term,
                academicYear,
                marks,
                lastUpdated: new Date().toISOString()
            };
            
            // Get the authentication token
            const token = localStorage.getItem('token') || sessionStorage.getItem('token');
            if (!token) {
                throw new Error('No authentication token found. Please log in again.');
            }
            
            console.log('Sending marks data to server:', marksData);
            
            // Save marks in a single request
            const response = await fetch(`${API_BASE_URL}/api/marks`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'Authorization': `Bearer ${token}`,
                    'x-auth-token': token
                },
                credentials: 'include',
                body: JSON.stringify(marksData)
            });
            
            console.log('Response status:', response.status, response.statusText);
            
            if (!response.ok) {
                let errorMsg = `Server responded with status ${response.status} ${response.statusText}`;
                console.error('Error response status:', response.status, response.statusText);
                
                // Try to get error details from response
                try {
                    const errorText = await response.text();
                    console.error('Raw error response:', errorText);
                    
                    // Try to parse as JSON if possible
                    try {
                        const errorData = JSON.parse(errorText);
                        errorMsg = errorData.message || errorData.error || errorMsg;
                        console.error('Parsed error details:', errorData);
                    } catch (e) {
                        // If not JSON, use the raw text
                        errorMsg = errorText || errorMsg;
                    }
                } catch (e) {
                    console.error('Could not read error response:', e);
                }
                
                throw new Error(`Failed to save marks: ${errorMsg}`);
            }
            
            // Handle successful response
            const result = await response.json();
            console.log('Save marks response:', result);
            
            // Show success message
            window.alert('Marks saved successfully!');
            
            // Close the modal
            closeMarksModal();
            
            return result;
            
        } catch (error) {
            console.error('Error in saveMarks:', error);
            window.alert(error.message || 'Failed to save marks. Please try again.');
            throw error; // Re-throw to allow further error handling
        }
    }

// Calculate grade based on score using the new grading scale
const calculateGrade = (score) => {
    if (score >= 85) return 'Exceed Expectation';
    if (score >= 70) return 'Meet Expectation';
    if (score >= 55) return 'Approach Expectation';
    return 'Below Expectation';
};

// Get remarks based on the new grading scale
function getRemarks(grade) {
    const remarks = {
        'Exceed Expectation': 'Outstanding performance that exceeds the expected standards',
        'Meet Expectation': 'Meets the expected standards for this level',
        'Approach Expectation': 'Approaching the expected standards, some improvement needed',
        'Below Expectation': 'Performance below the expected standards, significant improvement needed'
    };
    return remarks[grade] || 'No remarks available';
}

// Save marks to the server
async function saveMarks() {
    try {
        // Get form values
        const studentSelect = document.getElementById('student-select');
        const studentId = studentSelect ? studentSelect.value : null;
        const studentName = studentSelect && studentSelect.selectedIndex >= 0 
            ? studentSelect.options[studentSelect.selectedIndex].text 
            : 'Unknown';
        
        const classSelect = document.getElementById('class-select');
        const className = classSelect ? classSelect.value : null;
        
        const termSelect = document.getElementById('term-select');
        const term = termSelect ? termSelect.value : null;
        
        const academicYearInput = document.getElementById('academic-year');
        const academicYear = academicYearInput ? academicYearInput.value : null;
        
        console.log('Form values:', { studentId, studentName, className, term, academicYear });

        // Validate form
        if (!studentId || !className || !term || !academicYear) {
            const missingFields = [];
            if (!studentId) missingFields.push('student');
            if (!className) missingFields.push('class');
            if (!term) missingFields.push('term');
            if (!academicYear) missingFields.push('academic year');

            throw new Error(`Please fill in all required fields: ${missingFields.join(', ')}`);
        }

        // Get marks for each subject
        const marks = [];
        const markInputs = document.querySelectorAll('.mark-input');
        markInputs.forEach(input => {
            const subject = input.dataset.subject;
            const score = parseFloat(input.value) || 0;
            if (score > 0) { // Only include subjects with scores > 0
                marks.push({ 
                    subject, 
                    score, 
                    grade: calculateGrade(score), 
                    remarks: getRemarks(calculateGrade(score)) 
                });
            }
        });

        if (marks.length === 0) {
            throw new Error('Please enter at least one mark');
        }

        // Show confirmation dialog
        const confirmSave = confirm('Are you sure you want to save these marks?\n\n' +
            `Student: ${studentName}\n` +
            `Class: ${className}\n` +
            `Term: ${term} ${academicYear}\n` +
            `Subjects with marks: ${marks.length}\n\n` +
            'Click OK to confirm or Cancel to review.');

        if (!confirmSave) {
            return; // User cancelled
        }

        // Get the authentication token from localStorage or sessionStorage
        const token = localStorage.getItem('token') || sessionStorage.getItem('token');
        if (!token) {
            throw new Error('No authentication token found. Please log in again.');
        }

        console.log('Saving marks for student:', studentName);

        // Prepare marks data
        const marksData = {
            studentId,
            studentName,
            className,
            term,
            academicYear,
            marks,
            lastUpdated: new Date().toISOString()
        };

        console.log('Sending marks data to server:', marksData);

        // Save marks in a single request
        const response = await fetch(`${API_BASE_URL}/api/marks`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'Authorization': `Bearer ${token}`,
                'x-auth-token': token
            },
            credentials: 'include',
            body: JSON.stringify(marksData)
        });

        console.log('Response status:', response.status, response.statusText);

        if (!response.ok) {
            let errorMsg = `Server responded with status ${response.status} ${response.statusText}`;
            console.error('Error response status:', response.status, response.statusText);

            // Try to get error details from response
            try {
                const errorText = await response.text();
                console.error('Raw error response:', errorText);

                // Try to parse as JSON if possible
                try {
                    const errorData = JSON.parse(errorText);
                    errorMsg = errorData.message || errorData.error || errorMsg;
                    console.error('Parsed error details:', errorData);
                } catch (e) {
                    // If not JSON, use the raw text
                    errorMsg = errorText || errorMsg;
                }
            } catch (e) {
                console.error('Could not read error response:', e);
            }

            throw new Error(`Failed to save marks: ${errorMsg}`);
        }

        // Handle response
        let result;
        try {
            const responseText = await response.text();
            result = responseText ? JSON.parse(responseText) : { success: true };
            console.log('Save marks response:', result);

            // Show success message
            showSuccess('Marks saved successfully!');

            // Close the modal after a short delay
            setTimeout(closeMarksModal, 1500);

            return result;

        } catch (error) {
            console.error('Error parsing response:', error);
            throw new Error('Error processing server response');
        }
    } catch (error) {
        console.error('Error saving marks:', error);
        showError(error.message || 'Failed to save marks. Please try again.');
    }
}

// Show success message with a nice toast notification
function showSuccess(message) {
    // Create toast element if it doesn't exist
    let toast = document.getElementById('toast-notification');
    if (!toast) {
        toast = document.createElement('div');
        toast.id = 'toast-notification';
        Object.assign(toast.style, {
            position: 'fixed',
            top: '20px',
            right: '20px',
            padding: '12px 24px',
            backgroundColor: '#4CAF50',
            color: 'white',
            borderRadius: '4px',
            boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
            zIndex: '9999',
            transition: 'opacity 0.5s, transform 0.5s',
            opacity: '0',
            transform: 'translateY(-20px)'
        });
        document.body.appendChild(toast);
    }
    
    // Set the message and show the toast
    toast.textContent = message;
    toast.style.opacity = '1';
    toast.style.transform = 'translateY(0)';
    
    // Hide the toast after 3 seconds
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateY(-20px)';
    }, 3000);
}

// Print the report card
function printReportCard() {
    try {
        const reportCard = document.getElementById('report-card');
        if (!reportCard) {
            console.error('Report card element not found');
            alert('Cannot print: Report card not found. Please generate a report card first.');
            return;
        }

        const printWindow = window.open('', '', 'width=800,height=900');
        if (!printWindow) {
            alert('Popup was blocked. Please allow popups for this site to print the report card.');
            return;
        }
        
        // Add your print logic here
        printWindow.document.write('<html><head><title>Report Card</title>');
        printWindow.document.write('</head><body>');
        printWindow.document.write(reportCard.outerHTML);
        printWindow.document.write('</body></html>');
        printWindow.document.close();
        printWindow.focus();
        
        // Wait for content to load before printing
        printWindow.onload = function() {
            printWindow.print();
            printWindow.close();
        };
    } catch (error) {
        console.error('Error printing report card:', error);
        alert('An error occurred while trying to print the report card.');
    }
}

// Send report card to student
const sendReportCardToStudent = async () => {
    try {
        const reportCard = document.getElementById('report-card');
        if (!reportCard) {
            throw new Error('Report card not found');
        }
            
            const studentId = studentSelect.value;
            if (!studentId) {
                throw new Error('No student selected');
            }
            
            const student = students.find(s => s._id === studentId || s.id === studentId);
            if (!student) {
                throw new Error('Student not found');
            }
            
            // Get the current date for the report card
            const now = new Date();
            const year = now.getFullYear();
            const term = document.getElementById('term-select')?.value || 'Term 1';
            
            // Prepare report card data
            const reportData = {
                studentId,
                studentName: student.name,
                year: year.toString(),
                term,
                htmlContent: reportCard.innerHTML
            };
            
            // Send to backend
            const response = await fetch('/api/report-cards/send', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(reportData)
            });
            
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Failed to send report card');
            }
            
            showSuccess('Report card sent to student successfully!');
            
        } catch (error) {
            console.error('Error sending report card:', error);
            showError(`Failed to send report card: ${error.message}`);
        }
    }
    
    // Print the report card
    function printReportCard() {
        try {
            const reportCard = document.getElementById('report-card');
            if (!reportCard) {
                console.error('Report card element not found');
                alert('Cannot print: Report card not found. Please generate a report card first.');
                return;
            }

            const printWindow = window.open('', '', 'width=800,height=900');
            if (!printWindow) {
                alert('Popup was blocked. Please allow popups for this site to print the report card.');
                return;
            }

            printWindow.document.write(`
                <!DOCTYPE html>
                <html>
                <head>
                    <title>Report Card</title>
                    <style>
                        body { font-family: Arial, sans-serif; line-height: 1.6; }
                        .report-card { max-width: 800px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; }
                        .header { text-align: center; margin-bottom: 20px; }
                        .school-name { font-size: 24px; font-weight: bold; margin: 0; }
                        .student-info { margin: 20px 0; }
                        .student-info p { margin: 5px 0; }
                        table { width: 100%; border-collapse: collapse; margin: 20px 0; }
                        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                        th { background-color: #f2f2f2; }
                        .signature-line { display: flex; justify-content: space-between; margin-top: 50px; }
                        .signature { text-align: center; width: 200px; }
                        @media print {
                            @page { size: A4; margin: 0; }
                            body { margin: 1.6cm; }
                            .no-print { display: none; }
                        }
                    </style>
                </head>
                <body>
                    ${reportCard.innerHTML}
                    <div class="no-print" style="text-align: center; margin-top: 20px; display: flex; gap: 10px; justify-content: center;">
                        <button onclick="window.print()" style="padding: 10px 20px; font-size: 16px; cursor: pointer; background-color: #4CAF50; color: white; border: none; border-radius: 4px;">
                            Print Report Card
                        </button>
                        <button id="send-to-student-btn" style="padding: 10px 20px; font-size: 16px; cursor: pointer; background-color: #2196F3; color: white; border: none; border-radius: 4px;">
                            Send to Student
                        </button>
                    </div>
                    <script>
                        // Auto-print when the print window loads
                        window.onload = function() {
                            try {
                                setTimeout(function() {
                                    window.print();
                                    // Close the window after printing if possible
                                    window.onafterprint = function() {
                                        window.close();
                                    };
                                }, 500);
                            } catch (e) {
                                console.error('Error during print:', e);
                            }
                        };
                    <\/script>
                </body>
                </html>
            `);
            
            printWindow.document.close();
            
            // Add event listener for the send button
            printWindow.addEventListener('DOMContentLoaded', () => {
                const sendBtn = printWindow.document.getElementById('send-to-student-btn');
                if (sendBtn) {
                    sendBtn.onclick = () => {
                        printWindow.sendReportCardToStudent = sendReportCardToStudent;
                        printWindow.sendReportCardToStudent();
                    };
                }
            });
            
            // Focus the print window
            printWindow.focus();
            
        } catch (error) {
            console.error('Error in printReportCard:', error);
            alert('An error occurred while trying to print the report card.');
        }
    }
    
// Modal Functions
function openStudentModal() {
    console.group('Opening Student Modal');
    
    // Get fresh references to elements
    studentModal = document.getElementById('studentSelectionModal');
    studentSelect = document.getElementById('student-select');
        
        if (!studentModal) {
            console.error('❌ Modal element not found in the DOM');
            console.groupEnd();
            return;
        }
        
        console.log('✅ Modal element found');
        
        // Force show the modal with important styles
        studentModal.style.display = 'flex';
        studentModal.style.opacity = '1';
        studentModal.style.visibility = 'visible';
        
        console.log('ℹ️ Modal display style set to flex');
        
        // Reset the form
        if (studentSelect) {
            console.log('✅ Student select element found');
            studentSelect.selectedIndex = 0;
            studentSelect.disabled = false;
            studentSelect.style.opacity = '1';
            studentSelect.style.cursor = 'pointer';
            studentSelect.style.pointerEvents = 'auto';
            console.log('ℹ️ Student select element enabled and visible');
        } else {
            console.error('❌ Student select element not found in the DOM');
        }
        
        // Clear any previous error messages
        const errorMsg = document.getElementById('student-select-error');
        if (errorMsg) {
            errorMsg.textContent = '';
            errorMsg.style.display = 'none';
            errorMsg.style.color = '#dc3545';
            console.log('ℹ️ Error message element reset');
        } else {
            console.warn('⚠️ Error message element not found');
        }
        
        // Ensure we have students loaded
        if (!Array.isArray(students) || students.length === 0) {
            console.log('ℹ️ No students in memory, fetching...');
            
            // Show loading state
            if (studentSelect) {
                studentSelect.innerHTML = '<option value="" disabled>Loading students...</option>';
                studentSelect.disabled = false;
                studentSelect.style.opacity = '1';
                console.log('ℹ️ Showing loading state in select');
            }
            
            // Fetch students
            fetchStudents()
                .then(() => {
                    console.log('✅ Students loaded, populating dropdown...');
                    console.log('Students data:', students);
                    populateStudentDropdown();
                    
                    // Force the dropdown to be visible and interactive
                    if (studentSelect) {
                        studentSelect.style.display = 'block';
                        studentSelect.style.visibility = 'visible';
                        studentSelect.style.opacity = '1';
                        studentSelect.focus();
                        console.log('ℹ️ Dropdown should now be visible and interactive');
                    }
                })
                .catch(error => {
                    console.error('Error loading students:', error);
                    if (studentSelect) {
                        studentSelect.innerHTML = '<option value="">Error loading students</option>';
                        studentSelect.disabled = false; // Keep it enabled to allow retry
                    }
                    if (errorMsg) {
                        errorMsg.textContent = 'Failed to load students. Please try again.';
                        errorMsg.style.display = 'block';
                    }
                });
        } else {
            console.log('ℹ️ Using cached students, populating dropdown...');
            console.log('Cached students data:', students);
            // We already have students, populate the dropdown
            populateStudentDropdown();
            
            // Force the dropdown to be visible and interactive
            if (studentSelect) {
                studentSelect.style.display = 'block';
                studentSelect.style.visibility = 'visible';
                studentSelect.style.opacity = '1';
                studentSelect.focus();
                console.log('ℹ️ Dropdown should now be visible and interactive (cached)');
            }
        }
        
        console.groupEnd(); // End of openStudentModal
    }

function closeStudentModal() {
    if (studentModal) {
        studentModal.style.display = 'none';
    }
}

function handleStudentSelect() {
    try {
        if (!studentSelect) {
            throw new Error('Student select element not found');
        }
            
            const selectedStudentId = studentSelect.value;
            if (!selectedStudentId) {
                const errorMsg = document.getElementById('student-select-error');
                if (errorMsg) {
                    errorMsg.textContent = 'Please select a student from the list';
                    errorMsg.style.display = 'block';
                }
                return;
            }
            
            selectedStudent = students.find(s => s._id === selectedStudentId || s.id === selectedStudentId);
            if (!selectedStudent) {
                throw new Error('Selected student not found in the list');
            }
            
            console.log('Selected student:', selectedStudent);
            
            // Update the UI to show the selected student
            const studentInfo = document.getElementById('selected-student-info');
            if (studentInfo) {
                studentInfo.classList.remove('d-none', 'alert-info', 'alert-danger');
                studentInfo.classList.add('alert-success');
                studentInfo.innerHTML = `
                    <div class="d-flex align-items-center">
                        <i class="bi bi-person-check-fill me-2"></i>
                        <div>
                            <strong>Selected Student:</strong> ${selectedStudent.name || 'Unnamed Student'}
                            ${selectedStudent.class ? `<span class="ms-2 badge bg-primary">${selectedStudent.class}</span>` : ''}
                        </div>
                        <button class="btn btn-sm btn-outline-secondary ms-auto" id="change-student-btn">
                            <i class="bi bi-pencil"></i> Change
                        </button>
                    </div>
                `;
                
                // Add event listener to the change button
                const changeBtn = document.getElementById('change-student-btn');
                if (changeBtn) {
                    changeBtn.addEventListener('click', (e) => {
                        e.stopPropagation();
                        openStudentModal();
                    });
                }
            }
            
            // Close the modal
            closeStudentModal();
            
            // Load the selected student's data
            loadStudentData(selectedStudentId);
            
            // Update the report cards section
            updateReportCardsSection(true);
            
        } catch (error) {
            console.error('Error in handleStudentSelect:', error);
            const errorMsg = document.getElementById('student-select-error');
            if (errorMsg) {
                errorMsg.textContent = `Error: ${error.message}`;
                errorMsg.style.display = 'block';
            }
        }
    }
    
// Update the report cards section based on selection
function updateReportCardsSection(hasSelection) {
    const reportCardsSection = document.getElementById('report-cards');
    if (!reportCardsSection) return;
    
    if (hasSelection) {
        // Show loading state while fetching report cards
        reportCardsSection.innerHTML = `
            <div class="text-center py-5">
                <div class="spinner-border text-primary mb-3" role="status">
                    <span class="visually-hidden">Loading...</span>
                </div>
                <p>Loading report cards for ${selectedStudent?.name || 'selected student'}...</p>
            </div>
        `;
        
        // Here you would typically fetch the student's report cards
        // For now, we'll simulate a loading delay
        setTimeout(() => {
            // This is where you would populate the report cards
            // For now, we'll just show a message
            reportCardsSection.innerHTML = `
                <div class="alert alert-info">
                    <i class="bi bi-info-circle me-2"></i>
                    Report cards for ${selectedStudent?.name || 'the selected student'} will be displayed here.
                </div>
            `;
        }, 1500);
    } else {
        // Show the default state when no student is selected
        reportCardsSection.innerHTML = `
            <div class="card">
                <div class="card-body text-center p-5">
                    <i class="bi bi-person-lines-fill text-muted" style="font-size: 3rem;"></i>
                    <h5 class="mt-3">No Student Selected</h5>
                    <p class="text-muted">Please select a student to view their report cards.</p>
                    <button id="select-student-btn-2" class="btn btn-primary">
                        <i class="bi bi-people-fill me-1"></i> Select Student
                    </button>
                </div>
            </div>
        `;
        
        // Re-attach event listener to the new button
        const selectBtn2 = document.getElementById('select-student-btn-2');
        if (selectBtn2) {
            selectBtn2.addEventListener('click', (e) => {
                e.stopPropagation();
                openStudentModal();
            });
        }
    }
}
    
    function loadStudentData(studentId) {
        // Here you would typically fetch the student's data from the backend
        console.log(`Loading data for student ID: ${studentId}`);
        // Update the UI with the student's data
    }

    // Add animation keyframes
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
        
        /* Modal styles */
        .modal {
            display: none;
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background-color: rgba(0, 0, 0, 0.5);
            z-index: 1000;
            justify-content: center;
            align-items: center;
        }
        
        .modal-content {
            background: white;
            padding: 20px;
            border-radius: 8px;
            width: 90%;
            max-width: 600px;
            max-height: 90vh;
            overflow-y: auto;
            position: relative;
        }
        
        .close-modal {
            position: absolute;
            top: 10px;
            right: 15px;
            font-size: 24px;
            cursor: pointer;
        }
    `;
    document.head.appendChild(style);
}

function initApp() {
    console.log('Initializing application...');
    
    try {
        // Initialize DOM elements
        initializeElements();
        
        // Set up event listeners
        if (openMarksModalBtn) {
            console.log('Adding click event to openMarksModalBtn');
            openMarksModalBtn.removeEventListener('click', openMarksModal); // Remove any existing listeners
            openMarksModalBtn.addEventListener('click', function(e) {
                console.log('Open marks modal button clicked');
                e.preventDefault();
                e.stopPropagation();
                openMarksModal();
            });
            
            // Close modal with close button
            if (closeModalBtn) {
                closeModalBtn.addEventListener('click', function(e) {
                    e.preventDefault();
                    e.stopPropagation();
                    marksModal.style.display = 'none';
                    document.body.style.overflow = '';
                });
            }
            
            // Close modal when clicking outside
            window.addEventListener('click', function(e) {
                if (e.target === marksModal) {
                    marksModal.style.display = 'none';
                    document.body.style.overflow = '';
                }
            });
            
            console.log('Modal event listeners set up successfully');
        } else {
            console.error('Could not find required elements for modal');
        }
    } catch (error) {
        console.error('Error initializing application:', error);
    }
}

// Initialize the app when the DOM is fully loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
} else {
    initApp();
}
