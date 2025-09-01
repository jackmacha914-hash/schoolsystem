// Admin User Management - Initialize DOM elements safely
function getElementSafely(id, context = document) {
    const element = context.getElementById ? context.getElementById(id) : null;
    if (!element) {
        console.warn(`Element with ID '${id}' not found`);
    }
    return element;
}

// Main UI Elements
const elements = {
    // Export button
    userExportBtn: getElementSafely('export-users-btn'),
    // Forms and Tables
    addUserForm: getElementSafely('add-user-form'),
    userAddMsg: getElementSafely('user-add-msg'),
    userTableBody: document.querySelector('#user-table tbody'),
    userSearch: getElementSafely('user-search'),
    usersBulkToolbar: getElementSafely('users-bulk-toolbar'),
    usersBulkDelete: getElementSafely('users-bulk-delete'),
    usersBulkExport: getElementSafely('users-bulk-export'),
    selectAllUsers: getElementSafely('select-all-users'),
    userRoleFilter: getElementSafely('user-role-filter'),
    userStatusFilter: getElementSafely('user-status-filter'),
    
    // Edit Form Elements
    editUserId: getElementSafely('edit-user-id'),
    editName: getElementSafely('edit-user-name'),
    editEmail: getElementSafely('edit-user-email'),
    editUsername: getElementSafely('edit-user-username'),
    editRole: getElementSafely('edit-user-role'),
    
    // Modals
    modals: {
        edit: {
            modal: getElementSafely('user-edit-modal'),
            closeBtn: getElementSafely('close-user-edit-modal'),
            form: getElementSafely('user-edit-form'),
            msg: getElementSafely('user-edit-msg')
        },
        confirm: {
            modal: getElementSafely('universal-confirm-modal'),
            closeBtn: getElementSafely('close-universal-confirm-modal'),
            title: getElementSafely('universal-confirm-title'),
            message: getElementSafely('universal-confirm-message'),
            yesBtn: getElementSafely('universal-confirm-yes'),
            noBtn: getElementSafely('universal-confirm-no')
        }
    }
};

// State management
const state = {
    selectedUserIds: new Set()
};

// Initialize modals and event listeners
document.addEventListener('DOMContentLoaded', () => {
    // Initialize modal close buttons
    if (elements.modals.edit.closeBtn && elements.modals.edit.modal) {
        elements.modals.edit.closeBtn.onclick = () => closeModal('edit');
    }
    
    if (elements.modals.confirm.closeBtn && elements.modals.confirm.modal) {
        elements.modals.confirm.closeBtn.onclick = () => closeModal('confirm');
    }
    
    // Close modals when clicking outside
    window.onclick = (event) => {
        if (elements.modals.edit.modal && event.target === elements.modals.edit.modal) {
            closeModal('edit');
        }
        if (elements.modals.confirm.modal && event.target === elements.modals.confirm.modal) {
            closeModal('confirm');
        }
    };
    
    // Initialize search and filter event listeners
    if (elements.userSearch) {
        elements.userSearch.addEventListener('input', () => loadUsersWithFilters());
    }
    if (elements.userRoleFilter) {
        elements.userRoleFilter.addEventListener('change', () => loadUsersWithFilters());
    }
    if (elements.userStatusFilter) {
        elements.userStatusFilter.addEventListener('change', () => loadUsersWithFilters());
    }
    
    // Load initial data
    if (elements.userTableBody) {
        loadUsersWithFilters();
    }
});

