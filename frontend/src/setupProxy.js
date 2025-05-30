const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function(app) {
  // Proxy API requests to backend server
  app.use(
    '/api',
    createProxyMiddleware({
      target: 'http://34.132.234.56:3001',
      changeOrigin: true,
    })
  );
  
  // Proxy auth requests to backend server
  app.use(
    '/auth',
    createProxyMiddleware({
      target: 'http://34.132.234.56:3001',
      changeOrigin: true,
    })
  );
}; 