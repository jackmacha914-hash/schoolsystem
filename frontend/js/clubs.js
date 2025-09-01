// Helper function to escape HTML to prevent XSS
function escapeHtml(unsafe) {
    if (typeof unsafe !== 'string') return unsafe;
    return unsafe
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

// Global variables for the modal and its buttons
let currentClubId = null;
let addLearnersModal = null;
let closeAddLearnersModalBtn = null;
let closeAddLearnersBtn = null;
let addSelectedStudentsBtn = null;

// Define the class structure
const CLASS_STRUCTURE = [
    {
        label: 'Pre-Primary',
        classes: [
            { value: 'pp1', text: 'Pre-Primary 1 (PP1) - Age 4-5' },
            { value: 'pp2', text: 'Pre-Primary 2 (PP2) - Age 5-6' }
        ]
    },
    {
        label: 'Primary Education',
        classes: [
            { value: 'grade1', text: 'Grade 1 - Age 6-7' },
            { value: 'grade2', text: 'Grade 2 - Age 7-8' },
            { value: 'grade3', text: 'Grade 3 - Age 8-9' },
            { value: 'grade4', text: 'Grade 4 - Age 9-10' },
            { value: 'grade5', text: 'Grade 5 - Age 10-11' },
            { value: 'grade6', text: 'Grade 6 - Age 11-12' },
            { value: 'grade7', text: 'Grade 7 - Age 12-13' },
            { value: 'grade8', text: 'Grade 8 - Age 13-14 (KCPE)' }
        ]
    },
    {
        label: 'Secondary Education',
        classes: [
            { value: 'form1', text: 'Form 1 - Age 14-15' },
            { value: 'form2', text: 'Form 2 - Age 15-16' },
            { value: 'form3', text: 'Form 3 - Age 16-17' },
            { value: 'form4', text: 'Form 4 - Age 17-18 (KCSE)' }
        ]
    },
    {
        label: 'Tertiary/College',
        classes: [
            { value: 'college1', text: 'Year 1 - Certificate/Diploma' },
            { value: 'college2', text: 'Year 2 - Certificate/Diploma' },
            { value: 'college3', text: 'Year 3 - Diploma/Degree' },
            { value: 'college4', text: 'Year 4 - Degree' }
        ]
    }
];

function handleAddLearners(e) {
    e.preventDefault();
    const clubId = e.target.getAttribute('data-id');
    openAddLearnersModal(clubId);
}

(function() {
// Clubs Management Logic
const clubForm = document.getElementById('club-form');
const clubList = document.getElementById('club-list');
const clubSearch = document.getElementById('club-search');
const clubTypeFilter = document.getElementById('club-type-filter');

// Initialize clubs section
if (clubList) {
    console.log('Initializing clubs section');
    // Add event delegation for club buttons
    clubList.addEventListener('click', (e) => {
        if (e.target.classList.contains('edit-club-btn')) {
            handleEditClub(e);
        } else if (e.target.classList.contains('delete-club-btn')) {
            handleDeleteClub(e);
        } else if (e.target.classList.contains('add-learners-btn')) {
            handleAddLearners(e);
        } else if (e.target.classList.contains('view-members-btn')) {
            e.preventDefault();
            const clubId = e.target.getAttribute('data-id');
            const clubName = e.target.getAttribute('data-name');
            console.log('View members clicked for club:', { clubId, clubName });
            openClubMembersModal(clubId, clubName);
        }
    });

    // Load clubs when section is shown
    document.addEventListener('DOMContentLoaded', () => {
        loadClubsWithFilters();
    });

    // Initialize modal
    console.log('Initializing add learners modal...');
    addLearnersModal = document.getElementById('add-learners-modal');
    
    // If modal doesn't exist, create it
    if (!addLearnersModal) {
        console.log('Creating new add learners modal element');
        addLearnersModal = document.createElement('div');
        addLearnersModal.id = 'add-learners-modal';
        addLearnersModal.className = 'modal';
        document.body.appendChild(addLearnersModal);
        console.log('Modal element created and appended to body');
    } else {
        console.log('Using existing add learners modal element');
    }
    // Create modal content with proper structure
    const modalContent = `
        <div class="modal-content">
            <span class="close" id="close-add-learners-modal">&times;</span>
            <h2>Add Learners to Club</h2>
            <div class="form-container">
                <div class="filter-container" style="display: flex; gap: 10px; margin-bottom: 15px;">
                    <div class="search-box" style="flex: 2;">
                        <i class="fas fa-search"></i>
                        <input type="text" id="student-search" placeholder="Search by name..." />
                    </div>
                    <div class="class-filter" style="flex: 1;">
                        <select id="class-filter" class="form-control">
                            <option value="">All Classes</option>
                        </select>
                    </div>
                </div>
                <div class="students-list">
                    <table class="data-table">
                        <thead>
                            <tr>
                                <th><input type="checkbox" id="select-all-students" /></th>
                                <th>Full Name</th>
                                <th>Class</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody id="students-table-body">
                            <!-- Students will be populated here -->
                        </tbody>
                    </table>
                </div>
                <div class="modal-actions">
                    <button class="btn btn-primary" id="add-selected-students">Add Selected</button>
                    <button class="btn btn-secondary" id="close-add-learners">Cancel</button>
                </div>
            </div>
        </div>`;
    
    try {
        // Set the innerHTML and then initialize the class filter
        if (addLearnersModal) {
            addLearnersModal.innerHTML = modalContent;
            
            // Initialize modal buttons and event listeners
            closeAddLearnersModalBtn = document.getElementById('close-add-learners-modal');
            closeAddLearnersBtn = document.getElementById('close-add-learners');
            addSelectedStudentsBtn = document.getElementById('add-selected-students');
            
            // Add click event to close modal when clicking outside
            addLearnersModal.addEventListener('click', function(event) {
                if (event.target === addLearnersModal) {
                    closeAddLearnersModal();
                }
            });
            
            // Initialize class filter after modal content is set
            setTimeout(function() {
                try {
                    // Initialize class filter
                    if (typeof updateClassFilter === 'function') {
                        updateClassFilter();
                    }
                    
                    // Initialize search functionality
                    const searchInput = document.getElementById('student-search');
                    if (searchInput && typeof filterStudents === 'function') {
                        searchInput.addEventListener('input', filterStudents);
                    }
                    
                    // Initialize class filter change event
                    const classFilter = document.getElementById('class-filter');
                    if (classFilter && typeof filterStudents === 'function') {
                        classFilter.addEventListener('change', filterStudents);
                    }
                    
                    // Initialize select all checkbox
                    const selectAllCheckbox = document.getElementById('select-all-students');
                    if (selectAllCheckbox) {
                        selectAllCheckbox.addEventListener('change', function() {
                            const checkboxes = document.querySelectorAll('.student-checkbox');
                            checkboxes.forEach(function(checkbox) {
                                checkbox.checked = selectAllCheckbox.checked;
                            });
                        });
                    }
                } catch (error) {
                    console.error('Error initializing modal components:', error);
                }
            }, 0);
        }
    } catch (error) {
        console.error('Error initializing modal:', error);
    }

    if (closeAddLearnersModalBtn) {
        closeAddLearnersModalBtn.onclick = () => {
            addLearnersModal.style.display = 'none';
        };
    }
    if (closeAddLearnersBtn) {
        closeAddLearnersBtn.onclick = () => {
            addLearnersModal.style.display = 'none';
        };
    }
    if (addSelectedStudentsBtn) {
        addSelectedStudentsBtn.onclick = async () => {
            const selectedStudents = Array.from(document.querySelectorAll('.student-checkbox:checked'))
                .map(cb => cb.getAttribute('data-id'));
            await addStudentsToClub(selectedStudents);
        };
    }
}

// --- Club Member Management Functions ---
async function removeClubMember(clubId, memberId, memberName) {
    if (!confirm(`Are you sure you want to remove ${memberName} from this club?`)) {
        return;
    }

    console.log('Removing member:', { clubId, memberId, memberName });
    const container = document.getElementById('club-members-container');
    const row = document.querySelector(`tr[data-member-id="${memberId}"]`);
    
    if (row) {
        row.style.opacity = '0.5';
        row.style.transition = 'opacity 0.3s';
    }

    try {
        const token = localStorage.getItem('token');
        if (!token) {
            throw new Error('No authentication token found. Please log in again.');
        }

        // Ensure both IDs are properly encoded
        const encodedClubId = encodeURIComponent(clubId);
        const encodedMemberId = encodeURIComponent(memberId);
        const url = `http://localhost:5000/api/clubs/${encodedClubId}/members/${encodedMemberId}`;
        console.log('Making DELETE request to:', url);
        console.log('Request headers:', {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        });

        const response = await fetch(url, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            credentials: 'include',
            mode: 'cors'
        });

        console.log('Response status:', response.status);
        console.log('Response headers:', Object.fromEntries(response.headers.entries()));
        
        if (!response.ok) {
            let errorMessage = `HTTP error! status: ${response.status} ${response.statusText}`;
            let errorDetails = {};
            
            try {
                // Try to parse the response as JSON
                const errorData = await response.json().catch(() => ({}));
                console.error('Error details (JSON):', errorData);
                errorMessage = errorData.message || errorData.error || errorMessage;
                errorDetails = errorData;
                
                if (errorData.details) {
                    errorMessage += ` (${errorData.details})`;
                }
            } catch (e) {
                // If JSON parsing fails, try to get the response as text
                console.error('Failed to parse error response as JSON:', e);
                try {
                    const errorText = await response.text();
                    console.error('Raw error response (text):', errorText);
                    errorDetails.rawResponse = errorText;
                } catch (textError) {
                    console.error('Failed to read response text:', textError);
                }
            }
            
            // Create a more detailed error object
            const error = new Error(errorMessage);
            error.status = response.status;
            error.statusText = response.statusText;
            error.details = errorDetails;
            error.url = url;
            error.method = 'DELETE';
            
            console.error('Request failed:', {
                url,
                method: 'DELETE',
                status: response.status,
                statusText: response.statusText,
                error: errorMessage,
                details: errorDetails
            });
            
            throw error;
        }

        // Remove the row with animation
        if (row) {
            row.style.transition = 'all 0.3s';
            row.style.maxHeight = '0';
            row.style.opacity = '0';
            row.style.overflow = 'hidden';
            
            // Wait for animation to complete before removing
            setTimeout(() => {
                row.remove();
                
                // Update member count
                const memberCount = document.querySelectorAll('tr[data-member-id]').length;
                const header = container.querySelector('h3');
                if (header) {
                    header.innerHTML = header.innerHTML.replace(/\(\d+ members?\)/, `(${memberCount} ${memberCount === 1 ? 'member' : 'members'})`);
                }
                
                // Show message if no members left
                if (memberCount === 0) {
                    container.innerHTML = `
                        <div style="text-align: center; padding: 40px 20px; color: #666;">
                            <i class="fas fa-users-slash" style="font-size: 2em; margin-bottom: 10px; display: block; color: #95a5a6;"></i>
                            <p>No members found in this club.</p>
                        </div>`;
                }
            }, 300);
        }
        
        // Show success message
        showNotification('Member removed successfully', 'success');
        
    } catch (error) {
        console.error('Error removing club member:', error);
        if (row) {
            row.style.opacity = '1';
        }
        showNotification(`Error: ${error.message}`, 'error');
    }
}

// --- Club Members Modal Functions ---
// Add click handler for delete buttons
document.addEventListener('click', function(event) {
    const deleteBtn = event.target.closest('.delete-member-btn');
    if (deleteBtn) {
        event.preventDefault();
        const clubId = document.getElementById('club-members-modal').dataset.clubId;
        const memberId = deleteBtn.dataset.memberId;
        const memberName = deleteBtn.dataset.memberName;
        removeClubMember(clubId, memberId, memberName);
    }
});

function openClubMembersModal(clubId, clubName) {
    console.log('Opening club members modal for:', { clubId, clubName });
    const modal = document.getElementById('club-members-modal');
    
    if (!modal) {
        console.error('Club members modal not found in the DOM');
        return;
    }
    
    // Store the club ID for later use
    currentClubId = clubId;
    modal.dataset.clubId = clubId;
    
    // Ensure modal is properly positioned and visible
    modal.style.display = 'block';
    modal.style.opacity = '1';
    modal.style.visibility = 'visible';
    document.body.style.overflow = 'hidden';
    
    // Ensure the modal content is visible
    const modalContent = modal.querySelector('.modal-content');
    if (modalContent) {
        modalContent.style.opacity = '1';
        modalContent.style.transform = 'translateY(0)';
    }
    
    // Clear any previous content and show loading state
    const container = document.getElementById('club-members-container');
    if (container) {
        container.innerHTML = '<p>Loading members...</p>';
    }
    
    // Load club members after a small delay to ensure modal is visible
    setTimeout(() => {
        loadClubMembers(clubId, clubName);
    }, 50);
    
    // Close modal when clicking outside the content or on close button
    const closeModal = (event) => {
        if (event.target === modal || event.target.classList.contains('close')) {
            closeClubMembersModal();
        }
    };
    
    // Remove any existing event listeners to prevent duplicates
    modal.removeEventListener('click', closeModal);
    const closeBtn = modal.querySelector('.close');
    if (closeBtn) {
        closeBtn.removeEventListener('click', closeModal);
        closeBtn.addEventListener('click', closeModal);
    }
    modal.addEventListener('click', closeModal);
}

function closeClubMembersModal() {
    console.log('Closing club members modal');
    const modal = document.getElementById('club-members-modal');
    if (!modal) return;
    
    // Add closing animation
    modal.style.opacity = '0';
    modal.style.visibility = 'hidden';
    
    // Reset modal content position for next open
    const modalContent = modal.querySelector('.modal-content');
    if (modalContent) {
        modalContent.style.opacity = '0';
        modalContent.style.transform = 'translateY(-20px)';
    }
    
    // Re-enable scrolling after transition completes
    setTimeout(() => {
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
        
        // Clear the container content
        const container = document.getElementById('club-members-container');
        if (container) {
            container.innerHTML = '';
        }
    }, 300); // Match this with your CSS transition duration
    
    // Clear the current club ID
    currentClubId = null;
    
    // Remove any existing event listeners
    modal.removeEventListener('click', closeClubMembersModal);
    const closeBtn = modal.querySelector('.close');
    if (closeBtn) {
        closeBtn.removeEventListener('click', closeClubMembersModal);
    }
}

async function loadClubMembers(clubId, clubName) {
    console.log('loadClubMembers called with:', { clubId, clubName });
    const container = document.getElementById('club-members-container');
    
    if (!container) {
        console.error('Error: club-members-container element not found in the DOM');
        return;
    }

    // Show loading state
    container.innerHTML = `
        <div style="display: flex; justify-content: center; align-items: center; height: 100px;">
            <div class="spinner" style="width: 40px; height: 40px; border: 4px solid #f3f3f3; border-top: 4px solid #3498db; border-radius: 50%; animation: spin 1s linear infinite;"></div>
            <span style="margin-left: 10px; color: #666;">Loading members...</span>
        </div>`;
    
    try {
        const token = localStorage.getItem('token');
        if (!token) {
            throw new Error('No authentication token found. Please log in again.');
        }

        console.log('Making request to fetch club members...');
        const response = await fetch(`http://localhost:5000/api/clubs/${clubId}/students`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json'
                // Removed Cache-Control and Content-Type as they can trigger preflight
            },
            credentials: 'include',
            mode: 'cors'
        });
        
        console.log('Response status:', response.status);
        
        if (!response.ok) {
            let errorMessage = `HTTP error! status: ${response.status}`;
            try {
                const errorData = await response.json();
                errorMessage = errorData.error || errorData.message || errorMessage;
            } catch (e) {
                // If we can't parse JSON error, use status text
                const errorText = await response.text();
                errorMessage = errorText || errorMessage;
            }
            throw new Error(errorMessage);
        }
        
        const data = await response.json();
        console.log('Received data:', data);
        
        // Render the members list
        if (data.members && Array.isArray(data.members) && data.members.length > 0) {
            console.log(`Rendering ${data.members.length} members`);
            
            // Generate table rows for each member with delete button
            const memberRows = data.members.map(member => `
                <tr style="border-bottom: 1px solid #eee;" data-member-id="${member._id}">
                    <td style="padding: 12px; vertical-align: middle;">${escapeHtml(member.name || 'N/A')}</td>
                    <td style="padding: 12px; vertical-align: middle;">${escapeHtml(member.class || 'N/A')}</td>
                    <td style="padding: 12px; vertical-align: middle;">${escapeHtml(member.admissionNumber || 'N/A')}</td>
                    <td style="padding: 12px; text-align: center; vertical-align: middle;">
                        <button class="delete-member-btn" 
                                data-member-id="${member._id}" 
                                data-member-name="${escapeHtml(member.name || 'this member')}"
                                style="background: none; border: none; color: #e74c3c; cursor: pointer; padding: 5px; border-radius: 3px; transition: background-color 0.2s;"
                                onmouseover="this.style.backgroundColor='#f5f5f5'"
                                onmouseout="this.style.backgroundColor='transparent'">
                            <i class="fas fa-trash-alt"></i>
                        </button>
                    </td>
                </tr>`
            ).join('');
            
            const membersHtml = `
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                <h3 style="margin: 0; color: #2c3e50; font-size: 1.5em;">
                    <i class="fas fa-users" style="margin-right: 10px;"></i>
                    ${escapeHtml(clubName)} Members (${data.members.length})
                </h3>
            </div>
                <div style="overflow-x: auto; margin-bottom: 20px;">
                    <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
                        <thead>
                            <tr style="background-color: #f5f5f5;">
                                <th style="padding: 12px; text-align: left; border-bottom: 2px solid #3498db;">Name</th>
                                <th style="padding: 12px; text-align: left; border-bottom: 2px solid #3498db;">Class</th>
                                <th style="padding: 12px; text-align: left; border-bottom: 2px solid #3498db;">Admission Number</th>
                                <th style="width: 50px; border-bottom: 2px solid #3498db;">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${memberRows}
                        </tbody>
                    </table>
                </div>`;
                
            console.log('Setting innerHTML of container');
            container.innerHTML = membersHtml;
            console.log('Container content after setting:', container.innerHTML);
        } else {
            container.innerHTML = `<p>No members found for ${escapeHtml(clubName)}.</p>`;
        }
    } catch (error) {
        console.error('Error loading club members:', error);
        container.innerHTML = `
            <div style="text-align: center; padding: 30px 20px; color: #721c24; background-color: #f8d7da; border: 1px solid #f5c6cb; border-radius: 8px; margin: 15px 0;">
                <div style="font-size: 2em; margin-bottom: 10px; color: #dc3545;">
                    <i class="fas fa-exclamation-triangle"></i>
                </div>
                <h3 style="margin: 0 0 10px 0; color: #721c24;">Failed to Load Members</h3>
                <p style="margin: 0 0 15px 0; color: #721c24;">${escapeHtml(error.message || 'An error occurred while loading club members.')}</p>
                <button onclick="loadClubMembers('${clubId}', '${escapeHtml(clubName)}')" style="
                    background-color: #dc3545;
                    color: white;
                    border: none;
                    padding: 8px 16px;
                    border-radius: 4px;
                    cursor: pointer;
                    font-size: 0.9em;
                    transition: background-color 0.2s;
                ">
                    <i class="fas fa-sync-alt" style="margin-right: 5px;"></i> Try Again
                </button>
            </div>`;
    }
}

