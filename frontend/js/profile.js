// Import configuration and utilities
import { API_CONFIG, getResourceUrl } from './config.js';
import { getCurrentUser, getAuthToken, isAuthenticated, getUserRole } from './utils/auth.js';

document.addEventListener('DOMContentLoaded', function () {
  // Initialize event listeners
  initializeProfilePage();
  
  // Fetch profile data
  fetchProfile();
});

function initializeProfilePage() {
  // Profile form submission
  const profileForm = document.getElementById('profile-form');
  if (profileForm) {
    profileForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      await updateProfile();
    });
  }

  // Password form submission
  const passwordForm = document.getElementById('password-form');
  if (passwordForm) {
    passwordForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      await changePassword();
    });
  }

  // Photo upload
  const photoUpload = document.getElementById('photo-upload');
  const changePhotoBtn = document.getElementById('change-photo-btn');
  
  if (changePhotoBtn && photoUpload) {
    changePhotoBtn.addEventListener('click', (e) => {
      e.preventDefault();
      photoUpload.click();
    });

    photoUpload.addEventListener('change', handlePhotoUpload);
  }
}



// Function to fetch the profile data from the backend or localStorage
async function fetchProfile() {
  const loadingIndicator = document.getElementById('loading-indicator');
  const errorMessage = document.getElementById('error-message');
  
  if (loadingIndicator) loadingIndicator.style.display = 'block';
  if (errorMessage) errorMessage.style.display = 'none';

  // Check if user is authenticated
  if (!isAuthenticated()) {
    showError('Please log in to view your profile');
    window.location.href = "login.html";
    return;
  }
  
  const token = getAuthToken();
  const userRole = getUserRole();
  
  if (!userRole) {
    showError('Unable to determine user role');
    return;
  }

  // Check if we have the profile in localStorage
  const savedProfile = localStorage.getItem('userProfile');
  if (savedProfile) {
    try {
      const profile = JSON.parse(savedProfile);
      populateProfileForm(profile);
      if (loadingIndicator) loadingIndicator.style.display = 'none';
      
      // Still fetch fresh data in the background
      fetchFreshProfile(token);
      return;
    } catch (e) {
      console.error('Error parsing saved profile:', e);
      // Continue to fetch from server if there's an error with the saved profile
    }
  }

  // If no saved profile or error, fetch from server
  await fetchFreshProfile(token);
}

