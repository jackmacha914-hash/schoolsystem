// Wait for the DOM to be fully loaded
document.addEventListener('DOMContentLoaded', function() {
    // Track answered questions - defined in the outer scope to avoid redeclaration
    const answeredQuestions = new Set();
    
    // Navigation function - defined in the outer scope to avoid redeclaration
    let navigateToQuestion;
    
    // DOM Elements
    const questionsList = document.getElementById('questionsList');
    const quizTitle = document.getElementById('quizTitle');
    const submitBtn = document.getElementById('submitQuiz');
    const quizContent = document.getElementById('quizContent');
    const quizResults = document.getElementById('quizResults');
    const scoreElement = document.getElementById('score');
    const totalQuestionsElement = document.getElementById('totalQuestions');
    const quizTimer = document.getElementById('quizTimer');
    
    // Check for required elements
    if (!questionsList) {
        console.error('Questions list container not found in the DOM');
        document.body.innerHTML = `
            <div class="container mt-5">
                <div class="alert alert-danger">
                    <h4>Error Loading Quiz</h4>
                    <p>Required elements not found. Please check the page structure.</p>
                    <button onclick="window.location.reload()" class="btn btn-primary mt-2">
                        <i class="fas fa-sync-alt"></i> Reload Page
                    </button>
                </div>
            </div>`;
        return;
    }
    
    // Quiz state
    let quiz = null;
    let timeLeft = 0;
    let timerInterval = null;
    
    // Initialize the quiz
    const quizId = getQuizId();
    if (quizId) {
        // Initialize progress bar
        const progressBar = document.getElementById('quizProgressBar');
        if (progressBar) {
            progressBar.style.width = '0%';
            progressBar.style.background = '#e74c3c';
        }
        loadQuiz(quizId);
    } else {
        showQuizNotFound();
    }
    
    // Helper functions
    function getQuizId() {
        // Try to get quiz ID from URL parameters first
        const urlParams = new URLSearchParams(window.location.search);
        let quizId = urlParams.get('id');
        
        // If not in URL, try to get from session storage
        if (!quizId) {
            quizId = sessionStorage.getItem('currentQuizId');
            if (quizId) {
                console.log('Using quiz ID from session storage:', quizId);
                // Update URL to include the quiz ID for better UX on refresh
                const newUrl = new URL(window.location.href);
                newUrl.searchParams.set('id', quizId);
                window.history.replaceState({}, '', newUrl);
            }
        }
        
        return quizId;
    }
    
    function showQuizNotFound() {
        quizContent.innerHTML = `
            <div class="error" style="text-align: center; padding: 2rem;">
                <i class="fas fa-exclamation-triangle" style="font-size: 3rem; color: #e74c3c; margin-bottom: 1rem;"></i>
                <h2>Quiz Not Found</h2>
                <p>We couldn't find the quiz you're looking for. This might be because:</p>
                <ul style="text-align: left; max-width: 500px; margin: 1rem auto;">
                    <li>The quiz link is incorrect or incomplete</li>
                    <li>The quiz has been removed or unpublished</li>
                    <li>You don't have permission to access this quiz</li>
                </ul>
                <p>Please go back to the quizzes page and try again, or contact your instructor if the problem persists.</p>
                <a href="../pages/quizzes.html" class="btn btn-primary" style="margin-top: 1rem;">
                    <i class="fas fa-arrow-left"></i> Back to Quizzes
                </a>
            </div>`;
    }
    
    // Rest of the code will go here...
    
    // Initialize modal functionality
    initModal();
    
    function initModal() {
        const confirmSubmitModal = document.getElementById('confirmSubmitModal');
        const closeModalBtn = document.querySelector('.close-modal');
        const confirmSubmitBtn = document.getElementById('confirmSubmitBtn');
        const cancelSubmitBtn = document.getElementById('cancelSubmitBtn');
        
        // Event Listeners
        submitBtn.addEventListener('click', showSubmitConfirmation);
        if (closeModalBtn) closeModalBtn.addEventListener('click', hideModal);
        if (cancelSubmitBtn) cancelSubmitBtn.addEventListener('click', hideModal);
        if (confirmSubmitBtn) confirmSubmitBtn.addEventListener('click', submitQuiz);
        
        // Close modal when clicking outside the modal content
        window.addEventListener('click', (e) => {
            if (e.target === confirmSubmitModal) {
                hideModal();
            }
        });
        
        // Close modal with Escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && confirmSubmitModal.style.display === 'flex') {
                hideModal();
            }
        });
        
        function showSubmitConfirmation() {
            const confirmSubmitModal = document.getElementById('confirmSubmitModal');
            if (confirmSubmitModal) {
                confirmSubmitModal.style.display = 'flex';
                document.body.style.overflow = 'hidden'; // Prevent scrolling when modal is open
            }
        }
        
        function hideModal() {
            const confirmSubmitModal = document.getElementById('confirmSubmitModal');
            if (confirmSubmitModal) {
                confirmSubmitModal.style.display = 'none';
                document.body.style.overflow = ''; // Re-enable scrolling
            }
        }
    }
    
    // Export functions that need to be accessible from HTML
    window.navigateToQuestion = (index) => {
        if (navigateToQuestion) {
            navigateToQuestion(index);
        }
    };
});