// Close modal when clicking outside
window.addEventListener('click', (event) => {
    const modal = document.getElementById('club-members-modal');
    if (event.target === modal) {
        closeClubMembersModal();
    }
});

// --- Universal Modal Logic (Clubs) ---
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



function closeAddLearnersModal() {
    if (addLearnersModal) {
        addLearnersModal.classList.remove('show');
        addLearnersModal.style.display = 'none';
        document.body.classList.remove('modal-open');
        
        // Remove backdrop
        const backdrop = document.querySelector('.modal-backdrop');
        if (backdrop) {
            backdrop.remove();
        }
        
        // Clean up event listeners
        document.removeEventListener('click', handleOutsideClick);
    }
}

function handleOutsideClick(event) {
    if (event.target === addLearnersModal) {
        closeAddLearnersModal();
    }
}

function openAddLearnersModal(clubId) {
    console.log('Opening modal for club ID:', clubId);
    currentClubId = clubId;
    
    // Create modal if it doesn't exist
    if (!addLearnersModal) {
        addLearnersModal = document.createElement('div');
        addLearnersModal.className = 'modal fade';
        addLearnersModal.id = 'add-learners-modal';
        addLearnersModal.setAttribute('tabindex', '-1');
        addLearnersModal.setAttribute('role', 'dialog');
        addLearnersModal.setAttribute('aria-hidden', 'true');
        document.body.appendChild(addLearnersModal);
    }
    
    // Set modal content
    const modalContent = `
        <div class="modal-dialog modal-lg" role="document">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title">Add Learners to Club</h5>
                    <button type="button" class="close" data-dismiss="modal" aria-label="Close">
                        <span aria-hidden="true">&times;</span>
                    </button>
                </div>
                <div class="modal-body">
                    <div class="row mb-3">
                        <div class="col-md-6">
                            <input type="text" id="student-search" class="form-control" placeholder="Search students...">
                        </div>
                        <div class="col-md-6">
                            <select id="class-filter" class="form-control">
                                <option value="">All Classes</option>
                            </select>
                        </div>
                    </div>
                    <div class="table-responsive">
                        <table class="table table-hover">
                            <thead>
                                <tr>
                                    <th><input type="checkbox" id="select-all-students"></th>
                                    <th>Name</th>
                                    <th>Student ID</th>
                                    <th>Class</th>
                                </tr>
                            </thead>
                            <tbody id="students-table-body">
                                <!-- Students will be loaded here -->
                            </tbody>
                        </table>
                    </div>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" data-dismiss="modal">Cancel</button>
                    <button type="button" class="btn btn-primary" id="add-selected-students">Add Selected</button>
                </div>
            </div>
        </div>`;
    
    // Set modal content
    addLearnersModal.innerHTML = modalContent;
    
    // Show modal
    addLearnersModal.style.display = 'block';
    addLearnersModal.classList.add('show');
    document.body.classList.add('modal-open');
    
    // Add backdrop
    const backdrop = document.createElement('div');
    backdrop.className = 'modal-backdrop fade show';
    document.body.appendChild(backdrop);
    
    // Load students
    loadStudentsForClub();
    
    // Initialize event listeners
    const closeButtons = addLearnersModal.querySelectorAll('[data-dismiss="modal"]');
    closeButtons.forEach(button => {
        button.addEventListener('click', closeAddLearnersModal);
    });
    
    // Initialize select all checkbox
    const selectAllCheckbox = addLearnersModal.querySelector('#select-all-students');
    if (selectAllCheckbox) {
        selectAllCheckbox.addEventListener('change', function() {
            const checkboxes = addLearnersModal.querySelectorAll('.student-checkbox');
            checkboxes.forEach(checkbox => {
                checkbox.checked = selectAllCheckbox.checked;
            });
        });
    }
    
    // Initialize search and filter
    const searchInput = addLearnersModal.querySelector('#student-search');
    if (searchInput) {
        searchInput.addEventListener('input', filterStudents);
        // Focus on the search input when modal opens
        setTimeout(() => searchInput.focus(), 100);
    }
    
    const classFilter = addLearnersModal.querySelector('#class-filter');
    if (classFilter) {
        updateClassFilter();
        classFilter.addEventListener('change', filterStudents);
    }
    
    // Initialize add selected button
    const addSelectedBtn = addLearnersModal.querySelector('#add-selected-students');
    if (addSelectedBtn) {
        addSelectedBtn.addEventListener('click', async () => {
            const selectedStudents = Array.from(addLearnersModal.querySelectorAll('.student-checkbox:checked'))
                .map(checkbox => checkbox.value);
            
            if (selectedStudents.length > 0) {
                await addStudentsToClub(selectedStudents);
                closeAddLearnersModal();
            } else {
                alert('Please select at least one student to add.');
            }
        });
    }
    
    // Add click outside to close
    document.addEventListener('click', handleOutsideClick);
}

