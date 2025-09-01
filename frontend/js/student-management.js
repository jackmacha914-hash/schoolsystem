// Student Management System
class StudentManagement {
    constructor() {
        this.students = [];
        this.currentPage = 1;
        this.itemsPerPage = 10;
        this.currentSort = { column: 'admissionNumber', direction: 'asc' };
        this.initialize();
    }

    async initialize() {
        await this.loadStudents();
        this.renderStudentTable();
        this.setupEventListeners();
        
        // Add event delegation for action buttons
        document.addEventListener('click', (e) => {
            const target = e.target.closest('[data-action]');
            if (!target) return;
            
            const action = target.getAttribute('data-action');
            const studentId = parseInt(target.closest('tr').dataset.studentId);
            
            if (!studentId) return;
            
            switch(action) {
                case 'view':
                    this.viewStudentDetails(studentId);
                    break;
                case 'edit':
                    this.editStudent(studentId);
                    break;
                case 'delete':
                    this.deleteStudent(studentId);
                    break;
                case 'reset-password':
                    this.resetPassword(studentId);
                    break;
            }
        });
    }

    async loadStudents() {
        try {
            // Try to load from localStorage first
            const savedStudents = localStorage.getItem('students');
            
            if (savedStudents) {
                this.students = JSON.parse(savedStudents);
                console.log('Loaded students from localStorage');
                return;
            }
            
            // If no data in localStorage, try to load from API if available
            try {
                const response = await fetch('/api/students');
                if (response.ok) {
                    const data = await response.json();
                    if (Array.isArray(data) && data.length > 0) {
                        this.students = data;
                        this.saveToLocalStorage();
                        return;
                    }
                }
            } catch (apiError) {
                console.warn('API not available, using sample data:', apiError);
            }
            
            // Fall back to sample data if no data in localStorage or API
            this.loadSampleData();
            this.saveToLocalStorage();
            this.showNotification('Using sample data. API endpoint not available.', 'info');
            
        } catch (error) {
            console.error('Error loading students:', error);
            this.loadSampleData(); // Ensure we always have some data to display
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
                parentPhone: '+254712345678',
                parentEmail: 'parent1@example.com',
                address: '123 Main St, Nairobi',
                status: 'Active',
                admissionDate: '2023-01-10',
                lastUpdated: '2023-05-20',
                bloodGroup: 'O+',
                allergies: 'Peanuts',
                medicalConditions: 'Asthma'
            },
            {
                id: 2,
                admissionNumber: 'STD002',
                fullName: 'Sarah Johnson',
                className: 'Form 2B',
                gender: 'Female',
                dateOfBirth: '2009-08-22',
                parentName: 'Michael Johnson',
                parentPhone: '+254723456789',
                parentEmail: 'mjohnson@example.com',
                address: '456 Park Ave, Mombasa',
                status: 'Active',
                admissionDate: '2022-01-15',
                lastUpdated: '2023-05-18',
                bloodGroup: 'A-',
                allergies: 'None',
                medicalConditions: 'None'
            },
            {
                id: 3,
                admissionNumber: 'STD003',
                fullName: 'David Kimani',
                className: 'Form 3A',
                gender: 'Male',
                dateOfBirth: '2008-03-10',
                parentName: 'Esther Kimani',
                parentPhone: '+254734567890',
                parentEmail: 'ekimani@example.com',
                address: '789 Valley Rd, Nakuru',
                status: 'Active',
                admissionDate: '2021-01-12',
                lastUpdated: '2023-05-15',
                bloodGroup: 'B+',
                allergies: 'Dust',
                medicalConditions: 'None'
            },
            {
                id: 4,
                admissionNumber: 'STD004',
                fullName: 'Grace Wanjiku',
                className: 'Form 4B',
                gender: 'Female',
                dateOfBirth: '2007-11-30',
                parentName: 'James Mwangi',
                parentPhone: '+254745678901',
                parentEmail: 'jmwangi@example.com',
                address: '321 Hilltop Dr, Eldoret',
                status: 'Graduated',
                admissionDate: '2020-01-08',
                lastUpdated: '2023-05-10',
                bloodGroup: 'AB+',
                allergies: 'None',
                medicalConditions: 'None'
            },
            {
                id: 5,
                admissionNumber: 'STD005',
                fullName: 'Brian Omondi',
                className: 'Form 1B',
                gender: 'Male',
                dateOfBirth: '2010-07-25',
                parentName: 'Susan Omondi',
                parentPhone: '+254756789012',
                parentEmail: 'somondi@example.com',
                address: '654 Lakeview, Kisumu',
                status: 'Active',
                admissionDate: '2023-01-15',
                lastUpdated: '2023-05-22',
                bloodGroup: 'O-',
                allergies: 'Dairy',
                medicalConditions: 'None'
            }
        ];
    }

    renderStudentTable() {
        const tableBody = document.getElementById('student-table-body');
        if (!tableBody) return;

        const startIndex = (this.currentPage - 1) * this.itemsPerPage;
        const paginatedStudents = this.students.slice(startIndex, startIndex + this.itemsPerPage);

        tableBody.innerHTML = paginatedStudents.length > 0 
            ? paginatedStudents.map(student => this.createStudentRow(student)).join('')
            : '<tr><td colspan="10" class="text-center">No students found</td></tr>';

        this.updatePagination();
    }

    createStudentRow(student) {
        return `
            <tr data-student-id="${student.id}">
                <td><input type="checkbox" class="student-checkbox"></td>
                <td>${student.admissionNumber}</td>
                <td>${student.fullName}</td>
                <td>${student.className}</td>
                <td>${student.gender}</td>
                <td>${student.parentName}</td>
                <td>${student.parentPhone}</td>
                <td>${student.status}</td>
                <td class="actions">
                    <button class="btn-view" data-action="view" title="View Details">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="btn-edit" data-action="edit" title="Edit Student">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn-delete" data-action="delete" title="Delete Student">
                        <i class="fas fa-trash"></i>
                    </button>
                    <button class="btn-reset" data-action="reset-password" title="Reset Password">
                        <i class="fas fa-key"></i>
                    </button>
                </td>
            </tr>
        `;
    }

    updatePagination() {
        const totalPages = Math.ceil(this.students.length / this.itemsPerPage);
        const pagination = document.getElementById('pagination');
        if (!pagination) return;

        let paginationHTML = `
            <button ${this.currentPage === 1 ? 'disabled' : ''} onclick="studentManager.changePage(${this.currentPage - 1})">
                &laquo; Previous
            </button>
        `;

        for (let i = 1; i <= totalPages; i++) {
            paginationHTML += `
                <button ${i === this.currentPage ? 'class="active"' : ''} 
                        onclick="studentManager.changePage(${i})">
                    ${i}
                </button>
            `;
        }

        paginationHTML += `
            <button ${this.currentPage === totalPages ? 'disabled' : ''} 
                    onclick="studentManager.changePage(${this.currentPage + 1})">
                Next &raquo;
            </button>
        `;

        pagination.innerHTML = paginationHTML;
    }

    changePage(page) {
        this.currentPage = page;
        this.renderStudentTable();
        window.scrollTo(0, 0);
    }

    sortTable(column) {
        if (this.currentSort.column === column) {
            this.currentSort.direction = this.currentSort.direction === 'asc' ? 'desc' : 'asc';
        } else {
            this.currentSort = { column, direction: 'asc' };
        }

        this.students.sort((a, b) => {
            let valueA = a[column];
            let valueB = b[column];

            if (typeof valueA === 'string') valueA = valueA.toLowerCase();
            if (typeof valueB === 'string') valueB = valueB.toLowerCase();

            if (valueA < valueB) return this.currentSort.direction === 'asc' ? -1 : 1;
            if (valueA > valueB) return this.currentSort.direction === 'asc' ? 1 : -1;
            return 0;
        });

        this.renderStudentTable();
    }

    async searchStudents(query) {
        if (!query) {
            await this.loadStudents();
        } else {
            const searchTerm = query.toLowerCase();
            this.students = this.students.filter(student => 
                Object.values(student).some(
                    value => value && value.toString().toLowerCase().includes(searchTerm)
                )
            );
        }
        this.currentPage = 1;
        this.renderStudentTable();
    }

    viewStudentDetails(studentId) {
        const student = this.students.find(s => s.id === studentId);
        if (!student) return;

        // Show student details in a modal
        const modal = document.getElementById('student-details-modal');
        if (!modal) return;

        // Populate modal with student details
        document.getElementById('student-details-name').textContent = student.fullName;
        document.getElementById('student-details-admission').textContent = student.admissionNumber;
        document.getElementById('student-details-class').textContent = student.className;
        document.getElementById('student-details-gender').textContent = student.gender;
        document.getElementById('student-details-dob').textContent = student.dateOfBirth;
        document.getElementById('student-details-parent').textContent = student.parentName;
        document.getElementById('student-details-phone').textContent = student.parentPhone;
        document.getElementById('student-details-email').textContent = student.parentEmail;
        document.getElementById('student-details-address').textContent = student.address;
        document.getElementById('student-details-status').textContent = student.status;

        // Show the modal
        modal.style.display = 'block';
    }

    editStudent(studentId) {
        const student = this.students.find(s => s.id === studentId);
        if (!student) return;
        
        // Open edit modal with student data
        const modal = document.getElementById('edit-student-modal');
        if (!modal) {
            console.error('Edit student modal not found');
            return;
        }
        
        // Populate form with student data
        const form = modal.querySelector('form');
        if (form) {
            Object.keys(student).forEach(key => {
                const input = form.querySelector(`[name="${key}"]`);
                if (input) {
                    input.value = student[key] || '';
                }
            });
        }
        
        // Show the modal
        modal.style.display = 'block';
        
        // Save reference to the student being edited
        modal.dataset.studentId = studentId;
    }

    async deleteStudent(studentId) {
        if (!confirm('Are you sure you want to delete this student? This action cannot be undone.')) return;
        
        try {
            // In a real app, you would make an API call here
            // const response = await fetch(`/api/students/${studentId}`, {
            //     method: 'DELETE',
            //     headers: {
            //         'Authorization': `Bearer ${localStorage.getItem('token')}`
            //     }
            // });
            
            // For demo purposes, we'll just remove from the local array
            this.students = this.students.filter(s => s.id !== studentId);
            this.saveToLocalStorage();
            this.renderStudentTable();
            this.showNotification('Student deleted successfully', 'success');
            
        } catch (error) {
            console.error('Error deleting student:', error);
            this.showNotification('Error deleting student: ' + (error.message || 'Unknown error'), 'error');
        }
    }
    
    async resetPassword(studentId) {
        const student = this.students.find(s => s.id === studentId);
        if (!student) return;
        
        const newPassword = prompt(`Reset password for ${student.fullName}. Enter new password:`);
        if (!newPassword) return; // User cancelled
        
        try {
            // In a real app, you would make an API call here
            // const response = await fetch(`/api/students/${studentId}/reset-password`, {
            //     method: 'POST',
            //     headers: {
            //         'Content-Type': 'application/json',
            //         'Authorization': `Bearer ${localStorage.getItem('token')}`
            //     },
            //     body: JSON.stringify({ newPassword })
            // });
            
            // For demo purposes, we'll just show a success message
            this.showNotification(`Password reset for ${student.fullName}`, 'success');
            
        } catch (error) {
            console.error('Error resetting password:', error);
            this.showNotification('Error resetting password: ' + (error.message || 'Unknown error'), 'error');
        }
    }

    showAddStudentModal() {
        // Get the modal element
        const modal = document.getElementById('add-student-modal');
        if (!modal) {
            console.error('Add student modal not found');
            return;
        }
        
        // Reset the form
        const form = document.getElementById('add-student-form');
        if (form) form.reset();
        
        // Show the modal
        modal.style.display = 'block';
        
        // Set up close button
        const closeBtn = modal.querySelector('.close');
        if (closeBtn) {
            closeBtn.onclick = () => modal.style.display = 'none';
        }
        
        // Close when clicking outside the modal
        window.onclick = (event) => {
            if (event.target === modal) {
                modal.style.display = 'none';
            }
        };
    }
    
    handleAddStudent(event) {
        event.preventDefault();
        
        // Get form data
        const form = event.target;
        const formData = new FormData(form);
        const studentData = {};
        
        // Convert FormData to object
        formData.forEach((value, key) => {
            studentData[key] = value;
        });
        
        // Generate a new ID (in a real app, this would be done by the server)
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
            dateOfBirth: studentData.dateOfBirth,
            parentName: studentData.parentName,
            parentPhone: studentData.parentPhone,
            parentEmail: studentData.parentEmail,
            address: studentData.address,
            status: 'Active',
            admissionDate: new Date().toISOString().split('T')[0],
            lastUpdated: new Date().toISOString().split('T')[0],
            bloodGroup: studentData.bloodGroup || 'Not specified',
            allergies: studentData.allergies || 'None',
            medicalConditions: studentData.medicalConditions || 'None'
        };
        
        // Add to students array
        this.students.unshift(newStudent);
        
        // Update the table
        this.currentPage = 1; // Go back to first page
        this.renderStudentTable();
        
        // Close the modal
        const modal = document.getElementById('add-student-modal');
        if (modal) modal.style.display = 'none';
        
        // Show success message
        this.showNotification('Student added successfully', 'success');
    }
    
    showNotification(message, type = 'info') {
        // Check if notification system exists, fallback to alert
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
        // Search functionality
        const searchInput = document.getElementById('student-search');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.searchStudents(e.target.value);
            });
        }

        // Class filter
        const classFilter = document.getElementById('class-filter');
        if (classFilter) {
            classFilter.addEventListener('change', (e) => {
                this.filterByClass(e.target.value);
            });
        }

        // Close modal when clicking outside
        const modal = document.getElementById('student-details-modal');
        if (modal) {
            window.addEventListener('click', (e) => {
                if (e.target === modal) {
                    modal.style.display = 'none';
                }
            });
        }
    }


    filterByClass(className) {
        if (!className) {
            this.loadStudents();
            return;
        }
        this.students = this.students.filter(student => student.className === className);
        this.currentPage = 1;
        this.renderStudentTable();
        this.showNotification(`Filtered by class: ${className}`, 'info');
    }

    showAddStudentModal() {
// Get the modal element
const modal = document.getElementById('add-student-modal');
if (!modal) {
    console.error('Add student modal not found');
    return;
}
    
// Reset the form
const form = document.getElementById('add-student-form');
if (form) form.reset();
    
// Show the modal
modal.style.display = 'block';
    
// Set up close button
const closeBtn = modal.querySelector('.close');
if (closeBtn) {
    closeBtn.onclick = () => modal.style.display = 'none';
}
    
// Close when clicking outside the modal
window.onclick = (event) => {
    if (event.target === modal) {
        modal.style.display = 'none';
    }
};
}

