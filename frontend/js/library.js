// Import API utility
import { api } from './api.js';

// Library Management Logic

// DOM Elements
const libraryForm = document.getElementById('library-form');
const libraryList = document.getElementById('library-list');
const librarySearch = document.getElementById('library-search');
const libraryGenreFilter = document.getElementById('library-genre-filter');
const libraryAuthorFilter = document.getElementById('library-author-filter');
const libraryClassFilter = document.getElementById('library-class-filter');
const libraryBulkToolbar = document.getElementById('library-bulk-toolbar');
const libraryBulkDelete = document.getElementById('library-bulk-delete');
const libraryBulkExport = document.getElementById('library-bulk-export');
const selectAllLibrary = document.getElementById('select-all-library');
const libraryTableBody = document.getElementById('library-table-body');
const issuedBooksSearch = document.getElementById('issued-books-search');
const issuedBooksList = document.getElementById('issued-books-list');

// Tab functionality
window.showLibraryTab = function(tabId) {
    // Hide all tab contents
    document.querySelectorAll('.library-tab-content').forEach(tab => {
        tab.classList.remove('active');
    });
    
    // Deactivate all tab buttons
    document.querySelectorAll('.library-tabs .tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    // Show the selected tab content
    const selectedTab = document.getElementById(tabId);
    if (selectedTab) {
        selectedTab.classList.add('active');
    }
    
    // Activate the clicked tab button
    const activeBtn = document.querySelector(`.library-tabs .tab-btn[onclick*="${tabId}"]`);
    if (activeBtn) {
        activeBtn.classList.add('active');
    }
    
    // Load data for the selected tab
    if (tabId === 'issued-books') {
        loadIssuedBooks();
    }
}

let selectedBookIds = new Set();

// --- Advanced Filters for Library ---
function getLibraryFilters() {
    return {
        search: librarySearch.value.trim(),
        genre: libraryGenreFilter.value,
        author: libraryAuthorFilter.value.trim(),
        className: libraryClassFilter ? libraryClassFilter.value : ''
    };
}

function buildLibraryQueryString(filters) {
    const params = [];
    if (filters.search) params.push(`search=${encodeURIComponent(filters.search)}`);
    if (filters.genre) params.push(`genre=${encodeURIComponent(filters.genre)}`);
    if (filters.author) params.push(`author=${encodeURIComponent(filters.author)}`);
    if (filters.className) params.push(`className=${encodeURIComponent(filters.className)}`);
    return params.length ? '?' + params.join('&') : '';
}

async function loadLibraryWithFilters() {
    const token = localStorage.getItem('token');
    if (!token) {
        showNotification('Please log in to view library', 'error');
        return;
    }
    
    const filters = getLibraryFilters();
    const queryString = buildLibraryQueryString(filters);
    let url = `${API_CONFIG.BASE_URL}/api/library${queryString}`;
    
    console.log('Loading library with filters:', filters);
    console.log('Request URL:', url);
    
    try {
        const res = await fetch(url, { 
            headers: { 
                'Authorization': `Bearer ${token}`,
                'Cache-Control': 'no-cache',
                'Pragma': 'no-cache'
            } 
        });
        
        if (!res.ok) {
            const errorText = await res.text();
            console.error('Error response:', errorText);
            throw new Error(`HTTP error! status: ${res.status}`);
        }
        
        const books = await res.json();
        console.log('Received books:', books);
        libraryTableBody.innerHTML = '';
        if (Array.isArray(books) && books.length > 0) {
            books.forEach(book => {
                libraryTableBody.insertAdjacentHTML('beforeend', renderBookRow(book));
            });
        } else {
            libraryTableBody.innerHTML = '<tr><td colspan="5">No books found.</td></tr>';
        }
        // Add event listeners for checkboxes
        if (libraryTableBody) {
            libraryTableBody.addEventListener('click', async (e) => {
                const btn = e.target;
                const bookId = btn.getAttribute('data-id');
                if (!bookId) return;
                const token = localStorage.getItem('token');
                // Edit Book (universal modal)
                if (btn.classList.contains('edit-book-btn')) {
                    const tr = btn.closest('tr');
                    const currentTitle = tr.querySelector('td:nth-child(2)').textContent;
                    const currentAuthor = tr.querySelector('td:nth-child(3)').textContent;
                    const currentDesc = tr.querySelector('td:nth-child(4)').textContent;
                    const universalEditModal = document.getElementById('universal-edit-modal');
                    const universalEditForm = document.getElementById('universal-edit-form');
                    const universalEditMsg = document.getElementById('universal-edit-msg');
                    if (universalEditForm) {
                        universalEditForm.innerHTML = `
                            <input type="hidden" name="bookId" value="${bookId}" />
                            <div class='form-group'><label>Title:</label><input type='text' name='title' value='${currentTitle}' required /></div>
                            <div class='form-group'><label>Author:</label><input type='text' name='author' value='${currentAuthor}' required /></div>
                            <div class='form-group'><label>Year:</label><input type='number' name='year' min='1000' max='2099' value='${book.year || new Date().getFullYear()}' /></div>
                            <div class='form-group'><label>Copies:</label><input type='number' name='copies' min='1' value='${book.copies || 1}' required /></div>
                            <div class='form-group'>
                                <label>Genre:</label>
                                <select name='genre' required>
                                    <option value='Fiction' ${book.genre === 'Fiction' ? 'selected' : ''}>Fiction</option>
                                    <option value='Non-Fiction' ${book.genre === 'Non-Fiction' ? 'selected' : ''}>Non-Fiction</option>
                                    <option value='Science' ${book.genre === 'Science' ? 'selected' : ''}>Science</option>
                                    <option value='History' ${book.genre === 'History' ? 'selected' : ''}>History</option>
                                    <option value='Biography' ${book.genre === 'Biography' ? 'selected' : ''}>Biography</option>
                                    <option value='Children' ${book.genre === 'Children' ? 'selected' : ''}>Children</option>
                                </select>
                            </div>
                            <div class='form-group'>
                                <label>Status:</label>
                                <select name='status'>
                                    <option value='available' ${book.status === 'available' ? 'selected' : ''}>Available</option>
                                    <option value='checked-out' ${book.status === 'checked-out' ? 'selected' : ''}>Checked Out</option>
                                    <option value='lost' ${book.status === 'lost' ? 'selected' : ''}>Lost</option>
                                </select>
                            </div>
                            <button type='submit'>Save Changes</button>
                        `;
                        if (universalEditMsg) universalEditMsg.style.display = 'none';
                        if (universalEditModal) {
                            universalEditModal.style.display = 'block';
                            universalEditForm.onsubmit = async (ev) => {
                                ev.preventDefault();
                                if (universalEditMsg) universalEditMsg.style.display = 'none';
                                const formData = new FormData(universalEditForm);
                                const title = formData.get('title');
                                const author = formData.get('author');
                                const year = formData.get('year');
                                const genre = formData.get('genre');
                                const status = formData.get('status') || 'available';
                                const copies = parseInt(formData.get('copies')) || 1;
                                try {
                                    const res = await fetch(`http://localhost:5000/api/library/${bookId}`, {
                                        method: 'PUT',
                                        headers: {
                                            'Content-Type': 'application/json',
                                            'Authorization': `Bearer ${token}`,
                                        },
                                        body: JSON.stringify({ 
                                            title, 
                                            author, 
                                            year: year ? parseInt(year) : new Date().getFullYear(),
                                            genre,
                                            status,
                                            copies,
                                            available: status === 'available' ? copies : 0
                                        })
                                    });
                                    if (res.ok) {
                                        if (universalEditMsg) {
                                            universalEditMsg.textContent = 'Book updated successfully!';
                                            universalEditMsg.style.color = 'green';
                                            universalEditMsg.style.display = 'block';
                                        }
                                        setTimeout(() => {
                                            if (universalEditModal) universalEditModal.style.display = 'none';
                                            loadLibraryWithFilters();
                                        }, 1000);
                                    } else {
                                        if (universalEditMsg) {
                                            universalEditMsg.textContent = 'Failed to update book.';
                                            universalEditMsg.style.color = 'red';
                                            universalEditMsg.style.display = 'block';
                                        }
                                    }
                                } catch {
                                    if (universalEditMsg) {
                                        universalEditMsg.textContent = 'Network error.';
                                        universalEditMsg.style.color = 'red';
                                        universalEditMsg.style.display = 'block';
                                    }
                                }
                            };
                        }
                    }
                }
                // Issue Book
                else if (btn.classList.contains('issue-book-btn')) {
                    console.log('Issue button clicked'); // Debug log
                    const bookId = btn.getAttribute('data-id');
                    const genre = btn.getAttribute('data-genre');
                    const bookTitle = btn.closest('tr').querySelector('td:nth-child(2)').textContent;
                    const universalModal = document.getElementById('universal-edit-modal');
                    const universalForm = document.getElementById('universal-edit-form');
                    const universalMsg = document.getElementById('universal-edit-msg');
                    const universalTitle = document.getElementById('universal-edit-title');
                    
                    if (universalForm && universalModal) {
                        // Clear any previous messages and reset form
                        if (universalMsg) {
                            universalMsg.textContent = '';
                            universalMsg.style.display = 'none';
                        }
                        
                        // Set the modal title
                        if (universalTitle) {
                            universalTitle.textContent = `Issue Book: ${bookTitle}`;
                        }
                        
                        // Set up the form
                        const today = new Date().toISOString().split('T')[0];
                        const defaultDueDate = new Date();
                        defaultDueDate.setDate(defaultDueDate.getDate() + 14); // 2 weeks from now
                        const defaultDueDateStr = defaultDueDate.toISOString().split('T')[0];
                        
                        universalForm.innerHTML = `
                            <input type="hidden" name="bookId" value="${bookId}">
                            <input type="hidden" name="genre" value="${genre}">
                            <div class="mb-4">
                                <label class="block text-gray-700 text-sm font-bold mb-2" for="classSelect">
                                    Class
                                </label>
                                <select class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" 
                                        id="classSelect" name="class" required>
                                    <option value="">Select a class</option>
                                    <optgroup label="Pre-Primary">
                                        <option value="pp1">Pre-Primary 1 (PP1) - Age 4-5</option>
                                        <option value="pp2">Pre-Primary 2 (PP2) - Age 5-6</option>
                                    </optgroup>
                                    <optgroup label="Primary Education">
                                        <option value="grade1">Grade 1 - Age 6-7</option>
                                        <option value="grade2">Grade 2 - Age 7-8</option>
                                        <option value="grade3">Grade 3 - Age 8-9</option>
                                        <option value="grade4">Grade 4 - Age 9-10</option>
                                        <option value="grade5">Grade 5 - Age 10-11</option>
                                        <option value="grade6">Grade 6 - Age 11-12</option>
                                        <option value="grade7">Grade 7 - Age 12-13</option>
                                        <option value="grade8">Grade 8 - Age 13-14 (KCPE)</option>
                                    </optgroup>
                                    <optgroup label="Secondary Education">
                                        <option value="form1">Form 1 - Age 14-15</option>
                                        <option value="form2">Form 2 - Age 15-16</option>
                                        <option value="form3">Form 3 - Age 16-17</option>
                                        <option value="form4">Form 4 - Age 17-18 (KCSE)</option>
                                    </optgroup>
                                    <optgroup label="Tertiary/College">
                                        <option value="college1">Year 1 - Certificate/Diploma</option>
                                        <option value="college2">Year 2 - Certificate/Diploma</option>
                                        <option value="college3">Year 3 - Diploma/Degree</option>
                                        <option value="college4">Year 4 - Degree</option>
                                    </optgroup>
                                </select>
                            </div>
                            <div class="mb-4">
                                <label class="block text-gray-700 text-sm font-bold mb-2" for="studentSelect">
                                    Student
                                </label>
                                <select class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" 
                                        id="studentSelect" name="studentId" required disabled>
                                    <option value="">Select a class first</option>
                                </select>
                            </div>
                            <div class="mb-6">
                                <label class="block text-gray-700 text-sm font-bold mb-2" for="dueDate">
                                    Due Date
                                </label>
                                <input class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" 
                                       id="dueDate" name="dueDate" type="date" required>
                            </div>
                            <div class="flex items-center justify-end gap-3">
                                <button type="button" class="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline cancel-btn">
                                    Cancel
                                </button>
                                <button type="submit" class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline submit-btn">
                                    <i class="fas fa-book-reader mr-2"></i>Issue Book
                                </button>
                            </div>
                        `;
                        
                        console.log('Showing issue modal for book ID:', bookId);
                        
                        // Ensure the modal is in the DOM and visible
                        if (!document.body.contains(universalModal)) {
                            console.error('Modal element not found in DOM');
                            return;
                        }
                        
                        // Show the modal
                        showModal(universalModal);
                        console.log('Modal display style:', window.getComputedStyle(universalModal).display);
                        
                        // Set focus after a short delay to ensure the modal is visible
                        setTimeout(() => {
                            const firstInput = universalForm.querySelector('input:not([type="hidden"])');
                            if (firstInput) {
                                firstInput.removeAttribute('autofocus'); // Remove autofocus attribute
                                firstInput.focus({ preventScroll: true });
                            }
                        }, 50);
                        
                        // Handle form submission
                        // Remove any existing submit handlers to prevent duplicates
                        const newForm = universalForm.cloneNode(true);
                        universalForm.parentNode.replaceChild(newForm, universalForm);
                        
                        newForm.onsubmit = async (e) => {
                            e.preventDefault();
                            
                            const formMsg = document.getElementById('issue-form-msg');
                            const submitBtn = newForm.querySelector('.submit-btn');
                            const cancelBtn = newForm.querySelector('.cancel-btn');
                            
                            // Prevent multiple submissions
                            if (submitBtn && submitBtn.hasAttribute('data-submitting')) {
                                return;
                            }
                            
                            // Disable buttons and show loading state
                            if (submitBtn) {
                                submitBtn.disabled = true;
                                submitBtn.setAttribute('data-submitting', 'true');
                                submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Issuing...';
                            }
                            if (cancelBtn) cancelBtn.disabled = true;
                            
                            // Clear previous messages
                            if (formMsg) {
                                formMsg.textContent = '';
                                formMsg.style.display = 'none';
                            }
                            
                            try {
                                const formData = new FormData(newForm);
                                const bookId = formData.get('bookId');
                                const classSelect = newForm.querySelector('#classSelect');
                                const studentSelect = newForm.querySelector('#studentSelect');
                                const selectedStudent = studentSelect.options[studentSelect.selectedIndex];
                                const borrowerName = selectedStudent.textContent;
                                const borrowerId = formData.get('studentId');
                                const borrowerEmail = selectedStudent.getAttribute('data-email') || '';
                                const dueDate = formData.get('dueDate');

                                if (!borrowerId || !dueDate) {
                                    throw new Error('Please select a student and due date');
                                }

                                const token = localStorage.getItem('token');
                                if (!token) {
                                    throw new Error('Authentication required. Please log in again.');
                                }
                                
                                // Get the genre from the book data attribute
                                const issueButton = document.querySelector(`.issue-book-btn[data-id="${bookId}"]`);
                                const genre = issueButton ? (issueButton.getAttribute('data-genre') || 'General') : 'General';
                                
                                // Debug logging removed from production

                                const response = await api.post(`/api/library/${bookId}/issue`, {
                                    borrowerName,
                                    borrowerId,
                                    borrowerEmail,
                                    dueDate,
                                    className: classSelect.value,
                                    genre // Add genre to the request body
                                });
                                
                                const result = await response.json().catch(() => ({}));
                                
                                if (!response.ok) {
                                    const errorData = await response.json().catch(() => ({}));
                                    throw new Error(errorData.error || 'Failed to issue book. Please try again.');
                                }

                                // Show success message
                                if (formMsg) {
                                    formMsg.textContent = 'Book issued successfully!';
                                    formMsg.className = 'mt-3 text-sm text-green-600';
                                    formMsg.style.display = 'block';
                                }
                                
                                // Update the UI after a short delay
                                setTimeout(() => {
                                    hideModal(universalModal);
                                    loadLibraryWithFilters();
                                    
                                    // Reset form state
                                    if (submitBtn) {
                                        submitBtn.disabled = false;
                                        submitBtn.removeAttribute('data-submitting');
                                        submitBtn.innerHTML = '<i class="fas fa-book-reader mr-2"></i>Issue Book';
                                    }
                                    if (cancelBtn) cancelBtn.disabled = false;
                                }, 1500);
                            } catch (error) {
                                console.error('Error issuing book:', error);
                                if (formMsg) {
                                    formMsg.textContent = error.message || 'An error occurred while processing your request.';
                                    formMsg.className = 'mt-3 text-sm text-red-600';
                                    formMsg.style.display = 'block';
                                    
                                    // Scroll to the error message
                                    formMsg.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                }
                                
                                // Re-enable buttons
                                if (submitBtn) {
                                    submitBtn.disabled = false;
                                    submitBtn.removeAttribute('data-submitting');
                                    submitBtn.innerHTML = '<i class="fas fa-book-reader mr-2"></i>Issue Book';
                                }
                                if (cancelBtn) cancelBtn.disabled = false;
                            }
                        };
                        
                        // Add cancel button handler
                        const cancelBtn = universalForm.querySelector('.cancel-btn');
                        if (cancelBtn) {
                            cancelBtn.onclick = (e) => {
                                e.preventDefault();
                                hideModal(universalModal);
                            };
                        }
                    }
                }
                // Delete Book (universal confirm modal)
                else if (btn.classList.contains('delete-book-btn')) {
                    // Disable the delete button to prevent multiple clicks
                    btn.disabled = true;
                    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Deleting...';
                    
                    const confirmDelete = confirm('Are you sure you want to delete this book? This action cannot be undone.');
                    
                    if (!confirmDelete) {
                        btn.disabled = false;
                        btn.innerHTML = '<i class="fas fa-trash"></i>';
                        return;
                    }
                    
                    (async () => {
                        try {
                            const token = localStorage.getItem('token');
                            if (!token) {
                                throw new Error('Authentication required. Please log in again.');
                            }
                            
                            const response = await api.delete(`/api/library/${bookId}`);
                            
                            // Handle the response
                            if (response.status === 404) {
                                throw new Error('Book not found or already deleted');
                            }
                            
                            const result = await response.json().catch(() => ({}));
                            
                            if (!response.ok) {
                                throw new Error(result.error || 'Failed to delete book');
                            }
                            
                            showNotification('Book deleted successfully', 'success');
                            
                            // Remove the deleted book from the UI immediately
                            const rowToRemove = btn.closest('tr');
                            if (rowToRemove) {
                                rowToRemove.style.opacity = '0.5';
                                setTimeout(() => rowToRemove.remove(), 300);
                            }
                            
                            // Refresh the book list after a short delay
                            setTimeout(() => {
                                loadLibraryWithFilters().catch(error => {
                                    console.error('Error refreshing book list:', error);
                                    showNotification('Error refreshing book list', 'error');
                                });
                            }, 500);
                            
                        } catch (error) {
                            console.error('Error deleting book:', error);
                            showNotification(`Error: ${error.message}`, 'error');
                        } finally {
                            // Re-enable the delete button
                            const deleteButtons = document.querySelectorAll('.delete-book-btn');
                            deleteButtons.forEach(btn => {
                                btn.disabled = false;
                                btn.innerHTML = '<i class="fas fa-trash"></i>';
                            });
                        }
                    })();
                }
            });
        }
        if (selectAllLibrary) {
            selectAllLibrary.checked = false;
            selectAllLibrary.onchange = async function() {
                if (this.checked) {
                    document.querySelectorAll('.library-select-checkbox').forEach(cb => {
                        cb.checked = true;
                        selectedBookIds.add(cb.getAttribute('data-id'));
                    });
                } else {
                    document.querySelectorAll('.library-select-checkbox').forEach(cb => {
                        cb.checked = false;
                        selectedBookIds.delete(cb.getAttribute('data-id'));
                    });
                }
                updateLibraryBulkToolbarState();
            };
        }
        updateLibraryBulkToolbarState();
    } catch (err) {
        libraryTableBody.innerHTML = '<tr><td colspan="5">Error loading library.</td></tr>';
    }
}

function renderBookRow(book) {
    const available = book.available !== undefined ? book.available : (book.copies || 1);
    const copies = book.copies || 1;
    const availableClass = available > 0 ? 'status-available' : 'status-checked-out';
    
    return `<tr>
        <td><input type="checkbox" class="library-select-checkbox" data-id="${book._id}"></td>
        <td>${book.title}</td>
        <td>${book.author}</td>
        <td>${book.year || 'N/A'}</td>
        <td>${book.genre || 'N/A'}</td>
        <td class="status-${book.status || 'available'}">${book.status || 'available'}</td>
        <td>${copies}</td>
        <td class="${availableClass}">${available}</td>
        <td class="actions-cell">
            <button class="edit-book-btn" data-id="${book._id}">Edit</button>
            <button class="issue-book-btn" 
                    data-id="${book._id}" 
                    data-genre="${book.genre || 'General'}" 
                    ${book.available < 1 ? 'disabled' : ''}>
                Issue
            </button>
            <button class="delete-book-btn" data-id="${book._id}">Delete</button>
        </td>
    </tr>`;
}

function updateLibraryBulkToolbarState() {
    const hasSelection = selectedBookIds.size > 0;
    if (libraryBulkToolbar) libraryBulkToolbar.style.display = hasSelection ? 'block' : 'none';
    if (libraryBulkDelete) libraryBulkDelete.disabled = !hasSelection;
    if (libraryBulkExport) libraryBulkExport.disabled = !hasSelection;
}

function clearLibrarySelections() {
    selectedBookIds.clear();
    document.querySelectorAll('.library-select-checkbox').forEach(cb => cb.checked = false);
    if (selectAllLibrary) selectAllLibrary.checked = false;
    updateLibraryBulkToolbarState();
}

// Function to show modal with animation
function showModal(modal) {
    console.log('showModal called with:', modal);
    if (!modal) {
        console.error('No modal element provided');
        return;
    }
    
    // Show the modal
    console.log('Showing modal');
    modal.classList.add('show');
    document.body.style.overflow = 'hidden'; // Prevent scrolling when modal is open
    
    // Force reflow
    void modal.offsetWidth;
    
    // Start fade in
    setTimeout(() => {
        modal.style.opacity = '1';
        modal.style.visibility = 'visible';
    }, 10);
    
    // Add ESC key listener
    const handleEsc = (e) => {
        if (e.key === 'Escape') {
            hideModal(modal);
        }
    };
    
    document.addEventListener('keydown', handleEsc);
    modal._escHandler = handleEsc;
    
    // Add click outside handler
    const handleOutsideClick = (e) => {
        if (e.target === modal) {
            hideModal(modal);
        }
    };
    
    modal.addEventListener('click', handleOutsideClick);
    modal._outsideClickHandler = handleOutsideClick;
}

// Function to hide modal with animation
function hideModal(modal) {
    if (!modal) return;
    
    // Start fade out
    modal.classList.remove('show');
    document.body.style.overflow = ''; // Re-enable scrolling
    
    // Reset form and clear any messages
    const form = modal.querySelector('form');
    if (form) form.reset();
    
    const msg = modal.querySelector('#universal-edit-msg');
    if (msg) {
        msg.textContent = '';
        msg.style.display = 'none';
    }
}

// Close modal when clicking outside content
document.addEventListener('click', (e) => {
    const modal = document.getElementById('universal-edit-modal');
    if (e.target === modal) {
        hideModal(modal);
    }
});

// Close modal with escape key
// Fetch students by class
async function fetchStudentsByClass(className) {
    try {
        const token = localStorage.getItem('token');
        if (!token) {
            console.error('No authentication token found');
            throw new Error('Authentication required');
        }
        
        // Convert class format from 'grade8' to 'Grade 8' for the API
        const formattedClassName = className.replace(/^grade(\d+)$/i, 'Grade $1');
        const url = `${API_CONFIG.BASE_URL}/api/students/class/${encodeURIComponent(formattedClassName)}`;
        
        console.log(`Fetching students from: ${url}`);
        console.log('Using token:', token ? 'Token exists' : 'No token');
        
        const response = await api.get(url);
        
        console.log('Response status:', response.status, response.statusText);
        
        const data = await response.json();
        
        if (!response.ok) {
            console.error('API Error Response:', data);
            throw new Error(data.error || 'Failed to fetch students');
        }
        
        // Extract students array from the response data
        const students = data.data || [];
        
        if (!Array.isArray(students)) {
            console.error('Students data is not an array:', students);
            throw new Error('Invalid students data format received from server');
        }
        
        console.log(`Received ${students.length} students for class ${formattedClassName}`, students);
        return students;
        
    } catch (error) {
        console.error('Error in fetchStudentsByClass:', error);
        showNotification(error.message || 'Error fetching students. Please try again.', 'error');
        return [];
    }
}

// Populate student dropdown
async function populateStudentDropdown(className, studentSelect) {
    if (!studentSelect) {
        console.error('Student select element is null');
        return;
    }

    try {
        console.log(`Fetching students for class: ${className}`);
        studentSelect.disabled = true;
        studentSelect.innerHTML = '<option value="">Loading students...</option>';
        
        const students = await fetchStudentsByClass(className);
        console.log(`Found ${students.length} students`, students);
        
        // Clear existing options
        studentSelect.innerHTML = '';
        
        // Add default option
        const defaultOption = document.createElement('option');
        defaultOption.value = '';
        defaultOption.textContent = students.length > 0 ? 'Select a student' : 'No students found';
        studentSelect.appendChild(defaultOption);
        
        // Add student options if available
        if (students.length > 0) {
            students.forEach(student => {
                const option = document.createElement('option');
                option.value = student._id || '';
                option.textContent = student.name || 'Unnamed Student';
                if (student.email) {
                    option.setAttribute('data-email', student.email);
                }
                studentSelect.appendChild(option);
            });
        }
        
        return students; // Return students for further processing if needed
    } catch (error) {
        console.error('Error populating students:', error);
        studentSelect.innerHTML = '<option value="">Error loading students</option>';
        throw error; // Re-throw to handle in the caller
    } finally {
        // Always re-enable the select, even if there was an error
        studentSelect.disabled = false;
    }
}

// Initialize library functionality when DOM is loaded
function initLibrary() {
    console.log('Initializing library functionality...');
    initModal();
    
    // Initialize filter elements
    const libraryClassFilter = document.getElementById('library-class-filter');
    const resetFiltersBtn = document.getElementById('reset-library-filters');
    
    // Add event delegation for class selection change (for student selection)
    document.addEventListener('change', async (e) => {
        console.log('Change event triggered on:', e.target.id);
        
        // Handle class selection for student dropdown
        if (e.target && e.target.id === 'classSelect') {
            console.log('Class selected:', e.target.value);
            const studentSelect = document.getElementById('studentSelect');
            if (studentSelect) {
                console.log('Found student select element');
                studentSelect.disabled = false;
                studentSelect.innerHTML = '<option value="">Loading students...</option>';
                try {
                    await populateStudentDropdown(e.target.value, studentSelect);
                    console.log('Student dropdown populated');
                } catch (error) {
                    console.error('Error populating student dropdown:', error);
                    studentSelect.innerHTML = '<option value="">Error loading students</option>';
                }
            } else {
                console.error('Student select element not found');
            }
        }
        
        // Handle library class filter change
        if (e.target && e.target.id === 'library-class-filter') {
            console.log('Library class filter changed:', e.target.value);
            loadLibraryWithFilters();
        }
    });
    
    // Initialize bulk actions
    if (libraryBulkDelete) {
        libraryBulkDelete.onclick = handleBulkDelete;
    }
    if (libraryBulkExport) {
        libraryBulkExport.onclick = handleBulkExport;
    }
    
    // Initialize search and filter events
    if (librarySearch) {
        librarySearch.addEventListener('input', debounce(loadLibraryWithFilters, 300));
    }
    if (libraryGenreFilter) {
        libraryGenreFilter.addEventListener('change', loadLibraryWithFilters);
    }
    if (libraryAuthorFilter) {
        libraryAuthorFilter.addEventListener('input', debounce(loadLibraryWithFilters, 300));
    }
    
    // Reset filters
    if (resetFiltersBtn) {
        resetFiltersBtn.addEventListener('click', () => {
            console.log('Resetting library filters');
            if (librarySearch) librarySearch.value = '';
            if (libraryGenreFilter) libraryGenreFilter.value = '';
            if (libraryClassFilter) libraryClassFilter.value = '';
            if (libraryAuthorFilter) libraryAuthorFilter.value = '';
            loadLibraryWithFilters();
        });
    }
    
    // Load initial library data
    if (libraryList) {
        loadLibraryWithFilters();
    }
}

// Make initLibrary available globally
window.initLibrary = initLibrary;

// Initialize modal functionality
function initModal() {
    console.log('Initializing modal...');
    const modal = document.getElementById('universal-edit-modal');
    const closeBtn = document.getElementById('close-universal-edit-modal');
    const form = document.getElementById('universal-edit-form');
    
    if (!modal) {
        console.error('❌ Modal element not found');
        return;
    }
    
    console.log('✅ Modal element found:', modal);
    
    // Add close button handler
    if (closeBtn) {
        console.log('✅ Close button found, adding click handler');
        closeBtn.addEventListener('click', () => {
            console.log('Close button clicked');
            hideModal(modal);
        });
    } else {
        console.warn('⚠️ Close button not found');
    }
    
    // Close modal when clicking outside content
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            console.log('Clicked outside modal content');
            hideModal(modal);
        }
    });
    
    // Close with Escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && modal.classList.contains('show')) {
            console.log('Escape key pressed');
            hideModal(modal);
        }
    });
    
    // Form submission handler
    if (form) {
        console.log('✅ Form found, adding submit handler');
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            console.log('Form submitted');
            
            const formData = new FormData(form);
            const bookId = formData.get('bookId');
            const classSelect = form.querySelector('#classSelect');
            const studentSelect = form.querySelector('#studentSelect');
            const selectedStudent = studentSelect.options[studentSelect.selectedIndex];
            const borrowerName = selectedStudent.textContent;
            const borrowerId = formData.get('studentId');
            const borrowerEmail = selectedStudent.getAttribute('data-email') || '';
            const dueDate = formData.get('dueDate');

            console.log('Form data:', { bookId, borrowerName, borrowerId, dueDate });
            
            try {
                const token = localStorage.getItem('token');
                const genre = formData.get('genre') || 'General';
                
                const response = await api.post(`/api/library/${bookId}/issue`, {
                    borrowerName,
                    borrowerId,
                    borrowerEmail,
                    dueDate,
                    className: classSelect.value,
                    genre: genre
                });
                
                let result;
                try {
                    result = await response.json();
                } catch (e) {
                    console.error('Error parsing response:', e);
                    throw new Error('Invalid response from server');
                }
                
                if (!response.ok) {
                    console.error('API Error:', result);
                    throw new Error(result.message || `Failed to issue book: ${response.status} ${response.statusText}`);
                }
                
                console.log('✅ Book issued successfully:', result);
                showNotification('Book issued successfully!', 'success');
                hideModal(modal);
                loadLibraryWithFilters(); // Refresh the book list
            } catch (error) {
                console.error('❌ Error issuing book:', error);
                showNotification(error.message || 'Failed to issue book', 'error');
            }
        });
    } else {
        console.warn('⚠️ Form element not found');
    }
    
    console.log('✅ Modal initialized successfully');
}

