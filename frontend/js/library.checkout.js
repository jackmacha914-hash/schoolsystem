console.log('Library Checkout JS loaded');

/**
 * Library Checkout Management System
 * Handles checking out and returning books for students
 */

class LibraryCheckoutManager {
    constructor() {
        this.currentPage = 1;
        this.itemsPerPage = 10;
        this.totalItems = 0;
        this.selectedStudent = null;
        this.selectedBook = null;
        this.checkoutPeriodDays = 14; // Default 2 weeks
        
        // Bind methods
        this.init = this.init.bind(this);
        this.loadCheckouts = this.loadCheckouts.bind(this);
        this.renderCheckouts = this.renderCheckouts.bind(this);
        this.handleCheckout = this.handleCheckout.bind(this);
        this.handleReturn = this.handleReturn.bind(this);
        this.handleRenew = this.handleRenew.bind(this);
        this.showNotification = this.showNotification.bind(this);
        this.setLoading = this.setLoading.bind(this);
        this.debounce = this.debounce.bind(this);
    }

    /**
     * Initialize the checkout manager
     */
    init() {
        // Initialize event listeners
        this.initializeEventListeners();
        
        // Load initial data
        this.loadCheckouts();
        this.loadStudents();
        this.loadAvailableBooks();
    }

    /**
     * Initialize all event listeners
     */
    initializeEventListeners() {
        // Search and filter events
        const searchInput = document.getElementById('checkout-search');
        if (searchInput) {
            searchInput.addEventListener('input', this.debounce(() => {
                this.currentPage = 1;
                this.loadCheckouts();
            }, 300));
        }

        // Status filter
        const statusFilter = document.getElementById('checkout-status-filter');
        if (statusFilter) {
            statusFilter.addEventListener('change', () => {
                this.currentPage = 1;
                this.loadCheckouts();
            });
        }

        // Student selection
        const studentSelect = document.getElementById('checkout-student-select');
        if (studentSelect) {
            studentSelect.addEventListener('change', (e) => {
                this.selectedStudent = e.target.value || null;
                this.loadCheckouts();
            });
        }

        // Book selection
        const bookSelect = document.getElementById('checkout-book-select');
        if (bookSelect) {
            bookSelect.addEventListener('change', (e) => {
                this.selectedBook = e.target.value || null;
            });
        }

        // Checkout form submission
        const checkoutForm = document.getElementById('checkout-book-form');
        if (checkoutForm) {
            checkoutForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleCheckout();
            });
        }

        // Pagination
        const prevBtn = document.getElementById('checkout-prev');
        const nextBtn = document.getElementById('checkout-next');
        
        if (prevBtn) {
            prevBtn.addEventListener('click', () => this.handlePageChange('prev'));
        }
        
        if (nextBtn) {
            nextBtn.addEventListener('click', () => this.handlePageChange('next'));
        }
    }


    /**
     * Load checkouts from the API
     */
    async loadCheckouts() {
        this.setLoading(true);
        
        try {
            const token = localStorage.getItem('token');
            const search = document.getElementById('checkout-search')?.value || '';
            const status = document.getElementById('checkout-status-filter')?.value || '';
            
            let url = `/api/checkouts?page=${this.currentPage}&limit=${this.itemsPerPage}`;
            
            if (search) {
                url += `&search=${encodeURIComponent(search)}`;
            }
            
            if (status) {
                url += `&status=${status}`;
            }
            
            if (this.selectedStudent) {
                url += `&studentId=${this.selectedStudent}`;
            }
            
            const response = await fetch(url, {
                headers: { 
                    'Authorization': `Bearer ${token}`,
                    'Cache-Control': 'no-cache'
                }
            });
            
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            
            const data = await response.json();
            this.totalItems = data.total || data.length || 0;
            
            this.renderCheckouts(Array.isArray(data) ? data : (data.checkouts || []));
            this.updatePagination();
            
        } catch (error) {
            console.error('Error loading checkouts:', error);
            this.showNotification('Failed to load checkouts. Please try again.', 'error');
        } finally {
            this.setLoading(false);
        }
    }

    /**
     * Load available students for checkout
     */
    async loadStudents() {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch('/api/users?role=student', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            
            if (!response.ok) throw new Error('Failed to load students');
            
            const students = await response.json();
            const select = document.getElementById('checkout-student-select');
            
            if (select) {
                select.innerHTML = `
                    <option value="">Select a student</option>
                    ${students.map(student => `
                        <option value="${student._id}">
                            ${student.name} (${student.email || student.studentId || ''})
                        </option>
                    `).join('')}
                `;
            }
            
        } catch (error) {
            console.error('Error loading students:', error);
            this.showNotification('Failed to load students', 'error');
        }
    }

    /**
     * Load available books for checkout
     */
    async loadAvailableBooks() {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch('/api/books?status=available&limit=100', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            
            if (!response.ok) throw new Error('Failed to load available books');
            
            const books = await response.json();
            const select = document.getElementById('checkout-book-select');
            
            if (select) {
                select.innerHTML = `
                    <option value="">Select a book</option>
                    ${books.map(book => `
                        <option value="${book._id}" ${book.availableCopies < 1 ? 'disabled' : ''}>
                            ${book.title} by ${book.author} ${book.availableCopies < 1 ? '(Unavailable)' : ''}
                        </option>
                    `).join('')}
                `;
            }
            
        } catch (error) {
            console.error('Error loading available books:', error);
            this.showNotification('Failed to load available books', 'error');
        }
    }

    /**
     * Handle checking out a book
     */
    async handleCheckout() {
        const studentId = document.getElementById('checkout-student-select')?.value;
        const bookId = document.getElementById('checkout-book-select')?.value;
        const dueDateInput = document.getElementById('checkout-due-date');
        
        if (!studentId || !bookId) {
            this.showNotification('Please select both a student and a book', 'error');
            return;
        }
        
        // Set default due date to 2 weeks from now if not set
        const dueDate = dueDateInput?.value || new Date(Date.now() + this.checkoutPeriodDays * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        
        try {
            const token = localStorage.getItem('token');
            const response = await fetch('/api/checkouts', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    bookId,
                    studentId,
                    dueDate
                })
            });
            
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Failed to check out book');
            }
            
            const data = await response.json();
            
            // Refresh the checkouts and available books
            this.loadCheckouts();
            this.loadAvailableBooks();
            
            // Reset the form
            const form = document.getElementById('checkout-book-form');
            if (form) form.reset();
            
            this.showNotification('Book checked out successfully', 'success');
            
        } catch (error) {
            console.error('Error checking out book:', error);
            this.showNotification(error.message || 'Failed to check out book', 'error');
        }
    }

    /**
     * Handle returning a book
     */
    async handleReturn(checkoutId) {
        if (!confirm('Are you sure you want to mark this book as returned?')) {
            return;
        }
        
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`/api/checkouts/${checkoutId}/return`, {
                method: 'PUT',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Failed to return book');
            }
            
            // Refresh the checkouts and available books
            this.loadCheckouts();
            this.loadAvailableBooks();
            
            this.showNotification('Book returned successfully', 'success');
            
        } catch (error) {
            console.error('Error returning book:', error);
            this.showNotification(error.message || 'Failed to return book', 'error');
        }
    }

    /**
     * Handle renewing a book
     */
    async handleRenew(checkoutId) {
        if (!confirm('Are you sure you want to renew this book for another 2 weeks?')) {
            return;
        }
        
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`/api/checkouts/${checkoutId}/renew`, {
                method: 'PUT',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Failed to renew book');
            }
            
            // Refresh the checkouts
            this.loadCheckouts();
            
            this.showNotification('Book renewed successfully', 'success');
            
        } catch (error) {
            console.error('Error renewing book:', error);
            this.showNotification(error.message || 'Failed to renew book', 'error');
        }
    }

    /**
     * Render checkouts in the table
     */
    renderCheckouts(checkouts) {
        const tbody = document.getElementById('checkouts-table-body');
        if (!tbody) return;
        
        if (checkouts.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="7" class="px-6 py-4 text-center text-gray-500">
                        No checkouts found
                    </td>
                </tr>
            `;
            return;
        }
        
        const rows = checkouts.map(checkout => {
            const isOverdue = !checkout.returnedDate && new Date(checkout.dueDate) < new Date();
            const status = checkout.returnedDate 
                ? `<span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">Returned</span>`
                : isOverdue 
                    ? `<span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">Overdue</span>`
                    : `<span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">Checked Out</span>`;
            
            const dueDate = new Date(checkout.dueDate).toLocaleDateString();
            const checkedOutDate = new Date(checkout.checkedOutDate).toLocaleDateString();
            const returnedDate = checkout.returnedDate 
                ? new Date(checkout.returnedDate).toLocaleDateString() 
                : 'Not returned';
            
            return `
                <tr class="${isOverdue ? 'bg-red-50' : ''}">
                    <td class="px-6 py-4 whitespace-nowrap">
                        <div class="text-sm font-medium text-gray-900">
                            ${checkout.book?.title || 'N/A'}
                        </div>
                        <div class="text-sm text-gray-500">
                            ${checkout.book?.author || 'N/A'}
                        </div>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap">
                        <div class="text-sm text-gray-900">
                            ${checkout.student?.name || 'N/A'}
                        </div>
                        <div class="text-sm text-gray-500">
                            ${checkout.student?.email || checkout.student?.studentId || ''}
                        </div>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        ${checkedOutDate}
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        ${dueDate}
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        ${returnedDate}
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap">
                        ${status}
                        ${checkout.fine > 0 ? `
                            <div class="text-xs text-red-600 mt-1">
                                Fine: $${checkout.fine.toFixed(2)}
                            </div>
                        ` : ''}
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        ${!checkout.returnedDate ? `
                            <button onclick="libraryCheckoutManager.handleReturn('${checkout._id}')" 
                                    class="text-blue-600 hover:text-blue-900 mr-3">
                                Return
                            </button>
                            <button onclick="libraryCheckoutManager.handleRenew('${checkout._id}')" 
                                    class="text-green-600 hover:text-green-900">
                                Renew
                            </button>
                        ` : ''}
                    </td>
                </tr>
            `;
        }).join('');
        
        tbody.innerHTML = rows;
    }

    /**
     * Update pagination controls
     */
    updatePagination() {
        const totalPages = Math.ceil(this.totalItems / this.itemsPerPage);
        const pageInfo = document.getElementById('checkout-page-info');
        const prevBtn = document.getElementById('checkout-prev');
        const nextBtn = document.getElementById('checkout-next');
        
        if (pageInfo) {
            pageInfo.textContent = `Page ${this.currentPage} of ${totalPages || 1}`;
        }
        
        if (prevBtn) prevBtn.disabled = this.currentPage <= 1;
        if (nextBtn) nextBtn.disabled = this.currentPage >= totalPages;
    }

    /**
     * Handle page change
     */
    handlePageChange(direction) {
        if (direction === 'prev' && this.currentPage > 1) {
            this.currentPage--;
        } else if (direction === 'next' && this.currentPage < Math.ceil(this.totalItems / this.itemsPerPage)) {
            this.currentPage++;
        } else {
            return;
        }
        
        this.loadCheckouts();
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    /**
     * Show notification
     */
    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `fixed top-4 right-4 px-4 py-2 rounded shadow-lg ${
            type === 'success' ? 'bg-green-500' : 
            type === 'error' ? 'bg-red-500' : 
            type === 'warning' ? 'bg-yellow-500' : 'bg-blue-500'
        } text-white z-50`;
        
        notification.textContent = message;
        document.body.appendChild(notification);
        
        // Auto-remove after 5 seconds
        setTimeout(() => {
            notification.classList.add('opacity-0', 'transition-opacity', 'duration-300');
            setTimeout(() => notification.remove(), 300);
        }, 5000);
    }

    /**
     * Set loading state
     */
    setLoading(isLoading) {
        const loadingElement = document.getElementById('checkout-loading');
        const contentElement = document.getElementById('checkout-content');
        
        if (loadingElement) loadingElement.style.display = isLoading ? 'block' : 'none';
        if (contentElement) contentElement.style.display = isLoading ? 'none' : 'block';
    }

    /**
     * Debounce function for search input
     */
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }
}

console.log('Initializing LibraryCheckoutManager...');

// Initialize the library checkout manager when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM fully loaded, initializing checkout manager...');
    window.libraryCheckoutManager = new LibraryCheckoutManager();
    window.libraryCheckoutManager.init();
    console.log('Checkout manager initialized');
});
