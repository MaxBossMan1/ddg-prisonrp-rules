const { createProxyMiddleware } = require('http-proxy-middleware');

// Dynamic backend URL configuration - Auto-detect environment
const getBackendUrl = () => {
  // For proxy, we can check if we're in a local development environment
  const isLocal = process.env.LOCAL_DEV === 'true' || process.env.NODE_ENV === 'development';
  
  if (isLocal) {
    return 'http://localhost:3001';
  } else {
    return 'http://34.132.234.56:3001'; // Fallback to server IP
  }
};

const backendUrl = getBackendUrl();

console.log('🔧 Proxy Configuration:', {
  NODE_ENV: process.env.NODE_ENV,
  LOCAL_DEV: process.env.LOCAL_DEV,
  backendUrl
});

module.exports = function(app) {
  // Proxy API requests to backend server
  app.use(
    '/api',
    createProxyMiddleware({
      target: backendUrl,
      changeOrigin: true,
      secure: false
    })
  );
  
  // Proxy auth requests to backend server
  app.use(
    '/auth',
    createProxyMiddleware({
      target: backendUrl,
      changeOrigin: true,
      secure: false
    })
  );
  
  app.use(
    '/uploads',
    createProxyMiddleware({
      target: backendUrl,
      changeOrigin: true,
      secure: false
    })
  );
}; 