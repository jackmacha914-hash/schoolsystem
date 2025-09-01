// Show message to user
function showMessage(message, type = 'success') {
    const messageDiv = document.getElementById('message');
    const messageText = document.getElementById('message-text');
    if (!messageDiv || !messageText) return;
    
    // Set message text
    messageText.textContent = message;
    
    // Update alert classes based on message type
    messageDiv.className = `alert alert-dismissible fade show ${type === 'error' ? 'alert-danger' : 'alert-success'}`;
    messageDiv.style.display = 'block';
    
    // Auto-hide after 5 seconds
    const autoHide = setTimeout(() => {
        messageDiv.style.display = 'none';
    }, 5000);
    
    // Clear timeout if user dismisses the message
    const closeBtn = messageDiv.querySelector('.btn-close');
    if (closeBtn) {
        closeBtn.onclick = () => {
            clearTimeout(autoHide);
            messageDiv.style.display = 'none';
        };
    }
}

// Show payment history in a custom modal
function showPaymentHistory(fee, event) {
    console.log('=== DEBUG: showPaymentHistory called ===');
    console.log('Event:', event);
    
    if (event) {
        event.preventDefault();
        event.stopPropagation();
    }
    
    // Debug: Check if fee object is valid
    if (!fee) {
        console.error('❌ No fee object provided');
        return;
    }
    
    console.log('🔍 Fee ID:', fee._id);
    console.log('📋 Fee object structure:', Object.keys(fee));
    
    // Get the modal elements with detailed logging
    console.log('\n🔍 Locating modal elements...');
    const modal = document.getElementById('customPaymentModal');
    const modalTitle = document.querySelector('.custom-modal-title');
    const closeBtn = document.querySelector('.custom-close');
    const closeModalBtn = document.getElementById('closePaymentModal');
    const tbody = document.getElementById('paymentHistoryBody');
    
    // Log all elements with modal-related classes/ids for debugging
    console.log('\n🔍 All elements with modal-related classes/ids:');
    console.log('Elements with id containing "modal":', document.querySelectorAll('[id*="modal"]'));
    console.log('Elements with class containing "modal":', document.querySelectorAll('[class*="modal"]'));
    
    // Check if elements exist in the DOM
    if (!modal) {
        console.error('❌ Modal element not found in DOM!');
        console.log('Available elements in document:', Array.from(document.querySelectorAll('*')).map(el => ({
            id: el.id,
            class: el.className,
            tag: el.tagName
        })).filter(el => el.id || el.class));
        return;
    }
    
    // Force show the modal for testing
    console.log('\n🔄 Forcing modal to be visible...');
    modal.style.display = 'flex';
    modal.style.visibility = 'visible';
    modal.style.opacity = '1';
    modal.style.zIndex = '9999';
    
    // Log computed styles
    const modalStyles = window.getComputedStyle(modal);
    console.log('\n🎨 Modal computed styles:', {
        display: modalStyles.display,
        visibility: modalStyles.visibility,
        opacity: modalStyles.opacity,
        zIndex: modalStyles.zIndex,
        position: modalStyles.position
    });
    
    // Check if the modal is in the viewport
    const rect = modal.getBoundingClientRect();
    console.log('\n📍 Modal position and dimensions:', {
        top: rect.top,
        left: rect.left,
        width: rect.width,
        height: rect.height,
        isInViewport: (
            rect.top >= 0 &&
            rect.left >= 0 &&
            rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
            rect.right <= (window.innerWidth || document.documentElement.clientWidth)
        )
    });
    
    // Debug: Log element status with more details
    console.log('=== ELEMENT STATUS ===');
    console.log('Modal element exists:', !!modal);
    console.log('Modal title exists:', !!modalTitle);
    console.log('Close button exists:', !!closeBtn);
    console.log('Close modal button exists:', !!closeModalBtn);
    console.log('Table body exists:', !!tbody);
    
    // Check if elements exist in the DOM
    if (!modal) {
        console.error('❌ Modal element not found in DOM!');
        // Try to find any modal in the document
        console.log('Available modals in document:', document.querySelectorAll('[id*="modal"], [class*="modal"]'));
        return;
    }
    
    if (!tbody) {
        console.error('❌ Table body element not found in modal!');
        console.log('Available elements in modal:', modal.querySelectorAll('*'));
        return;
    }
    
    // Force display the modal for testing
    console.log('=== MODAL STYLES BEFORE ===');
    console.log('display:', window.getComputedStyle(modal).display);
    console.log('visibility:', window.getComputedStyle(modal).visibility);
    console.log('opacity:', window.getComputedStyle(modal).opacity);
    console.log('z-index:', window.getComputedStyle(modal).zIndex);
    
    // Force show the modal
    modal.style.display = 'flex';
    modal.style.visibility = 'visible';
    modal.style.opacity = '1';
    modal.style.zIndex = '2000';
    
    console.log('=== MODAL STYLES AFTER ===');
    console.log('display:', window.getComputedStyle(modal).display);
    console.log('visibility:', window.getComputedStyle(modal).visibility);
    console.log('opacity:', window.getComputedStyle(modal).opacity);
    console.log('z-index:', window.getComputedStyle(modal).zIndex);
    
    // Set the modal title
    modalTitle.textContent = `Payment History - ${fee.feeType || 'Fee Record'}`;
    
    // Clear previous content
    tbody.innerHTML = '';
    
    // Debug: Log the entire fee object to inspect its structure
    console.log('=== FEE OBJECT STRUCTURE ===');
    console.log('All fee properties:', Object.keys(fee));
    console.log('Fee ID:', fee._id);
    console.log('Fee type:', fee.feeType);
    console.log('Total amount:', fee.totalAmount || fee.amount);
    console.log('Paid amount:', fee.paidAmount);
    
    // Check for any payment-related fields
    const paymentFields = Object.keys(fee).filter(key => 
        key.toLowerCase().includes('payment') || 
        key.toLowerCase().includes('transaction') ||
        key.toLowerCase().includes('history')
    );
    
    console.log('Payment-related fields:', paymentFields);
    
    // Log each payment-related field
    paymentFields.forEach(field => {
        console.log(`Field "${field}":`, fee[field]);
        if (Array.isArray(fee[field])) {
            console.log(`  - Array length: ${fee[field].length}`);
            if (fee[field].length > 0) {
                console.log('  - First item:', fee[field][0]);
            }
        }
    });
    
    // Check for nested payment data
    if (fee.paymentDetails) {
        console.log('Payment details found:', fee.paymentDetails);
    }
    if (fee.transactions) {
        console.log('Transactions found:', fee.transactions);
    }
    
    // Debug: Check the fee object structure
    console.log('Fee object in showPaymentHistory:', JSON.parse(JSON.stringify(fee)));
    
    // Get payments array from fee object
    const payments = fee.payments || [];
    console.log('=== PAYMENT DATA DEBUG ===');
    console.log('Fee ID:', fee._id);
    console.log('Fee object keys:', Object.keys(fee));
    console.log('Payments array exists:', !!payments);
    if (payments) {
        console.log('Payments array length:', payments.length);
        console.log('Payments array content:', payments);
    } else {
        console.log('No payments array found in fee object');
    }
    
    // Log each payment's structure
    payments.forEach((p, i) => {
        console.log(`Payment ${i + 1} keys:`, Object.keys(p));
        console.log(`Payment ${i + 1} data:`, {
            amount: p.amount,
            paymentDate: p.paymentDate,
            paymentMethod: p.paymentMethod,
            reference: p.reference,
            notes: p.notes,
            recordedBy: p.recordedBy,
            createdAt: p.createdAt,
            updatedAt: p.updatedAt
        });
    });
    
    console.log('Fee paidAmount:', fee.paidAmount);
    console.log('Fee totalAmount:', fee.totalAmount);
    
    if (!payments || !Array.isArray(payments) || payments.length === 0) {
        console.log('No valid payments array found in fee object');
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td colspan="5" class="text-center py-4">
                <div class="text-muted">No payment history available</div>
                <div class="small mt-2">Total Paid: ${formatCurrency(fee.paidAmount || 0)}</div>
            </td>
        `;
        tbody.appendChild(tr);
    } else {
        console.log(`Found ${payments.length} payments`);
        
        // Sort payments by paymentDate (newest first)
        const sortedPayments = [...payments].sort((a, b) => {
            const dateA = a.paymentDate ? new Date(a.paymentDate) : new Date(0);
            const dateB = b.paymentDate ? new Date(b.paymentDate) : new Date(0);
            return dateB - dateA; // Sort descending (newest first)
        });
        
        // Add each payment to the table
        sortedPayments.forEach((payment, index) => {
            console.log(`Processing payment ${index + 1}:`, payment);
            
            // Format payment data with proper fallbacks
            const paymentDate = payment.paymentDate ? new Date(payment.paymentDate).toLocaleDateString() : 'N/A';
            const amount = typeof payment.amount === 'number' ? formatCurrency(payment.amount) : 'N/A';
            const method = payment.paymentMethod || 'Cash';
            const reference = payment.reference || 'N/A';
            const notes = payment.notes ? `
                <div class="small text-muted mt-1" title="${payment.notes}">
                    <i class="bi bi-chat-left-text"></i> ${payment.notes.length > 30 ? payment.notes.substring(0, 30) + '...' : payment.notes}
                </div>
            ` : '';
            
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${paymentDate}</td>
                <td class="text-end">${amount}</td>
                <td>${method}</td>
                <td>${reference}</td>
                <td>
                    <span class="badge bg-success">Paid</span>
                    ${notes}
                </td>
            `;
            tbody.appendChild(tr);
        });
        
        // Add a summary row
        if (fee.paidAmount > 0) {
            const totalRow = document.createElement('tr');
            totalRow.className = 'table-active';
            totalRow.innerHTML = `
                <td colspan="4" class="text-end fw-bold">Total Paid:</td>
                <td class="fw-bold">${formatCurrency(fee.paidAmount)}</td>
            `;
            tbody.appendChild(totalRow);
        }
    }
    
    // Debug: Check if modal elements exist
    console.log('Modal element:', modal);
    console.log('Modal content:', modal.querySelector('.custom-modal-content'));
    console.log('Modal body:', modal.querySelector('.custom-modal-body'));
    
    // Show the modal with animation
    modal.style.display = 'flex';
    setTimeout(() => {
        modal.classList.add('show');
    }, 10);
    
    // Prevent scrolling when modal is open
    document.body.style.overflow = 'hidden';
    
    // Close modal function
    const closeModal = () => {
        modal.classList.remove('show');
        setTimeout(() => {
            modal.style.display = 'none';
            document.body.style.overflow = 'auto';
        }, 300);
    };
    
    // Close modal when clicking the overlay (outside the modal content)
    modal.addEventListener('click', function modalClickHandler(e) {
        if (e.target === modal || e.target.classList.contains('custom-close') || e.target.id === 'closePaymentModal') {
            closeModal();
        }
    });
    
    // Close modal when pressing the Escape key
    const handleEscape = (e) => {
        if (e.key === 'Escape') {
            closeModal();
            document.removeEventListener('keydown', handleEscape);
        }
    };
    document.addEventListener('keydown', handleEscape);
    
    // Cleanup event listeners when modal is closed
    const observer = new MutationObserver((mutations) => {
        if (modal.style.display === 'none') {
            document.removeEventListener('keydown', handleEscape);
            modal.removeEventListener('click', modalClickHandler);
            observer.disconnect();
        }
    });
    observer.observe(modal, { attributes: true, attributeFilter: ['style'] });
}

