(function() {
// Accountant Management Logic
const feeForm = document.getElementById('fee-form');
const feeList = document.getElementById('fee-list');
const feeSearch = document.getElementById('fees-search');
const feesStatusFilter = document.getElementById('fees-status-filter');
const feesClassFilter = document.getElementById('fees-class-filter');
const feeTableBody = document.getElementById('fee-table-body');

// --- Universal Modal Logic (Accountant) ---
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

// Add summary dashboard HTML
const summaryDashboard = `
<div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
    <div class="bg-white p-4 rounded-lg shadow">
        <div class="text-sm font-medium text-gray-500">Total Fees</div>
        <div class="mt-1 text-2xl font-semibold text-gray-900" id="total-fees">Ksh 0.00</div>
        <div class="mt-1 text-xs text-gray-500">This term</div>
    </div>
    <div class="bg-white p-4 rounded-lg shadow">
        <div class="text-sm font-medium text-gray-500">Total Paid</div>
        <div class="mt-1 text-2xl font-semibold text-green-600" id="total-paid">Ksh 0.00</div>
        <div class="mt-1 text-xs text-gray-500">This term</div>
    </div>
    <div class="bg-white p-4 rounded-lg shadow">
        <div class="text-sm font-medium text-gray-500">Total Balance</div>
        <div class="mt-1 text-2xl font-semibold text-red-600" id="total-balance">Ksh 0.00</div>
        <div class="mt-1 text-xs text-gray-500">Outstanding</div>
    </div>
    <div class="bg-white p-4 rounded-lg shadow">
        <div class="text-sm font-medium text-gray-500">Overdue Fees</div>
        <div class="mt-1 text-2xl font-semibold text-orange-600" id="overdue-fees">Ksh 0.00</div>
        <div class="mt-1 text-xs text-gray-500">Past due date</div>
    </div>
</div>
`;

// Insert summary dashboard before the filters
document.addEventListener('DOMContentLoaded', () => {
    const filtersSection = document.getElementById('fees-filters');
    if (filtersSection) {
        filtersSection.insertAdjacentHTML('beforebegin', summaryDashboard);
    }
});

// Update summary dashboard with fee statistics
function updateFeeSummary(fees) {
    if (!fees || !Array.isArray(fees)) return;
    
    const now = new Date();
    let totalFees = 0;
    let totalPaid = 0;
    let totalBalance = 0;
    let totalOverdue = 0;
    
    fees.forEach(fee => {
        const paid = (parseFloat(fee.firstInstallment) || 0) + 
                    (parseFloat(fee.secondInstallment) || 0) + 
                    (parseFloat(fee.thirdInstallment) || 0);
        
        totalFees += parseFloat(fee.feesPerTerm) || 0;
        totalPaid += paid;
        
        const balance = (parseFloat(fee.bal) || 0);
        totalBalance += balance;
        
        if (fee.dueDate && new Date(fee.dueDate) < now && balance > 0) {
            totalOverdue += balance;
        }
    });
    
    // Update the dashboard
    document.getElementById('total-fees').textContent = `Ksh ${totalFees.toLocaleString('en-US', {minimumFractionDigits: 2})}`;
    document.getElementById('total-paid').textContent = `Ksh ${totalPaid.toLocaleString('en-US', {minimumFractionDigits: 2})}`;
    document.getElementById('total-balance').textContent = `Ksh ${totalBalance.toLocaleString('en-US', {minimumFractionDigits: 2})}`;
    document.getElementById('overdue-fees').textContent = `Ksh ${totalOverdue.toLocaleString('en-US', {minimumFractionDigits: 2})}`;
}

// --- Bulk Actions Logic for Fees ---
const feesBulkToolbar = document.getElementById('fees-bulk-toolbar');
const feesBulkDelete = document.getElementById('fees-bulk-delete');
const feesBulkExport = document.getElementById('fees-bulk-export');
const selectAllFees = document.getElementById('select-all-fees');
const feeTableBody = document.getElementById('fee-table-body');

let selectedFeeIds = new Set();

function renderFeeRow(fee) {
    // Calculate total paid amount
    const totalPaid = (parseFloat(fee.firstInstallment || 0) + 
                      parseFloat(fee.secondInstallment || 0) + 
                      parseFloat(fee.thirdInstallment || 0)).toFixed(2);
    
    // Determine status and status color
    let status = 'Pending';
    let statusClass = 'bg-yellow-100 text-yellow-800';
    
    if (parseFloat(fee.bal) <= 0) {
        status = 'Paid';
        statusClass = 'bg-green-100 text-green-800';
    } else if (new Date(fee.dueDate) < new Date()) {
        status = 'Overdue';
        statusClass = 'bg-red-100 text-red-800';
    }

    // Format date
    const dueDate = fee.dueDate ? new Date(fee.dueDate).toLocaleDateString() : '';
    
    return `
    <tr class="hover:bg-gray-50" data-student-id="${fee.studentId || ''}" data-class-id="${fee.classId || ''}">
        <td class="px-6 py-4 whitespace-nowrap">
            <input type="checkbox" class="fee-select-checkbox h-4 w-4 text-blue-600 rounded" data-id="${fee._id}">
        </td>
        <td class="px-6 py-4 whitespace-nowrap">
            <div class="text-sm font-medium text-gray-900">${fee.studentName || fee.student || 'N/A'}</div>
            <div class="text-xs text-gray-500">ID: ${fee.studentId || 'N/A'}</div>
        </td>
        <td class="px-6 py-4 whitespace-nowrap">
            <div class="text-sm text-gray-900">${fee.className || 'N/A'}</div>
            <div class="text-xs text-gray-500">ID: ${fee.classId || 'N/A'}</div>
        </td>
        <td class="px-6 py-4 whitespace-nowrap">
            <div class="text-sm text-gray-900">Ksh ${parseFloat(fee.feesPerTerm || 0).toLocaleString('en-US', {minimumFractionDigits: 2})}</div>
        </td>
        <td class="px-6 py-4 whitespace-nowrap">
            <div class="text-sm text-gray-900">Ksh ${parseFloat(totalPaid).toLocaleString('en-US', {minimumFractionDigits: 2})}</div>
        </td>
        <td class="px-6 py-4 whitespace-nowrap">
            <div class="text-sm font-medium ${parseFloat(fee.bal) > 0 ? 'text-red-600' : 'text-green-600'}">
                Ksh ${parseFloat(fee.bal || 0).toLocaleString('en-US', {minimumFractionDigits: 2})}
            </div>
        </td>
        <td class="px-6 py-4 whitespace-nowrap">
            <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${statusClass}">
                ${status}
            </span>
        </td>
        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
            ${dueDate}
        </td>
        <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
            <button class="edit-fee-btn text-indigo-600 hover:text-indigo-900 mr-3" data-id="${fee._id}">
                <i class="fas fa-edit"></i> Edit
            </button>
            <button class="delete-fee-btn text-red-600 hover:text-red-900" data-id="${fee._id}">
                <i class="fas fa-trash-alt"></i>
            </button>
        </td>
    </tr>`;
}

function updateFeesBulkToolbarState() {
    const hasSelection = selectedFeeIds.size > 0;
    feesBulkToolbar.style.display = hasSelection ? 'block' : 'none';
    feesBulkDelete.disabled = !hasSelection;
    feesBulkExport.disabled = !hasSelection;
    feesBulkPrint.disabled = !hasSelection;
}

function clearFeeSelections() {
    selectedFeeIds.clear();
    document.querySelectorAll('.fee-select-checkbox').forEach(cb => cb.checked = false);
    if (selectAllFees) selectAllFees.checked = false;
    updateFeesBulkToolbarState();
}

function getFeesFilters() {
    return {
        search: feeSearch.value.trim(),
        status: feesStatusFilter.value,
        className: feesClassFilter.value.trim()
    };
}

function buildFeesQueryString(filters) {
    const params = [];
    if (filters.search) params.push(`search=${encodeURIComponent(filters.search)}`);
    if (filters.status) params.push(`status=${encodeURIComponent(filters.status)}`);
    if (filters.className) params.push(`class=${encodeURIComponent(filters.className)}`);
    return params.length ? '?' + params.join('&') : '';
}

// Add date range filter
function addDateRangeFilter() {
    const dateFilterHTML = `
    <div class="flex flex-col md:flex-row gap-4 mb-4">
        <div class="w-full md:w-auto">
            <label for="start-date" class="block text-sm font-medium text-gray-700 mb-1">From Date</label>
            <input type="date" id="start-date" class="w-full p-2 border rounded">
        </div>
        <div class="w-full md:w-auto">
            <label for="end-date" class="block text-sm font-medium text-gray-700 mb-1">To Date</label>
            <input type="date" id="end-date" class="w-full p-2 border rounded">
        </div>
        <div class="flex items-end">
            <button id="apply-date-filter" class="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">
                Apply Date Range
            </button>
        </div>
    </div>
    `;
    
    const filtersSection = document.getElementById('fees-filters');
    if (filtersSection) {
        filtersSection.insertAdjacentHTML('afterend', dateFilterHTML);
        
        // Set default date range (current month)
        const today = new Date();
        const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
        const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);
        
        document.getElementById('start-date').value = formatDate(firstDay);
        document.getElementById('end-date').value = formatDate(lastDay);
        
        // Add event listener for apply button
        document.getElementById('apply-date-filter').addEventListener('click', loadFeesWithFilters);
    }
}

// Helper function to format date as YYYY-MM-DD
function formatDate(date) {
    const d = new Date(date);
    let month = '' + (d.getMonth() + 1);
    let day = '' + d.getDate();
    const year = d.getFullYear();

    if (month.length < 2) month = '0' + month;
    if (day.length < 2) day = '0' + day;

    return [year, month, day].join('-');
}

// Global variables
let feeTableBody;
let feeSearch, feesStatusFilter, feesClassFilter;

// Initialize fee records table
function initializeFeeRecords() {
    console.log('Initializing fee records...');
    
    // Get elements
    feeTableBody = document.getElementById('fee-table-body');
    feeSearch = document.getElementById('fees-search');
    feesStatusFilter = document.getElementById('fees-status-filter');
    feesClassFilter = document.getElementById('fees-class-filter');
    
    console.log('Elements initialized:', {
        feeTableBody: !!feeTableBody,
        feeSearch: !!feeSearch,
        feesStatusFilter: !!feesStatusFilter,
        feesClassFilter: !!feesClassFilter
    });
    
    // Load classes for the filter
    if (feesClassFilter) {
        loadClassesForFilter();
    } else {
        console.error('feesClassFilter element not found');
    }
    
    // Set up event listeners
    if (feeSearch) {
        feeSearch.addEventListener('input', loadFeesWithFilters);
    } else {
        console.error('feeSearch element not found');
    }
    
    if (feesStatusFilter) {
        feesStatusFilter.addEventListener('change', loadFeesWithFilters);
    } else {
        console.error('feesStatusFilter element not found');
    }
    
    if (feesClassFilter) {
        feesClassFilter.addEventListener('change', loadFeesWithFilters);
    }
    
    // Initial load
    console.log('Performing initial load of fee records...');
    loadFeesWithFilters();
}

// Initialize when the DOM is fully loaded
if (document.readyState === 'loading') {
    // Loading hasn't finished yet
    document.addEventListener('DOMContentLoaded', initializeFeeRecords);
} else {
    // `DOMContentLoaded` has already fired
    initializeFeeRecords();
}

async function loadFeesWithFilters() {
    console.log('loadFeesWithFilters called');
    const token = localStorage.getItem('token');
    
    // Get filter values
    const search = feeSearch ? feeSearch.value.trim() : '';
    const status = feesStatusFilter ? feesStatusFilter.value : '';
    const className = feesClassFilter ? feesClassFilter.value : '';
    
    console.log('Loading fees with filters:', { search, status, className });
    
    // Debug: Check if elements exist
    console.log('feeSearch exists:', !!feeSearch);
    console.log('feesStatusFilter exists:', !!feesStatusFilter);
    console.log('feesClassFilter exists:', !!feesClassFilter);
    console.log('feeTableBody exists:', !!feeTableBody);
    
    // Build URL with query parameters
    let url = 'http://localhost:5000/api/fees';
    const params = new URLSearchParams();
    
    if (search) params.append('search', search);
    if (status) params.append('status', status);
    if (className) params.append('class', className);
    
    const queryString = params.toString();
    if (queryString) {
        url += `?${queryString}`;
    }
    
    try {
        // Show loading state
        const loadingElement = document.getElementById('fee-records-loading');
        const noRecordsElement = document.getElementById('no-fee-records');
        const table = document.getElementById('fee-records-table');
        
        if (loadingElement) loadingElement.classList.remove('hidden');
        if (noRecordsElement) noRecordsElement.classList.add('hidden');
        if (table) table.classList.add('hidden');
        if (feeTableBody) feeTableBody.innerHTML = '';
        
        console.log('Fetching fees from:', url);
        console.log('Fetching fees from:', url);
        console.log('Auth token exists:', !!token);
        
        const res = await fetch(url, { 
            headers: { 
                'Authorization': `Bearer ${token}`,
                'Cache-Control': 'no-cache',
                'Pragma': 'no-cache'
            }
        });
        
        console.log('Response status:', res.status, res.statusText);
        
        // Get response text first to handle both JSON and text responses
        const responseText = await res.text();
        let fees = [];
        
        try {
            // Try to parse as JSON
            fees = JSON.parse(responseText);
            console.log('Parsed fees data:', fees);
        } catch (e) {
            console.error('Failed to parse response as JSON:', e);
            console.log('Response text:', responseText);
            throw new Error('Invalid JSON response from server');
        }
        
        if (!res.ok) {
            console.error('Failed to fetch fees:', res.status, res.statusText, fees);
            throw new Error(`Failed to fetch fees: ${res.status} ${res.statusText}`);
        }
        
        if (!Array.isArray(fees)) {
            console.error('Expected an array of fees, got:', typeof fees, fees);
            throw new Error('Invalid data format: expected an array of fees');
        }
        
        // Hide loading indicator
        if (loadingElement) loadingElement.classList.add('hidden');
        
        if (!feeTableBody) {
            console.error('feeTableBody is not defined after fetch');
            return;
        }
        
        feeTableBody.innerHTML = '';
        
        if (Array.isArray(fees) && fees.length > 0) {
            // Sort by date (newest first)
            fees.sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));
            
            // Add fee rows
            fees.forEach(fee => {
                if (fee && fee.student) {  // Only process valid fee records
                    feeTableBody.insertAdjacentHTML('beforeend', renderFeeRow(fee));
                }
            });
            
            // Show the table and hide 'no records' message
            if (table) table.classList.remove('hidden');
            if (noRecordsElement) noRecordsElement.classList.add('hidden');
        } else {
            // No records found
            if (table) table.classList.add('hidden');
            if (noRecordsElement) noRecordsElement.classList.remove('hidden');
        }
        }
        
        // Update the class filter options if needed
        updateClassFilterOptions(fees);
        
        // Render a single fee row
