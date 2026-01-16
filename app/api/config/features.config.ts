// Configuration & Constants for New Features
// Copy this file and customize for your environment

// ============================================
// CACHE CONFIGURATION
// ============================================

export const CACHE_CONFIG = {
  // TTL (Time To Live) in milliseconds
  TTL: {
    USER_PROFILE: 5 * 60 * 1000,        // 5 minutes
    SEARCH_RESULTS: 2 * 60 * 1000,      // 2 minutes
    LEADERBOARD: 15 * 60 * 1000,        // 15 minutes
    PUBLIC_DATA: 30 * 60 * 1000,        // 30 minutes
    USER_STATS: 10 * 60 * 1000,         // 10 minutes
    ACTIVITY_FEED: 1 * 60 * 1000,       // 1 minute
    ACHIEVEMENTS: 20 * 60 * 1000,       // 20 minutes
  },

  // Cache cleanup interval
  CLEANUP_INTERVAL: 5 * 60 * 1000,      // 5 minutes

  // Max cache entries
  MAX_ENTRIES: 1000,

  // Enable/disable caching
  ENABLED: true,
};

// ============================================
// RATE LIMITING CONFIGURATION
// ============================================

export const RATE_LIMIT_CONFIG = {
  // Format: { maxRequests, windowMs }
  ENDPOINTS: {
    SEARCH: { maxRequests: 100, windowMs: 60 * 1000 },           // 100/min
    NOTIFICATIONS: { maxRequests: 200, windowMs: 60 * 1000 },    // 200/min
    ACTIVITY: { maxRequests: 150, windowMs: 60 * 1000 },         // 150/min
    UPLOAD: { maxRequests: 10, windowMs: 60 * 1000 },            // 10/min
    GENERAL: { maxRequests: 1000, windowMs: 60 * 1000 },         // 1000/min
  },

  // Enable/disable rate limiting
  ENABLED: true,

  // Show rate limit headers
  INCLUDE_HEADERS: true,
};

// ============================================
// NOTIFICATION CONFIGURATION
// ============================================

export const NOTIFICATION_CONFIG = {
  // Notification types
  TYPES: [
    'achievement',
    'follow',
    'message',
    'alert',
    'milestone',
    'system',
  ] as const,

  // Default expiration time (ms)
  DEFAULT_EXPIRATION: 7 * 24 * 60 * 60 * 1000, // 7 days

  // Max notifications per user
  MAX_PER_USER: 500,

  // Cleanup interval
  CLEANUP_INTERVAL: 60 * 60 * 1000, // 1 hour

  // Enable/disable notifications
  ENABLED: true,
};

// ============================================
// ACTIVITY CONFIGURATION
// ============================================

export const ACTIVITY_CONFIG = {
  // Activity types
  TYPES: [
    'profile_updated',
    'user_followed',
    'achievement_unlocked',
    'milestone_reached',
    'profile_viewed',
    'joined',
    'stream_started',
    'stream_ended',
  ] as const,

  // Max activities per user
  MAX_PER_USER: 500,

  // Retention period (ms)
  RETENTION_PERIOD: 90 * 24 * 60 * 60 * 1000, // 90 days

  // Enable/disable activity tracking
  ENABLED: true,
};

// ============================================
// PERFORMANCE MONITORING CONFIGURATION
// ============================================

export const PERFORMANCE_CONFIG = {
  // Metrics reporting interval (ms)
  REPORTING_INTERVAL: 30 * 1000, // 30 seconds

  // Enable/disable monitoring
  ENABLED: true,

  // Enable Web Vitals collection
  COLLECT_WEB_VITALS: true,

  // Performance thresholds (ms)
  THRESHOLDS: {
    PAGE_LOAD: 3000,
    API_RESPONSE: 500,
    IMAGE_LOAD: 1000,
    SEARCH_RESULTS: 200,
    NOTIFICATION_SYNC: 1000,
  },

  // Send metrics to endpoint
  SEND_METRICS: true,
  METRICS_ENDPOINT: '/api/telemetry',
};

// ============================================
// SEARCH CONFIGURATION
// ============================================

