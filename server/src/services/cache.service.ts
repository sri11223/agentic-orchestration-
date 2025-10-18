import Redis from 'ioredis';
import { config } from '../config/config';

class CacheService {
  private redis: Redis;
  private defaultTTL: number = 3600; // 1 hour in seconds

  constructor() {
    // Use Redis URL if provided, otherwise use individual config options
    if (config.redis.url && config.redis.url !== 'redis://localhost:6379') {
      this.redis = new Redis(config.redis.url, {
        db: config.redis.db,
        keyPrefix: config.redis.keyPrefix,
        maxRetriesPerRequest: config.redis.maxRetriesPerRequest,
      });
    } else {
      this.redis = new Redis({
        host: config.redis.host,
        port: config.redis.port,
        password: config.redis.password,
        db: config.redis.db,
        keyPrefix: config.redis.keyPrefix,
        tls: config.redis.tls,
        maxRetriesPerRequest: config.redis.maxRetriesPerRequest,
      });
    }
    
    // Handle Redis connection events
    this.redis.on('connect', () => {
      console.log('Redis connected successfully');
    });
    
    this.redis.on('error', (error) => {
      console.error('Redis connection error:', error);
    });
  }

  /**
   * Set a value in cache
   */
  async set(key: string, value: any, ttl?: number): Promise<void> {
    const serializedValue = JSON.stringify(value);
    if (ttl) {
      await this.redis.setex(key, ttl, serializedValue);
    } else {
      await this.redis.setex(key, this.defaultTTL, serializedValue);
    }
  }

  /**
   * Get a value from cache
   */
  async get<T>(key: string): Promise<T | null> {
    const value = await this.redis.get(key);
    if (!value) return null;
    return JSON.parse(value) as T;
  }

  /**
   * Delete a value from cache
   */
  async del(key: string): Promise<void> {
    await this.redis.del(key);
  }

  /**
   * Get or set cache with callback
   */
  async getOrSet<T>(key: string, callback: () => Promise<T>, ttl?: number): Promise<T> {
    const cached = await this.get<T>(key);
    if (cached) return cached;

    const value = await callback();
    await this.set(key, value, ttl);
    return value;
  }

  /**
   * Clear all cache entries with a specific prefix
   */
  async clearByPrefix(prefix: string): Promise<void> {
    const keys = await this.redis.keys(`${prefix}:*`);
    if (keys.length > 0) {
      await this.redis.del(...keys);
    }
  }

  /**
   * Set multiple values in cache
   */
  async mset(items: { key: string; value: any; ttl?: number }[]): Promise<void> {
    const pipeline = this.redis.pipeline();
    
    for (const item of items) {
      const serializedValue = JSON.stringify(item.value);
      if (item.ttl) {
        pipeline.setex(item.key, item.ttl, serializedValue);
      } else {
        pipeline.setex(item.key, this.defaultTTL, serializedValue);
      }
    }

    await pipeline.exec();
  }

  /**
   * Increment a counter
   */
  async increment(key: string): Promise<number> {
    return await this.redis.incr(key);
  }

  /**
   * Close Redis connection
   */
  async close(): Promise<void> {
    await this.redis.quit();
  }
}

export const cacheService = new CacheService();