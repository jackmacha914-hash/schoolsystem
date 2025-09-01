// Teacher Quiz Creation and Management

document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const questionsContainer = document.getElementById('questionsContainer');
    const addQuestionBtn = document.getElementById('addQuestionBtn');
    const saveDraftBtn = document.getElementById('saveDraftBtn');
    const publishBtn = document.getElementById('publishBtn');
    const quizForm = document.getElementById('quizForm');
    
    // State
    let questionCount = 0;
    
    // Initialize the page
    init();
    
    // Event Listeners
    addQuestionBtn.addEventListener('click', addQuestion);
    saveDraftBtn.addEventListener('click', () => saveQuiz(false));
    publishBtn.addEventListener('click', () => saveQuiz(true));
    
    // Initialize the page
    async function init() {
        // Check if user is logged in and is a teacher
        const token = localStorage.getItem('token');
        if (!token) {
            window.location.href = '../index.html';
            return;
        }
        
        // Set minimum date for due date (today)
        const today = new Date().toISOString().slice(0, 16);
        document.getElementById('dueDate').min = today;
        
        // Add first question by default
        addQuestion();
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
                `;
                optionsContainer.appendChild(answerInput);
                break;
        }
    };
    
    // Add an option to a question
    function addOption(questionCard, text = '', isCorrect = false) {
        const questionType = questionCard.querySelector('.question-type').value;
        const optionsContainer = questionCard.querySelector('.options-container');
        
        if (questionType === 'multiple_choice') {
            const optionId = `option-${Date.now()}`;
            const optionElement = document.createElement('div');
            optionElement.className = 'mb-2 option-item d-flex align-items-center';
            optionElement.innerHTML = `
                <div class="form-check flex-grow-1">
                    <input class="form-check-input option-correct" type="radio" 
                           name="correct-${questionCard.dataset.questionId}" 
                           ${isCorrect ? 'checked' : ''}>
                    <input type="text" class="form-control option-text ms-2" 
                           value="${text}" placeholder="Option text" required>
                </div>
                <button type="button" class="btn btn-sm btn-outline-danger ms-2 delete-option">
                    <i class="fas fa-times"></i>
                </button>
            `;
            
            // Add delete option handler
            const deleteBtn = optionElement.querySelector('.delete-option');
            deleteBtn.addEventListener('click', function() {
                if (optionsContainer.querySelectorAll('.option-item').length > 2) {
                    this.closest('.option-item').remove();
                } else {
                    showAlert('A question must have at least 2 options', 'warning');
                }
            });
            
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
    
    // Save or publish the quiz
    async function saveQuiz(publish = false) {
        if (!quizForm.checkValidity()) {
            quizForm.reportValidity();
            return;
        }
        
        const questions = [];
        let isValid = true;
        
        // Validate and collect questions
        document.querySelectorAll('.question-card').forEach((questionCard, index) => {
            const questionText = questionCard.querySelector('.question-text').value.trim();
            const questionType = questionCard.querySelector('.question-type').value;
            const points = parseInt(questionCard.querySelector('.points').value) || 1;
            
            if (!questionText) {
                showAlert(`Question ${index + 1} is missing text`, 'warning');
                isValid = false;
                return;
            }
            
            const question = {
                questionText,
                questionType,
                points,
                options: []
            };
            
            if (questionType === 'short_answer') {
                const correctAnswer = questionCard.querySelector('.correct-answer').value.trim();
                if (!correctAnswer) {
                    showAlert(`Please provide a correct answer for question ${index + 1}`, 'warning');
                    isValid = false;
                    return;
                }
                question.correctAnswer = correctAnswer;
            } else {
                const options = [];
                let hasCorrectAnswer = false;
                
                questionCard.querySelectorAll('.option-item').forEach(optionItem => {
                    const optionText = optionItem.querySelector('.option-text').value.trim();
                    const isCorrect = optionItem.querySelector('.option-correct').checked;
                    
                    if (!optionText) {
                        showAlert(`Option text is missing in question ${index + 1}`, 'warning');
                        isValid = false;
                        return;
                    }
                    
                    if (isCorrect) hasCorrectAnswer = true;
                    
                    options.push({
                        text: optionText,
                        isCorrect
                    });
                });
                
                if (!isValid) return;
                
                if (options.length < 2) {
                    showAlert(`Question ${index + 1} must have at least 2 options`, 'warning');
                    isValid = false;
                    return;
                }
                
                if (!hasCorrectAnswer) {
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
            description: document.getElementById('quizDescription').value.trim() || undefined,
            class: document.getElementById('class').value.trim(),
            subject: document.getElementById('subject').value.trim(),
            timeLimit: parseInt(document.getElementById('timeLimit').value) || 30,
            passingScore: parseInt(document.getElementById('passingScore').value) || 60,
            allowMultipleAttempts: document.getElementById('allowMultipleAttempts')?.checked || false,
            showCorrectAnswers: document.getElementById('showCorrectAnswers')?.checked !== false, // Default to true if not found
            isPublished: publish,
            teacherId: teacherId,
            questions: transformedQuestions
        };
    
    try {
        console.log('Sending quiz data:', quizData);
        // Use the API_BASE_URL constant if available, otherwise default to port 5000
        const API_BASE_URL = window.API_BASE_URL || 'http://localhost:5000';
        const response = await fetch(`${API_BASE_URL}/api/quizzes/create`, {
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
