// API Configuration
const API_BASE_URL = window.API_BASE_URL || 'http://localhost:5000';

// Wait for the DOM to be fully loaded
document.addEventListener('DOMContentLoaded', function() {
    // Track answered questions
    const answeredQuestions = new Set();
    
    // DOM Elements
    const questionsList = document.getElementById('questionsList');
    const quizTitle = document.getElementById('quizTitle');
    const submitBtn = document.getElementById('submitQuiz');
    const quizContent = document.getElementById('quizContent');
    const quizResults = document.getElementById('quizResults');
    const scoreElement = document.getElementById('score');
    const totalQuestionsElement = document.getElementById('totalQuestions');
    const quizTimer = document.getElementById('quizTimer');
    
    // Quiz state
    let quiz = null;
    let timeLeft = 0;
    let timerInterval = null;
    let currentQuestionIndex = 0;
    let userAnswers = {};
    
    // Initialize the quiz
    initQuiz();
    
    // Make handleAnswer function available globally
    window.handleAnswer = (questionIndex, optionIndex) => {
        console.log(`User selected option ${optionIndex} for question ${questionIndex}`);
        
        // Store the selected answer
        userAnswers[questionIndex] = optionIndex;
        
        // Update answered questions set for progress tracking
        if (!answeredQuestions.has(questionIndex)) {
            answeredQuestions.add(questionIndex);
            console.log(`Marked question ${questionIndex} as answered`);
            
            // Update progress bar and navigation
            updateProgressBar();
            updateNavigationButtons(currentQuestionIndex, quiz.questions.length);
        }
        
        console.log('Current answers:', userAnswers);
    };
    
    function updateNavigationButtons(currentIndex, totalQuestions) {
        console.log(`Updating navigation buttons for question ${currentIndex + 1} of ${totalQuestions}`);
        
        const prevBtn = document.getElementById('prevQuestion');
        const nextBtn = document.getElementById('nextQuestion');
        const submitBtn = document.getElementById('submitQuiz');
        
        // Handle previous button
        if (prevBtn) {
            const isFirstQuestion = currentIndex <= 0;
            prevBtn.disabled = isFirstQuestion;
            prevBtn.classList.toggle('btn-outline-secondary', isFirstQuestion);
            prevBtn.classList.toggle('btn-outline-primary', !isFirstQuestion);
            
            if (!isFirstQuestion) {
                prevBtn.onclick = () => {
                    console.log('Previous button clicked');
                    navigateToQuestion(currentIndex - 1);
                };
            }
        }
        
        // Handle next button
        if (nextBtn) {
            const isLastQuestion = currentIndex >= totalQuestions - 1;
            const hasAnswered = answeredQuestions.has(currentIndex);
            
            nextBtn.disabled = isLastQuestion || !hasAnswered;
            
            if (isLastQuestion) {
                nextBtn.classList.add('d-none');
                if (submitBtn) submitBtn.classList.remove('d-none');
            } else {
                nextBtn.classList.remove('d-none');
                if (submitBtn) submitBtn.classList.add('d-none');
                
                nextBtn.onclick = () => {
                    console.log('Next button clicked');
                    navigateToQuestion(currentIndex + 1);
                };
            }
        }
        
        // Handle submit button
        if (submitBtn) {
            const isLastQuestion = currentIndex >= totalQuestions - 1;
            const hasAnswered = answeredQuestions.has(currentIndex);
            
            submitBtn.style.display = isLastQuestion ? 'inline-block' : 'none';
            submitBtn.disabled = !hasAnswered;
            
            // Update button classes based on state
            if (isLastQuestion) {
                if (hasAnswered) {
                    submitBtn.classList.remove('btn-secondary');
                    submitBtn.classList.add('btn-success');
                } else {
                    submitBtn.classList.remove('btn-success');
                    submitBtn.classList.add('btn-secondary');
                }
            }
        }
    }
    
    function updateProgressBar() {
        const progressBar = document.querySelector('.progress-bar');
        if (!progressBar || !quiz || !quiz.questions) return;
        
        const totalQuestions = quiz.questions.length;
        const answeredCount = answeredQuestions.size;
        const progressPercentage = Math.round((answeredCount / totalQuestions) * 100);
        
        // Update progress bar width and ARIA attributes
        progressBar.style.width = `${progressPercentage}%`;
        progressBar.setAttribute('aria-valuenow', progressPercentage);
        
        // Update progress text if element exists
        const progressText = document.getElementById('progressText');
        if (progressText) {
            progressText.textContent = `Progress: ${answeredCount} of ${totalQuestions} answered`;
        }
        
        // Update progress indicator classes for visual feedback
        if (progressPercentage < 30) {
            progressBar.className = 'progress-bar bg-danger';
        } else if (progressPercentage < 70) {
            progressBar.className = 'progress-bar bg-warning';
        } else {
            progressBar.className = 'progress-bar bg-success';
        }
        
        // Update question indicators if they exist
        updateQuestionIndicators();
    }
    
    function updateQuestionIndicators() {
        const indicatorsContainer = document.querySelector('.question-indicators');
        if (!indicatorsContainer || !quiz?.questions) return;
        
        indicatorsContainer.innerHTML = quiz.questions.map((_, index) => {
            const isCurrent = index === currentQuestionIndex;
            const isAnswered = answeredQuestions.has(index);
            
            let indicatorClass = 'indicator';
            if (isCurrent) indicatorClass += ' active';
            if (isAnswered) indicatorClass += ' answered';
            
            return `
                <div class="${indicatorClass}" 
                     onclick="navigateToQuestion(${index})"
                     title="Question ${index + 1}">
                    ${index + 1}
                </div>`;
        }).join('');
    }
    
    // Make navigation function globally available
    window.navigateToQuestion = (index) => {
        if (index < 0 || index >= quiz.questions.length) return;
        currentQuestionIndex = index;
        showQuestion(index);
        updateNavigationButtons(index, quiz.questions.length);
    };
    
    // Check if quiz is already completed
    function isQuizCompleted(quizId) {
        const completedQuizzes = JSON.parse(localStorage.getItem('completedQuizzes') || '{}');
        return completedQuizzes[quizId] || false;
    }

    // Store quiz results in localStorage
    function storeQuizResults(quizId, result) {
        if (!quizId) return;
        
        // Store in quizResults for quick access
        const results = JSON.parse(localStorage.getItem('quizResults') || '{}');
        results[quizId] = result;
        localStorage.setItem('quizResults', JSON.stringify(results));
        
        // Also store in completedQuizzes with timestamp
        const completedQuizzes = JSON.parse(localStorage.getItem('completedQuizzes') || '{}');
        completedQuizzes[quizId] = {
            result: result,
            timestamp: new Date().toISOString()
        };
        localStorage.setItem('completedQuizzes', JSON.stringify(completedQuizzes));
    }

    // Update the quiz status in the UI
    function updateQuizStatusInUI(quizId, status) {
        if (!quizId) return;
        
        // Update the status in localStorage
        const quizStatus = JSON.parse(localStorage.getItem('quizStatus') || '{}');
        quizStatus[quizId] = status;
        localStorage.setItem('quizStatus', JSON.stringify(quizStatus));
        
        // Find the quiz card in the UI and update its status
        const quizCards = document.querySelectorAll('.quiz-card');
        quizCards.forEach(card => {
            if (card.dataset.quizId === quizId) {
                // Remove the 'Start Quiz' button
                const startBtn = card.querySelector('.start-quiz');
                if (startBtn) {
                    startBtn.remove();
                }
                
                // Add a 'Completed' badge
                const statusBadge = document.createElement('span');
                statusBadge.className = 'badge bg-success';
                statusBadge.textContent = 'Completed';
                
                const cardFooter = card.querySelector('.card-footer') || card;
                cardFooter.appendChild(statusBadge);
            }
        });
    }

    // Initialize the quiz
    function initQuiz() {
        console.group('Initializing Quiz...');
        
        // Get the quiz ID using our enhanced function
        const quizId = getQuizId();
        console.log('Quiz ID found:', quizId);
        
        if (!quizId) {
            console.error('No quiz ID could be found. Showing error message.');
            showQuizNotFound();
            console.groupEnd();
            return;
        }

        // Check if quiz is already completed
        if (isQuizCompleted(quizId)) {
            console.log('Quiz already completed, showing results');
            const completedQuizzes = JSON.parse(localStorage.getItem('completedQuizzes') || '{}');
            
            // Hide quiz content
            const quizContent = document.getElementById('quizContent');
            if (quizContent) {
                quizContent.style.display = 'none';
            }
            
            // Show completed message
            const quizContainer = document.getElementById('quizContainer');
            if (quizContainer) {
                const message = document.createElement('div');
                message.className = 'alert alert-info mt-4';
                message.innerHTML = `
                    <h4>Quiz Already Completed</h4>
                    <p>You have already completed this quiz. Here are your results:</p>
                `;
                quizContainer.prepend(message);
            }
            
            // Show results
            showQuizResults(completedQuizzes[quizId].result);
            return;
        }
        
        // Set up submit button
        const submitBtn = document.getElementById('submitQuiz');
        if (submitBtn) {
            submitBtn.addEventListener('click', (e) => {
                e.preventDefault();
                window.showSubmitConfirmation();
            });
        }
        
        // Set up floating submit button if it exists
        const floatingSubmitBtn = document.getElementById('floatingSubmitBtn');
        if (floatingSubmitBtn) {
            floatingSubmitBtn.addEventListener('click', (e) => {
                e.preventDefault();
                window.showSubmitConfirmation();
            });
        }
        
        console.log('Loading quiz with ID:', quizId);
        console.groupEnd();
        
        // Load the quiz with the found ID
        loadQuiz(quizId);
    }
    
    // Load quiz data from the server
    async function loadQuiz(quizId) {
        console.group(`Loading Quiz: ${quizId}`);
        
        // Show loading state
        if (questionsList) {
            questionsList.innerHTML = `
                <div class="text-center py-5">
                    <div class="spinner-border text-primary" role="status">
                        <span class="visually-hidden">Loading...</span>
                    </div>
                    <p class="mt-3">Loading quiz questions...</p>
                </div>`;
            
            // Force reflow to ensure the loading state is visible
            void questionsList.offsetHeight;
        }
        
        try {
            if (!quizId) {
                throw new Error('No quiz ID provided');
            }
            
            console.log(`Fetching quiz from: ${API_BASE_URL}/api/quizzes/quiz/${quizId}`);
            
            const response = await fetch(`${API_BASE_URL}/api/quizzes/quiz/${quizId}`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token') || ''}`,
                    'Content-Type': 'application/json'
                }
            });
            
            console.log('Response status:', response.status);
            
            if (!response.ok) {
                const errorText = await response.text();
                console.error('Error response:', errorText);
                throw new Error(`Failed to load quiz: ${response.status} ${response.statusText}`);
            }
            
            const data = await response.json();
            console.log('Quiz data received:', data);
            
            // Handle different response formats
            quiz = data.quiz || data.data || data;
            
            if (!quiz) {
                throw new Error('No quiz data found in response');
            }
            
            if (!quiz.questions || !Array.isArray(quiz.questions)) {
                console.warn('No questions array found in quiz data, initializing empty array');
                quiz.questions = [];
            } else {
                console.log(`Quiz loaded with ${quiz.questions.length} questions`);
            }
            
            // Ensure the quiz content is visible
            if (quizContent) {
                quizContent.style.display = 'block';
            }
            
            if (quizResults) {
                quizResults.style.display = 'none';
            }
            
            displayQuiz(quiz);
            
            // Start the timer if there's a time limit
            if (quiz.timeLimit) {
                timeLeft = quiz.timeLimit * 60; // Convert minutes to seconds
                console.log(`Timer started: ${quiz.timeLimit} minutes (${timeLeft} seconds)`);
                updateTimerDisplay();
                timerInterval = setInterval(updateTimer, 1000);
            } else {
                console.log('No time limit set for this quiz');
            }
            
            // Scroll to the top of the questions
            window.scrollTo(0, 0);
            
        } catch (error) {
            console.error('Error loading quiz:', error);
            showQuizNotFound();
        } finally {
            console.groupEnd();
        }
    }
    
    function displayQuiz(quizData) {
        if (!quizData) return;
        
        // Set quiz title
        if (quizTitle) {
            quizTitle.textContent = quizData.title || 'Quiz';
        }
        
        // Initialize question navigation
        initQuestionNavigation(quizData.questions.length);
        
        // Show first question
        showQuestion(0);
    }
    
    function initQuestionNavigation(totalQuestions) {
        // Initialize navigation buttons
        updateNavigationButtons(0, totalQuestions);
        
        // Initialize question indicators
        updateQuestionIndicators();
    }
    
    function logAllStyles(element) {
    if (!element) return;
    
    console.log('=== ELEMENT STYLES ===');
    console.log('Element:', element);
    
    // Get computed styles
    const styles = window.getComputedStyle(element);
    console.log('Computed styles:');
    for (let i = 0; i < styles.length; i++) {
        const prop = styles[i];
        console.log(`  ${prop}: ${styles.getPropertyValue(prop)}`);
    }
    
    // Check for any CSS rules affecting this element
    console.log('Matching CSS rules:');
    const rules = document.styleSheets;
    for (let i = 0; i < rules.length; i++) {
        try {
            const ruleList = rules[i].cssRules || rules[i].rules;
            if (ruleList) {
                for (let j = 0; j < ruleList.length; j++) {
                    const rule = ruleList[j];
                    if (element.matches(rule.selectorText)) {
                        console.log(`  ${rule.selectorText}`, rule.style);
                    }
                }
            }
        } catch (e) {
            // Skip cross-origin stylesheets
        }
    }
    console.log('========================');
}

