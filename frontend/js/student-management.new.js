// Import API utility
import { api } from './api.js';

// Student Management System
class StudentManagement {
    constructor() {
        this.students = [];
        this.currentPage = 1;
        this.itemsPerPage = 10;
        this.currentSort = { column: 'admissionNumber', direction: 'asc' };
        // Don't initialize here to prevent double initialization
    }

    async initialize() {
        await this.loadStudents();
        this.renderStudentTable();
        this.setupEventListeners();
    }

    async loadStudents() {
        try {
            // Try to load from API first
            try {
                const response = await api.get('/api/students');
                if (Array.isArray(response) && response.length > 0) {
                    this.students = response;
                    this.saveToLocalStorage();
                    return;
                }
            } catch (apiError) {
                console.warn('Failed to load from API, trying localStorage:', apiError);
                
                // Fall back to localStorage if API fails
                const savedStudents = localStorage.getItem('students');
                if (savedStudents) {
                    this.students = JSON.parse(savedStudents);
                    console.log('Loaded students from localStorage');
                    return;
                }
            }
            
            // Fall back to sample data if no data in localStorage or API
            this.loadSampleData();
            this.saveToLocalStorage();
            this.showNotification('Using sample data. API endpoint not available.', 'info');
            
        } catch (error) {
            console.error('Error loading students:', error);
            this.loadSampleData();
            this.showNotification('Using sample data. Could not load from server.', 'warning');
        }
    }

    loadSampleData() {
        this.students = [
            {
                id: 1,
                admissionNumber: 'STD001',
                fullName: 'John Doe',
                className: 'Form 1A',
                gender: 'Male',
                dateOfBirth: '2010-05-15',
                parentName: 'Jane Doe',
                parentPhone: '0712345678',
                parentEmail: 'jane@example.com',
                address: '123 Main St, Nairobi',
                status: 'Active',
                admissionDate: '2023-01-10',
                bloodGroup: 'A+',
                allergies: 'None',
                medicalConditions: 'None'
            },
            {
                id: 2,
                admissionNumber: 'STD002',
                fullName: 'Jane Smith',
                className: 'Form 2B',
                gender: 'Female',
                dateOfBirth: '2009-08-22',
                parentName: 'John Smith',
                parentPhone: '0723456789',
                parentEmail: 'john@example.com',
                address: '456 Oak Ave, Mombasa',
                status: 'Active',
                admissionDate: '2022-09-05',
                bloodGroup: 'O+',
                allergies: 'Peanuts',
                medicalConditions: 'Asthma'
            }
        ];
    }

    saveToLocalStorage() {
        try {
            localStorage.setItem('students', JSON.stringify(this.students));
            console.log('Students data saved to localStorage');
        } catch (error) {
            console.error('Error saving to localStorage:', error);
            this.showNotification('Error saving student data. Some data may be lost on page refresh.', 'error');
        }
    }

    renderStudentTable() {
        console.log('Rendering student table...');
        const tableBody = document.getElementById('student-table-body');
        if (!tableBody) {
            console.error('Student table body not found!');
            return;
        }

        console.log(`Rendering ${this.students.length} students (showing ${Math.min(this.itemsPerPage, this.students.length)})`);
        
        // Debug: Log the first few students
        console.log('Sample student data:', this.students.slice(0, 2));

        // Clear existing rows
        tableBody.innerHTML = '';

        if (this.students.length === 0) {
            console.log('No students to display');
            tableBody.innerHTML = '<tr><td colspan="9" class="text-center">No students found</td></tr>';
            return;
        }

        // Calculate pagination
        const startIndex = (this.currentPage - 1) * this.itemsPerPage;
        const endIndex = startIndex + this.itemsPerPage;
        const paginatedStudents = this.students.slice(startIndex, endIndex);
        
        console.log(`Displaying students ${startIndex + 1} to ${Math.min(endIndex, this.students.length)}`);

        // Render each student
        paginatedStudents.forEach(student => {
            const row = document.createElement('tr');
            
            // Format status with appropriate badge class
            const status = student.status || 'inactive';
            const statusClass = `status-badge status-${status.toLowerCase().replace(/\s+/g, '-')}`;
            const statusDisplay = status.charAt(0).toUpperCase() + status.slice(1);
            
            // Format the data to match the table headers
            const admissionNumber = student.admissionNumber || 'N/A';
            const fullName = student.fullName || 'N/A';
            const className = student.className || 'N/A';
            const gender = student.gender ? student.gender.charAt(0).toUpperCase() + student.gender.slice(1) : 'N/A';
            const parentName = student.parentName || 'N/A';
            const parentPhone = student.parentPhone || 'N/A';
            
            row.innerHTML = `
                <td><input type="checkbox" class="student-checkbox" data-id="${student.id}"></td>
                <td>${admissionNumber}</td>
                <td>${fullName}</td>
                <td>${className}</td>
                <td>${gender}</td>
                <td>${parentName}</td>
                <td>${parentPhone}</td>
                <td><span class="status status-${status.toLowerCase().replace(/\s+/g, '-')}">${statusDisplay}</span></td>
                <td class="actions">
                    <button class="btn-action btn-view" data-id="${student.id}">View</button>
                    <button class="btn-action btn-edit" data-id="${student.id}">Edit</button>
                    <button class="btn-action btn-delete" data-id="${student.id}">Delete</button>
                </td>`;
            tableBody.appendChild(row);
        });

        // Add event listeners to the new buttons
        this.setupActionButtons();
        
        // Update pagination controls
        this.updatePagination();
    }
    
