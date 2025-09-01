(function() {
// Role Management Logic
const roleForm = document.getElementById('role-form');
const roleList = document.getElementById('role-list');
const roleSearch = document.getElementById('role-search');

// --- Universal Modal Logic (Roles) ---
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

function openUniversalModal(modal) { modal.style.display = 'block'; }
function closeUniversalModal(modal) { modal.style.display = 'none'; }

if (closeUniversalEditModal) closeUniversalEditModal.onclick = () => closeUniversalModal(universalEditModal);
if (closeUniversalConfirmModal) closeUniversalConfirmModal.onclick = () => closeUniversalModal(universalConfirmModal);
window.onclick = function(event) {
  if (event.target === universalEditModal) closeUniversalModal(universalEditModal);
  if (event.target === universalConfirmModal) closeUniversalModal(universalConfirmModal);
};

// --- Bulk Actions Logic for Roles ---
const rolesBulkToolbar = document.getElementById('roles-bulk-toolbar');
const rolesBulkDelete = document.getElementById('roles-bulk-delete');
const rolesBulkExport = document.getElementById('roles-bulk-export');
const selectAllRoles = document.getElementById('select-all-roles');
const roleTableBody = document.getElementById('role-table-body');

let selectedRoleIds = new Set();

function renderRoleRow(role) {
    return `<tr>
        <td><input type="checkbox" class="role-select-checkbox" data-id="${role._id}"></td>
        <td>${role.name}</td>
        <td>${Array.isArray(role.permissions) ? role.permissions.join(', ') : ''}</td>
        <td>
            <button class="edit-role-btn" data-id="${role._id}">Edit</button>
            <button class="delete-role-btn" data-id="${role._id}">Delete</button>
        </td>
    </tr>`;
}

function updateRolesBulkToolbarState() {
    const hasSelection = selectedRoleIds.size > 0;
    rolesBulkToolbar.style.display = hasSelection ? 'block' : 'none';
    rolesBulkDelete.disabled = !hasSelection;
    rolesBulkExport.disabled = !hasSelection;
}

function clearRoleSelections() {
    selectedRoleIds.clear();
    document.querySelectorAll('.role-select-checkbox').forEach(cb => cb.checked = false);
    if (selectAllRoles) selectAllRoles.checked = false;
    updateRolesBulkToolbarState();
}

// --- Advanced Filters for Roles ---
const rolesSearch = document.getElementById('roles-search');
const rolesPermissionFilter = document.getElementById('roles-permission-filter');

function getRolesFilters() {
    return {
        search: rolesSearch.value.trim(),
        permission: rolesPermissionFilter.value
    };
}

function buildRolesQueryString(filters) {
    const params = [];
    if (filters.search) params.push(`search=${encodeURIComponent(filters.search)}`);
    if (filters.permission) params.push(`permission=${encodeURIComponent(filters.permission)}`);
    return params.length ? '?' + params.join('&') : '';
}

async function loadRolesWithFilters() {
    if (!roleTableBody) {
        console.error('Role table body not found');
        return;
    }

    const token = localStorage.getItem('token');
    const filters = getRolesFilters();
    let url = 'http://localhost:5000/api/roles' + buildRolesQueryString(filters);
    try {
        const res = await fetch(url, { headers: { 'Authorization': `Bearer ${token}` } });
        
        if (!res.ok) {
            const error = await res.json();
            if (res.status === 401) {
                roleTableBody.innerHTML = '<tr><td colspan="4">Unauthorized. Please login again.</td></tr>';
                console.error('Unauthorized access:', error);
                return;
            }
            throw new Error(error.msg || 'Failed to load roles');
        }

        const roles = await res.json();
        roleTableBody.innerHTML = '';
        if (Array.isArray(roles) && roles.length > 0) {
            roles.forEach(role => {
                roleTableBody.insertAdjacentHTML('beforeend', renderRoleRow(role));
            });
        } else {
            roleTableBody.innerHTML = '<tr><td colspan="4">No roles found.</td></tr>';
        }
        document.querySelectorAll('.role-select-checkbox').forEach(cb => {
            cb.addEventListener('change', function() {
                if (this.checked) {
                    selectedRoleIds.add(this.getAttribute('data-id'));
                } else {
                    selectedRoleIds.delete(this.getAttribute('data-id'));
                }
                updateRolesBulkToolbarState();
            });
        });
        if (selectAllRoles) {
            selectAllRoles.checked = false;
            selectAllRoles.onchange = function() {
                if (this.checked) {
                    document.querySelectorAll('.role-select-checkbox').forEach(cb => {
                        cb.checked = true;
                        selectedRoleIds.add(cb.getAttribute('data-id'));
                    });
                } else {
                    document.querySelectorAll('.role-select-checkbox').forEach(cb => {
                        cb.checked = false;
                        selectedRoleIds.delete(cb.getAttribute('data-id'));
                    });
                }
                updateRolesBulkToolbarState();
            };
        }
        updateRolesBulkToolbarState();
    } catch (err) {
        roleTableBody.innerHTML = '<tr><td colspan="4">Error loading roles.</td></tr>';
    }
}

if (rolesSearch) rolesSearch.addEventListener('input', () => loadRolesWithFilters());
if (rolesPermissionFilter) rolesPermissionFilter.addEventListener('change', () => loadRolesWithFilters());

// --- Add or Update Role ---
if (roleForm) {
    roleForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const name = document.getElementById('role-name').value;
        const permissions = document.getElementById('role-permissions').value.split(',').map(p => p.trim());
        const token = localStorage.getItem('token');
        try {
            const res = await fetch('http://localhost:5000/api/roles', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({ name, permissions })
            });
            if (res.ok) {
                roleForm.reset();
                loadRolesWithFilters();
            } else {
                alert('Failed to add role');
            }
        } catch (err) {
            alert('Network error');
        }
    });
}