// Add event delegation for club buttons
clubList.addEventListener('click', (e) => {
    if (e.target.classList.contains('edit-club-btn')) {
        handleEditClub(e);
    } else if (e.target.classList.contains('delete-club-btn')) {
        handleDeleteClub(e);
    } else if (e.target.classList.contains('add-learners-btn')) {
        handleAddLearners(e);
    } else if (e.target.classList.contains('view-members-btn')) {
        const clubId = e.target.getAttribute('data-id');
        const clubName = e.target.getAttribute('data-name');
        openClubMembersModal(clubId, clubName);
    }
});

// Handle Add Learners button click
function handleAddLearners(e) {
    e.preventDefault();
    const clubId = e.target.getAttribute('data-id');
    openAddLearnersModal(clubId);
}

function closeAddLearnersModal() {
    if (addLearnersModal) {
        addLearnersModal.classList.remove('show');
        document.body.classList.remove('modal-open');
        const modalBackdrop = document.querySelector('.modal-backdrop');
        if (modalBackdrop) {
            modalBackdrop.remove();
        }
    }
}

// Define the class structure
const CLASS_STRUCTURE = [
    {
        label: 'Pre-Primary',
        classes: [
            { value: 'pp1', text: 'Pre-Primary 1 (PP1) - Age 4-5' },
            { value: 'pp2', text: 'Pre-Primary 2 (PP2) - Age 5-6' }
        ]
    },
    {
        label: 'Primary Education',
        classes: [
            { value: 'grade1', text: 'Grade 1 - Age 6-7' },
            { value: 'grade2', text: 'Grade 2 - Age 7-8' },
            { value: 'grade3', text: 'Grade 3 - Age 8-9' },
            { value: 'grade4', text: 'Grade 4 - Age 9-10' },
            { value: 'grade5', text: 'Grade 5 - Age 10-11' },
            { value: 'grade6', text: 'Grade 6 - Age 11-12' },
            { value: 'grade7', text: 'Grade 7 - Age 12-13' },
            { value: 'grade8', text: 'Grade 8 - Age 13-14 (KCPE)' }
        ]
    },
    {
        label: 'Secondary Education',
        classes: [
            { value: 'form1', text: 'Form 1 - Age 14-15' },
            { value: 'form2', text: 'Form 2 - Age 15-16' },
            { value: 'form3', text: 'Form 3 - Age 16-17' },
            { value: 'form4', text: 'Form 4 - Age 17-18 (KCSE)' }
        ]
    },
    {
        label: 'Tertiary/College',
        classes: [
            { value: 'college1', text: 'Year 1 - Certificate/Diploma' },
            { value: 'college2', text: 'Year 2 - Certificate/Diploma' },
            { value: 'college3', text: 'Year 3 - Diploma/Degree' },
            { value: 'college4', text: 'Year 4 - Degree' }
        ]
    }
];