if (libraryForm) {
    libraryForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const title = document.getElementById('book-title').value;
        const author = document.getElementById('book-author').value;
        const year = document.getElementById('book-year').value;
        const className = document.getElementById('book-class').value;
        const status = document.getElementById('book-status').value;
        const copies = parseInt(document.getElementById('book-copies').value) || 1;
        
        if (!title || !author || !className) {
            alert('Please fill in all required fields');
            return;
        }
        
        if (copies < 1) {
            alert('Number of copies must be at least 1');
            return;
        }
        
        const token = localStorage.getItem('token');
        const bookData = { 
            title, 
            author, 
            year: year ? parseInt(year) : new Date().getFullYear(),
            className,
            status: status || 'available',
            copies: copies,
            available: status === 'available' ? copies : 0
        };
        
        console.log('Sending book data:', bookData);
        try {
            const newBook = await api.post('/api/library/books', bookData);
            
            if (!newBook.ok) {
                const errorText = await newBook.text();
                console.error('Failed to add book. Status:', newBook.status, 'Response:', errorText);
                alert(`Failed to add book: ${errorText || 'Unknown error'}`);
            } else {
                libraryForm.reset();
                loadLibraryWithFilters();
            }
        } catch (err) {
            alert('Network error');
        }
    });
}