    setupActionButtons() {
        console.log('Setting up action buttons...');
        
        const table = document.getElementById('student-table-body');
        if (!table) {
            console.error('Student table body not found!');
            return;
        }

        // Log the table content for debugging
        console.log('Table content:', table.innerHTML);

        // Remove any existing click handlers to prevent duplicates
        const newTable = table.cloneNode(true);
        table.parentNode.replaceChild(newTable, table);
        
        // Log when any click happens in the table
        newTable.addEventListener('click', (e) => {
            console.log('Table clicked!', e.target);
            
            const target = e.target.closest('.btn-action');
            if (!target) {
                console.log('Clicked element is not an action button');
                return;
            }

            console.log('Action button clicked:', target);
            console.log('Button classes:', target.className);
            console.log('Button dataset:', target.dataset);

            const studentId = target.dataset.id;
            if (!studentId) {
                console.error('No student ID found for action button');
                return;
            }

            console.log(`Handling action for student ID: ${studentId}`);

            // Handle different button types
            if (target.classList.contains('btn-view')) {
                console.log('View button clicked');
                this.viewStudentDetails(studentId);
            } else if (target.classList.contains('btn-edit')) {
                console.log('Edit button clicked');
                this.editStudent(studentId);
            } else if (target.classList.contains('btn-delete')) {
                console.log('Delete button clicked');
                if (confirm('Are you sure you want to delete this student?')) {
                    this.deleteStudent(studentId);
                }
            } else {
                console.log('Unknown button type clicked');
            }
            
            // Prevent default action
            e.preventDefault();
            e.stopPropagation();
        });
        
        console.log('Action buttons setup complete');
    }

    updatePagination() {
        const totalPages = Math.ceil(this.students.length / this.itemsPerPage);
        const pagination = document.getElementById('pagination');
        if (!pagination) return;

        let paginationHTML = `
            <button class="btn-prev" ${this.currentPage === 1 ? 'disabled' : ''}>Previous</button>
            <span>Page ${this.currentPage} of ${totalPages || 1}</span>
            <button class="btn-next" ${this.currentPage >= totalPages ? 'disabled' : ''}>Next</button>
        `;

        pagination.innerHTML = paginationHTML;

        // Add event listeners
        const prevBtn = pagination.querySelector('.btn-prev');
        const nextBtn = pagination.querySelector('.btn-next');

        if (prevBtn) {
            prevBtn.addEventListener('click', () => {
                if (this.currentPage > 1) {
                    this.currentPage--;
                    this.renderStudentTable();
                }
            });
        }


        if (nextBtn) {
            nextBtn.addEventListener('click', () => {
                if (this.currentPage < totalPages) {
                    this.currentPage++;
                    this.renderStudentTable();
                }
            });
        }
    }