// Modal helper functions
function openModal(modalType) {
    const modal = elements.modals[modalType]?.modal;
    if (!modal) {
        console.error(`Modal '${modalType}' not found`);
        return;
    }
    
    // Add a class to body to prevent scrolling when modal is open
    document.body.classList.add('modal-open');
    
    // Show the modal
    modal.classList.add('show');
    
    // Focus the first focusable element in the modal
    setTimeout(() => {
        const focusable = modal.querySelector('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
        if (focusable) focusable.focus();
    }, 100);
}

function closeModal(modalType) {
    const modal = elements.modals[modalType]?.modal;
    if (!modal) {
        console.error(`Modal '${modalType}' not found`);
        return;
    }
    
    // Hide the modal with animation
    modal.classList.remove('show');
    
    // Remove the body class to re-enable scrolling
    document.body.classList.remove('modal-open');
    
    // Clear any form messages
    const msgElement = elements.modals[modalType]?.msg;
    if (msgElement) {
        msgElement.textContent = '';
        msgElement.classList.add('hidden');
    }
    
    // Reset the form
    const form = elements.modals[modalType]?.form;
    if (form) {
        form.reset();
    }
}

function renderUserRow(user) {
    try {
        // Skip invalid users
        if (!user || (user._id === null || user._id === undefined)) {
            console.warn('Skipping invalid user data:', user);
            return '';
        }
        
        // Ensure we have required fields with defaults
        const userId = String(user._id || '');
        const userName = String(user.name || 'Unnamed User').substring(0, 50);
        const userEmail = String(user.email || 'No email').substring(0, 50);
        const userRole = String(user.role || 'student');
        const userStatus = String(user.status || 'active');
        const statusClass = userStatus.toLowerCase() === 'active' ? 'success' : 'secondary';
        
        // Create a safe ID for checkboxes to avoid duplicate IDs
        const checkboxId = `user-select-${userId}`;
        
        // Debug log for user being rendered
        console.log('Rendering user row:', { userId, userName, userRole });
        
        return `
            <tr data-user-id="${userId}">
                <td>
                    <div class="form-check">
                        <input type="checkbox" class="form-check-input user-select" 
                               id="${checkboxId}" value="${userId}">
                        <label class="form-check-label" for="${checkboxId}"></label>
                    </div>
                </td>
                <td>${escapeHtml(userName)}</td>
                <td>${escapeHtml(userEmail)}</td>
                <td>
                    <span class="badge bg-${userRole === 'admin' ? 'danger' : 'primary'}">
                        ${escapeHtml(userRole)}
                    </span>
                </td>
                <td>
                    <span class="badge bg-${statusClass}">
                        ${escapeHtml(userStatus)}
                    </span>
                </td>
                <td class="text-nowrap">
                    <button type="button" class="btn btn-sm btn-outline-primary edit-user-btn me-1" 
                            title="Edit user" data-id="${userId}">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button type="button" class="btn btn-sm btn-outline-danger delete-user-btn" 
                            title="Delete user" data-id="${userId}">
                        <i class="fas fa-trash"></i>
                    </button>
                    ${userRole === 'student' ? `
                    <button type="button" class="btn btn-sm btn-outline-warning reset-password-btn" 
                            title="Reset password" data-id="${userId}">
                        <i class="fas fa-key"></i>
                    </button>` : ''}
                </td>
            </tr>`;
    } catch (error) {
        console.error('Error rendering user row:', error, user);
        return '';
    }
}

// Helper function to escape HTML
function escapeHtml(unsafe) {
    if (typeof unsafe !== 'string') return '';
    return unsafe
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function updateBulkToolbarState() {
    if (!elements.usersBulkToolbar || !elements.usersBulkDelete || !elements.usersBulkExport) return;
    
    const hasSelection = state.selectedUserIds.size > 0;
    elements.usersBulkToolbar.style.display = hasSelection ? 'block' : 'none';
    elements.usersBulkDelete.disabled = !hasSelection;
    elements.usersBulkExport.disabled = !hasSelection;
}

function clearUserSelections() {
    state.selectedUserIds.clear();
    const checkboxes = document.querySelectorAll('.user-select-checkbox');
    checkboxes.forEach(checkbox => {
        if (checkbox) checkbox.checked = false;
    });
    
    if (elements.selectAllUsers) {
        elements.selectAllUsers.checked = false;
    }
    
    updateBulkToolbarState();
}

// --- Advanced Filters for Users ---
function getUserFilters() {
    if (!elements.userSearch || !elements.userRoleFilter || !elements.userStatusFilter) {
        return { search: '', role: '', status: '' };
    }
    
    return {
        search: elements.userSearch.value.trim(),
        role: elements.userRoleFilter.value,
        status: elements.userStatusFilter.value
    };
}

function buildUserQueryString(filters) {
    const params = new URLSearchParams();
    if (filters.search) params.append('search', filters.search);
    if (filters.role) params.append('role', filters.role);
    if (filters.status) params.append('status', filters.status);
    return params.toString();
}

async function loadUsersWithFilters() {
    if (!elements.userTableBody) {
        console.error('User table body element not found');
        return;
    }
    
    // Show loading state
    elements.userTableBody.innerHTML = '<tr><td colspan="6" class="text-center">Loading users...</td></tr>';
    
    const filters = getUserFilters();
    const queryString = buildUserQueryString(filters);
    
    try {
        const token = localStorage.getItem('token');
        if (!token) {
            const errorMsg = 'No authentication token found. Please log in again.';
            console.error(errorMsg);
            elements.userTableBody.innerHTML = `<tr><td colspan="6" class="text-center text-danger">${errorMsg}</td></tr>`;
            showNotification(errorMsg, 'error');
            // Redirect to login if not already there
            if (!window.location.pathname.includes('login')) {
                window.location.href = '/login.html';
            }
            return;
        }
        
        // First try the new API endpoint
        let apiUrl = `http://localhost:5000/api/users?${queryString}`;
        console.log('Fetching users from:', apiUrl);
        
        let response;
        try {
            response = await fetch(apiUrl, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                credentials: 'include' // Include cookies for session handling
            });
        } catch (networkError) {
            console.error('Network error:', networkError);
            // Try fallback endpoint if first attempt fails
            apiUrl = `http://localhost:8000/api/users?${queryString}`;
            console.log('Trying fallback endpoint:', apiUrl);
            response = await fetch(apiUrl, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                credentials: 'include'
            });
        }
        
        console.log('Response status:', response.status);
        
        if (response.status === 401) {
            // Token expired or invalid
            localStorage.removeItem('token');
            window.location.href = '/login.html?session=expired';
            return;
        }
        
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
        }
        
        let responseData = await response.json();
        console.log('API Response:', responseData);
        
        // Clear existing rows
        elements.userTableBody.innerHTML = '';
        
        // Handle different response formats and filter out invalid users
        let users = [];
        
        // Normalize the response data into an array of users
        if (responseData) {
            // Case 1: Response has a 'users' array
            if (Array.isArray(responseData.users)) {
                users = responseData.users;
            } 
            // Case 2: Response is directly an array
            else if (Array.isArray(responseData)) {
                users = responseData;
            }
            // Case 3: Response has a 'data' array
            else if (Array.isArray(responseData.data)) {
                users = responseData.data;
            }
            // Case 4: Single user object
            else if (responseData._id) {
                users = [responseData];
            }
        }
        
        // Filter out any invalid users and log them
        const validUsers = [];
        const invalidUsers = [];
        
        users.forEach(user => {
            if (user && (user._id !== null && user._id !== undefined)) {
                validUsers.push(user);
            } else {
                invalidUsers.push(user);
            }
        });
        
        if (invalidUsers.length > 0) {
            console.warn(`Filtered out ${invalidUsers.length} invalid users:`, invalidUsers);
        }
        
        users = validUsers;
        
        console.log(`Loaded ${users.length} valid users`);
        
        // Always clear the table, even if no users
        elements.userTableBody.innerHTML = '';
        
        if (users.length > 0) {
            const fragment = document.createDocumentFragment();
            
            // Add each user row to the fragment
            users.forEach(user => {
                try {
                    const rowHtml = renderUserRow(user);
                    if (rowHtml) {
                        const tr = document.createElement('tr');
                        tr.innerHTML = rowHtml;
                        if (tr.firstElementChild) {
                            fragment.appendChild(tr);
                        }
                    }
                } catch (error) {
                    console.error('Error rendering user row:', error, user);
                }
            });
            
            // Add all rows at once for better performance
            elements.userTableBody.appendChild(fragment);
            
            // Add event listeners to the new rows
            attachRowEventListeners();
            
            // Update bulk actions state
            updateBulkToolbarState();
            
            // Update the count display if it exists
            const countElement = document.getElementById('user-count');
            if (countElement) {
                countElement.textContent = users.length;
            }
        } else {
            // Show empty state message
            elements.userTableBody.innerHTML = `
                <tr>
                    <td colspan="6" class="text-center text-muted py-4">
                        <i class="fas fa-users-slash fa-2x mb-2"></i>
                        <p class="mb-0">No users found. Try adjusting your search criteria.</p>
                    </td>
                </tr>`;
        }
    } catch (error) {
        console.error('Error loading users:', error);
        const errorMessage = error.message || 'Failed to load users. Please try again.';
        
        if (elements.userTableBody) {
            elements.userTableBody.innerHTML = `
                <tr>
                    <td colspan="6" class="text-center text-danger py-4">
                        <i class="fas fa-exclamation-circle fa-2x mb-2"></i>
                        <p class="mb-1">${errorMessage}</p>
                        <small class="text-muted">Please check the console for details.</small>
                    </td>
                </tr>`;
        }
        
        showNotification(errorMessage, 'error');
        
        // If it's an authentication error, redirect to login
        if (error.message && (error.message.includes('401') || error.message.includes('authentication'))) {
            localStorage.removeItem('token');
            window.location.href = '/login.html?error=session_expired';
        }
    }
}