// Format currency value
function formatCurrency(amount) {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'KES',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(amount || 0);
}

document.addEventListener('DOMContentLoaded', function () {
    // Global variable to store homework data
    let homeworkData = [];
    
    // Get all the sidebar menu items (tabs) and sections
    const tabs = document.querySelectorAll('.tab-link');
    const sections = document.querySelectorAll('.tab-section');
    
    // Add event delegation for homework submission
    document.addEventListener('click', function(e) {
        if (e.target && e.target.matches('.submit-homework-btn')) {
            const homeworkId = e.target.dataset.homeworkId;
            const homework = homeworkData.find(hw => hw._id === homeworkId);
            if (homework) {
                showSubmissionModal(homework);
            }
        }
    });
    
    // Close modal when clicking on close button
    document.addEventListener('click', (e) => {
        // Close modal when clicking the close button
        if (e.target && e.target.matches('.close-modal, .close-modal *')) {
            hideSubmissionModal();
        }
        // Close modal when clicking the cancel button
        if (e.target && e.target.matches('.close-modal-btn, .close-modal-btn *')) {
            hideSubmissionModal();
        }
    });

    // Function to hide all sections
    function hideSections() {
        sections.forEach(section => {
            section.style.display = 'none';
        });
    }

    // Function to show a specific section
    function showSection(sectionId) {
        hideSections();
        const section = document.getElementById(sectionId);
        if (section) {
            section.style.display = 'block';
        }
    }

    // Function to set the active tab (highlighted tab)
    function setActiveTab(tab) {
        if (!tab) return; // 🔒 Avoid null crash
        tabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
    }

    // Set up event listeners for each tab in the sidebar
    tabs.forEach(tab => {
        tab.addEventListener('click', async function () {
            console.log('Tab clicked:', tab.textContent);
            const sectionId = this.getAttribute('data-tab');
            console.log('Section ID:', sectionId);
            
            // Remove active class from all tabs and add to clicked tab
            tabs.forEach(t => t.classList.remove('active'));
            this.classList.add('active');
            
            // Show the corresponding section
            showSection(sectionId);
            
            // Load data for the selected section if needed
            if (sectionId === 'assignments-section') {
                await fetchAssignments();
            } else if (sectionId === 'announcements-section') {
                await fetchAnnouncements();
            } else if (sectionId === 'resources-section') {
                await fetchResources();
            } else if (sectionId === 'homework-section') {
                await fetchHomeworks();
            } else if (sectionId === 'grades-section') {
                await fetchGrades();
            } else if (sectionId === 'report-cards-section') {
                // Initialize report cards
                const reportCards = new StudentReportCards();
                reportCards.initialize();
            } else if (sectionId === 'fee-records-section') {
                await fetchFeeRecords();
            }
        });
    });

    // Initialize the homework section if it's the active tab
    const activeTab = document.querySelector('.sidebar-item.active');
    if (activeTab && activeTab.getAttribute('data-tab') === 'homework-section') {
        fetchHomeworks();
    }

    // ✅ Safe default tab + section
    const profileTab = document.getElementById('profile-link');
    if (profileTab) {
        setActiveTab(profileTab);
        showSection('profile-section');
    }

    // ✅ Fetch Student Profile
    async function fetchUserProfile() {
        const token = localStorage.getItem("token");
        if (!token) {
            console.error("No token found. Redirecting to login...");
            window.location.href = "login.html";
            return;
        }

        try {
            const response = await fetch("http://localhost:5000/api/profile", {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }

            const userData = await response.json();
            console.log("Full User Profile Data:", JSON.stringify(userData, null, 2));
            
            // Debug: Log class-related data
            console.log("Class data - Root level:", userData.class);
            console.log("Profile data:", userData.profile);
            console.log("Class from profile:", userData.profile?.class);

            // Update form fields
            const studentNameInput = document.getElementById("student-name");
            studentNameInput.value = userData.name || "";
            
            // Set student ID as data attribute if it exists
            if (userData._id) {
                studentNameInput.setAttribute('data-student-id', userData._id);
                // Also store in local storage for future use
                localStorage.setItem('studentId', userData._id);
            }
            
            document.getElementById("student-email").value = userData.email || "";
            
            // Set the class in the profile form if the element exists
            const classInput = document.getElementById("profile-student-class");
            if (classInput) {
                // Try to get class from root level first, then from profile
                const userClass = userData.class || (userData.profile && userData.profile.class) || "";
                console.log("Setting class input value:", {
                    classFromRoot: userData.class,
                    classFromProfile: userData.profile?.class,
                    finalClass: userClass
                });
                classInput.value = userClass;
                
                // Ensure the class is stored at both root level and in profile for consistency
                if (userClass) {
                    // Update the userData object for localStorage
                    if (userData.class !== userClass) userData.class = userClass;
                    if (userData.profile) {
                        if (userData.profile.class !== userClass) {
                            userData.profile.class = userClass;
                        }
                    } else {
                        userData.profile = { class: userClass };
                    }
                    // Save to localStorage
                    localStorage.setItem('userProfile', JSON.stringify(userData));
                }
            }
            
            // Set the grade
            document.getElementById("student-grade").value = userData.profile?.grade || "";
            
            // Update profile photo if available
            const profilePhoto = document.getElementById("profile-photo");
            if (userData.profile?.photo) {
                profilePhoto.src = userData.profile.photo;
            } else {
                // Set default avatar if no photo is available
                profilePhoto.src = '../images/default-avatar.svg';
            }
            
            // Store the profile data in localStorage
            localStorage.setItem('userProfile', JSON.stringify(userData));
            
        } catch (error) {
            console.error("Error fetching profile:", error);
            // If we have cached data, use it
            const cachedProfile = localStorage.getItem('userProfile');
            if (cachedProfile) {
                const userData = JSON.parse(cachedProfile);
                document.getElementById("student-name").value = userData.name || "";
                document.getElementById("student-email").value = userData.email || "";
                document.getElementById("student-class").value = userData.class || userData.profile?.class || "";
                document.getElementById("student-grade").value = userData.grade || userData.profile?.grade || "";
            }
        }
    }
    
    // Handle profile form submission
    const profileForm = document.getElementById('profile-form');
    if (profileForm) {
        profileForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const token = localStorage.getItem('token');
            if (!token) {
                window.location.href = 'login.html';
                return;
            }
            
            const className = document.getElementById('profile-student-class')?.value || '';
            const cachedProfile = JSON.parse(localStorage.getItem('userProfile') || '{}');
            
            const formData = {
                name: document.getElementById('student-name').value,
                email: document.getElementById('student-email').value,
                class: className,  // Set class at root level
                profile: {
                    ...(cachedProfile.profile || {}), // Include existing profile data
                    grade: document.getElementById('student-grade').value || '',
                    class: className  // Ensure class is set in profile
                }
            };
            
            console.log('Submitting profile update with data:', {
                rootClass: className,
                profileClass: formData.profile.class,
                fullPayload: formData
            });
            
            try {
                const response = await fetch('http://localhost:5000/api/students/profile', {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify(formData)
                });
                
                console.log('Profile update response status:', response.status);
                const data = await response.json();
                console.log('Profile update response data:', data);
                
                if (!response.ok) {
                    throw new Error(data.message || 'Failed to update profile');
                }
                
                // Update the cached profile
                const cachedProfile = JSON.parse(localStorage.getItem('userProfile') || '{}');
                const updatedProfile = { ...cachedProfile, ...formData };
                localStorage.setItem('userProfile', JSON.stringify(updatedProfile));
                
                // Show success message
                showMessage('Profile updated successfully!', 'success');
                
            } catch (error) {
                console.error('Error updating profile:', error);
                showMessage(error.message || 'Failed to update profile', 'error');
            }
        });
    }
    
    // Handle photo upload
    const photoUpload = document.getElementById('photo-upload');
    const changePhotoBtn = document.getElementById('change-photo-btn');
    
    if (changePhotoBtn && photoUpload) {
        changePhotoBtn.addEventListener('click', (e) => {
            e.preventDefault();
            photoUpload.click();
        });
        
        photoUpload.addEventListener('change', async (e) => {
            const file = e.target.files[0];
            if (!file) return;
            
            const token = localStorage.getItem('token');
            if (!token) {
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
                
                if (!response.ok) {
                    throw new Error(data.message || 'Failed to upload photo');
                }
                
                // Update the profile photo
                const profilePhoto = document.getElementById('profile-photo');
                profilePhoto.src = data.photoUrl;
                
                // Update the cached profile
                const cachedProfile = JSON.parse(localStorage.getItem('userProfile') || '{}');
                if (!cachedProfile.profile) cachedProfile.profile = {};
                cachedProfile.profile.photo = data.photoUrl;
                localStorage.setItem('userProfile', JSON.stringify(cachedProfile));
                
                showMessage('Profile photo updated successfully!', 'success');
                
            } catch (error) {
                console.error('Error uploading photo:', error);
                showMessage(error.message || 'Failed to upload photo', 'error');
            }
        });
    }
    
    // Helper function to show messages
    function showMessage(message, type = 'success') {
        const messageDiv = document.getElementById('message');
        if (messageDiv) {
            messageDiv.textContent = message;
            messageDiv.className = type === 'success' ? 'success-message' : 'error-message';
            messageDiv.style.display = 'block';
            
            // Auto-hide after 5 seconds
            setTimeout(() => {
                messageDiv.style.display = 'none';
            }, 5000);
        }
    }

    // ✅ Fetch Assignments
    async function fetchAssignments() {
        const token = localStorage.getItem("token");
        console.log("Token from localStorage:", token);

        if (!token) {
            console.error("No token found. Redirecting to login...");
            window.location.href = "login.html";
            return;
        }

        try {
            const response = await fetch("http://localhost:5000/api/assignments", {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}` // ✅ Consistent with backend
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }

            const assignments = await response.json();
            console.log("✅ Assignments received:", assignments);

            const assignmentList = document.getElementById("assignment-list");
            if (!assignmentList) return; // 🔒 prevent null crash

            assignmentList.innerHTML = "";

            if (assignments.length === 0) {
                assignmentList.innerHTML = "<p>No assignments yet.</p>";
                return;
            }

            assignments.forEach(assignment => {
                const div = document.createElement("div");
                div.classList.add("assignment-item");
                div.innerHTML = `
                    <h4>${assignment.title}</h4>
                    <p>Due: ${new Date(assignment.dueDate).toLocaleDateString()}</p>
                `;
                assignmentList.appendChild(div);
            });

        } catch (error) {
            console.error("Failed to fetch assignments:", error);
        }
    }

    // ✅ Fetch Announcements for Students
    async function fetchAnnouncements() {
      const token = localStorage.getItem("token");

      if (!token) {
        console.error("No token found. Redirecting to login...");
        window.location.href = "login.html"; // Redirect to login page
        return;
      }

      try {
        // Make GET request to fetch announcements
        const response = await fetch("http://localhost:5000/api/announcements", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}` // Send the token for authorization
          }
        });

        // If the response is not ok (e.g., 4xx, 5xx error), throw an error
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }

        // Parse the response body as JSON
        const announcements = await response.json();
        console.log("📢 Announcements received:", announcements);

        // Get the list element where we want to display the announcements
        const announcementList = document.querySelector('#announcements ul');
        if (!announcementList) return; // If the element is not found, stop further execution

        // Clear any existing announcements before appending new ones
        announcementList.innerHTML = "";

        // If no announcements are available, show a message
        if (announcements.length === 0) {
          announcementList.innerHTML = "<p>No announcements yet.</p>";
          return;
        }

        // Loop through the announcements and create HTML elements to display them
        announcements.forEach(announcement => {
          const li = document.createElement("li");
          li.classList.add("announcement-item");
          li.innerHTML = `
            <strong>${announcement.text}</strong>
            <small>Posted on: ${new Date(announcement.createdAt).toLocaleString()}</small>
          `;
          // Append each announcement to the list
          announcementList.appendChild(li);
        });

      } catch (error) {
        // Catch and log any errors
        console.error("Failed to fetch announcements:", error);
      }
    }

    // Fetch and display downloadable resources for students
    async function fetchResources() {
      const token = localStorage.getItem("token");

      if (!token) {
        console.error("No token found. Redirecting to login...");
        window.location.href = "login.html";
        return;
      }

      try {
        const response = await fetch("http://localhost:5000/api/resources", {
          method: "GET",
          headers: {
            "Authorization": `Bearer ${token}`
          }
        });

        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const data = await response.json();
        console.log("Resources received:", data);

        const resourceList = document.querySelector('#resources-list ul');
        if (!resourceList) return;

        resourceList.innerHTML = "";

        if (!data.resources || data.resources.length === 0) {
          resourceList.innerHTML = "<li>No resources available.</li>";
          return;
        }

        data.resources.forEach(resource => {
          const li = document.createElement("li");
          const link = document.createElement("a");

          link.href = `http://localhost:5000/uploads/resources/${resource.path}`;
          link.textContent = resource.name;
          link.setAttribute('download', resource.name);

          li.appendChild(link);
          resourceList.appendChild(li);
        });

      } catch (error) {
        console.error("Failed to fetch resources:", error);
      }
    }

    // Fetch and display fee records for the student
    async function fetchFeeRecords() {
        try {
            console.log('Fetching fee records...');
            
            // Show loading state
            document.getElementById('fees-loading').style.display = 'block';
            document.getElementById('no-fees').style.display = 'none';
            document.getElementById('fees-table').style.display = 'none';
            
            const token = localStorage.getItem('token');
            if (!token) {
                window.location.href = '/login.html';
                return;
            }
            
            // Get the student ID from the profile
            const studentId = document.getElementById('student-name')?.dataset?.studentId;
            if (!studentId) {
                throw new Error('Student ID not found');
            }
            
            // Fetch all fees with payments included
            const response = await fetch(`http://localhost:5000/api/fees?populate=payments`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                }
            });
            
            if (!response.ok) {
                const errorText = await response.text();
                console.error('Error response:', errorText);
                let errorMessage = 'Failed to fetch fee records';
                
                try {
                    const errorData = JSON.parse(errorText);
                    errorMessage = errorData.message || errorMessage;
                } catch (e) {
                    errorMessage = errorText || errorMessage;
                }
                
                throw new Error(errorMessage);
            }
            
            const allFees = await response.json();
            console.log(`Fetched ${allFees.length} fee records from API`);
            
            // Filter fees for the current student
            const studentFees = allFees.filter(fee => {
                // Handle both populated student objects and student IDs
                const feeStudentId = fee.student?._id || fee.student;
                return feeStudentId && feeStudentId.toString() === studentId;
            });
            
            console.log(`Found ${studentFees.length} fee records for student ${studentId}`);
            
            // Debug: Log sample fee records with payments
            if (studentFees.length > 0) {
                console.log('=== SAMPLE FEE RECORDS WITH PAYMENTS ===');
                studentFees.slice(0, 3).forEach((fee, index) => {
                    console.log(`Record ${index + 1}:`, {
                        id: fee._id,
                        student: fee.student,
                        academicYear: fee.academicYear,
                        academicTerm: fee.academicTerm,
                        term: fee.term,
                        payments: fee.payments ? `Array(${fee.payments.length})` : 'None',
                        allFields: Object.keys(fee)
                    });
                    
                    // Log payments if they exist
                    if (fee.payments && fee.payments.length > 0) {
                        console.log(`Payments for ${fee._id}:`, fee.payments);
                    }
                });
            }
            
            // Render the fee records
            renderFeeRecords(studentFees);
            
        } catch (error) {
            console.error('Error fetching fee records:', error);
            showMessage(`Error: ${error.message}`, 'error');
            
            // Show error state
            document.getElementById('fees-loading').style.display = 'none';
            document.getElementById('no-fees').style.display = 'block';
            document.getElementById('no-fees').innerHTML = `
                <i class="bi bi-exclamation-triangle" style="font-size: 3rem; color: #dc3545;"></i>
                <h4 class="mt-3">Failed to Load Fee Records</h4>
                <p class="text-muted">${error.message || 'Please try again later'}</p>
            `;
        }
    }

    // Render fee records in the table
    function renderFeeRecords(fees) {
        const tbody = document.getElementById('fees-table-body');
        if (!tbody) {
            console.error('Fees table body not found');
            return;
        }
        
        tbody.innerHTML = ''; // Clear existing rows
        
        if (!fees || fees.length === 0) {
            // Show no records message
            console.log('No fee records to display');
            document.getElementById('fees-loading').style.display = 'none';
            document.getElementById('no-fees').style.display = 'block';
            document.getElementById('fees-table').style.display = 'none';
            return;
        }
        
        console.log(`Rendering ${fees.length} fee records`);
        
        // Process and render each fee record
        fees.forEach((fee, index) => {
            try {
                const totalAmount = parseFloat(fee.totalAmount || fee.amount || 0);
                const paidAmount = parseFloat(fee.paidAmount || 0);
                const balance = Math.max(0, totalAmount - paidAmount);
                
                const status = balance <= 0 ? 'Paid' : 'Pending';
                const statusClass = balance <= 0 ? 'success' : 'warning';
                
                // Debug: Log the raw fee object
                console.log(`Fee record ${index + 1}:`, {
                    id: fee._id,
                    academicYear: fee.academicYear,
                    academicTerm: fee.academicTerm,
                    term: fee.term,
                    amount: fee.amount,
                    totalAmount: fee.totalAmount,
                    paidAmount: fee.paidAmount,
                    allFields: Object.keys(fee)
                });
                
                // Get academic info with better fallbacks
                let academicYear = 'N/A';
                let academicTerm = 'N/A';
                
                // Check for academicYear in various possible locations
                if (fee.academicYear) {
                    academicYear = fee.academicYear;
                } else if (fee.termData?.academicYear) {
                    academicYear = fee.termData.academicYear;
                } else if (fee.year) {
                    academicYear = fee.year;
                }
                
                // Check for academicTerm in various possible locations
                if (fee.academicTerm) {
                    academicTerm = fee.academicTerm;
                } else if (fee.termData?.term) {
                    academicTerm = fee.termData.term;
                } else if (fee.term) {
                    academicTerm = fee.term;
                }
                
                console.log(`Processed academic info for record ${index + 1}:`, { academicYear, academicTerm });
                
                const row = document.createElement('tr');
                row.setAttribute('data-fee-id', fee._id); // Add fee ID as data attribute
                row.innerHTML = `
                    <td>${fee.feeType || 'School Fees'}</td>
                    <td>${academicYear}</td>
                    <td>${academicTerm}</td>
                    <td class="text-end">${formatCurrency(totalAmount)}</td>
                    <td class="text-end">${formatCurrency(paidAmount)}</td>
                    <td class="text-end">${formatCurrency(balance)}</td>
                    <td><span class="badge bg-${statusClass}">${status}</span></td>
                    <td>
                        <button class="btn btn-sm btn-outline-primary view-payments" data-fee-id="${fee._id}">
                            <i class="bi bi-list-ul"></i> View Payments
                        </button>
                    </td>
                `;
                
                // Add event listener for view payments button
                const viewBtn = row.querySelector('.view-payments');
                if (viewBtn) {
                    viewBtn.addEventListener('click', (e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        console.log('View payments for fee:', fee._id);
                        showPaymentHistory(fee, e);
                    });
                }
                
                tbody.appendChild(row);
            } catch (error) {
                console.error(`Error rendering fee record ${fee?._id || 'unknown'}:`, error);
            }
        });
        
        // Show the table
        document.getElementById('fees-loading').style.display = 'none';
        document.getElementById('no-fees').style.display = 'none';
        document.getElementById('fees-table').style.display = 'table';
    }

        // Helper function to show the modal
    function showModal(modal) {
        // Move modal to body to avoid parent element issues
        if (modal.parentElement !== document.body) {
            document.body.appendChild(modal);
        }
        
        // Set modal styles
        Object.assign(modal.style, {
            display: 'flex',
            visibility: 'visible',
            opacity: '1',
            zIndex: '9999',
            position: 'fixed',
            top: '0',
            left: '0',
            right: '0',
            bottom: '0',
            width: '100%',
            height: '100%',
            backgroundColor: 'rgba(0,0,0,0.7)',
            justifyContent: 'center',
            alignItems: 'center',
            border: '5px solid red !important',
            margin: '0',
            padding: '0'
        });
        
        document.body.style.overflow = 'hidden';
        modal.classList.add('show');
        
        console.log('Modal shown with styles:', {
            display: modal.style.display,
            visibility: modal.style.visibility,
            opacity: modal.style.opacity,
            zIndex: modal.style.zIndex,
            position: modal.style.position
        });
    }

    // Helper function to hide the modal
    function hideModal(modal) {
        modal.classList.remove('show');
        setTimeout(() => {
            modal.style.display = 'none';
            document.body.style.overflow = '';
        }, 300);
    }

    // Track modal state
    let isModalOpen = false;
    let currentModal = null;
    
    // Clean up any existing modals
    function cleanupExistingModals() {
        const existingModals = document.querySelectorAll('#customPaymentModal');
        existingModals.forEach(modal => {
            if (modal.parentNode) {
                modal.parentNode.removeChild(modal);
            }
        });
        isModalOpen = false;
        currentModal = null;
    }
    
    // Show payment history for a specific fee
    async function showPaymentHistory(fee, event) {
        try {
            if (event) {
                event.preventDefault();
                event.stopPropagation();
                event.stopImmediatePropagation();
            }
            
            // Prevent multiple clicks while modal is opening
            if (isModalOpen) {
                console.log('Modal is already open, ignoring additional click');
                return;
            }
            
            console.log('=== showPaymentHistory called ===');
            console.log('Fee ID:', fee._id);
            console.log('Fee object:', fee);
            
            // Get or create modal elements
            let modal = document.getElementById('customPaymentModal');
            
            // Clean up any existing modals first
            cleanupExistingModals();
            
            // Create a new modal instance
            modal = null;
            
            // Always create a new modal instance
            {
                console.log('Creating new modal instance...');
                modal = document.createElement('div');
                modal.id = 'customPaymentModal';
                modal.className = 'custom-modal';
                modal.style.display = 'none';
                modal.style.position = 'fixed';
                modal.style.zIndex = '9999';
                modal.style.top = '0';
                modal.style.left = '0';
                modal.style.width = '100%';
                modal.style.height = '100%';
                modal.style.backgroundColor = 'rgba(0,0,0,0.7)';
                modal.style.justifyContent = 'center';
                modal.style.alignItems = 'center';
                modal.style.overflow = 'auto';
                
                modal.innerHTML = `
                    <div class="custom-modal-content" style="background: white; padding: 20px; border-radius: 8px; width: 90%; max-width: 800px; max-height: 80vh; overflow-y: auto; position: relative;">
                        <div class="custom-modal-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px; padding-bottom: 10px; border-bottom: 1px solid #eee;">
                            <h3 class="custom-modal-title" style="margin: 0;">Payment History</h3>
                            <span class="custom-close" style="font-size: 24px; cursor: pointer; font-weight: bold;">&times;</span>
                        </div>
                        <div class="custom-modal-body">
                            <div class="table-responsive">
                                <table class="table" style="width: 100%; border-collapse: collapse;">
                                    <thead>
                                        <tr>
                                            <th style="padding: 8px; text-align: left; border-bottom: 1px solid #ddd;">Date</th>
                                            <th style="padding: 8px; text-align: right; border-bottom: 1px solid #ddd;">Amount</th>
                                            <th style="padding: 8px; text-align: left; border-bottom: 1px solid #ddd;">Payment Method</th>
                                            <th style="padding: 8px; text-align: left; border-bottom: 1px solid #ddd;">Reference</th>
                                            <th style="padding: 8px; text-align: left; border-bottom: 1px solid #ddd;">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody id="paymentHistoryBody" style="display: table-row-group;">
                                        <!-- Payment history will be populated here -->
                                    </tbody>
                                </table>
                            </div>
                        </div>
                        <div class="custom-modal-footer" style="margin-top: 15px; padding-top: 10px; border-top: 1px solid #eee; text-align: right;">
                            <button type="button" class="btn btn-secondary" id="closePaymentModal" style="padding: 5px 15px; border: none; border-radius: 4px; cursor: pointer;">Close</button>
                        </div>
                    </div>
                `;
                document.body.appendChild(modal);
            }
            
            // Get or create modal elements
            let modalContent = modal.querySelector('.custom-modal-content');
            let modalTitle = modal.querySelector('.custom-modal-title');
            let tbody = modal.querySelector('#paymentHistoryBody');
            
            // If any required elements are missing, recreate the modal content
            if (!modalContent || !modalTitle || !tbody) {
                console.log('Recreating modal content elements...');
                
                // Create new content
                const newContent = document.createElement('div');
                newContent.className = 'custom-modal-content';
                newContent.style.cssText = 'background: white; padding: 20px; border-radius: 8px; width: 90%; max-width: 800px; max-height: 80vh; overflow-y: auto; position: relative;';
                
                newContent.innerHTML = `
                    <div class="custom-modal-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px; padding-bottom: 10px; border-bottom: 1px solid #eee;">
                        <h3 class="custom-modal-title" style="margin: 0;">Payment History</h3>
                        <span class="custom-close" style="font-size: 24px; cursor: pointer; font-weight: bold;">&times;</span>
                    </div>
                    <div class="custom-modal-body">
                        <div class="table-responsive">
                            <table class="table" style="width: 100%; border-collapse: collapse;">
                                <thead>
                                    <tr>
                                        <th style="padding: 8px; text-align: left; border-bottom: 1px solid #ddd;">Date</th>
                                        <th style="padding: 8px; text-align: right; border-bottom: 1px solid #ddd;">Amount</th>
                                        <th style="padding: 8px; text-align: left; border-bottom: 1px solid #ddd;">Payment Method</th>
                                        <th style="padding: 8px; text-align: left; border-bottom: 1px solid #ddd;">Reference</th>
                                        <th style="padding: 8px; text-align: left; border-bottom: 1px solid #ddd;">Status</th>
                                    </tr>
                                </thead>
                                <tbody id="paymentHistoryBody" style="display: table-row-group;">
                                    <!-- Payment history will be populated here -->
                                </tbody>
                            </table>
                        </div>
                    </div>
                    <div class="custom-modal-footer" style="margin-top: 15px; padding-top: 10px; border-top: 1px solid #eee; text-align: right;">
                        <button type="button" class="btn btn-secondary" id="closePaymentModal" style="padding: 5px 15px; border: none; border-radius: 4px; cursor: pointer;">Close</button>
                    </div>
                `;
                
                // Replace the content
                if (modal.firstChild) {
                    modal.removeChild(modal.firstChild);
                }
                modal.appendChild(newContent);
                
                // Update references
                modalContent = modal.querySelector('.custom-modal-content');
                modalTitle = modal.querySelector('.custom-modal-title');
                tbody = modal.querySelector('#paymentHistoryBody');
                
                if (!modalContent || !modalTitle || !tbody) {
                    console.error('Failed to create modal elements');
                    return;
                }
            }
            
            // Set modal title
            if (modalTitle) {
                modalTitle.textContent = `Payment History - ${fee.feeType || 'Fee Record'}`;
            }
            
            // Show loading state
            tbody.innerHTML = `
                <tr>
                    <td colspan="5" class="text-center py-4">
                        <div class="spinner-border text-primary" role="status">
                            <span class="visually-hidden">Loading...</span>
                        </div>
                        <p class="mt-2 mb-0">Loading payment history...</p>
                    </td>
                </tr>
            `;
            
            // Move modal to body to avoid parent element issues
            if (modal.parentElement !== document.body) {
                document.body.appendChild(modal);
            }
            
            // Set up modal styles but keep it hidden for now
            Object.assign(modal.style, {
                display: 'none', // Start hidden
                visibility: 'visible',
                opacity: '1',
                zIndex: '9999',
                position: 'fixed',
                top: '0',
                left: '0',
                right: '0',
                bottom: '0',
                width: '100%',
                height: '100%',
                backgroundColor: 'rgba(0,0,0,0.7)',
                justifyContent: 'center',
                alignItems: 'center',
                border: '5px solid red !important',
                margin: '0',
                padding: '0'
            });
            
            // Ensure modal is on top of everything
            modal.style.setProperty('z-index', '9999', 'important');
            
            // Show the modal after a small delay to ensure styles are applied
            setTimeout(() => {
                modal.style.display = 'flex';
                document.body.style.overflow = 'hidden';
                modal.classList.add('show');
                
                console.log('Modal state after show:', {
                    display: modal.style.display,
                    visibility: modal.style.visibility,
                    opacity: modal.style.opacity,
                    zIndex: modal.style.zIndex,
                    position: modal.style.position,
                    classList: Array.from(modal.classList)
                });
            }, 50);
            
            // Check if any parent elements are hiding the modal
            const checkParents = (el) => {
                let current = el.parentElement;
                while (current) {
                    const style = window.getComputedStyle(current);
                    if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') {
                        console.warn('Parent element is hiding the modal:', current, {
                            display: style.display,
                            visibility: style.visibility,
                            opacity: style.opacity
                        });
                    }
                    current = current.parentElement;
                }
            };
            
            checkParents(modal);
            console.log('Modal should now be visible with a red border');
            
            // Simple close function that just removes the modal
            const closeModal = () => {
                console.log('Closing modal...');
                const modal = document.getElementById('customPaymentModal');
                if (modal) {
                    modal.style.display = 'none';
                    modal.remove();
                }
                document.body.style.overflow = '';
                isModalOpen = false;
                currentModal = null;
            };
            
            // Add direct event listeners
            setTimeout(() => {
                // Close on X button click
                const closeBtn = modal.querySelector('.custom-close');
                if (closeBtn) {
                    closeBtn.onclick = closeModal;
                }
                
                // Close on Close button click
                const closeModalBtn = modal.querySelector('#closePaymentModal');
                if (closeModalBtn) {
                    closeModalBtn.onclick = closeModal;
                }
                
                // Close on outside click
                modal.onclick = function(e) {
                    if (e.target === modal) {
                        closeModal();
                    }
                };
                
                // Close on Escape key
                document.onkeydown = function(e) {
                    if (e.key === 'Escape') {
                        closeModal();
                    }
                };
                
                // Prevent clicks inside modal from closing it
                const modalContent = modal.querySelector('.custom-modal-content');
                if (modalContent) {
                    modalContent.onclick = function(e) {
                        e.stopPropagation();
                    };
                }
            }, 0);
            
            // Set modal state
            isModalOpen = true;
            currentModal = modal;
            
            // Show loading state
            tbody.innerHTML = `
                <tr>
                    <td colspan="5" class="text-center py-4">
                        <div class="spinner-border text-primary" role="status">
                            <span class="visually-hidden">Loading...</span>
                        </div>
                        <p class="mt-2 mb-0">Loading payment history...</p>
                    </td>
                </tr>
            `;
            
            // Ensure we only have one modal in the DOM
            cleanupExistingModals();
            document.body.appendChild(modal);
            
            // Make sure modal is visible
            Object.assign(modal.style, {
                display: 'flex',
                visibility: 'visible',
                opacity: '1',
                zIndex: '9999',
                position: 'fixed',
                top: '0',
                left: '0',
                right: '0',
                bottom: '0',
                width: '100%',
                height: '100%',
                backgroundColor: 'rgba(0,0,0,0.7)',
                justifyContent: 'center',
                alignItems: 'center',
                border: '5px solid red !important',
                margin: '0',
                padding: '0'
            });
            
            document.body.style.overflow = 'hidden';
            
            // Force reflow to ensure the modal is visible
            void modal.offsetHeight;
            
            // Add show class for animations
            modal.classList.add('show');
            
            // Debug log
            console.log('Modal shown with styles:', {
                display: modal.style.display,
                visibility: modal.style.visibility,
                opacity: modal.style.opacity,
                zIndex: modal.style.zIndex,
                position: modal.style.position,
                classList: Array.from(modal.classList)
            });
            
            try {
                // First, get all fees with payments included
                const token = localStorage.getItem('token');
                if (!token) {
                    window.location.href = '/login.html';
                    return;
                }
                
                const response = await fetch(`http://localhost:5000/api/fees?populate=payments`, {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json',
                        'Accept': 'application/json'
                    }
                });
                
                if (!response.ok) {
                    const errorText = await response.text();
                    console.error('Error response:', errorText);
                    throw new Error(`Failed to fetch fee records: ${response.status}`);
                }
                
                const allFees = await response.json();
                console.log('All fees with payments:', allFees);
                
                // Find the specific fee we're looking for
                const feeDetails = allFees.find(f => f._id === fee._id);
                
                if (!feeDetails) {
                    throw new Error('Fee record not found');
                }
                
                console.log('Found fee details:', feeDetails);
                
                // Clear loading state
                tbody.innerHTML = '';
                
                // Check if we have payments in the response
                const payments = feeDetails.payments || [];
                
                if (payments.length === 0) {
                    tbody.innerHTML = `
                        <tr>
                            <td colspan="5" class="text-center py-4">
                                No payment history found for this fee.
                                ${fee.paidAmount > 0 ? 
                                    `<p class="text-muted mt-2">Total paid: KES ${fee.paidAmount?.toLocaleString() || '0.00'}</p>` 
                                    : ''
                                }
                            </td>
                        </tr>
                    `;
                    return;
                }
                
                // Display payments and calculate total
                console.log('Payment records:', payments);
                let totalPaid = 0;
                payments.forEach((payment, index) => {
                    console.log(`Payment ${index + 1}:`, payment);
                    const row = document.createElement('tr');
                    const paymentDate = payment.paymentDate || payment.date || new Date().toISOString();
                    
                    // Add to total
                    const amount = parseFloat(payment.amount) || 0;
                    totalPaid += amount;
                    console.log(`Payment amount: ${amount}, Running total: ${totalPaid}`);
                    
                    row.innerHTML = `
                        <td style="padding: 8px; border-bottom: 1px solid #eee;">
                            ${new Date(paymentDate).toLocaleDateString()}
                        </td>
                        <td style="padding: 8px; border-bottom: 1px solid #eee;">
                            KES ${amount.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                        </td>
                        <td style="padding: 8px; border-bottom: 1px solid #eee;">
                            ${payment.paymentMethod || 'Not specified'}
                        </td>
                        <td style="padding: 8px; border-bottom: 1px solid #eee;">
                            ${payment.receiptNumber || 'N/A'}
                        </td>
                        <td style="padding: 8px; border-bottom: 1px solid #eee;">
                            ${payment.notes || ''}
                        </td>
                    `;
                    tbody.appendChild(row);
                });
                
                console.log('Final total paid:', totalPaid);
                
                // Add total and balance rows
                if (payments.length > 0) {
                    console.log('Adding total row with amount:', totalPaid);
                    // Total Paid row
                    const totalRow = document.createElement('tr');
                    totalRow.className = 'table-active';
                    totalRow.style.fontWeight = 'bold';
                    totalRow.innerHTML = `
                        <td colspan="3" style="padding: 12px 8px; text-align: right; border-top: 2px solid #333;">
                            Total Paid:
                        </td>
                        <td colspan="2" style="padding: 12px 8px; text-align: left; border-top: 2px solid #333;">
                            KES ${totalPaid.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                        </td>
                    `;
                    tbody.appendChild(totalRow);
                    
                    // Balance Due row if applicable
                    if (fee.amount && totalPaid < fee.amount) {
                        const balanceRow = document.createElement('tr');
                        balanceRow.className = 'table-warning';
                        const balance = fee.amount - totalPaid;
                        balanceRow.innerHTML = `
                            <td colspan="3" style="padding: 8px; text-align: right; border-top: 1px solid #eee;">
                                <span class="text-danger">Balance Due:</span>
                            </td>
                            <td colspan="2" style="padding: 8px; text-align: left; border-top: 1px solid #eee;" class="text-danger">
                                KES ${balance.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                            </td>
                        `;
                        tbody.appendChild(balanceRow);
                    }
                }
                
            } catch (error) {
                console.error('Error loading payment history:', error);
                tbody.innerHTML = `
                    <tr>
                        <td colspan="5" class="text-center text-danger py-4">
                            <i class="bi bi-exclamation-triangle-fill"></i>
                            <p class="mt-2 mb-0">Error loading payment history. Please try again.</p>
                            <small>${error.message}</small>
                        </td>
                    </tr>
                `;
            }
            
        } catch (error) {
            console.error('Error in showPaymentHistory:', error);
            // Show error message to user if needed
            const tbody = document.getElementById('paymentHistoryBody');
            if (tbody) {
                tbody.innerHTML = `
                    <tr>
                        <td colspan="5" class="text-center text-danger py-4">
                            <i class="bi bi-exclamation-triangle-fill"></i>
                            <p class="mt-2 mb-0">An error occurred. Please refresh the page and try again.</p>
                        </td>
                    </tr>
                `;
            }
        }
        
        // Close when clicking outside the modal content
        // This is already handled by the modal.onclick handler above
        // So we can remove this duplicate code
        
        // Add a small delay to ensure modal is shown before proceeding
        setTimeout(() => {
            // Process and display the payment history
            displayPaymentHistory(fee, paymentHistoryBody);
        }, 100);
    }
    
    // Helper function to display payment history
    function displayPaymentHistory(fee, paymentHistoryBody) {
        try {
            
            // Check if we have payments data
            if (!fee.payments || fee.payments.length === 0) {
                paymentHistoryBody.innerHTML = `
                    <tr>
                        <td colspan="5" class="text-center text-muted py-3">
                            <i class="bi bi-info-circle" style="font-size: 2rem;"></i>
                            <p class="mt-2 mb-0">No payment history available</p>
                        </td>
                    </tr>
                `;
                return;
            }
            
            // Sort payments by date (newest first)
            const sortedPayments = [...fee.payments].sort((a, b) => 
                new Date(b.paymentDate || b.createdAt) - new Date(a.paymentDate || a.createdAt)
            );
            
            // Clear previous content
            paymentHistoryBody.innerHTML = '';
            
            // Add each payment to the table
            sortedPayments.forEach((payment, index) => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${formatDate(payment.paymentDate || payment.createdAt)}</td>
                    <td>${payment.reference || 'N/A'}</td>
                    <td>${payment.paymentMethod || 'Cash'}</td>
                    <td class="text-end">${formatCurrency(payment.amount)}</td>
                    <td>${payment.notes || ''}</td>
                `;
                paymentHistoryBody.appendChild(row);
            });
            
        } catch (error) {
            console.error('Error showing payment history:', error);
            
            // Update UI to show error
            const paymentHistoryBody = document.getElementById('payment-history-body');
            if (paymentHistoryBody) {
                paymentHistoryBody.innerHTML = `
                    <tr>
                        <td colspan="5" class="text-center text-danger py-3">
                            <i class="bi bi-exclamation-triangle" style="font-size: 2rem;"></i>
                            <p class="mt-2 mb-0">Failed to load payment history</p>
                            <small class="text-muted">${error.message || 'Please try again'}</small>
                        </td>
                    </tr>
                `;
            }
            
            // Show error in the modal if it was created, otherwise show as a toast
            if (modal && typeof modal.show === 'function') {
                // Error is already shown in the modal
            } else {
                showMessage(`Error: ${error.message}`, 'error');
            }
        }
    }

    // Format date for display
    function formatDate(dateString) {
        if (!dateString) return 'N/A';
        
        const options = { 
            year: 'numeric', 
            month: 'short', 
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        };
        
        return new Date(dateString).toLocaleDateString('en-US', options);
    }

    // Format currency for display
    function formatCurrency(amount) {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'KES',
            minimumFractionDigits: 2
        }).format(amount || 0);
    }

    // Fetch and display homeworks for students with improved UI/UX
    window.fetchHomeworks = async function() {
        console.log('Fetching homeworks...');
        const homeworkList = document.getElementById("homework-list");
        
        if (!homeworkList) {
            console.error('Homework list container not found');
            return;
        }

        // Show loading state
        homeworkList.innerHTML = `
            <div class="loading-spinner">
                <div class="spinner"></div>
                <p>Loading homeworks...</p>
            </div>
        `;
        
        try {
            const token = localStorage.getItem("token");
            if (!token) throw new Error("No authentication token found");

            const response = await fetch("http://localhost:5000/api/homeworks", {
                headers: {
                    "Authorization": `Bearer ${token}`,
                    'Accept': 'application/json'
                }
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || 'Failed to fetch homeworks');
            }

            homeworkData = await response.json();
            console.log('Received homeworks:', homeworkData);
            
            renderHomeworkList(homeworkData);
            
        } catch (error) {
            console.error("Error fetching homeworks:", error);
            homeworkList.innerHTML = `
                <div class="error-message">
                    <i class="bi bi-exclamation-triangle-fill"></i>
                    <p>${error.message || 'Failed to load homeworks. Please try again later.'}</p>
                    <button onclick="fetchHomeworks()" class="retry-btn">
                        <i class="bi bi-arrow-clockwise"></i> Retry
                    </button>
                </div>
            `;
        }
    }


    // Render the homework list
    function renderHomeworkList(homeworks) {
        const homeworkList = document.getElementById("homework-list");
        if (!homeworkList) return;

        if (!homeworks || homeworks.length === 0) {
            homeworkList.innerHTML = `
                <div class="no-homeworks">
                    <i class="bi bi-emoji-smile"></i>
                    <p>No homeworks assigned to your class yet.</p>
                </div>
            `;
            return;
        }

        // Get current user's ID from localStorage
        const userProfile = JSON.parse(localStorage.getItem('userProfile') || '{}');
        const currentUserId = userProfile._id;

        // Sort by due date (soonest first)
        const sortedHomeworks = [...homeworks].sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));
        
        homeworkList.innerHTML = sortedHomeworks.map(homework => {
            const dueDate = new Date(homework.dueDate);
            const now = new Date();
            const isPastDue = dueDate < now;
            
            // Find the current user's submission
            const submission = Array.isArray(homework.submissions) 
                ? homework.submissions.find(sub => sub.student === currentUserId || 
                                                 (typeof sub.student === 'object' && sub.student._id === currentUserId))
                : null;
                
            const isSubmitted = !!submission;
            const isGraded = isSubmitted && submission.grade !== undefined;
            
            return `
                <div class="homework-card ${isPastDue ? 'past-due' : ''} ${isSubmitted ? 'submitted' : ''}">
                    <div class="homework-header">
                        <h3>${homework.title}</h3>
                        <span class="due-date ${isPastDue ? 'overdue' : ''}">
                            <i class="bi bi-calendar-check"></i>
                            Due: ${dueDate.toLocaleDateString()} ${dueDate.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                            ${isPastDue ? ' (Overdue)' : ''}
                        </span>
                    </div>
                    
                    <div class="homework-details">
                        <p class="description">${homework.description || 'No description provided.'}</p>
                        
                        ${homework.file ? `
                            <div class="homework-file">
                                <i class="bi bi-paperclip"></i>
                                <a href="http://localhost:5000${homework.file}" target="_blank" class="file-link">
                                    ${homework.file.split('/').pop()}
                                </a>
                            </div>
                        ` : ''}
                        
                        <div class="submission-status">
                            ${isSubmitted ? `
                                <div class="status-badge submitted">
                                    <i class="bi bi-check-circle-fill"></i> Submitted
                                    ${isGraded ? `
                                        <span class="grade-badge">${submission.grade}</span>
                                    ` : ''}
                                </div>
                                ${isGraded && submission.comments ? `
                                    <div class="teacher-comments">
                                        <strong>Teacher's Comments:</strong>
                                        <p>${submission.comments}</p>
                                    </div>
                                ` : ''}
                            ` : `
                                <div class="status-badge not-submitted">
                                    <i class="bi bi-exclamation-circle-fill"></i> Not Submitted
                                </div>
                            `}
                        </div>
                    </div>
                    
                    <div class="homework-actions">
                        ${!isSubmitted ? `
                            <button class="btn btn-primary submit-homework-btn" 
                                    data-homework-id="${homework._id}">
                                <i class="bi bi-upload"></i> Submit Work
                            </button>
                        ` : `
                            <button class="btn btn-outline-secondary view-submission-btn" 
                                    onclick="viewSubmission('${homework._id}')">
                                <i class="bi bi-eye"></i> View Submission
                            </button>
                        `}
                        
                        ${homework.file ? `
                            <a href="http://localhost:5000${homework.file}" 
                               class="btn btn-outline-primary" 
                               target="_blank">
                                <i class="bi bi-download"></i> Download
                            </a>
                        ` : ''}
                    </div>
                </div>
            `;
        }).join('');
    }
    
    // Show submission modal
    function showSubmissionModal(homework) {
        const modal = document.getElementById('submissionModal');
        if (!modal) {
            console.error('Modal element not found');
            return;
        }
        
        try {
            // Set homework ID in the form
            const homeworkIdInput = document.getElementById('homeworkId');
            if (homeworkIdInput) {
                homeworkIdInput.value = homework._id;
            } else {
                console.error('Homework ID input not found');
                return;
            }
            
            // Update modal title
            const modalTitle = document.querySelector('#submissionModal .modal-title');
            if (modalTitle) {
                modalTitle.textContent = `Submit: ${homework.title}`;
            }
            
            // Show the modal using both display and class
            modal.style.display = 'flex';
            modal.classList.add('show', 'active');
            document.body.classList.add('modal-open');
            
            // Add backdrop
            const backdrop = document.createElement('div');
            backdrop.className = 'modal-backdrop fade show';
            backdrop.id = 'submissionModalBackdrop';
            document.body.appendChild(backdrop);
            
            // Close modal when clicking outside
            backdrop.addEventListener('click', function closeModalOnBackdrop() {
                hideSubmissionModal();
                backdrop.removeEventListener('click', closeModalOnBackdrop);
            });
            
            console.log('Modal shown for homework:', homework._id);
        } catch (error) {
            console.error('Error showing submission modal:', error);
        }
    }
    
    // Hide submission modal
    function hideSubmissionModal() {
        const modal = document.getElementById('submissionModal');
        if (!modal) return;
        
        // Hide the modal
        modal.style.display = 'none';
        modal.classList.remove('show', 'active');
        document.body.classList.remove('modal-open');
        
        // Remove backdrop
        const backdrop = document.getElementById('submissionModalBackdrop');
        if (backdrop) {
            backdrop.remove();
        }
        
        // Reset form
        const form = document.getElementById('submissionForm');
        if (form) {
            form.reset();
        }
    }
    
    // Handle homework submission
    async function handleHomeworkSubmission(e) {
        e.preventDefault();
        
        const form = e.target;
        const formData = new FormData(form);
        const homeworkId = formData.get('homeworkId');
        const submitBtn = form.querySelector('button[type="submit"]');
        const originalBtnText = submitBtn.innerHTML;
        
        try {
            // Show loading state
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Submitting...';
            
            // Validate file
            const fileInput = form.querySelector('input[type="file"]');
            if (!fileInput.files || fileInput.files.length === 0) {
                throw new Error('Please select a file to upload');
            }
            
            const file = fileInput.files[0];
            const maxSize = 5 * 1024 * 1024; // 5MB
            if (file.size > maxSize) {
                throw new Error('File size must be less than 5MB');
            }
            
            const token = localStorage.getItem("token");
            if (!token) {
                window.location.href = 'login.html';
                return;
            }
            
            console.log('Submitting homework:', {
                homeworkId,
                file: file.name,
                size: file.size,
                type: file.type
            });
            
            const response = await fetch(`http://localhost:5000/api/homeworks/submit/${homeworkId}`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                    // Don't set Content-Type header - let the browser set it with the boundary
                },
                body: formData
            });
            
            console.log('Response status:', response.status);
            
            let result;
            try {
                result = await response.json();
                console.log('Response data:', result);
            } catch (jsonError) {
                console.error('Error parsing JSON response:', jsonError);
                throw new Error('Invalid response from server');
            }
            
            if (!response.ok) {
                throw new Error(result.error || result.message || 'Failed to submit homework');
            }
            
            // Show success message
            showMessage('Homework submitted successfully!', 'success');
            
            // Close modal and refresh the list
            hideSubmissionModal();
            await fetchHomeworks();
            
        } catch (error) {
            console.error('Error submitting homework:', error);
            showMessage(error.message || 'Failed to submit homework. Please try again.', 'error');
        } finally {
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalBtnText;
        }
    }
    
    // Add event listener for form submission
    const submissionForm = document.getElementById('submissionForm');
    if (submissionForm) {
        submissionForm.addEventListener('submit', handleHomeworkSubmission);
    }

    // Report cards functionality has been moved to student-report-cards.js
    async function fetchStudentReportCards() {
      console.log('Report cards functionality has been moved to student-report-cards.js');
      return [];
    }

    // Initialize refresh button for fee records
    const refreshFeesBtn = document.getElementById('refresh-fees');
    if (refreshFeesBtn) {
        refreshFeesBtn.addEventListener('click', fetchFeeRecords);
    }

    // ✅ Call fetch functions after safe checks
    fetchUserProfile();
    fetchAssignments();
    fetchAnnouncements(); 
    fetchResources();
    fetchHomeworks();
    fetchGrades();
    
    // Initialize payment history modal if it exists
    const paymentHistoryModalEl = document.getElementById('paymentHistoryModal');
    if (paymentHistoryModalEl) {
        // Store the modal instance in a more reliable way
        window.paymentHistoryModal = new bootstrap.Modal(paymentHistoryModalEl);
        
        // Add event listener for modal close to clear content
        paymentHistoryModalEl.addEventListener('hidden.bs.modal', function () {
            const modalBody = document.getElementById('payment-history-body');
            if (modalBody) {
                modalBody.innerHTML = '';
            }
        });
    }
});
