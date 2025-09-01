document.addEventListener('DOMContentLoaded', () => {
    // Switch between tabs
    const tabLinks = document.querySelectorAll('.tab-link');
    const tabSections = document.querySelectorAll('.tab-section');

    function switchTab(tabId) {
        // Hide all tab sections
        tabSections.forEach(section => section.style.display = 'none');
        // Show the selected tab
        const section = document.getElementById(tabId);
        if (section) {
            section.style.display = 'block';
        }
    }

    // Add event listeners to each tab link
    if (tabLinks) {
        tabLinks.forEach(link => {
            link.addEventListener('click', (event) => {
                const tabId = event.target.getAttribute('data-tab');
                if (tabId) {
                    switchTab(tabId);
                }
            });
        });
    }

    // Set default tab
    switchTab('profile-section');

    // Handle View Assignment Details
    const viewDetailsBtns = document.querySelectorAll('.view-details-btn');
    const modal = document.getElementById('assignment-details-modal');
    const closeModal = document.querySelector('.close-btn');
    const assignmentName = document.getElementById('assignment-name');
    const assignmentDescription = document.getElementById('assignment-description');
    const fileUpload = document.getElementById('file-upload');
    const submitAssignmentBtn = document.getElementById('submit-assignment-btn');
    const uploadMessage = document.getElementById('upload-message');

    // Store submitted assignments (for the sake of example, this will be in memory)
    let submittedAssignments = [];

    // View Assignment Details
    if (viewDetailsBtns) {
        viewDetailsBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                // Example data to populate modal
                if (assignmentName && assignmentDescription && modal) {
                    assignmentName.textContent = 'Math Exercise 5';
                    assignmentDescription.textContent = 'Complete the exercises in Chapter 5 of the textbook.';
                    modal.style.display = 'block';
                }
            });
        });
    }

    // Close Modal
    if (closeModal) {
        closeModal.addEventListener('click', () => {
            if (modal) {
                modal.style.display = 'none';
            }
        });
    }

    // Submit Assignment
    if (submitAssignmentBtn) {
        submitAssignmentBtn.addEventListener('click', async () => {
            if (fileUpload && fileUpload.files.length > 0) {
                try {
                    // Create FormData to send the file
                    const formData = new FormData();
                    formData.append('file', fileUpload.files[0]);

                    // Get token from localStorage
                    const token = localStorage.getItem('token');
                    
                    // Check if user is logged in
                    if (!token) {
                        alert('Please log in first');
                        return;
                    }

                    // Send the file to the server
                    const response = await fetch('http://localhost:5000/api/assignments/submit', {
                        method: 'POST',
                        headers: {
                            'Authorization': `Bearer ${token}`
                        },
                        body: formData
                    });

                    if (response.ok) {
                        const data = await response.json();
                        uploadMessage.textContent = 'Assignment submitted successfully!';
                        uploadMessage.style.color = 'green';
                        
                        // Add to local submitted assignments array
                        submittedAssignments.push({
                            name: assignmentName.textContent,
                            timestamp: new Date().toISOString()
                        });
                    } else {
                        const errorData = await response.json();
                        uploadMessage.textContent = errorData.error || 'Failed to submit assignment';
                        uploadMessage.style.color = 'red';
                    }
                } catch (error) {
                    console.error('Error submitting assignment:', error);
                    uploadMessage.textContent = 'An error occurred while submitting the assignment';
                    uploadMessage.style.color = 'red';
                }
            } else {
                uploadMessage.textContent = 'Please select a file to upload';
                uploadMessage.style.color = 'red';
            }
        });
    }

    // Function to update grades (this could be triggered by the teacher)
    function updateGrades(assignmentName, grade) {
        // Find the assignment in the submitted assignments list
        const assignment = submittedAssignments.find(assignment => assignment.name === assignmentName);
        if (assignment) {
            // Update the grade for that assignment
            assignment.grade = grade;
            
            // Update the grade display on the page
            if (assignmentName === 'Math Exercise 5') {
                document.getElementById('math-grade').textContent = grade;
            }
            
            console.log('Updated grades:', submittedAssignments);
        }
    }
});
