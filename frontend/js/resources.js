// API Configuration - use var to allow redefinition if needed
if (typeof window.API_BASE_URL === 'undefined') {
  window.API_BASE_URL = 'http://localhost:5000';
}

// Initialize the resources page
document.addEventListener('DOMContentLoaded', () => {
  console.log('Resources page loaded');
  
  // Get user profile to determine role
  const userProfile = JSON.parse(localStorage.getItem('userProfile') || '{}');
  const isStudent = userProfile.role === 'student';
  
  // Set up event listeners for the upload form
  const uploadForm = document.getElementById('upload-form');
  if (uploadForm) {
    uploadForm.addEventListener('submit', handleFileUpload);
    
    // Set default class if user has a class assigned
    const userProfile = JSON.parse(localStorage.getItem('userProfile') || '{}');
    if (userProfile.class) {
      const classSelect = document.getElementById('class-select');
      if (classSelect) {
        // Find and select the user's class
        for (let i = 0; i < classSelect.options.length; i++) {
          if (classSelect.options[i].value === userProfile.class) {
            classSelect.selectedIndex = i;
            break;
          }
        }
      }
    }
  }
  
    // Set up event listener for the upload button
  const uploadBtn = document.getElementById('upload-resource-btn');
  if (uploadBtn) {
    // Always show the button for teachers
    uploadBtn.style.display = 'block';
    uploadBtn.style.visibility = 'visible'; // Ensure it's visible
    uploadBtn.addEventListener('click', (e) => {
      e.preventDefault();
      const container = document.getElementById('upload-form-container');
      if (container) {
        container.style.display = container.style.display === 'none' ? 'block' : 'none';
      }
      
      // Only show class selector for teachers/admins
      const classSelector = document.getElementById('resource-class');
      if (classSelector) {
        const userProfile = JSON.parse(localStorage.getItem('userProfile') || '{}');
        classSelector.style.display = userProfile.class ? 'none' : 'block';
      }
    });
  }
  
  // Set up event listener for the cancel button
  const cancelBtn = document.getElementById('cancel-upload-btn');
  if (cancelBtn) {
    cancelBtn.addEventListener('click', (e) => {
      e.preventDefault();
      const container = document.getElementById('upload-form-container');
      const form = document.getElementById('upload-form');
      if (container) container.style.display = 'none';
      if (form) form.reset();
    });
  }
  
  // Set up event listener for class filter
  const classFilter = document.getElementById('class-filter');
  if (classFilter) {
    classFilter.style.display = isStudent ? 'none' : 'inline-block';
    classFilter.addEventListener('change', (e) => {
      const selectedClass = e.target.value === 'all' ? null : e.target.value;
      loadResources(selectedClass);
    });
  }
  
  // Load resources for the appropriate class
  if (isStudent && userProfile.class) {
    // For students, only show resources for their class
    loadResources(userProfile.class);
  } else {
    // For teachers/admins, show all resources
    loadResources();
  }
});

// Global variables
let availableClasses = [];
let userClass = null;

// Cancel the upload process
const cancelBtn = document.getElementById('cancel-upload-btn');
if (cancelBtn) {
  cancelBtn.addEventListener('click', (e) => {
    e.preventDefault();
    const container = document.getElementById('upload-form-container');
    const form = document.getElementById('upload-form');
    if (container) container.style.display = 'none';
    if (form) form.reset();
  });
}

