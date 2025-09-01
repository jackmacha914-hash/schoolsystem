// Modal functions
function openRegistrationModal(userType) {
    const modal = document.getElementById('registrationModal');
    const modalTitle = document.getElementById('modal-title');
    const teacherFields = document.getElementById('teacher-fields');
    
    // Update modal title based on user type
    modalTitle.textContent = userType === 'teacher' ? 'Teacher Registration' : 'Student Registration';
    
    // Show/hide teacher-specific fields
    teacherFields.style.display = userType === 'teacher' ? 'block' : 'none';
    
    modal.style.display = 'block';
}

function closeRegistrationModal() {
    document.getElementById('registrationModal').style.display = 'none';
}

// Close modal when clicking outside
window.onclick = function(event) {
    var modal = document.getElementById('registrationModal');
    if (event.target == modal) {
        modal.style.display = 'none';
    }
};