// Add new user
if (elements.addUserForm) {
    elements.addUserForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        // Clear any previous messages
        if (elements.userAddMsg) {
            elements.userAddMsg.style.display = 'none';
        }
        
        const name = document.getElementById('user-name')?.value;
        const email = document.getElementById('user-email')?.value;
        const username = document.getElementById('user-username')?.value;
        const role = document.getElementById('user-role')?.value;
        const password = document.getElementById('user-password')?.value;
        
        // Basic validation
        if (!name || !email || !username || !role || !password) {
            showNotification('Please fill in all required fields', 'error');
            return;
        }
        
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                throw new Error('Authentication required. Please log in again.');
            }
            
            const response = await fetch('/api/users', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ 
                    name: name.trim(), 
                    email: email.trim().toLowerCase(), 
                    username: username.trim(), 
                    role: role,
                    password: password
                })
            });
            
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.message || 'Failed to add user');
            }
            
            // Success - reset form and refresh user list
            showNotification('User added successfully', 'success');
            if (elements.addUserForm) {
                elements.addUserForm.reset();
            }
            
            // Refresh the users list
            await loadUsersWithFilters();
            
        } catch (error) {
            console.error('Error adding user:', error);
            showNotification(error.message || 'Error adding user', 'error');
        }
    });
}

