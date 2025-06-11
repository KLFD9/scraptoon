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

  private pruneExpired(): void {
    const now = Date.now();
    for (const [key, entry] of Object.entries(this.memoryCache)) {
      if (now - entry.timestamp > this.ttl) {
        delete this.memoryCache[key];
      }
    }
  }

  async set(key: string, data: T): Promise<void> {
    this.pruneExpired();
    this.memoryCache[key] = { data, timestamp: Date.now() };
    try {
      const client = await getRedisClient();
      await client.setEx(key, Math.floor(this.ttl / 1000), JSON.stringify(data));
    } catch (err) {
      logger.log('error', 'Redis set error', { error: String(err) });
    }
  }

  async get(key: string): Promise<T | null> {
    this.pruneExpired();
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
      logger.log('error', 'Redis get error', { error: String(err) });
    }
    return null;
  }

  async clear(): Promise<void> {
    // Vider le cache mémoire
    this.memoryCache = {};
    try {
      // Vider Redis (toutes les clés)
      const client = await getRedisClient();
      await client.flushAll();
    } catch (err) {
      logger.log('error', 'Redis clear error', { error: String(err) });
    }
  }

  async delete(key: string): Promise<void> {
    delete this.memoryCache[key];
    try {
      const client = await getRedisClient();
      await client.del(key);
    } catch (err) {
      logger.log('error', 'Redis delete error', { error: String(err) });
    }
  }
}