    showAddStudent() {
        try {
            console.log('showAddStudentModal called');
            const modal = document.getElementById('add-student-modal');
            if (!modal) {
                console.error('Add student modal not found');
                return;
            }
            
            console.log('Modal element found:', modal);
            
            const form = document.getElementById('add-student-form');
            if (form) {
                form.reset();
                console.log('Form reset');
            } else {
                console.error('Add student form not found');
            }
            
            // Make modal visible
            modal.style.display = 'block';
            modal.style.visibility = 'visible';
            modal.style.opacity = '1';
            console.log('Modal display set to block');
            
            // Set up close button
            const closeBtn = modal.querySelector('.close');
            if (closeBtn) {
                closeBtn.onclick = () => {
                    console.log('Close button clicked');
                    modal.style.display = 'none';
                };
            } else {
                console.warn('Close button not found in modal');
            }
            
            // Close when clicking outside
            window.onclick = (event) => {
                if (event.target === modal) {
                    console.log('Clicked outside modal, closing');
                    modal.style.display = 'none';
                }
            };
            
            console.log('Modal should now be visible');
        } catch (error) {
            console.error('Error in showAddStudentModal:', error);
        }
    }


    handleAddStudent(event) {
        // Prevent default form submission
        event.preventDefault();
        
        // Get form and check if we're in edit mode
        const form = event.target;
        const isEditMode = form.dataset.editMode === 'true';
        const studentId = form.dataset.studentId ? parseInt(form.dataset.studentId, 10) : null;
        
        // Get the submit button and update its text
        const submitButton = form.querySelector('button[type="submit"]');
        if (submitButton) {
            submitButton.disabled = true;
            submitButton.textContent = isEditMode ? 'Updating...' : 'Saving...';
        }
        
        try {
            // Get form data
            const formData = new FormData(form);
            const studentData = {};
            
            // Convert FormData to object
            formData.forEach((value, key) => {
                studentData[key] = value;
            });

            if (isEditMode && studentId) {
                // Edit existing student
                const index = this.students.findIndex(s => s.id === studentId);
                if (index !== -1) {
                    // Update the student data while preserving the ID and admission info
                    this.students[index] = {
                        ...this.students[index],
                        ...studentData,
                        id: studentId, // Preserve original ID
                        admissionNumber: this.students[index].admissionNumber, // Preserve admission number
                        admissionDate: this.students[index].admissionDate, // Preserve original admission date
                        status: studentData.status || this.students[index].status || 'Active'
                    };
                    
                    // Save to localStorage
                    this.saveToLocalStorage();
                    
                    // Update the table
                    this.renderStudentTable();
                    
                    // Close the modal
                    const modal = document.getElementById('add-student-modal');
                    if (modal) modal.style.display = 'none';
                    
                    // Show success message
                    this.showNotification('Student updated successfully!', 'success');
                } else {
                    throw new Error('Student not found for editing');
                }
            } else {
                // Add new student
                const newId = this.students.length > 0 
                    ? Math.max(...this.students.map(s => s.id)) + 1 
                    : 1;
                    
                // Create new student object
                const newStudent = {
                    id: newId,
                    admissionNumber: `STD${String(newId).padStart(3, '0')}`,
                    fullName: studentData.fullName,
                    className: studentData.className,
                    gender: studentData.gender,
                    dateOfBirth: studentData.dateOfBirth || null,
                    parentName: studentData.parentName,
                    parentPhone: studentData.parentPhone,
                    parentEmail: studentData.parentEmail || null,
                    address: studentData.address || null,
                    status: studentData.status || 'Active',
                    admissionDate: new Date().toISOString().split('T')[0],
                    bloodGroup: studentData.bloodGroup || 'Not specified',
                    allergies: studentData.allergies || 'None',
                    medicalConditions: studentData.medicalConditions || 'None',
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                };
                
                // Add to students array
                this.students.unshift(newStudent);
                
                // Save to localStorage
                this.saveToLocalStorage();
                
                // Update the table
                this.currentPage = 1;
                this.renderStudentTable();
                
                // Close the modal
                const modal = document.getElementById('add-student-modal');
                if (modal) modal.style.display = 'none';
                
                // Reset the form
                form.reset();
                
                // Show success message
                this.showNotification('Student added successfully!', 'success');
            }
            
        } catch (error) {
            console.error(`Error ${isEditMode ? 'updating' : 'adding'} student:`, error);
            this.showNotification(
                `Error ${isEditMode ? 'updating' : 'adding'} student. Please try again.`,
                'error'
            );
        } finally {
            // Re-enable the submit button
            if (submitButton) {
                submitButton.disabled = false;
                submitButton.textContent = isEditMode ? 'Update Student' : 'Save Student';
            }
        }
    }


