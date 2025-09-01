(function() {
// Library Management Logic
const libraryForm = document.getElementById('library-form');
const libraryList = document.getElementById('library-list');
const librarySearch = document.getElementById('library-search');
const libraryGenreFilter = document.getElementById('library-genre-filter');
const libraryAuthorFilter = document.getElementById('library-author-filter');
const libraryBulkToolbar = document.getElementById('library-bulk-toolbar');
const libraryBulkDelete = document.getElementById('library-bulk-delete');
const libraryBulkExport = document.getElementById('library-bulk-export');
const selectAllLibrary = document.getElementById('select-all-library');
const libraryTableBody = document.getElementById('library-table-body');

let selectedBookIds = new Set();

// --- Advanced Filters for Library ---
function getLibraryFilters() {
    return {
        search: librarySearch.value.trim(),
        genre: libraryGenreFilter.value,
        author: libraryAuthorFilter.value.trim()
    };
}

function buildLibraryQueryString(filters) {
    const params = [];
    if (filters.search) params.push(`search=${encodeURIComponent(filters.search)}`);
    if (filters.genre) params.push(`genre=${encodeURIComponent(filters.genre)}`);
    if (filters.author) params.push(`author=${encodeURIComponent(filters.author)}`);
    return params.length ? '?' + params.join('&') : '';
}

async function loadLibraryWithFilters() {
    const token = localStorage.getItem('token');
    const filters = getLibraryFilters();
    let url = 'http://localhost:5000/api/library' + buildLibraryQueryString(filters);
    try {
        const res = await fetch(url, { headers: { 'Authorization': `Bearer ${token}` } });
        const books = await res.json();
        libraryTableBody.innerHTML = '';
        if (Array.isArray(books) && books.length > 0) {
            books.forEach(book => {
                libraryTableBody.insertAdjacentHTML('beforeend', renderBookRow(book));
            });
        } else {
            libraryTableBody.innerHTML = '<tr><td colspan="5">No books found.</td></tr>';
        }
        // Add event delegation for table actions
        if (libraryTableBody) {
            // Remove any existing event listeners by cloning the table body
            const newTableBody = libraryTableBody.cloneNode(true);
            libraryTableBody.parentNode.replaceChild(newTableBody, libraryTableBody);
            libraryTableBody = newTableBody; // Update the reference
            
            // Add the event listener to the new table body
            newTableBody.addEventListener('click', async (e) => {
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
                    console.log('Issue button clicked');
                    
                    // Check if button is disabled
                    if (btn.disabled) {
                        console.log('Button is disabled - no available copies');
                        return;
                    }
                    
                    const bookId = btn.getAttribute('data-id');
                    console.log('Book ID:', bookId);
                    
                    // Get book details from the row
                    const row = btn.closest('tr');
                    const bookTitle = row.cells[1].textContent;
                    const availableCopies = parseInt(row.cells[6].textContent);
                    
                    console.log('Book:', bookTitle, 'Available:', availableCopies);
                    
                    // Show the issue form
                    const universalModal = document.getElementById('universal-edit-modal');
                    const universalForm = document.getElementById('universal-edit-form');
                    
                    if (!universalModal || !universalForm) {
                        console.error('Required modal elements not found');
                        return;
                    }
                    
                    // Set up the modal for issuing a book
                    document.getElementById('universal-edit-title').textContent = `Issue Book: ${bookTitle}`;
                    universalForm.innerHTML = `
                        <div class="form-group">
                            <label for="borrower-name">Borrower Name *</label>
                            <input type="text" id="borrower-name" class="form-control" required>
                        </div>
                        <div class="form-group">
                            <label for="borrower-id">Borrower ID/Email *</label>
                            <input type="text" id="borrower-id" class="form-control" required>
                        </div>
                        <div class="form-group">
                            <label for="due-date">Due Date *</label>
                            <input type="date" id="due-date" class="form-control" required 
                                   min="${new Date().toISOString().split('T')[0]}">
                        </div>
                        <div class="form-buttons">
                            <button type="button" class="cancel-btn" onclick="closeUniversalModal(universalModal)">Cancel</button>
                            <button type="submit" class="submit-btn">Issue Book</button>
                        </div>`;
                    
                    // Show the modal
                    universalModal.style.display = 'block';
                    
                    // Handle form submission
                    universalForm.onsubmit = async (e) => {
                        e.preventDefault();
                        
                        const borrowerName = document.getElementById('borrower-name').value.trim();
                        const borrowerId = document.getElementById('borrower-id').value.trim();
                        const dueDate = document.getElementById('due-date').value;
                        
                        if (!borrowerName || !borrowerId || !dueDate) {
                            alert('Please fill in all required fields');
                            return;
                        }
                        
                        try {
                            const token = localStorage.getItem('token');
                            const response = await fetch(`http://localhost:5000/api/library/${bookId}/issue`, {
                                method: 'POST',
                                headers: {
                                    'Content-Type': 'application/json',
                                    'Authorization': `Bearer ${token}`
                                },
                                body: JSON.stringify({
                                    borrowerName,
                                    borrowerId,
                                    dueDate
                                })
                            });
                            
                            const result = await response.json();
                            
                            if (response.ok) {
                                alert('Book issued successfully!');
                                closeUniversalModal(universalModal);
                                loadLibraryWithFilters(); // Refresh the book list
                            } else {
                                throw new Error(result.error || 'Failed to issue book');
                            }
                        } catch (error) {
                            console.error('Error issuing book:', error);
                            alert(`Error: ${error.message}`);
                        }
                    };
                        <div class="form-buttons">
                            <button type="button" class="cancel-btn" onclick="closeUniversalModal(universalModal)">Cancel</button>
                            <button type="submit" class="submit-btn">Issue Book</button>
                        </div>
                    `;
                    
                    // Show the modal
                    universalModal.style.display = 'block';
                    
                    // Handle form submission
                    const handleSubmit = async (e) => {
                        e.preventDefault();
                        
                        const borrowerName = document.getElementById('borrower-name').value.trim();
                        const borrowerId = document.getElementById('borrower-id').value.trim();
                        const dueDate = document.getElementById('due-date').value;
                        
                        if (!borrowerName || !borrowerId || !dueDate) {
                            alert('Please fill in all required fields');
                            return;
                        }
                        
                        try {
                            const token = localStorage.getItem('token');
                            const response = await fetch(`http://localhost:5000/api/library/${bookId}/issue`, {
                                method: 'POST',
                                headers: {
                                    'Content-Type': 'application/json',
                                    'Authorization': `Bearer ${token}`
                                },
                                body: JSON.stringify({
                                    borrowerName,
                                    borrowerId,
                                    dueDate
                                })
                            });
                            
                            const result = await response.json();
                            
                            if (response.ok) {
                                alert('Book issued successfully!');
                                closeUniversalModal(universalModal);
                                loadLibraryWithFilters(); // Refresh the book list
                            } else {
                                    
                                    const result = await res.json();
                                    
                                    if (res.ok) {
                                        if (universalMsg) {
                                            universalMsg.textContent = 'Book issued successfully!';
                                            universalMsg.style.color = 'green';
                                            universalMsg.style.display = 'block';
                                        }
                                        setTimeout(() => {
                                            if (universalModal) universalModal.style.display = 'none';
                                            loadLibraryWithFilters();
                                        }, 1000);
                                    } else {
                                        throw new Error(result.error || 'Failed to issue book');
                                    }
                                } catch (error) {
                                    if (universalMsg) {
                                        universalMsg.textContent = error.message || 'Error issuing book';
                                        universalMsg.style.color = 'red';
                                        universalMsg.style.display = 'block';
                                    }
                                }
                            };
                            
                            // Add cancel button handler
                            const cancelBtn = universalForm.querySelector('.cancel-btn');
                            if (cancelBtn) {
                                cancelBtn.onclick = () => {
                                    if (universalModal) universalModal.style.display = 'none';
                                };
                            }
                        }
                    }
                }
                // Delete Book (universal confirm modal)
                else if (btn.classList.contains('delete-book-btn')) {
                    const universalConfirmModal = document.getElementById('universal-confirm-modal');
                    const universalConfirmTitle = document.getElementById('universal-confirm-title');
                    const universalConfirmMessage = document.getElementById('universal-confirm-message');
                    const universalConfirmYes = document.getElementById('universal-confirm-yes');
                    const universalConfirmNo = document.getElementById('universal-confirm-no');
                    if (universalConfirmTitle) universalConfirmTitle.textContent = 'Delete Book';
                    if (universalConfirmMessage) universalConfirmMessage.textContent = 'Are you sure you want to delete this book?';
                    if (universalConfirmModal) universalConfirmModal.style.display = 'block';
                    if (universalConfirmYes) {
                        universalConfirmYes.onclick = async () => {
                            if (universalConfirmModal) universalConfirmModal.style.display = 'none';
                            try {
                                const res = await fetch(`http://localhost:5000/api/library/${bookId}`, {
                                    method: 'DELETE',
                                    headers: { 'Authorization': `Bearer ${token}` }
                                });
                                if (res.ok) {
                                    loadLibraryWithFilters();
                                }
                            } catch {}
                        };
                    }
                    if (universalConfirmNo) universalConfirmNo.onclick = () => {
                        if (universalConfirmModal) universalConfirmModal.style.display = 'none';
                    };
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
            <button class="issue-book-btn" data-id="${book._id}" ${book.available < 1 ? 'disabled' : ''}>Issue</button>
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

if (libraryForm) {
    libraryForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const title = document.getElementById('book-title').value;
        const author = document.getElementById('book-author').value;
        const year = document.getElementById('book-year').value;
        const genre = document.getElementById('book-genre').value;
        const status = document.getElementById('book-status').value;
        const copies = parseInt(document.getElementById('book-copies').value) || 1;
        
        if (!title || !author || !genre) {
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
            genre,
            status: status || 'available',
            copies: copies,
            available: status === 'available' ? copies : 0
        };
        
        console.log('Sending book data:', bookData);
        try {
            const res = await fetch('http://localhost:5000/api/library', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify(bookData)
            });
            
            const responseData = await res.json().catch(() => ({}));
            console.log('Server response:', responseData);
            if (res.ok) {
                libraryForm.reset();
                loadLibraryWithFilters();
            } else {
                const errorText = await res.text();
            console.error('Failed to add book. Status:', res.status, 'Response:', errorText);
            alert(`Failed to add book: ${errorText || 'Unknown error'}`);
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
                        await fetch(`http://localhost:5000/api/library/${bookId}`, {
                            method: 'DELETE',
                            headers: { 'Authorization': `Bearer ${token}` }
                        });
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
        const res = await fetch(url, { headers: { 'Authorization': `Bearer ${token}` } });
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

if (libraryList) loadLibraryWithFilters();

})();