// Initialize class filter with predefined structure
function updateClassFilter() {
    if (!addLearnersModal) return;
    
    const classFilter = addLearnersModal.querySelector('#class-filter');
    if (!classFilter) return;
    
    // Clear existing options but keep the event listener
    const existingListeners = [];
    const clone = classFilter.cloneNode(false);
    while (classFilter.firstChild) {
        classFilter.removeChild(classFilter.lastChild);
    }
    
    // Add default option
    const defaultOption = document.createElement('option');
    defaultOption.value = '';
    defaultOption.textContent = 'All Classes';
    classFilter.appendChild(defaultOption);
    
    // Add class options from predefined structure
    CLASS_STRUCTURE.forEach(group => {
        // Add optgroup
        const optgroup = document.createElement('optgroup');
        optgroup.label = group.label;
        
        // Add class options
        group.classes.forEach(cls => {
            const option = document.createElement('option');
            option.value = cls.value;
            option.textContent = cls.text;
            optgroup.appendChild(option);
        });
        
        classFilter.appendChild(optgroup);
    });
    
    // No need to re-add event listener as it's already set in openAddLearnersModal
}

// Filter students based on search and class filter
function filterStudents() {
    if (!addLearnersModal) {
        console.error('Modal not found');
        return;
    }
    
    const searchInput = addLearnersModal.querySelector('#student-search');
    const classFilter = addLearnersModal.querySelector('#class-filter');
    const tbody = addLearnersModal.querySelector('#students-table-body');
    
    if (!searchInput || !classFilter || !tbody) {
        console.error('Required elements not found:', { searchInput, classFilter, tbody });
        return;
    }
    
    const searchTerm = (searchInput.value || '').toLowerCase().trim();
    const selectedClass = classFilter.value || '';
    const rows = tbody.querySelectorAll('tr');
    
    console.log('Filtering students:', { searchTerm, selectedClass, rowCount: rows.length });
    
    let visibleCount = 0;
    
    rows.forEach((row, index) => {
        try {
            const cells = row.cells;
            if (!cells || cells.length < 4) {
                console.log(`Row ${index} has insufficient cells`);
                row.style.display = 'none';
                return;
            }
            
            const name = (cells[1]?.textContent || '').toLowerCase();
            const studentId = (cells[2]?.textContent || '').toLowerCase();
            const className = (cells[3]?.textContent || '').trim();
            
            // Check if row matches search term (name or student ID)
            const matchesSearch = !searchTerm || 
                name.includes(searchTerm) || 
                studentId.includes(searchTerm);
            
            // Map selected filter value to display text for comparison
            const getClassDisplayText = (value) => {
                if (!value) return '';
                // Find the class in our predefined structure
                for (const group of CLASS_STRUCTURE) {
                    const found = group.classes.find(c => c.value === value);
                    if (found) return found.text.split(' - ')[0].trim(); // Get just the class name part
                }
                return value; // Fallback to raw value if not found
            };
            
            // Get the display text for the selected class
            const selectedClassText = getClassDisplayText(selectedClass);
            
            // Check if row matches selected class (case-insensitive and trimmed)
            const matchesClass = !selectedClass || 
                className.trim().toLowerCase() === selectedClassText.toLowerCase();
                
            console.log('Class comparison:', {
                className,
                selectedClass,
                selectedClassText,
                matches: className.trim().toLowerCase() === selectedClassText.toLowerCase()
            });
            
            // Show or hide the row based on filters
            const shouldShow = matchesSearch && matchesClass;
            row.style.display = shouldShow ? '' : 'none';
            
            if (shouldShow) visibleCount++;
            
            console.log(`Row ${index}:`, { 
                name, 
                studentId, 
                className, 
                matchesSearch, 
                matchesClass, 
                shouldShow 
            });
            
        } catch (error) {
            console.error('Error filtering student row:', error, row);
            row.style.display = 'none'; // Hide rows with errors
        }
    });
    
    console.log(`Filter complete. ${visibleCount} of ${rows.length} students visible.`);
}

