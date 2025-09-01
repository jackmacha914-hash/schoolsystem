document.addEventListener('DOMContentLoaded', function() {
    const quizzesList = document.getElementById('quizzesList');
    
    // Load quizzes when the page loads
    loadQuizzes();
    
    // Function to normalize class names for comparison
    function normalizeClass(className) {
        if (!className) return '';
        return className.toString().trim().toLowerCase();
    }
    
    // Function to show error messages
    function showError(message) {
        console.error('Error:', message);
        quizzesList.innerHTML = `
            <div class="alert alert-danger">
                <i class="fas fa-exclamation-circle"></i>
                ${message}
            </div>`;
    }
    
    // Function to show loading state
    function showLoading() {
        quizzesList.innerHTML = `
            <div class="text-center py-5">
                <div class="spinner-border text-primary" role="status">
                    <span class="visually-hidden">Loading...</span>
                </div>
                <p class="mt-2">Loading quizzes...</p>
            </div>`;
    }
    
    // Function to update user data from the server
    async function updateUserData() {
        const API_BASE_URL = window.API_BASE_URL || 'http://localhost:5000';
        const token = localStorage.getItem('token');
        
        if (!token) {
            console.warn('No authentication token found');
            return null;
        }
        
        try {
            const response = await fetch(`${API_BASE_URL}/api/users/me`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            
            if (!response.ok) {
                throw new Error('Failed to fetch user data');
            }
            
            const data = await response.json();
            if (data.user) {
                localStorage.setItem('userData', JSON.stringify(data.user));
                return data.user;
            }
            return null;
        } catch (error) {
            console.warn('Error updating user data:', error);
            return null;
        }
    }
    
    // Function to load quizzes based on user role
    async function loadQuizzes() {
        showLoading();
        
        try {
            // Initialize user data
            const token = localStorage.getItem('token');
            let userData;
            try {
                userData = JSON.parse(localStorage.getItem('userData') || '{}');
            } catch (e) {
                console.error('Error parsing user data:', e);
                userData = {};
            }
            
            if (!token) {
                throw new Error('You need to be logged in to view quizzes');
            }
            
            // Update user data from server
            const updatedUser = await updateUserData();
            if (updatedUser) {
                userData = updatedUser;
            }
            
            const userRole = userData.role || 'student';
            const userClass = userData.class || '';
            
            // Load quizzes based on user role
            let quizzes = [];
            if (userRole === 'teacher') {
                quizzes = await loadTeacherQuizzes();
            } else {
                quizzes = await loadStudentQuizzes(userClass);
            }
            
            // Display the quizzes
            displayQuizzes(quizzes);
            
        } catch (error) {
            console.error('Error loading quizzes:', error);
            showError('Failed to load quizzes. Please try again later.');
            
            // Fallback to sample data
            try {
                const sampleQuizzes = getSampleQuizzes();
                displayQuizzes(sampleQuizzes);
            } catch (fallbackError) {
                console.error('Fallback error:', fallbackError);
                showError('Failed to load quizzes. Please refresh the page.');
            }
        }
    }
    
    // Function to load quizzes for teachers
    async function loadTeacherQuizzes() {
        const API_BASE_URL = window.API_BASE_URL || 'http://localhost:5000';
        const token = localStorage.getItem('token');
        
        const response = await fetch(`${API_BASE_URL}/api/quizzes/teacher`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (!response.ok) {
            throw new Error('Failed to fetch teacher quizzes');
        }
        
        const data = await response.json();
        return Array.isArray(data) ? data : [];
    }
    
    // Function to load quizzes for students
    async function loadStudentQuizzes(userClass) {
        const API_BASE_URL = window.API_BASE_URL || 'http://localhost:5000';
        const token = localStorage.getItem('token');
        
        try {
            // Try to fetch class-specific quizzes first
            const response = await fetch(`${API_BASE_URL}/api/quizzes/class/${encodeURIComponent(userClass)}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            
            if (response.ok) {
                const data = await response.json();
                return Array.isArray(data) ? data : [];
            }
            
            // If class-specific endpoint fails, try fetching all quizzes
            const allResponse = await fetch(`${API_BASE_URL}/api/quizzes/all`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            
            if (!allResponse.ok) {
                throw new Error('Failed to fetch quizzes');
            }
            
            const allQuizzes = await allResponse.json();
            const normalizedClass = normalizeClass(userClass);
            
            // Filter quizzes by class on the client side
            return Array.isArray(allQuizzes) 
                ? allQuizzes.filter(quiz => 
                    !quiz.class || 
                    normalizeClass(quiz.class) === normalizedClass
                  )
                : [];
                
        } catch (error) {
            console.error('Error loading student quizzes:', error);
            throw error;
        }
    }
    
    // Function to get sample quizzes for fallback
    function getSampleQuizzes() {
        return [
            {
                _id: '1',
                title: 'Mathematics Quiz - Algebra',
                description: 'Basic algebra concepts and equations',
                questionCount: 10,
                timeLimit: 30,
                isCompleted: false,
                dueDate: '2024-06-15T23:59:00'
            },
            {
                _id: '2',
                title: 'Science Quiz - Physics',
                description: 'Basic physics concepts',
                questionCount: 15,
                timeLimit: 45,
                isCompleted: true,
                score: 14,
                totalQuestions: 15,
                completedDate: '2024-05-20T14:30:00'
            },
            {
                _id: '3',
                title: 'History Quiz - World War II',
                description: 'Key events and figures from World War II',
                questionCount: 20,
                timeLimit: 60,
                isCompleted: false,
                dueDate: '2024-06-30T23:59:00'
            }
        ];
    }
    
    // Function to display quizzes in the UI
    function displayQuizzes(quizzes) {
        if (!Array.isArray(quizzes) || quizzes.length === 0) {
            quizzesList.innerHTML = `
                <div class="alert alert-info">
                    <i class="fas fa-info-circle"></i>
                    No quizzes available at the moment.
                </div>`;
            return;
        }
        
        quizzesList.innerHTML = quizzes.map(quiz => `
            <div class="card mb-3">
                <div class="card-header d-flex justify-content-between align-items-center">
                    <h5 class="mb-0">${quiz.title || 'Untitled Quiz'}</h5>
                    <span class="badge ${quiz.isCompleted ? 'bg-success' : 'bg-primary'}">
                        ${quiz.isCompleted ? 'Completed' : 'Pending'}
                    </span>
                </div>
                <div class="card-body">
                    <p class="card-text">${quiz.description || 'No description available.'}</p>
                    <div class="d-flex justify-content-between align-items-center">
                        <small class="text-muted">
                            ${quiz.questionCount || '?'} questions • ${quiz.timeLimit || '?'} minutes
                        </small>
                        ${quiz.isCompleted 
                            ? `<span class="badge bg-secondary">
                                   Score: ${quiz.score || 0}/${quiz.totalQuestions || '?'}
                               </span>`
                            : `<a href="../pages/take-quiz.html?id=${quiz._id || ''}" 
                                class="btn btn-primary btn-sm start-quiz" 
                                data-quiz-id="${quiz._id || ''}">
                                Start Quiz
                            </a>`
                        }
                    </div>
                </div>
            </div>
        `).join('');
    }
    
    // Event delegation for quiz start buttons
    document.addEventListener('click', function(e) {
        const startBtn = e.target.closest('.start-quiz');
        if (startBtn) {
            e.preventDefault();
            const quizId = startBtn.dataset.quizId;
            if (quizId) {
                sessionStorage.setItem('currentQuizId', quizId);
                window.location.href = `../pages/take-quiz.html?id=${quizId}`;
            } else {
                showError('Invalid quiz ID');
            }
        }
    });
    
    // Check for stored quiz ID on page load (for debugging)
    const storedQuizId = sessionStorage.getItem('currentQuizId');
    if (storedQuizId) {
        console.log('Stored quiz ID:', storedQuizId);
    }
});