function renderFeeRow(fee) {
    if (!fee) return '';
    
    // Helper function to format currency
    const formatCurrency = (amount) => {
        try {
            const num = parseFloat(amount);
            if (isNaN(num)) return 'KES 0.00';
            return num.toLocaleString('en-US', {
                style: 'currency',
                currency: 'KES',
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            });
        } catch (e) {
            console.error('Error formatting currency:', e);
            return 'KES 0.00';
        }
    };
    
    // Helper function to format date
    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        try {
            const date = new Date(dateString);
            if (isNaN(date.getTime())) return 'Invalid Date';
            
            return date.toLocaleDateString('en-US', { 
                year: 'numeric', 
                month: 'short', 
                day: 'numeric' 
            });
        } catch (e) {
            console.error('Error formatting date:', e);
            return 'N/A';
        }
    };
    
    // Helper function to get status badge
    const getStatusBadge = (status) => {
        const statusMap = {
            'Paid': 'bg-green-100 text-green-800',
            'Pending': 'bg-yellow-100 text-yellow-800',
            'Overdue': 'bg-red-100 text-red-800',
            'default': 'bg-gray-100 text-gray-800'
        };
        
        const statusText = status || 'Unknown';
        const statusClass = statusMap[statusText] || statusMap['default'];
        
        return `
            <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${statusClass}">
                ${statusText}
            </span>
        `;
    };
    
    // Safely get student name
    const getStudentName = () => {
        try {
            if (typeof fee.student === 'string') return fee.student;
            if (fee.student && fee.student.name) return fee.student.name;
            return 'Unknown Student';
        } catch (e) {
            return 'Unknown Student';
        }
    };
    
    // Safely get class name
    const getClassName = () => {
        try {
            if (fee.className) return fee.className;
            if (fee.class && fee.class.name) return fee.class.name;
            return 'N/A';
        } catch (e) {
            return 'N/A';
        }
    };
    
    return `
        <tr class="hover:bg-gray-50 border-b border-gray-200">
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                ${getStudentName()}
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                ${getClassName()}
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                ${formatCurrency(fee.amount)}
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                ${formatCurrency(fee.firstInstallment)}
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                ${formatCurrency(fee.secondInstallment)}
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                ${formatCurrency(fee.thirdInstallment)}
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm font-medium ${
                parseFloat(fee.bal || 0) > 0 ? 'text-red-600' : 'text-green-600'
            }">
                ${formatCurrency(fee.bal)}
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm">
                ${getStatusBadge(fee.status)}
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                ${formatDate(fee.date || fee.createdAt)}
            </td>
        </tr>
    `;
}