async function loadStudentsForClub() {
    const token = localStorage.getItem('token');
    console.log('Loading students...');
    
    // Ensure the modal is properly initialized
    if (!addLearnersModal) {
        console.error('Modal not initialized');
        return;
    }
    
    try {
        const response = await fetch('http://localhost:5000/api/students', {
            method: 'GET',
            headers: { 
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            credentials: 'include'
        });
        
        console.log('Response status:', response.status);
        
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || 'Failed to fetch students');
        }
        
        const students = await response.json();
        console.log('Fetched students:', students);
        
        // Find the tbody within the modal
        const tbody = addLearnersModal.querySelector('#students-table-body');
        if (!tbody) {
            console.error('Students table body not found in the modal');
            return;
        }
        
        tbody.innerHTML = '';
        
        if (!Array.isArray(students) || students.length === 0) {
            console.log('No students found in the response');
            tbody.innerHTML = '<tr><td colspan="4">No students found</td></tr>';
            return;
        }
        
        // Initialize class filter with static structure
        updateClassFilter();
        
        // Add event listener for search input
        const searchInput = document.getElementById('student-search');
        if (searchInput) {
            searchInput.addEventListener('input', filterStudents);
        }
        
        // Clear existing rows
        tbody.innerHTML = '';
        
        // Log the first student to see the structure
        if (students.length > 0) {
            console.log('Sample student data:', students[0]);
            console.log('Available class values in filter:', 
                Array.from(addLearnersModal.querySelectorAll('#class-filter option')).map(opt => opt.value));
        }
        
        // Add each student to the table
        students.forEach(student => {
            try {
                if (!student) return;
                
                // Safely get student data with fallbacks
                const studentId = student._id || '';
                const studentName = student.name || student.fullName || 'N/A';
                const studentClass = student.profile?.className || student.class || 'N/A';
                const studentIdDisplay = student.studentId || student.registrationNumber || 'N/A';
                
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td><input type="checkbox" class="student-checkbox" value="${studentId}"></td>
                    <td>${escapeHtml(studentName)}</td>
                    <td>${escapeHtml(studentIdDisplay)}</td>
                    <td>${escapeHtml(studentClass)}</td>
                `;
                tbody.appendChild(row);
                
            } catch (error) {
                console.error('Error rendering student:', error, student);
            }
        });
        
        // If no students were added, show a message
        if (tbody.children.length === 0) {
            tbody.innerHTML = '<tr><td colspan="4" class="text-center">No students found</td></tr>';
        }
    } catch (error) {
        console.error('Error loading students:', error);
        const tbody = document.getElementById('students-table-body');
        if (tbody) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="4" class="error-message">
                        Error loading students: ${error.message || 'Unknown error'}
                    </td>
                </tr>`;
        }
        showMessage(`Error loading students: ${error.message || 'Please try again later'}`, 'error');
    }
}

async function addStudentsToClub(studentIds) {
    const token = localStorage.getItem('token');
    if (!currentClubId) {
        console.error('No club ID found');
        showNotification('Error: No club selected', 'error');
        return;
    }

    try {
        const endpoint = `http://localhost:5000/api/clubs/${currentClubId}/students`;
        console.log('Making request to:', endpoint, 'with data:', { students: studentIds });
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify({ students: studentIds })
        });

        const responseData = await response.json().catch(() => ({
            error: 'Invalid response from server',
            status: response.status,
            statusText: response.statusText
        }));

        console.log('API Response:', { status: response.status, data: responseData });

        if (response.ok) {
            closeAddLearnersModal();
            showNotification(
                responseData.message || 'Students added to club successfully',
                'success'
            );
            
            // Refresh the UI if needed
            if (window.loadClubs) {
                window.loadClubs();
            }
        } else {
            console.error('Failed to add students:', {
                status: response.status,
                error: responseData.error || responseData.message || 'Unknown error'
            });
            
            showNotification(
                responseData.error || responseData.message || 'Failed to add students to club',
                'error'
            );
        }
    } catch (error) {
        console.error('Error in addStudentsToClub:', error);
        showNotification(
            error.message || 'An error occurred while adding students to the club',
            'error'
        );
    }
}

