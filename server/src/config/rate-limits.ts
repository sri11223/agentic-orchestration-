// Rate limiting configuration for different environments
export const RATE_LIMITS = {
  // Development - Very high limits for testing
  development: {
    workflows: {
      windowMs: 60 * 1000, // 1 minute
      max: 2000, // 2000 requests per minute
      keyPrefix: 'workflow:'
    },
    execution: {
      windowMs: 60 * 1000, // 1 minute
      max: 500, // 500 executions per minute
      keyPrefix: 'execution:'
    },
    auth: {
      windowMs: 60 * 1000, // 1 minute
      max: 200, // 200 auth attempts per minute
      keyPrefix: 'auth:'
    },
    ai: {
      windowMs: 60 * 1000, // 1 minute
      max: 1000, // 1000 AI requests per minute
      keyPrefix: 'ai:'
    }
  },

  // Production - More conservative limits
  production: {
    workflows: {
      windowMs: 60 * 1000, // 1 minute
      max: 300, // 300 requests per minute
      keyPrefix: 'workflow:'
    },
    execution: {
      windowMs: 60 * 1000, // 1 minute
      max: 50, // 50 executions per minute
      keyPrefix: 'execution:'
    },
    auth: {
      windowMs: 60 * 1000, // 1 minute
      max: 30, // 30 auth attempts per minute
      keyPrefix: 'auth:'
    },
    ai: {
      windowMs: 60 * 1000, // 1 minute
      max: 200, // 200 AI requests per minute
      keyPrefix: 'ai:'
    }
  }
};

// Get rate limits for current environment
export const getCurrentRateLimits = () => {
  const env = process.env.NODE_ENV || 'development';
  return RATE_LIMITS[env as keyof typeof RATE_LIMITS] || RATE_LIMITS.development;
};