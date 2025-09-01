document.addEventListener('DOMContentLoaded', () => {
    // Login form
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.onsubmit = async (e) => {
            e.preventDefault();
            
            const email = loginForm.querySelector('#email').value;
            const password = loginForm.querySelector('#password').value;

            try {
                const response = await fetch('http://localhost:5000/api/auth/login', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ email, password })
                });

                const data = await response.json();
                
                // Enhanced logging of the login response
                console.group('Login Response');
                console.log('Status:', response.status, response.statusText);
                console.log('Response data:', data);
                console.log('Response headers:', Object.fromEntries([...response.headers.entries()]));
                console.groupEnd();

                if (response.ok) {
                    // Clear any existing auth data
                    localStorage.clear();
                    console.log('Cleared existing auth data');
                    
                    // 1. Store the token (check multiple possible fields)
                    const token = data.token || data.access_token || data.accessToken;
                    if (token) {
                        localStorage.setItem('token', token);
                        console.log('Stored token in localStorage');
                    } else {
                        console.warn('No token found in login response');
                    }
                    
                    // 2. Extract and store user data
                    const userData = data.user || data;
                    console.log('User data:', userData);
                    
                    // 3. Try to extract role from various possible locations
                    const possibleRolePaths = [
                        'role',
                        'user.role',
                        'userType',
                        'user.userType',
                        'data.role',
                        'data.user.role'
                    ];
                    
                    let userRole = null;
                    for (const path of possibleRolePaths) {
                        const value = path.split('.').reduce((obj, key) => obj?.[key], data);
                        if (value) {
                            userRole = value.toLowerCase();
                            console.log(`Found role in ${path}:`, userRole);
                            break;
                        }
                    }
                    
                    // 4. If no role found, try to infer from email or other fields
                    if (!userRole && userData.email) {
                        if (userData.email.includes('@teacher.') || userData.email.includes('teacher@')) {
                            userRole = 'teacher';
                        } else if (userData.email.includes('@admin.') || userData.email.includes('admin@')) {
                            userRole = 'admin';
                        } else if (userData.email.includes('@student.') || userData.email.includes('student@')) {
                            userRole = 'student';
                        }
                        if (userRole) {
                            console.log('Inferred role from email:', userRole);
                        }
                    }
                    
                    // 5. If still no role, set a default or show warning
                    if (!userRole) {
                        console.warn('Could not determine user role. Using default role: teacher');
                        userRole = 'teacher'; // Default role
                    }
                    
                    // 6. Store the role
                    localStorage.setItem('role', userRole);
                    console.log('Stored role in localStorage:', userRole);
                    
                    // 7. Store any additional user data
                    if (userData) {
                        localStorage.setItem('userData', JSON.stringify(userData));
                        console.log('Stored user data in localStorage');
                    }
                    
                    // Redirect to appropriate dashboard
                    const role = localStorage.getItem('role');
                    console.log('Redirecting with role:', role);
                    
                    if (role === 'teacher' || role === 'admin') {
                        window.location.href = '/teacher.html';
                    } else {
                        window.location.href = '/student.html';
                    }
                } else {
                    alert(data.msg || 'Login failed');
                }
            } catch (error) {
                console.error('Login error:', error);
                alert('An error occurred during login');
            }
        };
    }
});