// Export users as CSV
if (elements.userExportBtn) {
    elements.userExportBtn.addEventListener('click', async () => {
        const token = localStorage.getItem('token');
        if (!token) {
            showNotification('Authentication required. Please log in again.', 'error');
            return;
        }
        
        try {
            const baseUrl = window.location.origin;
            const endpoints = [
                `${baseUrl}/api/users`,
                'http://localhost:5000/api/users',
                'http://localhost:8000/api/users'
            ];
            
            let users = [];
            let success = false;
            
            for (const endpoint of endpoints) {
                try {
                    const res = await fetch(endpoint, {
                        headers: { 
                            'Authorization': `Bearer ${token}`,
                            'Accept': 'application/json'
                        }
                    });
                    
                    if (res.ok) {
                        const data = await res.json();
                        users = Array.isArray(data) ? data : [];
                        success = true;
                        break;
                    }
                } catch (error) {
                    console.error(`Error fetching users from ${endpoint}:`, error);
                }
            }
            
            if (!success) {
                throw new Error('Failed to fetch users from any endpoint');
            }
            
            let csv = 'Name,Email,Username,Role,Status\n';
            users.forEach(u => {
                csv += `"${u.name || ''}","${u.email || ''}","${u.username || ''}","${u.role || ''}","${u.status || 'Active'}"\n`;
            });
            
            const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
            const blobUrl = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.setAttribute('href', blobUrl);
            link.setAttribute('download', `users_${new Date().toISOString().split('T')[0]}.csv`);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            setTimeout(() => {
                document.body.removeChild(link);
                window.URL.revokeObjectURL(blobUrl);
            }, 100);
        } catch (err) {
            alert('Failed to export users');
        }
    });
}

// Bulk Delete
if (usersBulkDelete) {
    usersBulkDelete.onclick = function() {
        if (selectedUserIds.size === 0) return;
        universalConfirmTitle.textContent = 'Delete Selected Users';
        universalConfirmMessage.textContent = `Are you sure you want to delete ${selectedUserIds.size} selected user(s)?`;
        openUniversalModal(universalConfirmModal);
        universalConfirmYes.onclick = async () => {
            closeUniversalModal(universalConfirmModal);
            const token = localStorage.getItem('token');
            for (const userId of selectedUserIds) {
                try {
                    await fetch(`http://localhost:5000/api/users/${userId}`, {
                        method: 'DELETE',
                        headers: { 'Authorization': `Bearer ${token}` }
                    });
                } catch {}
            }
            clearUserSelections();
            loadUsersWithFilters();
        };
        universalConfirmNo.onclick = () => closeUniversalModal(universalConfirmModal);
    };
}

