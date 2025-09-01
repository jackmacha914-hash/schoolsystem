// Check authentication status
function checkAuth() {
    const token = localStorage.getItem('token');
    if (!token) {
        // Store the current URL to redirect back after login
        sessionStorage.setItem('redirectAfterLogin', window.location.href);
        // Redirect to login page
        window.location.href = '/login.html';
        return false;
    }
    return true;
}

document.addEventListener('DOMContentLoaded', function() {
    // Check authentication first
    if (!checkAuth()) {
        return; // Stop execution if not authenticated
    }
    // Initialize questions array to store quiz questions
    let questions = [];
    
    // DOM Elements
    const quizzesList = document.getElementById('quizzesList');
    const createQuizBtn = document.getElementById('createQuizBtn');
    const quizModal = document.getElementById('quizModal');
    const quizForm = document.getElementById('quizForm');
    const closeModal = document.querySelector('.close') || document.getElementById('closeModal');
    const cancelBtn = document.getElementById('cancelBtn');
    const addQuestionBtn = document.getElementById('addQuestionBtn');
    const questionsContainer = document.getElementById('questionsContainer');
    const quizTitle = document.getElementById('quizTitle');
    const quizDescription = document.getElementById('quizDescription') || { value: '' };
    const quizSubject = document.getElementById('quizSubject') || { value: 'General' };
    const timeLimit = document.getElementById('timeLimit') || { value: '30' };
    const quizId = document.getElementById('quizId');
    const modalTitle = document.getElementById('modalTitle');
    const submitBtn = document.querySelector('#quizForm button[type="submit"]');
    
    // Function to collect all questions data from the form
    function collectQuestionsData() {
        const questions = [];
        const questionElements = document.querySelectorAll('.question-card');
        
        questionElements.forEach((qElement) => {
            const questionText = qElement.querySelector('.question-text')?.value || '';
            const optionInputs = qElement.querySelectorAll('.option-input');
            const options = Array.from(optionInputs).map(input => input.value).filter(Boolean);
            
            // Get selected correct answer index
            const selectedOption = qElement.querySelector('input[type="radio"]:checked');
            const correctAnswer = selectedOption ? parseInt(selectedOption.value) : 0;
            // Ensure correctAnswer is a valid number within options range
            const validCorrectAnswer = isNaN(correctAnswer) || correctAnswer < 0 || correctAnswer >= options.length ? 0 : correctAnswer;
            
            // Get points
            const pointsInput = qElement.querySelector('.points');
            const points = pointsInput ? parseInt(pointsInput.value) || 1 : 1;
            
            // Get explanation
            const explanationInput = qElement.querySelector('.explanation');
            const explanation = explanationInput ? explanationInput.value : '';
            
            questions.push({
                questionText,
                options,
                correctAnswer: validCorrectAnswer,
                points,
                explanation
            });
        });
        
        return questions;
    }
    
    // Reset form and questions when opening the modal
    function resetForm() {
        questions = [];
        if (questionsContainer) questionsContainer.innerHTML = '';
        if (quizForm) quizForm.reset();
        if (quizId) quizId.value = '';
        if (modalTitle) modalTitle.textContent = 'Create New Quiz';
    }
    
    // Base API URL - Make sure this matches your backend server port
    const API_BASE_URL = 'http://localhost:5000/api';
    
    // Show notification function
    function showNotification(message, type = 'info') {
        const container = document.createElement('div');
        container.className = `notification ${type}`;
        container.innerHTML = `
            <span>${message}</span>
            <button class="close-notification">&times;</button>
        `;
        
        document.body.appendChild(container);
        
        // Auto remove after 5 seconds
        setTimeout(() => {
            container.classList.add('fade-out');
            setTimeout(() => container.remove(), 300);
        }, 5000);
        
        // Close button
        container.querySelector('.close-notification').addEventListener('click', () => {
            container.remove();
        });
    }

    // Event Listeners
    if (createQuizBtn) createQuizBtn.addEventListener('click', () => openModal());
    if (closeModal) closeModal.addEventListener('click', () => closeModalFunc());
    if (cancelBtn) cancelBtn.addEventListener('click', () => closeModalFunc());
    if (addQuestionBtn) addQuestionBtn.addEventListener('click', () => addQuestion());
    if (quizForm) quizForm.addEventListener('submit', handleSubmit);
    
    // Load quizzes when the page loads
    if (quizzesList) {
        loadQuizzes();
    }
    
    // Handle view submissions button click
    document.addEventListener('click', (e) => {
        if (e.target.closest('.view-submissions')) {
            const quizId = e.target.closest('.view-submissions').dataset.id;
            viewSubmissions(quizId);
            return;
        }
    });

    // Close modal when clicking outside
    window.addEventListener('click', (e) => {
        if (e.target === quizModal) {
            closeModalFunc();
        }
    });

    // Close modal when clicking outside the modal content
    window.addEventListener('click', (e) => {
        if (e.target === quizModal) {
            closeModalFunc();
        }
    });

    // Load quizzes on page load if authenticated
    if (quizzesList) {
        loadQuizzes().catch(error => {
            console.error('Error loading quizzes:', error);
            showNotification('Error loading quizzes. Please try again.', 'error');
        });
    }

    // Function to view submissions for a quiz
    async function viewSubmissions(quizId) {
        // Show loading state
        const loadingHtml = `
            <div class="modal-header">
                <h5 class="modal-title">Quiz Submissions</h5>
                <button type="button" class="close" data-dismiss="modal">&times;</button>
            </div>
            <div class="modal-body text-center py-4">
                <div class="spinner-border text-primary" role="status">
                    <span class="sr-only">Loading...</span>
                </div>
                <p class="mt-2">Loading submissions...</p>
            </div>
        `;
        
        // Create or update modal
        let modal = document.getElementById('submissionsModal');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'submissionsModal';
            modal.className = 'modal fade';
            modal.tabIndex = '-1';
            modal.role = 'dialog';
            modal.innerHTML = `
                <div class="modal-dialog modal-lg" role="document">
                    <div class="modal-content">
                        ${loadingHtml}
                    </div>
                </div>
            `;
            document.body.appendChild(modal);
        } else {
            modal.querySelector('.modal-content').innerHTML = loadingHtml;
        }
        
        // Show modal with vanilla JS
        const modalInstance = new bootstrap.Modal(modal);
        modalInstance.show();
        
        try {
            // Get token from localStorage
            const token = localStorage.getItem('token');
            console.log('Token from localStorage:', token ? 'Token exists' : 'No token found');
            
            if (!token) {
                throw new Error('No authentication token found. Please log in again.');
            }
            
            // Log the quiz ID being requested
            console.log('Fetching submissions for quiz ID:', quizId);
            console.log('Request URL:', `${API_BASE_URL}/quizzes/submissions/quiz/${quizId}`);
            
            // Fetch submissions from the server - using the correct endpoint
            const response = await fetch(`${API_BASE_URL}/quizzes/submissions/quiz/${quizId}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                credentials: 'include' // Ensure cookies are sent with the request
            });
            
            console.log('Response status:', response.status);
            console.log('Response headers:', Object.fromEntries(response.headers.entries()));
            
            if (response.status === 401) {
                // Token might be expired or invalid
                console.error('Authentication error - token might be expired or invalid');
                // Redirect to login or refresh token if you have a refresh token flow
                window.location.href = '/login.html';
                return;
            }
            
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                console.error('Error response:', errorData);
                throw new Error(errorData.message || 'Failed to fetch submissions');
            }
            
            const responseText = await response.text();
            console.log('Raw response text:', responseText);
            
            let data;
            try {
                data = JSON.parse(responseText);
                console.log('Parsed response data:', data);
            } catch (e) {
                console.error('Error parsing response as JSON:', e);
                throw new Error('Invalid response from server');
            }
            
            console.log('Submissions data from API:', data);
            
            // Check if data.data exists and is an array
            const submissions = Array.isArray(data.data) ? data.data : [];
            console.log('Number of submissions found:', submissions.length);
            console.log('Processed submissions:', submissions);
            
            // Log each submission for debugging
            submissions.forEach((sub, index) => {
                console.log(`Submission ${index}:`, {
                    studentName: sub.studentName,
                    studentEmail: sub.studentEmail,
                    _id: sub._id,
                    sub: JSON.stringify(sub, null, 2)
                });
            });
            
            // Create the submissions HTML
            const submissionsHtml = `
                <div class="modal-header">
                    <h5 class="modal-title">Quiz Submissions</h5>
                    <button type="button" class="close" data-dismiss="modal">&times;</button>
                </div>
                <div class="modal-body">
                    ${submissions.length === 0 ? `
                        <div class="text-center py-4">
                            <i class="fas fa-inbox fa-3x text-muted mb-3"></i>
                            <p>No submissions found for this quiz yet.</p>
                        </div>` : `
                        <div class="table-responsive">
                            <table class="table table-striped">
                                <thead>
                                    <tr>
                                        <th>Student</th>
                                        <th>Email</th>
                                        <th>Score</th>
                                        <th>Status</th>
                                        <th>Submitted At</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${submissions.map(sub => {
                                        const studentName = sub.studentName || 'N/A';
                                        const studentEmail = sub.studentEmail || 'N/A';
                                        const score = sub.score || 0;
                                        const totalQuestions = sub.totalQuestions || 0;
                                        const percentage = sub.percentage || 0;
                                        const passed = sub.passed || false;
                                        const submittedAt = sub.submittedAt ? new Date(sub.submittedAt).toLocaleString() : 'N/A';
                                        const submissionId = sub._id || '';
                                        
                                        return `
                                        <tr>
                                            <td>${studentName}</td>
                                            <td>${studentEmail}</td>
                                            <td>${score}/${totalQuestions} (${percentage}%)</td>
                                            <td>
                                                <span class="badge ${passed ? 'bg-success' : 'bg-danger'}">
                                                    ${passed ? 'Passed' : 'Failed'}
                                                </span>
                                            </td>
                                            <td>${submittedAt}</td>
                                            <td>
                                                <button class="btn btn-sm btn-primary view-submission" 
                                                        data-submission-id="${submissionId}">
                                                    <i class="fas fa-eye"></i> View
                                                </button>
                                            </td>
                                        </tr>`;
                                    }).join('')}
                                </tbody>
                            </table>
                        </div>`}
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" data-dismiss="modal">Close</button>
                </div>
            `;
            
            // Update modal content
            modal.querySelector('.modal-content').innerHTML = submissionsHtml;
            
            // Reinitialize the modal to apply the new content
            const newModalInstance = new bootstrap.Modal(modal);
            
            // Add event listeners for view buttons
            modal.querySelectorAll('.view-submission').forEach(button => {
                button.addEventListener('click', (e) => {
                    const submissionId = e.target.closest('button').dataset.submissionId;
                    if (submissionId) {
                        viewSubmissionDetails(submissionId);
                    }
                });
            });
            
        } catch (error) {
            console.error('Error fetching submissions:', error);
            const errorHtml = `
                <div class="modal-header">
                    <h5 class="modal-title text-danger">Error</h5>
                    <button type="button" class="close" data-dismiss="modal">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="alert alert-danger">
                        <i class="fas fa-exclamation-triangle me-2"></i>
                        ${error.message || 'Failed to load submissions. Please try again later.'}
                    </div>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" data-dismiss="modal">Close</button>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" data-dismiss="modal">Close</button>
                    <button type="button" class="btn btn-primary" onclick="location.reload()">
                        <i class="fas fa-sync-alt me-1"></i> Retry
                    </button>
                </div>
            `;
            modal.querySelector('.modal-content').innerHTML = errorHtml;
        }
    }
    
    // Function to view submission details
    async function viewSubmissionDetails(submissionId) {
        // Create or get modal element
        let modal = document.getElementById('submissionDetailsModal');
        
        // Initialize or update modal
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'submissionDetailsModal';
            modal.className = 'modal fade';
            modal.tabIndex = '-1';
            modal.setAttribute('aria-labelledby', 'submissionDetailsModalLabel');
            modal.setAttribute('aria-hidden', 'true');
            document.body.appendChild(modal);
        }
        
        // Show loading state
        modal.innerHTML = `
            <div class="modal-dialog modal-lg">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">Submission Details</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                    </div>
                    <div class="modal-body text-center py-4">
                        <div class="spinner-border text-primary" role="status">
                            <span class="visually-hidden">Loading...</span>
                        </div>
                        <p class="mt-2">Loading submission details...</p>
                    </div>
                </div>
            </div>
        `;
        
        // Initialize and show modal
        const modalInstance = new bootstrap.Modal(modal);
        modalInstance.show();
        
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                checkAuth();
                return;
            }
            
            console.log('Fetching submission details for ID:', submissionId);
            
            // Fetch submission details
            const response = await fetch(`${API_BASE_URL}/quizzes/submissions/${submissionId}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            
            console.log('Response status:', response.status);
            
            if (response.status === 401) {
                console.error('Authentication error - token might be expired or invalid');
                checkAuth();
                return;
            }
            
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || 'Failed to fetch submission details');
            }
            
            const submission = await response.json();
            console.log('Submission details:', submission);
            
            if (!submission) {
                throw new Error('No submission data received');
            }
            
            const submissionDate = new Date(submission.submittedAt).toLocaleString();
            
            // Generate questions HTML
            const questionsHtml = (submission.questions || []).map((q, index) => {
                // Skip if question is not properly formatted
                if (!q) return '';
                
                return `
                    <div class="card mb-3 ${q.correct ? 'border-success' : 'border-danger'}">
                        <div class="card-header d-flex justify-content-between align-items-center">
                            <strong>Question ${index + 1}</strong>
                            <span class="badge ${q.correct ? 'bg-success' : 'bg-danger'}">
                                ${q.correct ? 'Correct' : 'Incorrect'}
                            </span>
                        </div>
                        <div class="card-body">
                            <p class="card-text">${q.text || 'No question text available'}</p>
                            <div class="mt-3">
                                <p class="mb-1"><strong>Your answer:</strong> ${q.userAnswer || 'No answer provided'}</p>
                                <p class="mb-1"><strong>Correct answer:</strong> ${q.correctAnswer || 'N/A'}</p>
                                ${q.explanation ? `
                                    <div class="alert alert-info mt-2 p-2">
                                        <strong>Explanation:</strong> ${q.explanation}
                                    </div>
                                ` : ''}
                            </div>
                        </div>
                    </div>
                `;
            }).join('');
            
            // Calculate score percentage
            const totalQuestions = submission.totalQuestions || 1; // Prevent division by zero
            const score = submission.score || 0;
            const percentage = Math.round((score / totalQuestions) * 100);
            const passed = percentage >= (submission.passingScore || 60);
            
            // Update modal with submission details
            modal.innerHTML = `
                <div class="modal-dialog modal-lg">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">Submission Details</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                        </div>
                        <div class="modal-body">
                            <div class="submission-summary mb-4">
                                <div class="d-flex justify-content-between align-items-center mb-2">
                                    <div>
                                        <span class="badge ${passed ? 'bg-success' : 'bg-danger'} me-2">
                                            ${passed ? 'Passed' : 'Failed'}
                                        </span>
                                        <span>Score: ${score}/${totalQuestions} (${percentage}%)</span>
                                    </div>
                                    <div class="text-muted">
                                        <small>Submitted: ${submissionDate}</small>
                                    </div>
                                </div>
                                ${submission.timeSpent ? `
                                    <div class="text-muted">
                                        <i class="bi bi-clock me-1"></i>
                                        Time spent: ${formatTimeSpent(submission.timeSpent)}
                                    </div>
                                ` : ''}
                            </div>
                            
                            <h5>Questions</h5>
                            <div class="questions-list">
                                ${questionsHtml || '<p>No questions available for this submission.</p>'}
                            </div>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
                            <button type="button" class="btn btn-primary" onclick="window.print()">
                                <i class="bi bi-printer me-1"></i> Print
                            </button>
                        </div>
                    </div>
                </div>
            `;
            
            // Re-initialize any tooltips if needed
            const tooltipTriggerList = [].slice.call(modal.querySelectorAll('[data-bs-toggle="tooltip"]'));
            tooltipTriggerList.forEach(tooltipTriggerEl => {
                new bootstrap.Tooltip(tooltipTriggerEl);
            });
            
        } catch (error) {
            console.error('Error loading submission details:', error);
            
            // Show error message in modal
            const errorHtml = `
                <div class="modal-dialog">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">Error</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                        </div>
                        <div class="modal-body">
                            <div class="alert alert-danger">
                                <i class="bi bi-exclamation-triangle-fill me-2"></i>
                                Failed to load submission details. Please try again later.
                                <div class="mt-2 small text-muted">${error.message || ''}</div>
                            </div>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
                        </div>
                    </div>
                </div>
            `;
            
            modal.innerHTML = errorHtml;
        }
    }
    
    // Helper function to format time spent
    function formatTimeSpent(seconds) {
        if (!seconds) return 'N/A';
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes}m ${remainingSeconds}s`;
    }
    
    // Functions
    function openModal(quiz = null) {
        // Reset the form first
        resetForm();
        
        if (quiz) {
            // Edit mode
            modalTitle.textContent = 'Edit Quiz';
            quizId.value = quiz._id;
            quizTitle.value = quiz.title || '';
            quizDescription.value = quiz.description || '';
            
            // Set the subject if it exists in the quiz data
            const subjectSelect = document.getElementById('quizSubject');
            if (subjectSelect) {
                subjectSelect.value = quiz.subject || '';
            }
            
            // Set the class if it exists in the quiz data
            const classSelect = document.getElementById('quizClass');
            if (classSelect) {
                classSelect.value = quiz.class || '';
            }
            
            // Set time limit
            if (timeLimit) {
                timeLimit.value = quiz.timeLimit || 30;
            }
            
            // Add questions
            if (quiz.questions && Array.isArray(quiz.questions)) {
                quiz.questions.forEach((q, index) => {
                    addQuestion(q, index);
                });
            } else {
                // If no questions, add a default one
                addQuestion();
            }
        } else {
            // Create mode - add first question by default
            addQuestion();
        }
        
        // Show the modal
        if (quizModal) {
            quizModal.style.display = 'block';
            document.body.style.overflow = 'hidden'; // Prevent scrolling
        }
    }

    function closeModalFunc() {
        const modals = document.querySelectorAll('.modal');
        const backdrops = document.querySelectorAll('.modal-backdrop');
        
        // Hide all modals with fade out effect
        modals.forEach(modal => {
            modal.classList.remove('show');
            // Wait for transition to complete before hiding
            setTimeout(() => {
                modal.style.display = 'none';
            }, 150);
        });
        
        // Remove all backdrops with fade out effect
        backdrops.forEach(backdrop => {
            backdrop.classList.remove('show');
            // Wait for transition to complete before removing
            setTimeout(() => {
                backdrop.remove();
            }, 150);
        });
        
        // Clean up body classes and styles
        document.body.classList.remove('modal-open');
        document.body.style.overflow = 'auto';
        document.body.style.paddingRight = ''; // Reset any padding added for scrollbar
    }

    function addQuestion(question = null, index = null) {
        const questionIndex = index !== null ? index : questions.length;
        const questionData = question || {
            questionText: '',
            options: ['Option 1', 'Option 2'],
            correctAnswer: 'Option 1',
            points: 1,
            explanation: ''
        };

        const questionElement = document.createElement('div');
        questionElement.className = 'question-card card mb-3';
        questionElement.dataset.index = questionIndex;
        questionElement.innerHTML = `
            <div class="card-header d-flex justify-content-between align-items-center">
                <h5 class="mb-0">Question ${questionIndex + 1}</h5>
                <button type="button" class="btn btn-sm btn-danger delete-question" data-index="${questionIndex}">
                    <i class="fas fa-trash"></i> Delete
                </button>
            </div>
            <div class="card-body">
                <div class="form-group">
                    <label>Question Text</label>
                    <input type="text" class="form-control question-text" value="${questionData.questionText || ''}" required>
                </div>
                <div class="form-group">
                    <label>Options</label>
                    <div class="options-container">
                        ${(questionData.options || ['Option 1', 'Option 2']).map((option, i) => `
                            <div class="input-group mb-2">
                                <div class="input-group-prepend">
                                    <div class="input-group-text">
                                        <input type="radio" name="correct-${questionIndex}" 
                                               value="${i}" 
                                               ${(questionData.correctAnswer === option || (!questionData.correctAnswer && i === 0)) ? 'checked' : ''}>
                                    </div>
                                </div>
                                <input type="text" class="form-control option-input" value="${option}" required>
                                <div class="input-group-append">
                                    <button type="button" class="btn btn-outline-danger remove-option" ${(questionData.options && questionData.options.length <= 2) ? 'disabled' : ''}>
                                        <i class="fas fa-times"></i>
                                    </button>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                    <button type="button" class="btn btn-sm btn-outline-primary add-option mt-2">
                        <i class="fas fa-plus"></i> Add Option
                    </button>
                </div>
                <div class="form-row">
                    <div class="form-group col-md-6">
                        <label>Points</label>
                        <input type="number" class="form-control points" min="1" value="${questionData.points || 1}" required>
                    </div>
                </div>
                <div class="form-group">
                    <label>Explanation (Optional)</label>
                    <textarea class="form-control explanation">${questionData.explanation || ''}</textarea>
                </div>
            </div>
        `;

        // Add event listeners for the new question
        const addOptionBtn = questionElement.querySelector('.add-option');
        addOptionBtn.addEventListener('click', () => {
            const optionsContainer = questionElement.querySelector('.options-container');
            const optionIndex = optionsContainer.children.length;
            const optionElement = document.createElement('div');
            optionElement.className = 'input-group mb-2';
            optionElement.innerHTML = `
                <div class="input-group-prepend">
                    <div class="input-group-text">
                        <input type="radio" name="correct-${questionIndex}" value="${optionIndex}">
                    </div>
                </div>
                <input type="text" class="form-control option-input" placeholder="Option ${optionIndex + 1}" required>
                <div class="input-group-append">
                    <button type="button" class="btn btn-outline-danger remove-option">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
            `;
            optionsContainer.appendChild(optionElement);

            // Enable all remove buttons if we have more than 2 options
            if (optionsContainer.children.length > 2) {
                const removeBtns = questionElement.querySelectorAll('.remove-option');
                removeBtns.forEach(btn => btn.disabled = false);
            }

            // Add event listener for the remove option button
            const removeOptionBtn = optionElement.querySelector('.remove-option');
            removeOptionBtn.addEventListener('click', (e) => {
                e.target.closest('.input-group').remove();
                updateCorrectAnswerRadios(questionElement);
                
                // Disable remove buttons if we have 2 or fewer options
                if (optionsContainer.children.length <= 2) {
                    const removeBtns = questionElement.querySelectorAll('.remove-option');
                    removeBtns.forEach(btn => btn.disabled = true);
                }
            });
        });

        // Add event listener for the delete question button
        const deleteBtn = questionElement.querySelector('.delete-question');
        deleteBtn.addEventListener('click', () => {
            if (confirm('Are you sure you want to delete this question?')) {
                questions.splice(questionIndex, 1);
                updateQuestionIndices();
                // Re-render all questions
                questionsContainer.innerHTML = '';
                questions.forEach((q, i) => addQuestion(q, i));
            }
        });

        // Add event delegation for radio buttons to update correctAnswer
        questionElement.addEventListener('change', (e) => {
            if (e.target.matches('input[type="radio"]')) {
                const questionIndex = parseInt(e.target.closest('.question-card').dataset.index);
                const optionIndex = parseInt(e.target.value);
                const optionInputs = e.target.closest('.options-container').querySelectorAll('.option-input');
                const selectedOption = optionInputs[optionIndex]?.value || '';
                
                if (questions[questionIndex]) {
                    questions[questionIndex].correctAnswer = selectedOption;
                }
            }
        });

        // Add input event listeners to update questions array
        questionElement.addEventListener('input', (e) => {
            const questionIndex = parseInt(e.target.closest('.question-card').dataset.index);
            const question = questions[questionIndex];
            if (!question) return;

            if (e.target.matches('.question-text')) {
                question.questionText = e.target.value;
            } 
            else if (e.target.matches('.option-input')) {
                const optionIndex = Array.from(e.target.closest('.options-container').querySelectorAll('.option-input')).indexOf(e.target);
                if (optionIndex >= 0) {
                    question.options = question.options || [];
                    question.options[optionIndex] = e.target.value;
                    
                    // Update correctAnswer if this option was the correct one
                    const radioInputs = e.target.closest('.question-card').querySelectorAll('input[type="radio"]');
                    radioInputs.forEach((radio, i) => {
                        if (radio.checked) {
                            question.correctAnswer = question.options[i];
                        }
                    });
                }
            }
            else if (e.target.matches('.points')) {
                question.points = parseInt(e.target.value) || 1;
            }
            else if (e.target.matches('.explanation')) {
                question.explanation = e.target.value;
            }
        });

        // Add the new question to the DOM
        questionsContainer.appendChild(questionElement);

        // If this is a new question, add it to the questions array
        if (index === null) {
            questions.push({
                questionText: '',
                options: ['Option 1', 'Option 2'],
                correctAnswer: 'Option 1',
                points: 1,
                explanation: ''
            });
        }
    }

    function updateCorrectAnswerRadios(questionElement) {
        const questionIndex = parseInt(questionElement.dataset.index);
        const question = questions[questionIndex];
        if (!question) return;

        const optionInputs = questionElement.querySelectorAll('.option-input');
        const radioInputs = questionElement.querySelectorAll('input[type="radio"]');
        
        // Update the question's options array
        question.options = Array.from(optionInputs).map(input => input.value);
        
        // Update radio button values and checked state
        radioInputs.forEach((radio, i) => {
            radio.value = i;
            radio.checked = (i < question.options.length && question.correctAnswer === question.options[i]);
        });
        
        // If no option is selected, select the first one
        const checkedRadio = questionElement.querySelector('input[type="radio"]:checked');
        if (!checkedRadio && question.options.length > 0) {
            radioInputs[0].checked = true;
            question.correctAnswer = question.options[0];
        }
    }

    function updateQuestionIndices() {
        const questions = document.querySelectorAll('.question-card');
        questions.forEach((question, index) => {
            question.dataset.index = index;
            question.querySelector('h5').textContent = `Question ${index + 1}`;
            // Update radio button names
            const radioInputs = question.querySelectorAll('input[type="radio"]');
            radioInputs.forEach(radio => {
                radio.name = `correct-${index}`;
            });
        });
    }

    async function handleSubmit(e) {
        e.preventDefault();
        
        // Disable submit button and show loading state
        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Saving...';
        }
        
        // Add a small delay to ensure the UI updates before processing
        await new Promise(resolve => setTimeout(resolve, 100));

        try {
            // Get form values
            const title = quizTitle ? quizTitle.value.trim() : '';
            const description = quizDescription ? quizDescription.value.trim() : 'No description provided';
            
            // Debug subject selection
            const subjectSelect = document.getElementById('quizSubject');
            console.log('Subject select element:', subjectSelect);
            console.log('Available subject options:', subjectSelect ? Array.from(subjectSelect.options).map(o => o.value) : 'No subject select found');
            
            const subject = subjectSelect ? subjectSelect.value : '';
            console.log('Selected subject:', subject);
            const quizClass = document.getElementById('quizClass') ? document.getElementById('quizClass').value : 'General';
            const timeLimitValue = timeLimit ? parseInt(timeLimit.value) || 30 : 30;
            
            // Collect questions data
            const questions = Array.from(document.querySelectorAll('.question-card')).map(q => {
                const questionText = q.querySelector('.question-text')?.value || '';
                const options = Array.from(q.querySelectorAll('.option-input'))
                    .map(opt => opt.value.trim())
                    .filter(opt => opt); // Remove empty options
                
                // Find the correct answer
                let correctAnswerIndex = 0;
                const correctOption = q.querySelector('input[type="radio"]:checked');
                if (correctOption) {
                    correctAnswerIndex = parseInt(correctOption.value);
                }
                
                return {
                    questionText: questionText || 'Untitled question',
                    options: options,
                    correctAnswer: correctAnswerIndex,
                    points: parseInt(q.querySelector('.question-points')?.value) || 1,
                    explanation: q.querySelector('.explanation')?.value || ''
                };
            });
            
            // Basic validation
            if (!title) {
                throw new Error('Please enter a title for the quiz');
            }
            
            if (!subject) {
                throw new Error('Please select a subject');
            }
            
            if (!questions || questions.length === 0) {
                throw new Error('Please add at least one question');
            }
            
            // Validate each question
            const invalidQuestions = questions.filter(q => {
                return !q.questionText || !q.options || q.options.length < 2;
            });
            
            if (invalidQuestions.length > 0) {
                throw new Error('Each question must have a question text and at least 2 options');
            }
            
            // Get user data from token to get teacherId
            const token = localStorage.getItem('token');
            if (!token) {
                throw new Error('Authentication required. Please log in again.');
            }
            
            // Decode the token to get user data (assuming JWT format)
            const tokenPayload = JSON.parse(atob(token.split('.')[1]));
            const teacherId = tokenPayload.userId || tokenPayload.id; // Adjust based on your token structure
            
            if (!teacherId) {
                throw new Error('Could not determine teacher ID. Please log in again.');
            }
            
            // Prepare quiz data object
            const quizData = {
                title,
                description,
                subject,
                class: quizClass, // This will be used as classId in the backend
                questions,
                timeLimit: timeLimitValue,
                passingScore: 60, // Default passing score (60%)
                teacherId
            };
            
            console.log('Sending quiz data:', {
                ...quizData,
                questions: quizData.questions.map(q => ({
                    questionText: q.questionText,
                    options: q.options,
                    correctAnswer: q.correctAnswer,
                    points: q.points,
                    explanation: q.explanation
                }))
            });
            
            // Log each question's structure
            quizData.questions.forEach((q, i) => {
                console.log(`Question ${i + 1}:`, {
                    hasText: !!q.questionText,
                    optionsCount: q.options?.length || 0,
                    hasCorrectAnswer: q.correctAnswer !== undefined && q.correctAnswer !== null,
                    points: q.points,
                    explanation: q.explanation
                });
            });
            
            // Determine if we're creating or updating
            const isUpdate = quizId && quizId.value;
            const method = isUpdate ? 'PUT' : 'POST';
            const url = isUpdate ? `${API_BASE_URL}/quizzes/${quizId.value}` : `${API_BASE_URL}/quizzes/create`;
            
            let response;
            let data;
            
            try {
                console.log(`Sending ${method} request to ${url}`, {
                    method,
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify(quizData, null, 2)
                });
                
                // Clone the request to log it
                const request = new Request(url, {
                    method,
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify(quizData, null, 2)
                });
                
                // Log the request details
                console.log('Request details:', {
                    url: request.url,
                    method: request.method,
                    headers: Object.fromEntries(request.headers.entries()),
                    body: await request.clone().text()
                });
                
                response = await fetch(request).catch(fetchError => {
                    console.error('Fetch error:', fetchError);
                    showNotification('Network error. Please check your connection and try again.', 'error');
                    throw fetchError;
                });
                
                // Parse the response as JSON
                data = await response.json().catch(() => ({}));
                
                if (!response.ok) {
                    console.error('Server error response:', { status: response.status, statusText: response.statusText, data });
                    
                    let errorMessage = 'Error creating quiz';
                    
                    // Handle different error response formats
                    if (data) {
                        if (Array.isArray(data.errors)) {
                            errorMessage = data.errors.join('\n');
                        } else if (data.error) {
                            if (Array.isArray(data.error.details)) {
                                errorMessage = data.error.details.join('\n');
                            } else if (data.error.message) {
                                errorMessage = data.error.message;
                            } else if (typeof data.error === 'string') {
                                errorMessage = data.error;
                            }
                        } else if (data.message) {
                            errorMessage = data.message;
                        } else if (typeof data === 'string') {
                            errorMessage = data;
                        } else if (typeof data === 'object') {
                            errorMessage = JSON.stringify(data, null, 2);
                        }
                    }
                    
                    // Show the error to the user
                    showNotification(`Failed to save quiz:\n${errorMessage}`, 'error');
                    throw new Error(errorMessage);
                }
                
                // Show success message
                showNotification(`Quiz ${isUpdate ? 'updated' : 'created'} successfully!`, 'success');
                
                // Close modal and refresh quiz list
                closeModalFunc();
                loadQuizzes();
                
            } catch (error) {
                console.error('Error details:', {
                    name: error.name,
                    message: error.message,
                    stack: error.stack,
                    response: response ? {
                        status: response.status,
                        statusText: response.statusText,
                        data: data
                    } : 'No response'
                });
                throw error;
            }
            
        } catch (error) {
            console.error('Error saving quiz:', error);
            
            // Show detailed error message to user
            let errorMessage = 'Failed to save quiz. ';
            if (error.message.includes('NetworkError')) {
                errorMessage += 'Unable to connect to the server. Please check your internet connection.';
            } else if (error.message.includes('401')) {
                errorMessage = 'Session expired. Please log in again.';
                // Redirect to login or refresh token
                window.location.href = '/login.html';
                return;
            } else {
                errorMessage += error.message || 'Please check your input and try again.';
            }
            
            alert(errorMessage);
            
        } finally {
            // Re-enable submit button
            if (submitBtn) {
                const isUpdate = quizId && quizId.value;
                submitBtn.disabled = false;
                submitBtn.innerHTML = isUpdate ? 'Update Quiz' : 'Create Quiz';
            }
        }
    }

    async function loadQuizzes() {
        try {
            console.log('Starting to load quizzes...');
            quizzesList.innerHTML = '<div class="loading">Loading quizzes...</div>';
            
            // Get user role and class
            const userRole = localStorage.getItem('role');
            const userData = JSON.parse(localStorage.getItem('userData') || '{}');
            const userClass = userData.class || '';
            const token = localStorage.getItem('token');
            
            console.log('User info:', { userRole, userClass, userData });
            
            if (!token) {
                throw new Error('No authentication token found. Please log in again.');
            }

            // Use the API_BASE_URL constant if available, otherwise default to port 5000
            const API_BASE_URL = window.API_BASE_URL || 'http://localhost:5000';
            console.log('Using API base URL:', API_BASE_URL);
            
            const headers = {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json'
            };

            let response;
            let endpoint;
            
            if (userRole === 'student') {
                // For students, only fetch quizzes for their class
                endpoint = `${API_BASE_URL}/api/quizzes/class/${encodeURIComponent(userClass)}`;
                console.log('Fetching quizzes for student from:', endpoint);
                response = await fetch(endpoint, {
                    headers,
                    credentials: 'include'
                });
            } else {
                // For teachers/admins, fetch all quizzes
                endpoint = `${API_BASE_URL}/api/quizzes/all`;
                console.log('Fetching all quizzes from:', endpoint);
                response = await fetch(endpoint, {
                    headers,
                    credentials: 'include'
                });
            }
            
            if (!response.ok) {
                console.error(`Error response from server: ${response.status} ${response.statusText}`);
                
                // Try to get the error message from the response
                let errorMessage = `HTTP error! status: ${response.status}`;
                try {
                    const errorData = await response.json().catch(() => ({}));
                    console.error('Error response data:', errorData);
                    if (errorData.message) {
                        errorMessage = errorData.message;
                    } else if (errorData.error) {
                        errorMessage = errorData.error;
                    }
                } catch (e) {
                    console.error('Error parsing error response:', e);
                }
                
                if (response.status === 401) {
                    console.log('Token might be expired, trying to refresh...');
                    // Token might be expired, try to refresh it
                    try {
                        const refreshResponse = await fetch(`${API_BASE_URL}/api/auth/refresh-token`, {
                            method: 'POST',
                            credentials: 'include'
                        });
                        
                        if (refreshResponse.ok) {
                            const refreshData = await refreshResponse.json();
                            console.log('Token refresh successful');
                            const newToken = refreshData.token;
                            localStorage.setItem('token', newToken);
                            // Retry the request with the new token
                            headers.Authorization = `Bearer ${newToken}`;
                            response = await fetch(endpoint, { 
                                headers,
                                credentials: 'include' 
                            });
                            
                            if (!response.ok) {
                                throw new Error(`Failed after token refresh: ${response.status} ${response.statusText}`);
                            }
                        } else {
                            throw new Error('Session expired. Please log in again.');
                        }
                    } catch (refreshError) {
                        console.error('Error refreshing token:', refreshError);
                        throw new Error('Session expired. Please log in again.');
                    }
                } else {
                    throw new Error(errorMessage);
                }
            }
            
            const contentType = response.headers.get('content-type');
            if (!contentType || !contentType.includes('application/json')) {
                const text = await response.text();
                console.error('Expected JSON but got:', text);
                throw new Error('Received non-JSON response from server');
            }
            
            const responseData = await response.json();
            console.log('API Response:', responseData);
            
            // Handle the response format: { success: true, data: [...] }
            let quizzes = [];
            if (responseData && responseData.success !== undefined) {
                if (responseData.success && Array.isArray(responseData.data)) {
                    quizzes = responseData.data;
                } else {
                    console.error('API returned unsuccessful response:', responseData);
                    throw new Error(responseData.message || 'Failed to load quizzes');
                }
            } else if (Array.isArray(responseData)) {
                // Handle case where API returns array directly (backwards compatibility)
                quizzes = responseData;
            } else {
                console.error('Unexpected API response format:', responseData);
                throw new Error('Invalid response format from server');
            }
            
            console.log('Extracted quizzes:', quizzes);
            
            // Additional client-side filtering as a fallback
            if (userRole === 'student') {
                quizzes = quizzes.filter(quiz => !quiz.class || quiz.class === userClass);
            }
            
            displayQuizzes(quizzes);
        } catch (error) {
            console.error('Error loading quizzes:', error);
            const errorMessage = error.message || 'Failed to load quizzes. Please try again later.';
            quizzesList.innerHTML = `
                <div class="error">
                    <p>${errorMessage}</p>
                    <button onclick="location.reload()" class="btn btn-primary">Retry</button>
                </div>
            `;
        }
    }

    function displayQuizzes(quizzes) {
        console.log('Displaying quizzes:', quizzes);
        
        if (!quizzes) {
            console.error('Quizzes data is null or undefined');
            quizzesList.innerHTML = `
                <div class="error">
                    <p>Error: No quiz data received from the server</p>
                    <button onclick="location.reload()" class="btn btn-primary">Retry</button>
                </div>
            `;
            return;
        }
        
        // Ensure quizzes is an array
        if (!Array.isArray(quizzes)) {
            console.error('Expected quizzes to be an array but got:', typeof quizzes, quizzes);
            quizzesList.innerHTML = `
                <div class="error">
                    <p>Error: Invalid quiz data format received</p>
                    <p>Please check the console for more details</p>
                    <button onclick="location.reload()" class="btn btn-primary">Retry</button>
                </div>
            `;
            return;
        }
        
        if (quizzes.length === 0) {
            console.log('No quizzes found for this user');
            quizzesList.innerHTML = `
                <div class="no-quizzes">
                    <i class="fas fa-inbox" style="font-size: 48px; opacity: 0.7; margin-bottom: 15px;"></i>
                    <h3>No quizzes found</h3>
                    <p>Get started by creating your first quiz</p>
                    <button class="btn btn-primary" id="createFirstQuiz">
                        <i class="fas fa-plus"></i> Create New Quiz
                    </button>
                </div>
            `;
            
            document.getElementById('createFirstQuiz')?.addEventListener('click', () => openModal());
            return;
        }
        
        quizzesList.innerHTML = `
            <div class="quizzes-grid">
                ${quizzes.map(quiz => `
                    <div class="quiz-card" data-id="${quiz._id}">
                        <div class="quiz-card-header">
                            <h3>${quiz.title || 'Untitled Quiz'}</h3>
                            <span class="status-badge ${quiz.isPublished ? 'status-published' : 'status-draft'}">
                                <i class="fas ${quiz.isPublished ? 'fa-check-circle' : 'fa-pen'}"></i>
                                ${quiz.isPublished ? 'Published' : 'Draft'}
                            </span>
                        </div>
                        <div class="quiz-card-body">
                            <div class="quiz-meta">
                                <span class="meta-item">
                                    <i class="fas fa-question-circle"></i>
                                    ${quiz.questions?.length || 0} Questions
                                </span>
                                ${quiz.timeLimit ? `
                                <span class="meta-item">
                                    <i class="fas fa-clock"></i>
                                    ${quiz.timeLimit} min
                                </span>` : ''}
                            </div>
                            <div class="quiz-actions">
                                ${quiz.isPublished ? `
                                    <a href="../pages/take-quiz.html?id=${quiz._id}" class="btn btn-sm btn-primary take-quiz" title="Take Quiz">
                                        <i class="fas fa-play"></i>
                                    </a>
                                ` : ''}
                                <button class="btn btn-sm btn-edit edit-quiz" data-id="${quiz._id}" title="Edit Quiz">
                                    <i class="fas fa-edit"></i>
                                </button>
                                <button class="btn btn-sm btn-danger delete-quiz" data-id="${quiz._id}" title="Delete Quiz">
                                    <i class="fas fa-trash"></i>
                                </button>
                                ${quiz.isPublished ? `
                                <button class="btn btn-sm btn-info view-submissions" data-id="${quiz._id}" title="View Submissions">
                                    <i class="fas fa-users"></i>
                                </button>` : ''}
                                <button class="btn btn-sm ${quiz.isPublished ? 'btn-secondary' : 'btn-success'} toggle-publish" 
                                        data-id="${quiz._id}" data-published="${quiz.isPublished}"
                                        title="${quiz.isPublished ? 'Unpublish' : 'Publish'}">
                                    <i class="fas ${quiz.isPublished ? 'fa-eye-slash' : 'fa-eye'}"></i>
                                </button>
                            </div>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
        
        // Add event listeners for action buttons
        document.querySelectorAll('.edit-quiz').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const quizId = e.target.closest('button').dataset.id;
                try {
                    const response = await fetch(`${API_BASE_URL}/quizzes/${quizId}`);
                    if (!response.ok) throw new Error('Failed to fetch quiz');
                    const quiz = await response.json();
                    openModal(quiz);
                } catch (error) {
                    console.error('Error fetching quiz:', error);
                    showNotification('Failed to load quiz. Please try again.', 'error');
                }
            });
        });
        
        document.querySelectorAll('.delete-quiz').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                if (confirm('Are you sure you want to delete this quiz? This action cannot be undone.')) {
                    const quizId = e.target.closest('button').dataset.id;
                    
                    // Get the JWT token from localStorage
                    const token = localStorage.getItem('token');
                    if (!token) {
                        showNotification('Authentication required. Please log in again.', 'error');
                        window.location.href = '/login.html';
                        return;
                    }
                    
                    try {
                        const response = await fetch(`${API_BASE_URL}/quizzes/${quizId}`, { 
                            method: 'DELETE',
                            headers: { 
                                'Content-Type': 'application/json',
                                'Authorization': `Bearer ${token}`
                            }
                        });
                        
                        if (!response.ok) {
                            const errorData = await response.json().catch(() => ({}));
                            throw new Error(errorData.message || 'Failed to delete quiz');
                        }
                        
                        showNotification('Quiz deleted successfully', 'success');
                        loadQuizzes();
                    } catch (error) {
                        console.error('Error deleting quiz:', error);
                        showNotification(error.message || 'Failed to delete quiz. Please try again.', 'error');
                    }
                }
            });
        });
        
        document.querySelectorAll('.toggle-publish').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const button = e.target.closest('button');
                const quizId = button.dataset.id;
                const isPublished = button.dataset.published === 'true';
                const newPublishStatus = !isPublished;
                
                // Show loading state
                const originalText = button.innerHTML;
                button.disabled = true;
                button.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
                
                try {
                    // Get the JWT token from localStorage
                    const token = localStorage.getItem('token');
                    if (!token) {
                        showNotification('Authentication required. Please log in again.', 'error');
                        window.location.href = '/login.html';
                        return;
                    }

                    console.log(`Updating quiz ${quizId} publish status to:`, newPublishStatus);
                    
                    // Use the correct endpoint for publishing/unpublishing quizzes
                    const baseUrl = API_BASE_URL.endsWith('/api') ? API_BASE_URL : `${API_BASE_URL}/api`;
                    console.log('Using base URL:', baseUrl);
                    
                    // The correct URL is /api/quizzes/publish/:id
                    const response = await fetch(`${baseUrl}/quizzes/publish/${quizId}`, {
                        method: 'PATCH',
                        headers: { 
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${token}`
                        },
                        credentials: 'include',
                        body: JSON.stringify({ isPublished: newPublishStatus })
                    });
                    
                    if (!response.ok) {
                        const errorData = await response.json().catch(() => ({}));
                        console.error('Error response:', errorData);
                        throw new Error(errorData.message || 'Failed to update quiz status');
                    }
                    
                    const result = await response.json();
                    console.log('Update successful:', result);
                    
                    showNotification(
                        newPublishStatus ? 'Quiz published successfully!' : 'Quiz unpublished.',
                        'success'
                    );
                    
                    // Reload the quizzes list to reflect the changes
                    loadQuizzes();
                } catch (error) {
                    console.error('Error updating quiz status:', error);
                    showNotification(
                        error.message || 'Failed to update quiz status. Please try again.',
                        'error'
                    );
                    // Reset button state on error
                    button.disabled = false;
                    button.innerHTML = originalText;
                }
            });
        });
    }
});