    showNotification(message, type = 'info') {
        const notificationContainer = document.getElementById('notification-container');
        
        if (notificationContainer) {
            const notification = document.createElement('div');
            notification.className = `notification ${type}`;
            notification.innerHTML = `
                <span class="notification-message">${message}</span>
                <button class="notification-close">&times;</button>
            `;
            
            notificationContainer.appendChild(notification);
            
            // Auto-remove notification after 5 seconds
            setTimeout(() => {
                notification.classList.add('fade-out');
                setTimeout(() => notification.remove(), 300);
            }, 5000);
            
            // Close button
            const closeBtn = notification.querySelector('.notification-close');
            if (closeBtn) {
                closeBtn.onclick = () => {
                    notification.classList.add('fade-out');
                    setTimeout(() => notification.remove(), 300);
                };
            }
        } else {
            // Fallback to alert if no notification container found
            alert(`${type.toUpperCase()}: ${message}`);
        }
    }


    setupEventListeners() {
        // Add Student button
        const addStudentBtn = document.getElementById('add-student-btn');
        if (addStudentBtn) {
            // Remove any existing event listeners to prevent duplicates
            const newAddStudentBtn = addStudentBtn.cloneNode(true);
            addStudentBtn.parentNode.replaceChild(newAddStudentBtn, addStudentBtn);
            newAddStudentBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.showAddStudentModal();
            });
        }
        
        // Add Student form submission
        const addStudentForm = document.getElementById('add-student-form');
        if (addStudentForm) {
            // Remove any existing form to prevent duplicate submissions
            const newForm = addStudentForm.cloneNode(true);
            addStudentForm.parentNode.replaceChild(newForm, addStudentForm);
            
            // Add new submit handler
            newForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleAddStudent(e);
            });
        }
        
        // Search functionality
        const searchInput = document.getElementById('student-search');
        if (searchInput) {
            // Remove any existing event listeners
            const newSearchInput = searchInput.cloneNode(true);
            searchInput.parentNode.replaceChild(newSearchInput, searchInput);
            newSearchInput.addEventListener('input', (e) => {
                this.searchStudents(e.target.value);
            });
        }
        
        // Class filter
        const classFilter = document.getElementById('class-filter');
        if (classFilter) {
            // Remove any existing event listeners
            const newClassFilter = classFilter.cloneNode(true);
            classFilter.parentNode.replaceChild(newClassFilter, classFilter);
            newClassFilter.addEventListener('change', (e) => {
                this.filterByClass(e.target.value);
            });
        }
        
        // Status filter
        const statusFilter = document.getElementById('status-filter');
        if (statusFilter) {
            statusFilter.addEventListener('change', (e) => {
                this.filterByStatus(e.target.value);
            });
        }
        
        // Select all checkbox
        const selectAllCheckbox = document.getElementById('select-all');
        if (selectAllCheckbox) {
            selectAllCheckbox.addEventListener('change', (e) => {
                const checkboxes = document.querySelectorAll('.student-checkbox');
                checkboxes.forEach(checkbox => {
                    checkbox.checked = e.target.checked;
                });
            });
        }
    }


    searchStudents(query) {
        if (!query) {
            this.renderStudentTable();
            return;
        }
        
        const searchTerm = query.toLowerCase();
        const filteredStudents = this.students.filter(student => 
            student.fullName.toLowerCase().includes(searchTerm) ||
            student.admissionNumber.toLowerCase().includes(searchTerm) ||
            student.className.toLowerCase().includes(searchTerm) ||
            student.parentName.toLowerCase().includes(searchTerm) ||
            student.parentPhone.includes(searchTerm)
        );
        
        this.renderFilteredStudents(filteredStudents);
    }


    renderFilteredStudents(filteredStudents) {
        const tableBody = document.getElementById('student-table-body');
        if (!tableBody) return;

        tableBody.innerHTML = '';
        
        filteredStudents.forEach(student => {
            const row = document.createElement('tr');
            // Format status with appropriate badge class
            const status = student.status || 'inactive';
            const statusDisplay = status.charAt(0).toUpperCase() + status.slice(1);
            
            row.innerHTML = `
                <td><input type="checkbox" class="student-checkbox" data-id="${student.id}"></td>
                <td>${student.admissionNumber || 'N/A'}</td>
                <td>${student.fullName || 'N/A'}</td>
                <td>${student.className || 'N/A'}</td>
                <td>${student.gender ? student.gender.charAt(0).toUpperCase() + student.gender.slice(1) : 'N/A'}</td>
                <td>${student.parentName || 'N/A'}</td>
                <td>${student.parentPhone || 'N/A'}</td>
                <td><span class="status status-${status.toLowerCase().replace(/\s+/g, '-')}">${statusDisplay}</span></td>
                <td class="actions">
                    <button class="btn-action btn-view" data-id="${student.id}">View</button>
                    <button class="btn-action btn-edit" data-id="${student.id}">Edit</button>
                    <button class="btn-action btn-delete" data-id="${student.id}">Delete</button>
                </td>
            `;
            tableBody.appendChild(row);
        });
    }


    filterByClass(className) {
        if (!className) {
            this.renderStudentTable();
            return;
        }
        
        const filteredStudents = this.students.filter(student => 
            student.className === className
        );
        
        this.renderFilteredStudents(filteredStudents);
    }
    
    filterByStatus(status) {
        if (!status) {
            this.renderStudentTable();
            return;
        }
        
        const filteredStudents = this.students.filter(student => 
            student.status && student.status.toLowerCase() === status.toLowerCase()
        );
        
        this.renderFilteredStudents(filteredStudents);
    }

    // Show the add student modal in edit mode
    showAddStudentModal(student = null) {
        const modal = document.getElementById('add-student-modal');
        if (!modal) return;

        const form = document.getElementById('add-student-form');
        if (!form) return;

        // Reset form and clear any previous data
        form.reset();
        form.dataset.editMode = student ? 'true' : 'false';
        form.dataset.studentId = student ? student.id : '';

        // Set modal title
        const modalTitle = modal.querySelector('h2');
        if (modalTitle) {
            modalTitle.textContent = student ? 'Edit Student' : 'Add New Student';
        }

        // If in edit mode, populate the form with student data
        if (student) {
            // Basic Information
            if (form.fullName) form.fullName.value = student.fullName || '';
            if (form.admissionNumber) form.admissionNumber.value = student.admissionNumber || '';
            if (form.className) form.className.value = student.className || '';
            if (form.gender) form.gender.value = student.gender || '';
            if (form.dateOfBirth) form.dateOfBirth.value = student.dateOfBirth ? student.dateOfBirth.split('T')[0] : '';
            
            // Parent/Guardian Information
            if (form.parentName) form.parentName.value = student.parentName || '';
            if (form.parentPhone) form.parentPhone.value = student.parentPhone || '';
            if (form.parentEmail) form.parentEmail.value = student.parentEmail || '';
            if (form.address) form.address.value = student.address || '';
            
            // Additional Information
            if (form.status) form.status.value = student.status || 'Active';
            if (form.bloodGroup) form.bloodGroup.value = student.bloodGroup || '';
            if (form.allergies) form.allergies.value = student.allergies || '';
            if (form.medicalConditions) form.medicalConditions.value = student.medicalConditions || '';
        }

        // Show the modal
        modal.style.display = 'block';
    }


    editStudent(studentId) {
        try {
            // Convert studentId to number for comparison if it's a string
            const id = typeof studentId === 'string' ? parseInt(studentId, 10) : studentId;
            const student = this.students.find(s => s.id === id);
            
            if (!student) {
                console.error('Student not found with ID:', studentId);
                return;
            }
            
            // Show the edit modal with student data
            this.showAddStudentModal(student);
            
        } catch (error) {
            console.error('Error preparing to edit student:', error);
            alert('An error occurred while preparing to edit the student. Please try again.');
        }
    }

    viewStudentDetails(studentId) {
        try {
            console.log('Viewing student details for ID:', studentId);
            
            // Find the student
            const student = this.students.find(s => s.id == studentId);
            if (!student) {
                console.error('Student not found with ID:', studentId);
                this.showNotification('Student not found.', 'error');
                return;
            }

            // Get the modal element
            const modal = document.getElementById('student-details-modal');
            if (!modal) {
                console.error('Student details modal not found');
                return;
            }

            // Map student data to modal fields
            const fieldMappings = {
                'fullName': 'student-details-name',
                'admissionNumber': 'student-details-admission',
                'className': 'student-details-class',
                'gender': 'student-details-gender',
                'dateOfBirth': 'student-details-dob',
                'parentName': 'student-details-parent',
                'parentPhone': 'student-details-phone',
                'parentEmail': 'student-details-email',
                'address': 'student-details-address',
                'status': 'student-details-status',
                'admissionDate': 'student-details-admission-date',
                'bloodGroup': 'student-details-blood-group',
                'allergies': 'student-details-allergies',
                'medicalConditions': 'student-details-conditions'
            };

            // Populate the modal with student data
            Object.entries(fieldMappings).forEach(([studentField, elementId]) => {
                const element = document.getElementById(elementId);
                if (element) {
                    element.textContent = student[studentField] || 'N/A';
                } else {
                    console.warn(`Element with ID ${elementId} not found`);
                }
            });

            // Show the modal
            modal.style.display = 'block';
            console.log('Modal should be visible now');

            // Set up close button
            const closeBtn = modal.querySelector('.close');
            if (closeBtn) {
                closeBtn.onclick = () => {
                    console.log('Close button clicked');
                    modal.style.display = 'none';
                };
            } else {
                console.warn('Close button not found in modal');
            }

            // Close when clicking outside
            modal.onclick = (event) => {
                if (event.target === modal) {
                    console.log('Clicked outside modal, closing');
                    modal.style.display = 'none';
                }
            };

        } catch (error) {
            console.error('Error showing student details:', error);
            this.showNotification('Error showing student details: ' + error.message, 'error');
        }
    }

    async deleteStudent(studentId) {
        try {
            // Convert studentId to number for comparison if it's a string
            const id = typeof studentId === 'string' ? parseInt(studentId, 10) : studentId;
            
            // Find the student to get their name for the confirmation message
            const student = this.students.find(s => s.id === id);
            if (!student) {
                console.error('Student not found with ID:', studentId);
                this.showNotification('Student not found.', 'error');
                return;
            }
            
            // Ask for confirmation
            const confirmDelete = await api.confirm(`Are you sure you want to delete ${student.fullName} (${student.admissionNumber})? This action cannot be undone.`);
            
            if (!confirmDelete) {
                return; // User cancelled the deletion
            }
            
            // Remove the student from the array
            const initialLength = this.students.length;
            this.students = this.students.filter(s => s.id !== id);
            
            if (this.students.length === initialLength) {
                // No student was removed (shouldn't happen due to previous check, but just in case)
                throw new Error('Failed to delete student. Student not found.');
            }
            
            // Save to localStorage
            this.saveToLocalStorage();
            
            // Update the table
            this.renderStudentTable();
            
            // Show success message
            this.showNotification('Student deleted successfully!', 'success');
            
        } catch (error) {
            console.error('Error deleting student:', error);
            this.showNotification('Error deleting student. Please try again.', 'error');
        }
    }

    async saveStudent(studentData) {
        try {
            let response;
            
            if (studentData.id) {
                // Update existing student
                response = await api.put(`/api/students/${studentData.id}`, studentData);
                
                // Update local state
                const index = this.students.findIndex(s => s.id === studentData.id);
                if (index !== -1) {
                    this.students[index] = { ...response, lastUpdated: new Date().toISOString() };
                }
            } else {
                // Add new student
                response = await api.post('/api/students', {
                    ...studentData,
                    admissionDate: new Date().toISOString().split('T')[0],
                    status: 'Active'
                });
                
                // Add to local state
                this.students.push(response);
            }
            
            this.saveToLocalStorage();
            this.renderStudentTable();
            this.showNotification('Student saved successfully!', 'success');
            return true;
        } catch (error) {
            console.error('Error saving student:', error);
            this.showNotification(error.message || 'Failed to save student. Please try again.', 'error');
            return false;
        }
    }

    viewStudentDetails(studentId) {
        try {
            // Convert studentId to number for comparison if it's a string
            const id = typeof studentId === 'string' ? parseInt(studentId, 10) : studentId;
            const student = this.students.find(s => s.id === id);
            
            if (!student) {
                console.error('Student not found with ID:', studentId);
                return;
            }

            // Show student details in a modal
            const modal = document.getElementById('student-details-modal');
            if (!modal) {
                console.error('Modal element not found');
                return;
            }


            // Helper function to safely set text content
            const setTextContent = (id, value) => {
                const element = document.getElementById(id);
                if (element) element.textContent = value !== undefined ? value : 'N/A';
            };

            // Format dates if they exist
            const formatDate = (dateString) => {
                if (!dateString) return 'N/A';
                try {
                    const date = new Date(dateString);
                    return date.toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                    });
                } catch (e) {
                    return dateString; // Return as is if date parsing fails
                }
            };

            // Basic Information
            setTextContent('student-details-name', student.fullName);
            setTextContent('student-details-admission', student.admissionNumber);
            setTextContent('student-details-class', student.className);
            setTextContent('student-details-gender', student.gender);
            setTextContent('student-details-dob', formatDate(student.dateOfBirth));
            
            // Parent/Guardian Information
            setTextContent('student-details-parent', student.parentName);
            setTextContent('student-details-phone', student.parentPhone);
            setTextContent('student-details-email', student.parentEmail);
            setTextContent('student-details-address', student.address);
            
            // Academic Information
            setTextContent('student-details-status', student.status);
            setTextContent('student-details-admission-date', formatDate(student.admissionDate));
            setTextContent('student-details-updated', formatDate(student.updatedAt || student.createdAt));
            
            // Additional Information
            setTextContent('student-details-blood-group', student.bloodGroup);
            setTextContent('student-details-allergies', student.allergies);
            setTextContent('student-details-conditions', student.medicalConditions);

            // Show the modal
            modal.style.display = 'block';
            
            // Close modal when clicking outside the content
            const closeModal = (event) => {
                if (event.target === modal) {
                    modal.style.display = 'none';
                    window.removeEventListener('click', closeModal);
                }
            };
            
            // Add the event listener
            window.addEventListener('click', closeModal);
            
            // Handle the close button inside the modal
            const closeBtn = modal.querySelector('.close');
            if (closeBtn) {
                closeBtn.onclick = () => {
                    modal.style.display = 'none';
                    window.removeEventListener('click', closeModal);
                };
            }
            
        } catch (error) {
            console.error('Error showing student details:', error);
            alert('An error occurred while loading student details. Please try again.');
        }
    }
}