// Bulk Export
if (usersBulkExport) {
    usersBulkExport.onclick = async function() {
        if (selectedUserIds.size === 0) return;
        const token = localStorage.getItem('token');
        let url = 'http://localhost:5000/api/users';
        const res = await fetch(url, { headers: { 'Authorization': `Bearer ${token}` } });
        const users = await res.json();
        const selected = users.filter(u => selectedUserIds.has(u._id));
        let csv = 'Name,Email,Username,Role\n';
        selected.forEach(u => {
            csv += `${u.name},${u.email},${u.username},${u.role}\n`;
        });
        const blob = new Blob([csv], { type: 'text/csv' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = 'selected_users.csv';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };
}

// --- Universal Modal Logic ---
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

// Modal helper functions
function openUniversalModal(modal) { 
    if (modal) modal.style.display = 'block'; 
}

function closeUniversalModal(modal) { 
    if (modal) modal.style.display = 'none'; 
}

// Initialize modal event listeners
document.addEventListener('DOMContentLoaded', () => {
    // Edit modal close button
    if (closeUniversalEditModal && universalEditModal) {
        closeUniversalEditModal.onclick = () => closeUniversalModal(universalEditModal);
    }
    
    // Confirm modal close button
    if (closeUniversalConfirmModal && universalConfirmModal) {
        closeUniversalConfirmModal.onclick = () => closeUniversalModal(universalConfirmModal);
    }
    
    // Close modals when clicking outside
    window.onclick = function(event) {
        if (universalEditModal && event.target === universalEditModal) {
            closeUniversalModal(universalEditModal);
        }
        if (universalConfirmModal && event.target === universalConfirmModal) {
            closeUniversalModal(universalConfirmModal);
        }
    };
});

// Helper function to get user by ID
async function getUserById(userId) {
    const token = localStorage.getItem('token');
    if (!token) {
        showNotification('Authentication required. Please log in again.', 'error');
        return null;
    }
    
    const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
    };
    
    // Base URL from window.location to handle different environments
    const baseUrl = window.location.origin;
    
    // Try multiple endpoints - note the backend mounts schoolUserRoutes at /api/users
    const endpoints = [
        // Try the primary endpoint first
        `${baseUrl}/api/users/${userId}`,
        // Fallback to other possible endpoints
        `http://localhost:5000/api/users/${userId}`,
        `http://localhost:8000/api/users/${userId}`,
        // Keep these as last resort in case the backend changes
        `${baseUrl}/api/school-users/${userId}`,
        `http://localhost:5000/api/school-users/${userId}`,
        `http://localhost:8000/api/school-users/${userId}`
    ];
    
    for (const endpoint of endpoints) {
        try {
            console.log(`Trying to fetch user from: ${endpoint}`);
            const response = await fetch(endpoint, { 
                headers,
                credentials: 'include' // Include cookies if needed for auth
            });
            
            console.log('Response status:', response.status, response.statusText);
            
            if (response.ok) {
                const data = await response.json();
                console.log('Successfully fetched user data:', data);
                return data;
            } else if (response.status !== 404) {
                // For non-404 errors, log the error but continue trying other endpoints
                const errorData = await response.json().catch(() => ({}));
                console.error(`Error from ${endpoint}:`, {
                    status: response.status,
                    statusText: response.statusText,
                    error: errorData
                });
            }
        } catch (error) {
            console.error(`Error fetching from ${endpoint}:`, error);
        }
    }
    
    // If we get here, all endpoints failed
    console.error('All endpoints failed for user ID:', userId);
    showNotification('Error: Could not load user data. The user might not exist or you may not have permission.', 'error');
    return null;
}

// Event delegation for user actions
document.addEventListener('click', async (e) => {
    const btn = e.target.closest('.edit-user-btn, .delete-user-btn, .reset-user-btn');
    if (!btn) return;
    
    const userId = btn.getAttribute('data-id');
    if (!userId) return;
    
    try {
        // Handle Edit User
        if (btn.classList.contains('edit-user-btn')) {
            const user = await getUserById(userId);
            if (user) {
                openEditUserModal(user);
            }
        }
        // Handle Delete User
        else if (btn.classList.contains('delete-user-btn')) {
            const user = await getUserById(userId);
            if (user) {
                confirmDeleteUser(userId, user.name || 'this user');
            }
        }
        // Handle Reset Password
        else if (btn.classList.contains('reset-user-btn')) {
            const user = await getUserById(userId);
            if (!user) return;
            
            // Set up confirmation dialog
            elements.modals.confirm.title.textContent = 'Reset Password';
            elements.modals.confirm.message.textContent = `Send password reset email to ${user.name || 'this user'}?`;
            
            // Clone and replace the yes button to avoid duplicate event listeners
            const confirmYesBtn = elements.modals.confirm.yesBtn;
            const newYesBtn = confirmYesBtn.cloneNode(true);
            confirmYesBtn.parentNode.replaceChild(newYesBtn, confirmYesBtn);
            elements.modals.confirm.yesBtn = newYesBtn;
            
            // Set up click handler
            newYesBtn.onclick = async () => {
                try {
                    const token = localStorage.getItem('token');
                    if (!token) {
                        throw new Error('Authentication required');
                    }
                    
                    const response = await fetch(`/api/users/${userId}/reset-password`, {
                        method: 'POST',
                        headers: { 
                            'Authorization': `Bearer ${token}`,
                            'Content-Type': 'application/json'
                        }
                    });
                    
                    if (!response.ok) {
                        const data = await response.json();
                        throw new Error(data.message || 'Failed to send reset email');
                    }
                    
                    showNotification('Password reset email sent successfully', 'success');
                    closeModal('confirm');
                    
                } catch (error) {
                    console.error('Error sending reset email:', error);
                    showNotification(error.message || 'Error sending reset email', 'error');
                    closeModal('confirm');
                }
            };
            
            // Show the confirmation modal
            openModal('confirm');
        }
    } catch (error) {
        console.error('Error handling user action:', error);
        showNotification('An error occurred. Please try again.', 'error');
    }
});

// Handle bulk delete action
async function handleBulkDelete() {
    if (state.selectedUserIds.size === 0) {
        showNotification('Please select at least one user to delete', 'warning');
        return;
    }
    
    // Set up confirmation dialog
    elements.modals.confirm.title.textContent = 'Confirm Bulk Delete';
    elements.modals.confirm.message.textContent = `Are you sure you want to delete ${state.selectedUserIds.size} selected user(s)? This action cannot be undone.`;
    
    // Clone and replace the yes button to avoid duplicate event listeners
    const confirmYesBtn = elements.modals.confirm.yesBtn;
    const newYesBtn = confirmYesBtn.cloneNode(true);
    confirmYesBtn.parentNode.replaceChild(newYesBtn, confirmYesBtn);
    elements.modals.confirm.yesBtn = newYesBtn;
    
    // Set up click handler
    newYesBtn.onclick = async () => {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                throw new Error('Authentication required');
            }
            
            const deletePromises = Array.from(state.selectedUserIds).map(userId => 
                fetch(`/api/users/${userId}`, {
                    method: 'DELETE',
                    headers: { 
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                })
            );
            
            const results = await Promise.allSettled(deletePromises);
            const failedDeletions = results.filter(result => 
                result.status === 'rejected' || !result.value.ok
            );
            
            if (failedDeletions.length > 0) {
                throw new Error(`Failed to delete ${failedDeletions.length} user(s)`);
            }
            
            showNotification(`Successfully deleted ${state.selectedUserIds.size} user(s)`, 'success');
            state.selectedUserIds.clear();
            closeModal('confirm');
            await loadUsersWithFilters();
            
        } catch (error) {
            console.error('Error during bulk delete:', error);
            showNotification(error.message || 'Error during bulk delete', 'error');
            closeModal('confirm');
        }
    };
    
    // Show the confirmation modal
    openModal('confirm');
}

