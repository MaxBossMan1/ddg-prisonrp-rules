// Simple API response cache
class APICache {
  constructor(defaultTTL = 5 * 60 * 1000) { // 5 minutes default
    this.cache = new Map();
    this.defaultTTL = defaultTTL;
  }

  // Generate cache key from URL and parameters
  generateKey(url, params = {}) {
    const paramString = Object.keys(params)
      .sort()
      .map(key => `${key}=${params[key]}`)
      .join('&');
    return `${url}${paramString ? '?' + paramString : ''}`;
  }

  // Set cache entry
  set(key, data, ttl = this.defaultTTL) {
    const expiresAt = Date.now() + ttl;
    this.cache.set(key, {
      data,
      expiresAt,
      createdAt: Date.now()
    });
  }

  // Get cache entry
  get(key) {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return null;
    }

    // Check if expired
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  // Check if key exists and is valid
  has(key) {
    return this.get(key) !== null;
  }

  // Clear specific key
  delete(key) {
    this.cache.delete(key);
  }

  // Clear all cache
  clear() {
    this.cache.clear();
  }

  // Clear expired entries
  cleanup() {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        this.cache.delete(key);
      }
    }
  }

  // Get cache statistics
  getStats() {
    const now = Date.now();
    let valid = 0;
    let expired = 0;

    for (const entry of this.cache.values()) {
      if (now > entry.expiresAt) {
        expired++;
      } else {
        valid++;
      }
    }

    return {
      total: this.cache.size,
      valid,
      expired,
      hitRate: this.hitCount / (this.hitCount + this.missCount) || 0
    };
  }
}

// Create cache instance with different TTLs for different data types
const cache = new APICache();

// Cache TTL configurations (in milliseconds)
export const CACHE_TTL = {
  CATEGORIES: 10 * 60 * 1000,     // 10 minutes (rarely change)
  RULES: 5 * 60 * 1000,          // 5 minutes (moderate changes)
  ANNOUNCEMENTS: 2 * 60 * 1000,   // 2 minutes (frequent changes)
  SEARCH: 1 * 60 * 1000,         // 1 minute (real-time feel)
  RECENT_CHANGES: 1 * 60 * 1000   // 1 minute (frequent updates)
};

// Cache wrapper for API calls
export const withCache = async (cacheKey, apiCall, ttl = cache.defaultTTL) => {
  // Try to get from cache first
  const cached = cache.get(cacheKey);
  if (cached) {
    console.log(`Cache HIT: ${cacheKey}`);
    return cached;
  }

  console.log(`Cache MISS: ${cacheKey}`);
  
  try {
    // Make API call
    const result = await apiCall();
    
    // Cache the result
    cache.set(cacheKey, result, ttl);
    
    return result;
  } catch (error) {
    // Don't cache errors, just throw them
    throw error;
  }
};

// Cache invalidation helpers
export const invalidateCache = (pattern) => {
  if (typeof pattern === 'string') {
    cache.delete(pattern);
  } else if (pattern instanceof RegExp) {
    for (const key of cache.cache.keys()) {
      if (pattern.test(key)) {
        cache.delete(key);
      }
    }
  }
};

// Clear all cache
export const clearCache = () => {
  cache.clear();
};

// Cleanup expired entries (run periodically)
export const cleanupCache = () => {
  cache.cleanup();
};

// Start automatic cleanup every 5 minutes
setInterval(cleanupCache, 5 * 60 * 1000);

export default cache; 