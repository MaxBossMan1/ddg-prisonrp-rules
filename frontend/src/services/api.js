import axios from 'axios';
import { withCache, CACHE_TTL, invalidateCache } from './cache';

// Dynamic API configuration - Auto-detect environment
const getApiBaseUrl = () => {
  const hostname = window.location.hostname;
  const port = window.location.port;
  
  // If we're running on localhost or 127.0.0.1, use local backend
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return 'http://localhost:3001';
  }
  
  // If we're on the server IP or any other domain, use the same host with port 3001
  return `http://${hostname}:3001`;
};

const API_BASE_URL = getApiBaseUrl(); // Always use dynamic detection for proper backend URL

console.log('🔧 API Configuration:', { 
  NODE_ENV: process.env.NODE_ENV,
  hostname: window.location.hostname,
  API_BASE_URL 
});

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // 10 second timeout
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
    console.log(`API Response: ${response.status} ${response.config.url}`);
    return response;
  },
  (error) => {
    console.error('API Response Error:', error.response?.status, error.response?.data);
    return Promise.reject(error);
  }
);

// API endpoints with caching
export const apiService = {
  // Health check (no cache)
  healthCheck: () => api.get('/health'),

  // Categories (cached for 10 minutes)
  getCategories: () => withCache(
    'categories',
    () => api.get('/api/categories'),
    CACHE_TTL.CATEGORIES
  ),
  
  getCategory: (id) => withCache(
    `category-${id}`,
    () => api.get(`/api/categories/${id}`),
    CACHE_TTL.CATEGORIES
  ),

  // Rules (cached for 5 minutes)
  getRules: (categoryId) => withCache(
    `rules-category-${categoryId}`,
    () => api.get(`/api/rules?category=${categoryId}`),
    CACHE_TTL.RULES
  ),
  
  getRule: (id) => withCache(
    `rule-${id}`,
    () => api.get(`/api/rules/${id}`),
    CACHE_TTL.RULES
  ),
  
  getRuleByCode: (code) => withCache(
    `rule-code-${code}`,
    () => api.get(`/api/rules/code/${code}`),
    CACHE_TTL.RULES
  ),

  // Announcements (cached for 2 minutes)
  getAnnouncements: () => withCache(
    'announcements',
    () => api.get('/api/announcements'),
    CACHE_TTL.ANNOUNCEMENTS
  ),
  
  getActiveAnnouncements: () => withCache(
    'announcements-active',
    () => api.get('/api/announcements?active=true'),
    CACHE_TTL.ANNOUNCEMENTS
  ),

  // Recent changes (cached for 1 minute)
  getRecentChanges: (days = 30) => withCache(
    `recent-changes-${days}`,
    () => api.get(`/api/changes?days=${days}`),
    CACHE_TTL.RECENT_CHANGES
  ),

  // Search (cached for 1 minute)
  searchRules: (query) => withCache(
    `search-${encodeURIComponent(query)}`,
    () => api.get(`/api/search?q=${encodeURIComponent(query)}`),
    CACHE_TTL.SEARCH
  ),

  // Media (cached for 5 minutes)
  getMedia: (ruleId) => withCache(
    `media-rule-${ruleId}`,
    () => api.get(`/api/media?rule=${ruleId}`),
    CACHE_TTL.RULES
  ),

  // Cache management utilities
  cache: {
    // Invalidate specific cache patterns
    invalidateCategories: () => invalidateCache(/^categor/),
    invalidateRules: () => invalidateCache(/^rules?/),
    invalidateAnnouncements: () => invalidateCache(/^announcements/),
    invalidateSearch: () => invalidateCache(/^search/),
    
    // Clear all cache
    clearAll: () => invalidateCache(/.*/),
    
    // Invalidate cache when content is updated (call from staff dashboard)
    onContentUpdate: (type) => {
      switch (type) {
        case 'rule':
          invalidateCache(/^rules?/);
          invalidateCache(/^search/);
          invalidateCache(/^recent-changes/);
          break;
        case 'category':
          invalidateCache(/^categor/);
          invalidateCache(/^rules?/);
          break;
        case 'announcement':
          invalidateCache(/^announcements/);
          break;
        default:
          invalidateCache(/.*/);
      }
    }
  },

  // Discord Integration (Admin+ only)
  discord: {
    // Get Discord integration settings
    getSettings: () => api.get('/api/discord/settings'),
    
    // Update Discord settings
    updateSettings: (settings) => api.put('/api/discord/settings', settings),
    
    // Get available Discord channels (bot mode)
    getChannels: () => api.get('/api/discord/channels'),
    
    // Test Discord integration (bot or webhook)
    test: (config) => api.post('/api/discord/test', config),
    
    // Send announcement to Discord
    sendAnnouncement: (announcementId) => api.post(`/api/discord/announcements/${announcementId}/send`),
    
    // Get Discord message history
    getMessages: (params = {}) => {
      const queryString = new URLSearchParams(params).toString();
      return api.get(`/api/discord/messages${queryString ? `?${queryString}` : ''}`);
    }
  }
};

export default api; 