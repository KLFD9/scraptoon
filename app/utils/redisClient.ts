import { createClient, RedisClientType } from 'redis';

const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

let client: RedisClientType | null = null;

export async function getRedisClient(): Promise<RedisClientType> {
  if (!client) {
    client = createClient({ url: redisUrl });
    client.on('error', err => console.error('Redis Client Error', err));
    await client.connect();
  }
  return client;
}
