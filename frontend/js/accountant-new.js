// Accountant Management Logic
window.feeForm = document.getElementById('fee-form');
window.feeList = document.getElementById('fee-list');
window.feeSearch = document.getElementById('fees-search');

// Make essential functions globally available
window.loadClasses = loadClasses;
window.handleClassChange = handleClassChange;
window.calculateBalance = calculateBalance;

// Define the class structure globally
const CLASS_GROUPS = [
    {
        label: 'Pre-Primary',
        classes: [
            { value: 'Baby Class', text: 'Baby Class' },
            { value: 'PP1', text: 'PP1 (Pre-Primary 1)' },
            { value: 'PP2', text: 'PP2 (Pre-Primary 2)' }
        ]
    },
    {
        label: 'Lower Primary (Grade 1-3)',
        classes: [
            { value: 'Grade 1', text: 'Grade 1' },
            { value: 'Grade 2', text: 'Grade 2' },
            { value: 'Grade 3', text: 'Grade 3' }
        ]
    },
    {
        label: 'Upper Primary (Grade 4-6)',
        classes: [
            { value: 'Grade 4', text: 'Grade 4' },
            { value: 'Grade 5', text: 'Grade 5' },
            { value: 'Grade 6', text: 'Grade 6' }
        ]
    },
    {
        label: 'Junior Secondary (Grade 7-9)',
        classes: [
            { value: 'Grade 7', text: 'Grade 7' },
            { value: 'Grade 8', text: 'Grade 8' },
            { value: 'Grade 9', text: 'Grade 9' }
        ]
    },
    {
        label: 'Senior School (Grade 10-12)',
        classes: [
            { value: 'Grade 10', text: 'Grade 10' },
            { value: 'Grade 11', text: 'Grade 11' },
            { value: 'Grade 12', text: 'Grade 12' }
        ]
    }
];

// Load classes from the hardcoded list
function loadClasses() {
    console.log('Loading classes...');
    const classSelect = document.getElementById('fee-class-name');
    
    if (!classSelect) {
        console.error('Could not find class select element');
        return;
    }
    
    try {
        // Clear existing options
        classSelect.innerHTML = '<option value="">Select a class</option>';
        
        // Populate the dropdown
        CLASS_GROUPS.forEach(group => {
            const optgroup = document.createElement('optgroup');
            optgroup.label = group.label;
            
            group.classes.forEach(cls => {
                const option = document.createElement('option');
                option.value = cls.value;
                option.textContent = cls.text;
                optgroup.appendChild(option);
            });
            
            classSelect.appendChild(optgroup);
        });
        
        console.log('Classes loaded successfully');
        
        // Enable the select and add change handler
        classSelect.disabled = false;
        classSelect.addEventListener('change', handleClassChange);
        
    } catch (error) {
        console.error('Error loading classes:', error);
        classSelect.innerHTML = '<option value="">Error loading classes</option>';
    }
}

