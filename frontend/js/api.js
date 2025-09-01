import { API_CONFIG } from './config.js';

export const api = {
  get: async (endpoint, options = {}) => {
    return makeRequest('GET', endpoint, null, options);
  },
  
  post: async (endpoint, data, options = {}) => {
    return makeRequest('POST', endpoint, data, options);
  },
  
  put: async (endpoint, data, options = {}) => {
    return makeRequest('PUT', endpoint, data, options);
  },
  
  delete: async (endpoint, options = {}) => {
    return makeRequest('DELETE', endpoint, null, options);
  },
  
  upload: async (endpoint, formData, options = {}) => {
    const headers = {
      'Authorization': `Bearer ${localStorage.getItem('token')}`,
      ...options.headers
    };
    
    return fetch(`${API_CONFIG.BASE_URL}${endpoint}`, {
      method: 'POST',
      headers,
      body: formData,
      ...options
    });
  }
};

async function makeRequest(method, endpoint, data = null, options = {}) {
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${localStorage.getItem('token')}`,
    ...options.headers
  };

  const config = {
    method,
    headers,
    ...options
  };

  if (data && method !== 'GET' && method !== 'HEAD') {
    config.body = JSON.stringify(data);
  }

  const response = await fetch(`${API_CONFIG.BASE_URL}${endpoint}`, config);
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || 'Something went wrong');
  }
  
  // Handle empty responses
  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    return response.json();
  }
  
  return response.text();
}
