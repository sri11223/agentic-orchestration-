import Redis from 'ioredis';
import { config } from '../config/config';

class LockService {
  private redis: Redis;
  private defaultTTL: number = 30; // 30 seconds default lock timeout

  constructor() {
    this.redis = new Redis(config.redis.url);
  }

  /**
   * Acquire a distributed lock
   * @param lockKey - The key to lock
   * @param ttl - Time to live in seconds
   * @returns lock token if successful, null if lock cannot be acquired
   */
  async acquireLock(lockKey: string, ttl: number = this.defaultTTL): Promise<string | null> {
    const token = Math.random().toString(36).substring(2);
    const key = `lock:${lockKey}`;
    
    // Use SET with NX option to ensure atomic operation
    const result = await this.redis.set(key, token, 'EX', ttl, 'NX');
    
    if (result === 'OK') {
      return token;
    }
    
    return null;
  }

  /**
   * Release a distributed lock
   * @param lockKey - The key to unlock
   * @param token - The token received when acquiring the lock
   * @returns true if lock was released, false if token doesn't match
   */
  async releaseLock(lockKey: string, token: string): Promise<boolean> {
    const key = `lock:${lockKey}`;
    
    // Use Lua script to ensure atomic operation
    const script = `
      if redis.call("get", KEYS[1]) == ARGV[1] then
        return redis.call("del", KEYS[1])
      else
        return 0
      end
    `;
    
    const result = await this.redis.eval(script, 1, key, token);
    return result === 1;
  }

  /**
   * Execute a function with a lock
   * @param lockKey - The key to lock
   * @param fn - The function to execute while holding the lock
   * @param ttl - Time to live in seconds
   * @returns The result of the function
   */
  async withLock<T>(lockKey: string, fn: () => Promise<T>, ttl?: number): Promise<T> {
    const token = await this.acquireLock(lockKey, ttl);
    if (!token) {
      throw new Error(`Could not acquire lock for key: ${lockKey}`);
    }

    try {
      return await fn();
    } finally {
      await this.releaseLock(lockKey, token);
    }
  }

  /**
   * Check if a lock exists
   * @param lockKey - The key to check
   * @returns true if locked, false otherwise
   */
  async isLocked(lockKey: string): Promise<boolean> {
    const key = `lock:${lockKey}`;
    const exists = await this.redis.exists(key);
    return exists === 1;
  }

  /**
   * Get the remaining TTL of a lock in seconds
   * @param lockKey - The key to check
   * @returns TTL in seconds, -2 if key doesn't exist, -1 if no TTL
   */
  async getLockTTL(lockKey: string): Promise<number> {
    const key = `lock:${lockKey}`;
    return await this.redis.ttl(key);
  }

  /**
   * Force release a lock (use with caution)
   * @param lockKey - The key to force release
   */
  async forceLock(lockKey: string): Promise<void> {
    const key = `lock:${lockKey}`;
    await this.redis.del(key);
  }

  /**
   * Close Redis connection
   */
  async close(): Promise<void> {
    await this.redis.quit();
  }
}

export const lockService = new LockService();