// Function to fetch fresh profile data from the server
async function fetchFreshProfile(token) {
  const loadingIndicator = document.getElementById('loading-indicator');
  
  try {
    // Get the current user's role from the token
    const tokenData = JSON.parse(atob(token.split('.')[1]));
    const userRole = tokenData.role || 'student';
    
    // Use the appropriate endpoint based on the user's role
    const profileEndpoint = `/api/students/profile`;
    
    const response = await fetch(`http://localhost:5000${profileEndpoint}`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json"
      }
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Failed to fetch profile: ${response.status}`);
    }

    const profile = await response.json();
    
    // Save the profile to localStorage
    localStorage.setItem('userProfile', JSON.stringify(profile));
    
    // Update the form with the fresh data
    populateProfileForm(profile);
    
  } catch (error) {
    console.error("Error fetching profile:", error);
    // Don't show error if we have cached data
    if (!localStorage.getItem('userProfile')) {
      showError(error.message || 'Failed to load profile');
    }
  } finally {
    if (loadingIndicator) loadingIndicator.style.display = 'none';
  }
}

function populateProfileForm(profile) {
  if (!profile) return;
  
  // Basic info
  if (document.getElementById('teacher-name')) {
    document.getElementById('teacher-name').value = profile.name || '';
  }
  if (document.getElementById('teacher-email')) {
    document.getElementById('teacher-email').value = profile.email || '';
  }
  if (document.getElementById('teacher-subjects')) {
    const subjects = profile.profile?.subjects || [];
    document.getElementById('teacher-subjects').value = 
      Array.isArray(subjects) ? subjects.join(', ') : '';
  }
  
  // Profile photo
  const photoElement = document.getElementById('profile-photo');
  if (photoElement) {
    let photoUrl = '';
    
    // Try to get the photo from different possible locations
    // Prefer the root-level photoUrl if available
    if (profile.photoUrl) {
      photoUrl = profile.photoUrl;
    } 
    // Fall back to other locations if needed
    else if (profile.profile?.photo) {
      photoUrl = profile.profile.photo;
    } else if (profile.photo) {
      photoUrl = profile.photo;
    } else if (profile.photoPath) {
      photoUrl = `/uploads/${profile.photoPath}`;
    } else if (profile.profile?.photoPath) {
      photoUrl = `/uploads/${profile.profile.photoPath}`;
    }
    
    // Process the photo URL using our helper function
    if (photoUrl) {
      console.log('Original photo URL:', photoUrl);
      
      // Clean up any existing localhost:8000 URLs
      if (photoUrl.includes('localhost:8000')) {
        photoUrl = photoUrl.replace('http://localhost:8000', API_CONFIG.BASE_URL);
      }
      
      // Use our helper function to get the correct URL
      photoUrl = getResourceUrl(photoUrl);
      console.log('Processed profile photo URL (before timestamp):', photoUrl);
      
      // Ensure the URL is absolute
      if (!photoUrl.startsWith('http') && !photoUrl.startsWith('data:')) {
        // If it's a relative URL, make it absolute
        if (photoUrl.startsWith('/')) {
          photoUrl = `${window.location.origin}${photoUrl}`;
        } else {
          photoUrl = `${window.location.origin}/${photoUrl}`;
        }
      }
      
      // Add a timestamp to prevent caching
      const timestamp = new Date().getTime();
      const cleanUrl = photoUrl.split('?')[0].split('#')[0]; // Remove any existing query params or hashes
      const finalUrl = `${cleanUrl}?t=${timestamp}`;
      
      console.log('Setting profile photo URL:', finalUrl);
      photoElement.src = finalUrl;
      
      // Add error handling with more details
      photoElement.onerror = function(err) {
        console.error('Failed to load profile photo:', {
          url: finalUrl,
          error: err,
          timestamp: new Date().toISOString()
        });
        // Fall back to default avatar
        photoElement.src = '/images/default-avatar.svg';
        
        // Try to reload the image after a delay (in case of temporary network issues)
        setTimeout(() => {
          console.log('Attempting to reload profile photo...');
          const newImg = new Image();
          newImg.onload = function() {
            console.log('Successfully loaded profile photo on retry');
            photoElement.src = finalUrl;
          };
          newImg.onerror = function() {
            console.error('Still unable to load profile photo after retry');
          };
          newImg.src = finalUrl;
        }, 2000);
      };
      
      // Force reload the image
      photoElement.src = ''; // Clear the src first
      setTimeout(() => {
        photoElement.src = finalUrl;
      }, 0);
    } else {
      console.log('No profile photo found, using default avatar');
      photoElement.src = '/images/default-avatar.svg';
    }
  }
}

// Function to handle updating the profile
async function updateProfile() {
  const token = localStorage.getItem('token');
  const saveBtn = document.getElementById('save-profile-btn');
  const originalBtnText = saveBtn ? saveBtn.textContent : '';
  
  if (saveBtn) {
    saveBtn.disabled = true;
    saveBtn.textContent = 'Saving...';
  }

  if (!token) {
    showError('Please log in to update your profile');
    window.location.href = "login.html";
    return;
  }

  // Get the appropriate form fields based on user role
  const isTeacher = document.getElementById('teacher-name') !== null;
  const nameField = isTeacher ? 'teacher-name' : 'student-name';
  const emailField = isTeacher ? 'teacher-email' : 'student-email';
  const subjectsField = isTeacher ? 'teacher-subjects' : 'student-subjects';
  const classField = 'student-class';
  const gradeField = 'student-grade';

  const nameElement = document.getElementById(nameField);
  const emailElement = document.getElementById(emailField);
  
  if (!nameElement || !emailElement) {
    showError('Could not find required form fields');
    return;
  }

  const name = nameElement.value.trim();
  const email = emailElement.value.trim();
  
  // Handle subjects for teacher or student
  let subjects = [];
  const subjectsElement = document.getElementById(subjectsField);
  if (subjectsElement) {
    subjects = subjectsElement.value
      .split(',')
      .map(subject => subject.trim())
      .filter(subject => subject !== '');
  }
  
  // Handle photo - we'll skip sending it here as it should be handled by the file upload
  // The photo will be updated separately via the file upload endpoint
  let photo = '';
  const photoElement = document.getElementById('profile-photo');
  if (photoElement && photoElement.src && !photoElement.src.includes('base64,')) {
    // If it's a regular URL (not a data URL), just use it as is
    photo = photoElement.src;
  }

  if (!name || !email) {
    showError('Name and email are required');
    if (saveBtn) {
      saveBtn.disabled = false;
      saveBtn.textContent = originalBtnText;
    }
    return;
  }

  const data = {
    name,
    email,
    subjects: subjects.length > 0 ? subjects : undefined
    // Don't include photo here as it's handled by the file upload endpoint
  };

  try {
    const response = await fetch("http://localhost:5000/api/profile", {
      method: "PUT",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(data)
    });

    const responseData = await response.json();
    console.log('Server response:', responseData);
    
    if (!response.ok) {
      // Handle validation errors
      if (response.status === 400) {
        const errorMsg = responseData.details 
          ? `Validation error: ${responseData.details.join(', ')}`
          : responseData.message || 'Invalid request data';
        throw new Error(errorMsg);
      }
      throw new Error(responseData.message || `Failed to update profile: ${response.status}`);
    }
    if (response.ok) {
      showSuccess('Profile updated successfully!');
      
      // Update local storage with new profile data
      const currentProfile = JSON.parse(localStorage.getItem('userProfile') || '{}');
      const updatedProfile = {
        ...currentProfile,
        name: data.name || currentProfile.name,
        email: data.email || currentProfile.email,
        profile: {
          ...(currentProfile.profile || {}),
          subjects: data.subjects || (currentProfile.profile?.subjects || []),
          photo: data.photo || (currentProfile.profile?.photo || '')
        }
      };
      
      localStorage.setItem('userProfile', JSON.stringify(updatedProfile));
      
    } else {
      throw new Error(responseData.message || `Failed to update profile: ${response.status}`);
    }
  } catch (error) {
    console.error("Error updating profile:", error);
    showError(error.message || 'Failed to update profile');
  } finally {
    if (saveBtn) {
      saveBtn.disabled = false;
      saveBtn.textContent = originalBtnText;
    }
  }
}

// Function to handle photo upload
async function handlePhotoUpload(event) {
  const file = event.target.files[0];
  if (!file) return;

  const token = localStorage.getItem('token');
  if (!token) {
    showError('Please log in to upload a photo');
    window.location.href = 'login.html';
    return;
  }

  const formData = new FormData();
  formData.append('photo', file);

  try {
    const response = await fetch('http://localhost:5000/api/students/profile/photo', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: formData
    });

    const data = await response.json();

    if (response.ok) {
      // Update the photo in the UI
      const photoElement = document.getElementById('profile-photo');
      if (photoElement) {
        // First, try to get the photo URL from various possible locations in the response
        // Prefer the root-level photoUrl if available
        let photoUrl = data.photoUrl || '';
        
        // If we don't have a photo URL yet, try other locations
        if (!photoUrl) {
          if (data.photoPath) {
            // If we have a photoPath, construct the full URL
            photoUrl = getResourceUrl(data.photoPath);
            console.log('Constructed photo URL from photoPath:', photoUrl);
          } else if (data.profile?.photo) {
            // Fall back to profile.photo if available
            photoUrl = data.profile.photo;
            console.log('Using profile.photo URL:', photoUrl);
          } else if (data.profile?.photoPath) {
            // Fall back to profile.photoPath if available
            photoUrl = getResourceUrl(data.profile.photoPath);
            console.log('Constructed photo URL from profile.photoPath:', photoUrl);
          }
        }

        // If we still don't have a URL, try the profile.photo field
        if ((!photoUrl || photoUrl === '') && data.profile?.photo) {
          // If it's a relative path, prepend the base URL
          if (data.profile.photo.startsWith('/')) {
            photoUrl = `http://localhost:5000${data.profile.photo}`;
          } else if (!data.profile.photo.startsWith('http')) {
            photoUrl = `http://localhost:5000/uploads/${data.profile.photo}`;
          } else {
            photoUrl = data.profile.photo;
          }
          console.log('Using profile.photo URL:', photoUrl);
        }

        // Set the photo source with a timestamp to prevent caching
        if (photoUrl) {
          const timestamp = new Date().getTime();
          // Remove any existing timestamp
          const cleanUrl = photoUrl.split('?')[0];
          // Set the source with a new timestamp
          photoElement.src = `${cleanUrl}?t=${timestamp}`;
          console.log('Setting photo src to:', photoElement.src);
          
          // Add an error handler in case the image fails to load
          photoElement.onerror = function() {
            console.error('Failed to load profile photo:', photoElement.src);
            // Fallback to default avatar
            photoElement.src = '/images/default-avatar.svg';
          };
        } else {
          console.log('No photo URL available, using default avatar');
          photoElement.src = '/images/default-avatar.svg';
        }
      }
      
      // Update the profile in localStorage
      const currentProfile = JSON.parse(localStorage.getItem('userProfile') || '{}');
      if (currentProfile) {
        currentProfile.profile = currentProfile.profile || {};
        currentProfile.profile.photo = data.photoUrl;
        localStorage.setItem('userProfile', JSON.stringify(currentProfile));
      }
      
      showSuccess('Profile photo updated successfully');
    } else {
      throw new Error(data.message || 'Failed to upload photo');
    }
  } catch (error) {
    console.error('Error uploading photo:', error);
    showError(error.message || 'Failed to upload photo');
  }
}