// Handle file upload
async function handleFileUpload(e) {
  e.preventDefault();
  
  // Get fresh references to the form elements when the form is submitted
  const form = e.target;
  const fileInput = form.querySelector('input[type="file"]');
  const classSelect = form.querySelector('select');
  const uploadBtn = form.querySelector('button[type="submit"]');
  
  console.log('[DEBUG] File upload handler started');
  
  // Log the current state of the form
  console.log('[DEBUG] Form elements:', { 
    fileInput: fileInput ? 'found' : 'not found',
    classSelect: classSelect ? 'found' : 'not found',
    uploadBtn: uploadBtn ? 'found' : 'not found',
    classSelectValue: classSelect ? classSelect.value : 'no class select found'
  });
  
  try {
    // Basic validation
    if (!fileInput || !fileInput.files || !fileInput.files[0]) {
      const errorMsg = 'No file selected';
      console.error(errorMsg);
      alert(errorMsg);
      throw new Error(errorMsg);
    }
    
    // Get the class select value
    const classSelectValue = classSelect ? classSelect.value : null;
    console.log('[DEBUG] Class select value:', classSelectValue);
    
    if (!classSelectValue) {
      const errorMsg = 'Please select a class from the dropdown';
      console.error(errorMsg);
      alert(errorMsg);
      if (classSelect) classSelect.focus();
      throw new Error(errorMsg);
    }
    
    const file = fileInput.files[0];
    const classAssigned = classSelect.value;
    const token = localStorage.getItem('token');
    
    if (!token) {
      console.error('No authentication token found');
      alert('Please log in to upload files');
      window.location.href = '/login.html';
      return;
    }
    
    // Disable button during upload
    if (uploadBtn) uploadBtn.disabled = true;
    
    // Show upload status
    const statusElement = document.getElementById('upload-status');
    if (statusElement) {
      statusElement.textContent = 'Uploading...';
      statusElement.style.color = 'blue';
      statusElement.style.display = 'block';
    }
    
    // Create form data
    const formData = new FormData();
    formData.append('resource', file);
    formData.append('classAssigned', classAssigned);
    
    // Log form data (for debugging)
    for (let pair of formData.entries()) {
      console.log(pair[0] + ': ', pair[1]);
    }
    
    // Make the upload request
    const response = await fetch(`${window.API_BASE_URL}/api/resources/upload`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: formData
    });
    
    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.message || 'Upload failed. Please try again.');
    }
    
    console.log('Upload successful:', result);
    
    // Show success message
    if (statusElement) {
      statusElement.textContent = 'Upload successful! Refreshing resources...';
      statusElement.style.color = 'green';
    }
    
    // Reset form
    const uploadForm = document.getElementById('upload-form');
    if (uploadForm) uploadForm.reset();
    
    const uploadFormContainer = document.getElementById('upload-form-container');
    if (uploadFormContainer) uploadFormContainer.style.display = 'none';
    
    // Reload resources after a short delay
    setTimeout(() => {
      loadResources();
      if (statusElement) {
        statusElement.style.display = 'none';
      }
    }, 1500);
    
  } catch (error) {
    console.error('Upload error:', error);
    
    // Show error message
    const statusElement = document.getElementById('upload-status');
    if (statusElement) {
      statusElement.textContent = `Error: ${error.message}`;
      statusElement.style.color = 'red';
      statusElement.style.display = 'block';
      
      // Auto-hide error after 5 seconds
      setTimeout(() => {
        statusElement.style.display = 'none';
      }, 5000);
    } else {
      alert(`Upload failed: ${error.message}`);
    }
  } finally {
    // Re-enable button
    const uploadBtn = document.querySelector('#upload-form button[type="submit"]');
    if (uploadBtn) uploadBtn.disabled = false;
  }
}

// Set up the file upload form submission
const uploadForm = document.getElementById('upload-form');
if (uploadForm) {
  uploadForm.addEventListener('submit', handleFileUpload);
}

// Inline error/success display
function showInlineError(msg, elementId = 'error-message') {
  const el = document.getElementById(elementId) || document.getElementById('error-message');
  if (!el) {
    console.error('Error element not found:', elementId);
    return;
  }
  el.textContent = msg;
  el.style.color = '#d32f2f'; // Dark red for errors
  el.style.backgroundColor = '#ffebee'; // Light red background
  el.style.padding = '10px';
  el.style.borderRadius = '4px';
  el.style.margin = '10px 0';
  el.style.display = 'block';
  
  // Auto-hide after 5 seconds
  setTimeout(() => {
    el.style.display = 'none';
  }, 5000);
}

function showInlineSuccess(msg, elementId = 'error-message') {
  const el = document.getElementById(elementId) || document.getElementById('error-message');
  if (!el) {
    console.error('Success element not found:', elementId);
    return;
  }
  el.textContent = msg;
  el.style.color = '#2e7d32'; // Dark green for success
  el.style.backgroundColor = '#e8f5e9'; // Light green background
  el.style.padding = '10px';
  el.style.borderRadius = '4px';
  el.style.margin = '10px 0';
  el.style.display = 'block';
  
  // Auto-hide after 5 seconds
  setTimeout(() => {
    el.style.display = 'none';
  }, 5000);
}

