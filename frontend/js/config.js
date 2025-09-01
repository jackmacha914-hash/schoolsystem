// API Configuration
export const API_CONFIG = {
    BASE_URL: process.env.REACT_APP_API_URL || 'http://localhost:5000',
    UPLOADS_PATH: '/uploads',
    PROFILE_PHOTOS_PATH: '/uploads/profile-photos',
    RESOURCES_PATH: '/uploads/resources'
};

// Helper function to get the full URL for a resource
export function getResourceUrl(path) {
    if (!path) return '';
    
    // If it's already a full URL, return as is
    if (path.startsWith('http')) {
        // Ensure we're using the correct port (5000)
        return path.replace('http://localhost:8000', API_CONFIG.BASE_URL);
    }
    
    // If it's a data URL, return as is
    if (path.startsWith('data:')) {
        return path;
    }
    
    // Handle different path formats
    let cleanPath = path;
    
    // Remove any leading slashes
    cleanPath = cleanPath.replace(/^\/+/g, '');
    
    // If the path already includes 'profile-photos', use it as is
    if (cleanPath.includes('profile-photos/')) {
        return `${API_CONFIG.BASE_URL}/${cleanPath}`;
    }
    
    // If the path starts with 'uploads/', remove it to avoid duplicates
    cleanPath = cleanPath.replace(/^uploads\//, '');
    
    // Construct the full URL with the correct path structure
    return `${API_CONFIG.BASE_URL}/uploads/profile-photos/${cleanPath}`;
}