// Attach filter listeners
if (librarySearch) librarySearch.addEventListener('input', () => loadLibraryWithFilters());
if (libraryGenreFilter) libraryGenreFilter.addEventListener('change', () => loadLibraryWithFilters());
if (libraryAuthorFilter) libraryAuthorFilter.addEventListener('input', () => loadLibraryWithFilters());

// --- Universal Modal Logic (Library) ---
const universalEditModal = document.getElementById('universal-edit-modal');
const closeUniversalEditModal = document.getElementById('close-universal-edit-modal');
const universalEditForm = document.getElementById('universal-edit-form');
const universalEditMsg = document.getElementById('universal-edit-msg');

const universalConfirmModal = document.getElementById('universal-confirm-modal');
const closeUniversalConfirmModal = document.getElementById('close-universal-confirm-modal');
const universalConfirmTitle = document.getElementById('universal-confirm-title');
const universalConfirmMessage = document.getElementById('universal-confirm-message');
const universalConfirmYes = document.getElementById('universal-confirm-yes');
const universalConfirmNo = document.getElementById('universal-confirm-no');

function openUniversalModal(modal) { 
    if (modal) modal.style.display = 'block'; 
}
function closeUniversalModal(modal) { 
    if (modal) modal.style.display = 'none'; 
}

