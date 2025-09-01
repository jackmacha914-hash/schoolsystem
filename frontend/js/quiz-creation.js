/**
 * Quiz Creation Module
 * Handles the creation and management of quizzes through a modal interface
 */

document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const createQuizForm = document.getElementById('createQuizForm');
    const addQuestionBtn = document.getElementById('addQuestionBtn');
    const questionsContainer = document.getElementById('questionsContainer');
    const noQuestionsMessage = document.getElementById('noQuestionsMessage');
    const questionTemplate = document.getElementById('questionTemplate');
    const publishQuizBtn = document.getElementById('publishQuizBtn');
    const saveDraftBtn = document.getElementById('saveDraftBtn');
    const previewQuizBtn = document.getElementById('previewQuizBtn');
    const allowMultipleAttempts = document.getElementById('allowMultipleAttempts');
    const attemptsAllowedContainer = document.getElementById('attemptsAllowedContainer');
    const createQuizModal = document.getElementById('createQuizModal');
    
    // Quiz state
    let descriptionEditor; // Rich text editor instance
    let currentQuestionId = 0; // Counter for generating unique question IDs
    let questions = []; // Array to store question data
    
    // Question types and their configurations
    const QUESTION_TYPES = {
        MULTIPLE_CHOICE: 'multiple_choice',
        TRUE_FALSE: 'true_false',
        SHORT_ANSWER: 'short_answer',
        ESSAY: 'essay',
        MATCHING: 'matching',
        FILL_IN_THE_BLANK: 'fill_in_blank'
    };
    
    // Default question configuration
    const DEFAULT_QUESTION = {
        id: null,
        type: QUESTION_TYPES.MULTIPLE_CHOICE,
        question: '',
        points: 1,
        required: true,
        options: [],
        correctAnswer: null,
        explanation: ''
    };
    
    // Default option configuration
    const DEFAULT_OPTION = {
        id: null,
        text: '',
        isCorrect: false
    };
    
    // Default matching pair configuration
    const DEFAULT_MATCHING_PAIR = {
        id: null,
        left: '',
        right: ''
    };
    
    // Initialize the modal when it's shown
    if (createQuizModal) {
        createQuizModal.addEventListener('show.bs.modal', function() {
            initQuizCreationModal();
        });
        
        createQuizModal.addEventListener('hidden.bs.modal', function() {
            // Clean up when modal is closed
            resetQuizForm();
        });
    }
    
    /**
     * Initialize the quiz creation modal
     */
    function initQuizCreationModal() {
        // Reset the form and state
        resetQuizForm();
        
        // Set minimum datetime for due date to current time
        const now = new Date();
        const timeZoneOffset = now.getTimezoneOffset() * 60000;
        const localISOTime = (new Date(now - timeZoneOffset)).toISOString().slice(0, 16);
        document.getElementById('quizDueDate').min = localISOTime;
        
        // Initialize rich text editor for description
        initRichTextEditor();
        
        // Set up event listeners
        setupEventListeners();
        
        // Add a default question
        addNewQuestion(QUESTION_TYPES.MULTIPLE_CHOICE);
    }
    
    /**
     * Reset the quiz form to its initial state
     */
    function resetQuizForm() {
        // Reset form fields
        if (createQuizForm) {
            createQuizForm.reset();
        }
        
        // Clear questions
        questionsContainer.innerHTML = '';
        questions = [];
        currentQuestionId = 0;
        
        // Show no questions message
        if (noQuestionsMessage) {
            questionsContainer.appendChild(noQuestionsMessage);
        }
        
        // Reset rich text editor
        if (descriptionEditor && typeof descriptionEditor.destroy === 'function') {
            descriptionEditor.destroy();
            descriptionEditor = null;
        }
        
        // Reset preview
        updatePreview();
    }
    
    /**
     * Initialize the rich text editor for quiz description
     */
    function initRichTextEditor() {
        // Only initialize if the editor element exists and TinyMCE is loaded
        const editorElement = document.getElementById('quizDescription');
        if (!editorElement || typeof tinymce === 'undefined') {
            console.warn('TinyMCE not loaded or editor element not found');
            return;
        }
        
        // Initialize TinyMCE
        tinymce.init({
            selector: '#quizDescription',
            height: 200,
            menubar: false,
            plugins: [
                'advlist autolink lists link image charmap print preview anchor',
                'searchreplace visualblocks code fullscreen',
                'insertdatetime media table paste code help wordcount'
            ],
            toolbar: 'undo redo | formatselect | ' +
                     'bold italic backcolor | alignleft aligncenter ' +
                     'alignright alignjustify | bullist numlist outdent indent | ' +
                     'removeformat | help',
            content_style: 'body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif; font-size: 14px; }',
            setup: function(editor) {
                // Save the editor instance
                descriptionEditor = editor;
                
                // Update preview when content changes
                editor.on('change', function() {
                    updatePreview();
                });
            }
        });
    }
    
    /**
     * Set up event listeners for the quiz form
     */
    function setupEventListeners() {
        // Add question button
        if (addQuestionBtn) {
            addQuestionBtn.addEventListener('click', function(e) {
                e.preventDefault();
                addNewQuestion(QUESTION_TYPES.MULTIPLE_CHOICE);
            });
        }
        
        // Question type dropdown items
        document.querySelectorAll('[data-question-type]').forEach(item => {
            item.addEventListener('click', function(e) {
                e.preventDefault();
                const questionType = this.getAttribute('data-question-type');
                addNewQuestion(questionType);
            });
        });
        
        // Multiple attempts toggle
        if (allowMultipleAttempts) {
            allowMultipleAttempts.addEventListener('change', function() {
                if (attemptsAllowedContainer) {
                    attemptsAllowedContainer.style.display = this.checked ? 'block' : 'none';
                }
            });
            
            // Trigger change event to set initial state
            allowMultipleAttempts.dispatchEvent(new Event('change'));
        }
        
        // Publish quiz button
        if (publishQuizBtn) {
            publishQuizBtn.addEventListener('click', function(e) {
                e.preventDefault();
                handleQuizSubmission(true);
            });
        }
        
        // Save as draft button
        if (saveDraftBtn) {
            saveDraftBtn.addEventListener('click', function(e) {
                e.preventDefault();
                handleQuizSubmission(false);
            });
        }
        
        // Preview quiz button
        if (previewQuizBtn) {
            previewQuizBtn.addEventListener('click', function(e) {
                e.preventDefault();
                updatePreview();
                // Show the preview tab
                const previewTab = document.getElementById('preview-tab');
                if (previewTab) {
                    const bsTab = new bootstrap.Tab(previewTab);
                    bsTab.show();
                }
            });
        }
        
        // Update preview when form values change
        const formInputs = createQuizForm.querySelectorAll('input, select, textarea');
        formInputs.forEach(input => {
            input.addEventListener('change', updatePreview);
            input.addEventListener('input', updatePreview);
        });
    }
    
    /**
     * Format a question type for display
     * @param {string} type - The question type
     * @returns {string} Formatted question type
     */
    function formatQuestionType(type) {
        if (!type) return '';
        return type.split('_')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
            .join(' ');
    }
    
    /**
     * Create a button element
     * @param {string} text - Button text
     * @param {string} className - Button class
     * @param {string} iconClass - Icon class
     * @param {string} title - Button title
     * @returns {HTMLButtonElement} The created button
     */
    function createButton(text = '', className = '', iconClass = '', title = '') {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = className;
        button.title = title;
        
        if (iconClass) {
            const icon = document.createElement('i');
            icon.className = iconClass;
            button.appendChild(icon);
            
            // Add a space if there's also text
            if (text) {
                button.appendChild(document.createTextNode(' '));
            }
        }
        
        if (text) {
            button.appendChild(document.createTextNode(text));
        }
        
        return button;
    }
    
    /**
     * Add a new question to the quiz
     * @param {string} questionType - The type of question to add
     * @returns {HTMLElement} The created question element
     */
    function addNewQuestion(questionType) {
        // Generate a unique ID for the question
        const questionId = `question-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
        
        // Create a new question object
        const question = {
            id: questionId,
            type: questionType,
            question: '',
            points: 1,
            required: true,
            options: [],
            correctAnswer: null,
            explanation: ''
        };
        
        // Add to questions array
        questions.push(question);
        
        // Create question element
        const questionCardElement = document.createElement('div');
        questionCardElement.className = 'card mb-4 question-card';
        questionCardElement.id = questionId;
        questionCardElement.dataset.questionId = questionId;
        
        // Create question header
        const header = document.createElement('div');
        header.className = 'card-header d-flex justify-content-between align-items-center';
        
        // Question number and type
        const headerLeft = document.createElement('div');
        headerLeft.className = 'd-flex align-items-center';
        
        const questionNumber = document.createElement('span');
        questionNumber.className = 'badge bg-primary me-2 question-number';
        questionNumber.textContent = questions.length;
        
        const questionTypeSelect = document.createElement('select');
        questionTypeSelect.className = 'form-select form-select-sm question-type';
        questionTypeSelect.dataset.questionId = questionId;
        
        // Add question type options
        Object.entries(QUESTION_TYPES).forEach(([key, value]) => {
            const option = document.createElement('option');
            option.value = value;
            option.textContent = formatQuestionType(value);
            option.selected = value === questionType;
            questionTypeSelect.appendChild(option);
        });
        
        headerLeft.appendChild(questionNumber);
        headerLeft.appendChild(questionTypeSelect);
        
        // Question actions
        const headerRight = document.createElement('div');
        headerRight.className = 'btn-group';
        
        const moveUpBtn = document.createElement('button');
        moveUpBtn.type = 'button';
        moveUpBtn.className = 'btn btn-sm btn-outline-secondary';
        moveUpBtn.title = 'Move up';
        moveUpBtn.innerHTML = '<i class="fas fa-arrow-up"></i>';
        
        const moveDownBtn = document.createElement('button');
        moveDownBtn.type = 'button';
        moveDownBtn.className = 'btn btn-sm btn-outline-secondary';
        moveDownBtn.title = 'Move down';
        moveDownBtn.innerHTML = '<i class="fas fa-arrow-down"></i>';
        
        const deleteBtn = document.createElement('button');
        deleteBtn.type = 'button';
        deleteBtn.className = 'btn btn-sm btn-outline-danger';
        deleteBtn.title = 'Delete question';
        deleteBtn.innerHTML = '<i class="fas fa-trash"></i>';
        
        headerRight.appendChild(moveUpBtn);
        headerRight.appendChild(moveDownBtn);
        headerRight.appendChild(deleteBtn);
        
        header.appendChild(headerLeft);
        header.appendChild(headerRight);
        
        // Question body
        const body = document.createElement('div');
        body.className = 'card-body';
        
        // Question text
        const questionTextGroup = document.createElement('div');
        questionTextGroup.className = 'mb-3';
        
        const questionLabel = document.createElement('label');
        questionLabel.className = 'form-label';
        questionLabel.htmlFor = `${questionId}-text`;
        questionLabel.textContent = 'Question Text';
        
        const questionInput = document.createElement('input');
        questionInput.type = 'text';
        questionInput.className = 'form-control question-text';
        questionInput.id = `${questionId}-text`;
        questionInput.placeholder = 'Enter your question here';
        questionInput.required = true;
        
        questionTextGroup.appendChild(questionLabel);
        questionTextGroup.appendChild(questionInput);
        
        // Points input
        const pointsGroup = document.createElement('div');
        pointsGroup.className = 'mb-3';
        
        const pointsLabel = document.createElement('label');
        pointsLabel.className = 'form-label';
        pointsLabel.htmlFor = `${questionId}-points`;
        pointsLabel.textContent = 'Points';
        
        const pointsInput = document.createElement('input');
        pointsInput.type = 'number';
        pointsInput.className = 'form-control points-input';
        pointsInput.id = `${questionId}-points`;
        pointsInput.min = '0';
        pointsInput.step = '0.5';
        pointsInput.value = '1';
        
        pointsGroup.appendChild(pointsLabel);
        pointsGroup.appendChild(pointsInput);
        
        // Options container
        const optionsContainer = document.createElement('div');
        optionsContainer.className = 'question-options mb-3';
        
        // Required checkbox
        const requiredGroup = document.createElement('div');
        requiredGroup.className = 'form-check mb-3';
        
        const requiredInput = document.createElement('input');
        requiredInput.type = 'checkbox';
        requiredInput.className = 'form-check-input';
        requiredInput.id = `${questionId}-required`;
        requiredInput.checked = true;
        
        const requiredLabel = document.createElement('label');
        requiredLabel.className = 'form-check-label';
        requiredLabel.htmlFor = `${questionId}-required`;
        requiredLabel.textContent = 'Required';
        
        requiredGroup.appendChild(requiredInput);
        requiredGroup.appendChild(requiredLabel);
        
        // Add elements to body
        body.appendChild(questionTextGroup);
        body.appendChild(pointsGroup);
        body.appendChild(optionsContainer);
        body.appendChild(requiredGroup);
        
        // Add question type specific options
        updateQuestionOptions(question, optionsContainer);
        
        // Build the question element
        questionElement.appendChild(header);
        questionElement.appendChild(body);
        
        // Add to DOM
        if (noQuestionsMessage && noQuestionsMessage.parentNode) {
            noQuestionsMessage.remove();
        }
        questionsContainer.appendChild(questionElement);
        
        // Add event listeners
        questionTypeSelect.addEventListener('change', () => handleQuestionTypeChange(question, optionsContainer, questionTypeSelect.value));
        questionInput.addEventListener('input', (e) => {
            question.question = e.target.value;
            updatePreview();
        });
        pointsInput.addEventListener('input', (e) => {
            question.points = parseFloat(e.target.value) || 0;
            updatePreview();
        });
        requiredInput.addEventListener('change', (e) => {
            question.required = e.target.checked;
        });
        moveUpBtn.addEventListener('click', () => moveQuestion(questionId, true));
        moveDownBtn.addEventListener('click', () => moveQuestion(questionId, false));
        deleteBtn.addEventListener('click', () => deleteQuestion(questionId));
        
        // Update question numbers
        updateQuestionNumbers();
        
        // Update preview
        updatePreview();
        
        // Scroll to the new question
        questionElement.scrollIntoView({ behavior: 'smooth' });
        
        return questionElement;
        
        // Clone the question template
        const questionElement = document.importNode(questionTemplate.content, true);
        const questionCard = questionElement.querySelector('.question-card');
        
        // Set question type
        questionCard.setAttribute('data-question-type', questionType);
        const typeSelect = questionCard.querySelector('.question-type-select');
        typeSelect.value = questionType;
        
        // Set question number
        const questionCount = questionsContainer.querySelectorAll('.question-card').length + 1;
        questionCard.querySelector('.question-index').textContent = questionCount;
        
        // Set up event listeners for this question
        setupQuestionEventListeners(questionCard);
        
        // Add to the container
        questionsContainer.appendChild(questionCard);
        
        // Update question numbers
        updateQuestionNumbers();
        
        // Update preview
        updatePreview();
    }
    
    // Set up event listeners for a question card
    function setupQuestionEventListeners(questionCard) {
        // Delete question button
        const deleteBtn = questionCard.querySelector('.delete-question');
        if (deleteBtn) {
            deleteBtn.addEventListener('click', function() {
                if (confirm('Are you sure you want to delete this question?')) {
                    questionCard.remove();
                    updateQuestionNumbers();
                    
                    // Show no questions message if this was the last question
                    if (questionsContainer.querySelectorAll('.question-card').length === 0) {
                        questionsContainer.appendChild(noQuestionsMessage);
                    }
                    
                    updatePreview();
                }
            });
        }
        
        // Question type change
        const typeSelect = questionCard.querySelector('.question-type-select');
        if (typeSelect) {
            typeSelect.addEventListener('change', function() {
                const newType = this.value;
                questionCard.setAttribute('data-question-type', newType);
                updateQuestionType(questionCard, newType);
                updatePreview();
            });
        }
        
        // Add option button
        const addOptionBtn = questionCard.querySelector('.add-option');
        if (addOptionBtn) {
            addOptionBtn.addEventListener('click', function() {
                addOptionToQuestion(questionCard);
            });
        }
        
        // Delete option buttons
        questionCard.querySelectorAll('.delete-option').forEach(btn => {
            btn.addEventListener('click', function() {
                const optionItem = this.closest('.option-item');
                if (optionItem) {
                    const optionsContainer = optionItem.parentElement;
                    optionItem.remove();
                    
                    // If this was the last option, add a new one
                    if (optionsContainer.querySelectorAll('.option-item').length === 0) {
                        addOptionToQuestion(questionCard);
                    }
                    
                    updatePreview();
                }
            });
        });
    }
    
    // Add a new option to a question
    function addOptionToQuestion(questionCard) {
        const optionsContainer = questionCard.querySelector('.options-container');
        const optionItems = optionsContainer.querySelectorAll('.option-item');
        const optionCount = optionItems.length;
        
        // Create new option
        const optionItem = document.createElement('div');
        optionItem.className = 'option-item mb-2';
        optionItem.innerHTML = `
            <div class="input-group input-group-sm">
                <div class="input-group-text">
                    <input class="form-check-input mt-0" type="radio" name="option-${Date.now()}">
                </div>
                <input type="text" class="form-control option-text" placeholder="Option ${optionCount + 1}" required>
                <button type="button" class="btn btn-outline-danger delete-option">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `;
        
        // Add delete event listener to the new option
        const deleteBtn = optionItem.querySelector('.delete-option');
        deleteBtn.addEventListener('click', function() {
            optionItem.remove();
            
            // If this was the last option, add a new one
            if (optionsContainer.querySelectorAll('.option-item').length === 0) {
                addOptionToQuestion(questionCard);
            }
            
            updatePreview();
        });
        
        // Add the new option to the container
        optionsContainer.appendChild(optionItem);
        
        // Focus the new option's input
        setTimeout(() => {
            optionItem.querySelector('.option-text').focus();
        }, 0);
        
        updatePreview();
    }
    
    // Update question type UI
    function updateQuestionType(questionCard, questionType) {
        const optionsContainer = questionCard.querySelector('.options-container');
        
        // Clear existing options
        optionsContainer.innerHTML = '';
        
        switch (questionType) {
            case 'multiple-choice':
            case 'true-false':
                // Add default options based on question type
                const options = questionType === 'true-false' 
                    ? ['True', 'False'] 
                    : ['Option 1', 'Option 2', 'Option 3', 'Option 4'];
                
                options.forEach((opt, index) => {
                    const optionItem = document.createElement('div');
                    optionItem.className = 'option-item mb-2';
                    optionItem.innerHTML = `
                        <div class="input-group input-group-sm">
                            <div class="input-group-text">
                                <input class="form-check-input mt-0" type="radio" name="option-${Date.now()}" ${index === 0 ? 'checked' : ''}>
                            </div>
                            <input type="text" class="form-control option-text" value="${opt}" required>
                            <button type="button" class="btn btn-outline-danger delete-option">
                                <i class="fas fa-times"></i>
                            </button>
                        </div>
                    `;
                    
                    // Add delete event listener
                    const deleteBtn = optionItem.querySelector('.delete-option');
                    deleteBtn.addEventListener('click', function() {
                        // Don't allow deleting if this would leave less than 2 options
                        if (optionsContainer.querySelectorAll('.option-item').length > 2) {
                            optionItem.remove();
                            updatePreview();
                        } else {
                            alert('A question must have at least 2 options');
                        }
                    });
                    
                    optionsContainer.appendChild(optionItem);
                });
                
                // Show add option button
                const addOptionBtn = questionCard.querySelector('.add-option');
                if (addOptionBtn) {
                    addOptionBtn.style.display = 'inline-block';
                }
                
                // Show explanation field
                const explanationField = questionCard.querySelector('.explanation').closest('.mt-3');
                if (explanationField) {
                    explanationField.style.display = 'block';
                }
                break;
                
            case 'short-answer':
                // Add a single text input for short answer
                const shortAnswerItem = document.createElement('div');
                shortAnswerItem.className = 'option-item mb-2';
                shortAnswerItem.innerHTML = `
                    <div class="input-group">
                        <input type="text" class="form-control" placeholder="Short answer text" disabled>
                    </div>
                `;
                optionsContainer.appendChild(shortAnswerItem);
                
                // Hide add option button
                const addOptionBtn2 = questionCard.querySelector('.add-option');
                if (addOptionBtn2) {
                    addOptionBtn2.style.display = 'none';
                }
                
                // Show explanation field
                const explanationField2 = questionCard.querySelector('.explanation').closest('.mt-3');
                if (explanationField2) {
                    explanationField2.style.display = 'block';
                }
                break;
                
            case 'essay':
                // Add a textarea for essay
                const essayItem = document.createElement('div');
                essayItem.className = 'option-item mb-2';
                essayItem.innerHTML = `
                    <div class="form-floating">
                        <textarea class="form-control" placeholder="Student's answer will appear here" style="height: 100px" disabled></textarea>
                        <label>Student's answer will appear here</label>
                    </div>
                `;
                optionsContainer.appendChild(essayItem);
                
                // Hide add option button
                const addOptionBtn3 = questionCard.querySelector('.add-option');
                if (addOptionBtn3) {
                    addOptionBtn3.style.display = 'none';
                }
                
                // Hide explanation field for essay
                const explanationField3 = questionCard.querySelector('.explanation').closest('.mt-3');
                if (explanationField3) {
                    explanationField3.style.display = 'none';
                }
                break;
                
            case 'matching':
                // Add matching pairs interface
                const matchingItem = document.createElement('div');
                matchingItem.className = 'matching-options';
                matchingItem.innerHTML = `
                    <div class="row g-2">
                        <div class="col-md-5">
                            <label class="form-label">Items</label>
                        </div>
                        <div class="col-md-1"></div>
                        <div class="col-md-5">
                            <label class="form-label">Matches</label>
                        </div>
                        <div class="col-md-1"></div>
                    </div>
                    <div class="matching-pairs">
                        <div class="row g-2 mb-2">
                            <div class="col-md-5">
                                <input type="text" class="form-control form-control-sm" placeholder="Item 1">
                            </div>
                            <div class="col-md-1 d-flex align-items-center justify-content-center">
                                <i class="fas fa-arrow-right"></i>
                            </div>
                            <div class="col-md-5">
                                <input type="text" class="form-control form-control-sm" placeholder="Match 1">
                            </div>
                            <div class="col-md-1 d-flex align-items-center">
                                <button type="button" class="btn btn-sm btn-outline-danger">
                                    <i class="fas fa-times"></i>
                                </button>
                            </div>
                        </div>
                        <div class="row g-2 mb-2">
                            <div class="col-md-5">
                                <input type="text" class="form-control form-control-sm" placeholder="Item 2">
                            </div>
                            <div class="col-md-1 d-flex align-items-center justify-content-center">
                                <i class="fas fa-arrow-right"></i>
                            </div>
                            <div class="col-md-5">
                                <input type="text" class="form-control form-control-sm" placeholder="Match 2">
                            </div>
                            <div class="col-md-1 d-flex align-items-center">
                                <button type="button" class="btn btn-sm btn-outline-danger">
                                    <i class="fas fa-times"></i>
                                </button>
                            </div>
                        </div>
                    </div>
                    <button type="button" class="btn btn-sm btn-outline-primary add-matching-pair">
                        <i class="fas fa-plus me-1"></i> Add Pair
                    </button>
                `;
                optionsContainer.appendChild(matchingItem);
                
                // Set up matching pair event listeners
                const addPairBtn = matchingItem.querySelector('.add-matching-pair');
                const matchingPairsContainer = matchingItem.querySelector('.matching-pairs');
                
                if (addPairBtn && matchingPairsContainer) {
                    addPairBtn.addEventListener('click', function() {
                        const pairCount = matchingPairsContainer.querySelectorAll('.row').length + 1;
                        const newPair = document.createElement('div');
                        newPair.className = 'row g-2 mb-2';
                        newPair.innerHTML = `
                            <div class="col-md-5">
                                <input type="text" class="form-control form-control-sm" placeholder="Item ${pairCount}">
                            </div>
                            <div class="col-md-1 d-flex align-items-center justify-content-center">
                                <i class="fas fa-arrow-right"></i>
                            </div>
                            <div class="col-md-5">
                                <input type="text" class="form-control form-control-sm" placeholder="Match ${pairCount}">
                            </div>
                            <div class="col-md-1 d-flex align-items-center">
                                <button type="button" class="btn btn-sm btn-outline-danger delete-pair">
                                    <i class="fas fa-times"></i>
                                </button>
                            </div>
                        `;
                        
                        // Add delete event listener to the new pair
                        const deleteBtn = newPair.querySelector('.delete-pair');
                        deleteBtn.addEventListener('click', function() {
                            // Don't allow deleting if this would leave less than 2 pairs
                            if (matchingPairsContainer.querySelectorAll('.row').length > 2) {
                                newPair.remove();
                            } else {
                                alert('A matching question must have at least 2 pairs');
                            }
                        });
                        
                        matchingPairsContainer.insertBefore(newPair, addPairBtn);
                    });
                    
                    // Add delete event listeners to initial pairs
                    matchingPairsContainer.querySelectorAll('.btn-outline-danger').forEach(btn => {
                        btn.addEventListener('click', function() {
                            // Don't allow deleting if this would leave less than 2 pairs
                            if (matchingPairsContainer.querySelectorAll('.row').length > 2) {
                                this.closest('.row').remove();
                            } else {
                                alert('A matching question must have at least 2 pairs');
                            }
                        });
                    });
                }
                
                // Hide add option button
                const addOptionBtn4 = questionCard.querySelector('.add-option');
                if (addOptionBtn4) {
                    addOptionBtn4.style.display = 'none';
                }
                
                // Show explanation field
                const explanationField4 = questionCard.querySelector('.explanation').closest('.mt-3');
                if (explanationField4) {
                    explanationField4.style.display = 'block';
                }
                break;
        }
    }
    
    // Update question numbers
    function updateQuestionNumbers() {
        const questionCards = questionsContainer.querySelectorAll('.question-card');
        questionCards.forEach((card, index) => {
            card.querySelector('.question-index').textContent = index + 1;
        });
    }
    
    /**
     * Update the preview section with current quiz data
     */
    function updatePreview() {
        const previewContainer = document.getElementById('quizPreview');
        if (!previewContainer) return;
        
        // Get form values
        const title = document.getElementById('quizTitle')?.value || 'Untitled Quiz';
        const description = descriptionEditor ? descriptionEditor.getContent() : '';
        const timeLimit = document.getElementById('quizTimeLimit')?.value || '0';
        const dueDate = document.getElementById('quizDueDate')?.value || '';
        const shuffleQuestions = document.getElementById('shuffleQuestions')?.checked || false;
        const showScore = document.getElementById('showScore')?.checked || false;
        const allowMultipleAttempts = document.getElementById('allowMultipleAttempts')?.checked || false;
        const attemptsAllowed = document.getElementById('attemptsAllowed')?.value || '1';
        const passingScore = document.getElementById('passingScore')?.value || '0';
        
        // Update preview title and description
        const previewTitle = previewContainer.querySelector('#previewQuizTitle');
        const previewDescription = previewContainer.querySelector('#previewQuizDescription');
        const previewMeta = previewContainer.querySelector('#previewQuizMeta');
        const previewQuestions = previewContainer.querySelector('#previewQuestions');
        
        if (previewTitle) previewTitle.textContent = title;
        
        if (previewDescription) {
            previewDescription.innerHTML = description || '<p class="text-muted fst-italic">No description provided.</p>';
        }
        
        // Update preview metadata
        if (previewMeta) {
            let metaHtml = `
                <div class="row g-3">
                    <div class="col-md-6">
                        <div class="d-flex align-items-center mb-2">
                            <i class="fas fa-clock me-2"></i>
                            <span>Time Limit: ${timeLimit > 0 ? `${timeLimit} minutes` : 'No time limit'}</span>
                        </div>
                        <div class="d-flex align-items-center mb-2">
                            <i class="fas fa-calendar-alt me-2"></i>
                            <span>Due: ${dueDate ? new Date(dueDate).toLocaleString() : 'No due date'}</span>
                        </div>
                    </div>
                    <div class="col-md-6">
                        <div class="d-flex align-items-center mb-2">
                            <i class="fas fa-random me-2"></i>
                            <span>Questions: ${shuffleQuestions ? 'Shuffled' : 'In order'}</span>
                        </div>
                        <div class="d-flex align-items-center mb-2">
                            <i class="fas fa-eye${showScore ? '' : '-slash'} me-2"></i>
                            <span>Score: ${showScore ? 'Shown after submission' : 'Hidden'}</span>
                        </div>
                    </div>
                </div>
                <div class="row mt-3">
                    <div class="col-12">
                        <div class="alert alert-info mb-0">
                            <i class="fas fa-info-circle me-2"></i>
                            ${allowMultipleAttempts ? 
                                `Multiple attempts allowed${attemptsAllowed > 0 ? ` (max ${attemptsAllowed})` : ''}. ` : 
                                'Single attempt only. '}
                            ${passingScore > 0 ? `Passing score: ${passingScore}%.` : 'No passing score set.'}
                        </div>
                    </div>
                </div>
            `;
            previewMeta.innerHTML = metaHtml;
        }
        
        // Update questions preview
        if (previewQuestions) {
            if (questions.length === 0) {
                previewQuestions.innerHTML = `
                    <div class="alert alert-warning mb-0">
                        <i class="fas fa-exclamation-triangle me-2"></i>
                        No questions added yet.
                    </div>
                `;
            } else {
                let questionsHtml = '<div class="list-group">';
                
                questions.forEach((question, index) => {
                    questionsHtml += `
                        <div class="list-group-item">
                            <div class="d-flex justify-content-between align-items-center mb-2">
                                <h6 class="mb-0">Question ${index + 1} <span class="badge bg-primary">${formatQuestionType(question.type)}</span></h6>
                                <span class="badge bg-secondary">${question.points} ${question.points === 1 ? 'point' : 'points'}</span>
                            </div>
                            <p class="mb-2">${question.question || '<span class="text-muted fst-italic">No question text</span>'}</p>
                            ${renderQuestionPreview(question)}
                        </div>
                    `;
                });
                
                questionsHtml += '</div>';
                previewQuestions.innerHTML = questionsHtml;
            }
        }
    }
    
    /**
     * Render question preview based on question type
     * @param {Object} question - The question object
     * @returns {string} HTML string for the question preview
     */
    function renderQuestionPreview(question) {
        switch (question.type) {
            case QUESTION_TYPES.MULTIPLE_CHOICE:
                return `
                    <div class="options-preview">
                        ${question.options.map(opt => `
                            <div class="form-check ${opt.isCorrect ? 'text-success fw-bold' : ''}">
                                <input class="form-check-input" type="radio" disabled ${opt.isCorrect ? 'checked' : ''}>
                                <label class="form-check-label">
                                    ${opt.text || '<span class="text-muted fst-italic">Empty option</span>'}
                                    ${opt.isCorrect ? ' <i class="fas fa-check-circle"></i>' : ''}
                                </label>
                            </div>
                        `).join('')}
                    </div>
                `;
                
            case QUESTION_TYPES.TRUE_FALSE:
                return `
                    <div class="options-preview">
                        <div class="form-check ${question.correctAnswer === 'true' ? 'text-success fw-bold' : ''}">
                            <input class="form-check-input" type="radio" disabled ${question.correctAnswer === 'true' ? 'checked' : ''}>
                            <label class="form-check-label">
                                True
                                ${question.correctAnswer === 'true' ? ' <i class="fas fa-check-circle"></i>' : ''}
                            </label>
                        </div>
                        <div class="form-check ${question.correctAnswer === 'false' ? 'text-success fw-bold' : ''}">
                            <input class="form-check-input" type="radio" disabled ${question.correctAnswer === 'false' ? 'checked' : ''}>
                            <label class="form-check-label">
                                False
                                ${question.correctAnswer === 'false' ? ' <i class="fas fa-check-circle"></i>' : ''}
                            </label>
                        </div>
                    </div>
                `;
                
            case QUESTION_TYPES.SHORT_ANSWER:
                return `
                    <div class="short-answer-preview">
                        <div class="input-group mb-2">
                            <span class="input-group-text">Answer:</span>
                            <input type="text" class="form-control" value="${question.correctAnswer || ''}" readonly>
                        </div>
                    </div>
                `;
                
            case QUESTION_TYPES.ESSAY:
                return `
                    <div class="essay-preview">
                        <div class="form-floating">
                            <textarea class="form-control" style="height: 100px" readonly>${question.instructions || ''}</textarea>
                            <label>Instructions</label>
                        </div>
                        <div class="form-floating mt-2">
                            <textarea class="form-control" style="height: 150px" placeholder="Student's answer will appear here" readonly></textarea>
                            <label>Student's Answer</label>
                        </div>
                    </div>
                `;
                
            case QUESTION_TYPES.MATCHING:
                return `
                    <div class="matching-preview">
                        <div class="table-responsive">
                            <table class="table table-bordered">
                                <thead class="table-light">
                                    <tr>
                                        <th>Item</th>
                                        <th>Match</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${question.options.map(pair => `
                                        <tr>
                                            <td>${pair.left || '<span class="text-muted fst-italic">Empty</span>'}</td>
                                            <td>${pair.right || '<span class="text-muted fst-italic">Empty</span>'}</td>
                                        </tr>
                                    `).join('')}
                                </tbody>
                            </table>
                        </div>
                    </div>
                `;
                
            case QUESTION_TYPES.FILL_IN_THE_BLANK:
                const textWithBlanks = question.text ? 
                    question.text.replace(/_(.*?)_/g, '<span class="blank-answer">$1</span>') : 
                    '<span class="text-muted fst-italic">No text with blanks defined</span>';
                
                return `
                    <div class="fill-blank-preview">
                        <div class="mb-3">
                            <p class="mb-2">${textWithBlanks}</p>
                        </div>
                        ${question.blanks && question.blanks.length > 0 ? `
                            <div class="answers-preview">
                                <h6>Correct Answers:</h6>
                                <ul class="list-unstyled">
                                    ${question.blanks.map((blank, i) => `
                                        <li>${i + 1}. ${blank.correctAnswer || '<span class="text-muted fst-italic">No answer</span>'}</li>
                                    `).join('')}
                                </ul>
                            </div>
                        ` : ''}
                    </div>
                `;
                
            default:
                return '<div class="alert alert-warning">Preview not available for this question type.</div>';
        }
    }
        // Update basic info
        const title = document.getElementById('quizTitle').value || 'Untitled Quiz';
        const className = document.getElementById('quizClass').value || '-';
        const subject = document.getElementById('quizSubject').value || '-';
        const timeLimit = document.getElementById('quizTimeLimit').value;
        const dueDate = document.getElementById('quizDueDate').value;
        
        document.getElementById('previewTitle').textContent = title;
        document.getElementById('previewClass').textContent = className;
        document.getElementById('previewSubject').textContent = subject;
        
        // Update question count
        const questionCount = questionsContainer.querySelectorAll('.question-card').length;
        document.getElementById('previewQuestionCount').textContent = questionCount;
        
        // Update time limit
        if (timeLimit && timeLimit > 0) {
            document.getElementById('previewTimeLimit').textContent = `${timeLimit} minutes`;
        } else {
            document.getElementById('previewTimeLimit').textContent = 'No time limit';
        }
        
        // Update due date
        if (dueDate) {
            const date = new Date(dueDate);
            document.getElementById('previewDueDate').textContent = date.toLocaleString();
    }

    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type} alert-dismissible fade show`;
    alertDiv.role = 'alert';
    alertDiv.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
    `;

    const container = document.querySelector('.container.mt-4') || document.body;
    container.insertBefore(alertDiv, container.firstChild);
    
    // Auto-dismiss after 5 seconds
    setTimeout(() => {
        const bsAlert = new bootstrap.Alert(alertDiv);
        bsAlert.close();
    }, 5000);
}

/**
/**
 * Handle quiz submission (publish or save as draft)
 * @param {boolean} publish - Whether to publish the quiz (true) or save as draft (false)
 */
async function handleQuizSubmission(publish) {
    // Show loading state
    const submitBtn = publish ? publishQuizBtn : saveDraftBtn;
    const originalBtnText = submitBtn.innerHTML;
    submitBtn.disabled = true;
    submitBtn.innerHTML = `
        <span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
        ${publish ? 'Publishing...' : 'Saving...'}
    `;
    
    try {
        // Validate form
        if (!validateQuizForm()) {
            resetButtonState(submitBtn, originalBtnText);
            return;
        }
        
        if (!createQuizForm.checkValidity()) {
            createQuizForm.classList.add('was-validated');
            showAlert('Please fill in all required fields.', 'danger');
            
            // Scroll to the first invalid field
            const firstInvalid = createQuizForm.querySelector(':invalid');
            if (firstInvalid) {
                firstInvalid.scrollIntoView({ behavior: 'smooth', block: 'center' });
                firstInvalid.focus();
            }
            
            resetButtonState(submitBtn, originalBtnText);
            return;
        }
        
        // Gather quiz data
        const quizData = {
            title: document.getElementById('quizTitle').value.trim(),
            description: descriptionEditor ? descriptionEditor.getContent() : '',
            classId: document.getElementById('quizClass').value,
            subject: document.getElementById('quizSubject').value,
            timeLimit: parseInt(document.getElementById('quizTimeLimit').value) || 0,
            dueDate: document.getElementById('quizDueDate').value || null,
            shuffleQuestions: document.getElementById('shuffleQuestions').checked,
            showScore: document.getElementById('showScore').checked,
            allowMultipleAttempts: document.getElementById('allowMultipleAttempts').checked,
            attemptsAllowed: parseInt(document.getElementById('attemptsAllowed').value) || 1,
            passingScore: parseInt(document.getElementById('passingScore').value) || 0,
            status: publish ? 'published' : 'draft',
            questions: questions.map(q => ({
                type: q.type,
                question: q.question,
                points: q.points,
                options: q.options || [],
                correctAnswer: q.correctAnswer,
                explanation: q.explanation || '',
                feedback: q.feedback || {},
                metadata: q.metadata || {}
            }))
        };
        
        // Get JWT token from localStorage
        const token = localStorage.getItem('token');
        if (!token) {
            showAlert('You must be logged in to save a quiz.', 'danger');
            window.location.href = '/login.html';
            return;
        }
        
        // Submit to API
        const response = await fetch(`${window.API_BASE_URL || ''}/api/quizzes/create`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(quizData)
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to save quiz');
        }
        
        const result = await response.json();
        
        // Show success message
        showAlert(
            `Quiz ${publish ? 'published' : 'saved as draft'} successfully!`,
            'success'
        );
        
        // Close modal and reset form
        const modal = bootstrap.Modal.getInstance(createQuizModal);
        if (modal) {
            modal.hide();
        }
        
        // Reset form and questions
        resetQuizForm();
        
        // Refresh quizzes list if on quizzes page
        if (typeof loadQuizzes === 'function') {
            loadQuizzes();
        }
        
    } catch (error) {
        console.error('Error saving quiz:', error);
        showAlert(
            error.message || 'An error occurred while saving the quiz. Please try again.',
            'danger'
        );
    } finally {
        // Reset button state
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalBtnText;
        }
    }
                <span class="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span>
                ${publish ? 'Publishing...' : 'Saving...'}
            `;
            
            // Get API URL and token
            const API_BASE_URL = window.API_BASE_URL || 'http://localhost:5000';
            const token = localStorage.getItem('token');
            
            if (!token) {
                throw new Error('Not authenticated. Please log in again.');
            }
            
            // Send data to the server
            const response = await fetch(`${API_BASE_URL}/api/quizzes/create`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(quizData)
            });
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to save quiz');
            }
            
            const result = await response.json();
            
            // Show success message
            const successMessage = document.createElement('div');
            successMessage.className = 'alert alert-success mt-3';
            successMessage.textContent = publish 
                ? 'Quiz published successfully!'
                : 'Quiz saved as draft.';
            
            // Remove any existing messages
            const existingMessage = createQuizForm.querySelector('.alert');
            if (existingMessage) {
                existingMessage.remove();
            }
            
            createQuizForm.appendChild(successMessage);
            
            // If published, close the modal after a delay
            if (publish) {
                setTimeout(() => {
                    const modal = bootstrap.Modal.getInstance(document.getElementById('createQuizModal'));
                    if (modal) {
                        modal.hide();
                    }
                    
                    // Reload the page to show the new quiz in the list
                    window.location.reload();
                }, 1500);
            }
            
        } catch (error) {
            console.error('Error saving quiz:', error);
            
            // Show error message
            const errorMessage = document.createElement('div');
            errorMessage.className = 'alert alert-danger mt-3';
            errorMessage.textContent = error.message || 'An error occurred while saving the quiz. Please try again.';
            
            // Remove any existing messages
            const existingMessage = createQuizForm.querySelector('.alert');
            if (existingMessage) {
                existingMessage.remove();
            }
            
            createQuizForm.appendChild(errorMessage);
            
        } finally {
            // Reset button state
            const submitBtn = publish ? publishQuizBtn : saveDraftBtn;
            submitBtn.disabled = false;
            submitBtn.innerHTML = publish 
                ? '<i class="fas fa-paper-plane me-1"></i> Publish Quiz'
                : '<i class="far fa-save me-1"></i> Save as Draft';
        }
    }
});
