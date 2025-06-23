// Dynamic environment configuration
const getEnvironmentConfig = () => {
  const hostname = window.location.hostname;
  const protocol = window.location.protocol;
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  // Check if we're on localhost/development
  const isLocalhost = hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1';
  
  // Force use of deployed backend for now
  if (process.env.NODE_ENV === 'production') {
    return {
      API_BASE_URL: 'https://ddg-prisonrp-backend-287483604174.us-central1.run.app',
      FRONTEND_URL: `${protocol}//${hostname}:3000`,
      BACKEND_URL: 'https://ddg-prisonrp-backend-287483604174.us-central1.run.app',
      IS_PRODUCTION: true,
      IS_LOCALHOST: isLocalhost
    };
  }
  
  // For development, force use of deployed backend
  if (isLocalhost) {
    // Local development but use deployed backend
    return {
      API_BASE_URL: 'https://ddg-prisonrp-backend-287483604174.us-central1.run.app',
      FRONTEND_URL: 'http://localhost:3000',
      BACKEND_URL: 'https://ddg-prisonrp-backend-287483604174.us-central1.run.app',
      IS_PRODUCTION: false,
      IS_LOCALHOST: true
    };
  } else {
    // Cloud/remote development (e.g., when accessing via IP)
    const port3001 = `${protocol}//${hostname}:3001`;
    const port3000 = `${protocol}//${hostname}:3000`;
    
    return {
      API_BASE_URL: port3001,
      FRONTEND_URL: port3000,
      BACKEND_URL: port3001,
      IS_PRODUCTION: false,
      IS_LOCALHOST: false
    };
  }
};

// Export the configuration
export const ENV_CONFIG = getEnvironmentConfig();

// Helper function to build API URLs
export const buildApiUrl = (path) => {
  if (path.startsWith('http')) {
    return path; // Already absolute
  }
  
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${ENV_CONFIG.API_BASE_URL}${normalizedPath}`;
};

// Log current configuration for debugging
console.log('🌍 Environment Configuration:', {
  hostname: window.location.hostname,
  protocol: window.location.protocol,
  nodeEnv: process.env.NODE_ENV,
  config: ENV_CONFIG
});

export default ENV_CONFIG; 