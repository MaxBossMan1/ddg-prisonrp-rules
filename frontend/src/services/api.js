import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for logging
api.interceptors.request.use(
  (config) => {
    console.log(`API Request: ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => {
    console.error('API Request Error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    console.error('API Response Error:', error);
    if (error.response) {
      // Server responded with error status
      console.error('Error Status:', error.response.status);
      console.error('Error Data:', error.response.data);
    } else if (error.request) {
      // Request was made but no response received
      console.error('No response received:', error.request);
    } else {
      // Something else happened
      console.error('Error Message:', error.message);
    }
    return Promise.reject(error);
  }
);

// API endpoints
export const apiService = {
  // Health check
  healthCheck: () => api.get('/health'),

  // Categories
  getCategories: () => api.get('/api/categories'),
  getCategory: (id) => api.get(`/api/categories/${id}`),

  // Rules
  getRules: (categoryId) => api.get(`/api/rules?category=${categoryId}`),
  getRule: (id) => api.get(`/api/rules/${id}`),
  getRuleByCode: (code) => api.get(`/api/rules/code/${code}`),

  // Announcements
  getAnnouncements: () => api.get('/api/announcements'),
  getActiveAnnouncements: () => api.get('/api/announcements?active=true'),

  // Recent changes
  getRecentChanges: (days = 30) => api.get(`/api/changes?days=${days}`),

  // Search
  searchRules: (query) => api.get(`/api/search?q=${encodeURIComponent(query)}`),

  // Media
  getMedia: (ruleId) => api.get(`/api/media?rule=${ruleId}`),
};

export default api; 