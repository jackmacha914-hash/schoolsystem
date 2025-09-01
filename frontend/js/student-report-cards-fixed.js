/**
 * Student Report Cards Module
 * Handles the display and interaction with student report cards
 */

class StudentReportCards {
    constructor() {
        this.reportCardsContainer = document.getElementById('report-cards-grid');
        this.loadingElement = document.getElementById('report-cards-loading');
        this.emptyStateElement = document.getElementById('no-report-cards');
        this.refreshButton = document.getElementById('refresh-report-cards');
        this.termSelect = document.getElementById('term-select');
        this.yearSelect = document.getElementById('academic-year-select');
        this.modal = document.getElementById('reportCardModal');
        this.modalTitle = document.getElementById('reportCardModalLabel');
        this.modalBody = document.querySelector('#reportCardModal .modal-body');
        this.currentCard = null;
        
        // Initialize the component
        this.initialize();
    }

    /**
     * Initialize the component
     */
    initialize() {
        // Bind event listeners
        if (this.refreshButton) {
            this.refreshButton.addEventListener('click', () => this.loadReportCards());
        }
        if (this.termSelect) {
            this.termSelect.addEventListener('change', () => this.loadReportCards());
        }
        if (this.yearSelect) {
            this.yearSelect.addEventListener('change', () => this.loadReportCards());
        }
        
        // Close modal when clicking the close button
        const closeButtons = document.querySelectorAll('[data-bs-dismiss="modal"]');
        closeButtons.forEach(button => {
            button.addEventListener('click', () => this.closeModal());
        });
    }
    
    // Load report cards from the API
    async loadReportCards() {
        try {
            this.showLoading();
            const term = this.termSelect ? this.termSelect.value : 'Term 1';
            let studentId = localStorage.getItem('studentId');
            
            if (!studentId) {
                const studentNameElement = document.getElementById('student-name');
                if (studentNameElement && studentNameElement.dataset.studentId) {
                    studentId = studentNameElement.dataset.studentId;
                    localStorage.setItem('studentId', studentId);
                } else {
                    throw new Error('Student ID not found. Please log in again.');
                }
            }
            
            if (!term) {
                throw new Error('Please select a term');
            }
            
            // Log the API request for debugging
            console.log('Fetching report cards for:', { studentId, term });
            
            // First, try to get the student's marks directly
            const marksResponse = await fetch(`http://localhost:5000/api/marks/student/${studentId}`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                    'Content-Type': 'application/json'
                }
            });
            
