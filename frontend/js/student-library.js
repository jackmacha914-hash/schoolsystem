// Import API configuration
import { API_CONFIG } from './config.js';

// Student Library Management
document.addEventListener('DOMContentLoaded', function() {
    // Load books when the library tab is clicked
    document.querySelector('[data-tab="library-section"]')?.addEventListener('click', fetchMyIssuedBooks);
});

// Fetch books issued to the current student
async function fetchMyIssuedBooks() {
    try {
        const token = localStorage.getItem('token');
        if (!token) {
            showMessage('Please log in to view your books', 'error');
            return;
        }

        console.log('Fetching issued books...');
        console.log('Token:', token ? 'Token exists' : 'No token found');
        
        const response = await fetch(`${API_CONFIG.BASE_URL}/api/library/my-books`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            credentials: 'include' // Include cookies for session-based auth if needed
        });

        console.log('Response status:', response.status);
        
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            console.error('Error response:', errorData);
            throw new Error(errorData.error || 'Failed to fetch your books');
        }

        const books = await response.json();
        console.log('Received books:', books);
        displayMyBooks(books);
    } catch (error) {
        console.error('Error fetching issued books:', error);
        showMessage(error.message || 'Failed to load your books. Please try again.', 'error');
    }
}

// Display the student's issued books
function displayMyBooks(books) {
    const booksList = document.getElementById('my-books-list');
    if (!booksList) return;

    if (!books || books.length === 0) {
        booksList.innerHTML = '<tr><td colspan="5" class="text-center">No books currently issued to you.</td></tr>';
        return;
    }

    booksList.innerHTML = books.map(book => `
        <tr>
            <td>${escapeHtml(book.title || 'N/A')}</td>
            <td>${escapeHtml(book.author || 'N/A')}</td>
            <td>${formatDate(book.issueDate)}</td>
            <td class="${new Date(book.dueDate) < new Date() ? 'text-danger fw-bold' : ''}">
                ${formatDate(book.dueDate)}
            </td>
            <td>
                <span class="badge ${getStatusBadgeClass(book.status)}">
                    ${book.status || 'Unknown'}
                    ${book.fine > 0 ? `(KES ${book.fine.toFixed(2)})` : ''}
                </span>
            </td>
        </tr>
    `).join('');

    // Initialize tooltips if using Bootstrap
    if (typeof bootstrap !== 'undefined') {
        const tooltipTriggerList = [].slice.call(booksList.querySelectorAll('[data-bs-toggle="tooltip"]'));
        tooltipTriggerList.map(tooltipTriggerEl => new bootstrap.Tooltip(tooltipTriggerEl));
    }
}

// Helper function to format dates
function formatDate(dateString) {
    if (!dateString) return 'N/A';
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
}

// Helper function to get appropriate badge class based on status
function getStatusBadgeClass(status) {
    switch ((status || '').toLowerCase()) {
        case 'issued':
            return 'bg-primary';
        case 'overdue':
            return 'bg-danger';
        case 'returned':
            return 'bg-success';
        default:
            return 'bg-secondary';
    }
}

// Helper function to escape HTML
function escapeHtml(unsafe) {
    if (typeof unsafe !== 'string') return unsafe;
    return unsafe
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

// Helper function to show messages
function showMessage(message, type = 'info') {
    const messageEl = document.getElementById('message');
    if (messageEl) {
        messageEl.textContent = message;
        messageEl.className = `alert alert-${type} alert-dismissible fade show`;
        messageEl.style.display = 'block';
    }
}

// Make the fetch function available globally
window.fetchMyIssuedBooks = fetchMyIssuedBooks;
