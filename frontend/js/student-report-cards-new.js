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
        
        // Initialize event listeners
        if (this.refreshButton) {
            this.refreshButton.addEventListener('click', () => this.loadReportCards());
        }
        
        // Initialize year dropdown
        this.initializeYearDropdown();
    }
    
    initializeYearDropdown() {
        if (!this.yearSelect) return;
        
        // Clear existing options
        this.yearSelect.innerHTML = '';
        
        // Add years (current year - 2 to current year + 1)
        const currentYear = new Date().getFullYear();
        for (let year = currentYear - 2; year <= currentYear + 1; year++) {
            const nextYear = year + 1;
            const academicYear = `${year}-${nextYear}`;
            const option = document.createElement('option');
            option.value = academicYear;
            option.textContent = academicYear;
            this.yearSelect.appendChild(option);
        }
        
        // Set default to current academic year
        const currentMonth = new Date().getMonth() + 1;
        const currentYearForTerm = currentMonth >= 9 ? currentYear : currentYear - 1;
        const defaultYear = `${currentYearForTerm}-${currentYearForTerm + 1}`;
        this.yearSelect.value = defaultYear;
        
        // Set default term based on current month
        if (this.termSelect) {
            if (currentMonth >= 1 && currentMonth <= 4) {
                this.termSelect.value = 'Term 1';
            } else if (currentMonth >= 5 && currentMonth <= 8) {
                this.termSelect.value = 'Term 2';
            } else {
                this.termSelect.value = 'Term 3';
            }
        }
    }
    
    initialize() {
        this.loadReportCards();
    }
    
    async loadReportCards() {
        try {
            this.showLoading();
            
            // Get the JWT token from localStorage
            const token = localStorage.getItem('token');
            
            if (!token) {
                throw new Error('No authentication token found. Please log in again.');
            }
            
            // Extract student ID from JWT token
            const tokenPayload = JSON.parse(atob(token.split('.')[1]));
            const studentId = tokenPayload.userId || tokenPayload.id;
            
            if (!studentId) {
                console.error('No student ID found in token:', tokenPayload);
                throw new Error('Unable to determine student ID from token');
            }

            console.log('Fetching report cards for student ID:', studentId);

            // Get selected term and academic year from the UI
            const term = this.termSelect ? this.termSelect.value : 'Term 1';
            const academicYear = this.yearSelect ? this.yearSelect.value : `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`;
            
            console.log('Selected term and year:', { term, academicYear });

            // Fetch student marks from the API with term and academic year
            const apiUrl = `http://localhost:5000/api/marks/student/${studentId}?term=${encodeURIComponent(term)}&academicYear=${encodeURIComponent(academicYear)}`;
            console.log('Fetching student marks from:', apiUrl);
            
            const response = await fetch(apiUrl, {
                headers: { 
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                credentials: 'include' // Include cookies in the request
            });
            
            console.log('API Response Status:', response.status);
            
            const responseData = await response.json();
            
            if (response.status === 404) {
                // Handle 404 specifically to show a more friendly message
                if (responseData.message === 'No marks found for the specified criteria' || 
                    responseData.message === 'No report cards found for the specified criteria') {
                    this.showNoReportCards('No report card found for the selected term and academic year.');
                    return [];
                }
                throw new Error(responseData.message || 'Report card not found');
            }
            
            if (!response.ok) {
                throw new Error(responseData.message || `HTTP error! status: ${response.status}`);
            }
            
            // Log the response for debugging
            console.log('API Response:', responseData);
            
            if (!responseData.success) {
                throw new Error(responseData.message || 'Failed to fetch report cards');
            }
            
            // Check if we have data
            if (!responseData.data || responseData.count === 0) {
                this.showNoReportCards('No grades have been recorded for this term yet.');
                return [];
            }
            
            // Transform the data into the expected format for rendering
            let reportCards = [];
            if (responseData.data && Array.isArray(responseData.data)) {
                // Group by term and academic year
                const groupedData = responseData.data.reduce((acc, subject) => {
                    const key = `${subject.term}-${subject.academicYear}`;
                    if (!acc[key]) {
                        acc[key] = {
                            term: subject.term,
                            academicYear: subject.academicYear,
                            subjects: [],
                            averageScore: 0
                        };
                    }
                    acc[key].subjects.push(subject);
                    return acc;
                }, {});
                
                // Calculate average score for each term
                reportCards = Object.values(groupedData).map(group => {
                    const totalScore = group.subjects.reduce((sum, subj) => sum + (parseFloat(subj.averageScore) || 0), 0);
                    group.averageScore = (totalScore / group.subjects.length).toFixed(1);
                    return group;
                });
            }
            
            console.log('Processed report cards:', { count: reportCards.length });
            
            // Render the report cards or show empty state
            if (reportCards.length > 0) {
                this.renderReportCards(reportCards);
            } else {
                this.showNoReportCards('No report cards found for the selected criteria.');
            }
            
            return reportCards;
            
        } catch (error) {
            console.error('Error loading report cards:', error);
            this.showError(error.message || 'Failed to load report cards');
            return [];
        } finally {
            this.hideLoading();
        }
    }
    
    renderReportCards(reportCards) {
        // Clear existing cards
        this.reportCardsContainer.innerHTML = '';
        
        // Add each report card to the grid
        reportCards.forEach(card => {
            const cardEl = this.createReportCardElement(card);
            if (cardEl) {
                this.reportCardsContainer.appendChild(cardEl);
            }
        });

        // Show the grid
        this.reportCardsContainer.style.display = 'grid';
        
        // Initialize tooltips if needed
        if (typeof bootstrap !== 'undefined') {
            const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
            tooltipTriggerList.map(tooltipTriggerEl => new bootstrap.Tooltip(tooltipTriggerEl));
        }
    }
    
    calculateGrade(score) {
        const numScore = parseFloat(score) || 0;
        if (numScore >= 80) return 'A';
        if (numScore >= 70) return 'B';
        if (numScore >= 60) return 'C';
        if (numScore >= 50) return 'D';
        return 'F';
    }

    createReportCardElement(card) {
        if (!card) return null;

        // Create the card element
        const col = document.createElement('div');
        col.className = 'col-12 col-md-6 col-lg-4 mb-4';
        
        // Create the card HTML
        col.innerHTML = `
            <div class="card h-100 shadow-sm">
                <div class="card-header bg-primary text-white">
                    <h5 class="card-title mb-0">${card.term || 'Report Card'}</h5>
                    <small class="text-white-50">Academic Year: ${card.academicYear || 'N/A'}</small>
                </div>
                <div class="card-body">
                    <div class="d-flex justify-content-between align-items-center mb-3">
                        <div>
                            <h6 class="mb-1">Term Average</h6>
                            <div class="display-4 fw-bold text-primary">${card.averageScore || '0.0'}%</div>
                        </div>
                    </div>
                    
                    <div class="mb-3">
                        <h6 class="border-bottom pb-2 mb-2">Subjects</h6>
                        <div class="table-responsive">
                            <table class="table table-sm table-borderless mb-0">
                                <thead>
                                    <tr>
                                        <th>Subject</th>
                                        <th class="text-end">Score</th>
                                        <th class="text-end">Grade</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${(card.subjects || []).map(subject => `
                                        <tr>
                                            <td>${subject.subject || subject.name || 'N/A'}</td>
                                            <td class="text-end">${(subject.averageScore || subject.score || '0.0')}%</td>
                                            <td class="text-end">
                                                <span class="badge bg-light text-dark">${this.calculateGrade(subject.averageScore || subject.score)}</span>
                                            </td>
                                        </tr>
                                    `).join('')}
                                </tbody>
                            </table>
                        </div>
                    </div>
                    
                    ${card.comments ? `
                        <div class="small text-muted mb-2" data-bs-toggle="tooltip" 
                             title="${(card.comments || '').replace(/"/g, '&quot;')}">
                            <i class="bi bi-chat-left-text me-1"></i>
                            ${(card.comments || '').substring(0, 50)}${(card.comments || '').length > 50 ? '...' : ''}
                        </div>
                    ` : ''}
                </div>
                <div class="card-footer bg-transparent">
                    <div class="d-flex justify-content-between">
                        <button class="btn btn-sm btn-outline-primary view-report-btn">
                            <i class="fas fa-eye me-1"></i> View Details
                        </button>
                        <button class="btn btn-sm btn-outline-secondary download-report-btn">
                            <i class="fas fa-download me-1"></i> Download
                        </button>
                    </div>
                </div>
            </div>`;

        // Add event listeners to the buttons
        const viewBtn = col.querySelector('.view-report-btn');
        const downloadBtn = col.querySelector('.download-report-btn');
        
        if (viewBtn) {
            viewBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.viewReportCard(card, e);
            });
        }
        
        if (downloadBtn) {
            downloadBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.downloadReportCard(card);
            });
        }

        return col;
    }
    
    viewReportCard(card, event) {
        console.log('Viewing report card:', card);
        
        // Prevent default action and stop event propagation
        if (event) {
            event.preventDefault();
            event.stopPropagation();
            event.returnValue = false;
        }
        
        // Store the card data for later use
        this.currentCard = card;
        
        // Get the modal element or create it if it doesn't exist
        let modalElement = document.getElementById('reportCardModal');
        
        if (!modalElement) {
            // Create the modal dynamically if it doesn't exist
            const modalHTML = `
                <div class="modal fade" id="reportCardModal" tabindex="-1" aria-labelledby="reportCardModalLabel" aria-hidden="true" style="display: none;">
                    <div class="modal-dialog modal-lg">
                        <div class="modal-content">
                            <div class="modal-header">
                                <h5 class="modal-title" id="reportCardModalLabel">Report Card - ${card.term} ${card.academicYear}</h5>
                                <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                            </div>
                            <div class="modal-body" id="report-card-preview">
                                <!-- Content will be populated below -->
                                <div class="text-center my-5">
                                    <div class="spinner-border text-primary" role="status">
                                        <span class="visually-hidden">Loading...</span>
                                    </div>
                                    <p class="mt-2">Loading report card...</p>
                                </div>
                            </div>
                            <div class="modal-footer">
                                <button type="button" class="btn btn-secondary" id="close-report-card">Close</button>
                                <button type="button" class="btn btn-primary" id="download-report-card">
                                    <i class="bi bi-download me-1"></i> Download PDF
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="modal-backdrop fade show" id="reportCardBackdrop" style="display: none;"></div>
            `;
            
            // Add the modal to the body
            document.body.insertAdjacentHTML('beforeend', modalHTML);
            modalElement = document.getElementById('reportCardModal');
            
            // Add event listener for the close button
            const closeBtn = modalElement.querySelector('#close-report-card');
            if (closeBtn) {
                closeBtn.addEventListener('click', () => {
                    this.hideCustomModal();
                });
            }
            
            // Add event listener for the download button
            const downloadBtn = modalElement.querySelector('#download-report-card');
            if (downloadBtn) {
                downloadBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    this.downloadReportCard(card);
                });
            }
            
            // Add click handler to the backdrop to close the modal
            const backdrop = document.getElementById('reportCardBackdrop');
            if (backdrop) {
                backdrop.addEventListener('click', () => {
                    this.hideCustomModal();
                });
            }
        }
        
        // Show the modal first
        this.showCustomModal();
        
        // Then populate the modal with data
        this.populateReportCardModal(card);
    }
    
    populateReportCardModal(card) {
        const previewElement = document.getElementById('report-card-preview');
        if (!previewElement) return;
        
        // Show loading state
        previewElement.innerHTML = `
            <div class="text-center my-5">
                <div class="spinner-border text-primary" role="status">
                    <span class="visually-hidden">Loading...</span>
                </div>
                <p class="mt-2">Loading report card...</p>
            </div>`;
        
        // Simulate API call or data processing
        setTimeout(() => {
            try {
                // Generate the report card HTML
                const reportCardHTML = this.generateReportCardHTML(card);
                previewElement.innerHTML = reportCardHTML;
            } catch (error) {
                console.error('Error generating report card:', error);
                previewElement.innerHTML = `
                    <div class="alert alert-danger">
                        <i class="bi bi-exclamation-triangle-fill me-2"></i>
                        Failed to load report card. Please try again.
                    </div>`;
            }
        }, 100);
    }
    
    generateReportCardHTML(card) {
        // Ensure card data exists and has required properties
        card = card || {};
        
        // Get student information with fallbacks - check multiple possible property paths
        const studentName = card.studentName || 
                           card.student?.name || 
                           card.studentName || 
                           (card.student && (card.student.fullName || card.student.firstName + ' ' + card.student.lastName)) || 
                           'Student Name';
        const className = card.className || 
                         card.class?.name || 
                         (card.student && card.student.className) || 
                         (card.student && card.student.class) || 
                         'Class';
                         
        console.log('Student name data:', { 
            cardStudentName: card.studentName, 
            cardStudent: card.student,
            resolvedName: studentName 
        });
        const term = card.term || 'N/A';
        const academicYear = card.academicYear || 'N/A';
        
        // Calculate total and average scores
        let totalMarks = 0;
        let subjectCount = 0;
        
        // Process subjects and calculate totals
        const maxSubjects = 8; // Limit to fit on one page
        const subjectRows = (card.subjects || []).slice(0, maxSubjects).map(subject => {
            const score = parseFloat(subject.averageScore || subject.score || 0);
            const grade = this.calculateGrade(score);
            const remarks = this.getGradeRemarks(grade);
            
            if (!isNaN(score)) {
                totalMarks += score;
                subjectCount++;
            }
            
            return `
                <tr>
                    <td>${subject.subject || subject.name || 'N/A'}</td>
                    <td style="text-align: center;">${!isNaN(score) ? score.toFixed(2) + '%' : 'N/A'}</td>
                    <td style="text-align: center;">${grade}</td>
                    <td>${remarks}</td>
                </tr>`;
        }).join('');
        
        const averageScore = subjectCount > 0 ? (totalMarks / subjectCount).toFixed(2) : 0;
        const overallGrade = this.calculateGrade(averageScore);
        const overallRemarks = this.getGradeRemarks(overallGrade);
        const currentDate = new Date().toLocaleDateString('en-US', {
            year: 'numeric',
                    text-align: center;
                    width: 30%;
                }
                .signature-line {
                    border-top: 1px solid #000;
                    margin: 15px auto 0;
                    width: 80%;
                }
                .footer {
                    position: absolute;
                    bottom: 10px;
                    left: 1cm;
                    right: 1cm;
                    text-align: center;
                    font-size: 8px;
                    color: #777;
                    padding-top: 5px;
                    border-top: 1px solid #eee;
                }
                @media print {
                    body {
                        padding: 1cm;
                    }
                    .no-print {
                        display: none;
                    }
                }
            </style>
        </head>
        <body>
            <div class="header">
                <h1>${card.schoolName || 'EDUSYNC ACADEMY'}</h1>
                <p>${card.schoolAddress || '123 Education Street, Learning City'}</p>
                <p>${card.schoolContact || 'Phone: (123) 456-7890 | Email: info@edusync.edu'}</p>
                <h2>ACADEMIC REPORT CARD</h2>
            </div>

            <div class="student-info">
                <div class="info-group">
                    <p><strong>Student Name:</strong></p>
                    <div class="info-box">${studentName}</div>
                </div>
                <div class="info-group">
                    <p><strong>Class/Grade:</strong></p>
                    <div class="info-box">${className}</div>
                </div>
                <div class="info-group">
                    <p><strong>Term:</strong></p>
                    <div class="info-box">${term}</div>
                </div>
                <div class="info-group">
                    <p><strong>Academic Year:</strong></p>
                    <div class="info-box">${academicYear}</div>
                </div>
            </div>

            <div class="academic-performance">
                <div class="section-title">ACADEMIC PERFORMANCE</div>
                <table>
                    <thead>
                        <tr>
                            <th style="width: 45%;">SUBJECT</th>
                            <th style="width: 15%;">SCORE (%)</th>
                            <th style="width: 15%;">GRADE</th>
                            <th style="width: 25%;">REMARKS</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${subjectRows || `
                        <tr>
                            <td colspan="4" style="text-align: center; color: #7f8c8d;">
                                No subjects available for this term
                            </td>
                        </tr>`}
                    </tbody>
                </table>
            </div>

            <div class="summary">
                <div class="summary-box">
                    <div class="summary-header">TERM SUMMARY</div>
                    <div class="summary-content">
                        <p><strong>Total Score:</strong> ${totalMarks.toFixed(2)}%</p>
                        <p><strong>Average Score:</strong> ${averageScore}%</p>
                        <p><strong>Overall Grade:</strong> ${overallGrade}</p>
                        <p><strong>Remarks:</strong> ${overallRemarks}</p>
                    </div>
                </div>
                
                ${card.teacherRemarks ? `
                <div class="summary-box">
                    <div class="summary-header">TEACHER'S COMMENTS</div>
                    <div class="summary-content">
                        <p style="font-style: italic; margin: 0;">${card.teacherRemarks}</p>
                    </div>
                </div>` : ''}
            </div>

            <div class="signatures">
                <div class="signature-box">
                    <div>Class Teacher</div>
                    <div class="signature-line"></div>
                </div>
                <div class="signature-box">
                    <div>Principal</div>
                    <div class="signature-line"></div>
                </div>
                <div class="signature-box">
                    <div>Date: ${currentDate}</div>
                    <div class="signature-line"></div>
                </div>
            </div>

            <div class="footer">
                <p>This is an official document. Any unauthorized duplication is strictly prohibited.</p>
                <p>${card.schoolName || 'Edusync Academy'} © ${new Date().getFullYear()}</p>
            </div>
        </body>
        </html>`;
    }
    
    // Download report card as PDF
    downloadReportCard(card) {
        const targetCard = card || this.currentCard;
        if (!targetCard) {
            console.error('No report card data available for download');
            return;
        }
        
        // Create a temporary element for PDF generation to avoid affecting the modal
        const tempElement = document.createElement('div');
        tempElement.style.position = 'absolute';
        tempElement.style.left = '-9999px';
        document.body.appendChild(tempElement);
        
        try {
            // Clone the modal content
            const originalContent = document.getElementById('report-card-preview').cloneNode(true);
            tempElement.appendChild(originalContent);
            
            // Make sure all images are loaded before generating PDF
            const images = tempElement.getElementsByTagName('img');
            const imagePromises = Array.from(images).map(img => {
                if (img.complete) return Promise.resolve();
                return new Promise((resolve) => {
                    img.onload = resolve;
                    img.onerror = resolve; // Continue even if image fails to load
                });
            });
            
            Promise.all(imagePromises).then(() => {
                // PDF options
                const opt = {
                    margin: 10,
                    filename: `Report_Card_${targetCard.term || 'Term'}_${targetCard.academicYear || 'Year'}.pdf`,
                    image: { type: 'jpeg', quality: 0.98 },
                    html2canvas: { 
                        scale: 2,
                        logging: true,
                        useCORS: true,
                        allowTaint: true
                    },
                    jsPDF: { 
                        unit: 'mm', 
                        format: 'a4', 
                        orientation: 'portrait' 
                    }
                };
                
                // Generate and download the PDF
                html2pdf()
                    .set(opt)
                    .from(originalContent)
                    .save()
                    .then(() => {
                        console.log('PDF generated successfully');
                    })
                    .catch(error => {
                        console.error('Error generating PDF:', error);
                        alert('Failed to generate PDF. Please try again.');
                    })
                    .finally(() => {
                        // Clean up the temporary element
                        if (document.body.contains(tempElement)) {
                            document.body.removeChild(tempElement);
                        }
                    });
            });
        } catch (error) {
            console.error('Error preparing PDF content:', error);
            alert('Failed to prepare PDF content. Please try again.');
            // Clean up the temporary element in case of error
            if (document.body.contains(tempElement)) {
                document.body.removeChild(tempElement);
            }
        }
    }
    
    getGradeRemarks(grade) {
        const remarks = {
            'A': 'Excellent',
            'A-': 'Very Good',
            'B+': 'Good',
            'B': 'Above Average',
            'B-': 'Average',
            'C+': 'Below Average',
            'C': 'Fair',
            'C-': 'Needs Improvement',
            'D': 'Poor',
            'E': 'Fail'
        };
        return remarks[grade] || '';
    }
    
    showLoading() {
        if (this.loadingElement) this.loadingElement.style.display = 'block';
        if (this.reportCardsContainer) this.reportCardsContainer.style.display = 'none';
        if (this.emptyStateElement) this.emptyStateElement.style.display = 'none';
    }
    
    hideLoading() {
        if (this.loadingElement) this.loadingElement.style.display = 'none';
    }
    
    showNoReportCards(message = 'No report cards available for the selected criteria.') {
        if (this.emptyStateElement) {
            this.emptyStateElement.innerHTML = `
                <div class="alert alert-info">
                    <i class="fas fa-info-circle me-2"></i>
                    ${message}
                </div>`;
            this.emptyStateElement.style.display = 'block';
        }
        if (this.reportCardsContainer) this.reportCardsContainer.style.display = 'none';
        this.hideLoading();
    }
    
    showError(message) {
        console.error(message);
        if (this.emptyStateElement) {
            this.emptyStateElement.innerHTML = `
                <div class="alert alert-danger">
                    <i class="bi bi-exclamation-triangle-fill me-2"></i>
                    ${message}
                </div>`;
            this.emptyStateElement.style.display = 'block';
        }
    }
    
    showCustomModal() {
        const modal = document.getElementById('reportCardModal');
        const backdrop = document.getElementById('reportCardBackdrop');
        
        if (modal && backdrop) {
            // Add the 'show' class and set display to block
            modal.classList.add('show');
            backdrop.classList.add('show');
            modal.style.display = 'block';
            backdrop.style.display = 'block';
            
            // Add body class to prevent scrolling
            document.body.classList.add('modal-open');
            document.body.style.overflow = 'hidden';
            document.body.style.paddingRight = '15px'; // Prevent content shift from scrollbar
            
            // Focus the modal for accessibility
            modal.setAttribute('aria-hidden', 'false');
            modal.focus();
        }
    }
    
    hideCustomModal() {
        const modal = document.getElementById('reportCardModal');
        const backdrop = document.getElementById('reportCardBackdrop');
        
        if (modal && backdrop) {
            // Remove the 'show' class and hide elements
            modal.classList.remove('show');
            backdrop.classList.remove('show');
            
            // Use setTimeout to allow for the fade-out animation
            setTimeout(() => {
                modal.style.display = 'none';
                backdrop.style.display = 'none';
                
                // Remove body classes and styles
                document.body.classList.remove('modal-open');
                document.body.style.overflow = '';
                document.body.style.paddingRight = '';
                
                // Update aria-hidden for accessibility
                modal.setAttribute('aria-hidden', 'true');
            }, 300); // Match this with your CSS transition duration
        }
    }
}
