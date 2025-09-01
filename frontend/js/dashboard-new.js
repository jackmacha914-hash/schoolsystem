// Dashboard Module
const Dashboard = (() => {
    // Cache DOM elements
    const elements = {
        sidebar: document.querySelector('.sidebar'),
        sidebarToggle: document.querySelector('.sidebar-toggle'),
        mainContent: document.querySelector('.main-content'),
        contentWrapper: document.querySelector('.content-wrapper'),
        navLinks: document.querySelectorAll('.nav-link'),
        logoutBtn: document.getElementById('logout-btn'),
        notificationContainer: document.getElementById('notification-container'),
        loadingIndicator: document.getElementById('loading-indicator')
    };
    
    // State
    const state = {
        currentSection: 'dashboard',
        isLoading: false
    };

    // Load saved sidebar state
    function loadSidebarState() {
        // Only apply saved state on desktop
        if (window.innerWidth > 992) {
            const isCollapsed = localStorage.getItem('sidebarCollapsed') === 'true';
            const sidebar = document.getElementById('main-sidebar');
            const mainContent = document.querySelector('.main-content');
            
            if (isCollapsed && sidebar && mainContent) {
                sidebar.classList.add('collapsed');
                mainContent.classList.add('expanded');
            }
        }
    }

    // Initialize the dashboard
    function init() {
        // Set up mobile menu toggle
        const mobileMenuToggle = document.getElementById('mobile-menu-toggle');
        if (mobileMenuToggle) {
            mobileMenuToggle.addEventListener('click', toggleSidebar);
        }
        
        // Set up sidebar overlay
        setupSidebarOverlay();
        
        // Handle window resize
        let resizeTimer;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimer);
            resizeTimer = setTimeout(() => {
                handleResize();
            }, 250);
        });
        
        // Handle tab clicks using event delegation for dynamically loaded content
        document.addEventListener('click', (e) => {
            // Check for different types of tab elements
            let tabLink = e.target.closest('[data-bs-toggle="tab"], [data-toggle="tab"], .tab-btn, .settings-tab');
            
            // If clicking on an icon inside the tab, find the parent tab
            if (!tabLink && e.target.closest('i')) {
                tabLink = e.target.closest('i').parentElement;
            }
            
            if (!tabLink) return;
            
            e.preventDefault();
            e.stopPropagation();
            
            // Get the target tab pane
            let target = tabLink.getAttribute('href') || 
                        tabLink.getAttribute('data-bs-target') ||
                        tabLink.getAttribute('data-target');
            
            // For custom tabs with data-tab attribute
            if (!target && tabLink.dataset.tab) {
                target = `#${tabLink.dataset.tab}-settings`;
            }
            
            if (!target) return;
            
            // Update URL with tab parameter
            const currentUrl = new URL(window.location);
            const tabId = target.startsWith('#') ? target.substring(1) : target;
            const section = currentUrl.hash.split('?')[0] || '#dashboard';
            currentUrl.hash = `${section}?tab=${tabId}`;
            
            // Update the URL without triggering a page reload
            window.history.replaceState({}, '', currentUrl);
            
            // Update the active tab
            updateActiveTab(tabLink, target);
        });
        
        // Handle browser back/forward navigation
        window.addEventListener('popstate', updateActiveNav);
        
        // Initial resize handling
        handleResize();
        
        // Set up event listeners
        setupEventListeners();
        
        // Load saved sidebar state
        loadSidebarState();
        
        // Initial navigation and tab update
        updateActiveNav();
        
        // Load initial data
        loadInitialData();
        
        console.log('Dashboard initialized');
    }

    // Set up event listeners
    function setupEventListeners() {
        // Sidebar toggle
        if (elements.sidebarToggle) {
            elements.sidebarToggle.addEventListener('click', toggleSidebar);
        }

        // Navigation links
        elements.navLinks.forEach(link => {
            link.addEventListener('click', handleNavClick);
        });

        // Logout button
        if (elements.logoutBtn) {
            elements.logoutBtn.addEventListener('click', handleLogout);
        }

        // Handle browser back/forward
        window.addEventListener('popstate', updateActiveNav);
    }

    // Toggle sidebar
    function toggleSidebar() {
        const sidebar = document.getElementById('main-sidebar');
        const mainContent = document.querySelector('.main-content');
        const body = document.body;
        
        if (sidebar && mainContent) {
            // Check if we're on mobile
            const isMobile = window.innerWidth <= 992;
            
            if (isMobile) {
                // On mobile, show/hide the sidebar with overlay
                body.classList.toggle('sidebar-open');
                sidebar.classList.toggle('show-mobile');
                document.getElementById('sidebar-overlay').classList.toggle('active');
            } else {
                // On desktop, toggle collapsed state
                sidebar.classList.toggle('collapsed');
                mainContent.classList.toggle('expanded');
            }
            
            // Save the state to localStorage (for desktop only)
            if (!isMobile) {
                const isCollapsed = sidebar.classList.contains('collapsed');
                localStorage.setItem('sidebarCollapsed', isCollapsed);
                
                // Dispatch a custom event for other components
                document.dispatchEvent(new CustomEvent('sidebarToggled', { 
                    detail: { isCollapsed } 
                }));
            }
        }
    }

    // Close sidebar when clicking on overlay (mobile)
    function setupSidebarOverlay() {
        const overlay = document.getElementById('sidebar-overlay');
        if (overlay) {
            overlay.addEventListener('click', () => {
                document.body.classList.remove('sidebar-open');
                document.getElementById('main-sidebar').classList.remove('show-mobile');
                overlay.classList.remove('active');
            });
        }
    }

    // Handle navigation link clicks
    function handleNavClick(e) {
        e.preventDefault();
        const target = e.currentTarget.getAttribute('href');
        if (target) {
            navigateTo(target);
        }
    }

    // Navigate to a specific section
    function navigateTo(section) {
        if (state.isLoading) return;
        
        // Update state
        state.currentSection = section.replace('#', '');
        state.isLoading = true;
        
        // Show loading state
        showLoading(true);
        
        // Update URL without page reload
        history.pushState({ section }, '', section);
        
        // Update active navigation
        updateActiveNav();
        
        // Load section content
        loadSectionContent(section)
            .then(() => {
                // Initialize section-specific functionality
                Sections.initSection(section);
                
                // Update document title
                document.title = `${state.currentSection.charAt(0).toUpperCase() + state.currentSection.slice(1)} | School Management System`;
                
                // Scroll to top
                window.scrollTo(0, 0);
            })
            .catch(error => {
                console.error('Error loading section:', error);
                showNotification('Failed to load section content', 'error');
            })
            .finally(() => {
                state.isLoading = false;
                showLoading(false);
            });
    }

    // Update the active tab
    function updateActiveTab(activeTab, targetId) {
        if (!activeTab) return;
        
        console.log('Updating active tab:', activeTab, targetId);
        
        // Get the tab container (either the direct parent or the tablist)
        const tabContainer = activeTab.closest('.nav-tabs, .nav-pills, .tabs, .settings-sidebar, .nav');
                           
        if (tabContainer) {
            // Get all tabs in this container
            const tabs = tabContainer.querySelectorAll('.nav-link, .tab-btn, .settings-tab, [data-bs-toggle="tab"], [data-toggle="tab"]');
            
            // Remove active class from all tabs in this container
            tabs.forEach(tab => {
                tab.classList.remove('active');
                tab.setAttribute('aria-selected', 'false');
            });
            
            // Add active class to the clicked tab
            activeTab.classList.add('active');
            activeTab.setAttribute('aria-selected', 'true');
        }
        
        // If targetId is provided, show the corresponding panel
        if (targetId) {
            const targetPanel = document.querySelector(targetId);
            if (targetPanel) {
                // Hide all panels in the same container
                const panelContainer = targetPanel.closest('.settings-content, .card-body, .tab-content, .content-wrapper') || document;
                const panels = panelContainer.querySelectorAll('.tab-pane, .settings-panel, .timetable-view, .panel');
                
                panels.forEach(panel => {
                    panel.classList.remove('show', 'active');
                });
                
                targetPanel.classList.add('show', 'active');
                console.log('Showing panel:', targetId);
            } else {
                console.warn('Target panel not found:', targetId);
            }
        } else if (activeTab.dataset.tab) {
            // Handle data-tab attribute for custom tabs
            const tabId = activeTab.dataset.tab;
            const targetPanel = document.querySelector(`#${tabId}-settings`);
            if (targetPanel) {
                const panelContainer = targetPanel.closest('.settings-content, .content-wrapper') || document;
                const panels = panelContainer.querySelectorAll('.settings-panel, .panel');
                
                panels.forEach(panel => {
                    panel.classList.remove('show', 'active');
                });
                
                targetPanel.classList.add('show', 'active');
                console.log('Showing panel from data-tab:', `#${tabId}-settings`);
            } else {
                console.warn('Target panel not found for data-tab:', tabId);
            }
        }
    }
    
    // Update active navigation item and tabs
    function updateActiveNav() {
        // Get the current hash or default to dashboard
        const currentHash = window.location.hash || '#dashboard';
        const currentPath = currentHash.split('?')[0]; // Remove query params
        state.currentSection = currentPath.replace('#', '');
        
        // Get the active tab from URL if it exists
        const urlParams = new URLSearchParams(window.location.search);
        const activeTabId = urlParams.get('tab');
        
        // Update active state in main navigation
        if (elements.navLinks && elements.navLinks.length > 0) {
            elements.navLinks.forEach(link => {
                if (!link) return;
                
                const linkPath = link.getAttribute('href');
                if (!linkPath) return;
                
                // Check if this link's path matches the current section
                const linkSection = linkPath.split('?')[0];
                const isActive = linkSection === currentPath;
                
                // Update link active state
                link.classList.toggle('active', isActive);
                link.setAttribute('aria-current', isActive ? 'page' : null);
                
                // Update parent list item if it exists
                const parentItem = link.closest('li');
                if (parentItem) {
                    parentItem.classList.toggle('active', isActive);
                }
                
                // If this is the active section and has tabs, initialize them
                if (isActive && activeTabId) {
                    // Small delay to ensure DOM is updated
                    setTimeout(() => {
                        const tabToActivate = document.querySelector(`[href="#${activeTabId}"], [data-bs-target="#${activeTabId}"]`);
                        if (tabToActivate) {
                            updateActiveTab(tabToActivate, `#${activeTabId}`);
                        }
                    }, 50);
                }
            });
        }
        
        // Initialize tabs in the current section if they exist
        if (activeTabId) {
            // Try different selectors to find the tab
            const tabSelectors = [
                `[href="#${activeTabId}"]`,
                `[data-bs-target="#${activeTabId}"]`,
                `[data-tab="${activeTabId.replace('-settings', '')}"]`,
                `[data-target="#${activeTabId}"]`
            ];
            
            let tabToActivate = null;
            for (const selector of tabSelectors) {
                tabToActivate = document.querySelector(selector);
                if (tabToActivate) break;
            }
            
            if (tabToActivate) {
                updateActiveTab(tabToActivate, `#${activeTabId}`);
            }
        } else {
            // Activate first tab by default if no tab is specified
            const firstTabSelectors = [
                '.nav-tabs .nav-link:first-child',
                '.tabs .tab-btn:first-child',
                '.settings-sidebar .settings-tab:first-child'
            ];
            
            let firstTab = null;
            for (const selector of firstTabSelectors) {
                firstTab = document.querySelector(selector);
                if (firstTab) break;
            }
            
            if (firstTab) {
                const targetId = firstTab.getAttribute('href') || 
                               firstTab.getAttribute('data-bs-target') ||
                               firstTab.getAttribute('data-target') ||
                               (firstTab.dataset.tab ? `#${firstTab.dataset.tab}-settings` : null);
                               
                if (targetId) {
                    updateActiveTab(firstTab, targetId);
                } else {
                    // If no target ID, just activate the tab without a target
                    updateActiveTab(firstTab);
                }
            }
        }
        
        // Update page title in the header if it exists
        const pageTitle = document.querySelector('.page-title');
        if (pageTitle) {
            const titleText = state.currentSection
                .split('-')
                .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                .join(' ');
            pageTitle.textContent = titleText;
        }
        
        // Close mobile menu after navigation
        if (window.innerWidth <= 992) {
            const sidebar = document.getElementById('main-sidebar');
            const overlay = document.getElementById('sidebar-overlay');
            if (sidebar && overlay) {
                sidebar.classList.remove('show-mobile');
                overlay.classList.remove('active');
                document.body.classList.remove('sidebar-open');
            }
        }
    }

    // Load content for a section
    async function loadSectionContent(section) {
        try {
            // Get content from our Sections module
            const content = await Sections.getSectionContent(section);
            
            // Update the content wrapper
            if (elements.contentWrapper) {
                elements.contentWrapper.innerHTML = content;
            } else {
                throw new Error('Content wrapper not found');
            }
        } catch (error) {
            console.error('Error loading section content:', error);
            throw error;
        }
    }

    // Show/hide loading state
    function showLoading(isLoading) {
        // Implement loading state UI
        const loader = document.getElementById('loading-indicator');
        if (loader) {
            loader.style.display = isLoading ? 'block' : 'none';
        }
    }

    // Show notification
    function showNotification(message, type = 'info') {
        if (!elements.notificationContainer) return;
        
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <i class="fas ${getNotificationIcon(type)}"></i>
                <span>${message}</span>
            </div>
            <button class="notification-close">&times;</button>
        `;
        
        // Auto-remove notification after delay
        const removeNotification = () => {
            notification.style.animation = 'fadeOut 0.3s forwards';
            setTimeout(() => notification.remove(), 300);
        };
        
        // Close button
        const closeBtn = notification.querySelector('.notification-close');
        closeBtn.addEventListener('click', removeNotification);
        
        elements.notificationContainer.appendChild(notification);
        
        // Auto-remove after delay
        setTimeout(removeNotification, 5000);
    }

    // Get icon for notification type
    function getNotificationIcon(type) {
        const icons = {
            'success': 'fa-check-circle',
            'error': 'exclamation-circle',
            'warning': 'exclamation-triangle',
            'info': 'info-circle'
        };
        return icons[type] || 'info-circle';
    }

    // Handle logout
    function handleLogout() {
        // Clear user session
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        
        // Redirect to login page
        window.location.href = '/login.html';
    }

    // Load initial data
    async function loadInitialData() {
        try {
            // Load dashboard stats
            const { data: stats } = await dashboardApi.getQuickStats();
            
            // Update the UI with the fetched data
            updateDashboardStats(stats);
            
            // Load recent activities
            const { data: activities } = await dashboardApi.getRecentActivities();
            updateRecentActivities(activities);
            
        } catch (error) {
            console.error('Error loading initial data:', error);
            showNotification('Failed to load dashboard data', 'error');
        }
    }
    
    // Update dashboard statistics
    function updateDashboardStats(stats) {
        if (!stats) return;
        
        // Update the stats cards
        const studentCount = document.getElementById('student-count');
        const teacherCount = document.getElementById('teacher-count');
        const classCount = document.getElementById('class-count');
        const attendanceCount = document.getElementById('attendance-count');
        
        if (studentCount) studentCount.textContent = stats.totalStudents.toLocaleString();
        if (teacherCount) teacherCount.textContent = stats.totalTeachers.toLocaleString();
        if (classCount) classCount.textContent = stats.totalClasses.toLocaleString();
        if (attendanceCount) attendanceCount.textContent = `${stats.attendanceRate}%`;
    }
    
    // Update recent activities
    function updateRecentActivities(activities) {
        const activitiesContainer = document.querySelector('.activity-list');
        if (!activitiesContainer || !activities?.length) return;
        
        // Clear existing activities
        activitiesContainer.innerHTML = '';
        
        // Add new activities
        activities.forEach(activity => {
            const activityEl = document.createElement('div');
            activityEl.className = 'activity-item';
            
            // Format the timestamp
            const date = new Date(activity.timestamp);
            const timeAgo = formatTimeAgo(date);
            
            // Set the icon based on activity type
            let iconClass = 'fa-info-circle';
            switch(activity.type) {
                case 'student_added':
                    iconClass = 'fa-user-plus';
                    break;
                case 'teacher_added':
                    iconClass = 'fa-chalkboard-teacher';
                    break;
                case 'attendance_taken':
                    iconClass = 'fa-clipboard-check';
                    break;
                case 'grade_updated':
                    iconClass = 'fa-chart-line';
                    break;
                case 'assignment_added':
                    iconClass = 'fa-tasks';
                    break;
            }
            
            activityEl.innerHTML = `
                <div class="activity-icon">
                    <i class="fas ${iconClass}"></i>
                </div>
                <div class="activity-details">
                    <p>${activity.description}</p>
                    <p class="activity-time">${timeAgo}</p>
                </div>
            `;
            
            activitiesContainer.appendChild(activityEl);
        });
    }
    
    // Format timestamp as time ago
    function formatTimeAgo(date) {
        const seconds = Math.floor((new Date() - date) / 1000);
        
        let interval = Math.floor(seconds / 31536000);
        if (interval >= 1) return `${interval} year${interval === 1 ? '' : 's'} ago`;
        
        interval = Math.floor(seconds / 2592000);
        if (interval >= 1) return `${interval} month${interval === 1 ? '' : 's'} ago`;
        
        interval = Math.floor(seconds / 86400);
        if (interval >= 1) return `${interval} day${interval === 1 ? '' : 's'} ago`;
        
        interval = Math.floor(seconds / 3600);
        if (interval >= 1) return `${interval} hour${interval === 1 ? '' : 's'} ago`;
        
        interval = Math.floor(seconds / 60);
        if (interval >= 1) return `${interval} minute${interval === 1 ? '' : 's'} ago`;
        
        return 'Just now';
    }

    // Public API
    return {
        init,
        showNotification,
        navigateTo
    };
})();

// Initialize the dashboard when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    Dashboard.init();
});

// Make dashboard accessible globally
window.Dashboard = Dashboard;
