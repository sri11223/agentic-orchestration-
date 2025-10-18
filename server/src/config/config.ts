export const config = {
  mongoUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/agentic-orchestration',
  port: process.env.PORT || 5000,
  
  // Redis Configuration - supports both local and cloud Redis
  redis: {
    url: process.env.REDIS_URL || 'redis://localhost:6379',
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
    password: process.env.REDIS_PASSWORD || undefined,
    // Database separation (use different DB than your other project)
    db: parseInt(process.env.REDIS_DB || '1'),
    // Key prefix to avoid conflicts
    keyPrefix: process.env.REDIS_KEY_PREFIX || 'agentic:',
    // For Redis Cloud/Render with TLS
    tls: process.env.REDIS_TLS === 'true' ? {} : undefined,
    maxRetriesPerRequest: 3,
    retryDelayOnFailover: 100,
  },
  
  environment: process.env.NODE_ENV || 'development',
  
  // JWT Configuration
  jwt: {
    accessSecret: process.env.JWT_ACCESS_SECRET || 'your-super-secret-access-key',
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'your-super-secret-refresh-key',
    accessExpiry: process.env.JWT_ACCESS_EXPIRY || '15m',
    refreshExpiry: process.env.JWT_REFRESH_EXPIRY || '7d',
  },
  // AI Service configs
  geminiApiKey: process.env.GEMINI_API_KEY,
  groqApiKey: process.env.GROQ_API_KEY,
  perplexityApiKey: process.env.PERPLEXITY_API_KEY,
};