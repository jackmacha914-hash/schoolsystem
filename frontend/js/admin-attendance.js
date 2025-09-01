class AdminAttendanceManager {
    constructor() {
        this.attendanceData = [];
        this.initEventListeners();
        this.setDefaultDateRange();
        this.loadAttendanceData();
    }

    initEventListeners() {
        // Filter button click handler
        document.getElementById('filter-attendance-btn').addEventListener('click', () => this.loadAttendanceData());
        
        // View details button handler (delegated)
        document.getElementById('attendance-records-body').addEventListener('click', (e) => {
            if (e.target.closest('.view-details-btn')) {
                const recordId = e.target.closest('.view-details-btn').dataset.id;
                this.showAttendanceDetails(recordId);
            }
        });
    }

    setDefaultDateRange() {
        const today = new Date();
        const oneMonthAgo = new Date();
        oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
        
        document.getElementById('start-date-filter').valueAsDate = oneMonthAgo;
        document.getElementById('end-date-filter').valueAsDate = today;
    }

    async loadAttendanceData() {
        const classFilter = document.getElementById('attendance-class-filter').value;
        let startDate = document.getElementById('start-date-filter').value;
        let endDate = document.getElementById('end-date-filter').value;
        
        // Validate required fields
        if (!classFilter) {
            this.showMessage('Please select a class first', 'error');
            return;
        }
        
        // If no dates are selected, default to a wider range to ensure we get some data
        if (!startDate || !endDate) {
            const today = new Date();
            const oneMonthAgo = new Date();
            oneMonthAgo.setMonth(today.getMonth() - 1);
            
            // Format dates as YYYY-MM-DD
            const formatDate = (date) => date.toISOString().split('T')[0];
            
            if (!startDate) startDate = formatDate(oneMonthAgo);
            if (!endDate) endDate = formatDate(today);
            
            // Update the date inputs
            document.getElementById('start-date-filter').value = startDate;
            document.getElementById('end-date-filter').value = endDate;
        }
        
        // Show loading state
        const filterBtn = document.getElementById('filter-attendance-btn');
        const originalBtnText = filterBtn.innerHTML;
        filterBtn.disabled = true;
        filterBtn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Loading...';
        
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                console.error('No authentication token found');
                window.location.href = 'login.html';
                return;
            }
            
            // Build query parameters
            const params = new URLSearchParams({
                class: classFilter,
                start: startDate,
                end: endDate
            });
            
            const url = `http://localhost:5000/api/attendance/history?${params.toString()}`;
            console.log('Fetching attendance data from:', url);
            
            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json'
                },
                credentials: 'include'
            });
            
            console.log('Response status:', response.status);
            
            if (response.status === 400) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || 'Missing required parameters');
            }
            
            if (response.status === 401) {
                console.error('Authentication failed - redirecting to login');
                window.location.href = 'login.html';
                return;
            }
            
            if (response.status === 403) {
                const errorData = await response.json().catch(() => ({}));
                console.error('Access forbidden. Server response:', errorData);
                throw new Error('You do not have permission to view attendance records');
            }
            
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                console.error('Error response:', errorData);
                throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            console.log('Attendance data received:', data);
            
            this.attendanceData = Array.isArray(data) ? data : [];
            
            if (this.attendanceData.length === 0) {
                this.showMessage('No attendance records found for the selected criteria', 'info');
            }
            
            this.renderAttendanceData();
            this.updateSummaryCards();
            
        } catch (error) {
            console.error('Error loading attendance data:', error);
            this.showMessage('Failed to load attendance data: ' + (error.message || 'Please try again'), 'error');
        } finally {
            // Restore button state
            if (filterBtn) {
                filterBtn.disabled = false;
                filterBtn.innerHTML = originalBtnText;
            }
        }
    }

    renderAttendanceData() {
        const tbody = document.getElementById('attendance-records-body');
        
        if (this.attendanceData.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" class="text-center">No attendance records found for the selected filters.</td></tr>';
            document.getElementById('attendance-summary-cards').style.display = 'none';
            return;
        }
        
        // Show summary cards
        document.getElementById('attendance-summary-cards').style.display = 'flex';
        
        // Sort records by date (newest first)
        const sortedData = [...this.attendanceData].sort((a, b) => new Date(b.date) - new Date(a.date));
        
        tbody.innerHTML = sortedData.map(record => {
            const presentCount = record.records.filter(r => r.status === 'present' || r.status === 'late').length;
            const absentCount = record.records.filter(r => r.status === 'absent').length;
            const total = record.records.length;
            const presentPercentage = total > 0 ? Math.round((presentCount / total) * 100) : 0;
            
            return `
                <tr>
                    <td>${new Date(record.date).toLocaleDateString()}</td>
                    <td>${record.class || 'N/A'}</td>
                    <td>${presentCount} <span class="text-success">(${presentPercentage}%)</span></td>
                    <td>${absentCount} <span class="text-danger">(${100 - presentPercentage}%)</span></td>
                    <td>${total}</td>
                    <td>
                        <button class="btn btn-sm btn-info view-details-btn" data-id="${record._id}">
                            <i class="fas fa-eye"></i> View
                        </button>
                    </td>
                </tr>
            `;
        }).join('');
    }

    updateSummaryCards() {
        if (this.attendanceData.length === 0) {
            document.getElementById('attendance-summary-cards').style.display = 'none';
            return;
        }
        
        document.getElementById('attendance-summary-cards').style.display = 'flex';
        
        const allStudents = new Set();
        let totalPresent = 0;
        let totalAbsent = 0;
        
        this.attendanceData.forEach(record => {
            if (!record.records || !Array.isArray(record.records)) return;
            
            record.records.forEach(rec => {
                const studentId = rec.studentId?._id || rec.studentId;
                if (studentId) {
                    allStudents.add(studentId);
                    
                    if (rec.status === 'present' || rec.status === 'late') {
                        totalPresent++;
                    } else if (rec.status === 'absent') {
                        totalAbsent++;
                    }
                }
            });
        });
        
        const totalStudents = allStudents.size;
        const totalAttendance = totalPresent + totalAbsent;
        const averageAttendance = totalAttendance > 0 ? Math.round((totalPresent / totalAttendance) * 100) : 0;
        
        // Update summary cards with accurate data
        document.getElementById('total-students').textContent = totalStudents;
        document.getElementById('total-present').textContent = totalPresent;
        document.getElementById('total-absent').textContent = totalAbsent;
        
        const presentPercentage = totalAttendance > 0 ? Math.round((totalPresent / totalAttendance) * 100) : 0;
        const absentPercentage = totalAttendance > 0 ? 100 - presentPercentage : 0;
        
        document.getElementById('present-percentage').textContent = `${presentPercentage}%`;
        document.getElementById('absent-percentage').textContent = `${absentPercentage}%`;
        document.getElementById('avg-attendance').textContent = `${presentPercentage}%`;
    }

    async showAttendanceDetails(recordId) {
        const record = this.attendanceData.find(r => r._id === recordId);
        if (!record) return;
        
        // Set modal title with date
        document.getElementById('modal-date').textContent = new Date(record.date).toLocaleDateString();
        
        // Populate details table
        const tbody = document.getElementById('attendance-details-body');
        tbody.innerHTML = record.records.map(record => {
            let statusClass = '';
            switch(record.status) {
                case 'present': statusClass = 'bg-success text-white'; break;
                case 'absent': statusClass = 'bg-danger text-white'; break;
                case 'late': statusClass = 'bg-warning text-dark'; break;
                case 'excused': statusClass = 'bg-info text-white'; break;
                default: statusClass = 'bg-secondary text-white';
            }
            
            return `
                <tr>
                    <td>${record.studentName || 'Unknown Student'}</td>
                    <td><span class="badge ${statusClass}">${record.status.charAt(0).toUpperCase() + record.status.slice(1)}</span></td>
                    <td>${record.remarks || '-'}</td>
                </tr>
            `;
        }).join('');
        
        // Show the modal
        $('#attendanceDetailsModal').modal('show');
    }

    showMessage(message, type = 'info') {
        // You can implement a toast or alert system here
        alert(`${type.toUpperCase()}: ${message}`);
    }
}

// Initialize the attendance manager when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', () => {
    // Only initialize if we're on the admin dashboard
    if (document.getElementById('attendance-records-table')) {
        window.adminAttendanceManager = new AdminAttendanceManager();
    }
});
