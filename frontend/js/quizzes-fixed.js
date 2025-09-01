document.addEventListener('DOMContentLoaded', function() {
    const quizzesList = document.getElementById('quizzesList');
    
    // Load quizzes when the page loads
    loadQuizzes();
    
    async function loadQuizzes() {
        // Initialize variables at the top of the function
        const API_BASE_URL = window.API_BASE_URL || 'http://localhost:5000';
        let token = localStorage.getItem('token');
        let userData;
        
        try {
            userData = JSON.parse(localStorage.getItem('userData') || '{}');
        } catch (error) {
            console.error('Error parsing user data:', error);
            userData = {};
        }
        
        let userRole = userData.role || 'student';
        let userClass = userData.class || '';
        let quizzes = [];
        let completedQuizzes = [];
        
        // Show loading state
        showLoading();
        
        try {
            if (!token) {
                throw new Error('No authentication token found');
            }
            
            // Update user data
            try {
                const updatedUser = await updateUserData(API_BASE_URL, token);
                if (updatedUser) {
                    userData = updatedUser;
                    userRole = updatedUser.role || 'student';
                    userClass = updatedUser.class || '';
                }
            } catch (updateError) {
                console.warn('Error updating user data, using cached data:', updateError);
            }
            
            // Load quizzes based on user role
            if (userRole === 'teacher') {
                quizzes = await loadTeacherQuizzes(API_BASE_URL, token);
            } else {
                quizzes = await loadStudentQuizzes(API_BASE_URL, token, userClass);
            }
            
            // Mark completed quizzes
            const quizzesWithStatus = markCompletedQuizzes(quizzes, completedQuizzes);
            displayQuizzes(quizzesWithStatus);
            
        } catch (error) {
            console.error('Error loading quizzes:', error);
            showError('Failed to load quizzes. Please try again later.');
            
            // Fallback to sample data
            try {
                const sampleQuizzes = getSampleQuizzes();
                const quizzesWithStatus = markCompletedQuizzes(sampleQuizzes, []);
                displayQuizzes(quizzesWithStatus);
            } catch (fallbackError) {
                console.error('Error in fallback:', fallbackError);
                showError('Failed to load quizzes. Please refresh the page.');
            }
        }
    }
    
    async function updateUserData(apiBaseUrl, token) {
        try {
            const response = await fetch(`${apiBaseUrl}/api/users/me`, {
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
            console.error('Error updating user data:', error);
            return null;
        }
    }
    
    async function loadTeacherQuizzes(apiBaseUrl, token) {
        try {
            const response = await fetch(`${apiBaseUrl}/api/quizzes/teacher`, {
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
            
        } catch (error) {
            console.error('Error loading teacher quizzes:', error);
            throw error;
        }
    }
    
    async function loadStudentQuizzes(apiBaseUrl, token, userClass) {
        try {
            const response = await fetch(`${apiBaseUrl}/api/quizzes/class/${encodeURIComponent(userClass)}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            
            if (response.status === 404) {
                // If no class-specific endpoint, try fetching all and filter client-side
                return loadAllQuizzes(apiBaseUrl, token, userClass);
            }
            
            if (!response.ok) {
                throw new Error('Failed to fetch student quizzes');
            }
            
            const data = await response.json();
            return Array.isArray(data) ? data : [];
            
        } catch (error) {
            console.error('Error loading student quizzes:', error);
            throw error;
        }
    }
    
    async function loadAllQuizzes(apiBaseUrl, token, userClass) {
        try {
            const response = await fetch(`${apiBaseUrl}/api/quizzes/all`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            
            if (!response.ok) {
                throw new Error('Failed to fetch all quizzes');
            }
            
            const data = await response.json();
            const allQuizzes = Array.isArray(data) ? data : [];
            
            // Filter by class on client side
            return allQuizzes.filter(quiz => 
                !quiz.class || 
                quiz.class.toLowerCase() === userClass.toLowerCase()
            );
            
        } catch (error) {
            console.error('Error loading all quizzes:', error);
            throw error;
        }
    }
    
    function markCompletedQuizzes(quizzes, completedQuizzes) {
        return quizzes.map(quiz => {
            const completedQuiz = completedQuizzes.find(cq => 
                cq.quizId && cq.quizId.toString() === quiz._id.toString()
            );
            
            return {
                ...quiz,
                isCompleted: !!completedQuiz,
                score: completedQuiz?.score || 0,
                totalQuestions: completedQuiz?.totalQuestions || quiz.questions?.length || 0,
                completedDate: completedQuiz?.completedAt
            };
        });
    }
    
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
    
    function showLoading() {
        quizzesList.innerHTML = `
            <div class="loading">
                <i class="fas fa-spinner fa-spin"></i>
                <p>Loading quizzes...</p>
            </div>`;
    }
    
    function showError(message) {
        console.error('Showing error to user:', message);
        quizzesList.innerHTML = `
            <div class="error" style="text-align: center; padding: 2rem; background: #fff5f5; border-radius: 8px; margin: 1rem 0;">
                <i class="fas fa-exclamation-circle" style="font-size: 3rem; color: #e53e3e; margin-bottom: 1rem;"></i>
                <p style="color: #e53e3e; font-size: 1.1rem; margin-bottom: 1.5rem;">${message}</p>
                <button class="btn btn-secondary" onclick="window.location.reload()" style="padding: 0.5rem 1.5rem; font-size: 1rem;">
                    <i class="fas fa-sync-alt"></i> Try Again
                </button>
                <p style="margin-top: 1rem; color: #666;">
                    Still having issues? <a href="../pages/login.html" style="color: #3182ce; text-decoration: underline;">Log in again</a>
                </p>
            </div>`;
    }
    
    function displayQuizzes(quizzes) {
        console.log('[DEBUG] Displaying quizzes:', quizzes);
        
        if (!quizzes || quizzes.length === 0) {
            quizzesList.innerHTML = `
                <div class="no-quizzes">
                    <i class="fas fa-inbox"></i>
                    <p>No quizzes available at the moment.</p>
                    <p class="small">Please check back later or contact your teacher.</p>
                </div>`;
            return;
        }
        
        quizzesList.innerHTML = quizzes.map(quiz => `
            <div class="quiz-card">
                <div class="status-badge ${quiz.isCompleted ? 'status-completed' : 'status-pending'}">
                    ${quiz.isCompleted ? 'Completed' : 'Pending'}
                </div>
                <h3 class="quiz-title">${quiz.title}</h3>
                <p class="quiz-description">${quiz.description}</p>
                <div class="quiz-meta">
                    <span>${quiz.questionCount || 10} questions</span>
                    <span>${quiz.timeLimit || 30} min</span>
                </div>
                ${quiz.isCompleted ? `
                    <div class="quiz-score">
                        <p>Score: ${quiz.score || 0}/${quiz.totalQuestions || 10} 
                        (${Math.round(((quiz.score || 0) / (quiz.totalQuestions || 10)) * 100)}%)</p>
                        <p>Completed on: ${new Date(quiz.completedDate || new Date()).toLocaleDateString()}</p>
                    </div>
                ` : `
                    <div class="quiz-meta">
                        <span>Due: ${new Date(quiz.dueDate || new Date()).toLocaleDateString()}</span>
                    </div>
                `}
                <div class="quiz-actions">
                    ${quiz.isCompleted ? `
                        <a href="#" class="btn btn-disabled">
                            <i class="fas fa-check"></i> Completed
                        </a>
                    ` : `
                        <a href="../pages/take-quiz.html?id=${quiz._id || '1'}" 
                           class="btn btn-primary start-quiz" 
                           data-quiz-id="${quiz._id || '1'}">
                            <i class="fas fa-play"></i> Start Quiz
                        </a>
                    `}
                </div>
            </div>
        `).join('');
    }
    
    // Add event delegation for quiz start buttons
    document.addEventListener('click', function(e) {
        const startQuizBtn = e.target.closest('.start-quiz');
        if (startQuizBtn) {
            e.preventDefault();
            const quizId = startQuizBtn.dataset.quizId;
            console.log('Starting quiz with ID:', quizId);
            
            if (quizId) {
                // Store the quiz ID in session storage as a backup
                sessionStorage.setItem('currentQuizId', quizId);
                
                // Navigate to the take-quiz page
                window.location.href = `../pages/take-quiz.html?id=${quizId}`;
            } else {
                console.error('No quiz ID found on the start button');
                showError('Failed to start quiz. Missing quiz ID.');
            }
        }
    });
    
    // Check for quiz ID in session storage on page load (for debugging)
    document.addEventListener('DOMContentLoaded', function() {
        const storedQuizId = sessionStorage.getItem('currentQuizId');
        console.log('Stored Quiz ID from session storage:', storedQuizId);
    });
});