export const SEARCH_CONFIG = {
  // Search types
  TYPES: ['users', 'content', 'streams'] as const,

  // Default page size
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,

  // Sort options
  SORT_OPTIONS: ['recent', 'popular', 'trending', 'relevant'] as const,

  // Search fields
  SEARCH_FIELDS: {
    users: ['displayName', 'email', 'slug', 'bio'],
    content: ['title', 'description', 'tags'],
    streams: ['title', 'category', 'username'],
  },

  // Enable/disable search
  ENABLED: true,

  // Min query length
  MIN_QUERY_LENGTH: 2,
};

// ============================================
// MEDIA OPTIMIZATION CONFIGURATION
// ============================================

export const MEDIA_CONFIG = {
  // Image quality (1-100)
  QUALITY: {
    DEFAULT: 80,
    HIGH: 90,
    MEDIUM: 80,
    LOW: 60,
  },

  // Supported formats
  FORMATS: ['webp', 'jpeg', 'png', 'avif'] as const,

  // Responsive breakpoints
  BREAKPOINTS: [320, 640, 1024, 1280, 1920],

  // Enable/disable optimization
  ENABLED: true,

  // CDN config
  CDN: {
    ENABLED: false,
    BASE_URL: 'https://cdn.example.com',
  },
};

// ============================================
// BATCH PROCESSING CONFIGURATION
// ============================================

export const BATCH_CONFIG = {
  // Max concurrent operations
  MAX_CONCURRENT: 5,

  // Batch sizes
  BATCH_SIZES: {
    USER_EXPORT: 50,
    NOTIFICATION_SEND: 100,
    ACTIVITY_LOG: 200,
    DATA_SYNC: 100,
  },

  // Max retries
  MAX_RETRIES: 3,

  // Retry delay (ms)
  RETRY_DELAY: 1000,
};

// ============================================
// CIRCUIT BREAKER CONFIGURATION
// ============================================

export const CIRCUIT_BREAKER_CONFIG = {
  // Failure threshold
  FAILURE_THRESHOLD: 5,

  // Success threshold
  SUCCESS_THRESHOLD: 2,

  // Reset timeout (ms)
  RESET_TIMEOUT: 60 * 1000, // 1 minute

  // Enable/disable
  ENABLED: true,
};

// ============================================
// DATA EXPORT CONFIGURATION
// ============================================

export const DATA_EXPORT_CONFIG = {
  // Supported formats
  FORMATS: ['json', 'csv', 'xml'] as const,

  // Default format
  DEFAULT_FORMAT: 'json' as const,

  // Include in export
  INCLUDE: {
    PROFILE: true,
    SETTINGS: true,
    STATS: true,
    ACTIVITIES: true,
    ACHIEVEMENTS: true,
  },

  // Enable/disable export
  ENABLED: true,

  // Max export size (MB)
  MAX_SIZE: 100,
};

// ============================================
// NOTIFICATION POLLING CONFIGURATION
// ============================================

export const POLLING_CONFIG = {
  // Default poll intervals (ms)
  INTERVALS: {
    NOTIFICATIONS: 30 * 1000,   // 30 seconds
    ACTIVITY: 30 * 1000,        // 30 seconds
    LEADERBOARD: 60 * 1000,     // 1 minute
    STATS: 60 * 1000,           // 1 minute
  },

  // Enable/disable polling
  ENABLED: true,

  // Exponential backoff for failed polls
  BACKOFF_ENABLED: true,
  BACKOFF_MULTIPLIER: 1.5,
  MAX_BACKOFF: 5 * 60 * 1000, // 5 minutes
};

// ============================================
// SECURITY CONFIGURATION
// ============================================

export const SECURITY_CONFIG = {
  // Require authentication
  REQUIRE_AUTH: true,

  // Verify user ownership
  VERIFY_OWNERSHIP: true,

  // Allowed origins
  ALLOWED_ORIGINS: [
    'http://localhost:3000',
    'https://armstrong-haulage.com',
    'https://www.armstrong-haulage.com',
  ],

  // Enable CORS
  CORS_ENABLED: true,

  // CORS headers
  CORS_HEADERS: {
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  },

  // Rate limit by IP
  RATE_LIMIT_BY_IP: false,

  // Block suspicious patterns
  BLOCK_SUSPICIOUS: true,
};

