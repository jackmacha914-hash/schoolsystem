function uploadFile(file, endpoint) {
    try {
        // Create FormData with explicit file information
        const formData = new FormData();
        formData.append('assignment-file', file, file.name);

        // Debug logging
        console.log('File data:', file);
        console.log('FormData entries:', [...formData.entries()]);
        console.log('FormData keys:', [...formData.keys()]);
        console.log('FormData values:', [...formData.values()]);

        // Get token from localStorage
        const token = localStorage.getItem('token');
        if (!token) {
            throw new Error('No authentication token found');
        }

        // Create request options
        const options = {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
            },
            body: formData,
            credentials: 'include',
            mode: 'cors'
        };

        // Send the request
        return fetch(endpoint, options)
            .then(response => {
                if (!response.ok) {
                    return response.json().then(error => {
                        console.error('Upload failed:', error);
                        throw new Error(error.error || 'Failed to upload file');
                    });
                }
                return response.json();
            })
            .then(data => {
                console.log('Upload successful:', data);
                return data;
            })
            .catch(error => {
                console.error('Upload error:', error);
                throw error;
            });
    } catch (error) {
        console.error('Upload error:', error);
        throw error;
    }
}

// Make the function globally available
window.uploadFile = uploadFile;