// --- Edit Role ---
roleTableBody.addEventListener('click', async (e) => {
    const btn = e.target;
    const roleId = btn.getAttribute('data-id');
    if (!roleId) return;
    const token = localStorage.getItem('token');
    // Edit Role (universal modal)
    if (btn.classList.contains('edit-role-btn')) {
        const li = btn.closest('tr');
        const currentName = li.querySelector('td:nth-child(2)').textContent;
        const currentPerms = li.querySelector('td:nth-child(3)').textContent;
        universalEditForm.innerHTML = `
            <input type="hidden" name="roleId" value="${roleId}" />
            <div class='form-group'><label>Role Name:</label><input type='text' name='name' value='${currentName}' required /></div>
            <div class='form-group'><label>Permissions (comma separated):</label><input type='text' name='permissions' value='${currentPerms}' required /></div>
            <button type='submit'>Save Changes</button>
        `;
        universalEditMsg.style.display = 'none';
        openUniversalModal(universalEditModal);
        universalEditForm.onsubmit = async (ev) => {
            ev.preventDefault();
            universalEditMsg.style.display = 'none';
            const formData = new FormData(universalEditForm);
            const name = formData.get('name');
            const permissions = formData.get('permissions').split(',').map(p => p.trim());
            try {
                const res = await fetch(`http://localhost:5000/api/roles/${roleId}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`,
                    },
                    body: JSON.stringify({ name, permissions })
                });
                if (res.ok) {
                    universalEditMsg.textContent = 'Role updated successfully!';
                    universalEditMsg.style.color = 'green';
                    universalEditMsg.style.display = 'block';
                    setTimeout(() => {
                        closeUniversalModal(universalEditModal);
                        loadRolesWithFilters();
                    }, 1000);
                } else {
                    universalEditMsg.textContent = 'Failed to update role.';
                    universalEditMsg.style.color = 'red';
                    universalEditMsg.style.display = 'block';
                }
            } catch (err) {
                universalEditMsg.textContent = 'Network error.';
                universalEditMsg.style.color = 'red';
                universalEditMsg.style.display = 'block';
            }
        };
    }
    // Delete Role (universal confirm modal)
    else if (btn.classList.contains('delete-role-btn')) {
        universalConfirmTitle.textContent = 'Delete Role';
        universalConfirmMessage.textContent = 'Are you sure you want to delete this role?';
        openUniversalModal(universalConfirmModal);
        universalConfirmYes.onclick = async () => {
            try {
                const res = await fetch(`http://localhost:5000/api/roles/${roleId}`, {
                    method: 'DELETE',
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (res.ok) {
                    loadRolesWithFilters();
                    closeUniversalModal(universalConfirmModal);
                } else {
                    alert('Failed to delete role');
                }
            } catch (err) {
                alert('Network error');
            }
        };
        universalConfirmNo.onclick = () => closeUniversalModal(universalConfirmModal);
    }
});

// --- Bulk Delete Roles ---
if (rolesBulkDelete) {
    rolesBulkDelete.onclick = async () => {
        if (selectedRoleIds.size === 0) return;
        if (!confirm('Are you sure you want to delete the selected roles?')) return;
        const token = localStorage.getItem('token');
        try {
            const res = await fetch('http://localhost:5000/api/roles', {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ ids: Array.from(selectedRoleIds) })
            });
            if (res.ok) {
                clearRoleSelections();
                loadRolesWithFilters();
            } else {
                alert('Failed to bulk delete roles');
            }
        } catch (err) {
            alert('Network error');
        }
    };
}

// Bulk Export
if (rolesBulkExport) {
    rolesBulkExport.onclick = async function() {
        if (selectedRoleIds.size === 0) return;
        const token = localStorage.getItem('token');
        let url = 'http://localhost:5000/api/roles';
        const res = await fetch(url, { headers: { 'Authorization': `Bearer ${token}` } });
        const roles = await res.json();
        const selected = roles.filter(r => selectedRoleIds.has(r._id));
        let csv = 'Role Name,Permissions\n';
        selected.forEach(r => {
            csv += `${r.name},"${Array.isArray(r.permissions) ? r.permissions.join(', ') : ''}"\n`;
        });
        const blob = new Blob([csv], { type: 'text/csv' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = 'selected_roles.csv';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };
}

document.addEventListener('DOMContentLoaded', () => {
    loadRolesWithFilters();
});

})();