handleAddStudent(event) {
event.preventDefault();
    
// Get form data
const form = event.target;
const formData = new FormData(form);
const studentData = {};
    
// Convert FormData to object
formData.forEach((value, key) => {
    studentData[key] = value;
});
    
// Generate a new ID (in a real app, this would be done by the server)
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
    dateOfBirth: studentData.dateOfBirth,
    parentName: studentData.parentName,
    parentPhone: studentData.parentPhone,
    parentEmail: studentData.parentEmail,
    address: studentData.address,
    status: 'Active',
    admissionDate: new Date().toISOString().split('T')[0],
    lastUpdated: new Date().toISOString().split('T')[0],
    bloodGroup: studentData.bloodGroup || 'Not specified',
    allergies: studentData.allergies || 'None',
    medicalConditions: studentData.medicalConditions || 'None'
};
    
// Add to students array
this.students.unshift(newStudent);
    
// Update the table
this.currentPage = 1; // Go back to first page
this.renderStudentTable();
    
// Close the modal
const modal = document.getElementById('add-student-modal');
if (modal) modal.style.display = 'none';
    
// Show success message
this.showNotification('Student added successfully', 'success');
}

showNotification(message, type = 'info') {
// Check if notification system exists, fallback to alert
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
// Search functionality
const searchInput = document.getElementById('student-search');
if (searchInput) {
    searchInput.addEventListener('input', (e) => {
        this.searchStudents(e.target.value);
    });
}

// Class filter
const classFilter = document.getElementById('class-filter');
if (classFilter) {
    classFilter.addEventListener('change', (e) => {
        this.filterByClass(e.target.value);
    });
}

// Close modal when clicking outside
const modal = document.getElementById('student-details-modal');
if (modal) {
    window.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.style.display = 'none';
        }
    });
}
}