if (closeUniversalEditModal) closeUniversalEditModal.onclick = () => closeUniversalModal(universalEditModal);
if (closeUniversalConfirmModal) closeUniversalConfirmModal.onclick = () => closeUniversalModal(universalConfirmModal);
window.onclick = function(event) {
  if (event.target === universalEditModal) closeUniversalModal(universalEditModal);
  if (event.target === universalConfirmModal) closeUniversalModal(universalConfirmModal);
};

// Bulk Delete
if (libraryBulkDelete) {
    libraryBulkDelete.onclick = async function() {
        if (selectedBookIds.size === 0) return;
        const universalConfirmModal = document.getElementById('universal-confirm-modal');
        const universalConfirmTitle = document.getElementById('universal-confirm-title');
        const universalConfirmMessage = document.getElementById('universal-confirm-message');
        const universalConfirmYes = document.getElementById('universal-confirm-yes');
        const universalConfirmNo = document.getElementById('universal-confirm-no');
        if (universalConfirmTitle) universalConfirmTitle.textContent = 'Delete Selected Books';
        if (universalConfirmMessage) universalConfirmMessage.textContent = `Are you sure you want to delete ${selectedBookIds.size} selected book(s)?`;
        if (universalConfirmModal) universalConfirmModal.style.display = 'block';
        if (universalConfirmYes) {
            universalConfirmYes.onclick = async () => {
                if (universalConfirmModal) universalConfirmModal.style.display = 'none';
                const token = localStorage.getItem('token');
                for (const bookId of selectedBookIds) {
                    try {
                        await api.delete(`/api/library/${bookId}`);
                    } catch {}
                }
                clearLibrarySelections();
                loadLibraryWithFilters();
            };
        }
        if (universalConfirmNo) universalConfirmNo.onclick = () => {
            if (universalConfirmModal) universalConfirmModal.style.display = 'none';
        };
    };
}

