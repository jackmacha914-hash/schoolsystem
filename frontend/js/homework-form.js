// Homework Form Handler
document.addEventListener('DOMContentLoaded', function() {
  console.log('Homework form handler loaded');
  
  // Get the form element
  const form = document.getElementById('create-homework-form');
  if (!form) {
    console.error('Homework form not found!');
    return;
  }
  
  console.log('Form found, adding submit handler');
  
  // Add submit handler
  form.addEventListener('submit', async function(e) {
    e.preventDefault();
    console.log('Form submission started');
    
    // Show loading state
    const submitBtn = form.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerHTML;
    submitBtn.disabled = true;
    submitBtn.innerHTML = 'Submitting...';
    
    try {
      // Get form data
      const formData = new FormData(form);
      const token = localStorage.getItem('token');
      
      if (!token) {
        throw new Error('Not logged in');
      }
      
      console.log('Submitting form to server...');
      
      const response = await fetch('http://localhost:5000/api/homeworks', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });
      
      const data = await response.json().catch(() => ({}));
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to create homework');
      }
      
      console.log('Homework created successfully:', data);
      alert('Homework created successfully!');
      form.reset();
      
      // Refresh the homeworks list
      try {
        console.log('Attempting to refresh homeworks list...');
        
        // Check if the homework list container exists
        const homeworkList = document.getElementById('homework-list');
        console.log('Homework list container:', homeworkList);
        
        // First try the global function
        if (typeof fetchHomeworks === 'function') {
          console.log('Calling fetchHomeworks()...');
          fetchHomeworks();
          
          // Check if the homeworks were rendered after a short delay
          setTimeout(() => {
            const listItems = document.querySelectorAll('#homework-list li');
            console.log(`Found ${listItems.length} homeworks in the list`);
            if (listItems.length === 0) {
              console.warn('No homeworks found in the list after refresh. Forcing page reload...');
              window.location.reload();
            }
          }, 1000);
        } 
        // If that doesn't work, try to find and click the refresh button
        else if (document.querySelector('[onclick*="fetchHomeworks"]')) {
          console.log('Clicking refresh button...');
          document.querySelector('[onclick*="fetchHomeworks"]').click();
        }
        // If still no luck, reload the page
        else {
          console.log('Reloading page to refresh homeworks...');
          window.location.reload();
        }
      } catch (error) {
        console.error('Error refreshing homeworks:', error);
        // If there was an error, reload the page as a last resort
        window.location.reload();
      }
      
    } catch (error) {
      console.error('Error:', error);
      alert('Error: ' + (error.message || 'Failed to create homework'));
    } finally {
      // Reset button state
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalText;
      }
    }
  });
  
  // Add click handler for the submit button as a fallback
  document.addEventListener('click', function(e) {
    if (e.target && e.target.matches('#create-homework-form button[type="submit"]')) {
      console.log('Submit button clicked via event delegation');
      const form = document.getElementById('create-homework-form');
      if (form) {
        form.dispatchEvent(new Event('submit'));
      }
    }
  });
});
