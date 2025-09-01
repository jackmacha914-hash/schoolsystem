document.addEventListener('DOMContentLoaded', function() {
  const reportCardsSection = document.getElementById('report-cards-section');
  const reportCardsContainer = document.getElementById('report-cards');
  
  // Check if we're on the report cards page
  if (reportCardsSection) {
    // Show loading state with a better UI
    reportCardsContainer.innerHTML = `
      <div class="d-flex flex-column align-items-center justify-content-center py-5">
        <div class="spinner-border text-primary mb-3" style="width: 3rem; height: 3rem;" role="status">
          <span class="visually-hidden">Loading...</span>
        </div>
        <h4 class="h5 text-muted mb-2">Loading Your Report Cards</h4>
        <p class="text-muted small">Please wait while we retrieve your academic records...</p>
      </div>
    `;
    
    // Fetch report cards immediately
    fetchReportCards().catch(error => {
      console.error('Error loading report cards:', error);
      showError('Failed to load report cards. Please try again later.');
    });
  }
  
  // Handle clicks on report card actions using event delegation
  document.addEventListener('click', async (e) => {
    // Find the closest button element in case the click is on an icon inside the button
    const button = e.target.closest('.view-report-btn, .download-report-btn, .delete-report-btn');
    if (!button) return;
    
    e.preventDefault();
    const reportId = button.dataset.id;
    if (!reportId) return;
    
    // Store original button content
    const originalContent = button.innerHTML;
    
    try {
      // Show loading state on button
      button.disabled = true;
      button.innerHTML = `
        <span class="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span>
        ${button.textContent.trim()}
      `;
      
      // Handle different button types
      if (button.classList.contains('view-report-btn')) {
        await viewReportCard(reportId);
      } else if (button.classList.contains('download-report-btn')) {
        await downloadReportCard(reportId);
      } else if (button.classList.contains('delete-report-btn')) {
        // Use a nicer confirmation dialog
        const confirmed = await showConfirmationDialog(
          'Delete Report Card',
          'Are you sure you want to delete this report card? This action cannot be undone.',
          'Delete',
          'Cancel',
          'danger'
        );
        
        if (confirmed) {
          await deleteReportCard(reportId);
        }
      }
    } catch (error) {
      console.error('Error handling button click:', error);
      showError(`Failed to complete the action: ${error.message}`);
    } finally {
      // Restore button state
      if (button) {
        button.disabled = false;
        button.innerHTML = originalContent;
      }
    }
  });
  
  // Add keyboard navigation for better accessibility
  document.addEventListener('keydown', (e) => {
    // Close modals with Escape key
    if (e.key === 'Escape') {
      const openModals = document.querySelectorAll('.modal.show');
      openModals.forEach(modal => {
        const modalInstance = bootstrap.Modal.getInstance(modal);
        if (modalInstance) {
          modalInstance.hide();
        }
      });
    }
  });
  
  /**
   * Fetches the student's report cards from the server
   */
  async function fetchReportCards() {
    const container = document.getElementById('report-cards');
    
    try {
      console.log('Fetching report cards...');
      const token = localStorage.getItem('token');
      
      if (!token) {
        console.error('No authentication token found in localStorage');
        container.innerHTML = `
          <div class="alert alert-warning">
            <i class="bi bi-exclamation-triangle"></i>
            Please log in to view your report cards.
            <div class="mt-2">
              <a href="/pages/login.html" class="btn btn-sm btn-primary">Go to Login</a>
            </div>
          </div>`;
        return;
      }
      
      // Log token prefix for debugging (don't log the whole token for security)
      console.log('Auth token found, prefix:', token.substring(0, 10) + '...');

      // Show loading state
      container.innerHTML = `
        <div class="loading-spinner">
          <div class="spinner-border text-primary" role="status">
            <span class="visually-hidden">Loading...</span>
          </div>
          <p>Loading your report cards...</p>
        </div>
      `;
      
      // Get the student ID from the token
      let studentId;
      try {
        // Try to parse the token payload
        const tokenParts = token.split('.');
        if (tokenParts.length !== 3) {
          throw new Error('Invalid token format');
        }
        
        // Decode the payload (second part of the JWT)
        const base64Url = tokenParts[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const tokenPayload = JSON.parse(decodeURIComponent(atob(base64).split('').map(function(c) {
          return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join('')));
        
        console.log('Token payload:', tokenPayload);
        
        // Try different possible ID fields
        studentId = tokenPayload.userId || tokenPayload.id || tokenPayload.sub || tokenPayload.user_id;
        
        if (!studentId) {
          console.error('No user ID found in token payload');
          throw new Error('Could not determine student ID from token');
        }
        
        console.log('Using student ID:', studentId);
      } catch (error) {
        console.error('Error parsing token:', error);
        throw new Error('Failed to process authentication token');
      }
      
      console.log('Fetching report cards for student:', studentId);
      
      // Fetch report cards from the API
      const apiUrl = `http://localhost:5000/api/report-cards/student/${studentId}`;
      console.log('Fetching from URL:', apiUrl);
      
      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        },
        credentials: 'include',
        mode: 'cors'
      });
      
      console.log('Response status:', response.status, response.statusText);
      
      if (!response.ok) {
        let errorMessage = `Server responded with ${response.status} ${response.statusText}`;
        try {
          const errorData = await response.json();
          console.error('Error response data:', errorData);
          errorMessage = errorData.message || errorMessage;
        } catch (e) {
          console.error('Could not parse error response as JSON');
        }
        throw new Error(errorMessage);
      }
      
      const data = await response.json();
      console.log('Report cards data:', data);
      
      if (data && Array.isArray(data)) {
        // Handle case where the API returns the array directly
        displayReportCards(data);
      } else if (data.data && Array.isArray(data.data)) {
        displayReportCards(data.data);
      } else {
        console.warn('Unexpected API response format:', data);
        throw new Error('No report cards found or invalid response format');
        container.innerHTML = `
          <div class="alert alert-info">
            No report cards found for your account. Please check back later or contact your school administrator.
          </div>`;
      }
    } catch (error) {
      console.error('Error fetching report cards:', error);
      container.innerHTML = `
        <div class="alert alert-danger">
          Error loading report cards: ${error.message}
        </div>`;
    }
  }
  
  /**
   * Displays the report cards in an organized and interactive UI
   * @param {Array} reportCards - Array of report card objects
   */
  function displayReportCards(reportCards) {
    const container = document.getElementById('report-cards');
    if (!container) return;
    
    // Show empty state if no report cards
    if (!reportCards || reportCards.length === 0) {
      container.innerHTML = `
        <div class="text-center py-5">
          <div class="mb-4">
            <i class="bi bi-file-earmark-text" style="font-size: 3.5rem; color: #6c757d;"></i>
          </div>
          <h3 class="h5 mb-3">No Report Cards Available</h3>
          <p class="text-muted mb-4">
            You don't have any report cards available at this time.
          </p>
          <button class="btn btn-primary" id="refresh-report-cards">
            <i class="bi bi-arrow-repeat me-2"></i>Check Again
          </button>
        </div>`;
      
      // Add event listener for refresh button
      const refreshBtn = document.getElementById('refresh-report-cards');
      if (refreshBtn) {
        refreshBtn.addEventListener('click', fetchReportCards);
      }
      
      return;
    }
    
    try {
      // Sort report cards by year and term (newest first)
      const sortedCards = [...reportCards].sort((a, b) => {
        // First sort by year (descending)
        if (a.year !== b.year) return b.year - a.year;
        
        // Then by term (Term 3 > Term 2 > Term 1)
        const getTermNumber = (term) => {
          const match = (term || '').match(/\d+/);
          return match ? parseInt(match[0]) : 0;
        };
        
        return getTermNumber(b.term) - getTermNumber(a.term);
      });
      
      // Start building the HTML
      let html = `
        <div class="d-flex justify-content-between align-items-center mb-4">
          <h2 class="h4 mb-0">My Report Cards</h2>
          <button class="btn btn-outline-secondary btn-sm" id="refresh-report-cards">
            <i class="bi bi-arrow-repeat me-1"></i> Refresh
          </button>
        </div>
        <div class="row g-4">
      `;
      
      // Add each report card
      sortedCards.forEach((card, index) => {
        const formattedDate = new Date(card.updatedAt || card.createdAt).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        });
        
        // Determine status badge color
        let statusClass = 'bg-secondary';
        switch((card.status || '').toLowerCase()) {
          case 'published': statusClass = 'bg-success'; break;
          case 'draft': statusClass = 'bg-warning text-dark'; break;
          case 'archived': statusClass = 'bg-secondary'; break;
        }
        
        html += `
          <div class="col-md-6 col-lg-4">
            <div class="card h-100 shadow-sm">
              <div class="card-body">
                <div class="d-flex justify-content-between align-items-start mb-2">
                  <h5 class="card-title mb-0">${card.term || 'Report Card'}</h5>
                  <span class="badge ${statusClass} text-uppercase">
                    ${card.status || 'unknown'}
                  </span>
                </div>
                <p class="card-text text-muted small mb-2">
                  <i class="bi bi-calendar3 me-1"></i> ${formattedDate}
                </p>
                ${card.comments ? `
                  <p class="card-text small text-truncate" title="${card.comments}">
                    <i class="bi bi-chat-square-text me-1 text-muted"></i>
                    ${card.comments}
                  </p>
                ` : ''}
              </div>
              <div class="card-footer bg-transparent border-top-0 pt-0">
                <div class="d-flex justify-content-between">
                  <button class="btn btn-sm btn-outline-primary view-report-btn" 
                          data-id="${card.id || card._id}">
                    <i class="bi bi-eye me-1"></i> View
                  </button>
                  <div class="btn-group">
                    <a href="${card.fileUrl || `/api/report-cards/download/${card.id || card._id}`}" 
                       class="btn btn-sm btn-outline-secondary" 
                       download
                       target="_blank"
                       rel="noopener noreferrer">
                      <i class="bi bi-download"></i>
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        `;
      });
      
      // Close the row div
      html += `
        </div>
      `;
      
      // Update the container with the generated HTML
      container.innerHTML = html;
      
      // Add event listener for refresh button
      const refreshBtn = container.querySelector('#refresh-report-cards');
      if (refreshBtn) {
        refreshBtn.addEventListener('click', fetchReportCards);
      }
      
      // Add event listeners to view buttons
      container.querySelectorAll('.view-report-btn').forEach(button => {
        button.addEventListener('click', (e) => {
          const reportId = e.currentTarget.getAttribute('data-id');
          viewReportCard(reportId);
        });
      });
      
    } catch (error) {
      console.error('Error displaying report cards:', error);
      showError('An error occurred while displaying report cards. Please try again.');
    }
  }

  /**
   * Displays a modal with the report card details
   * @param {string} reportId - The ID of the report card to view
   */
  async function viewReportCard(reportId) {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        showError('Please log in to view report cards');
        return;
      }
      
      // Show loading state
      const modalContent = `
        <div class="modal-dialog modal-lg">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title">Loading Report Card...</h5>
              <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div class="modal-body text-center">
              <div class="spinner-border text-primary" role="status">
                <span class="visually-hidden">Loading...</span>
              </div>
              <p class="mt-2">Loading report card details...</p>
            </div>
          </div>
        </div>
      `;
      
      // Create and show modal
      const modal = createModal('reportCardModal', modalContent);
      const modalInstance = new bootstrap.Modal(modal);
      modalInstance.show();
      
      // Fetch report card details
      const response = await fetch(`/api/report-cards/${reportId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to fetch report card details');
      }
      
      const { data: reportCard } = await response.json();
      
      // Update modal with report card content
      const modalBody = modal.querySelector('.modal-body');
      modalBody.innerHTML = `
        <div class="report-card-preview">
          ${reportCard.htmlContent || 
            `<div class="alert alert-warning">
              No content available for this report card.
            </div>`
          }
        </div>
      `;
      
      // Update modal title
      modal.querySelector('.modal-title').textContent = 
        `${reportCard.term} ${reportCard.year} Report Card`;
      
    } catch (error) {
      console.error('Error viewing report card:', error);
      showError(`Failed to load report card: ${error.message}`);
      
      // Close modal if it exists
      const modal = document.getElementById('reportCardModal');
      if (modal) {
        const modalInstance = bootstrap.Modal.getInstance(modal);
        if (modalInstance) modalInstance.hide();
      }
    }
  }
  
  /**
   * Downloads a report card as a PDF
   * @param {string} reportId - The ID of the report card to download
   */
  async function downloadReportCard(reportId) {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        showError('Please log in to download report cards');
        return;
      }
      
      // Show loading indicator
      const downloadBtn = document.querySelector(`.download-report-btn[data-id="${reportId}"]`);
      const originalText = downloadBtn ? downloadBtn.innerHTML : 'Download';
      
      if (downloadBtn) {
        downloadBtn.disabled = true;
        downloadBtn.innerHTML = '<i class="bi bi-hourglass"></i> Preparing...';
      }
      
      // Fetch the report card
      const response = await fetch(`/api/report-cards/${reportId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to fetch report card for download');
      }
      
      const { data: reportCard } = await response.json();
      
      // Create a new window with the report card content
      const printWindow = window.open('', '_blank');
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>${reportCard.term} ${reportCard.year} Report Card</title>
          <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.1.3/dist/css/bootstrap.min.css" rel="stylesheet">
          <style>
            @media print {
              @page { size: A4; margin: 0; }
              body { margin: 1.5cm; }
              .no-print { display: none !important; }
            }
            body { font-family: Arial, sans-serif; line-height: 1.6; }
            .report-card { max-width: 800px; margin: 0 auto; }
            .header { text-align: center; margin-bottom: 2rem; }
            .student-info { margin-bottom: 2rem; }
            table { width: 100%; border-collapse: collapse; margin: 1rem 0; }
            th, td { border: 1px solid #dee2e6; padding: 0.75rem; text-align: left; }
            th { background-color: #f8f9fa; }
            .signature-line { margin-top: 3rem; display: flex; justify-content: space-between; }
          </style>
        </head>
        <body>
          <div class="container report-card">
            ${reportCard.htmlContent || '<p>No content available for this report card.</p>'}
          </div>
          <div class="no-print text-center mt-4 mb-4">
            <button onclick="window.print()" class="btn btn-primary">
              <i class="bi bi-printer"></i> Print Report Card
            </button>
          </div>
          <script>
            // Auto-print when the window loads
            window.onload = function() {
              setTimeout(function() {
                window.print();
              }, 500);
              
              // Close the window after printing
              window.onafterprint = function() {
                window.close();
              };
            };
          </script>
        </body>
        </html>
      `);
      
      printWindow.document.close();
      
    } catch (error) {
      console.error('Error downloading report card:', error);
      showError(`Failed to download report card: ${error.message}`);
    } finally {
      // Restore button state
      if (downloadBtn) {
        downloadBtn.disabled = false;
        downloadBtn.innerHTML = originalText;
      }
    }
  }
  
  /**
   * Deletes a report card
   * @param {string} reportId - The ID of the report card to delete
   */
  async function deleteReportCard(reportId) {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        alert('Please log in to perform this action');
        return;
      }

      const response = await fetch(`/api/report-cards/${reportId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.message || 'Failed to delete report card');
      }

      // Show success message and refresh the list
      alert('Report card deleted successfully');
      fetchReportCards();
    } catch (error) {
      console.error('Error deleting report card:', error);
      alert(`Error: ${error.message}`);
    }
  }
  
  /**
   * Creates a modal with the given ID and content
   * @param {string} id - The ID for the modal
   * @param {string} content - The HTML content for the modal
   * @returns {HTMLElement} The created modal element
   */
  function createModal(id, content) {
    // Remove existing modal if it exists
    const existingModal = document.getElementById(id);
    if (existingModal) {
      existingModal.remove();
    }
    
    // Create new modal
    const modal = document.createElement('div');
    modal.id = id;
    modal.className = 'modal fade';
    modal.tabIndex = '-1';
    modal.setAttribute('aria-hidden', 'true');
    
    modal.innerHTML = `
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">Report Card</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
          </div>
          <div class="modal-body">
            ${content}
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
          </div>
        </div>
      </div>
    `;
    
    document.body.appendChild(modal);
    return modal;
  }
  
  /**
   * Shows an error message to the user
   * @param {string} message - The error message to display
   */
  function showError(message) {
    // Check if we have a toast container, if not, create one
    let toastContainer = document.getElementById('toast-container');
    if (!toastContainer) {
      toastContainer = document.createElement('div');
      toastContainer.id = 'toast-container';
      toastContainer.className = 'toast-container position-fixed bottom-0 end-0 p-3';
      toastContainer.style.zIndex = '1100';
      document.body.appendChild(toastContainer);
    }
    
    // Create toast element
    const toastId = `toast-${Date.now()}`;
    const toast = document.createElement('div');
    toast.id = toastId;
    toast.className = 'toast show';
    toast.role = 'alert';
    toast.setAttribute('aria-live', 'assertive');
    toast.setAttribute('aria-atomic', 'true');
    
    toast.innerHTML = `
      <div class="toast-header bg-danger text-white">
        <strong class="me-auto">Error</strong>
        <button type="button" class="btn-close btn-close-white" data-bs-dismiss="toast" aria-label="Close"></button>
      </div>
      <div class="toast-body">
        <i class="bi bi-exclamation-triangle-fill me-2"></i>
        ${message}
      </div>
    `;
    
    // Add toast to container
    toastContainer.appendChild(toast);
    
    // Auto-remove toast after 5 seconds
    setTimeout(() => {
      const toastElement = document.getElementById(toastId);
      if (toastElement) {
        toastElement.classList.remove('show');
        setTimeout(() => toastElement.remove(), 150);
      }
    }, 5000);
  }
});