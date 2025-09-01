// Utility functions for authentication and user data management

// Get the current user's data from localStorage
export function getCurrentUser() {
    try {
        const userData = localStorage.getItem('userData');
        const userProfile = localStorage.getItem('userProfile');
        
        if (!userData && !userProfile) {
            return null;
        }
        
        // Merge basic user data with profile data
        return {
            ...(userData ? JSON.parse(userData) : {}),
            ...(userProfile ? JSON.parse(userProfile) : {})
        };
    } catch (error) {
        console.error('Error getting user data:', error);
        return null;
    }
}

// Check if user is authenticated
export function isAuthenticated() {
    return !!localStorage.getItem('token');
}

// Get user role
export function getUserRole() {
    const user = getCurrentUser();
    return user?.role || user?.profile?.role || null;
}

// Get authentication token
export function getAuthToken() {
    return localStorage.getItem('token');
}

// Clear user data (logout)
export function clearUserData() {
    ['token', 'userData', 'userProfile', 'userRole'].forEach(item => {
        localStorage.removeItem(item);
    });
}

// Check if user has required role
export function hasRole(requiredRole) {
    const userRole = getUserRole();
    if (!userRole) return false;
    return userRole === requiredRole;
}