// Function to handle password change
async function changePassword() {
  const token = localStorage.getItem('token');
  const changePwdBtn = document.getElementById('change-password-btn');
  const originalBtnText = changePwdBtn ? changePwdBtn.textContent : '';
  
  if (changePwdBtn) {
    changePwdBtn.disabled = true;
    changePwdBtn.textContent = 'Updating...';
  }

  if (!token) {
    showError('Please log in to change your password');
    window.location.href = "login.html";
    return;
  }

  const currentPassword = document.getElementById('current-password').value;
  const newPassword = document.getElementById('new-password').value;

  if (!currentPassword || !newPassword) {
    showError('Both current and new password are required');
    if (changePwdBtn) {
      changePwdBtn.disabled = false;
      changePwdBtn.textContent = originalBtnText;
    }
    return;
  }

  try {
    const response = await fetch("http://localhost:5000/api/profile/change-password", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        currentPassword,
        newPassword
      })
    });

    const responseData = await response.json();
    
    if (!response.ok) {
      throw new Error(responseData.message || `Failed to change password: ${response.status}`);
    }

    showSuccess('Password changed successfully!');
    
    // Clear the password fields
    document.getElementById('current-password').value = '';
    document.getElementById('new-password').value = '';
    
  } catch (error) {
    console.error("Error changing password:", error);
    showError(error.message || 'Failed to change password');
  } finally {
    if (changePwdBtn) {
      changePwdBtn.disabled = false;
      changePwdBtn.textContent = originalBtnText;
    }
  }
}