// Add event listeners for add learners modal
if (document.getElementById('close-add-learners-modal')) {
    document.getElementById('close-add-learners-modal').onclick = closeAddLearnersModal;
}
if (document.getElementById('close-add-learners')) {
    document.getElementById('close-add-learners').onclick = closeAddLearnersModal;
}
if (document.getElementById('add-selected-students')) {
    document.getElementById('add-selected-students').onclick = async () => {
        const selectedStudents = Array.from(document.querySelectorAll('.student-checkbox:checked'))
            .map(cb => cb.getAttribute('data-id'));
        await addStudentsToClub(selectedStudents);
    };
}

function openUniversalModal(modal) { modal.style.display = 'block'; }
function closeUniversalModal(modal) { modal.style.display = 'none'; }

if (closeUniversalEditModal) closeUniversalEditModal.onclick = () => closeUniversalModal(universalEditModal);
if (closeUniversalConfirmModal) closeUniversalConfirmModal.onclick = () => closeUniversalModal(universalConfirmModal);
window.onclick = function(event) {
  if (event.target === universalEditModal) closeUniversalModal(universalEditModal);
  if (event.target === universalConfirmModal) closeUniversalModal(universalConfirmModal);
};

// --- Bulk Actions Logic for Clubs ---
const clubsBulkToolbar = document.getElementById('clubs-bulk-toolbar');
const clubsBulkDelete = document.getElementById('clubs-bulk-delete');
const clubsBulkExport = document.getElementById('clubs-bulk-export');
const selectAllClubs = document.getElementById('select-all-clubs');

