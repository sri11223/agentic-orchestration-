import { Request, Response, NextFunction } from 'express';
import helmet from 'helmet';
import compression from 'compression';
import cors from 'cors';
import { MongoClient } from 'mongodb';
import Redis from 'ioredis';

export interface SecurityConfig {
  rateLimiting: {
    windowMs: number;
    max: number;
    message: string;
    standardHeaders: boolean;
    legacyHeaders: boolean;
  };
  cors: {
    origin: string[] | boolean;
    methods: string[];
    allowedHeaders: string[];
    credentials: boolean;
    maxAge: number;
  };
  helmet: {
    contentSecurityPolicy: boolean;
    crossOriginEmbedderPolicy: boolean;
    hsts: {
      maxAge: number;
      includeSubDomains: boolean;
      preload: boolean;
    };
  };
  compression: {
    level: number;
    threshold: number;
    filter: (req: Request, res: Response) => boolean;
  };
}

export interface OptimizationConfig {
  mongodb: {
    maxPoolSize: number;
    minPoolSize: number;
    maxIdleTimeMS: number;
    waitQueueTimeoutMS: number;
    serverSelectionTimeoutMS: number;
    heartbeatFrequencyMS: number;
    retryWrites: boolean;
    readPreference: 'primary' | 'primaryPreferred' | 'secondary' | 'secondaryPreferred' | 'nearest';
  };
  redis: {
    maxRetriesPerRequest: number;
    retryDelayOnFailover: number;
    connectTimeout: number;
    commandTimeout: number;
    lazyConnect: boolean;
    keepAlive: number;
    family: 4 | 6;
    keyPrefix: string;
  };
  caching: {
    defaultTTL: number;
    maxKeys: number;
    checkPeriod: number;
    useClones: boolean;
    deleteOnExpire: boolean;
  };
  compression: {
    level: 6;
    chunkSize: 16384;
    windowBits: 15;
    memLevel: 8;
  };
}

export class SecurityOptimizationService {
  private static instance: SecurityOptimizationService;
  private securityConfig: SecurityConfig;
  private optimizationConfig: OptimizationConfig;

  constructor() {
    this.securityConfig = this.getDefaultSecurityConfig();
    this.optimizationConfig = this.getDefaultOptimizationConfig();
  }

  static getInstance(): SecurityOptimizationService {
    if (!SecurityOptimizationService.instance) {
      SecurityOptimizationService.instance = new SecurityOptimizationService();
    }
    return SecurityOptimizationService.instance;
  }

  /**
   * Get comprehensive security middleware stack
   */
  getSecurityMiddleware() {
    // Simple rate limiting implementation
    const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
    
    const rateLimitMiddleware = (req: Request, res: Response, next: NextFunction) => {
      const clientId = req.ip || 'unknown';
      const now = Date.now();
      const windowMs = this.securityConfig.rateLimiting.windowMs;
      const maxRequests = this.securityConfig.rateLimiting.max;
      
      const clientData = rateLimitMap.get(clientId);
      
      if (!clientData || now > clientData.resetTime) {
        rateLimitMap.set(clientId, { count: 1, resetTime: now + windowMs });
        return next();
      }
      
      if (clientData.count >= maxRequests) {
        console.warn(`Rate limit exceeded for IP: ${req.ip}`);
        return res.status(429).json({
          error: 'Too many requests',
          message: this.securityConfig.rateLimiting.message,
          retryAfter: Math.ceil((clientData.resetTime - now) / 1000)
        });
      }
      
      clientData.count++;
      next();
    };

    return [
      // Rate limiting
      rateLimitMiddleware,

      // Security headers
      helmet({
        contentSecurityPolicy: this.securityConfig.helmet.contentSecurityPolicy,
        crossOriginEmbedderPolicy: this.securityConfig.helmet.crossOriginEmbedderPolicy,
        hsts: this.securityConfig.helmet.hsts
      }),

      // CORS configuration
      cors({
        origin: this.securityConfig.cors.origin,
        methods: this.securityConfig.cors.methods,
        allowedHeaders: this.securityConfig.cors.allowedHeaders,
        credentials: this.securityConfig.cors.credentials,
        maxAge: this.securityConfig.cors.maxAge
      }),

      // Compression
      compression({
        level: this.securityConfig.compression.level,
        threshold: this.securityConfig.compression.threshold,
        filter: this.securityConfig.compression.filter
      }),

      // Request logging and security monitoring
      this.securityMonitoringMiddleware(),

      // Input validation and sanitization
      this.inputValidationMiddleware()
    ];
  }

