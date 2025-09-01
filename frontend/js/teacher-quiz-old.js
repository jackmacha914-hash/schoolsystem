// Teacher Quiz Creation and Management
document.addEventListener('DOMContentLoaded', function() {
    // Check authentication
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = 'login.html';
        return;
    }
    
    // DOM Elements
    const questionsContainer = document.getElementById('questionsContainer');
    const addQuestionBtn = document.getElementById('addQuestionBtn');
    const saveDraftBtn = document.getElementById('saveDraftBtn');
    const publishBtn = document.getElementById('publishBtn');
    const quizForm = document.getElementById('quizForm');
    const noQuestionsMessage = document.getElementById('noQuestionsMessage');
    
    // State
    let questionCount = 0;
    
    // Event Listeners
    addQuestionBtn.addEventListener('click', addQuestion);
    saveDraftBtn.addEventListener('click', (e) => {
        e.preventDefault();
        saveQuiz(false);
    });
    publishBtn.addEventListener('click', (e) => {
        e.preventDefault();
        saveQuiz(true);
    });
    
    // Initialize the page
    init();
    
    /**
     * Initialize the quiz form
     */
    function init() {
        // Set minimum date for due date (today)
        const today = new Date();
        const todayString = today.toISOString().slice(0, 16);
        document.getElementById('dueDate').min = todayString;
        
        // Set default due date to tomorrow
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        document.getElementById('dueDate').value = tomorrow.toISOString().slice(0, 16);
        
        // Add first question by default
        addQuestion();
        
        // Load quiz data if editing
        const urlParams = new URLSearchParams(window.location.search);
        const quizId = urlParams.get('id');
        if (quizId) {
            loadQuiz(quizId);
        }
    }
    
    /**
     * Add a new question to the quiz
     */
    function addQuestion(questionData = null) {
        questionCount++;
        const questionId = questionCount;
        
        const questionCard = document.createElement('div');
        questionCard.className = 'question-card card mb-4';
        questionCard.dataset.questionId = questionId;
        
        questionCard.innerHTML = `
            <div class="card-header d-flex justify-content-between align-items-center">
                <h5 class="mb-0">
                    <span class="badge bg-secondary me-2">${questionId}</span>
                    Question
                </h5>
                <button type="button" class="btn btn-sm btn-outline-danger" onclick="removeQuestion(this)">
                    <i class="fas fa-trash"></i> Remove
                </button>
            </div>
            <div class="card-body">
                <div class="mb-3">
                    <label for="question-${questionId}" class="form-label">Question Text</label>
                    <input type="text" class="form-control question-text" id="question-${questionId}" 
                           placeholder="Enter the question" required 
                           value="${questionData?.questionText || ''}">
                </div>
                <div class="options-container">
                    ${questionData?.options ? questionData.options.map((option, idx) => `
                        <div class="option-item d-flex align-items-center mb-2">
                            <div class="form-check me-2">
                                <input class="form-check-input option-correct" type="radio" 
                                       name="correct-${questionId}" 
                                       value="${idx}" 
                                       ${idx === questionData.correctAnswer ? 'checked' : ''}
                                       required>
                            </div>
                            <input type="text" class="form-control option-text" 
                                   placeholder="Option ${idx + 1}" 
                                   value="${option}" required>
                            <button type="button" class="btn btn-sm btn-outline-danger ms-2 remove-option" 
                                    onclick="this.closest('.option-item').remove()">
                                <i class="fas fa-times"></i>
                            </button>
                        </div>
                    `).join('') : ''}
                </div>
                <button type="button" class="btn btn-sm btn-outline-primary mt-2" 
                        onclick="addOption(this)">
                    <i class="fas fa-plus"></i> Add Option
                </button>
            </div>
        `;
        
        questionsContainer.appendChild(questionCard);
        noQuestionsMessage.style.display = 'none';
        
        // If no question data provided, add two default options
        if (!questionData) {
            const addOptionBtn = questionCard.querySelector('.btn-outline-primary');
            addOption(addOptionBtn);
            addOption(addOptionBtn);
        }
    }
    
    /**
     * Load quiz data for editing
     */
    async function loadQuiz(quizId) {
        try {
            const response = await fetch(`/api/quizzes/${quizId}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            if (!response.ok) {
                throw new Error('Failed to load quiz');
            }
            
            const quizData = await response.json();
            
            // Populate quiz details
            document.getElementById('quizTitle').value = quizData.title || '';
            document.getElementById('quizDescription').value = quizData.description || '';
            document.getElementById('timeLimit').value = quizData.timeLimit || 30;
            
            if (quizData.dueDate) {
                const dueDate = new Date(quizData.dueDate).toISOString().slice(0, 16);
                document.getElementById('dueDate').value = dueDate;
            }
            
            // Clear existing questions
            questionsContainer.innerHTML = '';
            
            // Add questions
            if (quizData.questions && quizData.questions.length > 0) {
                quizData.questions.forEach(question => {
                    addQuestion(question);
                });
            } else {
                addQuestion();
            }
            
            // Update UI based on published status
            if (quizData.isPublished) {
                publishBtn.disabled = true;
                publishBtn.textContent = 'Published';
                document.querySelector('h1').textContent = 'Edit Quiz';
            }
            
        } catch (error) {
            console.error('Error loading quiz:', error);
            showAlert('Failed to load quiz. Please try again.', 'danger');
        }
    }
    
    /**
     * Save or publish the quiz
     */
    async function saveQuiz(publish = false) {
        // Validate form
        if (!quizForm.checkValidity()) {
            quizForm.classList.add('was-validated');
            return;
        }

        // Get quiz data
        const quizData = {
            title: document.getElementById('quizTitle').value.trim(),
            description: document.getElementById('quizDescription').value.trim(),
            timeLimit: parseInt(document.getElementById('timeLimit').value) || 30,
            dueDate: document.getElementById('dueDate').value,
            isPublished: publish,
            questions: []
        };

        // Validate required fields
        if (!quizData.title) {
            showAlert('Please enter a quiz title', 'danger');
            return;
        }

        // Get questions data
        const questionCards = document.querySelectorAll('.question-card');
        if (questionCards.length === 0) {
            showAlert('Please add at least one question', 'danger');
            return;
        }

        let isValid = true;
        
        questionCards.forEach((card, index) => {
            const questionText = card.querySelector('.question-text').value.trim();
            const options = [];
            let correctAnswer = 0;
            let hasOptions = false;
            
            // Get all option inputs
            const optionInputs = card.querySelectorAll('.option-text');
            optionInputs.forEach((input, i) => {
                const optionText = input.value.trim();
                if (optionText) {
                    options.push(optionText);
                    hasOptions = true;
                    
                    // Check if this option is marked as correct
                    const radio = input.previousElementSibling?.querySelector('input[type="radio"]');
                    if (radio?.checked) {
                        correctAnswer = i;
                    }
                }
            });
            
            // Validate question
            if (!questionText) {
                showAlert(`Question ${index + 1} is missing text`, 'danger');
                isValid = false;
                return;
            }
            
            if (!hasOptions) {
                showAlert(`Question ${index + 1} must have at least one option`, 'danger');
                isValid = false;
                return;
            }
            
            if (options.length < 2) {
                showAlert(`Question ${index + 1} must have at least two options`, 'danger');
                isValid = false;
                return;
            }
            
            // Add question to quiz data
            quizData.questions.push({
                questionText,
                options,
                correctAnswer
            });
        });
        
        if (!isValid) return;

        try {
            // Show loading state
            const originalSaveText = saveDraftBtn.innerHTML;
            const originalPublishText = publishBtn.innerHTML;
            
            saveDraftBtn.disabled = true;
            publishBtn.disabled = true;
            saveDraftBtn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Saving...';
            publishBtn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Publishing...';
            
            // Determine if we're creating a new quiz or updating an existing one
            const urlParams = new URLSearchParams(window.location.search);
            const quizId = urlParams.get('id');
            const method = quizId ? 'PUT' : 'POST';
            const url = quizId ? `/api/quizzes/${quizId}` : '/api/quizzes';

            // Send the request to the server
            const response = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(quizData)
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || 'Failed to save quiz');
            }

            const result = await response.json();
            
            // Show success message
            showAlert(
                publish ? 'Quiz published successfully!' : 'Quiz saved as draft.',
                'success'
            );
            
            // If this was a new quiz, update the URL with the quiz ID
            if (!quizId && result.quiz && result.quiz._id) {
                const newUrl = new URL(window.location);
                newUrl.searchParams.set('id', result.quiz._id);
                window.history.pushState({}, '', newUrl);
            }
            
            // If published, update the UI
            if (publish) {
                publishBtn.disabled = true;
                publishBtn.textContent = 'Published';
                document.querySelector('h1').textContent = 'Edit Quiz';
            }
            
        } catch (error) {
            console.error('Error saving quiz:', error);
            showAlert(
                error.message || 'Failed to save quiz. Please try again.',
                'danger'
            );
        } finally {
            // Reset button states
            saveDraftBtn.disabled = false;
            publishBtn.disabled = publish;
            saveDraftBtn.innerHTML = originalSaveText;
            publishBtn.innerHTML = publish ? 'Published' : originalPublishText;
        }
    }
    
    /**
     * Show an alert message
     */
    function showAlert(message, type = 'info') {
        const alertDiv = document.createElement('div');
        alertDiv.className = `alert alert-${type} alert-dismissible fade show`;
        alertDiv.role = 'alert';
        alertDiv.innerHTML = `
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
        `;
        
        const container = document.querySelector('.container');
        container.insertBefore(alertDiv, container.firstChild);
        
        // Auto-dismiss after 5 seconds
        setTimeout(() => {
            const alert = bootstrap.Alert.getOrCreateInstance(alertDiv);
            alert.close();
        }, 5000);
    }
});

// Make these functions globally available
window.addOption = function(button) {
    const questionCard = button.closest('.question-card');
    const optionsContainer = questionCard.querySelector('.options-container');
    const optionIndex = optionsContainer.children.length;
    
    const optionDiv = document.createElement('div');
    optionDiv.className = 'option-item d-flex align-items-center mb-2';
    optionDiv.innerHTML = `
        <div class="form-check me-2">
            <input class="form-check-input option-correct" type="radio" 
                   name="correct-${questionCard.dataset.questionId}" 
                   value="${optionIndex}" 
                   required>
        </div>
        <input type="text" class="form-control option-text" 
               placeholder="Option ${optionIndex + 1}" required>
        <button type="button" class="btn btn-sm btn-outline-danger ms-2 remove-option" 
                onclick="this.closest('.option-item').remove()">
            <i class="fas fa-times"></i>
        </button>
    `;
    optionsContainer.appendChild(optionDiv);
};

window.removeQuestion = function(button) {
    if (confirm('Are you sure you want to remove this question?')) {
        const questionCard = button.closest('.question-card');
        questionCard.remove();
        
        // Update question numbers
        const questions = document.querySelectorAll('.question-card');
        questions.forEach((card, index) => {
            const questionNumber = index + 1;
            card.dataset.questionId = questionNumber;
            card.querySelector('.badge').textContent = questionNumber;
            
            // Update radio button names
            const radioButtons = card.querySelectorAll('.option-correct');
            radioButtons.forEach(radio => {
                radio.name = `correct-${questionNumber}`;
            });
        });
        
        // Show no questions message if no questions left
        if (questions.length === 0) {
            document.getElementById('noQuestionsMessage').style.display = 'block';
        }
    }
};
    // Check authentication
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = 'login.html';
        return;
    }
    
    // DOM Elements
    const questionsContainer = document.getElementById('questionsContainer');
    const addQuestionBtn = document.getElementById('addQuestionBtn');
    const saveDraftBtn = document.getElementById('saveDraftBtn');
    const publishBtn = document.getElementById('publishBtn');
    const quizForm = document.getElementById('quizForm');
    const noQuestionsMessage = document.getElementById('noQuestionsMessage');
    
    // State
    let questionCount = 0;
    
    // Event Listeners
    addQuestionBtn.addEventListener('click', addQuestion);
    saveDraftBtn.addEventListener('click', (e) => {
        e.preventDefault();
        saveQuiz(false);
    });
    publishBtn.addEventListener('click', (e) => {
        e.preventDefault();
        saveQuiz(true);
    });
    
    // Initialize the page
    init();
    
    /**
     * Initialize the quiz form
     */
    function init() {
        // Set minimum date for due date (today)
        const today = new Date();
        const todayString = today.toISOString().slice(0, 16);
        document.getElementById('dueDate').min = todayString;
        
        // Set default due date to tomorrow
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        document.getElementById('dueDate').value = tomorrow.toISOString().slice(0, 16);
        
        // Add first question by default
        addQuestion();
        
        // Load quiz data if editing
        const urlParams = new URLSearchParams(window.location.search);
        const quizId = urlParams.get('id');
        if (quizId) {
            loadQuiz(quizId);
        }
    }
    // Check authentication
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = 'login.html';
        return;
    }
    
    // DOM Elements
    const questionsContainer = document.getElementById('questionsContainer');
    const addQuestionBtn = document.getElementById('addQuestionBtn');
    const saveDraftBtn = document.getElementById('saveDraftBtn');
    const publishBtn = document.getElementById('publishBtn');
    const quizForm = document.getElementById('quizForm');
    const noQuestionsMessage = document.getElementById('noQuestionsMessage');
    
    let questionCount = 0;
    
    // Event Listeners
    addQuestionBtn.addEventListener('click', addQuestion);
    saveDraftBtn.addEventListener('click', (e) => {
        e.preventDefault();
        saveQuiz(false);
    });
    publishBtn.addEventListener('click', (e) => {
        e.preventDefault();
        saveQuiz(true);
    });
    
    // Initialize the page
    init();
    
    // Initialize the quiz form
    function init() {
        // Set minimum date for due date (today)
        const today = new Date();
        const todayString = today.toISOString().slice(0, 16);
        document.getElementById('dueDate').min = todayString;
        
        // Set default due date to tomorrow
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        document.getElementById('dueDate').value = tomorrow.toISOString().slice(0, 16);
        
        // Add first question by default
        addQuestion();
        
        // Load quiz data if editing
        const urlParams = new URLSearchParams(window.location.search);
        const quizId = urlParams.get('id');
        if (quizId) {
            loadQuiz(quizId);
        }
    }
    const quizForm = document.getElementById('quizForm');
    
    // State
    let questionCount = 0;
    
    // Initialize the page
    init();
    
    // Event Listeners
    addQuestionBtn.addEventListener('click', addQuestion);
    saveDraftBtn.addEventListener('click', (e) => {
        e.preventDefault();
        saveQuiz(false);
    });
    publishBtn.addEventListener('click', (e) => {
        e.preventDefault();
        saveQuiz(true);
    });
    
    // Initialize the page
    async function init() {
        // Set minimum date for due date (today)
        const today = new Date().toISOString().slice(0, 16);
        document.getElementById('dueDate').min = today;
        document.getElementById('dueDate').value = today;
        
        // Add first question by default
        addQuestion();
        
        // Load quiz data if editing
        const urlParams = new URLSearchParams(window.location.search);
        const quizId = urlParams.get('id');
        if (quizId) {
            loadQuiz(quizId);
        }
    }
    

    
    // Update question type and show/hide relevant options
    window.updateQuestionType = function(selectElement) {
        const questionCard = selectElement.closest('.question-card');
        const optionsContainer = questionCard.querySelector('.options-container');
        const addOptionBtn = questionCard.querySelector('.add-option');
        
        // Clear existing options
        optionsContainer.innerHTML = '';
        
        switch(selectElement.value) {
            case 'multiple_choice':
                addOptionBtn.style.display = 'inline-block';
                // Add 2 empty options by default
                addOption(questionCard);
                addOption(questionCard);
                break;
                
            case 'true_false':
                addOptionBtn.style.display = 'none';
                // Add True/False options
                addOption(questionCard, 'True', true);
                addOption(questionCard, 'False', false);
                break;
                
            case 'short_answer':
                addOptionBtn.style.display = 'none';
                // Add short answer input
                const answerInput = document.createElement('div');
                answerInput.className = 'mb-3';
                answerInput.innerHTML = `
                    <label class="form-label">Correct Answer</label>
                    <input type="text" class="form-control correct-answer" required>
                `;
                optionsContainer.appendChild(answerInput);
                break;
        }
    };

    // Add a new question to the quiz
    function addQuestion() {
        questionCount++;
        const template = document.getElementById('questionTemplate');
        const questionElement = template.content.cloneNode(true);
        
        // Update question number
        const questionIndex = questionElement.querySelector('.question-index');
        questionIndex.textContent = questionCount;
        
        // Add delete question handler
        const deleteBtn = questionElement.querySelector('.delete-question');
        deleteBtn.addEventListener('click', function() {
            if (confirm('Are you sure you want to delete this question?')) {
                this.closest('.question-card').remove();
                updateQuestionNumbers();
            }
        });
        
        // Add to container
        questionsContainer.appendChild(questionElement);
        
        // Initialize options for the new question
        const questionCard = questionsContainer.lastElementChild;
        const questionType = questionCard.querySelector('.question-type');
        updateQuestionType(questionType);
        
        // Add option button handler
        const addOptionBtn = questionCard.querySelector('.add-option');
        addOptionBtn.addEventListener('click', () => addOption(questionCard));
        
        // Add initial options
        addOption(questionCard);
        addOption(questionCard);
    }
    
    // Update the question type and show/hide relevant options
    window.updateQuestionType = function(selectElement) {
        const questionCard = selectElement.closest('.question-card');
        const optionsContainer = questionCard.querySelector('.options-container');
        const addOptionBtn = questionCard.querySelector('.add-option');
        
        // Clear existing options
        optionsContainer.innerHTML = '';
        
        switch(selectElement.value) {
            case 'multiple_choice':
                addOptionBtn.style.display = 'inline-block';
                // Add 2 empty options by default
                addOption(questionCard);
                addOption(questionCard);
                break;
                
            case 'true_false':
                addOptionBtn.style.display = 'none';
                // Add True/False options
                addOption(questionCard, 'True', true);
                addOption(questionCard, 'False', false);
                break;
                
            case 'short_answer':
                addOptionBtn.style.display = 'none';
                // Add short answer input
                const answerInput = document.createElement('div');
                answerInput.className = 'mb-3';
                answerInput.innerHTML = `
                    <label class="form-label">Correct Answer</label>
                    <input type="text" class="form-control correct-answer" required>
        }
        
        return questionCard;
    }

    // Add an option to a question
    function addOption(addOptionBtn, text = '', isCorrect = false) {
        const questionCard = addOptionBtn.closest('.question-card');
        const optionsContainer = questionCard.querySelector('.options-container');
        const questionType = questionCard.querySelector('.question-type').value;
        
        if (questionType === 'multiple_choice') {
            const optionId = `option-${Date.now()}`;
            const optionElement = document.createElement('div');
            optionElement.className = 'option-item d-flex align-items-center mb-2';
            optionElement.innerHTML = `
                <div class="form-check me-2">
                    <input class="form-check-input option-correct" type="radio" 
                           name="correct-${questionCard.dataset.questionId}" 
                           value="${optionsContainer.children.length}" 
                           ${isCorrect ? 'checked' : ''}
                           required>
                </div>
                <input type="text" class="form-control option-text" 
                       placeholder="Option ${optionsContainer.children.length + 1}" 
                       value="${text}" required>
                <button type="button" class="btn btn-sm btn-outline-danger ms-2 remove-option" 
                        onclick="this.closest('.option-item').remove()">
                    <i class="fas fa-times"></i>
                </button>
            `;
            
            optionsContainer.appendChild(optionElement);
        }
    }
    
    // Update question numbers when a question is deleted
    function updateQuestionNumbers() {
        const questions = document.querySelectorAll('.question-card');
        questions.forEach((question, index) => {
            question.querySelector('.question-index').textContent = index + 1;
        });
        questionCount = questions.length;
    }
    
    // Load quiz data for editing
    async function loadQuiz(quizId) {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`/api/quizzes/${quizId}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            if (!response.ok) {
                throw new Error('Failed to load quiz');
            }
            
            const quizData = await response.json();
            
            // Populate quiz details
            document.getElementById('quizTitle').value = quizData.title || '';
            document.getElementById('quizDescription').value = quizData.description || '';
            document.getElementById('timeLimit').value = quizData.timeLimit || 30;
            
            if (quizData.dueDate) {
                const dueDate = new Date(quizData.dueDate).toISOString().slice(0, 16);
                document.getElementById('dueDate').value = dueDate;
            }
            
            // Clear existing questions
            questionsContainer.innerHTML = '';
            
            // Add questions
            if (quizData.questions && quizData.questions.length > 0) {
                quizData.questions.forEach(question => {
                    addQuestion(question);
                });
            } else {
                addQuestion();
            }
            
            // Update UI based on published status
            if (quizData.isPublished) {
                publishBtn.disabled = true;
                publishBtn.textContent = 'Published';
                document.querySelector('h1').textContent = 'Edit Quiz';
            }
            
        } catch (error) {
            console.error('Error loading quiz:', error);
            showAlert('Failed to load quiz. Please try again.', 'danger');
        }
    }
    
    // Save or publish the quiz
    async function saveQuiz(publish = false) {
        // Validate form
        if (!quizForm.checkValidity()) {
            quizForm.classList.add('was-validated');
            return;
        }

        // Get quiz data
                    showAlert(`Please select a correct answer for question ${index + 1}`, 'warning');
                    isValid = false;
                    return;
                }
                
                question.options = options;
            }
            
            questions.push(question);
        });
        
        if (!isValid || questions.length === 0) {
            if (questions.length === 0) {
                showAlert('Please add at least one question', 'warning');
            }
            return;
        }
        
        // Get the current user's ID from localStorage or session
        const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
        const teacherId = currentUser._id || '60d21b4667d0d8992e610c85'; // Fallback for testing
        
        // Transform questions to match the Quiz model
        const transformedQuestions = questions.map(question => {
            if (question.questionType === 'multiple_choice') {
                // For multiple choice, options should be an array of strings
                // and correctAnswer should be the selected option text
                const options = question.options.map(opt => opt.text);
                const correctOption = question.options.find(opt => opt.isCorrect);
                return {
                    questionText: question.questionText,
                    options: options,
                    correctAnswer: correctOption ? correctOption.text : ''
                };
            } else {
                // For short answer, just pass through the correctAnswer
                return {
                    questionText: question.questionText,
                    options: [],
                    correctAnswer: question.correctAnswer || ''
                };
            }
        });
        
        // Prepare quiz data
        const quizData = {
            title: document.getElementById('quizTitle').value.trim(),
            teacherId: teacherId, // Add the teacherId
            questions: transformedQuestions, // Use the transformed questions
            timeLimit: parseInt(document.getElementById('timeLimit').value) || 30,
            isPublished: publish,
            // Optional fields
            description: document.getElementById('quizDescription').value.trim() || undefined,
            className: document.getElementById('className').value.trim() || undefined,
            subject: document.getElementById('subject').value.trim() || undefined,
            dueDate: document.getElementById('dueDate').value || undefined
        };
        
        try {
            console.log('Sending quiz data:', quizData);
            const response = await fetch('http://localhost:5000/api/quizzes/create', {
                method: 'POST',
                mode: 'cors',
                credentials: 'same-origin',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token') || 'test-token'}`,
                    'Accept': 'application/json'
                },
                body: JSON.stringify(quizData)
            });
            
            console.log('Response headers:', [...response.headers.entries()]);

            console.log('Response status:', response.status);
            
            // First, get the response text to see what we're dealing with
            const responseText = await response.text();
            console.log('Raw response:', responseText);
            
            let result;
            try {
                // Try to parse as JSON
                result = JSON.parse(responseText);
            } catch (e) {
                console.error('Failed to parse response as JSON:', e);
                throw new Error(`Server returned non-JSON response: ${responseText.substring(0, 100)}...`);
            }
            
            if (!response.ok) {
                console.error('Server error:', result);
                throw new Error(result.message || `Server returned ${response.status}: ${response.statusText}`);
            }
            
            showAlert(
                publish ? 'Quiz published successfully!' : 'Quiz saved as draft',
                'success'
            );
            
            // Redirect to teacher's dashboard with quizzes tab active
            setTimeout(() => {
                window.location.href = 'teacher.html#quizzes';
            }, 1500);
            
        } catch (error) {
            console.error('Error saving quiz:', error);
            showAlert(error.message || 'Failed to save quiz. Please try again.', 'danger');
        }
    }
    
    // Show alert message
    function showAlert(message, type) {
        // Remove any existing alerts
        const existingAlert = document.querySelector('.alert');
        if (existingAlert) {
            existingAlert.remove();
        }
        
        const alertDiv = document.createElement('div');
        alertDiv.className = `alert alert-${type} alert-dismissible fade show`;
        alertDiv.role = 'alert';
        alertDiv.innerHTML = `
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
        `;
        
        // Add alert to the top of the main content
        const mainContent = document.querySelector('main');
        mainContent.insertBefore(alertDiv, mainContent.firstChild);
        
        // Auto-dismiss after 5 seconds
        setTimeout(() => {
            alertDiv.remove();
        }, 5000);
    }
});