// Handle bulk export action
async function handleBulkExport() {
    if (state.selectedUserIds.size === 0) {
        showNotification('Please select at least one user to export', 'warning');
        return;
    }
    
    try {
        const token = localStorage.getItem('token');
        if (!token) {
            throw new Error('Authentication required');
        }
        
        // Show loading state
        showNotification('Preparing export...', 'info');
        
        // In a real app, you would typically make an API call to generate the export
        // For this example, we'll simulate it with a timeout
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Create a CSV string with user data
        const headers = ['ID', 'Name', 'Email', 'Username', 'Role'];
        let csvContent = headers.join(',') + '\n';
        
        // Add selected users to CSV (in a real app, this would come from the API)
        const userRows = [];
        document.querySelectorAll('tr[data-user-id]').forEach(row => {
            const userId = row.getAttribute('data-user-id');
            if (state.selectedUserIds.has(userId)) {
                const cells = row.querySelectorAll('td');
                const userData = [
                    `"${userId}"`,
                    `"${cells[1]?.textContent || ''}"`,
                    `"${cells[2]?.textContent || ''}"`,
                    `"${cells[3]?.textContent || ''}"`,
                    `"${cells[4]?.textContent || ''}"`
                ];
                userRows.push(userData.join(','));
            }
        });
        
        csvContent += userRows.join('\n');
        
        // Create download link
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', `users_export_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        showNotification(`Exported ${state.selectedUserIds.size} user(s)`, 'success');
        
    } catch (error) {
        console.error('Error during bulk export:', error);
        showNotification(error.message || 'Error during export', 'error');
    }
}

// Handle user deletion
async function handleDeleteUser(userId) {
    if (!userId) {
        console.error('No user ID provided for deletion');
        return;
    }

    try {
        const token = localStorage.getItem('token');
        if (!token) {
            throw new Error('Authentication required. Please log in again.');
        }

        // Base URL from window.location to handle different environments
        const baseUrl = window.location.origin;
        
        // Try multiple API endpoints - note the backend mounts schoolUserRoutes at /api/users
        const endpoints = [
            // Try the primary endpoint first
            `${baseUrl}/api/users/${userId}`,
            // Fallback to other possible endpoints
            `http://localhost:5000/api/users/${userId}`,
            `http://localhost:8000/api/users/${userId}`,
            // Keep these as last resort in case the backend changes
            `${baseUrl}/api/school-users/${userId}`,
            `http://localhost:5000/api/school-users/${userId}`,
            `http://localhost:8000/api/school-users/${userId}`
        ];
        
        let lastError = null;
        let response;
        
        for (const endpoint of endpoints) {
            try {
                console.log(`Attempting to delete user at: ${endpoint}`);
                response = await fetch(endpoint, {
                    method: 'DELETE',
                    headers: { 
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json',
                        'Accept': 'application/json'
                    }
                });

                if (response.ok) {
                    showNotification('User deleted successfully', 'success');
                    await loadUsersWithFilters();
                    return;
                }
                
                const errorData = await response.json().catch(() => ({}));
                lastError = new Error(errorData.message || `Failed to delete user (Status: ${response.status})`);
                console.warn(`Delete failed for ${endpoint}:`, lastError);
                
            } catch (error) {
                console.warn(`Error with endpoint ${endpoint}:`, error);
                lastError = error;
            }
        }
        
        // If we get here, all endpoints failed
        throw lastError || new Error('Failed to delete user: All endpoints failed');
        
    } catch (error) {
        console.error('Delete user error:', error);
        showNotification(error.message || 'Failed to delete user. Please try again.', 'error');
    } finally {
        closeModal('confirm');
        // Refresh the users list to reflect the deletion
        if (elements.userTableBody) {
            loadUsersWithFilters();
        } else {
            // If we're not on the users page, refresh the whole page
            window.location.reload();
        }
    }
}