  /**
   * Get optimized MongoDB connection options
   */
  getMongoDBOptions() {
    return {
      maxPoolSize: this.optimizationConfig.mongodb.maxPoolSize,
      minPoolSize: this.optimizationConfig.mongodb.minPoolSize,
      maxIdleTimeMS: this.optimizationConfig.mongodb.maxIdleTimeMS,
      waitQueueTimeoutMS: this.optimizationConfig.mongodb.waitQueueTimeoutMS,
      serverSelectionTimeoutMS: this.optimizationConfig.mongodb.serverSelectionTimeoutMS,
      heartbeatFrequencyMS: this.optimizationConfig.mongodb.heartbeatFrequencyMS,
      retryWrites: this.optimizationConfig.mongodb.retryWrites,
      readPreference: this.optimizationConfig.mongodb.readPreference,
      // Connection optimizations
      useNewUrlParser: true,
      useUnifiedTopology: true,
      // Monitoring and logging
      monitorCommands: true,
      loggerLevel: 'warn'
    };
  }

  /**
   * Get optimized Redis connection options
   */
  getRedisOptions() {
    return {
      maxRetriesPerRequest: this.optimizationConfig.redis.maxRetriesPerRequest,
      retryDelayOnFailover: this.optimizationConfig.redis.retryDelayOnFailover,
      connectTimeout: this.optimizationConfig.redis.connectTimeout,
      commandTimeout: this.optimizationConfig.redis.commandTimeout,
      lazyConnect: this.optimizationConfig.redis.lazyConnect,
      keepAlive: this.optimizationConfig.redis.keepAlive,
      family: this.optimizationConfig.redis.family,
      keyPrefix: this.optimizationConfig.redis.keyPrefix,
      // Connection pool optimization
      retryConnectOnFailover: true,
      // Performance optimization
      enableReadyCheck: false,
      maxLoadingTimeout: 2000
    };
  }

  /**
   * Get advanced caching strategies
   */
  getCachingStrategies() {
    return {
      // Write-through cache
      writeThrough: async (key: string, data: any, redis: Redis, mongodb: MongoClient) => {
        await Promise.all([
          redis.setex(key, this.optimizationConfig.caching.defaultTTL, JSON.stringify(data)),
          mongodb.db().collection('cache').updateOne(
            { _id: key as any },
            { $set: { data, updatedAt: new Date() } },
            { upsert: true }
          )
        ]);
      },

      // Write-behind cache
      writeBehind: async (key: string, data: any, redis: Redis) => {
        await redis.setex(key, this.optimizationConfig.caching.defaultTTL, JSON.stringify(data));
        // Queue for background MongoDB write
        await redis.lpush('write_queue', JSON.stringify({ key, data, timestamp: Date.now() }));
      },

      // Cache-aside pattern
      cacheAside: async (key: string, fetchFunction: () => Promise<any>, redis: Redis) => {
        try {
          const cached = await redis.get(key);
          if (cached) {
            return JSON.parse(cached);
          }

          const data = await fetchFunction();
          await redis.setex(key, this.optimizationConfig.caching.defaultTTL, JSON.stringify(data));
          return data;
        } catch (error) {
          console.error(`Cache-aside error for key ${key}:`, error);
          return await fetchFunction();
        }
      },

      // Multi-level cache with L1 (memory) and L2 (Redis)
      multiLevel: (() => {
        const memoryCache = new Map<string, { data: any; expiry: number }>();
        
        return {
          get: async (key: string, redis: Redis) => {
            // Check L1 cache
            const l1Entry = memoryCache.get(key);
            if (l1Entry && l1Entry.expiry > Date.now()) {
              return l1Entry.data;
            }

            // Check L2 cache
            const l2Data = await redis.get(key);
            if (l2Data) {
              const data = JSON.parse(l2Data);
              // Store in L1 cache
              memoryCache.set(key, {
                data,
                expiry: Date.now() + (this.optimizationConfig.caching.defaultTTL * 1000)
              });
              return data;
            }

            return null;
          },

          set: async (key: string, data: any, redis: Redis) => {
            // Set in both caches
            memoryCache.set(key, {
              data,
              expiry: Date.now() + (this.optimizationConfig.caching.defaultTTL * 1000)
            });
            await redis.setex(key, this.optimizationConfig.caching.defaultTTL, JSON.stringify(data));
          },

          clear: async (key: string, redis: Redis) => {
            memoryCache.delete(key);
            await redis.del(key);
          }
        };
      })()
    };
  }