filterByClass(className) {
if (!className) {
    this.loadStudents();
    return;
}
}

saveToLocalStorage() {
    localStorage.setItem('students', JSON.stringify(this.students));
}

loadFromLocalStorage() {
    const storedStudents = localStorage.getItem('students');
    if (storedStudents) {
        this.students = JSON.parse(storedStudents);
    }
}

// Initialize student manager when the page loads
document.addEventListener('DOMContentLoaded', () => {
    // Create and initialize the student manager
    window.studentManager = new StudentManagement();
    
    // Set up event listeners for modals
    function setupModalListeners() {
        // Close modals when clicking the close button
        document.querySelectorAll('.modal .close').forEach(btn => {
            btn.addEventListener('click', function() {
                this.closest('.modal').style.display = 'none';
            });
        });
        
        // Close modals when clicking outside
        document.querySelectorAll('.modal').forEach(modal => {
            modal.addEventListener('click', function(e) {
                if (e.target === this) {
                    this.style.display = 'none';
                }
            });
        });
    }
    
    // Handle edit form submission
    function setupEditForm() {
        const editForm = document.getElementById('edit-student-form');
        if (!editForm) return;
        
        editForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const modal = e.target.closest('.modal');
            const studentId = modal ? parseInt(modal.dataset.studentId) : null;
            
            if (!studentId || !window.studentManager) return;
            
            const formData = new FormData(e.target);
            const updatedData = {};
            formData.forEach((value, key) => {
                updatedData[key] = value;
            });
            
            const student = window.studentManager.students.find(s => s.id === studentId);
            if (student) {
                // Update student data
                Object.assign(student, updatedData);
                student.lastUpdated = new Date().toISOString().split('T')[0];
                
                // Save and update UI
                window.studentManager.saveToLocalStorage();
                window.studentManager.renderStudentTable();
                modal.style.display = 'none';
                window.studentManager.showNotification('Student updated successfully', 'success');
            }
        });
    }
    
    // Initialize all components
    setupModalListeners();
    setupEditForm();
});