let selectedClubIds = new Set();

function renderClubRow(club) {
    return `
        <li class="py-4 flex items-center justify-between border-b border-gray-200">
            <div class="flex-1">
                <h3 class="text-lg font-medium">${escapeHtml(club.name)}</h3>
                <p class="text-gray-600">${escapeHtml(club.description)}</p>
                <p class="text-sm text-gray-500">Members: ${club.members ? club.members.length : 0}</p>
            </div>
            <div class="flex space-x-2">
                <button class="view-members-btn px-3 py-1 bg-purple-500 text-white rounded" 
                        data-id="${club._id}" 
                        data-name="${escapeHtml(club.name)}">
                    View Members
                </button>
                <button class="add-learners-btn px-3 py-1 bg-green-500 text-white rounded" 
                        data-id="${club._id}">
                    Add Members
                </button>
                <button class="edit-club-btn px-3 py-1 bg-blue-500 text-white rounded" 
                        data-id="${club._id}">
                    Edit
                </button>
                <button class="delete-club-btn px-3 py-1 bg-red-500 text-white rounded" 
                        data-id="${club._id}">
                    Delete
                </button>
            </div>
        </li>
    `;
}

function updateClubsBulkToolbarState() {
    const hasSelection = selectedClubIds.size > 0;
    clubsBulkToolbar.style.display = hasSelection ? 'block' : 'none';
    clubsBulkDelete.disabled = !hasSelection;
    clubsBulkExport.disabled = !hasSelection;
}

function clearClubSelections() {
    selectedClubIds.clear();
    document.querySelectorAll('.club-select-checkbox').forEach(cb => cb.checked = false);
    if (selectAllClubs) selectAllClubs.checked = false;
    updateClubsBulkToolbarState();
}

// --- Advanced Filters for Clubs ---
function getClubFilters() {
    return {
        search: clubSearch.value.trim(),
        type: clubTypeFilter.value
    };
}

function buildClubQueryString(filters) {
    const params = [];
    if (filters.search) params.push(`search=${encodeURIComponent(filters.search)}`);
    if (filters.type) params.push(`type=${encodeURIComponent(filters.type)}`);
    return params.length ? '?' + params.join('&') : '';
}

async function loadClubsWithFilters() {
    const token = localStorage.getItem('token');
    const filters = getClubFilters();
    let url = 'http://localhost:5000/api/clubs' + buildClubQueryString(filters);
    try {
        const res = await fetch(url, { headers: { 'Authorization': `Bearer ${token}` } });
        const clubs = await res.json();
        clubList.innerHTML = '';
        if (Array.isArray(clubs) && clubs.length > 0) {
            clubs.forEach(club => {
                clubList.insertAdjacentHTML('beforeend', renderClubRow(club));
            });
        } else {
            clubList.innerHTML = '<li>No clubs found.</li>';
        }
        document.querySelectorAll('.club-select-checkbox').forEach(cb => {
            cb.addEventListener('change', function() {
                if (this.checked) {
                    selectedClubIds.add(this.getAttribute('data-id'));
                } else {
                    selectedClubIds.delete(this.getAttribute('data-id'));
                }
                updateClubsBulkToolbarState();
            });
        });
        if (selectAllClubs) {
            selectAllClubs.checked = false;
            selectAllClubs.onchange = function() {
                if (this.checked) {
                    document.querySelectorAll('.club-select-checkbox').forEach(cb => {
                        cb.checked = true;
                        selectedClubIds.add(cb.getAttribute('data-id'));
                    });
                } else {
                    document.querySelectorAll('.club-select-checkbox').forEach(cb => {
                        cb.checked = false;
                        selectedClubIds.delete(cb.getAttribute('data-id'));
                    });
                }
                updateClubsBulkToolbarState();
            };
        }
        updateClubsBulkToolbarState();
    } catch (err) {
        clubList.innerHTML = '<li>Error loading clubs.</li>';
    }
}

