const rateLimit = require('express-rate-limit');

// Helper function to create custom rate limit handlers
const createRateLimitHandler = (name, maxRequests, windowMinutes) => {
  return rateLimit({
    windowMs: windowMinutes * 60 * 1000, // Convert minutes to milliseconds
    max: maxRequests,
    message: {
      error: `Too many ${name} requests. Please try again later.`,
      retryAfter: windowMinutes * 60,
      limit: maxRequests,
      window: `${windowMinutes} minutes`
    },
    standardHeaders: true, // Include rate limit info in headers
    legacyHeaders: false, // Disable X-RateLimit-* headers
    handler: (req, res) => {
      console.log(`🚫 Rate limit exceeded for ${name} from IP: ${req.ip}, User-Agent: ${req.get('User-Agent')}`);
      res.status(429).json({
        error: `Too many ${name} requests from this IP. Please try again later.`,
        retryAfter: windowMinutes * 60,
        limit: maxRequests,
        window: `${windowMinutes} minutes`
      });
    },
    skip: (req, res) => {
      // Skip rate limiting for localhost in development
      if (process.env.NODE_ENV === 'development' && 
          (req.ip === '127.0.0.1' || req.ip === '::1' || req.ip === '::ffff:127.0.0.1')) {
        return true;
      }
      return false;
    }
  });
};

// Different rate limits for different types of endpoints

// Public API endpoints - Reasonable for small server
const publicApiLimiter = createRateLimitHandler('public API', 50, 1); // 50 requests per minute

// Search endpoints - Allow frequent searches
const searchLimiter = createRateLimitHandler('search', 30, 1); // 30 requests per minute

// Authentication endpoints - Still need some protection but shorter window
const authLimiter = createRateLimitHandler('authentication', 20, 2); // 20 attempts per 2 minutes

// Staff endpoints - Very lenient for authenticated users
const staffLimiter = createRateLimitHandler('staff', 150, 1); // 150 requests per minute

// Image upload - Reasonable for content creation
const uploadLimiter = createRateLimitHandler('upload', 15, 1); // 15 uploads per minute

// Health check - Very lenient
const healthLimiter = createRateLimitHandler('health check', 50, 1); // 50 requests per minute

// Discord webhook testing - Quick reset for testing
const discordTestLimiter = createRateLimitHandler('Discord test', 5, 1); // 5 tests per minute

// Global fallback rate limiter - Reasonable catch-all
const globalLimiter = createRateLimitHandler('general', 75, 1); // 75 requests per minute

module.exports = {
  publicApiLimiter,
  searchLimiter,
  authLimiter,
  staffLimiter,
  uploadLimiter,
  healthLimiter,
  discordTestLimiter,
  globalLimiter
}; 