// Bulk Export
if (libraryBulkExport) {
    libraryBulkExport.onclick = async function() {
        if (selectedBookIds.size === 0) return;
        const token = localStorage.getItem('token');
        let url = 'http://localhost:5000/api/library';
        const res = await api.get(url);
        const books = await res.json();
        const selected = books.filter(b => selectedBookIds.has(b._id));
        let csv = 'Title,Author,Description\n';
        selected.forEach(b => {
            csv += `${b.title},${b.author},${b.description || ''}\n`;
        });
        const blob = new Blob([csv], { type: 'text/csv' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = 'selected_books.csv';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };
}

// Load issued books from the server
let issuedBooksData = [];

async function loadIssuedBooks() {
    try {
        const token = localStorage.getItem('token');
        if (!token) {
            throw new Error('Authentication required. Please log in again.');
        }
        
        // Show loading state
        const tableBody = document.getElementById('issued-books-list');
        if (tableBody) {
            tableBody.innerHTML = `<tr><td colspan="8" class="text-center py-4">
                <div class="spinner-border text-primary" role="status">
                    <span class="visually-hidden">Loading...</span>
                </div>
                <p class="mt-2 mb-0">Loading issued books...</p>
            </td></tr>`;
        }
        
        // Get selected class from filter
        const classFilter = document.getElementById('class-filter');
        const selectedClass = classFilter ? classFilter.value : 'All';
        
        issuedBooksData = await api.get('/api/library/issued-books');
        
        // Update class filter dropdown
        updateClassFilter(issuedBooksData);
        
        // Display books
        displayIssuedBooks(issuedBooksData);
    } catch (error) {
        console.error('Error loading issued books:', error);
        const tableBody = document.getElementById('issued-books-list');
        if (tableBody) {
            tableBody.innerHTML = `<tr><td colspan="8" class="text-center text-danger py-4">
                <i class="fas fa-exclamation-triangle me-2"></i>
                Failed to load issued books: ${error.message}
            </td></tr>`;
        }
        showNotification(`Error: ${error.message}`, 'error');
    }
}

// Update class filter dropdown
function updateClassFilter(books) {
    const classFilter = document.getElementById('classFilter');
    if (!classFilter) return;
    
    // Get all current options and their values
    const currentOptions = {};
    Array.from(classFilter.options).forEach(option => {
        currentOptions[option.value] = option.text;
    });
    
    // Get unique class names from the data
    const classSet = new Set();
    
    // Handle both grouped and ungrouped data structures
    if (Array.isArray(books)) {
        // Flat array of books
        books.forEach(book => {
            if (book.className) {
                classSet.add(book.className);
            }
        });
    } else if (typeof books === 'object' && books !== null) {
        // Grouped by class
        Object.keys(books).forEach(className => {
            classSet.add(className);
        });
    }
    
    // Add any new classes from the data that aren't already in the dropdown
    let newOptionsAdded = false;
    classSet.forEach(className => {
        if (!(className in currentOptions)) {
            // Find the appropriate optgroup based on class name
            let optgroup = null;
            if (['Baby Class', 'PP1', 'PP2'].includes(className)) {
                optgroup = 'Pre-Primary';
            } else if (className.startsWith('Grade 1') || className.startsWith('Grade 2') || className.startsWith('Grade 3')) {
                optgroup = 'Lower Primary';
            } else if (className.startsWith('Grade 4') || className.startsWith('Grade 5') || className.startsWith('Grade 6')) {
                optgroup = 'Upper Primary';
            } else if (className.startsWith('Grade 7') || className.startsWith('Grade 8') || className.startsWith('Grade 9')) {
                optgroup = 'Junior Secondary';
            } else if (className.startsWith('Grade 10') || className.startsWith('Grade 11') || className.startsWith('Grade 12')) {
                optgroup = 'Senior School';
            }
            
            // Add the new option to the appropriate optgroup
            if (optgroup) {
                const optgroupElement = Array.from(classFilter.getElementsByTagName('optgroup')).find(
                    og => og.label === optgroup
                );
                
                if (optgroupElement) {
                    const option = document.createElement('option');
                    option.value = className;
                    option.textContent = className;
                    optgroupElement.appendChild(option);
                    newOptionsAdded = true;
                }
            } else {
                // If no matching optgroup, add to the default options
                const option = new Option(className, className);
                classFilter.add(option);
                newOptionsAdded = true;
            }
        }
    });
    
    // If we added new options, sort each optgroup
    if (newOptionsAdded) {
        const select = classFilter;
        const optgroups = Array.from(select.getElementsByTagName('optgroup'));
        
        optgroups.forEach(optgroup => {
            const options = Array.from(optgroup.getElementsByTagName('option'));
            const sortedOptions = options.sort((a, b) => {
                // Extract numbers for proper numeric sorting (e.g., Grade 2 comes before Grade 10)
                const numA = parseInt(a.value.replace(/\D/g, '')) || 0;
                const numB = parseInt(b.value.replace(/\D/g, '')) || 0;
                return numA - numB || a.value.localeCompare(b.value);
            });
            
            // Clear and re-add sorted options
            while (optgroup.firstChild) {
                optgroup.removeChild(optgroup.firstChild);
            }
            
            sortedOptions.forEach(option => {
                optgroup.appendChild(option);
            });
        });
    }
}

// Normalize class name for comparison (e.g., 'Grade 1' -> 'grade1')
function normalizeClassName(className) {
    if (!className) return '';
    // Remove all spaces and convert to lowercase
    return className.replace(/\s+/g, '').toLowerCase();
}

// Filter issued books based on search and class filter
function filterIssuedBooks() {
    console.log('Filtering issued books...');
    const searchTerm = (document.getElementById('issued-books-search')?.value || '').toLowerCase();
    const selectedClass = document.getElementById('classFilter')?.value || 'All';
    const normalizedSelectedClass = normalizeClassName(selectedClass);
    const tableBody = document.getElementById('issued-books-list');
    
    if (!tableBody) return;
    
    const rows = tableBody.querySelectorAll('tr');
    let hasVisibleRows = false;
    
    console.log('Selected class:', selectedClass, 'Normalized:', normalizedSelectedClass);
    
    rows.forEach(row => {
        if (row.classList.contains('table-group')) {
            // Handle group headers
            const groupClass = row.getAttribute('data-class') || '';
            const normalizedGroupClass = normalizeClassName(groupClass);
            
            if (selectedClass !== 'All' && normalizedGroupClass !== normalizedSelectedClass) {
                row.style.display = 'none';
                return;
            }
            row.style.display = '';
            hasVisibleRows = true;
            return;
        }
        
        // Skip if it's a no-results row
        if (row.classList.contains('no-results-message')) {
            row.style.display = 'none';
            return;
        }
        
        // Get the book data from data attributes
        const bookClass = row.getAttribute('data-class') || '';
        const normalizedBookClass = normalizeClassName(bookClass);
        const bookTitle = (row.querySelector('td:nth-child(1)')?.textContent || '').toLowerCase();
        const borrowerName = (row.querySelector('td:nth-child(2)')?.textContent || '').toLowerCase();
        
        // Check if the row matches the search term and selected class
        const matchesSearch = !searchTerm || 
                            bookTitle.includes(searchTerm) || 
                            borrowerName.includes(searchTerm) ||
                            bookClass.toLowerCase().includes(searchTerm);
        
        const matchesClass = selectedClass === 'All' || 
                           normalizedBookClass === normalizedSelectedClass;
        
        if (matchesSearch && matchesClass) {
            row.style.display = '';
            hasVisibleRows = true;
        } else {
            row.style.display = 'none';
        }
    });
    
    // Show no results message if no rows are visible
    const noResultsRow = tableBody.querySelector('.no-results-message');
    if (!hasVisibleRows) {
        if (!noResultsRow) {
            const tr = document.createElement('tr');
            tr.className = 'no-results-message';
            tr.innerHTML = `
                <td colspan="8" class="text-center py-4">
                    <div class="text-muted">
                        <i class="fas fa-search fa-2x mb-2"></i>
                        <p class="mb-0">No books match your search criteria</p>
                    </div>
                </td>`;
            tableBody.appendChild(tr);
        } else {
            noResultsRow.style.display = '';
        }
    } else if (noResultsRow) {
        noResultsRow.style.display = 'none';
    }
}

// Display issued books in the table
function displayIssuedBooks(books) {
    console.log('Displaying issued books:', books);
    const tableBody = document.getElementById('issued-books-list');
    if (!tableBody) {
        console.error('Table body element not found');
        return;
    }
    
    if (!books || books.length === 0) {
        console.log('No books data to display');
        tableBody.innerHTML = `
            <tr>
                <td colspan="8" class="text-center py-4">
                    <div class="text-muted">
                        <i class="fas fa-inbox fa-2x mb-2"></i>
                        <p class="mb-0">No currently issued books found</p>
                    </div>
                </td>
            </tr>`;
        return;
    }
    
    let html = '';
    
    // Check if data is in the expected format
    if (typeof books !== 'object' || books === null) {
        console.error('Invalid books data format:', books);
        tableBody.innerHTML = `
            <tr>
                <td colspan="8" class="text-center text-danger py-4">
                    <i class="fas fa-exclamation-triangle me-2"></i>
                    Invalid data format received from server
                </td>
            </tr>`;
        return;
    }
    
    // Check if data is grouped by class
    const isGrouped = Array.isArray(books) && books.some(book => book._id && book.books);
    
    if (isGrouped) {
        console.log('Processing grouped books data');
        // Handle grouped data (by class)
        books.forEach(group => {
            const className = group._id || 'Ungrouped';
            const classBooks = group.books || [];
            
            if (classBooks.length > 0) {
                console.log(`Processing group: ${className} with ${classBooks.length} books`);
                // Add class header
                html += `
                    <tr class="table-group" data-class="${className.toLowerCase()}">
                        <td colspan="8" class="bg-light fw-bold">
                            <i class="fas fa-users me-2"></i>${className} (${classBooks.length} books)
                        </td>
                    </tr>`;
                
                // Add books for this class
                classBooks.forEach(book => {
                    html += renderIssuedBookRow(book);
                });
            }
        });
    } else {
        console.log('Processing flat books data');
        // Handle flat list of books
        books.forEach((book, index) => {
            console.log(`Book ${index + 1}:`, book);
            html += renderIssuedBookRow(book);
        });
    }
    
    tableBody.innerHTML = html || `
        <tr>
            <td colspan="8" class="text-center py-4 text-muted">
                No issued books found
            </td>
        </tr>`;
    
    // Add event listeners to return buttons
    document.querySelectorAll('.return-book-btn').forEach(btn => {
        btn.addEventListener('click', handleReturnBook);
    });
}

// Render a single issued book row
function renderIssuedBookRow(book) {
    console.log('Rendering book row:', book);
    
    if (!book) {
        console.error('No book data provided to renderIssuedBookRow');
        return '';
    }
    
    // Format issue date
    let issueDate = 'N/A';
    try {
        if (book.issueDate) {
            issueDate = new Date(book.issueDate).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            });
        }
    } catch (e) {
        console.error('Error formatting issue date:', e);
    }
    
    // Format due date
    let dueDate = 'N/A';
    let due = null;
    try {
        if (book.dueDate) {
            due = new Date(book.dueDate);
            dueDate = due.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                weekday: 'short'
            });
        }
    } catch (e) {
        console.error('Error formatting due date:', e);
    }
    
    // Calculate overdue status
    const today = new Date();
    const isOverdue = due && due < today && !book.returned;
    const daysOverdue = isOverdue ? Math.ceil((today - due) / (1000 * 60 * 60 * 24)) : 0;
    const fine = book.fine || 0;
    
    // Get class name, default to 'Ungrouped' if not provided
    const className = (book.className || book.doc?.className || 'Ungrouped').trim();
    console.log('Book class name:', className);
    
    return `
        <tr class="${isOverdue ? 'table-warning' : ''}" data-class="${className.toLowerCase()}">
            <td>
                <div class="fw-semibold">${book.title || 'Unknown Title'}</div>
                <div class="text-muted small">${book.author || 'Unknown Author'}</div>
            </td>
            <td>${book.borrowerName || 'Unknown Borrower'}</td>
            <td>${className}</td>
            <td>${issueDate}</td>
            <td class="${isOverdue ? 'text-danger fw-semibold' : ''}">
                ${dueDate}
                ${isOverdue ? `
                    <div class="badge bg-danger text-white mt-1">
                        ${daysOverdue} day${daysOverdue !== 1 ? 's' : ''} overdue
                    </div>
                ` : ''}
            </td>
            <td>
                <span class="badge ${book.returned ? 'bg-success' : 'bg-primary'}">
                    ${book.returned ? 'Returned' : 'Issued'}
                </span>
            </td>
            <td>
                ${fine > 0 ? `
                    <span class="badge bg-danger">
                        KES ${parseFloat(fine).toFixed(2)}
                    </span>
                ` : ''}
            </td>
            <td>
                ${!book.returned ? `
                    <button class="btn btn-sm btn-outline-primary return-book-btn" 
                            data-id="${book._id || ''}" 
                            data-book-id="${book.bookId || ''}"
                            data-bs-toggle="modal" 
                            data-bs-target="#returnBookModal"
                            data-book-title="${book.title || ''}"
                            data-borrower="${book.borrowerName || ''}"
                            data-fine="${fine}">
                        <i class="fas fa-undo me-1"></i> Return
                    </button>
                ` : ''}
            </td>
        </tr>`;
}

