document.addEventListener('DOMContentLoaded', function() {
    // Form elements
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    const showRegisterLink = document.getElementById('show-register');
    const showLoginLink = document.getElementById('show-login');
    const roleSelect = document.getElementById('role');
    const classGroup = document.getElementById('class-group');

    // Toggle between login and register forms
    if (showRegisterLink) {
        showRegisterLink.addEventListener('click', function(e) {
            e.preventDefault();
            loginForm.style.display = 'none';
            registerForm.style.display = 'block';
            document.getElementById('form-title').textContent = 'Create Account';
        });
    }

    if (showLoginLink) {
        showLoginLink.addEventListener('click', function(e) {
            e.preventDefault();
            registerForm.style.display = 'none';
            loginForm.style.display = 'block';
            document.getElementById('form-title').textContent = 'Login';
            document.getElementById('error-message').textContent = '';
            document.getElementById('register-message').textContent = '';
        });
    }

    // Show/hide class field based on role selection
    if (roleSelect) {
        roleSelect.addEventListener('change', function() {
            if (this.value === 'student') {
                classGroup.style.display = 'block';
                document.getElementById('class').setAttribute('required', 'required');
            } else {
                classGroup.style.display = 'none';
                document.getElementById('class').removeAttribute('required');
            }
        });
    }

    // Handle login form submission
    if (loginForm) {
        loginForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const email = document.getElementById('login-email').value;
            const password = document.getElementById('login-password').value;
            const errorMessage = document.getElementById('error-message');

            try {
                const response = await fetch('http://localhost:5000/api/auth/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, password })
                });

                const data = await response.json();

                if (response.ok && data.token) {
                    // Store token and user data
                    localStorage.setItem('token', data.token);
                    localStorage.setItem('userRole', data.role);
                    
                    // Store basic user info
                    const userData = {
                        email: email,
                        role: data.role
                    };
                    localStorage.setItem('userData', JSON.stringify(userData));
                    
                    // Fetch and store full profile
                    try {
                        const profileEndpoint = data.role === 'teacher' ? 
                            'http://localhost:5000/api/teachers/profile' : 
                            'http://localhost:5000/api/students/profile';
                            
                        const profileResponse = await fetch(profileEndpoint, {
                            headers: {
                                'Authorization': `Bearer ${data.token}`,
                                'Content-Type': 'application/json'
                            }
                        });

                        if (profileResponse.ok) {
                            const profileData = await profileResponse.json();
                            const fullUserData = {
                                ...userData,
                                ...profileData,
                                profile: {
                                    ...profileData.profile,
                                    role: data.role
                                }
                            };
                            localStorage.setItem('userProfile', JSON.stringify(fullUserData));
                        }
                    } catch (profileError) {
                        console.error('Error fetching profile:', profileError);
                    }
                    
                    // Redirect to dashboard
                    window.location.href = getDashboardURL(data.role);
                } else {
                    errorMessage.textContent = data.msg || 'Invalid email or password';
                }
            } catch (error) {
                console.error('Login error:', error);
                errorMessage.textContent = 'An error occurred. Please try again.';
            }
        });
    }

    // Handle registration form submission
    if (registerForm) {
        registerForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const name = document.getElementById('register-name').value;
            const email = document.getElementById('register-email').value;
            const password = document.getElementById('register-password').value;
            const confirmPassword = document.getElementById('confirm-password').value;
            const role = document.getElementById('role').value;
            const studentClass = role === 'student' ? document.getElementById('class').value : '';
            const registerMessage = document.getElementById('register-message');

            // Basic validation
            if (password !== confirmPassword) {
                registerMessage.textContent = 'Passwords do not match';
                return;
            }

            if (role === 'student' && !studentClass) {
                registerMessage.textContent = 'Please select a class';
                return;
            }

            try {
                const response = await fetch('http://localhost:5000/api/auth/register', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        name,
                        email,
                        password,
                        role,
                        studentClass,
                        studentDob: '', // Add these fields if needed
                        studentGender: '',
                        parentName: '',
                        parentEmail: ''
                    })
                });

                const data = await response.json();

                if (response.ok) {
                    registerMessage.textContent = 'Registration successful! Please login.';
                    registerMessage.style.color = 'green';
                    // Clear form
                    registerForm.reset();
                    // Show login form after successful registration
                    setTimeout(() => {
                        registerForm.style.display = 'none';
                        loginForm.style.display = 'block';
                        document.getElementById('form-title').textContent = 'Login';
                        registerMessage.textContent = '';
                    }, 2000);
                } else {
                    registerMessage.textContent = data.msg || 'Registration failed';
                    registerMessage.style.color = 'red';
                }
            } catch (error) {
                console.error('Registration error:', error);
                registerMessage.textContent = 'An error occurred. Please try again.';
                registerMessage.style.color = 'red';
            }
        });
    }
});

// Function to get dashboard URL based on role
function getDashboardURL(role) {
    const dashboards = {
        admin: 'index.html',
        teacher: 'teacher.html',
        student: 'student.html',
        parent: 'parent-dashboard.html'
    };
    return dashboards[role] || 'index.html';
}