  /**
   * Security monitoring middleware
   */
  private securityMonitoringMiddleware() {
    return (req: Request, res: Response, next: NextFunction) => {
      // Log suspicious patterns
      const suspiciousPatterns = [
        /(\.\.|\/etc\/|\/proc\/|\/sys\/)/i, // Path traversal
        /(script|javascript|vbscript|onload|onerror)/i, // XSS attempts
        /(union|select|insert|update|delete|drop|create|alter)/i, // SQL injection
        /(eval|exec|system|shell_exec|passthru)/i // Code injection
      ];

      const userAgent = req.get('User-Agent') || '';
      const requestBody = JSON.stringify(req.body || {});
      const queryString = JSON.stringify(req.query || {});
      const allContent = `${req.url} ${userAgent} ${requestBody} ${queryString}`;

      for (const pattern of suspiciousPatterns) {
        if (pattern.test(allContent)) {
          console.warn(`🚨 SECURITY ALERT: Suspicious request detected from ${req.ip}`, {
            url: req.url,
            method: req.method,
            userAgent,
            body: req.body,
            query: req.query,
            pattern: pattern.source
          });
          break;
        }
      }

      // Rate limiting per IP
      const clientId = req.ip || 'unknown';
      const now = Date.now();
      
      // Add request metadata
      req.securityMeta = {
        requestId: `req_${now}_${Math.random().toString(36).substr(2, 9)}`,
        timestamp: now,
        clientId
      };

      next();
    };
  }

  /**
   * Input validation and sanitization middleware
   */
  private inputValidationMiddleware() {
    return (req: Request, res: Response, next: NextFunction) => {
      // Sanitize common injection patterns
      const sanitizeString = (str: string): string => {
        return str
          .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remove script tags
          .replace(/javascript:/gi, '') // Remove javascript: protocol
          .replace(/on\w+\s*=/gi, '') // Remove event handlers
          .replace(/[<>'"]/g, (match) => {
            const map: { [key: string]: string } = {
              '<': '&lt;',
              '>': '&gt;',
              '"': '&quot;',
              "'": '&#x27;'
            };
            return map[match];
          });
      };

      // Recursively sanitize object properties
      const sanitizeObject = (obj: any): any => {
        if (typeof obj === 'string') {
          return sanitizeString(obj);
        } else if (typeof obj === 'object' && obj !== null) {
          const sanitized: any = Array.isArray(obj) ? [] : {};
          for (const key in obj) {
            sanitized[key] = sanitizeObject(obj[key]);
          }
          return sanitized;
        }
        return obj;
      };

      // Sanitize request body and query parameters
      if (req.body) {
        req.body = sanitizeObject(req.body);
      }
      if (req.query) {
        // Don't reassign req.query directly as it's read-only in newer Express versions
        const sanitizedQuery = sanitizeObject(req.query);
        // Clear existing query properties and set sanitized ones
        Object.keys(req.query).forEach(key => delete req.query[key]);
        Object.assign(req.query, sanitizedQuery);
      }

      next();
    };
  }

  /**
   * Default security configuration
   */
  private getDefaultSecurityConfig(): SecurityConfig {
    return {
      rateLimiting: {
        windowMs: 15 * 60 * 1000, // 15 minutes
        max: 100, // Limit each IP to 100 requests per windowMs
        message: 'Too many requests from this IP, please try again later.',
        standardHeaders: true,
        legacyHeaders: false
      },
      cors: {
        origin: process.env.NODE_ENV === 'production' 
          ? ['https://yourdomain.com', 'https://app.yourdomain.com']
          : true,
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
        credentials: true,
        maxAge: 86400 // 24 hours
      },
      helmet: {
        contentSecurityPolicy: process.env.NODE_ENV === 'production',
        crossOriginEmbedderPolicy: false,
        hsts: {
          maxAge: 31536000, // 1 year
          includeSubDomains: true,
          preload: true
        }
      },
      compression: {
        level: 6,
        threshold: 1024, // Only compress responses larger than 1KB
        filter: (req: Request, res: Response) => {
          if (req.headers['x-no-compression']) {
            return false;
          }
          return compression.filter(req, res);
        }
      }
    };
  }