// Update class filter dropdown with unique class names from fees
function updateClassFilterOptions(fees) {
    if (!feesClassFilter || !Array.isArray(fees)) return;
    
    try {
        // Get unique class names from fees
        const classNames = [];
        const seenClasses = new Set();
        
        fees.forEach(fee => {
            let className = '';
            
            // Try to get class name from different possible properties
            if (fee.className) {
                className = fee.className;
            } else if (fee.class && fee.class.name) {
                className = fee.class.name;
            } else if (fee.className) {
                className = fee.className;
            }
            
            // Add to list if not empty and not already added
            if (className && !seenClasses.has(className)) {
                seenClasses.add(className);
                classNames.push(className);
            }
        });
        
        // Sort class names alphabetically
        classNames.sort((a, b) => a.localeCompare(b));
        
        // Save current selection
        const currentValue = feesClassFilter.value;
        
        // Update options
        feesClassFilter.innerHTML = '<option value="">All Classes</option>';
        
        classNames.forEach(className => {
            const option = document.createElement('option');
            option.value = className;
            option.textContent = className;
            feesClassFilter.appendChild(option);
        });
        
        // Restore selection if still valid
        if (currentValue && classNames.includes(currentValue)) {
            feesClassFilter.value = currentValue;
        }
    } catch (error) {
        console.error('Error updating class filter options:', error);
    }
}