// Handle class selection change
async function handleClassChange(event) {
    const classSelect = event.target;
    const className = classSelect.value;
    const studentSelect = document.getElementById('fee-student-id');
    
    if (!className) {
        studentSelect.disabled = true;
        studentSelect.innerHTML = '<option value="">Select a class first</option>';
        return;
    }
    
    studentSelect.disabled = true;
    studentSelect.innerHTML = '<option value="">Loading students...</option>';
    
    try {
        // Try to fetch students from the API
        const token = localStorage.getItem('token');
        const response = await fetch(`http://localhost:5000/api/students/class/${encodeURIComponent(className)}`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        // Debug: Log the API response
        console.log('API Response:', data);
        
        // Check if data is an array or has a data property that's an array
        const students = Array.isArray(data) ? data : (data.data || []);
        
        if (!Array.isArray(students)) {
            throw new Error('Invalid students data format received from server');
        }
        
        // Clear existing options
        studentSelect.innerHTML = '<option value="">Select a student</option>';
        
        if (students.length === 0) {
            studentSelect.innerHTML = '<option value="">No students found in this class</option>';
            return;
        }
        
        // Populate students dropdown
        students.forEach(student => {
            try {
                const option = document.createElement('option');
                option.value = student._id || student.id || '';
                const displayName = student.fullName || student.name || 'Unknown Student';
                const admissionNumber = student.admissionNumber || student.admNo || '';
                option.textContent = admissionNumber ? `${displayName} (${admissionNumber})` : displayName;
                studentSelect.appendChild(option);
            } catch (studentError) {
                console.error('Error processing student:', student, studentError);
            }
        });
        
        studentSelect.disabled = false;
        
    } catch (error) {
        console.error('Error loading students:', error);
        studentSelect.innerHTML = '<option value="">Error loading students. Check console for details.</option>';
        
        // For debugging: Try to load mock data if API fails
        console.log('Loading mock student data for testing...');
        loadMockStudents(studentSelect);
    }
}

// Function to format number as currency
function formatCurrency(amount) {
    const num = parseFloat(amount);
    if (isNaN(num)) return '0.00';
    // Format with 2 decimal places and commas as thousand separators
    return num.toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
}

// Function to format date
function formatDate(dateString) {
    if (!dateString) return 'N/A';
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('en-US', options);
}

// Function to generate receipt
function generateReceipt(paymentData) {
    const receiptWindow = window.open('', '_blank');
    const receiptDate = new Date().toLocaleDateString();
    const receiptTime = new Date().toLocaleTimeString();
    
    const totalPaid = (paymentData.firstInstallment || 0) + 
                     (paymentData.secondInstallment || 0) + 
                     (paymentData.thirdInstallment || 0);
    
    const receiptContent = `
    <!DOCTYPE html>
    <html>
    <head>
        <title>Payment Receipt</title>
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; max-width: 800px; margin: 0 auto; padding: 20px; }
            .header { text-align: center; margin-bottom: 20px; }
            .receipt-title { font-size: 24px; font-weight: bold; margin-bottom: 10px; }
            .receipt-details { margin: 20px 0; }
            .receipt-details p { margin: 5px 0; }
            .receipt-table { width: 100%; border-collapse: collapse; margin: 20px 0; }
            .receipt-table th, .receipt-table td { 
                border: 1px solid #ddd; 
                padding: 8px; 
                text-align: left; 
            }
            .receipt-table th { background-color: #f2f2f2; }
            .total-row { font-weight: bold; }
            .footer { margin-top: 30px; text-align: center; font-size: 14px; }
            .paid-stamp {
                color: #4CAF50;
                border: 2px solid #4CAF50;
                padding: 5px 15px;
                border-radius: 5px;
                font-weight: bold;
                transform: rotate(-15deg);
                display: inline-block;
                margin: 20px 0;
            }
        </style>
    </head>
    <body>
        <div class="header">
            <div class="receipt-title">PAYMENT RECEIPT</div>
            <div>Receipt #${'REC' + Date.now().toString().slice(-6)}</div>
            <div>${receiptDate} at ${receiptTime}</div>
        </div>
        
        <div class="receipt-details">
            <p><strong>Student:</strong> ${paymentData.studentName || 'N/A'}</p>
            <p><strong>Class:</strong> ${paymentData.className || 'N/A'}</p>
            <p><strong>Payment Date:</strong> ${new Date().toLocaleDateString()}</p>
        </div>
        
        <table class="receipt-table">
            <thead>
                <tr>
                    <th>Description</th>
                    <th>Amount (Ksh)</th>
                    <th>Date Paid</th>
                </tr>
            </thead>
            <tbody>
                ${paymentData.firstInstallment ? `
                <tr>
                    <td>First Installment</td>
                    <td>${parseFloat(paymentData.firstInstallment).toLocaleString('en-US', {minimumFractionDigits: 2})}</td>
                    <td>${formatDate(paymentData.firstInstallmentDate)}</td>
                </tr>` : ''}
                ${paymentData.secondInstallment ? `
                <tr>
                    <td>Second Installment</td>
                    <td>${parseFloat(paymentData.secondInstallment).toLocaleString('en-US', {minimumFractionDigits: 2})}</td>
                    <td>${formatDate(paymentData.secondInstallmentDate)}</td>
                </tr>` : ''}
                ${paymentData.thirdInstallment ? `
                <tr>
                    <td>Third Installment</td>
                    <td>${parseFloat(paymentData.thirdInstallment).toLocaleString('en-US', {minimumFractionDigits: 2})}</td>
                    <td>${formatDate(paymentData.thirdInstallmentDate)}</td>
                </tr>` : ''}
                <tr class="total-row">
                    <td><strong>TOTAL PAID</strong></td>
                    <td colspan="2"><strong>${totalPaid.toLocaleString('en-US', {minimumFractionDigits: 2})}</strong></td>
                </tr>
                <tr class="total-row">
                    <td><strong>BALANCE</strong></td>
                    <td colspan="2"><strong>${(paymentData.totalFees - totalPaid).toLocaleString('en-US', {minimumFractionDigits: 2})}</strong></td>
                </tr>
            </tbody>
        </table>
        
        <div style="text-align: center;">
            <div class="paid-stamp">PAID</div>
        </div>
        
        <div class="footer">
            <p>Thank you for your payment!</p>
            <p>For any inquiries, please contact the school office.</p>
            <p>Generated on ${receiptDate} at ${receiptTime}</p>
        </div>
        
        <script>
            window.onload = function() {
                setTimeout(function() {
                    window.print();
                }, 500);
            };
        </script>
    </body>
    </html>
    `;
    
    receiptWindow.document.open();
    receiptWindow.document.write(receiptContent);
    receiptWindow.document.close();
}

// Function to parse currency input
function parseCurrency(value) {
    if (!value) return 0;
    if (typeof value === 'number') return value; // Already a number
    // Remove any non-numeric characters except decimal point and negative sign
    const numericValue = String(value).replace(/[^0-9.-]/g, '');
    const parsed = parseFloat(numericValue);
    return isNaN(parsed) ? 0 : parsed;
}

// Function to calculate and update balance
function calculateBalance() {
    const totalFeesInput = document.getElementById('fee-fees-per-term');
    const firstInstallmentInput = document.getElementById('fee-first-installment');
    const secondInstallmentInput = document.getElementById('fee-second-installment');
    const thirdInstallmentInput = document.getElementById('fee-third-installment');
    const balanceInput = document.getElementById('fee-bal');
    
    if (!totalFeesInput || !balanceInput) return 0;
    
    const totalFees = parseCurrency(totalFeesInput.value);
    const firstInstallment = firstInstallmentInput ? parseCurrency(firstInstallmentInput.value) : 0;
    const secondInstallment = secondInstallmentInput ? parseCurrency(secondInstallmentInput.value) : 0;
    const thirdInstallment = thirdInstallmentInput ? parseCurrency(thirdInstallmentInput.value) : 0;
    
    // Calculate total paid and remaining balance
    let totalPaid = firstInstallment + secondInstallment + thirdInstallment;
    let balance = Math.max(0, totalFees - totalPaid); // Ensure balance doesn't go negative
    
    // Auto-update installments if total paid exceeds total fees
    if (totalPaid > totalFees && totalFees > 0) {
        let excess = totalPaid - totalFees;
        
        // Create installments array in reverse order (3rd to 1st)
        const installments = [
            { input: thirdInstallmentInput, value: thirdInstallment },
            { input: secondInstallmentInput, value: secondInstallment },
            { input: firstInstallmentInput, value: firstInstallment }
        ];
        
        // Adjust installments in reverse order
        for (const installment of installments) {
            if (excess > 0 && installment.input && installment.input.value && installment.value > 0) {
                const newValue = Math.max(0, installment.value - excess);
                installment.input.value = formatCurrency(newValue);
                excess = Math.max(0, excess - installment.value);
                
                // Trigger input event to update any dependent fields
                if (installment.input.dispatchEvent) {
                    const event = new Event('input', { bubbles: true });
                    installment.input.dispatchEvent(event);
                }
            }
        }
        
        // Recalculate with adjusted values
        return calculateBalance();
    }
    
    // Update balance field
    if (balanceInput) {
        const displayValue = balance <= 0 ? '0.00' : balance.toFixed(2);
        
        // For number inputs, we need to set the raw number value
        if (balanceInput.type === 'number') {
            balanceInput.value = balance <= 0 ? '0' : balance.toString();
        } else {
            balanceInput.value = displayValue;
        }
        
        // Update balance color based on value
        if (balance <= 0) {
            balanceInput.classList.remove('text-red-600');
            balanceInput.classList.add('text-green-600');
            if (balanceInput.type !== 'number') {
                balanceInput.value = '0.00';
            } else {
                balanceInput.value = '0';
            }
        } else {
            balanceInput.classList.remove('text-green-600');
            balanceInput.classList.add('text-red-600');
        }
    }
    
    return balance;
}

// Initialize the fee form
function initializeFeeForm() {
    console.log('Initializing fee form');
    
    // Get form elements
    const feeForm = document.getElementById('fee-form');
    const classSelect = document.getElementById('fee-class-name');
    const studentSelect = document.getElementById('fee-student-id');
    const totalFeesInput = document.getElementById('fee-fees-per-term');
    const firstInstallmentInput = document.getElementById('fee-first-installment');
    const secondInstallmentInput = document.getElementById('fee-second-installment');
    const thirdInstallmentInput = document.getElementById('fee-third-installment');
    const firstInstallmentDate = document.getElementById('fee-first-installment-date');
    const secondInstallmentDate = document.getElementById('fee-second-installment-date');
    const thirdInstallmentDate = document.getElementById('fee-third-installment-date');
    const balanceInput = document.getElementById('fee-bal');
    const dueDateInput = document.getElementById('fee-due-date');
    const printReceiptBtn = document.getElementById('print-receipt-btn');
    
    if (!feeForm || !classSelect || !studentSelect) {
        console.error('Required form elements not found');
        return;
    }
    
    // Set default dates to today
    const today = new Date().toISOString().split('T')[0];
    if (firstInstallmentDate) firstInstallmentDate.value = today;
    if (secondInstallmentDate) secondInstallmentDate.value = today;
    if (thirdInstallmentDate) thirdInstallmentDate.value = today;
    
    // Add event listeners
    classSelect.addEventListener('change', handleClassChange);
    
    // Format currency on blur
    function formatCurrencyOnBlur(input) {
        if (!input) return;
        input.addEventListener('blur', function() {
            if (this.value) {
                if (this.type === 'number') {
                    // For number inputs, just ensure it's a valid number
                    const num = parseCurrency(this.value);
                    this.value = isNaN(num) ? '0' : num.toString();
                } else {
                    // For text inputs, format as currency
                    this.value = formatCurrency(parseCurrency(this.value));
                }
                calculateBalance();
            }
        });
    }
    
    // Add input formatting and validation
    [totalFeesInput, firstInstallmentInput, secondInstallmentInput, thirdInstallmentInput].forEach(input => {
        if (input) {
            // Format on blur
            formatCurrencyOnBlur(input);
            
            // Recalculate on input
            input.addEventListener('input', function() {
                if (this.type === 'number') {
                    // For number inputs, just ensure it's a valid number
                    const num = parseCurrency(this.value);
                    if (!isNaN(num)) {
                        this.value = num.toString();
                    }
                } else {
                    // For text inputs, clean the input
                    this.value = this.value.replace(/[^0-9.]/g, '')
                        .replace(/\B(?=(\d{3})+(?!\d))/g, '');
                }
                
                // Calculate balance
                calculateBalance();
            });
        }
    });
    
    // Set default due date to today + 30 days
    if (dueDateInput) {
        const today = new Date();
        const futureDate = new Date();
        futureDate.setDate(today.getDate() + 30);
        dueDateInput.valueAsDate = futureDate;
    }
    
    // Form submission handler
    feeForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        // Get form data
        const feesPerTerm = parseCurrency(document.getElementById('fee-fees-per-term')?.value) || 0;
        const dueDate = document.getElementById('fee-due-date').value;
        const balance = parseCurrency(balanceInput.value) || 0;
        
        // Get academic year and term elements
        const academicYearEl = document.getElementById('fee-academic-year');
        const academicTermEl = document.getElementById('fee-academic-term');
        
        // Log the elements and their values for debugging
        console.log('Academic Year Element:', academicYearEl);
        console.log('Academic Term Element:', academicTermEl);
        
        // Get the values
        const academicYear = academicYearEl?.value;
        const academicTerm = academicTermEl?.value;
        
        console.log('Academic Year Value:', academicYear);
        console.log('Academic Term Value:', academicTerm);
        
        // Validate required fields
        if (!academicYear || !academicTerm) {
            alert('Please select both academic year and term');
            return;
        }
        
        // Prepare the basic fee data that matches the backend model
        const formData = {
            student: studentSelect.value,
            className: classSelect.options[classSelect.selectedIndex]?.text || '',
            amount: parseCurrency(totalFeesInput?.value) || 0,
            status: balance <= 0 ? 'Paid' : 'Pending',
            date: new Date(),
            // Academic fields (already validated as required)
            academicYear: academicYear,
            academicTerm: academicTerm,
            // Additional fields
            feesPerTerm: feesPerTerm,
            bal: balance,
            // Installment amounts
            firstInstallment: parseCurrency(firstInstallmentInput?.value) || 0,
            secondInstallment: parseCurrency(secondInstallmentInput?.value) || 0,
            thirdInstallment: parseCurrency(thirdInstallmentInput?.value) || 0
        };
        
        // Add optional fields if they exist
        if (dueDate) formData.dueDate = dueDate;
        if (document.getElementById('fee-notes')?.value) {
            formData.notes = document.getElementById('fee-notes').value;
        }
        
        console.log('Prepared form data:', formData);
        if (document.getElementById('fee-notes')?.value) {
            formData.notes = document.getElementById('fee-notes').value;
        }
        
        console.log('Form data prepared for submission:', JSON.stringify(formData, null, 2));
        
        try {
            console.log('Submitting form data:', formData);
            const token = localStorage.getItem('token');
            console.log('Sending request to server with data:', formData);
            const response = await fetch('http://localhost:5000/api/fees', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(formData)
            });
            
            const responseData = await response.json().catch((e) => {
                console.error('Error parsing JSON response:', e);
                return { error: 'Invalid response from server' };
            });
            
            console.log('Server response:', response.status, response.statusText, responseData);
            
            if (!response.ok) {
                let errorMessage = `Failed to save fee record: ${response.status} ${response.statusText}`;
                if (responseData.error) {
                    errorMessage += `\n${typeof responseData.error === 'string' ? responseData.error : JSON.stringify(responseData.error)}`;
                }
                throw new Error(errorMessage);
            }
            
            console.log('Fee record saved successfully:', responseData);
                
            // Show success message
            const successMessage = document.createElement('div');
            successMessage.className = 'bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative mb-4';
            successMessage.setAttribute('role', 'alert');
            successMessage.innerHTML = `
                <strong class="font-bold">Success!</strong>
                <span class="block sm:inline"> Fee record has been saved successfully.</span>
                <span class="absolute top-0 bottom-0 right-0 px-4 py-3">
                    <svg class="fill-current h-6 w-6 text-green-500" role="button" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                        <title>Close</title>
                        <path d="M14.348 14.849a1.2 1.2 0 0 1-1.697 0L10 11.819l-2.651 3.029a1.2 1.2 0 1 1-1.697-1.697l2.758-3.15-2.759-3.152a1.2 1.2 0 1 1 1.697-1.697L10 8.183l2.651-3.031a1.2 1.2 0 1 1 1.697 1.697l-2.758 3.152 2.758 3.15a1.2 1.2 0 0 1 0 1.698z"/>
                    </svg>
                </span>
            `;
            
            // Insert the success message before the form
            feeForm.parentNode.insertBefore(successMessage, feeForm);
            
            // Remove success message after 5 seconds
            setTimeout(() => {
                successMessage.remove();
            }, 5000);
            
            // Reset form
            feeForm.reset();
            
            // Reset any custom form state
            if (totalFeesInput) totalFeesInput.value = '0';
            if (balanceInput) balanceInput.value = '0';
            if (firstInstallmentInput) firstInstallmentInput.value = '0';
            if (secondInstallmentInput) secondInstallmentInput.value = '0';
            if (thirdInstallmentInput) thirdInstallmentInput.value = '0';
            
            // Always refresh the fee records after successful submission
            if (typeof loadFeesWithFilters === 'function') {
                console.log('Refreshing fee records...');
                loadFeesWithFilters();
            } else {
                console.warn('loadFeesWithFilters function not found');
            }
        } catch (error) {
            console.error('Error saving fee record:', error);
            alert(`Error: ${error.message}\nPlease check console for more details.`);
        }
    });
        
    // Initial balance calculation
    calculateBalance();
}