// ============================================
// LOGGING CONFIGURATION
// ============================================

export const LOGGING_CONFIG = {
  // Log levels
  LEVEL: 'info' as const, // 'error' | 'warn' | 'info' | 'debug'

  // Enable detailed logging
  VERBOSE: process.env.NODE_ENV === 'development',

  // Log to file
  LOG_TO_FILE: false,
  LOG_FILE_PATH: './logs',

  // Log API calls
  LOG_API_CALLS: true,

  // Log cache hits/misses
  LOG_CACHE: true,

  // Log rate limits
  LOG_RATE_LIMITS: true,
};

// ============================================
// DATABASE CONFIGURATION
// ============================================

export const DATABASE_CONFIG = {
  // Database type
  TYPE: 'firebase' as const, // 'firebase' | 'postgres' | 'mongodb'

  // Connection string (for non-Firebase)
  CONNECTION_STRING: process.env.DATABASE_URL || '',

  // Firebase config
  FIREBASE: {
    RTDB_ENABLED: true,
    FIRESTORE_ENABLED: false,
  },

  // Query timeouts
  QUERY_TIMEOUT: 10 * 1000, // 10 seconds

  // Connection pool
  POOL_SIZE: 20,
};

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Get cache TTL for a specific type
 */
export function getCacheTTL(type: string): number {
  const ttls: Record<string, number> = {
    user_profile: CACHE_CONFIG.TTL.USER_PROFILE,
    search_results: CACHE_CONFIG.TTL.SEARCH_RESULTS,
    leaderboard: CACHE_CONFIG.TTL.LEADERBOARD,
    public_data: CACHE_CONFIG.TTL.PUBLIC_DATA,
    user_stats: CACHE_CONFIG.TTL.USER_STATS,
    activity_feed: CACHE_CONFIG.TTL.ACTIVITY_FEED,
    achievements: CACHE_CONFIG.TTL.ACHIEVEMENTS,
  };

  return ttls[type] || CACHE_CONFIG.TTL.PUBLIC_DATA;
}

/**
 * Get rate limit for an endpoint
 */
export function getRateLimit(endpoint: string) {
  const limits: Record<string, any> = RATE_LIMIT_CONFIG.ENDPOINTS;
  return limits[endpoint] || limits.GENERAL;
}

/**
 * Check if a feature is enabled
 */
export function isFeatureEnabled(feature: 'cache' | 'notifications' | 'activity' | 'search' | 'monitoring') {
  const config: Record<string, any> = {
    cache: CACHE_CONFIG.ENABLED,
    notifications: NOTIFICATION_CONFIG.ENABLED,
    activity: ACTIVITY_CONFIG.ENABLED,
    search: SEARCH_CONFIG.ENABLED,
    monitoring: PERFORMANCE_CONFIG.ENABLED,
  };

  return config[feature] ?? true;
}

/**
 * Get environment-specific config
 */
export function getEnvironmentConfig() {
  const env = process.env.NODE_ENV || 'development';
  const isStaging = process.env.VERCEL_ENV === 'preview' || process.env.NEXT_PUBLIC_ENV === 'staging';

  return {
    isDevelopment: env === 'development',
    isProduction: env === 'production',
    isTest: env === 'test',
    isStaging: isStaging,
    environment: env,
  };
}

export default {
  CACHE_CONFIG,
  RATE_LIMIT_CONFIG,
  NOTIFICATION_CONFIG,
  ACTIVITY_CONFIG,
  PERFORMANCE_CONFIG,
  SEARCH_CONFIG,
  MEDIA_CONFIG,
  BATCH_CONFIG,
  CIRCUIT_BREAKER_CONFIG,
  DATA_EXPORT_CONFIG,
  POLLING_CONFIG,
  SECURITY_CONFIG,
  LOGGING_CONFIG,
  DATABASE_CONFIG,
};
