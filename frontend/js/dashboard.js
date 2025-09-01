console.log("Dashboard JS loaded");

document.addEventListener('DOMContentLoaded', () => {

    // Utility for notifications
    function displayNotification(message) {
        const notificationsList = document.getElementById('notifications');
        if (!notificationsList) return;
        const notificationItem = document.createElement('li');
        notificationItem.textContent = message;
        notificationsList.appendChild(notificationItem);
        document.getElementById('notifications-section').style.display = 'block';
    }

    // Get all the sidebar menu items (tabs) and sections
    const tabs = document.querySelectorAll('.tab-link');
    const sections = document.querySelectorAll('.tab-section');

    // Function to hide all sections
    function hideSections() {
        sections.forEach(section => {
            section.style.display = 'none';
        });
    }

    // Function to show a specific section
    function showSection(sectionId) {
        hideSections();
        const section = document.getElementById(sectionId);
        if (section) {
            section.style.display = 'block';
        }
    }

    // Function to set the active tab (highlighted tab)
    function setActiveTab(tab) {
        tabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
    }

    // Set up event listeners for each tab in the sidebar
    tabs.forEach(tab => {
        tab.addEventListener('click', function (e) {
            e.preventDefault();
            const sectionId = tab.getAttribute('data-tab');
            if (sectionId === 'registration-section') {
                // For registration tab, just show buttons
                showSection('registration-section');
            } else {
                // For other tabs, show the section
                showSection(sectionId);
            }
            setActiveTab(tab);
        });
    });

    // Add click handler for registration buttons
    document.querySelector('.add-learner-btn')?.addEventListener('click', function(e) {
        e.preventDefault();
        openRegistrationModal('student');
    });

    document.querySelector('.add-teacher-btn')?.addEventListener('click', function(e) {
        e.preventDefault();
        openRegistrationModal('teacher');
    });

    // Show default tab (Dashboard) on page load
    setActiveTab(tabs[0]);
    showSection(tabs[0].getAttribute('data-tab'));

    // Dashboard Stats
    async function loadDashboardStats() {
        const studentCountEl = document.getElementById('student-count');
        const teacherCountEl = document.getElementById('teacher-count');
        const eventCountEl = document.getElementById('event-count');

        try {
            const res = await authFetch('http://localhost:5000/api/stats');
            const stats = await res.json();
            studentCountEl.innerText = stats.students;
            teacherCountEl.innerText = stats.teachers;
            eventCountEl.innerText = stats.events;
        } catch (err) {
            console.error('Error loading stats:', err);
        }
    }

    // Utility function to fetch with Authorization (Bearer Token)
    function authFetch(url, options = {}) {
        const token = localStorage.getItem('token'); // Assuming token is stored in localStorage
        return fetch(url, {
            ...options,
            headers: {
                ...(options.headers || {}),
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            }
        });
    }

    // Function to fetch users (teachers, students, etc.) and display them
    async function fetchUsers() {
        try {
            const res = await fetch('http://localhost:5000/api/auth/signup', {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

            const users = await res.json();
            const teacherList = document.getElementById('teacher-list');
            const studentList = document.getElementById('student-list');

            // Clear existing lists
            teacherList.innerHTML = '';
            studentList.innerHTML = '';

            // Display teachers
            users.forEach(user => {
                const li = document.createElement('li');
                if (user.role === 'Teacher') {
                    li.textContent = `${user.name} - ${user.subject}`;
                    teacherList.appendChild(li);
                }
                if (user.role === 'Student') {
                    li.textContent = `${user.name} - Class: ${user.class}`;
                    studentList.appendChild(li);
                }
            });
        } catch (err) {
            console.error('Error fetching users:', err);
        }
    }

    // Add User Form Submission
    document.getElementById('add-user-form')?.addEventListener('submit', async function (e) {
        e.preventDefault();

        const name = document.getElementById('user-name').value.trim();
        const email = document.getElementById('user-email').value.trim();
        const username = document.getElementById('user-username').value.trim();
        const password = document.getElementById('user-password').value.trim();
        const role = document.getElementById('user-role').value;
        const subject = role === 'Teacher' ? document.getElementById('user-subject').value.trim() : undefined;
        const studentClass = role === 'Student' ? document.getElementById('user-class').value.trim() : undefined;
        const userAddMsg = document.getElementById('user-add-msg');

        // Validation
        let errorMsg = '';
        if (!name || !email || !username || !password || !role) {
            errorMsg = 'Please fill in all required fields.';
        } else if (role === 'Teacher' && !subject) {
            errorMsg = 'Please enter the subject for the teacher.';
        } else if (role === 'Student' && !studentClass) {
            errorMsg = 'Please enter the class for the student.';
        }
        if (errorMsg) {
            userAddMsg.textContent = errorMsg;
            userAddMsg.style.color = 'red';
            userAddMsg.style.display = 'block';
            return;
        }
        userAddMsg.style.display = 'none';

        try {
            const res = await fetch('http://localhost:5000/api/auth/signup', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ name, email, username, password, role, subject, studentClass })
            });

            const data = await res.json();
            if (res.ok) {
                userAddMsg.textContent = 'User added successfully!';
                userAddMsg.style.color = 'green';
                userAddMsg.style.display = 'block';
                fetchUsers();  // Refresh the user list
                this.reset();  // Reset the form
            } else {
                userAddMsg.textContent = data.error || data.msg || 'Failed to add user.';
                userAddMsg.style.color = 'red';
                userAddMsg.style.display = 'block';
            }
        } catch (err) {
            userAddMsg.textContent = 'Network error.';
            userAddMsg.style.color = 'red';
            userAddMsg.style.display = 'block';
        }
    });

    // Function to fetch accounts
    async function fetchAccounts() {
        try {
            const res = await authFetch('http://localhost:5000/api/accounts');
            const accounts = await res.json();

            const accountList = document.getElementById('account-list');
            accountList.innerHTML = '';

            accounts.forEach(record => {
                const li = document.createElement('li');
                li.textContent = `${record.description} - $${record.amount}`;
                accountList.appendChild(li);
            });
        } catch (err) {
            console.error('Error fetching accounts:', err);
        }
    }

    // Fetch clubs
    document.addEventListener('DOMContentLoaded', () => {
        const clubForm = document.getElementById('club-form');
        const clubNameInput = document.getElementById('club-name');
        const advisorInput = document.getElementById('club-description');

        // Debugging - Log to check if elements are selected
        console.log(clubForm, clubNameInput, advisorInput);

        if (clubForm && clubNameInput && advisorInput) {
            clubForm.addEventListener('submit', async (e) => {
                e.preventDefault();

                const name = clubNameInput.value.trim();
                const advisor = advisorInput.value.trim();

                console.log('Name:', name, 'Advisor:', advisor); // Debugging: Check form values

                if (!name || !advisor) {
                    alert('Please fill in all fields');
                    return;
                }

                try {
                    const res = await authFetch('http://localhost:5000/api/clubs', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ name, advisor })
                    });

                    if (res.ok) {
                        alert('✅ Club added!');
                        fetchClubs();
                        clubForm.reset();
                    } else {
                        const error = await res.json();
                        console.error('Error adding club:', error);
                    }
                } catch (err) {
                    console.error('Network or fetch error:', err);
                }
            });

            fetchClubs(); // Load clubs when form is ready
        } else {
            console.warn('Club form or inputs not found in DOM');
        }
    });

    // Fetch library books
    async function fetchBooks() {
        try {
            const res = await authFetch('http://localhost:5000/api/library/books');
            const books = await res.json();

            const bookList = document.getElementById('book-list');
            bookList.innerHTML = '';

            books.forEach(book => {
                const li = document.createElement('li');
                li.textContent = `${book.title} by ${book.author}`;
                bookList.appendChild(li);
            });
        } catch (err) {
            console.error('Error fetching books:', err);
        }
    }

    // Fetch events
    const eventForm = document.getElementById('event-form');

    if (eventForm) {
        eventForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const title = document.getElementById('event-title').value.trim();
            const description = document.getElementById('event-description').value.trim();

            if (!title || !description) {
                alert('Please fill in all fields');
                return;
            }

            try {
                const res = await authFetch('http://localhost:5000/api/events', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        title,
                        description,
                        date: new Date().toISOString(), // Using today's date for now
                        location: 'Unknown'             // Add input later if needed
                    })
                });

                const data = await res.json();
                if (!res.ok) throw new Error(data.msg || 'Error adding event');

                alert('✅ Event added!');
                eventForm.reset();
                fetchEvents(); // Refresh list
            } catch (err) {
                console.error('Error adding event:', err);
                alert('❌ Failed to add event.');
            }
        });
    }

    async function fetchEvents() {
        try {
            const res = await authFetch('http://localhost:5000/api/events');
            const events = await res.json();
            console.log('Events fetched:', events);

            const eventList = document.getElementById('event-list');
            eventList.innerHTML = '';

            events.forEach(event => {
                const li = document.createElement('li');
                li.textContent = `${event.title} on ${new Date(event.date).toLocaleDateString()}`;
                eventList.appendChild(li);
            });
        } catch (err) {
            console.error('Error fetching events:', err);
        }
    }

    // Function to fetch clubs and update the list
    async function fetchClubs() {
        try {
            const res = await authFetch('http://localhost:5000/api/clubs');
            const clubs = await res.json();
            console.log('Clubs fetched:', clubs);

            const clubList = document.getElementById('club-list');
            clubList.innerHTML = ''; // Clear existing list

            clubs.forEach(club => {
                const li = document.createElement('li');
                li.textContent = `${club.name} - Advisor: ${club.advisor}`;
                clubList.appendChild(li);
            });
        } catch (err) {
            console.error('Error fetching clubs:', err);
        }
    }

    // Add club form submission handler
    document.getElementById('club-form')?.addEventListener('submit', async function (e) {
        e.preventDefault();

        const name = document.getElementById('club-name').value.trim();
        const description = document.getElementById('club-description').value.trim();

        if (!name || !description) {
            alert('Please fill in all fields');
            return;
        }

        try {
            const res = await fetch('http://localhost:5000/api/clubs', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ name, description })
            });

            // Defensive: try to parse only if JSON
            let data = null;
            const contentType = res.headers.get('content-type');
            if (contentType && contentType.indexOf('application/json') !== -1) {
                data = await res.json();
            } else {
                const text = await res.text();
                throw new Error('Server did not return JSON. Response: ' + text);
            }

            if (!res.ok) throw new Error(data?.msg || 'Error adding club');

            alert('✅ Club added!');
            fetchClubs(); // Refresh the club list after adding a new club
            this.reset(); // Reset the form
        } catch (err) {
            console.error('Error adding club:', err);
            alert('❌ Failed to add club. ' + (err.message || ''));
        }
    });

    // Add teacher form
    document.getElementById('add-teacher-form')?.addEventListener('submit', async function (e) {
        e.preventDefault();
        const name = document.getElementById('teacher-name').value;
        const subject = document.getElementById('teacher-subject').value;
        const role = document.getElementById('teacher-role').value;

        try {
            const res = await authFetch('http://localhost:5000/api/users/teachers', {
                method: 'POST',
                body: JSON.stringify({ name, subject, role }),
            });

            if (res.ok) {
                displayNotification('New teacher added');
                fetchUsers();
                this.reset();
            }
        } catch (err) {
            console.error('Failed to add teacher:', err);
        }
    });

    // Add student form
    document.getElementById('add-student-form')?.addEventListener('submit', async function (e) {
        e.preventDefault();
        const name = document.getElementById('student-name').value;
        const studentClass = document.getElementById('student-class').value;
        const role = document.getElementById('student-role').value;

        try {
            const res = await authFetch('http://localhost:5000/api/users/students', {
                method: 'POST',
                body: JSON.stringify({ name, studentClass, role }),
            });

            if (res.ok) {
                displayNotification('New student added');
                fetchUsers();
                this.reset();
            }
        } catch (err) {
            console.error('Failed to add student:', err);
        }
    });

    // Broadcast form
    document.getElementById('broadcast-form')?.addEventListener('submit', async function (e) {
        e.preventDefault();
        const target = document.getElementById('broadcast-target').value;
        const title = document.getElementById('broadcast-title').value;
        const message = document.getElementById('broadcast-message').value;

        try {
            const res = await authFetch('http://localhost:5000/api/broadcast', {
                method: 'POST',
                body: JSON.stringify({ target, title, message })
            });

            if (res.ok) {
                const logList = document.getElementById('broadcast-log-list');
                const li = document.createElement('li');
                li.innerHTML = `<strong>${title}</strong> [${target}] - ${message}`;
                logList.appendChild(li);
                displayNotification('Broadcast sent');
                this.reset();
            }
        } catch (err) {
            console.error('Broadcast failed:', err);
        }
    });

    // Sidebar toggle
    document.querySelector('.sidebar-toggle')?.addEventListener('click', () => {
        document.querySelector('.sidebar')?.classList.toggle('open');
    });

    // Simulated backup
    document.getElementById('backup-btn')?.addEventListener('click', () => {
        window.location.href = 'http://localhost:5000/api/backup/download';
    });

    // Initialize
    loadDashboardStats();
});