// Function to load mock students for testing
function loadMockStudents(selectElement) {
    try {
        const mockStudents = [
            { id: '1', fullName: 'Test Student 1', admissionNumber: 'ADM001' },
            { id: '2', fullName: 'Test Student 2', admissionNumber: 'ADM002' },
            { id: '3', fullName: 'Test Student 3', admissionNumber: 'ADM003' }
        ];
        
        selectElement.innerHTML = '<option value="">Select a student (using test data)</option>';
        
        mockStudents.forEach(student => {
            const option = document.createElement('option');
            option.value = student.id;
            option.textContent = `${student.fullName} (${student.admissionNumber})`;
            selectElement.appendChild(option);
        });
        
        selectElement.disabled = false;
        console.log('Loaded mock student data');
    } catch (error) {
        console.error('Error loading mock students:', error);
        selectElement.innerHTML = '<option value="">Error loading test data</option>';
    }
}

// Initialize the page
function initializeAccountantPage() {
    console.log('Initializing accountant page');
    
    // Load classes immediately
    loadClasses();
    
    // Initialize the fee form
    initializeFeeForm();
    
    // Load fee records
    loadFeeRecords();
    
    // For testing: Add a debug button
    const debugButton = document.createElement('button');
    debugButton.textContent = 'Debug: Load Test Students';
    debugButton.style.margin = '10px';
    debugButton.style.padding = '5px 10px';
    debugButton.onclick = () => {
        const studentSelect = document.getElementById('fee-student-id');
        if (studentSelect) {
            loadMockStudents(studentSelect);
        }
    };
    
    const formContainer = document.querySelector('#accountant-section .form-container');
    if (formContainer) {
        formContainer.appendChild(debugButton);
    }
}