// Check if a book is overdue
function isOverdue(dueDate) {
    if (!dueDate) return false;
    const today = new Date();
    const due = new Date(dueDate);
    return due < today;
}

// Get status badge class based on return status
function getStatusClass(returned) {
    return returned ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800';
}

// Handle returning a book
function handleReturnBook(event) {
    event.preventDefault();
    
    const button = event.currentTarget;
    const issueId = button.getAttribute('data-id');
    const bookId = button.getAttribute('data-book-id');
    const bookTitle = button.getAttribute('data-book-title');
    const borrowerName = button.getAttribute('data-borrower');
    const fine = parseFloat(button.getAttribute('data-fine')) || 0;
    
    // Set up the return modal
    const modal = document.getElementById('returnBookModal');
    const modalInstance = new bootstrap.Modal(modal);
    
    // Update modal content
    modal.querySelector('.book-title').textContent = bookTitle;
    modal.querySelector('.borrower-name').textContent = borrowerName;
    modal.querySelector('.fine-amount').textContent = `KES ${fine.toFixed(2)}`;
    
    // Set up the form submission
    const returnForm = document.getElementById('returnBookForm');
    const submitBtn = returnForm.querySelector('button[type="submit"]');
    const cancelBtn = returnForm.querySelector('button[type="button"]');
    const finePaidInput = returnForm.querySelector('#finePaid');
    
    // Reset form
    returnForm.reset();
    finePaidInput.max = fine;
    finePaidInput.value = fine.toFixed(2);
    
    // Show/hide fine section based on whether there's a fine
    const fineSection = modal.querySelector('.fine-section');
    if (fine > 0) {
        fineSection.style.display = 'block';
    } else {
        fineSection.style.display = 'none';
    }
    
    // Handle form submission
    const handleSubmit = async (e) => {
        e.preventDefault();
        
        const finePaid = parseFloat(finePaidInput.value) || 0;
        
        // Validate fine paid
        if (finePaid > fine) {
            alert('Fine paid cannot be more than the fine amount');
            return;
        }
        
        // Disable form elements
        submitBtn.disabled = true;
        cancelBtn.disabled = true;
        submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Processing...';
        
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                throw new Error('Please log in to return books');
            }
            
            const response = await api.post(`/api/library/return/${issueId}`, {
                bookId,
                finePaid: finePaid
            });
            
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.error || 'Failed to return book');
            }
            
            // Show success message
            showNotification('Book returned successfully!', 'success');
            
            // Close the modal
            modalInstance.hide();
            
            // Refresh the issued books list
            loadIssuedBooks();
            
        } catch (error) {
            console.error('Error returning book:', error);
            showNotification(`Error: ${error.message}`, 'error');
            
            // Re-enable form elements
            submitBtn.disabled = false;
            cancelBtn.disabled = false;
            submitBtn.innerHTML = 'Confirm Return';
        }
    };
    
    // Remove previous event listeners to prevent duplicates
    const newForm = returnForm.cloneNode(true);
    returnForm.parentNode.replaceChild(newForm, returnForm);
    
    // Add event listener to the new form
    newForm.addEventListener('submit', handleSubmit);
    
    // Show the modal
    modalInstance.show();
}

