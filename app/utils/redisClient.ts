import { createClient, RedisClientType } from 'redis';
import { logger } from './logger';

const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

let client: RedisClientType | null = null;

export async function getRedisClient(): Promise<RedisClientType> {
  if (!client) {
    client = createClient({ 
      url: redisUrl,
      socket: {
        connectTimeout: 5000
      }
    });
    
    client.on('error', err => {
      logger.log('error', 'Redis client error', { error: String(err), redisUrl });
    });
    
    client.on('connect', () => {
      console.log('Redis connected successfully');
    });
    
    await client.connect();
  }
  return client;
}

// Add connection test function
export async function testRedisConnection(): Promise<boolean> {
  try {
    const redis = await getRedisClient();
    await redis.ping();
    console.log('Redis connection test: SUCCESS');
    return true;
  } catch (error) {
    logger.log('error', 'Redis connection test failed', { error: String(error) });
    return false;
  }
}
