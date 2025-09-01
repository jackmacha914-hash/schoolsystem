let teachers = JSON.parse(localStorage.getItem('teachers')) || [];
let students = JSON.parse(localStorage.getItem('students')) || [];
// let books = JSON.parse(localStorage.getItem('books')) || [];
let payments = JSON.parse(localStorage.getItem('payments')) || [];

// Initial data rendering
function renderData() {
    updateTeacherCount();
    updateStudentCount();
    renderTeachersTable();
    renderPaymentTable();
    renderCharts();
}

// Dashboard Count Updates
function updateTeacherCount() {
    document.getElementById("teacher-count").textContent = teachers.length;
}

function updateStudentCount() {
    document.getElementById("student-count").textContent = students.length;
}

// Charts
function renderCharts() {
    const ctx1 = document.getElementById('studentChart').getContext('2d');
    const studentChart = new Chart(ctx1, {
        type: 'pie',
        data: {
            labels: ['Students'],
            datasets: [{
                label: 'Student Count',
                data: [students.length],
                backgroundColor: ['#007bff'],
                borderColor: ['#0056b3'],
                borderWidth: 1
            }]
        }
    });

    const ctx2 = document.getElementById('teacherChart').getContext('2d');
    const teacherChart = new Chart(ctx2, {
        type: 'pie',
        data: {
            labels: ['Teachers'],
            datasets: [{
                label: 'Teacher Count',
                data: [teachers.length],
                backgroundColor: ['#28a745'],
                borderColor: ['#218838'],
                borderWidth: 1
            }]
        }
    });
}

// Render Teachers Table
function renderTeachersTable() {
    const teacherTableBody = document.getElementById('teacher-table-body');
    teacherTableBody.innerHTML = teachers.map((teacher, index) => `
        <tr>
            <td>${teacher.name}</td>
            <td>${teacher.email}</td>
            <td>${teacher.subject}</td>
            <td>
                <button onclick="editTeacher(${index})">Edit</button>
                <button onclick="removeTeacher(${index})">Delete</button>
            </td>
        </tr>
    `).join('');
}

// Remove Teacher
function removeTeacher(index) {
    teachers.splice(index, 1);
    localStorage.setItem('teachers', JSON.stringify(teachers));
    renderTeachersTable();
}

// Edit Teacher
function editTeacher(index) {
    const teacher = teachers[index];
    document.getElementById('teacher-name').value = teacher.name;
    document.getElementById('teacher-email').value = teacher.email;
    document.getElementById('teacher-subject').value = teacher.subject;
    teachers.splice(index, 1);
    localStorage.setItem('teachers', JSON.stringify(teachers));
}

// Add Teacher Form Handling
document.getElementById('add-teacher-form').addEventListener('submit', function(event) {
    event.preventDefault();
    const name = document.getElementById('teacher-name').value;
    const email = document.getElementById('teacher-email').value;
    const subject = document.getElementById('teacher-subject').value;

    if (name && email && subject) {
        teachers.push({name, email, subject});
        localStorage.setItem('teachers', JSON.stringify(teachers));
        renderTeachersTable();
    } else {
        alert('All fields are required!');
    }
});

// Search Teachers
function searchTeachers() {
    const query = document.getElementById('teacher-search').value.toLowerCase();
    const filteredTeachers = teachers.filter(teacher => teacher.name.toLowerCase().includes(query));
    renderFilteredTeachersTable(filteredTeachers);
}

// Render filtered teachers
function renderFilteredTeachersTable(filteredTeachers) {
    const teacherTableBody = document.getElementById('teacher-table-body');
    teacherTableBody.innerHTML = filteredTeachers.map((teacher, index) => `
        <tr>
            <td>${teacher.name}</td>
            <td>${teacher.email}</td>
            <td>${teacher.subject}</td>
            <td>
                <button onclick="editTeacher(${index})">Edit</button>
                <button onclick="removeTeacher(${index})">Delete</button>
            </td>
        </tr>
    `).join('');
}

// Handle Logout
document.getElementById('logout-link').addEventListener('click', function() {
    localStorage.clear();
    window.location.reload();
});

// Initialize the dashboard
renderData();
