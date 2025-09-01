// frontend/js/quiz.js

// Fetch and display all quizzes
async function loadQuizzes() {
    const response = await fetch('/api/quiz/all');
    const quizzes = await response.json();
    
    let quizList = document.getElementById('quizList');
    quizList.innerHTML = '';
    quizzes.forEach(quiz => {
        quizList.innerHTML += `
            <div class="quiz-item">
                <h3>${quiz.title}</h3>
                <p>${quiz.isPublished ? 'Published' : 'Unpublished'}</p>
                <button onclick="publishQuiz('${quiz._id}', ${!quiz.isPublished})">${quiz.isPublished ? 'Unpublish' : 'Publish'}</button>
                <button onclick="editQuiz('${quiz._id}')">Edit</button>
                <button onclick="deleteQuiz('${quiz._id}')">Delete</button>
            </div>
        `;
    });
}

// Create a new quiz
async function createQuiz() {
    const title = document.getElementById('quizTitle').value;
    const response = await fetch('/api/quiz/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, teacherId: '12345', questions: [] })
    });
    if (response.ok) loadQuizzes();
}

// Publish or Unpublish a quiz
async function publishQuiz(id, status) {
    await fetch(`/api/quiz/${id}/publish`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isPublished: status })
    });
    loadQuizzes();
}

// Delete a quiz
async function deleteQuiz(id) {
    await fetch(`/api/quiz/${id}`, { method: 'DELETE' });
    loadQuizzes();
}

// Edit a quiz (Redirect to edit page)
function editQuiz(id) {
    window.location.href = `/edit-quiz.html?id=${id}`;
}

document.addEventListener('DOMContentLoaded', loadQuizzes);