  /**
   * Default optimization configuration
   */
  private getDefaultOptimizationConfig(): OptimizationConfig {
    return {
      mongodb: {
        maxPoolSize: 20,
        minPoolSize: 5,
        maxIdleTimeMS: 30000,
        waitQueueTimeoutMS: 2500,
        serverSelectionTimeoutMS: 5000,
        heartbeatFrequencyMS: 10000,
        retryWrites: true,
        readPreference: 'primaryPreferred'
      },
      redis: {
        maxRetriesPerRequest: 3,
        retryDelayOnFailover: 100,
        connectTimeout: 10000,
        commandTimeout: 5000,
        lazyConnect: true,
        keepAlive: 30000,
        family: 4,
        keyPrefix: 'agentic:'
      },
      caching: {
        defaultTTL: 3600, // 1 hour
        maxKeys: 10000,
        checkPeriod: 600, // 10 minutes
        useClones: false,
        deleteOnExpire: true
      },
      compression: {
        level: 6,
        chunkSize: 16384,
        windowBits: 15,
        memLevel: 8
      }
    };
  }

  /**
   * Update security configuration
   */
  updateSecurityConfig(config: Partial<SecurityConfig>): void {
    this.securityConfig = { ...this.securityConfig, ...config };
  }

  /**
   * Update optimization configuration
   */
  updateOptimizationConfig(config: Partial<OptimizationConfig>): void {
    this.optimizationConfig = { ...this.optimizationConfig, ...config };
  }

  /**
   * Get database indexes for optimization
   */
  getDatabaseIndexes() {
    return {
      workflows: [
        { fields: { userId: 1, status: 1 }, options: { background: true } },
        { fields: { createdAt: -1 }, options: { background: true } },
        { fields: { 'trigger.type': 1, 'trigger.schedule': 1 }, options: { background: true } },
        { fields: { tags: 1 }, options: { background: true } }
      ],
      executions: [
        { fields: { workflowId: 1, status: 1 }, options: { background: true } },
        { fields: { startedAt: -1 }, options: { background: true } },
        { fields: { status: 1, startedAt: -1 }, options: { background: true } }
      ],
      users: [
        { fields: { email: 1 }, options: { unique: true, background: true } },
        { fields: { 'subscriptions.type': 1 }, options: { background: true } }
      ],
      integrations: [
        { fields: { userId: 1, type: 1 }, options: { background: true } },
        { fields: { isActive: 1 }, options: { background: true } }
      ]
    };
  }

  /**
   * Get production deployment optimizations
   */
  getProductionOptimizations() {
    return {
      processOptimizations: {
        // Node.js process optimization
        nodeOptions: [
          '--max-old-space-size=4096', // Increase memory limit
          '--optimize-for-size', // Optimize for memory usage
          '--gc-interval=100', // More frequent garbage collection
          '--use-largepages=on' // Use large memory pages
        ],
        // Environment variables
        environmentVariables: {
          NODE_ENV: 'production',
          UV_THREADPOOL_SIZE: '20', // Increase thread pool size
          NODE_OPTIONS: '--max-old-space-size=4096 --optimize-for-size'
        }
      },
      
      clusteringConfig: {
        workers: 'auto', // Use all CPU cores
        respawnOnExit: true,
        killTimeout: 5000,
        gracefulShutdown: true
      },

      loadBalancingStrategy: {
        algorithm: 'round-robin',
        healthCheck: {
          path: '/health',
          interval: 30000,
          timeout: 5000,
          unhealthyThreshold: 3,
          healthyThreshold: 2
        }
      },

      cacheOptimizations: {
        // Redis clustering for high availability
        redisCluster: {
          nodes: [
            { host: 'redis-1', port: 6379 },
            { host: 'redis-2', port: 6379 },
            { host: 'redis-3', port: 6379 }
          ],
          options: {
            enableOfflineQueue: false,
            redisOptions: {
              password: process.env.REDIS_PASSWORD
            }
          }
        },

        // MongoDB read replicas
        mongoReadPreference: 'secondaryPreferred',
        
        // CDN configuration for static assets
        cdnConfig: {
          provider: 'cloudflare',
          cacheTTL: 31536000, // 1 year for static assets
          purgeOnDeploy: true
        }
      }
    };
  }
}

// Export singleton instance
export const securityOptimizationService = SecurityOptimizationService.getInstance();

// Extend Express Request interface
declare global {
  namespace Express {
    interface Request {
      securityMeta?: {
        requestId: string;
        timestamp: number;
        clientId: string;
      };
    }
  }
}