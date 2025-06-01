// Dynamic API configuration - Auto-detect environment
const getApiBaseUrl = () => {
  const hostname = window.location.hostname;
  
  // If we're running on localhost or 127.0.0.1, use local backend
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return 'http://localhost:3001';
  }
  
  // If we're on the server IP or any other domain, use the same host with port 3001
  return `http://${hostname}:3001`;
};

// Centralized API configuration
export const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? '' // In production, API calls will be relative to the same domain
  : getApiBaseUrl(); // Dynamic detection for development

// Helper function to build API URLs
export const buildApiUrl = (path) => {
  if (path.startsWith('http')) {
    // Already an absolute URL
    return path;
  }
  
  // Ensure path starts with /
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  
  return `${API_BASE_URL}${normalizedPath}`;
};

// Common API endpoints
export const API_ENDPOINTS = {
  // Auth
  CHECK_AUTH: '/auth/check',
  STEAM_LOGIN: '/auth/steam',
  LOGOUT: '/auth/logout',
  
  // Dashboard
  DASHBOARD: '/api/staff/dashboard',
  
  // Rules
  RULES: '/api/staff/rules',
  CATEGORIES: '/api/categories',
  STAFF_CATEGORIES: '/api/staff/categories',
  CATEGORIES_REORDER: '/api/staff/categories/reorder',
  
  // Announcements
  ANNOUNCEMENTS: '/api/staff/announcements',
  PENDING_APPROVALS: '/api/staff/pending-approvals',
  SCHEDULED_ANNOUNCEMENTS: '/api/staff/scheduled-announcements',
  
  // Users
  USERS: '/api/staff/users',
  
  // Images
  IMAGE_UPLOAD: '/api/images/upload',
  
  // Discord
  DISCORD_SETTINGS: '/api/discord/settings',
  DISCORD_WEBHOOK_TEST: '/api/discord/webhook/test',
  DISCORD_ANNOUNCEMENTS: '/api/discord/announcements',
  DISCORD_RULES: '/api/discord/rules',
  DISCORD_MESSAGES: '/api/discord/messages'
}; 