// Show confirmation dialog for user actions
function showConfirmationDialog(title, message, onConfirm) {
    const modal = elements.modals.confirm;
    
    // Check if modal elements exist
    if (!modal || !modal.title || !modal.message || !modal.yesBtn) {
        console.error('Confirmation modal elements not found. Available elements:', {
            modal: !!modal,
            title: !!modal?.title,
            message: !!modal?.message,
            yesBtn: !!modal?.yesBtn
        });
        
        // Fallback to native confirm if modal is not available
        if (window.confirm(`${title || 'Confirm Action'}\n\n${message || 'Are you sure you want to proceed?'}`)) {
            if (typeof onConfirm === 'function') {
                onConfirm();
            }
        }
        return;
    }

    // Update modal content
    modal.title.textContent = title || 'Confirm Action';
    modal.message.textContent = message || 'Are you sure you want to proceed?';
    
    // Clone and replace the yes button to avoid duplicate event listeners
    const newYesBtn = modal.yesBtn.cloneNode(true);
    modal.yesBtn.parentNode.replaceChild(newYesBtn, modal.yesBtn);
    modal.yesBtn = newYesBtn;
    
    // Add new click handler
    newYesBtn.onclick = async () => {
        if (typeof onConfirm === 'function') {
            await onConfirm();
        }
        closeModal('confirm');
    };
    
    // Show the modal
    openModal('confirm');
}

// Attach event listeners to user rows
function attachRowEventListeners() {
    // Event delegation for user actions
    document.addEventListener('click', async (e) => {
        // Handle edit button clicks
        const editBtn = e.target.closest('.edit-user-btn');
        if (editBtn) {
            e.preventDefault();
            
            // Show loading state
            const originalText = editBtn.innerHTML;
            editBtn.disabled = true;
            editBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Loading...';
            
            try {
                // Try to get user ID from multiple possible locations
                const userId = editBtn.dataset?.id || 
                             editBtn.closest('tr')?.dataset?.userId || 
                             editBtn.getAttribute('data-id');
                
                console.log('Edit button clicked, user ID:', userId);
                
                if (!userId) {
                    console.error('Could not find user ID for edit', {
                        button: editBtn,
                        parentRow: editBtn.closest('tr'),
                        dataset: editBtn.dataset,
                        attributes: Array.from(editBtn.attributes).map(attr => ({
                            name: attr.name,
                            value: attr.value
                        }))
                    });
                    throw new Error('Could not determine user to edit');
                }
                
                const user = await getUserById(userId);
                if (!user) {
                    throw new Error('User data not found');
                }
                
                // Populate edit form
                if (elements.editUserId) elements.editUserId.value = user._id || '';
                if (elements.editName) elements.editName.value = user.name || '';
                if (elements.editEmail) elements.editEmail.value = user.email || '';
                if (elements.editUsername) elements.editUsername.value = user.username || '';
                if (elements.editRole) elements.editRole.value = user.role || 'student';
                
                // Show edit modal
                openModal('edit');
                
            } catch (error) {
                console.error('Error preparing edit form:', error);
                showNotification(error.message || 'Failed to load user data', 'error');
            } finally {
                // Reset button state
                if (editBtn) {
                    editBtn.disabled = false;
                    editBtn.innerHTML = originalText;
                }
            }
        }
        
        // Handle delete button clicks
        const deleteBtn = e.target.closest('.delete-user-btn');
        if (deleteBtn) {
            e.preventDefault();
            const row = deleteBtn.closest('tr');
            
            // Try different ways to get the user ID
            const userId = row?.dataset?.userId || 
                          deleteBtn.dataset?.id || 
                          (deleteBtn.getAttribute && deleteBtn.getAttribute('data-id'));
            
            // For debugging
            console.log('Delete button clicked. Row data:', {
                rowDataset: row?.dataset,
                buttonDataset: deleteBtn.dataset,
                buttonAttributes: deleteBtn.attributes,
                computedUserId: userId
            });
            
            if (!userId) {
                console.error('Could not find user ID for deletion. Row data:', row);
                showNotification('Error: Could not identify user to delete', 'error');
                return;
            }
            
            const userName = row?.querySelector('td:nth-child(2)')?.textContent?.trim() || 'this user';
            
            showConfirmationDialog(
                'Confirm Delete',
                `Are you sure you want to delete ${userName}? This action cannot be undone.`,
                () => handleDeleteUser(userId)
            );
        }
    });
}

// Show notification to user
function showNotification(message, type = 'info') {
    // Try to use existing notification system if available
    if (typeof toastr !== 'undefined') {
        toastr[type === 'error' ? 'error' : 'success'](message);
        return;
    }
    
    // Fallback to alert if no notification system is available
    if (type === 'error') {
        console.error('Error:', message);
        alert(`Error: ${message}`);
    } else {
        console.log('Info:', message);
        alert(message);
    }
}

// Initialize modals
function initializeModals() {
    // Initialize confirm modal
    if (elements.modals.confirm.modal) {
        // Close button
        if (elements.modals.confirm.closeBtn) {
            elements.modals.confirm.closeBtn.onclick = () => closeModal('confirm');
        }
        
        // Close when clicking outside the modal
        window.onclick = (event) => {
            if (event.target === elements.modals.confirm.modal) {
                closeModal('confirm');
            }
        };
    }
    
    // Initialize edit modal
    if (elements.modals.edit.modal) {
        // Close button
        if (elements.modals.edit.closeBtn) {
            elements.modals.edit.closeBtn.onclick = () => closeModal('edit');
        }
        
        // Close when clicking outside the modal
        window.onclick = (event) => {
            if (event.target === elements.modals.edit.modal) {
                closeModal('edit');
            }
        };
    }
}

