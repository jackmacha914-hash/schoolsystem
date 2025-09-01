// Class Management Logic
document.addEventListener('DOMContentLoaded', async function() {
    const createClassForm = document.getElementById('createClassForm');
    const classesList = document.getElementById('classesList');
    const addStudentModal = document.getElementById('addStudentModal');
    const addStudentForm = document.getElementById('addStudentForm');
    const studentSearch = document.getElementById('studentSearch');
    const studentsList = document.getElementById('studentsList');
    const closeAddStudentModal = document.getElementById('closeAddStudentModal');

    // Initialize the page
    await loadClasses();

    // Create Class Form Submission
    if (createClassForm) {
        createClassForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            await createClass(this);
            this.reset();
        });
    }

    // Close Add Student Modal
    if (closeAddStudentModal) {
        closeAddStudentModal.addEventListener('click', () => {
            addStudentModal.style.display = 'none';
            addStudentForm.reset();
        });
    }

    // Student Search
    if (studentSearch) {
        studentSearch.addEventListener('input', async function() {
            await searchStudents(this.value);
        });
    }

    // Add Student Form Submission
    if (addStudentForm) {
        addStudentForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            await addSelectedStudents();
            addStudentModal.style.display = 'none';
            addStudentForm.reset();
        });
    }
});

// Create a new class
async function createClass(form) {
    try {
        const token = localStorage.getItem('token');
        const formData = new FormData(form);
        const classData = Object.fromEntries(formData);

        const response = await fetch('http://localhost:5000/api/classes', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(classData)
        });

        if (!response.ok) {
            throw new Error('Failed to create class');
        }

        await loadClasses();
        showNotification('Class created successfully!', 'success');
    } catch (error) {
        console.error('Error creating class:', error);
        showNotification('Error creating class. Please try again.', 'error');
    }
}

// Load all classes for the teacher
async function loadClasses() {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch('http://localhost:5000/api/classes/teacher', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error('Failed to fetch classes');
        }

        const classes = await response.json();
        displayClasses(classes);
    } catch (error) {
        console.error('Error loading classes:', error);
        showNotification('Error loading classes. Please refresh the page.', 'error');
    }
}

// Display classes in the UI
function displayClasses(classes) {
    const classesList = document.getElementById('classesList');
    classesList.innerHTML = '';

    classes.forEach(cls => {
        const classItem = document.createElement('div');
        classItem.className = 'class-item';
        classItem.innerHTML = `
            <h3>${cls.name}</h3>
            <p><strong>Subject:</strong> ${cls.subject}</p>
            <p><strong>Schedule:</strong> ${cls.schedule.day} (${cls.schedule.startTime} - ${cls.schedule.endTime})</p>
            <p><strong>Students:</strong> ${cls.students.length}</p>
            <div class="actions">
                <button onclick="openAddStudentModal('${cls._id}')">Add Student</button>
                <button onclick="viewClassDetails('${cls._id}')">View Details</button>
            </div>
        `;
        classesList.appendChild(classItem);
    });
}

// Search students
async function searchStudents(query) {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`http://localhost:5000/api/users/students?search=${encodeURIComponent(query)}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error('Failed to search students');
        }

        const students = await response.json();
        displayStudents(students);
    } catch (error) {
        console.error('Error searching students:', error);
        showNotification('Error searching students. Please try again.', 'error');
    }
}

// Display students in the modal
function displayStudents(students) {
    const studentsList = document.getElementById('studentsList');
    studentsList.innerHTML = '';

    students.forEach(student => {
        const studentItem = document.createElement('div');
        studentItem.className = 'student-item';
        studentItem.innerHTML = `
            <input type="checkbox" name="studentIds" value="${student._id}">
            <span>${student.name} (${student.email})</span>
        `;
        studentsList.appendChild(studentItem);
    });
}

// Add selected students to class
async function addSelectedStudents() {
    try {
        const token = localStorage.getItem('token');
        const studentIds = Array.from(addStudentForm.querySelectorAll('input[name="studentIds"]:checked'))
            .map(checkbox => checkbox.value);

        if (studentIds.length === 0) {
            throw new Error('Please select at least one student');
        }

        const classId = addStudentForm.dataset.classId;
        const response = await fetch(`http://localhost:5000/api/classes/${classId}/students`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ studentIds })
        });

        if (!response.ok) {
            throw new Error('Failed to add students to class');
        }

        await loadClasses();
        showNotification('Students added successfully!', 'success');
    } catch (error) {
        console.error('Error adding students:', error);
        showNotification(error.message || 'Error adding students. Please try again.', 'error');
    }
}

// Open Add Student Modal
function openAddStudentModal(classId) {
    const modal = document.getElementById('addStudentModal');
    const form = document.getElementById('addStudentForm');
    form.dataset.classId = classId;
    modal.style.display = 'block';
}

// Show notification
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    document.body.appendChild(notification);

    setTimeout(() => {
        notification.remove();
    }, 3000);
}