// Load classes for the filter dropdown
async function loadClassesForFilter() {
    if (!feesClassFilter) return;
    
    try {
        const token = localStorage.getItem('token');
        if (!token) {
            console.error('No authentication token found');
            return;
        }
        
        // Show loading state
        const loadingOption = document.createElement('option');
        loadingOption.value = '';
        loadingOption.textContent = 'Loading classes...';
        loadingOption.disabled = true;
        loadingOption.selected = true;
        
        // Clear existing options
        feesClassFilter.innerHTML = '';
        feesClassFilter.appendChild(loadingOption);
        
        // Make API request
        const response = await fetch('http://localhost:5000/api/classes', {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Cache-Control': 'no-cache',
                'Pragma': 'no-cache'
            }
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const classes = await response.json();
        
        if (!Array.isArray(classes)) {
            throw new Error('Invalid response format: expected an array of classes');
        }
        
        // Clear loading state
        feesClassFilter.innerHTML = '';
        
        // Add default option
        const defaultOption = document.createElement('option');
        defaultOption.value = '';
        defaultOption.textContent = 'All Classes';
        feesClassFilter.appendChild(defaultOption);
        
        if (classes.length === 0) {
            console.warn('No classes found in the response');
            return;
        }
        
        // Add class options
        classes
            .filter(cls => cls && cls.name) // Filter out invalid entries
            .sort((a, b) => a.name.localeCompare(b.name)) // Sort alphabetically
            .forEach(cls => {
                const option = document.createElement('option');
                option.value = cls.name;
                option.textContent = cls.name;
                feesClassFilter.appendChild(option);
            });
            
        console.log(`Loaded ${classes.length} classes for filter`);
        
    } catch (error) {
        console.error('Error loading classes for filter:', error);
        
        // Show error state
        feesClassFilter.innerHTML = '';
        const errorOption = document.createElement('option');
        errorOption.value = '';
        errorOption.textContent = 'Error loading classes';
        errorOption.disabled = true;
        feesClassFilter.appendChild(errorOption);
    }
}

// Add event listeners for checkboxes if needed
        document.querySelectorAll('.fee-select-checkbox').forEach(cb => {
            cb.addEventListener('change', async function() {
                if (this.checked) {
                    selectedFeeIds.add(this.getAttribute('data-id'));
                } else {
                    selectedFeeIds.delete(this.getAttribute('data-id'));
                }
                updateFeesBulkToolbarState();
            });
        });
        if (selectAllFees) {
            selectAllFees.checked = false;
            selectAllFees.onchange = async function() {
                if (this.checked) {
                    document.querySelectorAll('.fee-select-checkbox').forEach(cb => {
                        cb.checked = true;
                        selectedFeeIds.add(cb.getAttribute('data-id'));
                    });
                } else {
                    document.querySelectorAll('.fee-select-checkbox').forEach(cb => {
                        cb.checked = false;
                        selectedFeeIds.delete(cb.getAttribute('data-id'));
                    });
                }
                updateFeesBulkToolbarState();
            };
        }
        updateFeesBulkToolbarState();
    } catch (err) {
        feeTableBody.innerHTML = '<tr><td colspan="9">Error loading fees.</td></tr>';
    }
}