// Helper function to show error messages
function showError(message) {
  try {
    console.error('Showing error:', message);
    const errorElement = createMessageElement('error-message');
    
    // Clear previous errors
    errorElement.innerHTML = '';
    
    // Create error container
    const errorContainer = document.createElement('div');
    errorContainer.style.padding = '10px';
    errorContainer.style.backgroundColor = '#f8d7da';
    errorContainer.style.border = '1px solid #f5c6cb';
    errorContainer.style.borderRadius = '4px';
    errorContainer.style.color = '#721c24';
    errorContainer.style.marginBottom = '15px';
    
    // Add error message
    const errorTitle = document.createElement('strong');
    errorTitle.textContent = 'Error: ';
    const errorText = document.createElement('span');
    errorText.textContent = message;
    
    errorContainer.appendChild(errorTitle);
    errorContainer.appendChild(errorText);
    errorElement.appendChild(errorContainer);
    errorElement.style.display = 'block';
    
    // Hide success message if visible
    const successElement = document.getElementById('success-message');
    if (successElement) {
      successElement.style.display = 'none';
    }
    
    // Auto-hide after 10 seconds
    setTimeout(() => {
      errorElement.style.display = 'none';
    }, 10000);
    
    // Scroll to the error message
    errorElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
  } catch (err) {
    console.error('Error showing error message:', err);
    alert(message); // Fallback if error element doesn't exist
  }
}

// Helper function to show success messages
function showSuccess(message) {
  const successElement = document.getElementById('success-message') || createMessageElement('success-message');
  if (successElement) {
    successElement.textContent = message;
    successElement.style.color = '#28a745';
    successElement.style.display = 'block';
    
    // Hide the message after 3 seconds
    setTimeout(() => {
      successElement.style.display = 'none';
    }, 3000);
  } else {
    alert(message); // Fallback if success element doesn't exist
  }
}

// Helper function to create a message element if it doesn't exist
function createMessageElement(id) {
  const container = document.querySelector('.profile-card');
  if (!container) return null;
  
  const element = document.createElement('div');
  element.id = id;
  element.style.margin = '10px 0';
  element.style.padding = '10px';
  element.style.borderRadius = '4px';
  element.style.display = 'none';
  
  container.insertBefore(element, container.firstChild);
  return element;
}
