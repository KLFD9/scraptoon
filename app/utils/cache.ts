import { getRedisClient } from './redisClient';
import { logger } from './logger';

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

export class Cache<T = unknown> {
  private memoryCache: { [key: string]: CacheEntry<T> } = {};
  private ttl: number;

  constructor(ttl: number = 3600000) {
    this.ttl = ttl;
  }

  async set(key: string, data: T): Promise<void> {
    this.memoryCache[key] = { data, timestamp: Date.now() };
    try {
      const client = await getRedisClient();
      await client.setEx(key, Math.floor(this.ttl / 1000), JSON.stringify(data));
    } catch (err) {
      logger.log('error', 'Redis set error', { error: String(err), key });
    }
  }

  async get(key: string): Promise<T | null> {
    const entry = this.memoryCache[key];
    if (entry && Date.now() - entry.timestamp <= this.ttl) {
      return entry.data;
    }
    if (entry) {
      delete this.memoryCache[key];
    }
    try {
      const client = await getRedisClient();
      const val = await client.get(key);
      if (val) {
        const data = JSON.parse(val) as T;
        this.memoryCache[key] = { data, timestamp: Date.now() };
        return data;
      }
    } catch (err) {
      logger.log('error', 'Redis get error', { error: String(err), key });
    }
    return null;
  }
}
