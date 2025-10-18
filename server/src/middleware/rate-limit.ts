import { Request, Response, NextFunction } from 'express';
import Redis from 'ioredis';
import { config } from '../config/config';

const redis = new Redis(config.redis.url);

interface RateLimitConfig {
  windowMs: number;  // Time window in milliseconds
  max: number;       // Max requests per window
  keyPrefix?: string;// Redis key prefix
}

export const rateLimit = (options: RateLimitConfig) => {
  const {
    windowMs = 60 * 1000, // default 1 minute
    max = 100,           // default 100 requests per window
    keyPrefix = 'rl:'    // default key prefix
  } = options;

  return async (req: Request, res: Response, next: NextFunction) => {
    const key = `${keyPrefix}${req.ip}`;
    
    try {
      // Use Redis pipeline for atomic operations
      const pipeline = redis.pipeline();
      pipeline.incr(key);
      pipeline.pttl(key);
      
      const results = await pipeline.exec();
      const count = results?.[0]?.[1] as number;
      let ttl = results?.[1]?.[1] as number;

      // If this is the first request, set the expiry
      if (count === 1) {
        await redis.pexpire(key, windowMs);
        ttl = windowMs;
      }

      // Set rate limit headers
      res.set({
        'X-RateLimit-Limit': max.toString(),
        'X-RateLimit-Remaining': Math.max(0, max - count).toString(),
        'X-RateLimit-Reset': String(Date.now() + ttl)
      });

      if (count > max) {
        return res.status(429).json({
          error: 'Too Many Requests',
          message: 'Rate limit exceeded',
          retryAfter: ttl
        });
      }

      next();
    } catch (error) {
      console.error('Rate limiting error:', error);
      // On Redis errors, allow the request to proceed
      next();
    }
  };
};