// Initialize student manager when the page loads
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM fully loaded, initializing student manager...');
    
    // Only initialize if not already initialized
    if (!window.studentManager) {
        console.log('Creating new StudentManagement instance...');
        window.studentManager = new StudentManagement();
        
        // Check if methods exist
        console.log('StudentManager methods:', {
            initialize: typeof window.studentManager.initialize === 'function',
            setupActionButtons: typeof window.studentManager.setupActionButtons === 'function',
            viewStudentDetails: typeof window.studentManager.viewStudentDetails === 'function',
            editStudent: typeof window.studentManager.editStudent === 'function',
            deleteStudent: typeof window.studentManager.deleteStudent === 'function'
        });
        
        try {
            window.studentManager.initialize();
            console.log('StudentManager initialized successfully');
            
            // Manually trigger setupActionButtons after a short delay to ensure DOM is ready
            setTimeout(() => {
                console.log('Manually triggering setupActionButtons...');
                if (window.studentManager && typeof window.studentManager.setupActionButtons === 'function') {
                    window.studentManager.setupActionButtons();
                } else {
                    console.error('studentManager or setupActionButtons not available');
                }
            }, 500);
            
        } catch (error) {
            console.error('Error initializing StudentManager:', error);
        }
        
        // Save data before page unload
        window.addEventListener('beforeunload', () => {
            if (window.studentManager) {
                console.log('Saving data before unload...');
                window.studentManager.saveToLocalStorage();
            }
        });
    } else {
        console.log('StudentManager already initialized');
    }
    
    // Add global reference for debugging
    window.debugStudentManager = window.studentManager;
    console.log('window.studentManager available for debugging');
});
