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
        quizzesList.innerHTML = `
            <div class="loading">
                <i class="fas fa-spinner fa-spin"></i>
                <p>Loading quizzes...</p>
            </div>`;
        
        try {
            if (!token) {
                console.warn('No authentication token found in localStorage');
                showError('You need to be logged in to view quizzes. Please log in and try again.');
                return;
            }
            
            // First, ensure we have the latest user data including class
            console.log('[DEBUG] Updating user data...');
            try {
                const updatedUser = await updateUserData();
                if (updatedUser) {
                    userData = updatedUser;
                    userRole = updatedUser.role || 'student';
                    userClass = updatedUser.class || '';
                } else {
                    // Fallback to localStorage data if update fails
                    userData = JSON.parse(localStorage.getItem('userData') || '{}');
                    userRole = userData.role || 'student';
                    userClass = userData.class || '';
                }
            } catch (error) {
                console.warn('Error updating user data, using cached data:', error);
                userData = JSON.parse(localStorage.getItem('userData') || '{}');
                userRole = userData.role || 'student';
                userClass = userData.class || '';
            }
            
            console.log('[DEBUG] User data after update:', { userRole, userClass });
            
            if (userRole === 'student') {
                if (!userClass) {
                    console.warn('Student class information is missing in user data');
                    // Try to get class from userProfile as a fallback
                    const userProfile = JSON.parse(localStorage.getItem('userProfile') || '{}');
                    userClass = userProfile.class || userProfile.profile?.class || '';
                    console.log('[DEBUG] Tried to get class from userProfile:', userClass);
                    
                    if (!userClass) {
                        showError('Your account is missing class information. Please contact your administrator.');
                        return;
                    } else {
                        // Update userData with the class from profile
                        userData.class = userClass;
                        localStorage.setItem('userData', JSON.stringify(userData));
                    }
                }
                console.log(`[DEBUG] Student class set to: "${userClass}"`);
            }
            
            // Fetch quizzes based on user role
            console.log(`[DEBUG] Fetching quizzes for ${userRole} with class: "${userClass}"`);
            
            // Normalize class names for comparison
            const normalizeClass = (className) => {
                if (!className) return '';
                return className.toString().toLowerCase().replace(/\s+/g, '');
            };
            
            const normalizedUserClass = normalizeClass(userClass);
            console.log(`[DEBUG] Normalized user class: "${normalizedUserClass}"`);
            
            if (userRole === 'teacher') {
                // For teachers, only fetch their own quizzes
                console.log(`[DEBUG] Fetching quizzes for teacher ID: ${userData._id}`);
                const response = await fetch(`${API_BASE_URL}/api/quizzes/all`, {
                    method: 'GET',
                    headers: {
                        'Accept': 'application/json',
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`,
                        'x-auth-token': token
                    },
                    credentials: 'include'
                });
                
                if (!response.ok) {
                    throw new Error(`Failed to fetch quizzes: ${response.status} ${response.statusText}`);
                }
                
                quizzes = await response.json();
                console.log(`[DEBUG] Found ${quizzes.length} quizzes for teacher`);
                
                // Display the quizzes
                displayQuizzes(quizzes);
                
            } else if (userRole === 'student') {
                console.log(`[DEBUG] Fetching quizzes for student in class: "${userClass}"`);
                console.log(`[DEBUG] User data from localStorage:`, userData);
                
                try {
                    // First try to fetch all quizzes and filter client-side for better reliability
                    console.log(`[DEBUG] Fetching all quizzes for student in class: "${userClass}" (normalized: "${normalizedUserClass}")`);
                    const quizResponse = await fetch(`${API_BASE_URL}/api/quizzes/all`, {
                        method: 'GET',
                        headers: {
                            'Accept': 'application/json',
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${token}`,
                            'x-auth-token': token
                        },
                        credentials: 'include'
                    });
                    
                    if (!quizResponse.ok) {
                        throw new Error(`Failed to fetch quizzes: ${quizResponse.status} ${quizResponse.statusText}`);
                    }
                    
                    const responseData = await quizResponse.json();
                    quizzes = Array.isArray(responseData) ? responseData : (responseData.data || []);
                    
                    console.log(`[DEBUG] Fetched ${quizzes.length} total quizzes`);
                    
                    // Filter quizzes by class on the client side with normalized comparison
                    quizzes = quizzes.filter(quiz => {
                        const quizClass = normalizeClass(quiz.class || '');
                        const matches = !quiz.class || quizClass === normalizedUserClass || quizClass.includes(normalizedUserClass) || normalizedUserClass.includes(quizClass);
                        console.log(`[DEBUG] Quiz "${quiz.title}" class: "${quiz.class}" (normalized: "${quizClass}"), matches: ${matches}`);
                        return matches;
                    });
                    
                    console.log(`[DEBUG] Found ${quizzes.length} quizzes matching class "${userClass}"`);
                    
                    // Show loading state
                    quizzesList.innerHTML = `
                        <div class="loading">
                            <i class="fas fa-spinner fa-spin"></i>
                            <p>Loading quizzes for ${userClass}...</p>
                        </div>`;
                    
                    const response = await fetch(classUrl, {
                        method: 'GET',
                        headers: {
                            'Accept': 'application/json',
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${token}`,
                            'x-auth-token': token,
                            'X-Requested-With': 'XMLHttpRequest'
                        },
                        credentials: 'include',
                        mode: 'cors',
                        cache: 'no-cache',
                        redirect: 'follow',
                        referrerPolicy: 'no-referrer-when-downgrade',
                        keepalive: true
                    });
                    
                    console.log('Response headers:', Object.fromEntries([...response.headers.entries()]));
                    
                    console.log(`[DEBUG] Response status: ${response.status}`);
                    
                    if (response.ok) {
                        const responseData = await response.json();
                        quizzes = responseData.data || [];
                        console.log(`[DEBUG] Found ${quizzes.length} quizzes for class "${userClass}"`);
                        console.log('[DEBUG] Quizzes:', quizzes);
                        
                        if (quizzes.length === 0) {
                            console.log(`[DEBUG] No quizzes found for class "${userClass}"`);
                            // Show a message to the user
                            quizzesList.innerHTML = `
                                <div class="no-quizzes">
                                    <i class="fas fa-inbox"></i>
                                    <p>No quizzes available for ${userClass} at the moment.</p>
                                    <p class="small">Please check back later or contact your teacher.</p>
                                </div>`;
                            return;
                        }
                    } else if (response.status === 404) {
                        console.log(`[DEBUG] No quizzes endpoint for class, trying fallback to all quizzes`);
                        
                        // Fall back to fetching all quizzes and filtering client-side
                        const allResponse = await fetch(`${API_BASE_URL}/api/quizzes/all`, {
                            method: 'GET',
                            headers: {
                                'Content-Type': 'application/json',
                                'Authorization': `Bearer ${token}`,
                                'x-auth-token': token
                            },
                            credentials: 'include'
                        });
                        
                        if (!allResponse.ok) {
                            throw new Error(`HTTP error! status: ${allResponse.status}`);
                        }
                        
                        const responseData = await allResponse.json();
                        const allQuizzes = responseData.data || [];
                        console.log('[DEBUG] All quizzes before filtering:', allQuizzes);
                        
                        // Filter quizzes by class on the client side with normalized comparison
                        quizzes = allQuizzes.filter(quiz => {
                            const quizClass = normalizeClass(quiz.class || '');
                            const matches = !quiz.class || quizClass === normalizedUserClass || 
                                         quizClass.includes(normalizedUserClass) || 
                                         normalizedUserClass.includes(quizClass);
                            console.log(`[DEBUG] Quiz "${quiz.title}" class: "${quiz.class}" (normalized: "${quizClass}"), matches: ${matches}`);
                            return matches;
                        });
                        
                        console.log(`[DEBUG] Found ${quizzes.length} quizzes matching class "${userClass}"`);
                    } else if (userRole === 'teacher' || userRole === 'admin') {
                        // For teachers/admins, fetch all quizzes
                        const response = await fetch(`${API_BASE_URL}/api/quizzes/all`, {
                            method: 'GET',
                            headers: {
                                'Content-Type': 'application/json',
                                'Authorization': `Bearer ${token}`
                            }
                        });
                        
                        if (!response.ok) {
                            throw new Error(`HTTP error! status: ${response.status}`);
                        }
                        const responseData = await response.json();
                        quizzes = responseData.data || [];
                    }
            
            // Function to update user data from the server
            async function updateUserData() {
                try {
                    console.log('[DEBUG] Fetching user data with token:', token ? `${token.substring(0, 10)}...` : 'No token found');
                    console.log('[DEBUG] Request URL:', `${API_BASE_URL}/api/users/me`);
                    
                    if (!token) {
                        console.warn('[DEBUG] No authentication token found in localStorage');
                        throw new Error('Not authenticated');
                    }
                    
                    const headers = {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`,
                        'x-auth-token': token,
                        'X-Requested-With': 'XMLHttpRequest'
                    };
                    
                    console.log('[DEBUG] Request headers:', headers);
                    
                    const userResponse = await fetch(`${API_BASE_URL}/api/users/me`, {
                        method: 'GET',
                        headers: headers,
                        credentials: 'include'
                    });
                    
                    console.log('[DEBUG] User data response status:', userResponse.status);
                    
                    if (!userResponse.ok) {
                        const errorText = await userResponse.text();
                        let errorData;
                        try {
                            errorData = JSON.parse(errorText);
                        } catch (e) {
                            errorData = { message: errorText };
                        }
                        console.error('[DEBUG] Error fetching user data:', errorData);
                        throw new Error(errorData.message || 'Failed to fetch user data');
                    }
                    
                    const responseData = await userResponse.json();
                    console.log('[DEBUG] User data response:', responseData);
                    
                    if (responseData.success && responseData.user) {
                        const user = responseData.user;
                        completedQuizzes = user.completedQuizzes || [];
                        console.log('[DEBUG] Fetched user completed quizzes:', completedQuizzes);
                        
                        // Update user data in localStorage
                        const updatedUserData = {
                            ...userData,
                            _id: user._id || userData._id,
                            role: user.role || userData.role,
                            email: user.email || userData.email,
                            class: user.class || userData.class,
                            name: user.firstName ? 
                                `${user.firstName} ${user.lastName || ''}`.trim() : 
                                (userData.name || 'User'),
                            completedQuizzes: completedQuizzes
                        };
                        
                        localStorage.setItem('userData', JSON.stringify(updatedUserData));
                        console.log('[DEBUG] Updated user data in localStorage:', updatedUserData);
                        
                        return updatedUserData;
                    } else {
                        throw new Error('Invalid user data received from server');
                    }
                } catch (userError) {
                    console.warn('Error fetching user data, using empty completed quizzes:', userError);
                    // Continue with empty completed quizzes
                    return null;
        
        if (!token) {
            console.warn('[DEBUG] No authentication token found in localStorage');
            throw new Error('Not authenticated');
        }
        
        const headers = {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
            'x-auth-token': token,
            'X-Requested-With': 'XMLHttpRequest'
        };
        
        console.log('[DEBUG] Request headers:', headers);
        
        const userResponse = await fetch(`${API_BASE_URL}/api/users/me`, {
            method: 'GET',
            headers: headers,
            credentials: 'include'
        });
        
        console.log('[DEBUG] User data response status:', userResponse.status);
        
        if (!userResponse.ok) {
            const errorText = await userResponse.text();
            let errorData;
            try {
                errorData = JSON.parse(errorText);
            } catch (e) {
                errorData = { message: errorText };
            }
            console.error('[DEBUG] Error fetching user data:', errorData);
            throw new Error(errorData.message || 'Failed to fetch user data');
        }
        
        const responseData = await userResponse.json();
        console.log('[DEBUG] User data response:', responseData);
        
        if (responseData.success && responseData.user) {
            const user = responseData.user;
            completedQuizzes = user.completedQuizzes || [];
            console.log('[DEBUG] Fetched user completed quizzes:', completedQuizzes);
            
            // Update user data in localStorage
            const updatedUserData = {
                ...userData,
                _id: user._id || userData._id,
                role: user.role || userData.role,
                email: user.email || userData.email,
                class: user.class || userData.class,
                name: user.firstName ? 
                    `${user.firstName} ${user.lastName || ''}`.trim() : 
                    (userData.name || 'User'),
                completedQuizzes: completedQuizzes
            };
            
            localStorage.setItem('userData', JSON.stringify(updatedUserData));
            console.log('[DEBUG] Updated user data in localStorage:', updatedUserData);
            
            return updatedUserData;
        } else {
            throw new Error('Invalid user data received from server');
        }
    } catch (userError) {
        console.warn('Error fetching user data, using empty completed quizzes:', userError);
        // Continue with empty completed quizzes
        return null;
    }
}

// Handle errors and show fallback data
document.addEventListener('DOMContentLoaded', function() {
    const storedQuizId = sessionStorage.getItem('currentQuizId');
    console.log('Stored Quiz ID from session storage:', storedQuizId);
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
            questionCount: 12,
            timeLimit: 30,
            isCompleted: false,
            dueDate: '2024-06-30T23:59:00'
        }
    ];
    
    // Mark completed quizzes
    const quizzesWithStatus = sampleQuizzes.map(quiz => ({
        ...quiz,
        isCompleted: quiz.isCompleted || false,
        score: quiz.score || 0,
        totalQuestions: quiz.totalQuestions || quiz.questionCount,
        completedDate: quiz.completedDate || null
    }));
    
    displayQuizzes(quizzesWithStatus);
} catch (fallbackError) {
    console.error('Error in fallback quiz loading:', fallbackError);
    showError('Failed to load quizzes. Please refresh the page to try again.');
}

function displayQuizzes(quizzes) {
    console.log('[DEBUG] Displaying quizzes:', quizzes);
    
    if (!quizzes || quizzes.length === 0) {
        quizzesList.innerHTML = `
            <div class="no-quizzes">
                <i class="fas fa-inbox"></i>
                <p>No quizzes available for your class at the moment.</p>
                <p class="small">If you believe this is an error, please contact your teacher.</p>
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
                    <p>Score: ${quiz.score || 0}/${quiz.totalQuestions || 10} (${Math.round(((quiz.score || 0) / (quiz.totalQuestions || 10)) * 100)}%)</p>
                    <p>Completed on: ${new Date(quiz.completedDate || new Date()).toLocaleDateString()}</p>
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
                        <p>Score: ${quiz.score || 0}/${quiz.totalQuestions || 10} (${Math.round(((quiz.score || 0) / (quiz.totalQuestions || 10)) * 100)}%)</p>
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
                        <a href="../pages/take-quiz.html?id=${quiz._id || '1'}" class="btn btn-primary start-quiz" data-quiz-id="${quiz._id || '1'}">
                            <i class="fas fa-play"></i> Start Quiz
                        </a>
                    `}
                </div>
            </div>
        `).join('');
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
            </div>
        `;
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
} // Close the loadQuizzes function

    // Handle errors and show fallback data
    function handleQuizLoadError(error) {
        console.error('Error loading quizzes:', error);
        showError('Failed to load quizzes. Please try again later.');
        
        // Fallback to sample data for demo purposes
        const sampleQuizzes = [
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
        
        try {
            displayQuizzes(sampleQuizzes);
        } catch (displayError) {
            console.error('Error displaying fallback quizzes:', displayError);
            showError('Failed to load quizzes. Please refresh the page.');
        }
    }
    
    // Close the DOMContentLoaded event listener
});