function checkParentVisibility(element) {
    let current = element;
    while (current) {
        const style = window.getComputedStyle(current);
        if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') {
            console.log('Found hidden parent:', current);
            current.style.display = 'block';
            current.style.visibility = 'visible';
            current.style.opacity = '1';
            current.style.overflow = 'visible';
        }
        current = current.parentElement;
    }
}

function showQuestion(index) {
        console.group(`Showing Question ${index}`);
        
        // Add debug styles to the page
        const style = document.createElement('style');
        style.id = 'debug-styles';
        style.textContent = `
            #questionsList, #quizContent, .quiz-content, .questions-container {
                all: revert !important;
                display: block !important;
                visibility: visible !important;
                opacity: 1 !important;
                position: relative !important;
                z-index: 9999 !important;
                background: white !important;
                border: 2px solid red !important;
                padding: 20px !important;
                margin: 20px !important;
                min-height: 200px !important;
                overflow: visible !important;
                height: auto !important;
                max-height: none !important;
                width: auto !important;
                max-width: none !important;
                transform: none !important;
                clip: auto !important;
                clip-path: none !important;
                -webkit-clip-path: none !important;
                filter: none !important;
                -webkit-filter: none !important;
                pointer-events: auto !important;
                user-select: auto !important;
                -webkit-user-select: auto !important;
                -moz-user-select: auto !important;
                -ms-user-select: auto !important;
            }
            body, html {
                overflow: visible !important;
                height: auto !important;
                position: relative !important;
                background: white !important;
            }
            * {
                box-sizing: border-box !important;
            }
            #questionsList * {
                all: revert !important;
                display: revert !important;
                visibility: visible !important;
                opacity: 1 !important;
            }
        `;
        
        // Remove any existing debug styles to prevent duplicates
        const existingStyle = document.getElementById('debug-styles');
        if (existingStyle) {
            existingStyle.remove();
        }
        document.head.appendChild(style);
        
        // Ensure questions container exists and is visible
        let questionsList = document.getElementById('questionsList');
        if (!questionsList) {
            console.log('Creating new questionsList element');
            questionsList = document.createElement('div');
            questionsList.id = 'questionsList';
            questionsList.className = 'questions-container';
            const quizContent = document.getElementById('quizContent') || document.body;
            quizContent.appendChild(questionsList);
        }
        
        // Ensure the container has the correct classes and structure
        questionsList.className = 'questions-container';
        
        // Create the question card container if it doesn't exist
        let questionCard = questionsList.querySelector('.question-card');
        if (!questionCard) {
            questionCard = document.createElement('div');
            questionCard.className = 'question-card';
            questionsList.appendChild(questionCard);
        }
        
        if (!quiz || !quiz.questions || index < 0 || index >= quiz.questions.length) {
            console.error('Invalid question index or no quiz data');
            questionsList.innerHTML = '<div class="alert alert-danger">Error: Could not load question. Please try again.</div>';
            console.groupEnd();
            return;
        }
        
        const question = quiz.questions[index];
        currentQuestionIndex = index;
        
        // Get question text, handling different possible property names
        const questionText = question.text || question.question || question.questionText || 'No question text available';
        
        // Process options
        let options = [];
        if (Array.isArray(question.options)) {
            options = question.options;
        } else if (question.options && typeof question.options === 'object') {
            // Convert object options to array
            options = Object.entries(question.options).map(([key, value]) => ({
                id: key,
                text: value
            }));
        }
        
        console.log('Question data:', { questionText, options });
        
        // Generate HTML for options
        const optionsHTML = options.length > 0 
            ? options.map((option, i) => {
                const optionText = typeof option === 'string' ? option : (option.text || option.option || `Option ${i + 1}`);
                const optionValue = typeof option === 'string' ? i : (option.id || i);
                return `
                    <div class="form-check">
                        <input class="form-check-input" type="radio" 
                               name="question-${index}" 
                               id="q${index}-opt${i}" 
                               value="${optionValue}" 
                               ${userAnswers[index] === i ? 'checked' : ''}
                               onchange="handleAnswer(${index}, ${i})">
                        <label class="form-check-label" for="q${index}-opt${i}">
                            ${optionText}
                        </label>
                    </div>`;
            }).join('')
            : '<div class="alert alert-warning">No options available for this question.</div>';
        
        // Render the question
        if (questionsList) {
            const questionHTML = `
                <div class="question-card" data-question-index="${index}" style="background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                    <h4 style="color: #2c3e50; margin-bottom: 20px;">Question ${index + 1} of ${quiz.questions.length}</h4>
                    <p class="question-text" style="font-size: 1.1rem; margin-bottom: 20px; color: #34495e;">${questionText}</p>
                    <div class="options" style="display: flex; flex-direction: column; gap: 10px;">
                        ${optionsHTML}
                    </div>
                </div>`;
            
            console.log('Rendered question HTML:', questionHTML);
            
            // Clear and insert the question HTML into the DOM
            questionsList.innerHTML = questionHTML;
            
            // Force a reflow to ensure styles are applied
            void questionsList.offsetHeight;
            
            // Log the actual content after insertion
            console.log('questionsList after insertion:', questionsList.outerHTML);
        } else {
            console.error('questionsList element not found in the DOM');
        }
        
        // Update navigation buttons and indicators
        updateNavigationButtons(index, quiz.questions.length);
        updateQuestionIndicators();
        
        console.groupEnd();
    }
    
    function updateTimer() {
        if (timeLeft <= 0) {
            clearInterval(timerInterval);
            // Auto-submit the quiz when time is up
            submitQuiz();
            return;
        }
        
        timeLeft--;
        updateTimerDisplay();
        
        // Show warnings when time is running low
        if (timeLeft === 300) { // 5 minutes left
            showTimerWarning('5 minutes remaining!', 'warning');
        } else if (timeLeft === 60) { // 1 minute left
            showTimerWarning('1 minute remaining!', 'danger');
        } else if (timeLeft <= 10) { // Last 10 seconds
            showTimerWarning(`${timeLeft} seconds remaining!`, 'danger');
            quizTimer.classList.add('blink');
        }
    }
    
    function updateTimerDisplay() {
        if (!quizTimer) return;
        
        const minutes = Math.floor(timeLeft / 60);
        const seconds = timeLeft % 60;
        const timeString = `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
        
        quizTimer.innerHTML = `<i class="fas fa-clock"></i> Time Remaining: ${timeString}`;
        
        // Update timer appearance based on remaining time
        quizTimer.className = 'quiz-timer';
        if (timeLeft <= 300) { // 5 minutes or less
            quizTimer.classList.add('warning');
        }
        if (timeLeft <= 60) { // 1 minute or less
            quizTimer.classList.remove('warning');
            quizTimer.classList.add('critical');
        }
    }
    
    function showTimerWarning(message, type = 'warning') {
        // Create notification element if it doesn't exist
        let notification = document.getElementById('timerNotification');
        if (!notification) {
            notification = document.createElement('div');
            notification.id = 'timerNotification';
            notification.className = `timer-notification ${type}`;
            document.body.appendChild(notification);
            
            // Auto-remove after 5 seconds
            setTimeout(() => {
                notification.classList.add('fade-out');
                setTimeout(() => notification.remove(), 500);
            }, 5000);
        }
        
        // Set message and show
        notification.innerHTML = `
            <i class="fas ${type === 'warning' ? 'fa-exclamation-triangle' : 'fa-exclamation-circle'}"></i>
            <span>${message}</span>
        `;
        notification.className = `timer-notification ${type} show`;
    }
    
    // Show confirmation modal before submitting
    window.showSubmitConfirmation = function() {
        const modal = document.getElementById('submitConfirmationModal');
        if (modal) {
            // Update the modal with current stats
            const answeredCount = Object.keys(userAnswers).length;
            const totalQuestions = quiz?.questions?.length || 0;
            
            document.getElementById('answeredCount').textContent = answeredCount;
            document.getElementById('totalQuestions').textContent = totalQuestions;
            document.getElementById('unansweredCount').textContent = totalQuestions - answeredCount;
            
            // Show the modal
            modal.style.display = 'block';
            document.body.style.overflow = 'hidden';
        }
    };
    
    // Handle the actual quiz submission
    async function submitQuiz() {
        console.log('Starting quiz submission...');
        const loadingOverlay = document.getElementById('loadingOverlay');
        
        // Show loading overlay with proper styling
        if (loadingOverlay) {
            loadingOverlay.style.display = 'flex';
            Object.assign(loadingOverlay.style, {
                display: 'flex',
                position: 'fixed',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                background: 'rgba(255, 255, 255, 0.9)',
                zIndex: '2000',
                justifyContent: 'center',
                alignItems: 'center',
                flexDirection: 'column',
                fontFamily: 'Poppins, sans-serif'
            });
        }
        
        try {
            if (!quiz || !quiz._id) {
                throw new Error('Quiz data is not loaded properly');
            }
            
            // Prepare submission data
            const submissionData = {
                quizId: quiz._id, // Using quizId to match backend expectation
                answers: [],
                timeSpent: Math.max(0, (quiz.timeLimit * 60) - timeLeft), // Ensure non-negative
                totalQuestions: quiz.questions?.length || 0,
                class: quiz.class || quiz.classId, // Include class information if available
                subject: quiz.subject // Include subject information
            };
            
            // Add user information to the submission from the user's profile
            try {
                // Get user data from localStorage or token
                const userData = JSON.parse(localStorage.getItem('userData') || 'null');
                const token = localStorage.getItem('token');
                
                if (userData) {
                    console.log('User data from localStorage:', userData);
                    // Extract email and use part before @ as name if no name is available
                    const userEmail = userData.email || 'unknown@example.com';
                    const defaultName = userEmail.split('@')[0] || 'Student';
                    
                    submissionData.studentName = userData.name || userData.fullName || userData.username || defaultName;
                    submissionData.studentEmail = userEmail;
                } else if (token) {
                    // Try to extract from JWT token
                    try {
                        const payload = JSON.parse(atob(token.split('.')[1]));
                        submissionData.studentName = payload.name || payload.fullName || 'Student';
                        submissionData.studentEmail = payload.email || 'unknown@example.com';
                    } catch (e) {
                        console.warn('Could not parse user data from token');
                        submissionData.studentName = 'Student';
                        submissionData.studentEmail = 'unknown@example.com';
                    }
                } else {
                    submissionData.studentName = 'Student';
                    submissionData.studentEmail = 'unknown@example.com';
                }
            } catch (error) {
                console.error('Error getting user data:', error);
                submissionData.studentName = 'Student';
                submissionData.studentEmail = 'unknown@example.com';
            }
            
            // Add quiz metadata
            submissionData.quizTitle = quiz.title;
            submissionData.quizDescription = quiz.description || '';

            // Format answers according to the backend's expected format
            if (quiz.questions && Array.isArray(quiz.questions)) {
                submissionData.answers = []; // Reset answers array
                
                quiz.questions.forEach((question, index) => {
                    const answerIndex = userAnswers[index];
                    
                    // Skip if no answer was provided for this question
                    if (answerIndex === undefined || answerIndex === null) {
                        console.log(`Skipping unanswered question ${index}`);
                        return;
                    }
                    
                    // Get the selected option text
                    const selectedOption = question.options[answerIndex];
                    const isCorrect = answerIndex === question.correctAnswer;
                    
                    // Format the answer object to match the backend's expected format
                    const answerObj = {
                        question: question._id || question.id, // The question ID
                        selectedOption: selectedOption, // The selected option text
                        isCorrect: answerIndex === question.correctAnswer, // Boolean indicating if answer is correct
                        pointsEarned: answerIndex === question.correctAnswer ? 1 : 0, // Points for this answer
                        // Remove debug info as it might cause validation issues
                        questionText: question.questionText, // Include question text for reference
                        correctAnswer: question.options[question.correctAnswer] // Include correct answer for reference
                    };
                    
                    submissionData.answers.push(answerObj);
                    
                    console.log(`Question ${index} answer:`, answerObj);
                });
                
                // Add total score based on the quiz's questions
                submissionData.totalQuestions = quiz.questions.length;
                submissionData.percentage = 0; // Will be calculated on the server
            }
            
            console.log('Submitting quiz data:', JSON.stringify(submissionData, null, 2));
            
            // Get JWT token from localStorage
            const token = localStorage.getItem('token');
            if (!token) {
                throw new Error('Authentication required. Please log in again.');
            }
            
            // Submit to the server
            const startTime = performance.now();
            let response;
            try {
                response = await fetch(`${API_BASE_URL}/api/quizzes/submit`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`,
                        'Accept': 'application/json'
                    },
                    body: JSON.stringify({
                        ...submissionData,
                        debugInfo: {
                            ...submissionData.debugInfo,
                            quizId: quiz._id,
                            userId: JSON.parse(atob(token.split('.')[1])).id
                        }
                    }),
                    credentials: 'include',
                    mode: 'cors'
                });
                
                const responseTime = performance.now() - startTime;
                console.log(`Request completed in ${responseTime.toFixed(2)}ms`);
                console.log('Response status:', response.status, response.statusText);
                
                // Log response headers
                const responseHeaders = {};
                response.headers.forEach((value, key) => {
                    responseHeaders[key] = value;
                });
                console.log('Response headers:', responseHeaders);
                
                // Parse response
                let responseText;
                try {
                    responseText = await response.text();
                    console.log('Raw response:', responseText);
                    var result = responseText ? JSON.parse(responseText) : {};
                } catch (parseError) {
                    console.error('Error parsing response:', parseError);
                    throw new Error(`Invalid JSON response from server: ${parseError.message}`);
                }
                
                if (response.ok || response.status === 201) {
                    console.log('Quiz submitted successfully:', result);
                    
                    // Store the submission result
                    storeQuizResults(quiz._id, result);
                    
                    // Update the quiz status in the quizzes list
                    updateQuizStatusInUI(quiz._id, 'completed');
                    
                    // Ensure we have the submission ID in the result
                    if (!result.submissionId && result.data && result.data._id) {
                        result.submissionId = result.data._id;
                    }
                    
                    // Show the quiz results
                    await showQuizResults(result);
                    return result;
                } else {
                    console.error('Server responded with error:', {
                        status: response.status,
                        statusText: response.statusText,
                        url: response.url,
                        headers: responseHeaders,
                        body: result
                    });
                    throw new Error(result.message || `Failed to submit quiz: ${response.status} ${response.statusText}`);
                }
                
            } catch (fetchError) {
                console.error('Network or fetch error:', {
                    name: fetchError.name,
                    message: fetchError.message,
                    stack: fetchError.stack,
                    isAxiosError: fetchError.isAxiosError,
                    request: fetchError.request,
                    response: fetchError.response?.data || fetchError.response
                });
                
                // Re-throw with more context
                const error = new Error(fetchError.message || 'Network error occurred');
                error.originalError = fetchError;
                error.isNetworkError = true;
                throw error;
            }
            
            console.log('Quiz submitted successfully:', result);
            
            // Ensure we have the submission ID in the result
            if (!result.submissionId && result.submission && result.submission._id) {
                result.submissionId = result.submission._id;
            }
            
            // Show success message and redirect to results
            await showQuizResults(result);
            
        } catch (error) {
            console.error('Error submitting quiz:', error);
            
            // Hide loading overlay
            if (loadingOverlay) {
                loadingOverlay.style.display = 'none';
            }
            
            // Show error message in a user-friendly way
            const errorMessage = `Failed to submit quiz: ${error.message || 'Unknown error'}`;
            
            // Create error container
            const errorContainer = document.createElement('div');
            errorContainer.className = 'alert alert-danger';
            errorContainer.style.margin = '20px';
            errorContainer.style.padding = '15px';
            errorContainer.style.borderRadius = '4px';
            errorContainer.innerHTML = `
                <div style="display: flex; align-items: center; margin-bottom: 10px;">
                    <i class="fas fa-exclamation-triangle" style="font-size: 24px; margin-right: 10px;"></i>
                    <h4 style="margin: 0; font-size: 1.2rem;">Submission Error</h4>
                </div>
                <p style="margin: 10px 0;">${error.message || 'Failed to submit quiz. Please try again.'}</p>
                <div style="margin-top: 15px;">
                    <button id="retryBtn" class="btn btn-primary" style="margin-right: 10px;">
                        <i class="fas fa-sync-alt"></i> Try Again
                    </button>
                    <button id="cancelErrorBtn" class="btn btn-outline-secondary">
                        <i class="fas fa-times"></i> Cancel
                    </button>
                </div>
            `;
            
            // Show error message in a modal-like container
            const errorModal = document.createElement('div');
            errorModal.style.position = 'fixed';
            errorModal.style.top = '0';
            errorModal.style.left = '0';
            errorModal.style.width = '100%';
            errorModal.style.height = '100%';
            errorModal.style.backgroundColor = 'rgba(0,0,0,0.5)';
            errorModal.style.display = 'flex';
            errorModal.style.justifyContent = 'center';
            errorModal.style.alignItems = 'center';
            errorModal.style.zIndex = '9999';
            errorModal.appendChild(errorContainer);
            
            // Add to document
            document.body.appendChild(errorModal);
            
            // Add event listeners
            document.getElementById('retryBtn').addEventListener('click', () => {
                document.body.removeChild(errorModal);
                submitQuiz();
            });
            
            document.getElementById('cancelErrorBtn').addEventListener('click', () => {
                document.body.removeChild(errorModal);
            });
            
            // Also close when clicking outside the error message
            errorModal.addEventListener('click', (e) => {
                if (e.target === errorModal) {
                    document.body.removeChild(errorModal);
                }
            });
        } finally {
            // Hide loading overlay if it's still there
            if (loadingOverlay && loadingOverlay.parentNode) {
                loadingOverlay.style.display = 'none';
            }
        }
    }
    
    async function showQuizResults(result) {
        console.log('Starting to show quiz results:', result);
        
        // Store the quiz results in localStorage
        const quizId = getQuizId();
        if (quizId) {
            storeQuizResults(quizId, result);
        }
        
        // Hide loading overlay if it exists
        const loadingOverlay = document.getElementById('loadingOverlay');
        if (loadingOverlay) {
            console.log('Hiding loading overlay');
            loadingOverlay.style.display = 'none';
        } else {
            console.warn('Loading overlay not found');
        }
        
        // Use the data we already have from the submission response
        // The server returns the submission in result.data
        const submission = result.data || result;
        console.log('Using submission data:', submission);
        
        // Update result with submission data
        result = {
            ...result,
            ...submission,
            // Ensure we have these fields
            score: submission.score || 0,
            totalScore: submission.totalScore || (quiz?.questions?.length || 0),
            percentage: submission.percentage || 0,
            passed: submission.passed || false,
            timeSpent: submission.timeSpent || 0,
            submittedAt: submission.submittedAt || new Date().toISOString()
        };
        
        // Create a modal for results
        let modal = document.createElement('div');
        modal.id = 'resultsModal';
        modal.style.position = 'fixed';
        modal.style.top = '0';
        modal.style.left = '0';
        modal.style.width = '100%';
        modal.style.height = '100%';
        modal.style.backgroundColor = 'rgba(0,0,0,0.7)';
        modal.style.zIndex = '9999';
        modal.style.display = 'flex';
        modal.style.justifyContent = 'center';
        modal.style.alignItems = 'center';
        modal.style.overflowY = 'auto';
        modal.style.padding = '20px';
        
        // Create modal content
        let modalContent = document.createElement('div');
        modalContent.style.backgroundColor = 'white';
        modalContent.style.borderRadius = '8px';
        modalContent.style.width = '90%';
        modalContent.style.maxWidth = '800px';
        modalContent.style.maxHeight = '90vh';
        modalContent.style.overflowY = 'auto';
        modalContent.style.position = 'relative';
        
        // Close button
        let closeButton = document.createElement('button');
        closeButton.textContent = '×';
        closeButton.style.position = 'absolute';
        closeButton.style.top = '10px';
        closeButton.style.right = '10px';
        closeButton.style.background = 'none';
        closeButton.style.border = 'none';
        closeButton.style.fontSize = '24px';
        closeButton.style.cursor = 'pointer';
        closeButton.onclick = function() {
            document.body.removeChild(modal);
            // Redirect to quizzes page after closing results
            window.location.href = '../pages/quizzes.html';
        };
        
        // Results container
        let resultsContainer = document.createElement('div');
        resultsContainer.id = 'quizResults';
        resultsContainer.style.padding = '20px';
        
        // Assemble the modal
        modalContent.appendChild(closeButton);
        modalContent.appendChild(resultsContainer);
        modal.appendChild(modalContent);
        
        // Add to document
        document.body.appendChild(modal);
        
        // Close modal when clicking outside content
        modal.onclick = function(e) {
            if (e.target === modal) {
                document.body.removeChild(modal);
            }
        };
        
        // Log container info
        console.log('Results container:', {
            id: resultsContainer.id,
            className: resultsContainer.className,
            parentNode: resultsContainer.parentNode ? resultsContainer.parentNode.id : 'none',
            inDocument: document.body.contains(resultsContainer)
        });
        
        // Hide quiz content
        const quizContent = document.getElementById('quizContent');
        if (quizContent) {
            console.log('Hiding quiz content');
            quizContent.style.display = 'none';
        } else {
            console.warn('Quiz content container not found');
        }
        
        try {
            // Create results header with submission data
            const score = result.score || 0;
            const totalScore = result.totalScore || quiz?.questions?.length || result.questions?.length || 1;
            const percentage = result.percentage || (totalScore > 0 ? Math.round((score / totalScore) * 100) : 0);
            const passed = result.passed !== undefined ? result.passed : percentage >= 70; // Default passing is 70%
            const timeSpent = result.timeSpent || 0;
            const submittedAt = result.submittedAt ? new Date(result.submittedAt) : new Date();
            
            // Format time spent
            const minutes = Math.floor(timeSpent / 60);
            const seconds = timeSpent % 60;
            const timeSpentFormatted = `${minutes}:${seconds.toString().padStart(2, '0')}`;
            
            // Format submission date
            const options = { 
                year: 'numeric', 
                month: 'short', 
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            };
            const submissionDate = submittedAt.toLocaleDateString('en-US', options);
            
            // Add debug info
            console.log('Creating results HTML with data:', {
                score,
                totalQuestions,
                percentage,
                passed,
                timeSpent: result.timeSpent,
                submittedAt: result.submittedAt,
                questionsCount: result.questions ? result.questions.length : 0
            });

            // Create results HTML with inline styles to ensure they're applied
            let resultsHTML = `
                <style>
                    .result-card { margin: 20px; padding: 20px; border: 1px solid #ddd; border-radius: 5px; background: #fff; }
                    .result-header { background: #007bff; color: white; padding: 15px; border-radius: 5px 5px 0 0; }
                    .result-item { margin-bottom: 15px; padding: 15px; border-radius: 5px; }
                    .correct { border-left: 5px solid #28a745; }
                    .incorrect { border-left: 5px solid #dc3545; }
                    .correct-answer { color: #28a745; font-weight: bold; }
                </style>
                <div class="result-card">
                    <div class="result-header">
                        <h3 style="margin: 0;">Quiz Results</h3>
                    </div>
                    <div class="card-body">
                        <div class="row text-center">
                            <div class="col-md-4">
                                <h4>Score</h4>
                                <h2 class="text-primary">${score}/${totalQuestions}</h2>
                                <p class="h3 ${passed ? 'text-success' : 'text-danger'}">
                                    ${percentage}% ${passed ? '✓ Passed' : '✗ Failed'}
                                </p>
                            </div>
                            <div class="col-md-4">
                                <h4>Time Spent</h4>
                                <p class="h4">${formatTimeSpent(result.timeSpent || 0)}</p>
                            </div>
                            <div class="col-md-4">
                                <h4>Date Submitted</h4>
                                <p class="h6">${new Date(result.submittedAt || new Date()).toLocaleString()}</p>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="text-center mt-4">
                    <a href="../pages/quizzes.html" class="btn btn-primary">Back to Quizzes</a>
                    <button onclick="window.location.reload()" class="btn btn-outline-secondary ms-2">
                        <i class="bi bi-arrow-repeat"></i> Try Again
                    </button>
                </div>
                <div class="card">
                    <div class="card-header">
                        <h4 class="mb-0">Detailed Results</h4>
                    </div>
                    <div class="card-body">
            `;
            
            // Add question results
            const answers = result.answers || [];
            const questions = result.questions || [];
            
            if (answers.length > 0) {
                console.log('Processing answers:', JSON.stringify(answers, null, 2));
                
                answers.forEach((answer, i) => {
                    const question = questions[i] || {};
                    const questionText = question.questionText || answer.questionText || `Question ${i + 1}`;
                    const isCorrect = answer.isCorrect !== undefined ? answer.isCorrect : 
                                    (answer.selectedOption === answer.correctAnswer);
                    
                    // Get user's answer text
                    let userAnswerText = answer.selectedOption || 'Not answered';
                    let correctAnswerText = answer.correctAnswer || 'N/A';
                    
                    // Add question result to HTML
                    resultsHTML += `
                        <div class="mb-4 p-3 border rounded ${isCorrect ? 'border-success' : 'border-danger'}">
                            <div class="d-flex justify-content-between align-items-center mb-2">
                                <h5 class="mb-0">${questionText}</h5>
                                <span class="badge ${isCorrect ? 'bg-success' : 'bg-danger'}">
                                    ${isCorrect ? 'Correct' : 'Incorrect'}
                                </span>
                            </div>
                            <p class="mb-1"><strong>Your answer:</strong> ${userAnswerText}</p>`;
                    
                    // Add correct answer if the user was wrong
                    if (!isCorrect) {
                        resultsHTML += `
                            <p class="mb-1 text-success"><strong>Correct answer:</strong> ${correctAnswerText}</p>`;
                    }
                    
                    // Add points information
                    resultsHTML += `
                            <p class="text-muted small mt-2">
                                ${isCorrect ? '✓ Correct' : '✗ Incorrect'} • 
                                Points: ${answer.pointsEarned || (isCorrect ? 1 : 0)} / ${answer.pointsPossible || 1}
                            </p>
                        </div>`;
                });
            } else {
                resultsHTML += '<p>No question details available.</p>';
            }
            
            // Add navigation buttons
            resultsHTML += `
                    </div>
                    <div class="card-footer text-center">
                        <a href="../pages/quizzes.html" class="btn btn-primary me-2">
                            <i class="bi bi-list-ul me-1"></i> Back to Quizzes
                        </a>
                        <button onclick="window.location.reload()" class="btn btn-outline-secondary">
                            <i class="bi bi-arrow-repeat me-1"></i> Try Again
                        </button>
                    </div>
                </div>
            `;
            
            // Set the HTML content
            console.log('Setting innerHTML of results container');
            resultsContainer.innerHTML = resultsHTML;
            
            // Debug: Check if content was set
            console.log('Results container content length:', resultsContainer.innerHTML.length);
            console.log('Results container children:', resultsContainer.children.length);
            
            // Make sure container is visible
            resultsContainer.style.display = 'block';
            resultsContainer.style.visibility = 'visible';
            resultsContainer.style.opacity = '1';
            
            // Scroll to top of results and highlight the container
            window.scrollTo(0, 0);
            resultsContainer.scrollIntoView({ behavior: 'smooth' });
            
            // Add a border to make it more visible for debugging
            resultsContainer.style.border = '2px solid red';
            
            // Log final state
            console.log('Results should be visible now');
            console.log('Results container position and size:', {
                top: resultsContainer.offsetTop,
                left: resultsContainer.offsetLeft,
                width: resultsContainer.offsetWidth,
                height: resultsContainer.offsetHeight,
                computedStyle: window.getComputedStyle(resultsContainer)
            });
            
        } catch (error) {
            console.error('Error showing quiz results:', error);
            
            // Show error message
            if (quizResults) {
                quizResults.innerHTML = `
                    <div class="alert alert-danger">
                        <h4>Error Loading Results</h4>
                        <p>There was an error displaying your quiz results. Please try again later.</p>
                        <button onclick="location.reload()" class="btn btn-primary mt-2">
                            <i class="fas fa-sync-alt"></i> Try Again
                        </button>
                    </div>`;
                quizResults.style.display = 'block';
            }
        }
    }
    
    function formatTimeSpent(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
    }
    
    function getQuizId() {
        // Try to get quiz ID from URL parameters
        const urlParams = new URLSearchParams(window.location.search);
        let quizId = urlParams.get('id');
        
        // If not in URL params, try to get from hash
        if (!quizId && window.location.hash) {
            const hashParams = new URLSearchParams(window.location.hash.substring(1));
            quizId = hashParams.get('id');
        }
        
        // If still not found, try to get from session storage
        if (!quizId) {
            quizId = sessionStorage.getItem('currentQuizId');
        }
        
        return quizId || '';
    }
    
    function showQuizNotFound() {
        if (!quizContent) return;
        
        const currentUrl = window.location.href;
        const quizId = getQuizId();
        
        quizContent.innerHTML = `
            <div class="alert alert-danger">
                <h4 class="alert-heading">Quiz Not Found</h4>
                <p>The requested quiz could not be loaded. Here are some details that might help:</p>
                <ul>
                    <li><strong>Current URL:</strong> ${currentUrl}</li>
                    <li><strong>Quiz ID from URL:</strong> ${quizId || 'Not found'}</li>
                    <li><strong>API Endpoint:</strong> ${API_BASE_URL}/api/quizzes/${quizId || 'QUIZ_ID'}</li>
                </ul>
                <p class="mt-3">Please check the following:</p>
                <ol>
                    <li>Make sure you're using a valid quiz URL (e.g., /take-quiz.html?id=YOUR_QUIZ_ID)</li>
                    <li>Verify that the backend server is running at ${API_BASE_URL}</li>
                    <li>Check the browser's developer console for any error messages</li>
                </ol>
                <hr>
                <p class="mb-0">
                    <a href="/quizzes" class="btn btn-primary me-2">Return to quizzes list</a>
                    <button onclick="location.reload()" class="btn btn-outline-secondary">Try Again</button>
                </p>
            </div>`;
    }
    
    // Initialize modal functionality
    function initModal() {
        const modal = document.getElementById('submitConfirmationModal');
        if (!modal) {
            console.error('Submit confirmation modal not found');
            return;
        }
        
        const closeBtn = modal.querySelector('.close-modal');
        const cancelBtn = document.getElementById('cancelSubmitBtn');
        const confirmBtn = document.getElementById('confirmSubmitBtn');
        
        if (!closeBtn || !cancelBtn || !confirmBtn) {
            console.error('One or more modal elements not found');
            return;
        }
        
        // Close modal function
        function closeModal() {
            modal.style.display = 'none';
            document.body.style.overflow = 'auto'; // Re-enable scrolling
        }
        
        // Show modal function
        window.showSubmitConfirmation = function() {
            if (!quiz) {
                console.error('Quiz data not loaded');
                return;
            }
            
            // Update the modal with current stats
            const answeredCount = Object.keys(userAnswers).length;
            const totalQuestions = quiz.questions?.length || 0;
            
            const answeredCountEl = document.getElementById('answeredCount');
            const totalQuestionsEl = document.getElementById('totalQuestions');
            const unansweredCountEl = document.getElementById('unansweredCount');
            
            if (answeredCountEl) answeredCountEl.textContent = answeredCount;
            if (totalQuestionsEl) totalQuestionsEl.textContent = totalQuestions;
            if (unansweredCountEl) unansweredCountEl.textContent = totalQuestions - answeredCount;
            
            // Show the modal
            modal.style.display = 'block';
            document.body.style.overflow = 'hidden'; // Prevent scrolling when modal is open
        };
        
        // Event listeners
        closeBtn.addEventListener('click', closeModal);
        cancelBtn.addEventListener('click', closeModal);
        
        // Close modal when clicking outside the modal content
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeModal();
            }
        });
        
        // Handle confirm button click
        confirmBtn.addEventListener('click', () => {
                closeModal();
                submitQuiz();
            });
        }
        
    // Debug function to help troubleshoot visibility issues
    function debugDOM() {
        console.log('=== Debugging Quiz Interface ===');
        console.log('quizContent:', document.getElementById('quizContent'));
        console.log('questionsList:', document.getElementById('questionsList'));
        console.log('quizTitle:', document.getElementById('quizTitle'));
        console.log('currentQuestionIndex:', currentQuestionIndex);
        console.log('quiz:', quiz);
        console.log('userAnswers:', userAnswers);
    }

    // Add debug button to the page
    function addDebugButton() {
        const debugBtn = document.createElement('button');
        debugBtn.textContent = 'Debug Quiz';
        debugBtn.style.position = 'fixed';
        debugBtn.style.top = '10px';
        debugBtn.style.right = '10px';
        debugBtn.style.zIndex = '99999';
        debugBtn.style.padding = '10px';
        debugBtn.style.background = 'red';
        debugBtn.style.color = 'white';
        debugBtn.style.border = 'none';
        debugBtn.style.borderRadius = '4px';
        debugBtn.style.cursor = 'pointer';
        
        debugBtn.onclick = function() {
            debugDOM();
            
            // Try to force show all quiz content
            const quizContent = document.getElementById('quizContent');
            const questionsList = document.getElementById('questionsList');
            
            if (quizContent) {
                quizContent.style.display = 'block';
                quizContent.style.visibility = 'visible';
                quizContent.style.opacity = '1';
                quizContent.style.position = 'relative';
                quizContent.style.zIndex = '9999';
            }
            
            if (questionsList) {
                questionsList.style.display = 'block';
                questionsList.style.visibility = 'visible';
                questionsList.style.opacity = '1';
                questionsList.style.position = 'relative';
                questionsList.style.zIndex = '9999';
                questionsList.style.border = '2px solid green';
                questionsList.style.padding = '20px';
                questionsList.style.background = 'white';
                
                // Also log the innerHTML to console
                console.log('questionsList innerHTML:', questionsList.innerHTML);
            }
            
            alert('Debug information has been logged to the console. Please check the browser\'s developer tools (F12).');
        };
        
        document.body.appendChild(debugBtn);
    }
    
    // Initialize modal when DOM is loaded
    initModal();
    
    // Add debug button and run initial debug
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        addDebugButton();
        debugDOM();
        // Also run debug after a short delay to catch any dynamic content
        setTimeout(debugDOM, 1000);
    }
});