// Attach filter listeners
if (clubSearch) clubSearch.addEventListener('input', () => loadClubsWithFilters());
if (clubTypeFilter) clubTypeFilter.addEventListener('change', () => loadClubsWithFilters());

if (clubsBulkDelete) {
    clubsBulkDelete.onclick = async function() {
        if (selectedClubIds.size === 0) return;
        universalConfirmTitle.textContent = 'Delete Selected Clubs';
        universalConfirmMessage.textContent = `Are you sure you want to delete ${selectedClubIds.size} selected club(s)?`;
        openUniversalModal(universalConfirmModal);
        universalConfirmYes.onclick = async () => {
            closeUniversalModal(universalConfirmModal);
            const token = localStorage.getItem('token');
            for (const clubId of selectedClubIds) {
                try {
                    await fetch(`http://localhost:5000/api/clubs/${clubId}`, {
                        method: 'DELETE',
                        headers: { 'Authorization': `Bearer ${token}` }
                    });
                } catch {}
            }
            clearClubSelections();
            loadClubsWithFilters();
        };
        universalConfirmNo.onclick = () => closeUniversalModal(universalConfirmModal);
    };
}

if (clubsBulkExport) {
    clubsBulkExport.onclick = async function() {
        if (selectedClubIds.size === 0) return;
        const token = localStorage.getItem('token');
        let url = 'http://localhost:5000/api/clubs';
        const res = await fetch(url, { headers: { 'Authorization': `Bearer ${token}` } });
        const clubs = await res.json();
        const selected = clubs.filter(c => selectedClubIds.has(c._id));
        let csv = 'Name,Description\n';
        selected.forEach(c => {
            csv += `${c.name},${c.description || ''}\n`;
        });
        const blob = new Blob([csv], { type: 'text/csv' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = 'selected_clubs.csv';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };
}

async function handleClubFormSubmit(e) {
    e.preventDefault();
    const name = document.getElementById('club-name').value;
    const description = document.getElementById('club-description').value;
    const token = localStorage.getItem('token');
    try {
        const res = await fetch('http://localhost:5000/api/clubs', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify({ name, description })
        });
        if (res.ok) {
            clubForm.reset();
            loadClubsWithFilters();
        } else {
            alert('Failed to add club');
        }
    } catch (err) {
        alert('Network error');
    }
}

async function handleClubListClick(e) {
    const btn = e.target;
    const clubId = btn.getAttribute('data-id');
    if (!clubId) return;
    const token = localStorage.getItem('token');
    // Edit Club (universal modal)
    if (btn.classList.contains('edit-club-btn')) {
        const li = btn.closest('li');
        const currentName = li.querySelector('strong').textContent;
        const currentDesc = li.querySelector('span').textContent;
        universalEditForm.innerHTML = `
            <input type="hidden" name="clubId" value="${clubId}" />
            <div class='form-group'><label>Name:</label><input type='text' name='name' value='${currentName}' required /></div>
            <div class='form-group'><label>Description:</label><input type='text' name='description' value='${currentDesc}' /></div>
            <button type='submit'>Save Changes</button>
        `;
        universalEditMsg.style.display = 'none';
        openUniversalModal(universalEditModal);
        universalEditForm.onsubmit = async (ev) => {
            ev.preventDefault();
            universalEditMsg.style.display = 'none';
            const formData = new FormData(universalEditForm);
            const name = formData.get('name');
            const description = formData.get('description');
            try {
                const res = await fetch(`http://localhost:5000/api/clubs/${clubId}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`,
                    },
                    body: JSON.stringify({ name, description })
                });
                if (res.ok) {
                    universalEditMsg.textContent = 'Club updated successfully!';
                    universalEditMsg.style.color = 'green';
                    universalEditMsg.style.display = 'block';
                    setTimeout(() => {
                        closeUniversalModal(universalEditModal);
                        loadClubsWithFilters();
                    }, 1000);
                } else {
                    universalEditMsg.textContent = 'Failed to update club.';
                    universalEditMsg.style.color = 'red';
                    universalEditMsg.style.display = 'block';
                }
            } catch {
                universalEditMsg.textContent = 'Network error.';
                universalEditMsg.style.color = 'red';
                universalEditMsg.style.display = 'block';
            }
        };
    }
    // Delete Club (universal confirm modal)
    else if (btn.classList.contains('delete-club-btn')) {
        universalConfirmTitle.textContent = 'Delete Club';
        universalConfirmMessage.textContent = 'Are you sure you want to delete this club?';
        openUniversalModal(universalConfirmModal);
        universalConfirmYes.onclick = async () => {
            closeUniversalModal(universalConfirmModal);
            try {
                const res = await fetch(`http://localhost:5000/api/clubs/${clubId}`, {
                    method: 'DELETE',
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (res.ok) {
                    loadClubsWithFilters();
                }
            } catch {}
        };
        universalConfirmNo.onclick = () => closeUniversalModal(universalConfirmModal);
    }
}

if (clubForm) {
  clubForm.addEventListener('submit', async (e) => {
    await handleClubFormSubmit(e);
  });
}
if (clubList) {
  clubList.addEventListener('click', async (e) => {
    await handleClubListClick(e);
  });
}

document.addEventListener('DOMContentLoaded', () => {
    loadClubsWithFilters();
});

})();