if (feesBulkDelete) {
    feesBulkDelete.onclick = async function() {
        if (selectedFeeIds.size === 0) return;
        universalConfirmTitle.textContent = 'Delete Selected Fee Records';
        universalConfirmMessage.textContent = `Are you sure you want to delete ${selectedFeeIds.size} selected fee record(s)?`;
        openUniversalModal(universalConfirmModal);
        universalConfirmYes.onclick = async () => {
            closeUniversalModal(universalConfirmModal);
            const token = localStorage.getItem('token');
            for (const feeId of selectedFeeIds) {
                try {
                    await fetch(`http://localhost:5000/api/fees/${feeId}`, {
                        method: 'DELETE',
                        headers: { 'Authorization': `Bearer ${token}` }
                    });
                } catch {}
            }
            clearFeeSelections();
            loadFeesWithFilters();
        };
        universalConfirmNo.onclick = () => closeUniversalModal(universalConfirmModal);
    };
}

if (feesBulkExport) {
    feesBulkExport.onclick = async function() {
        if (selectedFeeIds.size === 0) return;
        const token = localStorage.getItem('token');
        let url = 'http://localhost:5000/api/fees';
        const res = await fetch(url, { headers: { 'Authorization': `Bearer ${token}` } });
        const fees = await res.json();
        const selected = fees.filter(f => selectedFeeIds.has(f._id));
        let csv = 'Name,Class,Fees Per Term,First Installment,Second Installment,Third Installment,Bal\n';
        selected.forEach(f => {
            csv += `${f.student || ''},${f.className || ''},${f.feesPerTerm ?? ''},${f.firstInstallment ?? ''},${f.secondInstallment ?? ''},${f.thirdInstallment ?? ''},${f.bal ?? ''}\n`;
        });
        const blob = new Blob([csv], { type: 'text/csv' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = 'selected_fees.csv';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };
}

if (feesBulkPrint) {
    feesBulkPrint.onclick = async function() {
        if (selectedFeeIds.size === 0) return;
                    <td>${f.thirdInstallment ?? ''}</td>
                    <td>${f.bal ?? ''}</td>
                </tr>
            `;
        });
        printHtml += '</table>';
        const printWindow = window.open('', '', 'height=500,width=800');
        printWindow.document.write(printHtml);
        printWindow.document.close();
        printWindow.print();
    };
}

// Define the class structure globally
const CLASS_GROUPS = [
    {
        label: 'Pre-Primary',
        classes: [
            { value: 'Baby Class', text: 'Baby Class' },
            { value: 'PP1', text: 'PP1 (Pre-Primary 1)' },
            { value: 'PP2', text: 'PP2 (Pre-Primary 2)' }
        ]
    },
    {
        label: 'Lower Primary (Grade 1-3)',
        classes: [
            { value: 'Grade 1', text: 'Grade 1' },
            { value: 'Grade 2', text: 'Grade 2' },
            { value: 'Grade 3', text: 'Grade 3' }
        ]
    },
    {
        label: 'Upper Primary (Grade 4-6)',
        classes: [
            { value: 'Grade 4', text: 'Grade 4' },
            { value: 'Grade 5', text: 'Grade 5' },
            { value: 'Grade 6', text: 'Grade 6' }
        ]
    },
    {
        label: 'Junior Secondary (Grade 7-9)',
        classes: [
            { value: 'Grade 7', text: 'Grade 7' },
            { value: 'Grade 8', text: 'Grade 8' },
            { value: 'Grade 9', text: 'Grade 9' }
        ]
    },
    {
        label: 'Senior School (Grade 10-12)',
        classes: [
            { value: 'Grade 10', text: 'Grade 10' },
            { value: 'Grade 11', text: 'Grade 11' },
            { value: 'Grade 12', text: 'Grade 12' }
        ]
    }
];

// Load classes for the fee filter dropdown
async function loadClassesForFilter() {
    console.log('Loading classes for filter...');
    const classFilter = document.getElementById('fee-class-filter');
    
    if (!classFilter) {
        console.error('Could not find fee class filter element');
        return;
    }
    
    try {
        // Clear existing options
        classFilter.innerHTML = '<option value="">All Classes</option>';
        
        // Add loading state
        const loadingOption = document.createElement('option');
        loadingOption.value = '';
        loadingOption.textContent = 'Loading classes...';
        loadingOption.disabled = true;
        classFilter.appendChild(loadingOption);
        
        // Get classes from the server
        const token = localStorage.getItem('token');
        const response = await fetch('http://localhost:5000/api/classes', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!response.ok) {
            throw new Error('Failed to load classes');
        }
        
        const classes = await response.json();
        
        // Clear loading state
        classFilter.innerHTML = '<option value="">All Classes</option>';
        
        // Group classes by level
        const classGroups = {
            'Pre-Primary': [],
            'Lower Primary (Grade 1-3)': [],
            'Upper Primary (Grade 4-6)': [],
            'Junior Secondary (Grade 7-9)': [],
            'Senior School (Grade 10-12)': []
        };
        
        // Sort classes into groups
        classes.forEach(cls => {
            if (cls.name.includes('Baby') || cls.name.includes('PP')) {
                classGroups['Pre-Primary'].push(cls);
            } else if (cls.name.match(/Grade [1-3]/)) {
                classGroups['Lower Primary (Grade 1-3)'].push(cls);
            } else if (cls.name.match(/Grade [4-6]/)) {
                classGroups['Upper Primary (Grade 4-6)'].push(cls);
            } else if (cls.name.match(/Grade [7-9]/)) {
                classGroups['Junior Secondary (Grade 7-9)'].push(cls);
            } else if (cls.name.match(/Grade (10|11|12)/)) {
                classGroups['Senior School (Grade 10-12)'].push(cls);
            }
        });
        
        // Add classes to the dropdown in groups
        Object.entries(classGroups).forEach(([groupName, groupClasses]) => {
            if (groupClasses.length === 0) return;
            
            const optgroup = document.createElement('optgroup');
            optgroup.label = groupName;
            
            groupClasses.forEach(cls => {
                const option = document.createElement('option');
                option.value = cls.name;
                option.textContent = cls.name;
                optgroup.appendChild(option);
            });
            
            classFilter.appendChild(optgroup);
        });
        
        console.log('Classes loaded for filter');
        
        // Add event listener for class filter change
        classFilter.addEventListener('change', () => {
            console.log('Class filter changed to:', classFilter.value);
            loadFeesWithFilters();
        });
        
    } catch (error) {
        console.error('Error loading classes for filter:', error);
        // Fallback to hardcoded classes if API fails
        const fallbackClasses = [
            'Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5', 'Grade 6',
            'Grade 7', 'Grade 8', 'Grade 9', 'Grade 10', 'Grade 11', 'Grade 12'
        ];
        
        fallbackClasses.forEach(className => {
            const option = document.createElement('option');
            option.value = className;
            option.textContent = className;
            classFilter.appendChild(option);
        });
    }
        
        console.log('Classes loaded successfully');
        
    } catch (error) {
        console.error('Error loading classes:', error);
        classSelect.innerHTML = '<option value="">Error loading classes</option>';
        showNotification('Failed to load classes', 'error');
    }
}

// Handle class selection change
async function handleClassChange(event) {
    const classId = event.target.value;
    const classSelect = event.target;
    const className = classSelect.options[classSelect.selectedIndex].text;
    const studentSelect = document.getElementById('fee-student-id');
    
    // Reset student dropdown
    studentSelect.innerHTML = '<option value="">Loading students...</option>';
    studentSelect.disabled = true;
    
    if (!classId) {
        studentSelect.innerHTML = '<option value="">Select a class first</option>';
        return;
    }
    
    console.log(`Fetching students for class ${classId} (${className})...`);
    
    try {
        const token = localStorage.getItem('token');
        
        // Try different possible endpoints
        const endpoints = [
            `http://localhost:5000/api/students/class/${classId}`,
            `http://localhost:5000/api/class/${classId}/students`,
            `http://localhost:5000/api/class/students?classId=${classId}`,
            'http://localhost:5000/api/students'
        ];
        
        let response;
        let lastError;
        
        // Try each endpoint until one works
        for (const endpoint of endpoints) {
            try {
                console.log(`Trying student endpoint: ${endpoint}`);
                response = await fetch(endpoint, {
                    headers: { 
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                });
                
                if (response.ok) {
                    console.log(`Successfully connected to ${endpoint}`);
                    break;
                }
                lastError = `HTTP ${response.status}: ${response.statusText}`;
            } catch (err) {
                lastError = err.message;
                console.warn(`Failed to fetch from ${endpoint}:`, err);
            }
        }
        
        if (!response || !response.ok) {
            throw new Error(`Failed to load students: ${lastError || 'No valid endpoint found'}`);
        }
        
        let students = await response.json();
        
        // Handle different response formats
        if (students && students.data && Array.isArray(students.data)) {
            students = students.data;
        } else if (!Array.isArray(students)) {
            students = Object.values(students);
        }
        
        console.log('Students loaded:', students);
        
        // Filter students by class if we got all students
        if (endpoints.includes('http://localhost:5000/api/students')) {
            students = students.filter(student => 
                student.classId === classId || 
                student.class?._id === classId ||
                student.class === classId
            );
            console.log(`Filtered to ${students.length} students in class ${classId}`);
        }
        
        // Update student dropdown
        studentSelect.innerHTML = '<option value="">Select a student</option>';
        
        if (students.length === 0) {
            console.warn(`No students found for class ${classId}`);
            studentSelect.innerHTML = '<option value="">No students in this class</option>';
            return;
        }
        
        students.forEach(student => {
            const option = document.createElement('option');
            option.value = student._id || student.id || student.studentId || '';
            const fullName = [student.firstName, student.middleName, student.lastName]
                .filter(Boolean)
                .join(' ')
                .trim();
            option.textContent = fullName || `Student ${option.value}`;
            option.setAttribute('data-name', fullName);
            studentSelect.appendChild(option);
        });
        
        studentSelect.disabled = false;
        console.log(`Loaded ${students.length} students for class ${classId}`);
        
    } catch (error) {
        console.error('Error loading students:', error);
        studentSelect.innerHTML = `<option value="">Error: ${error.message}</option>`;
        showNotification(`Failed to load students: ${error.message}`, 'error');
    }
}

// Function to initialize the page
function initializeAccountantPage() {
    console.log('Initializing accountant page');
    
    // Load classes immediately
    loadClasses();
    
    // Initialize the class change handler
    const classSelect = document.getElementById('fee-class-name');
    if (classSelect) {
        classSelect.addEventListener('change', handleClassChange);
    }
    
    // Initialize the form
    initializeFeeForm();
}

// Initialize the fee form
function initializeFeeForm() {
    console.log('Initializing fee form');
    
    // Get form elements
    const firstInstallment = document.getElementById('fee-first-installment');
    const secondInstallment = document.getElementById('fee-second-installment');
    const thirdInstallment = document.getElementById('fee-third-installment');
    const feesPerTerm = document.getElementById('fee-fees-per-term');
    const balanceField = document.getElementById('fee-bal');
    
    // Calculate balance function
    const calculateBalance = () => {
        if (!feesPerTerm || !balanceField) return;
        
        const totalFees = parseFloat(feesPerTerm.value) || 0;
        const first = parseFloat(firstInstallment?.value) || 0;
        const second = parseFloat(secondInstallment?.value) || 0;
        const third = parseFloat(thirdInstallment?.value) || 0;
        const totalPaid = first + second + third;
        const balance = totalFees - totalPaid;
        
        if (balanceField) {
            balanceField.value = balance.toFixed(2);
        }
    };
    
    // Add event listeners for installments
    [firstInstallment, secondInstallment, thirdInstallment, feesPerTerm].forEach(field => {
        if (field) {
            field.addEventListener('input', calculateBalance);
            field.addEventListener('change', calculateBalance);
            field.addEventListener('keyup', calculateBalance);
        }
    });
    
    // Initial calculation
    calculateBalance();
}

// Initialize when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM fully loaded');
    initializeAccountantPage();
    
    // Load fees with initial filters
    if (feeTableBody) {
        loadFeesWithFilters();
    }
    
    // Add event listeners for filters
    if (feeSearch) {
        feeSearch.addEventListener('input', loadFeesWithFilters);
    }
    
    if (feesStatusFilter) {
        feesStatusFilter.addEventListener('change', loadFeesWithFilters);
    }
    
    if (feesClassFilter) {
        feesClassFilter.addEventListener('change', loadFeesWithFilters);
    }
    
    // Add reset filters button
    const resetFiltersBtn = document.getElementById('reset-filters');
    if (resetFiltersBtn) {
        resetFiltersBtn.addEventListener('click', () => {
            // Reset all filter inputs
            if (feeSearch) feeSearch.value = '';
            if (feesStatusFilter) feesStatusFilter.value = '';
            if (feesClassFilter) feesClassFilter.value = '';
            
            // Reload fees without filters
            loadFeesWithFilters();
        });
    }
    
    // Also initialize when the tab is shown
    document.querySelectorAll('.nav-link').forEach(link => {
        if (link.getAttribute('onclick') && link.getAttribute('onclick').includes('accountant-section')) {
            link.addEventListener('click', () => {
                console.log('Accountant tab clicked, initializing...');
                // Small delay to ensure tab is visible
                setTimeout(initializeAccountantPage, 100);
            });
        }
    });
});

