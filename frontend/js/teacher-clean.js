document.addEventListener('DOMContentLoaded', () => {
  /* ---------------------------
     TAB MANAGER (for tab switching)
     --------------------------- */
  class TabManager {
    constructor(tabLinksSelector, tabSectionsSelector) {
      this.tabLinks = document.querySelectorAll(tabLinksSelector);
      this.tabSections = document.querySelectorAll(tabSectionsSelector);
      this.defaultTab = window.location.hash.substring(1) || 
                      localStorage.getItem('activeTab') ||
                      (this.tabLinks.length > 0 ? this.tabLinks[0].getAttribute('data-tab') : null);
      this.init();
    }

    hideAllTabs() {
      this.tabSections.forEach(section => {
        section.style.display = 'none';
        section.classList.remove('fade-in');
      });
      this.tabLinks.forEach(link => link.classList.remove('active'));
    }

    showTab(tabId) {
      this.hideAllTabs();
      const targetSection = document.getElementById(tabId);
      if (targetSection) {
        targetSection.style.display = 'block';
        setTimeout(() => targetSection.classList.add('fade-in'), 50);
      } else {
        console.warn(`No tab section found with ID: ${tabId}`);
      }
      this.tabLinks.forEach(link => {
        if (link.getAttribute('data-tab') === tabId) {
          link.classList.add('active');
        }
      });
      localStorage.setItem('activeTab', tabId);
      window.history.pushState(null, '', '#' + tabId);
    }

    handleHashChange() {
      const hash = window.location.hash.substring(1);
      if (hash) {
        this.showTab(hash);
      }
    }

    init() {
      // Set default tab
      if (this.defaultTab) {
        this.showTab(this.defaultTab);
      }

      // Add click event listeners to tab links
      this.tabLinks.forEach(link => {
        link.addEventListener('click', (e) => {
          e.preventDefault();
          const tabId = e.currentTarget.getAttribute('data-tab');
          this.showTab(tabId);
        });
      });

      // Handle browser back/forward buttons
      window.addEventListener('popstate', () => this.handleHashChange());
    }
  }

  // Initialize the TabManager for teacher dashboard tabs
  new TabManager('.tab-link', '.tab-section');

  /* ---------------------------
     TEACHER DASHBOARD FUNCTIONALITIES
     --------------------------- */
  class TeacherDashboard {
    constructor() {
      // Check authentication
      if (!localStorage.getItem('token')) {
        window.location.href = 'login.html';
        return;
      }

      // Initialize Profile and Class Management
      new TeacherProfile();
      new ClassManagement();
      
      // Initialize remaining functionalities
      this.initAssignmentManagement();
      this.initGradeManagement();
      this.initAddGradeForm();
      this.initAnnouncementManagement();
      this.initAttendanceManagement();
      this.initCommunicationManagement();
      this.initResourceUpload();
      this.initDownloadReport();
      this.initReportCardUpload();
      this.fetchReportCards();
      this.loadStudentsForReportCardDropdown();
      
      // Set up global error handlers
      this.setupErrorHandling();
    }

    setupErrorHandling() {
      // Global error handler
      window.addEventListener('error', (event) => {
        console.error('Global error:', event.error);
        this.showAlert('An unexpected error occurred. Please try again.', 'error');
      });
      
      // Unhandled promise rejection handler
      window.addEventListener('unhandledrejection', (event) => {
        console.error('Unhandled promise rejection:', event.reason);
        this.showAlert('An error occurred. Please try again.', 'error');
      });
    }

    // Helper function to show alerts
    showAlert(message, type = 'info') {
      let alertContainer = document.getElementById('alert-container');
      if (!alertContainer) {
        alertContainer = document.createElement('div');
        alertContainer.id = 'alert-container';
        document.body.appendChild(alertContainer);
      }
      
      const alert = document.createElement('div');
      alert.className = `alert alert-${type}`;
      alert.innerHTML = `
        <span>${message}</span>
        <button class="close-alert">&times;</button>
      `;
      
      // Auto-remove after 5 seconds
      setTimeout(() => {
        alert.classList.add('fade-out');
        setTimeout(() => alert.remove(), 300);
      }, 5000);
      
      // Close button functionality
      const closeBtn = alert.querySelector('.close-alert');
      closeBtn.addEventListener('click', () => {
        alert.classList.add('fade-out');
        setTimeout(() => alert.remove(), 300);
      });
      
      alertContainer.appendChild(alert);
    }

    /* ------------------
       ASSIGNMENTS MANAGEMENT
       ------------------ */
    initAssignmentManagement() {
      const createAssignmentForm = document.getElementById('create-assignment-form');
      if (createAssignmentForm) {
        createAssignmentForm.addEventListener('submit', (e) => {
          e.preventDefault();
          this.createAssignment();
        });
      }
      // Fetch and display existing assignments on page load
      this.fetchAssignments();
    }

    // Fetch assignments from the server with authentication
    async fetchAssignments() {
      const container = document.getElementById('assignments-container');
      if (!container) return;
      
      const loadingIndicator = document.createElement('div');
      loadingIndicator.className = 'loading-indicator';
      loadingIndicator.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Loading assignments...';
      
      try {
        // Show loading indicator
        container.innerHTML = '';
        container.appendChild(loadingIndicator);
        
        const token = localStorage.getItem('token');
        if (!token) {
          throw new Error('No token found. Please log in again!');
        }
        
        const response = await fetch('http://localhost:5000/api/assignments', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (response.ok) {
          const assignments = await response.json();
          container.innerHTML = '';
          
          if (assignments.length === 0) {
            const noAssignments = document.createElement('p');
            noAssignments.className = 'no-assignments';
            noAssignments.textContent = 'No assignments created yet.';
            container.appendChild(noAssignments);
          } else {
            assignments.forEach(assignment => this.addAssignmentToDOM(assignment));
          }
        } else if (response.status === 401) {
          this.showAlert('Session expired. Please log in again.', 'error');
          setTimeout(() => { window.location.href = 'login.html'; }, 2000);
        } else {
          throw new Error('Failed to fetch assignments');
        }
      } catch (error) {
        console.error('Error fetching assignments:', error);
        container.innerHTML = '';
        const errorElement = document.createElement('div');
        errorElement.className = 'error-message';
        errorElement.innerHTML = `
          <i class="fas fa-exclamation-circle"></i>
          <span>Error loading assignments. Please try again later.</span>
          <button class="btn-retry" id="retry-fetch">Retry</button>
        `;
        container.appendChild(errorElement);
        
        // Add retry functionality
        const retryBtn = document.getElementById('retry-fetch');
        if (retryBtn) {
          retryBtn.addEventListener('click', () => this.fetchAssignments());
        }
      }
    }

    // Add assignment to DOM
    addAssignmentToDOM(assignment) {
      const container = document.getElementById('assignments-container');
      const noAssignmentsMsg = container.querySelector('.no-assignments');
      
      if (noAssignmentsMsg) {
        noAssignmentsMsg.remove();
      }

      const assignmentElement = document.createElement('div');
      assignmentElement.className = 'assignment-card';
      
      const dueDate = assignment.dueDate ? new Date(assignment.dueDate) : null;
      const formattedDueDate = dueDate ? dueDate.toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }) : 'No due date';

      assignmentElement.innerHTML = `
        <div class="assignment-header">
          <h4>${assignment.title || 'Untitled Assignment'}</h4>
          <span class="due-date">Due: ${formattedDueDate}</span>
        </div>
        <div class="assignment-body">
          <p>${assignment.description || 'No description provided.'}</p>
          <div class="assignment-meta">
            <span class="class-info">Class: ${assignment.classAssigned || 'All Classes'}</span>
            ${assignment.fileUrl ? 
              `<a href="${assignment.fileUrl}" target="_blank" class="assignment-file">
                <i class="fas fa-paperclip"></i> Download File
              </a>` : ''}
          </div>
        </div>
        <div class="assignment-actions">
          <button class="btn-edit" data-id="${assignment._id}">Edit</button>
          <button class="btn-delete" data-id="${assignment._id}">Delete</button>
        </div>
      `;

      // Add event listeners for edit and delete buttons
      const editBtn = assignmentElement.querySelector('.btn-edit');
      const deleteBtn = assignmentElement.querySelector('.btn-delete');
      
      if (editBtn) {
        editBtn.addEventListener('click', () => {
          if (this.editAssignment) {
            this.editAssignment(assignment._id);
          }
        });
      }
      
      if (deleteBtn) {
        deleteBtn.addEventListener('click', () => {
          if (this.deleteAssignment) {
            this.deleteAssignment(assignment._id);
          }
        });
      }

      container.prepend(assignmentElement);
    }

    // Create a new assignment and send to the server with authentication
    async createAssignment() {
      const form = document.getElementById('create-assignment-form');
      const formData = new FormData(form);
      const submitBtn = form.querySelector('button[type="submit"]');
      const originalBtnText = submitBtn.textContent;
      
      try {
        // Validate required fields
        const title = formData.get('title');
        const description = formData.get('description');
        const dueDate = formData.get('dueDate');
        const classAssigned = formData.get('classAssigned');
        
        if (!title || !description || !dueDate || !classAssigned) {
          this.showAlert('Please fill in all required fields', 'error');
          return;
        }
        
        // Update button to show loading state
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Creating...';
        
        const token = localStorage.getItem('token');
        if (!token) throw new Error('No token found. Please log in again!');
        
        // Add the file if present
        const fileInput = document.getElementById('assignment-file');
        if (fileInput.files.length > 0) {
          formData.append('file', fileInput.files[0]);
        }
        
        const response = await fetch('http://localhost:5000/api/assignments', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          },
          body: formData,
        });
        
        if (response.ok) {
          this.showAlert('Assignment created successfully!', 'success');
          form.reset();
          await this.fetchAssignments();
          // Switch to assignments tab
          const assignmentsTab = document.querySelector('.tab-link[data-tab="assignments-section"]');
          if (assignmentsTab) assignmentsTab.click();
        } else if (response.status === 401) {
          this.showAlert('Session expired. Please log in again.', 'error');
          setTimeout(() => { window.location.href = 'login.html'; }, 2000);
        } else {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || 'Failed to create assignment');
        }
      } catch (error) {
        console.error('Error creating assignment:', error);
        this.showAlert(`Error: ${error.message}`, 'error');
      } finally {
        // Reset button state
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent = originalBtnText;
        }
      }
    }

    // Edit assignment (placeholder - implement as needed)
    editAssignment(assignmentId) {
      console.log('Edit assignment:', assignmentId);
      // Implementation for editing an assignment
      this.showAlert('Edit functionality coming soon!', 'info');
    }

    // Delete assignment (placeholder - implement as needed)
    async deleteAssignment(assignmentId) {
      if (!confirm('Are you sure you want to delete this assignment?')) {
        return;
      }
      
      try {
        const token = localStorage.getItem('token');
        if (!token) throw new Error('No token found. Please log in again!');
        
        const response = await fetch(`http://localhost:5000/api/assignments/${assignmentId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (response.ok) {
          this.showAlert('Assignment deleted successfully!', 'success');
          this.fetchAssignments();
        } else if (response.status === 401) {
          this.showAlert('Session expired. Please log in again.', 'error');
          setTimeout(() => { window.location.href = 'login.html'; }, 2000);
        } else {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || 'Failed to delete assignment');
        }
      } catch (error) {
        console.error('Error deleting assignment:', error);
        this.showAlert(`Error: ${error.message}`, 'error');
      }
    }

    // Other methods (stubs for now)
    initGradeManagement() {}
    initAddGradeForm() {}
    initAnnouncementManagement() {}
    initAttendanceManagement() {}
    initCommunicationManagement() {}
    initResourceUpload() {}
    initDownloadReport() {}
    initReportCardUpload() {}
    fetchReportCards() {}
    loadStudentsForReportCardDropdown() {}
  }

  // Initialize the teacher dashboard
  new TeacherDashboard();

  /* ---------------------------
     TEACHER PROFILE
     --------------------------- */
  class TeacherProfile {
    constructor() {
      this.initProfileForm();
      this.initChangePhoto();
      this.initChangePassword();
    }

    initProfileForm() {
      const form = document.getElementById('profile-form');
      if (!form) return;
      
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        // Implementation for saving profile
        this.showAlert('Profile updated successfully!', 'success');
      });
    }

    initChangePhoto() {
      const photoInput = document.getElementById('teacher-photo');
      const photoPreview = document.getElementById('photo-preview');
      
      if (photoInput && photoPreview) {
        photoInput.addEventListener('change', (e) => {
          const file = e.target.files[0];
          if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
              photoPreview.src = event.target.result;
            };
            reader.readAsDataURL(file);
          }
        });
      }
    }

    initChangePassword() {
      const form = document.getElementById('change-password-form');
      if (!form) return;
      
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        // Implementation for changing password
        this.showAlert('Password changed successfully!', 'success');
        form.reset();
      });
    }

    showAlert(message, type = 'info') {
      // Reuse the alert functionality from TeacherDashboard
      const dashboard = new TeacherDashboard();
      dashboard.showAlert(message, type);
    }
  }

  /* ---------------------------
     CLASS MANAGEMENT
     --------------------------- */
  class ClassManagement {
    constructor() {
      this.initViewDetails();
    }

    initViewDetails() {
      const viewDetailsBtns = document.querySelectorAll('.view-details-btn');
      viewDetailsBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
          const className = e.target.closest('li').querySelector('strong').textContent;
          alert(`Viewing details for ${className}`);
          // Implementation for viewing class details
        });
      });
    }
  }
});

// Load students for grade dropdown
function loadStudentsForGradeDropdown() {
  const studentSelect = document.getElementById('student-name');
  if (!studentSelect) return;
  
  const token = localStorage.getItem('token');
  const API_BASE_URL = 'http://localhost:5000';
  
  fetch(`${API_BASE_URL}/api/students`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': 'Bearer ' + token } : {})
    },
  })
  .then(res => {
    if (!res.ok) throw new Error('Failed to fetch students');
    return res.json();
  })
  .then(students => {
    studentSelect.innerHTML = '<option value="">Select Student</option>';
    students.forEach(student => {
      const option = document.createElement('option');
      option.value = student._id || student.id;
      option.textContent = student.name || student.email || `Student ${student._id}`;
      studentSelect.appendChild(option);
    });
  })
  .catch(err => {
    console.error('Failed to load students:', err);
    studentSelect.innerHTML = '<option value="">Failed to load students</option>';
  });
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  loadStudentsForGradeDropdown();
});