            if (marksResponse.ok) {
                const response = await marksResponse.json();
                
                if (response && response.success && response.data && response.data.length > 0) {
                    // Filter marks by the selected term
                    const filteredMarks = response.data.filter(mark => 
                        mark.term === term
                    );
                    
                    if (filteredMarks.length > 0) {
                        try {
                            // Transform the marks data into report card format
                            const reportCard = await this.transformMarksToReportCard(filteredMarks, term, '');
                            this.renderReportCards([reportCard]);
                            return;
                        } catch (error) {
                            console.error('Error transforming marks to report card:', error);
                            this.showNoReportCards(term, '', 'Error generating report card. Please try again.');
                            return;
                        }
                    } else {
                        this.showNoReportCards(term, '', `No marks found for ${term}.`);
                        return;
                    }
                } else {
                    this.showNoReportCards(term, '', 'No marks found for this student.');
                    return;
                }
            } else if (marksResponse.status === 404) {
                this.showNoReportCards(term, '', 'No marks found for this student.');
                return;
            } else {
                throw new Error(`Failed to load marks: ${marksResponse.statusText}`);
            }
        } catch (error) {
            console.error('Error loading report cards:', error);
            this.showError(error.message || 'Failed to load report cards. Please try again.');
        } finally {
            this.hideLoading();
        }
    }
    
    // Render report cards in the UI
    renderReportCards(reportCards) {
        if (!this.reportCardsContainer) return;
        
        // Clear existing cards
        this.reportCardsContainer.innerHTML = '';
        
        if (!reportCards || reportCards.length === 0) {
            this.showNoReportCards();
            return;
        }
        
        // Create and append report card elements
        reportCards.forEach(card => {
            const cardElement = this.createReportCardElement(card);
            if (cardElement) {
                this.reportCardsContainer.appendChild(cardElement);
            }
        });
    }
    
    // Create a report card element
    createReportCardElement(card) {
        if (!card) return null;
        
        const col = document.createElement('div');
        col.className = 'col-md-6 col-lg-4 mb-4';
        
        // Format the date
        const date = new Date(card.issueDate);
        const formattedDate = date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
        
        // Calculate overall grade
        const totalScore = card.subjects.reduce((sum, subject) => sum + subject.score, 0);
        const averageScore = card.subjects.length > 0 ? totalScore / card.subjects.length : 0;
        const overallGrade = this.calculateGrade(averageScore);
        
        col.innerHTML = `
            <div class="card h-100 shadow-sm">
                <div class="card-header bg-primary text-white">
                    <h5 class="card-title mb-0">${card.term} - ${card.academicYear}</h5>
                    <small class="text-white-50">Issued: ${formattedDate}</small>
                </div>
                <div class="card-body">
                    <div class="d-flex justify-content-between align-items-center mb-3">
                        <h6 class="mb-0">Overall Grade:</h6>
                        <span class="badge bg-success">${overallGrade}</span>
                    </div>
                    <div class="progress mb-3" style="height: 20px;">
                        <div class="progress-bar" role="progressbar" style="width: ${averageScore}%" 
                             aria-valuenow="${averageScore}" aria-valuemin="0" aria-valuemax="100">
                            ${averageScore.toFixed(1)}%
                        </div>
                    </div>
                </div>
                <div class="card-footer bg-transparent">
                    <button class="btn btn-sm btn-outline-primary view-report-card">
                        <i class="bi bi-eye"></i> View
                    </button>
                    <button class="btn btn-sm btn-outline-secondary float-end download-report-card">
                        <i class="bi bi-download"></i> Download
                    </button>
                </div>
            </div>
        `;
        
        // Add event listeners
        const viewBtn = col.querySelector('.view-report-card');
        const downloadBtn = col.querySelector('.download-report-card');
        
        if (viewBtn) {
            viewBtn.addEventListener('click', (e) => this.viewReportCard(card, e));
        }
        
        if (downloadBtn) {
            downloadBtn.addEventListener('click', () => this.downloadReportCard(card));
        }
        
        return col;
    }
    
    // View report card in a modal
    viewReportCard(card, event) {
        if (event) event.preventDefault();
        this.currentCard = card;
        
        if (!this.modal || !this.modalTitle || !this.modalBody) {
            console.error('Modal elements not found');
            return;
        }
        
        // Set modal title
        this.modalTitle.textContent = `Report Card - ${card.term} ${card.academicYear}`;
        
        // Generate and set modal content
        this.modalBody.innerHTML = this.generateReportCardHTML(card);
        
        // Show the modal
        const modal = new bootstrap.Modal(this.modal);
        modal.show();
    }
    
    // Generate HTML for the report card modal
    generateReportCardHTML(card) {
        if (!card) return '';
        
        // Format the date
        const date = new Date(card.issueDate);
        const formattedDate = date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
        
        // Calculate overall grade
        const totalScore = card.subjects.reduce((sum, subject) => sum + subject.score, 0);
        const averageScore = card.subjects.length > 0 ? totalScore / card.subjects.length : 0;
        const overallGrade = this.calculateGrade(averageScore);
        
        // Generate subjects HTML
        const subjectsHTML = card.subjects.map(subject => `
            <tr>
                <td>${subject.name}</td>
                <td class="text-center">${subject.score}%</td>
                <td class="text-center">${this.calculateGrade(subject.score)}</td>
                <td>${subject.comments || 'No comments'}</td>
            </tr>
        `).join('');
        
        return `
            <div class="report-card-print">
                <div class="report-card-header text-center mb-4">
                    <h2>${card.schoolName || 'School Name'}</h2>
                    <h4>Report Card</h4>
                    <p class="mb-0">${card.term} - ${card.academicYear}</p>
                    <p class="text-muted">Issued: ${formattedDate}</p>
                </div>
                
                <div class="student-info mb-4">
                    <div class="row">
                        <div class="col-md-6">
                            <p><strong>Student:</strong> ${card.student?.fullName || card.studentName || 'Student'}</p>
                            <p><strong>Class:</strong> ${card.student?.className || card.className || 'N/A'}</p>
                        </div>
                        <div class="col-md-6 text-md-end">
                            <p><strong>Overall Grade:</strong> <span class="badge bg-primary">${overallGrade}</span></p>
                            <p><strong>Average Score:</strong> ${averageScore.toFixed(1)}%</p>
                        </div>
                    </div>
                </div>
                
                <div class="table-responsive">
                    <table class="table table-bordered">
                        <thead class="table-light">
                            <tr>
                                <th>Subject</th>
                                <th class="text-center">Score</th>
                                <th class="text-center">Grade</th>
                                <th>Comments</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${subjectsHTML}
                        </tbody>
                    </table>
                </div>
                
                <div class="teacher-comments mt-4">
                    <h5>Teacher's Comments:</h5>
                    <div class="border p-3">
                        ${card.teacherComments || 'No comments available.'}
                    </div>
                </div>
                
                <div class="signature-line mt-5 pt-4 text-end">
                    <p class="mb-1">_________________________</p>
                    <p class="mb-0">Teacher's Signature</p>
                </div>
            </div>
            
            <style>
                .report-card-print {
                    font-family: Arial, sans-serif;
                    line-height: 1.6;
                }
                .report-card-header {
                    border-bottom: 2px solid #dee2e6;
                    padding-bottom: 1rem;
                    margin-bottom: 1.5rem;
                }
                .student-info {
                    background-color: #f8f9fa;
                    padding: 1rem;
                    border-radius: 0.25rem;
                }
                .table th {
                    background-color: #f8f9fa;
                }
                @media print {
                    .no-print {
                        display: none !important;
                    }
                    body {
                        padding: 0.5in;
                        font-size: 12pt;
                    }
                    .report-card-print {
                        max-width: 100%;
                    }
                }
            </style>
        `;
    }
    
    // Download report card as PDF
    downloadReportCard(card) {
        if (!card) {
            console.error('No report card data available for download');
            return;
        }
        
        // Generate the HTML for the report card
        const html = this.generateReportCardHTML(card);
        
        // Create a new window with the report card
        const printWindow = window.open('', '_blank');
        printWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>Report Card - ${card.term} ${card.academicYear}</title>
                <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.1.3/dist/css/bootstrap.min.css" rel="stylesheet">
                <script src="https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js"></script>
                <style>
                    body { padding: 20px; }
                    @media print {
                        body { padding: 0; }
                        .no-print { display: none !important; }
                    }
                </style>
            </head>
            <body>
                <div id="report-card-content">
                    ${html}
                </div>
                <div class="text-center mt-3 no-print">
                    <button class="btn btn-primary" onclick="window.print()">
                        <i class="bi bi-printer"></i> Print
                    </button>
                    <button class="btn btn-success ms-2" id="download-pdf">
                        <i class="bi bi-download"></i> Download PDF
                    </button>
                    <button class="btn btn-secondary ms-2" onclick="window.close()">
                        <i class="bi bi-x"></i> Close
                    </button>
                </div>
                <script>
                    document.getElementById('download-pdf').addEventListener('click', function() {
                        const element = document.getElementById('report-card-content');
                        const opt = {
                            margin: 10,
                            filename: 'report-card-${card.term.toLowerCase().replace(/\\s+/g, '-')}-${card.academicYear}.pdf',
                            image: { type: 'jpeg', quality: 0.98 },
                            html2canvas: { scale: 2 },
                            jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
                        };
                        
                        // Generate PDF
                        html2pdf().set(opt).from(element).save();
                    });
                </script>
            </body>
            </html>
        `);
        printWindow.document.close();
    }
    
    // Calculate grade from score based on teacher's grading system
    calculateGrade(score) {
        if (score >= 70) return 'Exceed Expectation';
        if (score >= 50) return 'Meet Expectation';
        return 'Below Expectation';
    }
    
    // Show loading state
    showLoading() {
        if (this.loadingElement) {
            this.loadingElement.style.display = 'block';
        }
        if (this.emptyStateElement) {
            this.emptyStateElement.style.display = 'none';
        }
        if (this.reportCardsContainer) {
            this.reportCardsContainer.style.display = 'none';
        }
    }
    
    // Hide loading state
    hideLoading() {
        if (this.loadingElement) {
            this.loadingElement.style.display = 'none';
        }
        if (this.reportCardsContainer) {
            this.reportCardsContainer.style.display = 'grid';
        }
    }
    
    // Transform marks data into report card format
    async transformMarksToReportCard(marksData, term, academicYear) {
        // Calculate overall performance
        const totalMarks = marksData.reduce((sum, mark) => sum + (parseInt(mark.score) || 0), 0);
        const averageScore = marksData.length > 0 ? totalMarks / marksData.length : 0;
        
        // Get the first mark to extract common data
        const firstMark = marksData[0];
        
        // Get student data from the user profile in localStorage
        let studentData = { fullName: 'Student', className: 'N/A' };
        
        try {
            // Get the user profile from localStorage
            const userProfile = JSON.parse(localStorage.getItem('userProfile') || '{}');
            console.log('User profile from localStorage:', userProfile);
            
            if (userProfile) {
                studentData = {
                    fullName: userProfile.name || 
                             userProfile.fullName || 
                             `${userProfile.firstName || ''} ${userProfile.lastName || ''}`.trim() ||
                             'Student',
                    className: userProfile.profile?.class || 
                              userProfile.className || 
                              userProfile.class?.name || 
                              'N/A'
                };
                console.log('Processed student data:', studentData);
            }
        } catch (error) {
            console.error('Error parsing user profile:', error);
        }
        
        return {
            term: term,
            academicYear: academicYear,
            issueDate: new Date().toISOString(),
            student: {
                fullName: studentData.fullName,
                className: studentData.className
            },
            subjects: marksData.map(mark => ({
                name: mark.subject,
                score: parseInt(mark.score) || 0,
                grade: this.calculateGrade(parseInt(mark.score) || 0),
                comments: mark.teacherRemarks || 'No comments'
            })),
            teacherComments: firstMark.teacherRemarks || 'No additional comments',
            overallGrade: this.calculateGrade(averageScore),
            averageScore: averageScore
        };
    }
    
    // Show no report cards message with options
    showNoReportCards(term, academicYear, customMessage = '') {
        if (!this.emptyStateElement) return;
        
        this.emptyStateElement.innerHTML = `
            <div class="alert alert-info" role="alert">
                <div class="d-flex align-items-center">
                    <i class="bi bi-info-circle-fill me-2"></i>
                    <div>
                        <h5 class="alert-heading">No Report Cards Found</h5>
                        <p class="mb-2">${customMessage || `No report cards found for ${term} ${academicYear}.`}</p>
                        <p class="small text-muted mb-2">This could be because your marks haven't been recorded yet or the term hasn't ended.</p>
                        <div class="d-flex gap-2">
                            <button class="btn btn-sm btn-outline-primary" id="try-again-btn">
                                <i class="bi bi-arrow-clockwise"></i> Try Again
                            </button>
                            <button class="btn btn-sm btn-outline-secondary" id="contact-admin-btn">
                                <i class="bi bi-envelope"></i> Contact Administrator
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        // Add event listeners
        const tryAgainBtn = this.emptyStateElement.querySelector('#try-again-btn');
        const contactAdminBtn = this.emptyStateElement.querySelector('#contact-admin-btn');
        
        if (tryAgainBtn) {
            tryAgainBtn.addEventListener('click', () => this.loadReportCards());
        }
        
        if (contactAdminBtn) {
            contactAdminBtn.addEventListener('click', () => {
                const subject = encodeURIComponent('Report Cards Not Available');
                const body = encodeURIComponent(`Hello,\n\nI'm unable to view my report cards for ${term} ${academicYear}. Could you please assist?\n\nThank you.`);
                window.location.href = `mailto:admin@school.com?subject=${subject}&body=${body}`;
            });
        }
        
        this.emptyStateElement.style.display = 'block';
        if (this.reportCardsContainer) {
            this.reportCardsContainer.style.display = 'none';
        }
    }
    
    // Show error message
    showError(message) {
        if (!this.emptyStateElement) return;
        
        this.emptyStateElement.innerHTML = `
            <div class="alert alert-danger" role="alert">
                <i class="bi bi-exclamation-triangle-fill me-2"></i>
                ${message}
            </div>
        `;
        this.emptyStateElement.style.display = 'block';
        
        if (this.reportCardsContainer) {
            this.reportCardsContainer.style.display = 'none';
        }
    }
    
    // Close the modal
    closeModal() {
        if (this.modal) {
            const modal = bootstrap.Modal.getInstance(this.modal);
            if (modal) {
                modal.hide();
            }
        }
    }
}

// Initialize the report cards when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', function() {
    // Check if we're on the report cards section
    const reportCardsSection = document.getElementById('report-cards-section');
    if (!reportCardsSection) return;
    
    // Initialize the report cards
    const reportCards = new StudentReportCards();
    
    // Set up intersection observer to load report cards when the section becomes visible
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                reportCards.initialize();
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.1 });
    
    observer.observe(reportCardsSection);
});

// Make the class available globally
window.StudentReportCards = StudentReportCards;
