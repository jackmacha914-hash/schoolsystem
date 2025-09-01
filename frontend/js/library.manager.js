/**
 * Library Management System
 * Optimized for performance with pagination and search
 */

class LibraryManager {
    constructor() {
        // State
        this.state = {
            currentPage: 1,
            itemsPerPage: 10,
            totalItems: 0,
            isLoading: false,
            selectedBookIds: new Set()
        };

        // Bind methods
        this.init = this.init.bind(this);
        this.loadBooks = this.loadBooks.bind(this);
        this.handleSearch = this.handleSearch.bind(this);
        this.handlePageChange = this.handlePageChange.bind(this);
        this.handleBulkAction = this.handleBulkAction.bind(this);
        this.handleBookAction = this.handleBookAction.bind(this);
    }

    // Initialize the library manager
    init() {
        // Initialize event listeners
        this.initializeEventListeners();
        
        // Load initial data
        this.loadBooks();
    }

    // Initialize all event listeners
    initializeEventListeners() {
        // Search and filter events
        const searchInput = document.getElementById('library-search');
        const genreFilter = document.getElementById('library-genre-filter');
        const authorFilter = document.getElementById('library-author-filter');
        
        if (searchInput) {
            searchInput.addEventListener('input', this.debounce(this.handleSearch, 300));
        }
        
        if (genreFilter) {
            genreFilter.addEventListener('change', () => {
                this.state.currentPage = 1; // Reset to first page on filter change
                this.loadBooks();
            });
        }
        
        if (authorFilter) {
            authorFilter.addEventListener('input', this.debounce(() => {
                this.state.currentPage = 1;
                this.loadBooks();
            }, 300));
        }

        // Pagination
        const prevBtn = document.getElementById('library-prev');
        const nextBtn = document.getElementById('library-next');
        
        if (prevBtn) {
            prevBtn.addEventListener('click', () => this.handlePageChange('prev'));
        }
        
        if (nextBtn) {
            nextBtn.addEventListener('click', () => this.handlePageChange('next'));
        }

        // Bulk actions
        const bulkDeleteBtn = document.getElementById('library-bulk-delete');
        const bulkExportBtn = document.getElementById('library-bulk-export');
        const selectAllCheckbox = document.getElementById('select-all-library');
        
        if (bulkDeleteBtn) {
            bulkDeleteBtn.addEventListener('click', () => this.handleBulkAction('delete'));
        }
        
        if (bulkExportBtn) {
            bulkExportBtn.addEventListener('click', () => this.handleBulkAction('export'));
        }
        
        if (selectAllCheckbox) {
            selectAllCheckbox.addEventListener('change', (e) => {
                const checkboxes = document.querySelectorAll('.library-select-checkbox');
                checkboxes.forEach(checkbox => {
                    checkbox.checked = e.target.checked;
                    const bookId = checkbox.getAttribute('data-id');
                    if (e.target.checked) {
                        this.state.selectedBookIds.add(bookId);
                    } else {
                        this.state.selectedBookIds.delete(bookId);
                    }
                });
                this.updateBulkToolbar();
            });
        }

        // Form submission
        const addBookForm = document.getElementById('add-book-form');
        if (addBookForm) {
            addBookForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                await this.handleAddBook(e.target);
            });
        }

        // Table events (delegated)
        const tableBody = document.getElementById('library-table-body');
        if (tableBody) {
            tableBody.addEventListener('click', (e) => {
                const target = e.target.closest('button');
                if (!target) return;
                
                const bookId = target.getAttribute('data-id');
                if (!bookId) return;
                
                if (target.classList.contains('edit-book-btn')) {
                    this.handleEditBook(bookId);
                } else if (target.classList.contains('delete-book-btn')) {
                    this.handleDeleteBook(bookId);
                }
            });
        }
    }

    // Debounce function for search input
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

    // Show/hide loading state
    setLoading(isLoading) {
        this.state.isLoading = isLoading;
        const loadingEl = document.getElementById('library-loading');
        const tableEl = document.getElementById('library-table');
        
        if (loadingEl) loadingEl.style.display = isLoading ? 'block' : 'none';
        if (tableEl) tableEl.style.display = isLoading ? 'none' : 'table';
    }

    // Show error message
    showError(message) {
        const errorEl = document.getElementById('library-error');
        if (errorEl) {
            errorEl.textContent = message;
            errorEl.style.display = 'block';
            setTimeout(() => {
                errorEl.style.display = 'none';
            }, 5000);
        }
    }

    // Update pagination controls
    updatePagination() {
        const totalPages = Math.ceil(this.state.totalItems / this.state.itemsPerPage);
        const pageInfo = document.getElementById('library-page-info');
        const prevBtn = document.getElementById('library-prev');
        const nextBtn = document.getElementById('library-next');
        
        if (pageInfo) {
            pageInfo.textContent = `Page ${this.state.currentPage} of ${totalPages || 1}`;
        }
        
        if (prevBtn) {
            prevBtn.disabled = this.state.currentPage <= 1;
        }
        
        if (nextBtn) {
            nextBtn.disabled = this.state.currentPage >= totalPages;
        }
    }

    // Update bulk action toolbar
    updateBulkToolbar() {
        const bulkToolbar = document.getElementById('library-bulk-toolbar');
        const bulkDelete = document.getElementById('library-bulk-delete');
        const bulkExport = document.getElementById('library-bulk-export');
        
        if (bulkToolbar && bulkDelete && bulkExport) {
            const hasSelection = this.state.selectedBookIds.size > 0;
            bulkToolbar.style.display = hasSelection ? 'block' : 'none';
            bulkDelete.disabled = !hasSelection;
            bulkExport.disabled = !hasSelection;
        }
    }

    // Load books from API
    async loadBooks() {
        if (this.state.isLoading) return;
        
        this.setLoading(true);
        
        try {
            const token = localStorage.getItem('token');
            const search = document.getElementById('library-search')?.value || '';
            const genre = document.getElementById('library-genre-filter')?.value || '';
            const author = document.getElementById('library-author-filter')?.value || '';
            
            const queryParams = new URLSearchParams({
                page: this.state.currentPage,
                limit: this.state.itemsPerPage,
                ...(search && { search }),
                ...(genre && { genre }),
                ...(author && { author })
            });
            
            const response = await fetch(`http://localhost:5000/api/library?${queryParams}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            
            if (!response.ok) {
                throw new Error('Failed to load books');
            }
            
            const data = await response.json();
            this.state.totalItems = data.total || 0;
            
            this.renderBooks(data.books || []);
            this.updatePagination();
            
        } catch (error) {
            console.error('Error loading books:', error);
            this.showError('Failed to load books. Please try again.');
        } finally {
            this.setLoading(false);
        }
    }

    // Render books in the table
    renderBooks(books) {
        const tableBody = document.getElementById('library-table-body');
        if (!tableBody) return;
        
        if (books.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="5" class="text-center py-4">No books found</td></tr>';
            return;
        }
        
        const fragment = document.createDocumentFragment();
        
        books.forEach(book => {
            const row = document.createElement('tr');
            row.className = 'hover:bg-gray-50';
            row.innerHTML = `
                <td class="px-4 py-2">
                    <input type="checkbox" class="library-select-checkbox" data-id="${book._id}"
                           ${this.state.selectedBookIds.has(book._id) ? 'checked' : ''}>
                </td>
                <td class="px-4 py-2">${book.title || 'N/A'}</td>
                <td class="px-4 py-2">${book.author || 'N/A'}</td>
                <td class="px-4 py-2 text-gray-600">${book.description || 'No description'}</td>
                <td class="px-4 py-2 space-x-2">
                    <button class="edit-book-btn text-blue-600 hover:text-blue-800" data-id="${book._id}">
                        <i class="fas fa-edit"></i> Edit
                    </button>
                    <button class="delete-book-btn text-red-600 hover:text-red-800" data-id="${book._id}">
                        <i class="fas fa-trash"></i> Delete
                    </button>
                </td>`;
            
            fragment.appendChild(row);
        });
        
        tableBody.innerHTML = '';
        tableBody.appendChild(fragment);
        
        // Update checkboxes state
        document.querySelectorAll('.library-select-checkbox').forEach(checkbox => {
            checkbox.addEventListener('change', (e) => {
                const bookId = e.target.getAttribute('data-id');
                if (e.target.checked) {
                    this.state.selectedBookIds.add(bookId);
                } else {
                    this.state.selectedBookIds.delete(bookId);
                }
                this.updateBulkToolbar();
            });
        });
    }

    // Handle search input
    handleSearch() {
        this.state.currentPage = 1;
        this.loadBooks();
    }

    // Handle pagination
    handlePageChange(direction) {
        if (direction === 'prev' && this.state.currentPage > 1) {
            this.state.currentPage--;
        } else if (direction === 'next' && 
                 this.state.currentPage < Math.ceil(this.state.totalItems / this.state.itemsPerPage)) {
            this.state.currentPage++;
        }
        this.loadBooks();
    }

    // Handle bulk actions
    handleBulkAction(action) {
        if (this.state.selectedBookIds.size === 0) return;
        
        if (action === 'delete') {
            if (confirm(`Are you sure you want to delete ${this.state.selectedBookIds.size} selected books?`)) {
                this.deleteBooks(Array.from(this.state.selectedBookIds));
            }
        } else if (action === 'export') {
            // In a real app, this would generate and download a file
            alert(`Exporting ${this.state.selectedBookIds.size} books...`);
            this.state.selectedBookIds.clear();
            this.updateBulkToolbar();
        }
    }

    // Handle individual book actions
    async handleBookAction(bookId, action) {
        if (action === 'edit') {
            this.handleEditBook(bookId);
        } else if (action === 'delete') {
            this.handleDeleteBook(bookId);
        }
    }

    // Handle edit book
    handleEditBook(bookId) {
        // In a real implementation, this would open an edit modal
        // with the book's current data pre-filled
        console.log('Edit book:', bookId);
    }

    // Handle delete book
    async handleDeleteBook(bookId) {
        if (!confirm('Are you sure you want to delete this book?')) return;
        
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`http://localhost:5000/api/library/${bookId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            
            if (!response.ok) {
                throw new Error('Failed to delete book');
            }
            
            // Remove from selected if it was selected
            this.state.selectedBookIds.delete(bookId);
            
            // Reload the book list
            this.loadBooks();
            
            // Show success message
            this.showNotification('Book deleted successfully');
            
        } catch (error) {
            console.error('Error deleting book:', error);
            this.showError('Failed to delete book. Please try again.');
        }
    }

    // Handle add book
    async handleAddBook(form) {
        const formData = new FormData(form);
        const bookData = {
            title: formData.get('title').trim(),
            author: formData.get('author').trim(),
            description: formData.get('description').trim()
        };
        
        if (!bookData.title || !bookData.author) {
            this.showError('Please fill in all required fields');
            return;
        }
        
        try {
            const token = localStorage.getItem('token');
            const response = await fetch('http://localhost:5000/api/library', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(bookData)
            });
            
            if (!response.ok) {
                throw new Error('Failed to add book');
            }
            
            // Reset form and reload books
            form.reset();
            this.state.currentPage = 1;
            this.loadBooks();
            
            // Show success message
            this.showNotification('Book added successfully');
            
        } catch (error) {
            console.error('Error adding book:', error);
            this.showError('Failed to add book. Please try again.');
        }
    }
    
    // Show notification
    showNotification(message, type = 'success') {
        const notification = document.createElement('div');
        notification.className = `fixed top-4 right-4 px-4 py-2 rounded shadow-lg ${type === 'success' ? 'bg-green-500' : 'bg-red-500'} text-white`;
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.remove();
        }, 3000);
    }

    // Delete multiple books
    async deleteBooks(bookIds) {
        try {
            const token = localStorage.getItem('token');
            const deletePromises = bookIds.map(id => 
                fetch(`http://localhost:5000/api/library/${id}`, {
                    method: 'DELETE',
                    headers: { 'Authorization': `Bearer ${token}` }
                })
            );
            
            await Promise.all(deletePromises);
            
            // Clear selection and reload
            this.state.selectedBookIds.clear();
            this.loadBooks();
            
            // Show success message
            this.showNotification(`${bookIds.length} books deleted successfully`);
            
        } catch (error) {
            console.error('Error deleting books:', error);
            this.showError('Failed to delete books. Please try again.');
        }
    }
}

// Initialize the library manager when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const libraryManager = new LibraryManager();
    libraryManager.init();
});