// Load and display fee records
async function loadFeeRecords() {
    console.log('Loading fee records...');
    
    // Ensure we're on the records tab
    const recordsTab = document.getElementById('fee-records-section');
    if (!recordsTab || !recordsTab.classList.contains('active')) {
        console.log('Not on fee records tab, not loading records');
        return;
    }
    
    // Get or create the fee list container
    let feeList = document.getElementById('fee-list');
    if (!feeList) {
        console.log('Creating fee list container');
        const recordsContent = document.querySelector('#fee-records-section > div');
        if (!recordsContent) {
            console.error('Could not find fee records section content');
            return;
        }
        feeList = document.createElement('div');
        feeList.id = 'fee-list';
        recordsContent.appendChild(feeList);
    }

    // Show loading state with manual refresh option
    feeList.innerHTML = `
        <div class="flex flex-col items-center py-8">
            <div class="flex items-center mb-4">
                <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                <span class="ml-2">Loading fee records...</span>
            </div>
            <button onclick="loadFeeRecords()" class="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
                <i class="fas fa-sync-alt mr-2"></i>Refresh Manually
            </button>
            <div id="api-status" class="mt-4 text-sm text-gray-600"></div>
        </div>
    `;

    try {
        const token = localStorage.getItem('token');
        if (!token) {
            throw new Error('No authentication token found. Please log in again.');
        }

        console.log('Fetching fee records from API...');
        const response = await fetch('http://localhost:5000/api/fees', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json'
            },
            credentials: 'include' // Include cookies if needed
        });

        console.log('API Response status:', response.status);
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('API Error Response:', {
                status: response.status,
                statusText: response.statusText,
                headers: Object.fromEntries(response.headers.entries()),
                body: errorText
            });
            throw new Error(`Failed to fetch fee records: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        console.log('API Response data:', JSON.stringify(data, null, 2));
        
        // Handle different possible response formats
        let fees = [];
        if (Array.isArray(data)) {
            fees = data;
            console.log(`Found ${fees.length} fee records in root array`);
        } else if (data && Array.isArray(data.fees)) {
            fees = data.fees;
            console.log(`Found ${fees.length} fee records in data.fees`);
        } else if (data && data.data && Array.isArray(data.data)) {
            fees = data.data;
            console.log(`Found ${fees.length} fee records in data.data`);
        } else {
            console.warn('Unexpected API response format:', data);
        }

        // Handle case when no records are found
        if (!fees || fees.length === 0) {
            console.log('No fee records found in the response');
            const apiStatus = document.getElementById('api-status');
            if (apiStatus) {
                apiStatus.textContent = 'No fee records found in the system yet.';
            }
            
            feeList.innerHTML = `
                <div class="text-center py-12">
                    <div class="mx-auto w-24 h-24 text-gray-300 mb-4">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                        </svg>
                    </div>
                    <h3 class="text-lg font-medium text-gray-900 mb-1">No Fee Records Found</h3>
                    <p class="text-gray-500 mb-6">There are no fee records in the system yet or there was an error loading them.</p>
                    <div class="space-x-3">
                        <button onclick="loadFeeRecords()" class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                            <svg class="-ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                            Try Again
                        </button>
                        <button onclick="window.location.href='accountant.html?tab=fee-entry'" class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                            <i class="fas fa-plus-circle mr-2"></i>
                            Add New Fee Payment
                        </button>
                    </div>
                    <div id="api-status" class="mt-4 text-sm text-gray-600"></div>
                </div>
            `;
            return;
        } else {
            console.log(`Found ${fees.length} fee records to display`);
        }

        // Log the fees data for debugging
        console.log('Rendering fee records:', JSON.stringify(fees, null, 2));
        
        // Create the table header
        let tableHTML = `
            <div class="mb-4 flex flex-col space-y-4">
                <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <h2 class="text-xl font-semibold">All Fee Records</h2>
                    <div class="relative w-full sm:w-64">
                        <input type="text" id="fee-search" placeholder="Search by student or class" class="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                        <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <svg class="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                        </div>
                    </div>
                </div>
                <div class="flex flex-wrap gap-4 items-center">
                    <div class="relative w-full sm:w-64">
                        <label for="class-filter" class="block text-sm font-medium text-gray-700 mb-1">Filter by Class</label>
                        <div class="relative">
                            <select id="class-filter" class="block w-full pl-3 pr-10 py-2 text-base border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md bg-white">
                                <option value="">All Classes</option>
                                <optgroup label="Pre-Primary">
                                    <option value="Baby Class">Baby Class</option>
                                    <option value="PP1">PP1 (Pre-Primary 1)</option>
                                    <option value="PP2">PP2 (Pre-Primary 2)</option>
                                </optgroup>
                                <optgroup label="Lower Primary (Grade 1-3)">
                                    <option value="Grade 1">Grade 1</option>
                                    <option value="Grade 2">Grade 2</option>
                                    <option value="Grade 3">Grade 3</option>
                                </optgroup>
                                <optgroup label="Upper Primary (Grade 4-6)">
                                    <option value="Grade 4">Grade 4</option>
                                    <option value="Grade 5">Grade 5</option>
                                    <option value="Grade 6">Grade 6</option>
                                </optgroup>
                                <optgroup label="Junior Secondary (Grade 7-9)">
                                    <option value="Grade 7">Grade 7</option>
                                    <option value="Grade 8">Grade 8</option>
                                    <option value="Grade 9">Grade 9</option>
                                </optgroup>
                                <optgroup label="Senior School (Grade 10-12)">
                                    <option value="Grade 10">Grade 10</option>
                                    <option value="Grade 11">Grade 11</option>
                                    <option value="Grade 12">Grade 12</option>
                                </optgroup>
                            </select>
                            <div class="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                                <svg class="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                                    <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/>
                                </svg>
                            </div>
                        </div>
                    </div>
                    <button id="reset-filters" class="px-3 py-2 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-md">
                        <i class="fas fa-redo-alt mr-1"></i> Reset Filters
                    </button>
                </div>
            </div>
            
            <div class="bg-white shadow overflow-hidden sm:rounded-lg">
                <div class="overflow-x-auto">
                    <table id="fee-table" class="min-w-full divide-y divide-gray-200">
                        <thead class="bg-gray-50">
                            <tr>
                                <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student</th>
                                <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Class</th>
                                <th scope="col" class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Total Fees</th>
                                <th scope="col" class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Paid</th>
                                <th scope="col" class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Balance</th>
                                <th scope="col" class="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                <th scope="col" class="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Due Date</th>
                                <th scope="col" class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody id="fee-records-body" class="bg-white divide-y divide-gray-200">
        `;
        
        // Add each fee record as a table row
        if (fees && fees.length > 0) {
            fees.forEach(fee => {
                console.log('Processing fee record:', fee);
                const studentName = fee.student?.name || fee.studentName || 'N/A';
                const className = fee.class?.name || fee.className || fee.class || 'N/A';
                const totalFees = fee.totalFees || fee.amount || 0;
                const amountPaid = fee.amountPaid || fee.paidAmount || 0;
                const balance = fee.balance || (totalFees - amountPaid);
                const dueDate = fee.dueDate || fee.paymentDate || new Date();
                const status = balance > 0 ? 'Pending' : 'Paid';
                
                tableHTML += `
                    <tr class="hover:bg-gray-50">
                        <td class="px-6 py-4 whitespace-nowrap">
                            <div class="flex items-center">
                                <div class="ml-4">
                                    <div class="text-sm font-medium text-gray-900">${studentName}</div>
                                    <div class="text-xs text-gray-500">${fee.studentId || fee.student?._id || ''}</div>
                                </div>
                            </div>
                        </td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            ${className}
                        </td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right font-medium">
                            KES ${parseFloat(totalFees).toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                        </td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-green-600 text-right font-medium">
                            KES ${parseFloat(amountPaid).toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                        </td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-right">
                            <span class="${balance > 0 ? 'text-red-600' : 'text-green-600'}">
                                KES ${Math.abs(parseFloat(balance)).toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                            </span>
                        </td>
                        <td class="px-6 py-4 whitespace-nowrap text-center">
                            <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${balance > 0 ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'}">
                                ${status}
                            </span>
                        </td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">
                            ${new Date(dueDate).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                        </td>
                        <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                            <button onclick="viewFeeDetails('${fee._id || ''}')" class="text-blue-600 hover:text-blue-900">
                                <i class="fas fa-eye"></i> View
                            </button>
                            <button onclick="event.stopPropagation(); printReceipt('${fee._id || ''}', event)" class="text-indigo-600 hover:text-indigo-900 ml-2">
                                <i class="fas fa-print"></i> Print
                            </button>
                        </td>
                    </tr>
                `;
            });
        } else {
            tableHTML += `
                <tr>
                    <td colspan="8" class="px-6 py-12 text-center text-gray-500">
                        <div class="flex flex-col items-center justify-center">
                            <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                            </svg>
                            <h3 class="mt-2 text-sm font-medium text-gray-900">No fee records found</h3>
                            <p class="mt-1 text-sm text-gray-500">Get started by adding a new fee payment.</p>
                        </div>
                    </td>
                </tr>
            `;
        }
        
        // Close the table HTML
        tableHTML += `
                        </tbody>
                    </table>
                </div>
            </div>
        `;
        
        // Set the HTML and initialize any plugins
        feeList.innerHTML = tableHTML;
        
        // Initialize search and filter functionality
        const searchInput = document.getElementById('fee-search');
        const classFilter = document.getElementById('class-filter');
        const resetFiltersBtn = document.getElementById('reset-filters');
        
        function filterFeeRecords() {
            const searchTerm = searchInput ? searchInput.value.trim().toLowerCase() : '';
            const selectedClass = classFilter ? classFilter.value : '';
            const rows = document.querySelectorAll('#fee-table tbody tr');
            
            let visibleRowCount = 0;
            
            rows.forEach(row => {
                // Skip if not a valid data row (e.g., no data rows, header, etc.)
                if (row.cells.length < 8) return;
                
                const studentName = row.cells[0]?.textContent?.toLowerCase() || '';
                const className = row.cells[1]?.textContent?.trim() || '';
                
                // Check if row matches search term (student name or class)
                const matchesSearch = !searchTerm || 
                    studentName.includes(searchTerm) || 
                    className.toLowerCase().includes(searchTerm);
                
                // Check if row matches selected class
                const matchesClass = !selectedClass || className === selectedClass;
                
                // Show/hide row based on filters
                const shouldShow = matchesSearch && matchesClass;
                row.style.display = shouldShow ? '' : 'none';
                
                if (shouldShow) visibleRowCount++;
            });
            
            // Show/hide no results message
            const noResultsRow = document.getElementById('no-results-message');
            if (visibleRowCount === 0) {
                if (!noResultsRow) {
                    const tbody = document.querySelector('#fee-table tbody');
                    if (tbody) {
                        const tr = document.createElement('tr');
                        tr.id = 'no-results-message';
                        tr.innerHTML = `
                            <td colspan="8" class="px-6 py-4 text-center text-gray-500">
                                No matching records found. Try adjusting your search or filters.
                            </td>
                        `;
                        tbody.appendChild(tr);
                    }
                } else if (noResultsRow) {
                    noResultsRow.style.display = '';
                }
            } else if (noResultsRow) {
                noResultsRow.style.display = 'none';
            }
        }

        // Function to reset all filters
        function resetFilters() {
            if (searchInput) searchInput.value = '';
            if (classFilter) classFilter.selectedIndex = 0; // Reset to 'All Classes'
            
            // Show all data rows and hide any no-results message
            const rows = document.querySelectorAll('#fee-table tbody tr');
            rows.forEach(row => {
                // Skip if this is the no-results message row
                if (row.id !== 'no-results-message') {
                    row.style.display = '';
                }
            });
            
            // Hide no results message if it exists
            const noResultsRow = document.getElementById('no-results-message');
            if (noResultsRow) {
                noResultsRow.style.display = 'none';
            }
        }

        // Add event listeners
        if (searchInput) {
            searchInput.addEventListener('input', filterFeeRecords);
        }
        if (classFilter) {
            classFilter.addEventListener('change', filterFeeRecords);
        }
        if (resetFiltersBtn) {
            resetFiltersBtn.addEventListener('click', resetFilters);
        }

    } catch (error) {
        console.error('Error loading fee records:', error);
        
        // Get the current URL and API endpoint for debugging
        const currentUrl = window.location.href;
        const apiUrl = 'http://localhost:5000/api/fees';
        const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
        
        // Create error details for debugging
        let errorDetails = `Error: ${error.message || 'Unknown error'}\n`;
        errorDetails += `URL: ${currentUrl}\n`;
        errorDetails += `API: ${apiUrl}\n`;
        errorDetails += `Time: ${new Date().toISOString()}\n\n`;
        
        if (error.response) {
            errorDetails += `Status: ${error.response.status}\n`;
            errorDetails += `Status Text: ${error.response.statusText}\n`;
        }
        
        // Show detailed error in console
        console.error('Error Details:', errorDetails);
        
        // Create user-friendly error message
        let userMessage = 'Failed to load fee records. ';
        if (error.message && error.message.includes('Failed to fetch')) {
            userMessage += 'Unable to connect to the server. ';
            if (isLocalhost) {
                userMessage += 'Please make sure the backend server is running at http://localhost:5000';
            } else {
                userMessage += 'Please check your internet connection and try again.';
            }
        } else {
            userMessage += error.message || 'Please try again later.';
        }
        
        // Update the UI with error details
        feeList.innerHTML = `
            <div class="rounded-md bg-red-50 p-6 max-w-2xl mx-auto">
                <div class="flex">
                    <div class="flex-shrink-0">
                        <svg class="h-12 w-12 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
                        </svg>
                    </div>
                    <div class="ml-4 flex-1">
                        <h3 class="text-lg font-medium text-red-800">Unable to Load Fee Records</h3>
                        <div class="mt-2 text-sm text-red-700 space-y-2">
                            <p>${userMessage}</p>
                            ${isLocalhost ? `
                            <details class="mt-3 text-xs bg-red-100 p-2 rounded">
                                <summary class="font-medium cursor-pointer">Technical Details</summary>
                                <pre class="mt-2 whitespace-pre-wrap font-mono">${errorDetails}</pre>
                            </details>
                            ` : ''}
                        </div>
                        <div class="mt-6 flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3">
                            <button onclick="loadFeeRecords()" class="inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500">
                                <i class="fas fa-sync-alt mr-2"></i> Try Again
                            </button>
                            ${isLocalhost ? `
                            <a href="http://localhost:5000/api/fees" target="_blank" class="inline-flex justify-center items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                                <i class="fas fa-external-link-alt mr-2"></i> Test API Endpoint
                            </a>
                            ` : ''}
                            <button onclick="window.location.href='accountant.html?tab=fee-entry'" class="inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                                <i class="fas fa-plus-circle mr-2"></i> Add New Payment
                            </button>
                        </div>
                    </div>
                </div>
            </div>`;
    }
}

// View fee details
function viewFeeDetails(feeId) {
    // Implement view details functionality
    console.log('Viewing fee details for:', feeId);
    // You can implement a modal or redirect to a details page
}

// Print receipt
function printReceipt(feeId, event) {
    console.log('PrintReceipt called with feeId:', feeId, 'event:', event);
    
    // Prevent any default behavior
    if (event) {
        event.preventDefault();
        event.stopPropagation();
    }
    
    // Validate feeId
    if (!feeId) {
        console.error('No feeId provided to printReceipt');
        alert('Error: Missing fee information. Please try again.');
        return;
    }
    
    // Get the token for authentication
    const token = localStorage.getItem('token');
    if (!token) {
        console.error('No authentication token found');
        alert('Please log in to print receipts');
        return;
    }

    // Show loading state on the button
    const printButton = event ? (event.target.tagName === 'BUTTON' ? event.target : event.target.closest('button')) : null;
    let originalButtonContent = '';
    if (printButton) {
        originalButtonContent = printButton.innerHTML;
        printButton.disabled = true;
        printButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Preparing...';
    } else {
        console.warn('Could not find print button in the event');
    }

    console.log('Fetching fee details for ID:', feeId);
    
    // Fetch the fee details
    fetch(`http://localhost:5000/api/fees/${feeId}`, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json',
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache'
        },
        credentials: 'same-origin'
    })
    .then(response => {
        console.log('Received response status:', response.status);
        
        if (!response.ok) {
            // Try to get error details from response
            return response.text().then(text => {
                console.error('Error response:', text);
                throw new Error(`HTTP error! status: ${response.status}, details: ${text}`);
            });
        }
        return response.json().catch(error => {
            console.error('Error parsing JSON response:', error);
            throw new Error('Invalid response format from server');
        });
    })
    .then(fee => {
        if (!fee) {
            throw new Error('No fee data received from server');
        }
        
        console.log('Fee details for receipt:', fee);
        
        try {
            // Generate the receipt HTML
            const receiptHTML = generateReceipt(fee);
            if (!receiptHTML) {
                throw new Error('Failed to generate receipt content');
            }
            
            console.log('Generated receipt HTML, opening print window...');
            
            // Create a new window for printing
            const printWindow = window.open('', '_blank', 'width=800,height=900');
            if (!printWindow || printWindow.closed || typeof printWindow.closed === 'undefined') {
                throw new Error('Pop-up was blocked. Please allow pop-ups for this site.');
            }
            
            // Write the receipt content to the new window
            printWindow.document.open();
            printWindow.document.write(receiptHTML);
            printWindow.document.close();
            
            // Ensure the content is fully loaded before printing
            printWindow.onload = function() {
                console.log('Print window content loaded, initiating print...');
                printWindow.focus();
                
                // Small delay to ensure all resources are loaded
                setTimeout(() => {
                    try {
                        printWindow.print();
                        console.log('Print dialog should be open now');
                    } catch (printError) {
                        console.error('Error calling print:', printError);
                        alert('Error: Could not open print dialog. ' + printError.message);
                    }
                }, 500);
            };
            
        } catch (generationError) {
            console.error('Error generating receipt HTML:', generationError);
            throw new Error('Failed to generate receipt: ' + generationError.message);
        }
    })
    .catch(error => {
        console.error('Error in printReceipt:', error);
        alert('Error generating receipt: ' + (error.message || 'Unknown error occurred'));
    })
    .finally(() => {
        // Reset the print button if it exists
        if (printButton) {
            printButton.disabled = false;
            printButton.innerHTML = originalButtonContent;
        }
    });
}

// Initialize when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM fully loaded - Accountant Page');
    
    // Check if we're on the accountant page
    const accountantSection = document.getElementById('accountant-section');
    if (!accountantSection) {
        console.log('Not on accountant page, skipping initialization');
        return;
    }
    
    // Initialize the page
    try {
        console.log('Initializing accountant page...');
        initializeAccountantPage();
        console.log('Accountant script loaded and initialized');
    } catch (error) {
        console.error('Error initializing accountant page:', error);
    }
});

// If the script is loaded after the DOM is already loaded
if (document.readyState === 'complete' || document.readyState === 'interactive') {
    console.log('DOM already loaded, initializing...');
    const accountantSection = document.getElementById('accountant-section');
    if (accountantSection) {
        initializeAccountantPage();
    }
}