// Handle edit user form submission
async function handleEditUser(e) {
    e.preventDefault();
    
    // Get form elements
    const form = e.target;
    const submitBtn = form.querySelector('button[type="submit"]');
    const originalBtnText = submitBtn.innerHTML;
    const msgElement = elements.modals.edit.msg;
    
    // Get form values
    const userId = elements.editUserId?.value;
    const name = elements.editName?.value.trim();
    const email = elements.editEmail?.value.trim().toLowerCase();
    const username = elements.editUsername?.value.trim();
    const role = elements.editRole?.value;
    
    // Validate required fields
    if (!userId || !name || !email || !username || !role) {
        showFormMessage(msgElement, 'Please fill in all required fields', 'error');
        return;
    }
    
    // Validate email format
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        showFormMessage(msgElement, 'Please enter a valid email address', 'error');
        elements.editEmail.focus();
        return;
    }
    
    // Show loading state
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';
    
    try {
        const token = localStorage.getItem('token');
        if (!token) {
            throw new Error('Authentication required. Please log in again.');
        }
        
        // Try multiple endpoints in case of different environments
        const baseUrl = window.location.origin;
        const endpoints = [
            `${baseUrl}/api/users/${userId}`,
            `http://localhost:5000/api/users/${userId}`,
            `http://localhost:8000/api/users/${userId}`
        ];
        
        let response;
        let success = false;
        let lastError = '';
        
        for (const endpoint of endpoints) {
            try {
                console.log(`Attempting to update user at: ${endpoint}`);
                response = await fetch(endpoint, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`,
                        'Accept': 'application/json'
                    },
                    body: JSON.stringify({
                        name,
                        email,
                        username,
                        role
                    }),
                    credentials: 'include'
                });
                
                const data = await response.json().catch(() => ({}));
                
                if (response.ok) {
                    console.log('User updated successfully:', data);
                    success = true;
                    break;
                } else {
                    lastError = data.message || response.statusText || 'Unknown error';
                    console.error(`Error from ${endpoint}:`, response.status, lastError, data);
                }
            } catch (error) {
                console.error(`Error updating user at ${endpoint}:`, error);
                lastError = error.message;
            }
        }
        
        if (!success) {
            throw new Error(lastError || 'Failed to update user. Please try again.');
        }
        
        // Show success message
        showFormMessage(msgElement, 'User updated successfully!', 'success');
        
        // Close the modal after a short delay
        setTimeout(() => {
            closeModal('edit');
            // Refresh the user list
            loadUsersWithFilters();
        }, 1500);
        
    } catch (error) {
        console.error('Error updating user:', error);
        showFormMessage(msgElement, error.message || 'Error updating user. Please try again.', 'error');
    } finally {
        // Reset button state
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalBtnText;
        }
    }
}

// Helper function to show form messages
function showFormMessage(element, message, type = 'info') {
    if (!element) return;
    
    // Clear previous messages and classes
    element.textContent = '';
    element.className = 'message';
    
    // Add message and appropriate class
    element.textContent = message;
    element.classList.add(type);
    element.classList.remove('hidden');
    
    // Scroll to the message
    element.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

// Initialize the page
document.addEventListener('DOMContentLoaded', () => {
    // Initialize modals
    initializeModals();
    
    // Set up form submission handlers
    if (elements.modals.edit.form) {
        elements.modals.edit.form.addEventListener('submit', handleEditUser);
    }
    
    // Close modal when clicking outside
    document.addEventListener('click', (e) => {
        if (e.target.classList.contains('modal')) {
            const modal = e.target;
            const modalType = Object.keys(elements.modals).find(
                key => elements.modals[key].modal === modal
            );
            if (modalType) {
                closeModal(modalType);
            }
        }
    });
    
    // Close modal with Escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            Object.keys(elements.modals).forEach(modalType => {
                const modal = elements.modals[modalType].modal;
                if (modal && modal.classList.contains('show')) {
                    closeModal(modalType);
                }
            });
        }
    });
    
    // Initialize event listeners
    attachRowEventListeners();
    
    // Load initial data
    loadUsersWithFilters();
    
    // Initialize search and filter event listeners if they exist
    if (elements.userSearch) {
        elements.userSearch.addEventListener('input', debounce(loadUsersWithFilters, 300));
    }
    
    if (elements.userRoleFilter) {
        elements.userRoleFilter.addEventListener('change', loadUsersWithFilters);
    }
    
    if (elements.userStatusFilter) {
        elements.userStatusFilter.addEventListener('change', loadUsersWithFilters);
    }
});

// Utility function to debounce function calls
function debounce(func, wait) {
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

// Load users on page load
if (userTableBody) loadUsersWithFilters();
