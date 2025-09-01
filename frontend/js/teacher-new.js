const API_BASE_URL = 'http://localhost:5000';

document.addEventListener('DOMContentLoaded', () => {
  /* ---------------------------
     TAB MANAGER (for tab switching)
     --------------------------- */
  class TabManager {
    /**
     * @param {string} tabLinksSelector - Selector for tab links (e.g., '.tab-link')
     * @param {string} tabSectionsSelector - Selector for tab sections (e.g., '.tab-section')
     */
    constructor(tabLinksSelector, tabSectionsSelector) {
      this.tabLinks = document.querySelectorAll(tabLinksSelector);
      this.tabSections = document.querySelectorAll(tabSectionsSelector);
      // Get default tab from URL hash or localStorage, or fallback to first tab
      this.defaultTab =
        window.location.hash.substring(1) ||
        localStorage.getItem('activeTab') ||
        (this.tabLinks.length > 0 ? this.tabLinks[0].getAttribute('data-tab') : null);
      this.init();
    }

    hideAllTabs() {
      this.tabSections.forEach((section) => {
        section.style.display = 'none';
        section.classList.remove('fade-in');
      });
      this.tabLinks.forEach((link) => link.classList.remove('active'));
    }

    showTab(tabId) {
      this.hideAllTabs();
      const targetSection = document.getElementById(tabId);
      if (targetSection) {
        targetSection.style.display = 'block';
        // Fade-in effect (ensure your CSS defines .fade-in with transition)
        setTimeout(() => targetSection.classList.add('fade-in'), 50);
      } else {
        console.warn(`No tab section found with ID: ${tabId}`);
      }
      // Mark corresponding link as active
      this.tabLinks.forEach((link) => {
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
      this.tabLinks.forEach((link) => {
        link.addEventListener('click', (event) => {
          event.preventDefault();
          const tabId = link.getAttribute('data-tab');
          this.showTab(tabId);
        });
      });
      window.addEventListener('hashchange', this.handleHashChange.bind(this));
      if (this.defaultTab) {
        this.showTab(this.defaultTab);
      }
    }
  }

  // Initialize the TabManager for teacher dashboard tabs
  new TabManager('.tab-link', '.tab-section');

  /* ---------------------------
     TEACHER DASHBOARD FUNCTIONALITIES
     --------------------------- */
  class TeacherDashboard {
    constructor() {
      // Initialize Profile and Class Management functionalities
      new TeacherProfile();
      new ClassManagement();
      
      // Check authentication
      if (!localStorage.getItem('token')) {
        window.location.href = 'login.html';
        return;
      }
      
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
      
      // Set up global error handler
      window.addEventListener('error', (event) => {
        console.error('Global error:', event.error);
        this.showAlert('An unexpected error occurred. Please try again.', 'error');
      });
      
      // Set up unhandled promise rejection handler
      window.addEventListener('unhandledrejection', (event) => {
        console.error('Unhandled promise rejection:', event.reason);
        this.showAlert('An error occurred. Please try again.', 'error');
      });
    }

    // Helper function to show alerts
    showAlert(message, type = 'info') {
      // Create alert container if it doesn't exist
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
        
        const response = await fetch(`${API_BASE_URL}/api/assignments`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
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
          setTimeout(() => window.location.href = 'login.html', 2000);
        } else {
          console.error('Error fetching assignments from the server');
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
            ${assignment.file || assignment.fileUrl ? 
              `<a href="${assignment.file || assignment.fileUrl}" target="_blank" class="assignment-file" download="${assignment.fileName || 'assignment'}">
                <i class="fas fa-paperclip"></i> ${assignment.fileName || 'Download File'}
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
      if (!form) return;
      
      const formData = new FormData(form);
      const submitBtn = form.querySelector('button[type="submit"]');
      if (!submitBtn) return;
      
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
        if (!token) {
          throw new Error('No token found. Please log in again!');
        }
        
        // Add the file if present
        const fileInput = document.getElementById('assignment-file');
        if (fileInput && fileInput.files.length > 0) {
          formData.append('assignment-file', fileInput.files[0]); // Match the field name expected by multer
        }
        
        console.log('Submitting form data:', Object.fromEntries(formData.entries()));
        
        const response = await fetch(`${API_BASE_URL}/api/assignments`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
            // Don't set Content-Type header when using FormData - let the browser set it with the boundary
          },
          body: formData,
        });
        
        const responseData = await response.json().catch(() => ({}));
        
        if (response.ok) {
          this.showAlert(responseData.message || 'Assignment created successfully!', 'success');
          form.reset();
          await this.fetchAssignments();
          // Switch to assignments tab
          const assignmentsTab = document.querySelector('.tab-link[data-tab="assignments-section"]');
          if (assignmentsTab) {
            assignmentsTab.click();
          }
        } else if (response.status === 401) {
          this.showAlert('Session expired. Please log in again.', 'error');
          setTimeout(() => { window.location.href = 'login.html'; }, 2000);
        } else {
          throw new Error(responseData.error || responseData.message || 'Failed to create assignment');
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

    /* ------------------
       GRADES MANAGEMENT
       ------------------ */
    initGradeManagement() {
      const gradesTable = document.getElementById('grades-table');
      if (gradesTable) {
        // Fetch grades from backend and render
        const token = localStorage.getItem('token');
        fetch(`${API_BASE_URL}/api/grades`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { 'Authorization': 'Bearer ' + token } : {})
          },
        })
        .then(response => {
          if (!response.ok) throw new Error('Failed to fetch grades');
          return response.json();
        })
        .then(grades => {
          const tbody = gradesTable.querySelector('tbody');
          tbody.innerHTML = '';
          grades.forEach(grade => {
            const studentName = grade.student && grade.student.name ? grade.student.name : (grade.student || '');
            const row = document.createElement('tr');
            row.innerHTML = `
              <td>${studentName}</td>
              <td>${grade.subject}</td>
              <td>${grade.grade || grade.score || ''}</td>
              <td>${grade.comments || ''}</td>
              <td><button class="edit-grade-btn">Edit</button></td>
            `;
            row.dataset.gradeId = grade._id || grade.id;
            tbody.appendChild(row);
          });
        })
        .catch(err => {
          const tbody = gradesTable.querySelector('tbody');
          tbody.innerHTML = '<tr><td colspan="5">Failed to load grades</td></tr>';
          console.error('Failed to load grades:', err);
        });
        // Add edit button handler
        gradesTable.addEventListener('click', (event) => {
          if (event.target.classList.contains('edit-grade-btn')) {
            const row = event.target.closest('tr');
            this.editGrade(row);
          }
        });
      }
    }

    editGrade(row) {
      const studentName = row.cells[0].innerText;
      const subject = row.cells[1].innerText;
      const currentGrade = row.cells[2].innerText;
      const newGrade = prompt(`Enter new grade for ${studentName} in ${subject}:`, currentGrade);
      if (newGrade) {
        row.cells[2].innerText = newGrade;
        this.updateGradeInStorage(studentName, subject, newGrade);
        const gradeId = row.dataset.gradeId;
        if (gradeId) {
          fetch(`${API_BASE_URL}/api/grades/${gradeId}`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ grade: newGrade }),
          })
          .then(response => {
            if (!response.ok) throw new Error('Failed to update grade');
          })
          .catch(error => {
            alert('Failed to update grade on server!');
            console.error(error);
          });
        } else {
          alert('No grade ID found for this row. Please refresh or re-add grade.');
        }
      }
    }

    updateGradeInStorage(studentName, subject, newGrade) {
      let gradesData = JSON.parse(localStorage.getItem('gradesData')) || [];
      let gradeUpdated = false;
      for (let i = 0; i < gradesData.length; i++) {
        if (gradesData[i].student === studentName &&
            gradesData[i].subject.toLowerCase() === subject.toLowerCase()) {
          gradesData[i].grade = newGrade;
          gradeUpdated = true;
          break;
        }
      }
      if (!gradeUpdated) {
        gradesData.push({ student: studentName, subject: subject, grade: newGrade });
      }
      localStorage.setItem('gradesData', JSON.stringify(gradesData));
    }

    /* ------------------
       ADD GRADE FORM FUNCTIONALITY
       ------------------ */
    initAddGradeForm() {
      const addGradeForm = document.getElementById('add-grade-form');
      if (addGradeForm) {
        addGradeForm.addEventListener('submit', (event) => {
          event.preventDefault();
          const studentSelect = document.getElementById('student-name');
          const studentId = studentSelect.value;
          const studentName = studentSelect.options[studentSelect.selectedIndex].text;
          const subject = document.getElementById('subject').value.trim();
          const grade = document.getElementById('grade').value.trim();
          const comments = document.getElementById('Comments').value.trim();
          if (studentId && subject && grade) {
            this.addGrade(studentId, studentName, subject, grade, comments);
            addGradeForm.reset();
          }
        });
      }
    }

    addGrade(studentId, studentName, subject, grade, comments) {
      const tableBody = document.querySelector('#grades-table tbody');
      const row = document.createElement('tr');
      row.innerHTML = `
        <td>${studentName}</td>
        <td>${subject}</td>
        <td>${grade}</td>
        <td>${comments || ""}</td>
        <td><button class="edit-grade-btn">Edit</button></td>
      `;
      tableBody.appendChild(row);
      this.updateGradeInStorage(studentName, subject, grade);
      
      fetch(`${API_BASE_URL}/api/grades`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(localStorage.getItem('token') ? { 'Authorization': 'Bearer ' + localStorage.getItem('token') } : {})
        },
        body: JSON.stringify({ student: studentId, subject, score: grade, comments }),
      })
      .then(response => {
        if (!response.ok) throw new Error('Failed to add grade');
        return response.json();
      })
      .then(data => {
        row.dataset.gradeId = data.grade?._id || data.grade?.id;
      })
      .catch(error => {
        alert('Failed to save grade to server!');
        console.error(error);
      });
    }

    /* ------------------
       ANNOUNCEMENTS MANAGEMENT
       ------------------ */
    initAnnouncementManagement() {
      const announcementForm = document.getElementById('announcement-form');
      if (announcementForm) {
        announcementForm.addEventListener('submit', (event) => {
          event.preventDefault();
          const textInput = document.getElementById('announcement-text');
          const text = textInput.value.trim();

          if (text !== '') {
            this.postAnnouncement(text);
            announcementForm.reset();
          }
        });
      }

      // Fetch announcements on page load
      this.fetchAnnouncements();
    }

    postAnnouncement(text) {
      const token = localStorage.getItem('token');

      fetch(`${API_BASE_URL}/api/announcements`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ text })
      })
      .then(res => {
        if (!res.ok) {
          throw new Error(`Failed to post announcement: ${res.status}`);
        }
        return res.json();
      })
      .then(data => {
        const li = document.createElement('li');
        li.innerHTML = `<strong>New Announcement:</strong> ${data.announcement.text}`;
        const announcementsList = document.querySelector('#announcements ul');
        if (announcementsList) {
          announcementsList.prepend(li); // adds it to top
        }
      })
      .catch(err => {
        console.error('Error posting announcement:', err);
        alert('Failed to post announcement. Please try again.');
      });
    }

    fetchAnnouncements() {
      const token = localStorage.getItem('token');

      fetch(`${API_BASE_URL}/api/announcements`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      })
      .then(res => {
        if (!res.ok) {
          throw new Error(`Failed to fetch announcements: ${res.status}`);
        }
        return res.json();
      })
      .then(data => {
        const announcementsList = document.querySelector('#announcements ul');
        if (!announcementsList) return;

        announcementsList.innerHTML = ''; // Clear old list

        data.forEach(announcement => {
          const li = document.createElement('li');
          li.innerHTML = `<strong>Announcement:</strong> ${announcement.text}`;
          announcementsList.appendChild(li);
        });
      })
      .catch(err => {
        console.error('Error fetching announcements:', err);
        alert('Failed to load announcements. Please try again.');
      });
    }

    /* ------------------
       ATTENDANCE MANAGEMENT
       ------------------ */
    initAttendanceManagement() {
      // Implementation for attendance management
    }

    /* ------------------
       COMMUNICATION MANAGEMENT
       ------------------ */
    initCommunicationManagement() {
      // Implementation for communication management
    }

    /* ------------------
       RESOURCE UPLOAD
       ------------------ */
    initResourceUpload() {
      // Implementation for resource upload
    }

    /* ------------------
       DOWNLOAD REPORT
       ------------------ */
    initDownloadReport() {
      // Implementation for download report
    }

    /* ------------------
       REPORT CARD UPLOAD
       ------------------ */
    initReportCardUpload() {
      const uploadForm = document.getElementById('upload-report-form');
      if (!uploadForm) return;
      
      uploadForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const studentName = document.getElementById('report-student').value;
        const year = document.getElementById('report-year').value;
        const term = document.getElementById('report-term').value;
        const comments = document.getElementById('report-comments').value;
        const fileInput = document.getElementById('report-file');
        
        if (!studentName || !year || !term || !fileInput.files[0]) {
          alert('Please fill in all required fields');
          return;
        }
        
        const formData = new FormData();
        formData.append('studentName', studentName);
        formData.append('year', year);
        formData.append('term', term);
        formData.append('comments', comments);
        formData.append('reportCard', fileInput.files[0]);
        
        try {
          const token = localStorage.getItem('token');
          const response = await fetch(`${API_BASE_URL}/api/report-cards`, {
            method: 'POST',
            headers: token ? { 'Authorization': 'Bearer ' + token } : {},
            body: formData
          });
          
          const data = await response.json();
          if (!response.ok) throw new Error(data.msg || 'Failed to upload report card');
          
          alert('Report card uploaded successfully!');
          uploadForm.reset();
          this.fetchReportCards();
        } catch (err) {
          alert('Failed to upload report card!');
          console.error(err);
        }
      });
    }

    // Fetch and display uploaded report cards
    async fetchReportCards() {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_BASE_URL}/api/report-cards`, {
          headers: token ? { 'Authorization': 'Bearer ' + token } : {}
        });
        
        const data = await response.json();
        const container = document.getElementById('report-cards-list');
        if (!container) return;
        
        container.innerHTML = '';
        // Updated to support both {reportCards: [...]} and direct array
        const reportCards = Array.isArray(data) ? data : (data.reportCards || []);
        
        if (!response.ok || !reportCards.length) {
          container.innerHTML = '<p>No report cards uploaded yet.</p>';
          return;
        }
        
        reportCards.forEach(card => {
          const div = document.createElement('div');
          div.className = 'report-card-item';
          div.innerHTML = `
            <strong>${card.studentName}</strong> (${card.year}, ${card.term})<br>
            <em>${card.comments || ''}</em><br>
            <a href="${API_BASE_URL}/uploads/report-cards/${card.path}" target="_blank">View PDF</a>`;
          container.appendChild(div);
        });
      } catch (err) {
        console.error('Failed to fetch report cards:', err);
      }
    }

    // Load students for report card dropdown
    async loadStudentsForReportCardDropdown() {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_BASE_URL}/api/students`, {
          headers: token ? { 'Authorization': 'Bearer ' + token } : {}
        });
        
        const students = await response.json();
        const select = document.getElementById('report-student');
        if (!select) return;
        
        select.innerHTML = '<option value="">Select Student</option>';
        students.forEach(student => {
          const name = student.name || student.username || student.email || student._id;
          select.innerHTML += `<option value="${name}">${name}</option>`;
        });
      } catch (err) {
        console.error('Failed to load students for report card dropdown:', err);
      }
    }

    // Load students for grade dropdown
    loadStudentsForGradeDropdown() {
      const studentSelect = document.getElementById('student-name');
      if (!studentSelect) return;
      
      const token = localStorage.getItem('token');
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
          option.textContent = student.name;
          studentSelect.appendChild(option);
        });
      })
      .catch(err => {
        studentSelect.innerHTML = '<option value="">Failed to load students</option>';
        console.error('Failed to load students:', err);
      });
    }
  }

  // PROFILE MANAGEMENT
  class TeacherProfile {
    constructor() {
      this.initProfileForm();
      this.initChangePhoto();
      this.initChangePassword();
    }
    
    initProfileForm() {
      const profileForm = document.getElementById('profile-form');
      if (profileForm) {
        profileForm.addEventListener('submit', (e) => {
          e.preventDefault();
          // Simulate saving profile info (you can add API calls here)
          document.getElementById('message').style.display = 'block';
          setTimeout(() => {
            document.getElementById('message').style.display = 'none';
          }, 2000);
        });
      }
    }
    
    initChangePhoto() {
      const changePhotoBtn = document.getElementById('change-photo-btn');
      const photoUpload = document.getElementById('photo-upload');
      changePhotoBtn.addEventListener('click', () => {
        photoUpload.click();
      });
      photoUpload.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
          const reader = new FileReader();
          reader.onload = function(event) {
            document.getElementById('profile-photo').src = event.target.result;
          };
          reader.readAsDataURL(file);
        }
      });
    }
    
    initChangePassword() {
      const passwordForm = document.getElementById('password-form');
      if (passwordForm) {
        passwordForm.addEventListener('submit', (e) => {
          e.preventDefault();
          alert('Password changed successfully!');
          passwordForm.reset();
        });
      }
    }
  }

  // CLASS MANAGEMENT
  class ClassManagement {
    constructor() {
      this.initViewDetails();
    }
    
    initViewDetails() {
      const viewDetailBtns = document.querySelectorAll('.view-details-btn');
      viewDetailBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
          const className = e.target.closest('li').querySelector('strong').innerText;
          // Display dummy class details; replace with actual details as needed.
          alert(`Viewing details for ${className}:\n- Teacher: Jane Smith\n- Students: ${className.includes('10A') ? '25' : '28'}\n- Room: 101`);
        });
      });
    }
  }

  // Initialize all teacher dashboard functionalities.
  const teacherDashboard = new TeacherDashboard();
  
  // Load students for grade dropdown
  teacherDashboard.loadStudentsForGradeDropdown();
});