// Initialize the tab when the script loads
console.log('Accountant script loaded');
initializeAccountantPage();


if (feeForm) {
    feeForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        // Show loading state
        const submitBtn = feeForm.querySelector('button[type="submit"]');
        const originalBtnText = submitBtn.innerHTML;
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Saving...';
        
        try {
            const studentSelect = document.getElementById('fee-student-id');
            const classSelect = document.getElementById('fee-class-name');
            
            const formData = {
                studentId: studentSelect.value,
                studentName: studentSelect.options[studentSelect.selectedIndex].text,
                classId: classSelect.value,
                className: classSelect.options[classSelect.selectedIndex].text,
                feesPerTerm: parseFloat(document.getElementById('fee-fees-per-term').value) || 0,
                firstInstallment: parseFloat(document.getElementById('fee-first-installment').value) || 0,
                secondInstallment: parseFloat(document.getElementById('fee-second-installment').value) || 0,
                thirdInstallment: parseFloat(document.getElementById('fee-third-installment').value) || 0,
                bal: parseFloat(document.getElementById('fee-bal').value) || 0,
                dueDate: document.getElementById('fee-due-date').value,
                notes: document.getElementById('fee-notes').value.trim(),
                status: 'Pending' // Default status
            };
            
            // Basic validation
            if (!formData.student || !formData.className || isNaN(formData.feesPerTerm) || formData.feesPerTerm <= 0) {
                throw new Error('Please fill in all required fields with valid values');
            }
            
            // Auto-calculate balance if not set
            if (isNaN(formData.bal) || formData.bal === 0) {
                const totalPaid = formData.firstInstallment + formData.secondInstallment + formData.thirdInstallment;
                formData.bal = formData.feesPerTerm - totalPaid;
            }
            
            const token = localStorage.getItem('token');
            if (!token) {
                window.location.href = '/login.html';
                return;
            }
            
            const res = await fetch('http://localhost:5000/api/fees', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify(formData)
            });
            if (res.ok) {
                feeForm.reset();
                loadFeesWithFilters();
            } else {
                const errData = await res.json().catch(() => ({}));
                alert('Failed to add fee record: ' + (errData.error || res.status));
            }
        } catch (err) {
            alert('Network error');
        }
    });
}