// Load and display available resources with class filtering
async function loadResources(selectedClass = null) {
  const url = new URL(`${window.API_BASE_URL}/api/resources`);
  
  // Get token and verify authentication
  const token = localStorage.getItem('token');
  if (!token) {
    window.location.href = '/login.html';
    return;
  }
  
  // Decode the JWT token to get user role
  let userRole = 'student'; // Default to most restrictive
  try {
    const tokenParts = token.split('.');
    if (tokenParts.length === 3) {
      const payload = JSON.parse(atob(tokenParts[1]));
      userRole = payload.role || 'student';
    }
  } catch (error) {
    console.error('Error decoding token:', error);
  }
  
  // Set up class filtering
  if (selectedClass && selectedClass !== 'all') {
    url.searchParams.set('class', selectedClass);
  }
  
  // For students, always filter by their class
  const userProfile = JSON.parse(localStorage.getItem('userProfile') || '{}');
  if (userRole === 'student') {
    const studentClass = userProfile.class || (userProfile.profile && userProfile.profile.class);
    if (studentClass) {
      url.searchParams.set('class', String(studentClass).trim());
      // Hide class filter for students
      const classFilter = document.getElementById('class-filter');
      if (classFilter) {
        classFilter.style.display = 'none';
        const label = classFilter.previousElementSibling;
        if (label?.tagName === 'LABEL') label.style.display = 'none';
      }
    } else {
      // Show error for students without a class
      const resourceList = document.getElementById('resource-list');
      if (resourceList) {
        resourceList.innerHTML = `
          <div class="error-message" style="color: #d32f2f; padding: 15px; background: #ffebee; border-radius: 4px; margin: 10px 0;">
            You are not assigned to any class. Please contact your administrator.
          </div>`;
      }
      return;
    }
  }
  
  console.log('Fetching resources from:', url.toString());
  
  fetch(url, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('token')}`,
    },
  })
    .then(response => {
      console.log('Response status:', response.status);
      if (!response.ok) {
        return response.json().then(err => {
          console.error('Error response:', err);
          throw new Error(err.message || 'Failed to load resources');
        });
      }
      return response.json();
    })
    .then(data => {
      console.log('Resources received:', data);
      // Store classes and user class for later use
      if (data.classes) {
        availableClasses = data.classes;
      }
      if (data.userClass) {
        userClass = data.userClass;
      }
      
      // Only show class filter for teachers/admins
      const userProfile = JSON.parse(localStorage.getItem('userProfile') || '{}');
      const isStudent = userProfile.role === 'student';
      
      if (!isStudent) {
        updateClassFilter();
      } else {
        // Hide the filter container for students
        const filterContainer = document.querySelector('.filter-container');
        if (filterContainer) {
          filterContainer.style.display = 'none';
        }
      }
      
      const resourceList = document.getElementById('resource-list');
      resourceList.innerHTML = '';  // Clear existing resources
      resourceList.innerHTML = '<div class="loading">Loading resources...</div>';
      
      if (data.resources && data.resources.length > 0) {
        // Group resources by class
        const resourcesByClass = {};
        const userProfile = JSON.parse(localStorage.getItem('userProfile') || '{}');
        const isTeacher = userProfile.role === 'teacher';
        
        // Sort resources by class name
        const sortedResources = [...data.resources].sort((a, b) => {
          return a.classAssigned.localeCompare(b.classAssigned);
        });
        
        // Group by class
        sortedResources.forEach(resource => {
          if (!resourcesByClass[resource.classAssigned]) {
            resourcesByClass[resource.classAssigned] = [];
          }
          resourcesByClass[resource.classAssigned].push(resource);
        });
        
        // Sort classes
        const sortedClasses = Object.keys(resourcesByClass).sort();
        
        // Clear the loading message
        resourceList.innerHTML = '';
        
        // Render resources by class
        sortedClasses.forEach(className => {
          const resources = resourcesByClass[className];
          
          // Create class section
          const classSection = document.createElement('div');
          classSection.className = 'resource-class-section';
          
          // Add class header with count
          const classHeader = document.createElement('div');
          classHeader.className = 'resource-class-header';
          classHeader.innerHTML = `
            <h3>${className}</h3>
            <span class="resource-count">${resources.length} ${resources.length === 1 ? 'resource' : 'resources'}</span>
          `;
          classSection.appendChild(classHeader);
          
          // Create resources container
          const resourcesContainer = document.createElement('div');
          resourcesContainer.className = 'resources-grid';
          
          // Add resources for this class
          resources.forEach(resource => {
            const resourceCard = document.createElement('div');
            resourceCard.className = 'resource-card';
            
            const ext = resource.name.split('.').pop().toLowerCase();
            let icon = '📄';
            let type = 'Document';
            
            if (ext === 'pdf') {
              icon = '📄';
              type = 'PDF';
            } else if (['doc', 'docx'].includes(ext)) {
              icon = '📝';
              type = 'Word';
            } else if (['xls', 'xlsx'].includes(ext)) {
              icon = '📊';
              type = 'Excel';
            } else if (['ppt', 'pptx'].includes(ext)) {
              icon = '📑';
              type = 'PowerPoint';
            } else if (['jpg', 'jpeg', 'png', 'gif'].includes(ext)) {
              icon = '🖼️';
              type = 'Image';
            }
                
            // Format upload date
            const uploadDate = new Date(resource.createdAt).toLocaleDateString();
            
            // Show uploader name for teachers/admins
            const uploaderInfo = resource.uploadedBy && resource.uploadedBy.name 
              ? `<div class="resource-meta">Uploaded by ${resource.uploadedBy.name} on ${uploadDate}</div>` 
              : `<div class="resource-meta">Uploaded on ${uploadDate}</div>`;
            
            resourceCard.innerHTML = `
              <div class="resource-icon">${icon}</div>
              <div class="resource-content">
                <div class="resource-name" title="${resource.name}">
                  <a href="${window.API_BASE_URL}/uploads/resources/${resource.path}" target="_blank">
                    ${resource.name}
                  </a>
                </div>
                <div class="resource-type">${type} • ${(resource.size / 1024).toFixed(1)} KB</div>
                ${uploaderInfo}
              </div>
              <div class="resource-actions">
                <a href="${window.API_BASE_URL}/uploads/resources/${resource.path}" download class="download-btn" title="Download">
                  <i class="fas fa-download"></i>
                </a>
                ${resource.canDelete ? `
                  <button class="delete-btn" data-id="${resource._id}" title="Delete">
                    <i class="fas fa-trash"></i>
                  </button>
                ` : ''}
              </div>
            `;
            
            // Add the resource card to the grid
            resourcesContainer.appendChild(resourceCard);
          });
          
          // Add resources container to the class section
          classSection.appendChild(resourcesContainer);
          
          // Add the class section to the resource list
          resourceList.appendChild(classSection);
        });
        
        // Add event delegation for delete buttons
        resourceList.addEventListener('click', (e) => {
          const deleteBtn = e.target.closest('.delete-btn');
          if (deleteBtn) {
            e.preventDefault();
            const resourceId = deleteBtn.dataset.id;
            if (resourceId && confirm('Are you sure you want to delete this resource?')) {
              deleteResource(resourceId);
            }
          }
        });
      } else {
        resourceList.innerHTML = '<li>No resources available for the selected class.</li>';
      }
    })
    .catch(error => {
      console.error('Error loading resources:', error);
    });
}

// Delete a resource
function deleteResource(resourceId) {
  if (!resourceId) {
    console.error('No resource ID provided for deletion');
    showInlineError('Error: No resource ID provided');
    return;
  }

  console.log('Deleting resource with ID:', resourceId);
  
  // Ensure the resource ID is a string and trim any whitespace
  const cleanResourceId = String(resourceId).trim();
  
  fetch(`${window.API_BASE_URL}/api/resources/${cleanResourceId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('token')}`,
      'Content-Type': 'application/json',
    },
  })
    .then(async response => {
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.message || `Failed to delete resource (HTTP ${response.status})`);
      }
      return data;
    })
    .then(data => {
      console.log('Delete successful:', data);
      showInlineSuccess('Resource deleted successfully');
      // Reload resources after a short delay to show the success message
      setTimeout(() => loadResources(), 1000);
    })
    .catch(error => {
      console.error('Error deleting resource:', error);
      showInlineError(error.message || 'Failed to delete resource');
    });
}

// Add progress bar and message container
window.addEventListener('DOMContentLoaded', () => {
  if (!document.getElementById('upload-progress')) {
    const progress = document.createElement('progress');
    progress.id = 'upload-progress';
    progress.max = 100;
    progress.value = 0;
    progress.style.display = 'none';
    document.getElementById('upload-form-container').appendChild(progress);
  }
  if (!document.getElementById('resource-upload-msg')) {
    const msg = document.createElement('div');
    msg.id = 'resource-upload-msg';
    msg.style.display = 'none';
    msg.style.marginTop = '8px';
    document.getElementById('upload-form-container').appendChild(msg);
  }
});

// Update class filter dropdown (for teachers/admins only)
function updateClassFilter() {
  const classFilter = document.getElementById('class-filter');
  if (!classFilter) return;

  // Get token from localStorage
  const token = localStorage.getItem('token');
  if (!token) return;

  // Get user role from token
  let userRole = 'student';
  try {
    const tokenParts = token.split('.');
    if (tokenParts.length === 3) {
      const payload = JSON.parse(atob(tokenParts[1]));
      userRole = payload.role || 'student';
    }
  } catch (error) {
    console.error('Error decoding token:', error);
    return;
  }

  // Only show filter for teachers/admins
  if (userRole === 'student') {
    classFilter.style.display = 'none';
    const label = classFilter.previousElementSibling;
    if (label?.tagName === 'LABEL') label.style.display = 'none';
    return;
  }

  // For teachers/admins, show the filter
  classFilter.style.display = 'block';
  const label = classFilter.previousElementSibling;
  if (label?.tagName === 'LABEL') label.style.display = 'block';

  // Clear existing options
  classFilter.innerHTML = '';
  
  // Add default 'All Classes' option
  const defaultOption = document.createElement('option');
  defaultOption.value = 'all';
  defaultOption.textContent = 'All Classes';
  classFilter.appendChild(defaultOption);

  // Add class options
  if (availableClasses?.length) {
    availableClasses.forEach(className => {
      if (className) {
        const option = document.createElement('option');
        option.value = className;
        option.textContent = className.startsWith('Grade') || className.startsWith('Form') 
          ? className 
          : `Class ${className}`;
        classFilter.appendChild(option);
      }
    });
  }

  // Add change event listener
  classFilter.onchange = (e) => {
    loadResources(e.target.value === 'all' ? null : e.target.value);
  };
}

// Initialize the resources page
document.addEventListener('DOMContentLoaded', () => {
  console.log('Resources page loaded');
  
  // Check authentication
  const token = localStorage.getItem('token');
  if (!token) {
    console.log('No token found, redirecting to login');
    window.location.href = '/login.html';
    return;
  }

  // Initialize resources
  loadResources().catch(error => {
    console.error('Error loading resources:', error);
    const resourceList = document.getElementById('resource-list');
    if (resourceList) {
      resourceList.innerHTML = `
        <div class="error-message" style="color: #d32f2f; padding: 15px; background: #ffebee; border-radius: 4px; margin: 10px 0;">
          Error loading resources. Please try again later.
        </div>`;
    }
  });

  // Set up file upload form
  const uploadForm = document.getElementById('upload-form');
  const submitBtn = document.getElementById('submit-resource-btn');
  
  console.log('Upload form element:', uploadForm);
  console.log('Submit button element:', submitBtn);
  
  // Add direct click handler to the submit button
  if (submitBtn) {
    submitBtn.onclick = async (e) => {
      console.log('Submit button clicked');
      e.preventDefault();
      
      // Manually trigger form validation
      const fileInput = document.getElementById('resource-file');
      if (!fileInput || !fileInput.files || !fileInput.files[0]) {
        alert('Please select a file to upload');
        return;
      }
      
      // Call the upload function directly
      try {
        await handleFileUpload(e);
      } catch (error) {
        console.error('Upload failed:', error);
        alert('Upload failed: ' + (error.message || 'Unknown error'));
      }
    };
  }

  // Also handle form submission for good measure
  if (uploadForm) {
    uploadForm.onsubmit = (e) => {
      console.log('Form submission intercepted');
      e.preventDefault();
      if (submitBtn) {
        submitBtn.click();
      }
    };
  }

  // Update class filter based on user role
  updateClassFilter();
  
  console.log('Resources page initialization complete');
});