// Show notification function
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    
    const container = document.getElementById('notification-container') || document.body;
    container.appendChild(notification);
    
    setTimeout(() => {
        notification.style.opacity = '0';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// Initialize search and filter functionality for issued books
function initIssuedBooksSearch() {
    const searchInput = document.getElementById('issued-books-search');
    const classFilter = document.getElementById('classFilter');
    const resetFiltersBtn = document.getElementById('resetFilters');
    
    let searchTimeout;
    
    // Handle search input
    if (searchInput) {
        searchInput.addEventListener('input', () => {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                filterIssuedBooks();
            }, 300);
        });
    }
    
    // Handle class filter change
    if (classFilter) {
        classFilter.addEventListener('change', () => {
            filterIssuedBooks();
        });
    }
    
    // Handle reset filters button
    if (resetFiltersBtn) {
        resetFiltersBtn.addEventListener('click', () => {
            if (searchInput) searchInput.value = '';
            if (classFilter) classFilter.value = '';
            filterIssuedBooks();
        });
    }
}

// Initialize when the script is loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        initLibrary();
        initIssuedBooksSearch();
        // Show available books tab by default
        showLibraryTab('available-books');
    });
} else {
    initLibrary();
    initIssuedBooksSearch();
    // Show available books tab by default
    showLibraryTab('available-books');
}