if (feeSearch) feeSearch.addEventListener('input', () => loadFeesWithFilters());
if (feesStatusFilter) feesStatusFilter.addEventListener('change', () => loadFeesWithFilters());
if (feesClassFilter) feesClassFilter.addEventListener('input', () => loadFeesWithFilters());

if (feeList) {
  feeList.addEventListener('click', async (e) => {
    const btn = e.target;
    const feeId = btn.getAttribute('data-id');
    if (!feeId) return;
    const token = localStorage.getItem('token');
    // Edit Fee (universal modal)
    if (btn.classList.contains('edit-fee-btn')) {
        const li = btn.closest('tr');
        const currentStudent = li.querySelector('td:nth-child(2)').textContent;
        const currentClassName = li.querySelector('td:nth-child(3)').textContent;
        const currentFeesPerTerm = li.querySelector('td:nth-child(4)').textContent;
        const currentFirstInstallment = li.querySelector('td:nth-child(5)').textContent;
        const currentSecondInstallment = li.querySelector('td:nth-child(6)').textContent;
        const currentThirdInstallment = li.querySelector('td:nth-child(7)').textContent;
        const currentBal = li.querySelector('td:nth-child(8)').textContent;
        universalEditForm.innerHTML = `
            <input type="hidden" name="feeId" value="${feeId}" />
            <div class='form-group'><label>Name:</label><input type='text' name='studentName' value='${currentStudent}' required /></div>
            <div class='form-group'><label>Class:</label><input type='text' name='className' value='${currentClassName}' required /></div>
            <div class='form-group'><label>Fees Per Term:</label><input type='number' name='feesPerTerm' value='${currentFeesPerTerm}' required /></div>
            <div class='form-group'><label>First Installment:</label><input type='number' name='firstInstallment' value='${currentFirstInstallment}' required /></div>
            <div class='form-group'><label>Second Installment:</label><input type='number' name='secondInstallment' value='${currentSecondInstallment}' required /></div>
            <div class='form-group'><label>Third Installment:</label><input type='number' name='thirdInstallment' value='${currentThirdInstallment}' required /></div>
            <div class='form-group'><label>Bal:</label><input type='number' name='bal' value='${currentBal}' required /></div>
            <button type='submit'>Save Changes</button>
        `;
        universalEditMsg.style.display = 'none';
        openUniversalModal(universalEditModal);
        universalEditForm.onsubmit = async (ev) => {
            ev.preventDefault();
            universalEditMsg.style.display = 'none';
            const formData = new FormData(universalEditForm);
            const studentName = formData.get('studentName');
            const className = formData.get('className');
            const feesPerTerm = formData.get('feesPerTerm');
            const firstInstallment = formData.get('firstInstallment');
            const secondInstallment = formData.get('secondInstallment');
            const thirdInstallment = formData.get('thirdInstallment');
            const bal = formData.get('bal');
            try {
                const res = await fetch(`http://localhost:5000/api/fees/${feeId}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`,
                    },
                    body: JSON.stringify({ studentName, className, feesPerTerm, firstInstallment, secondInstallment, thirdInstallment, bal })
                });
                if (res.ok) {
                    universalEditMsg.textContent = 'Fee record updated successfully!';
                    universalEditMsg.style.color = 'green';
                    universalEditMsg.style.display = 'block';
                    setTimeout(() => {
                        closeUniversalModal(universalEditModal);
                        loadFeesWithFilters();
                    }, 1000);
                } else {
                    universalEditMsg.textContent = 'Failed to update fee record.';
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
    // Delete Fee (universal confirm modal)
    else if (btn.classList.contains('delete-fee-btn')) {
        universalConfirmTitle.textContent = 'Delete Fee Record';
        universalConfirmMessage.textContent = 'Are you sure you want to delete this fee record?';
        openUniversalModal(universalConfirmModal);
        universalConfirmYes.onclick = async () => {
            closeUniversalModal(universalConfirmModal);
            try {
                const res = await fetch(`http://localhost:5000/api/fees/${feeId}`, {
                    method: 'DELETE',
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (res.ok) {
                    loadFeesWithFilters();
                }
            } catch {}
        };
        universalConfirmNo.onclick = () => closeUniversalModal(universalConfirmModal);
    }
  });
}

document.addEventListener('DOMContentLoaded', () => {
    loadFeesWithFilters();
});

})(); 
