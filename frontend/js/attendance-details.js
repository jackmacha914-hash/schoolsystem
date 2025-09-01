function showMessage(message, type = 'info') {
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type} mt-3`;
    alertDiv.innerHTML = `
        <i class="fas fa-${type === 'info' ? 'info-circle' : type === 'success' ? 'check-circle' : 'exclamation-circle'}"></i>
        ${message}
    `;
    document.body.insertBefore(alertDiv, document.body.firstChild);

    setTimeout(() => {
        alertDiv.remove();
    }, 5000);
}

document.addEventListener('DOMContentLoaded', () => {
    // Log detailed URL information
    console.log('=== URL Debugging Information ===');
    console.log('Full URL:', window.location.href);
    console.log('Origin:', window.location.origin);
    console.log('Pathname:', window.location.pathname);
    console.log('Search:', window.location.search);
    console.log('Hash:', window.location.hash);
    
    // Debug URL information
    console.log('=== URL Debugging Information ===');
    console.log('Full URL:', window.location.href);
    console.log('Origin:', window.location.origin);
    console.log('Pathname:', window.location.pathname);
    console.log('Search:', window.location.search);
    console.log('Hash:', window.location.hash);
    
    // Get URL parameters
    let attendanceId = null;
    
    // First try to get ID from search params
    const urlParams = new URLSearchParams(window.location.search);
    console.log('URL Search Params:', Object.fromEntries(urlParams.entries()));
    
    attendanceId = urlParams.get('id');
    console.log('ID from URLSearchParams:', attendanceId);
    
    // If not found in search params, try to parse from hash
    if (!attendanceId && window.location.hash) {
        console.log('ID not found in search params, checking hash...');
        const hashParams = new URLSearchParams(window.location.hash.split('?')[1] || '');
        attendanceId = hashParams.get('id');
        console.log('ID from hash:', attendanceId);
    }
    
    // If still not found, try to get from path (for pretty URLs)
    if (!attendanceId) {
        console.log('ID not found in hash, checking path...');
        const pathParts = window.location.pathname.split('/');
        const lastPart = pathParts[pathParts.length - 1];
        
        // Check if last part of path is a valid ID (24 hex chars)
        if (lastPart && lastPart.match(/^[0-9a-fA-F]{24}$/)) {
            attendanceId = lastPart;
            console.log('Found ID in path:', attendanceId);
        }
    }
    
    if (!attendanceId) {
        const errorMsg = 'No attendance ID found in URL. Please check the URL and try again.';
        showMessage(errorMsg, 'error');
        console.error('=== Error Details ===');
        console.error('URL:', window.location.href);
        console.error('Search Params:', Object.fromEntries(new URLSearchParams(window.location.search)));
        console.error('Hash:', window.location.hash);
        console.error('Pathname:', window.location.pathname);
        console.error('Please ensure the URL includes an ID parameter, e.g., /pages/attendance-details?id=YOUR_ATTENDANCE_ID');
        return;
    }

    // Clean up the ID (remove any URL encoding or extra characters)
    attendanceId = attendanceId.split('?')[0].split('#')[0].trim();
    
    // Validate ID format
    if (!attendanceId.match(/^[0-9a-fA-F]{24}$/)) {
        showMessage('Invalid attendance record ID format. Please check the URL and try again.', 'error');
        console.error('Invalid ID format:', attendanceId);
        console.error('Invalid ID format:', attendanceId);
        return;
    }

    // Initialize the class with the ID
    const attendanceDetails = new AttendanceDetails(attendanceId);
    attendanceDetails.init();
});

class AttendanceDetails {
    constructor(attendanceId) {
        this.attendanceId = attendanceId;
        this.attendanceData = null;
        console.log('Attendance ID:', this.attendanceId);
    }

    init() {
        if (!this.attendanceId) {
            this.showMessage('Attendance record ID not found', 'error');
            return;
        }

        // Validate ID format
        if (!this.attendanceId.match(/^[0-9a-fA-F]{24}$/)) {
            this.showMessage('Invalid attendance record ID format', 'error');
            return;
        }

        this.fetchAttendanceDetails();
    }

    async fetchAttendanceDetails() {
        try {
            // Show loading spinner
            document.getElementById('loading-spinner').style.display = 'block';
            document.querySelector('.attendance-details').style.display = 'none';
            document.getElementById('error-message').style.display = 'none';

            const token = localStorage.getItem('token');
            if (!token) {
                window.location.href = 'login.html';
                return;
            }

            const baseUrl = 'http://localhost:5000';
            const response = await fetch(`${baseUrl}/api/attendance/${this.attendanceId}`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json'
                },
                credentials: 'include'
            });

            if (!response.ok) {
                let errorMessage = `HTTP error! status: ${response.status}`;
                try {
                    const errorData = await response.json();
                    errorMessage = errorData.message || errorMessage;
                } catch (e) {
                    errorMessage = response.statusText || errorMessage;
                }
                throw new Error(errorMessage);
            }

            this.attendanceData = await response.json();
            console.log('Attendance details received:', this.attendanceData);
            
            // Validate data structure
            if (!this.attendanceData || 
                !this.attendanceData.date || 
                !this.attendanceData.class || 
                !Array.isArray(this.attendanceData.records)) {
                throw new Error('Invalid attendance data format');
            }

            // Hide loading and show content
            document.getElementById('loading-spinner').style.display = 'none';
            document.querySelector('.attendance-details').style.display = 'block';

            this.renderDetails();
        } catch (error) {
            console.error('Error fetching attendance details:', error);
            
            // Hide loading and show error
            document.getElementById('loading-spinner').style.display = 'none';
            document.querySelector('.attendance-details').style.display = 'none';
            document.getElementById('error-message').style.display = 'block';
            document.getElementById('error-text').textContent = error.message;

            // Also show error message in alert
            this.showMessage('Failed to load attendance details: ' + error.message, 'error');
        }
    }

    renderDetails() {
        if (!this.attendanceData) {
            this.showMessage('No attendance data received', 'error');
            return;
        }

        // Update summary information
        const dateElement = document.getElementById('attendance-date');
        const classElement = document.getElementById('attendance-class');
        const teacherElement = document.getElementById('attendance-teacher');
        
        if (dateElement) dateElement.textContent = new Date(this.attendanceData.date).toLocaleDateString();
        if (classElement) classElement.textContent = this.attendanceData.class;
        if (teacherElement) teacherElement.textContent = 'Teacher'; // We don't have teacher name in the response

        // Calculate attendance statistics
        const records = this.attendanceData.records || [];
        let presentCount = records.filter(r => r.status === 'present' || r.status === 'late').length;
        let absentCount = records.filter(r => r.status === 'absent').length;
        let total = records.length;

        // Update attendance statistics
        const presentElement = document.getElementById('attendance-present');
        const absentElement = document.getElementById('attendance-absent');
        const totalElement = document.getElementById('attendance-total');

        if (presentElement) presentElement.textContent = presentCount;
        if (absentElement) absentElement.textContent = absentCount;
        if (totalElement) totalElement.textContent = total;

        // Render student attendance records
        const recordsList = document.getElementById('attendance-records');
        if (!recordsList) return;

        recordsList.innerHTML = records.map(record => `
          <tr>
            <td>${record.studentId.name || 'Unknown Student'}</td>
            <td>${record.studentId.email || ''}</td>
            <td>
              <span class="status-badge ${record.status}">
                ${record.status.charAt(0).toUpperCase() + record.status.slice(1)}
              </span>
            </td>
            <td>${record.remarks || ''}</td>
          </tr>
        `).join('');

        // Add status badges styling
        const style = document.createElement('style');
        style.textContent = `
          .status-badge {
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 12px;
            color: white;
            text-transform: capitalize;
          }
          .status-badge.present { background-color: #28a745; }
          .status-badge.absent { background-color: #dc3545; }
          .status-badge.late { background-color: #ffc107; }
          .status-badge.excused { background-color: #17a2b8; }
        `;
        document.head.appendChild(style);
    }

    showMessage(message, type = 'info') {
        const alertDiv = document.createElement('div');
        alertDiv.className = `alert alert-${type} mt-3`;
        alertDiv.innerHTML = `
            <i class="fas fa-${type === 'info' ? 'info-circle' : type === 'success' ? 'check-circle' : 'exclamation-circle'}"></i>
            ${message}
        `;
        document.body.insertBefore(alertDiv, document.body.firstChild);

        setTimeout(() => {
            alertDiv.remove();
        }, 5000);
    }
}
