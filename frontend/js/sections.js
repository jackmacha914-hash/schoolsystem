// Sections Module
const Sections = (() => {
    // Cache DOM elements
    const elements = {
        contentWrapper: document.querySelector('.content-wrapper')
    };

    // Templates
    const templates = {
        // Students Section
        students: `
            <div class="section-header">
                <h2>Student Management</h2>
                <button class="btn btn-primary" id="add-student-btn">
                    <i class="fas fa-plus"></i> Add Student
                </button>
            </div>
            
            <div class="card">
                <div class="card-header">
                    <div class="search-box">
                        <i class="fas fa-search"></i>
                        <input type="text" id="student-search" placeholder="Search students...">
                    </div>
                    <div class="filters">
                        <select id="class-filter">
                            <option value="">All Classes</option>
                            <option value="1">Class 1</option>
                            <option value="2">Class 2</option>
                            <option value="3">Class 3</option>
                        </select>
                    </div>
                </div>
                <div class="card-body">
                    <div class="table-responsive">
                        <table class="data-table">
                            <thead>
                                <tr>
                                    <th><input type="checkbox" id="select-all"></th>
                                    <th>ID</th>
                                    <th>Name</th>
                                    <th>Class</th>
                                    <th>Contact</th>
                                    <th>Status</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody id="students-table-body">
                                <!-- Student rows will be loaded here -->
                            </tbody>
                        </table>
                    </div>
                    <div class="pagination">
                        <button class="btn btn-outline" disabled>Previous</button>
                        <span>Page 1 of 5</span>
                        <button class="btn btn-outline">Next</button>
                    </div>
                </div>
            </div>
        `,

        // Teachers Section
        teachers: `
            <div class="section-header">
                <h2>Teacher Management</h2>
                <button class="btn btn-primary" id="add-teacher-btn">
                    <i class="fas fa-plus"></i> Add Teacher
                </button>
            </div>
            
            <div class="card">
                <div class="card-header">
                    <div class="search-box">
                        <i class="fas fa-search"></i>
                        <input type="text" id="teacher-search" placeholder="Search teachers...">
                    </div>
                    <div class="filters">
                        <select id="department-filter">
                            <option value="">All Departments</option>
                            <option value="math">Mathematics</option>
                            <option value="science">Science</option>
                            <option value="english">English</option>
                        </select>
                    </div>
                </div>
                <div class="card-body">
                    <div class="table-responsive">
                        <table class="data-table">
                            <thead>
                                <tr>
                                    <th>ID</th>
                                    <th>Name</th>
                                    <th>Department</th>
                                    <th>Subjects</th>
                                    <th>Contact</th>
                                    <th>Status</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody id="teachers-table-body">
                                <!-- Teacher rows will be loaded here -->
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        `,

        // Classes Section
        classes: `
            <div class="section-header">
                <h2>Class Management</h2>
                <button class="btn btn-primary" id="add-class-btn">
                    <i class="fas fa-plus"></i> Add Class
                </button>
            </div>
            
            <div class="classes-grid">
                <!-- Class cards will be loaded here -->
                <div class="class-card">
                    <div class="class-card-header">
                        <h3>Class 1A</h3>
                        <span class="badge badge-success">Active</span>
                    </div>
                    <div class="class-card-body">
                        <div class="class-info">
                            <div><i class="fas fa-users"></i> 25 Students</div>
                            <div><i class="fas fa-chalkboard-teacher"></i> Mr. John Smith</div>
                            <div><i class="fas fa-clock"></i> 8:00 AM - 2:00 PM</div>
                        </div>
                        <div class="class-actions">
                            <button class="btn btn-sm btn-outline">View Details</button>
                            <button class="btn btn-sm btn-primary">Attendance</button>
                        </div>
                    </div>
                </div>
                <!-- More class cards... -->
            </div>
        `,

        // Attendance Section
        attendance: `
            <div class="section-header">
                <h2>Attendance Management</h2>
                <div class="date-selector">
                    <button class="btn btn-outline"><i class="fas fa-chevron-left"></i></button>
                    <span>Today, June 6, 2025</span>
                    <button class="btn btn-outline"><i class="fas fa-chevron-right"></i></button>
                </div>
            </div>
            
            <div class="card">
                <div class="card-header">
                    <div class="tabs">
                        <button class="tab-btn active" data-tab="by-class">By Class</button>
                        <button class="tab-btn" data-tab="by-student">By Student</button>
                    </div>
                    <button class="btn btn-primary">
                        <i class="fas fa-download"></i> Export
                    </button>
                </div>
                <div class="card-body">
                    <div id="attendance-by-class">
                        <!-- Attendance by class content -->
                        <p>Select a class to view or mark attendance.</p>
                    </div>
                </div>
            </div>
        `,

        // Grades Section
        grades: `
            <div class="section-header">
                <h2>Gradebook</h2>
                <div class="filters">
                    <select id="term-filter">
                        <option value="">All Terms</option>
                        <option value="1">Term 1</option>
                        <option value="2">Term 2</option>
                        <option value="3">Term 3</option>
                    </select>
                    <select id="subject-filter">
                        <option value="">All Subjects</option>
                        <option value="math">Mathematics</option>
                        <option value="science">Science</option>
                        <option value="english">English</option>
                    </select>
                </div>
            </div>
            
            <div class="card">
                <div class="card-body">
                    <div class="grade-summary">
                        <div class="grade-card">
                            <h3>Class Average</h3>
                            <div class="grade-percentage">85%</div>
                            <div class="grade-progress">
                                <div class="progress-bar" style="width: 85%;"></div>
                            </div>
                        </div>
                        <!-- More grade summary cards... -->
                    </div>
                    
                    <div class="grade-distribution">
                        <h3>Grade Distribution</h3>
                        <div class="chart-container">
                            <canvas id="grade-chart"></canvas>
                        </div>
                    </div>
                </div>
            </div>
        `,

        // Timetable Section
        timetable: `
            <div class="section-header">
                <h2>School Timetable</h2>
                <div class="timetable-actions">
                    <button class="btn btn-outline">
                        <i class="fas fa-print"></i> Print
                    </button>
                    <button class="btn btn-primary">
                        <i class="fas fa-plus"></i> Add Event
                    </button>
                </div>
            </div>
            
            <div class="card">
                <div class="card-header">
                    <div class="tabs">
                        <button class="tab-btn active" data-view="weekly">Weekly</button>
                        <button class="tab-btn" data-view="daily">Daily</button>
                        <button class="tab-btn" data-view="teacher">Teacher</button>
                        <button class="tab-btn" data-view="class">Class</button>
                    </div>
                    <div class="date-navigation">
                        <button class="btn btn-icon"><i class="fas fa-chevron-left"></i></button>
                        <span>June 6 - 12, 2025</span>
                        <button class="btn btn-icon"><i class="fas fa-chevron-right"></i></button>
                    </div>
                </div>
                <div class="card-body">
                    <div class="timetable">
                        <!-- Timetable will be generated by JavaScript -->
                    </div>
                </div>
            </div>
        `,

        // Settings Section
        settings: `
            <div class="section-header">
                <h2>System Settings</h2>
                <button class="btn btn-primary" id="save-settings">
                    <i class="fas fa-save"></i> Save Changes
                </button>
            </div>
            
            <div class="settings-container">
                <div class="settings-sidebar">
                    <button class="settings-tab active" data-tab="general">
                        <i class="fas fa-cog"></i> General
                    </button>
                    <button class="settings-tab" data-tab="school">
                        <i class="fas fa-school"></i> School Info
                    </button>
                    <button class="settings-tab" data-tab="academic">
                        <i class="fas fa-graduation-cap"></i> Academic
                    </button>
                    <button class="settings-tab" data-tab="notifications">
                        <i class="fas fa-bell"></i> Notifications
                    </button>
                    <button class="settings-tab" data-tab="users">
                        <i class="fas fa-users"></i> Users & Roles
                    </button>
                    <button class="settings-tab" data-tab="backup">
                        <i class="fas fa-database"></i> Backup & Restore
                    </button>
                </div>
                
                <div class="settings-content">
                    <!-- General Settings Panel -->
                    <div id="general-settings" class="settings-panel">
                        <h3>General Settings</h3>
                        <div class="form-group">
                            <label>School Name</label>
                            <input type="text" class="form-control" value="Excel School">
                        </div>
                        <div class="form-group">
                            <label>School Logo</label>
                            <div class="file-upload">
                                <input type="file" id="logo-upload" accept="image/*">
                                <label for="logo-upload" class="btn btn-outline">
                                    <i class="fas fa-upload"></i> Upload Logo
                                </label>
                            </div>
                        </div>
                        <!-- More general settings... -->
                    </div>
                    
                    <!-- School Info Panel -->
                    <div id="school-settings" class="settings-panel">
                        <h3>School Information</h3>
                        <div class="form-group">
                            <label>School Name</label>
                            <input type="text" class="form-control" placeholder="Enter school name">
                        </div>
                        <div class="form-group">
                            <label>Address</label>
                            <textarea class="form-control" rows="3" placeholder="Enter school address"></textarea>
                        </div>
                        <div class="form-group">
                            <label>Phone Number</label>
                            <input type="tel" class="form-control" placeholder="Enter phone number">
                        </div>
                        <div class="form-group">
                            <label>Email</label>
                            <input type="email" class="form-control" placeholder="Enter school email">
                        </div>
                    </div>
                    
                    <!-- Academic Panel -->
                    <div id="academic-settings" class="settings-panel">
                        <h3>Academic Settings</h3>
                        <div class="form-group">
                            <label>Academic Year</label>
                            <input type="text" class="form-control" placeholder="e.g., 2024-2025">
                        </div>
                        <div class="form-group">
                            <label>Grading System</label>
                            <select class="form-control">
                                <option>Percentage (0-100%)</option>
                                <option>Letter Grades (A-F)</option>
                                <option>GPA (0-4.0)</option>
                            </select>
                        </div>
                    </div>
                    
                    <!-- Notifications Panel -->
                    <div id="notifications-settings" class="settings-panel">
                        <h3>Notification Settings</h3>
                        <div class="form-group">
                            <label>Email Notifications</label>
                            <div class="form-check">
                                <input class="form-check-input" type="checkbox" id="email-notifications" checked>
                                <label class="form-check-label" for="email-notifications">
                                    Enable email notifications
                                </label>
                            </div>
                        </div>
                        <div class="form-group">
                            <label>Push Notifications</label>
                            <div class="form-check">
                                <input class="form-check-input" type="checkbox" id="push-notifications" checked>
                                <label class="form-check-label" for="push-notifications">
                                    Enable push notifications
                                </label>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Users & Roles Panel -->
                    <div id="users-settings" class="settings-panel">
                        <h3>User Management</h3>
                        <div class="form-group">
                            <label>User Registration</label>
                            <select class="form-control">
                                <option>Admin Approval Required</option>
                                <option>Open Registration</option>
                                <option>Invitation Only</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label>Default User Role</label>
                            <select class="form-control">
                                <option>Student</option>
                                <option>Teacher</option>
                                <option>Staff</option>
                            </select>
                        </div>
                    </div>
                    
                    <!-- Backup & Restore Panel -->
                    <div id="backup-settings" class="settings-panel">
                        <h3>Backup & Restore</h3>
                        <div class="form-group">
                            <label>Automatic Backups</label>
                            <select class="form-control">
                                <option>Daily</option>
                                <option>Weekly</option>
                                <option>Monthly</option>
                                <option>Disabled</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label>Create Backup</label>
                            <button class="btn btn-primary">
                                <i class="fas fa-download"></i> Download Backup
                            </button>
                        </div>
                        <div class="form-group">
                            <label>Restore from Backup</label>
                            <div class="file-upload">
                                <input type="file" id="restore-backup" accept=".json,.sql">
                                <label for="restore-backup" class="btn btn-outline">
                                    <i class="fas fa-upload"></i> Upload Backup
                                </label>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `
    };

    // Initialize tabs for a section
    function initTabs(container) {
        if (!container) return;
        
        // Find all tab links in this container
        const tabLinks = container.querySelectorAll('[data-bs-toggle="tab"], [data-toggle="tab"]');
        
        tabLinks.forEach(tabLink => {
            // Add click handler if not already added
            if (!tabLink.hasAttribute('data-tab-initialized')) {
                tabLink.setAttribute('data-tab-initialized', 'true');
                
                tabLink.addEventListener('click', function(e) {
                    e.preventDefault();
                    
                    // Get the target tab pane
                    const targetId = this.getAttribute('href') || this.getAttribute('data-bs-target');
                    if (!targetId) return;
                    
                    // Update URL with tab parameter
                    const currentUrl = new URL(window.location);
                    const tabId = targetId.startsWith('#') ? targetId.substring(1) : targetId;
                    currentUrl.hash = `${window.location.hash.split('?')[0]}?tab=${tabId}`;
                    window.history.pushState({}, '', currentUrl);
                    
                    // Update active tab
                    updateActiveTab(container, tabLink, targetId);
                });
            }
        });
        
        // Check URL for tab parameter on initial load
        const urlParams = new URLSearchParams(window.location.search);
        const activeTabId = urlParams.get('tab');
        
        if (activeTabId) {
            const activeTab = container.querySelector(`[href="#${activeTabId}"], [data-bs-target="#${activeTabId}"]`);
            if (activeTab) {
                updateActiveTab(container, activeTab, `#${activeTabId}`);
            }
        } else if (tabLinks.length > 0) {
            // Activate first tab by default if none is active
            const firstTab = tabLinks[0];
            const firstTabId = firstTab.getAttribute('href') || firstTab.getAttribute('data-bs-target');
            if (firstTabId) {
                updateActiveTab(container, firstTab, firstTabId);
            }
        }
    }
    
    // Update active tab and show corresponding content
    function updateActiveTab(container, activeTab, targetId) {
        if (!container || !activeTab || !targetId) return;
        
        // Get all tab panes in this container
        const tabPanes = container.querySelectorAll('.tab-pane');
        const tabLinks = container.querySelectorAll('.nav-link');
        
        // Remove active class from all tabs and panes
        tabLinks.forEach(link => {
            link.classList.remove('active');
            link.setAttribute('aria-selected', 'false');
        });
        
        tabPanes.forEach(pane => {
            pane.classList.remove('active', 'show');
        });
        
        // Add active class to clicked tab and show corresponding pane
        activeTab.classList.add('active');
        activeTab.setAttribute('aria-selected', 'true');
        
        const targetPane = document.querySelector(targetId);
        if (targetPane) {
            targetPane.classList.add('active', 'show');
        }
    }
    
    // Public methods
    return {
        // Get content for a specific section
        getSectionContent: function(sectionId) {
            const section = sectionId.replace('#', '');
            return templates[section] || '<div class="empty-state">Content not available</div>';
        },
        
        // Initialize section-specific functionality
        initSection: function(sectionId) {
            console.log('Initializing section:', sectionId);
            const container = document.querySelector('.content-wrapper');
            if (!container) {
                console.warn('Content wrapper not found');
                return;
            }
            
            // Small delay to ensure DOM is fully rendered
            setTimeout(() => {
                // Initialize tabs if they exist in this section
                const tabs = container.querySelectorAll('.settings-tab, .tab-btn, [data-bs-toggle="tab"], [data-toggle="tab"]');
                console.log('Found tabs:', tabs.length);
                
                if (tabs && tabs.length > 0) {
                    // Check URL for active tab
                    const urlParams = new URLSearchParams(window.location.search);
                    const activeTabFromUrl = urlParams.get('tab');
                    let activeTab = null;
                    
                    if (activeTabFromUrl) {
                        // Try to find the tab that matches the URL parameter
                        activeTab = container.querySelector(`[href="#${activeTabFromUrl}"], 
                                                         [data-bs-target="#${activeTabFromUrl}"], 
                                                         [data-target="#${activeTabFromUrl}"],
                                                         [data-tab="${activeTabFromUrl.replace('-settings', '')}"]`);
                    }
                    
                    // If no tab from URL, try to find an active tab
                    if (!activeTab) {
                        activeTab = container.querySelector('.settings-tab.active, .tab-btn.active, .nav-link.active, .active[data-bs-toggle="tab"], .active[data-toggle="tab"]');
                    }
                    
                    // If still no active tab, use the first one
                    if (!activeTab && tabs.length > 0) {
                        activeTab = tabs[0];
                    }
                    
                    // Activate the found tab
                    if (activeTab) {
                        // Remove active class from all tabs
                        tabs.forEach(tab => tab.classList.remove('active'));
                        
                        // Add active class to the active tab
                        activeTab.classList.add('active');
                        
                        // Get the target panel ID
                        let targetId = activeTab.getAttribute('href') || 
                                    activeTab.getAttribute('data-bs-target') || 
                                    activeTab.getAttribute('data-target');
                        
                        // For custom tabs with data-tab attribute
                        if (!targetId && activeTab.dataset.tab) {
                            targetId = `#${activeTab.dataset.tab}-settings`;
                        }
                        
                        // Show the target panel
                        if (targetId) {
                            const targetPanel = document.querySelector(targetId);
                            if (targetPanel) {
                                // Hide all panels in the same container
                                const panelContainer = targetPanel.closest('.settings-content, .tab-content, .content-wrapper') || document;
                                const panels = panelContainer.querySelectorAll('.settings-panel, .tab-pane, .panel');
                                panels.forEach(panel => {
                                    panel.classList.remove('active', 'show');
                                });
                                
                                // Show the target panel
                                targetPanel.classList.add('active', 'show');
                                console.log('Activated panel:', targetId);
                            } else {
                                console.warn('Target panel not found:', targetId);
                            }
                        }
                    }
                }
                
                // Section-specific initializations
                if (sectionId === '#grades') {
                    this.initGradeChart();
                }
            }, 100); // Slightly longer delay to ensure all DOM is ready
        },
        
        // Initialize grade chart
        initGradeChart: function() {
            // Chart initialization code will go here
            console.log('Grade chart initialized');
        }
    };
})();
