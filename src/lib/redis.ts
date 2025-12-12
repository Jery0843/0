import { Redis } from '@upstash/redis';
import { createClient } from 'redis';

let redisCloudClient: any = null;
let isConnecting = false;

const getRedisClient = async () => {
  if (redisCloudClient?.isOpen) return redisCloudClient;
  if (isConnecting) return null;
  
  if (process.env.REDIS_CLOUD_HOST && !redisCloudClient) {
    isConnecting = true;
    try {
      redisCloudClient = createClient({
        socket: {
          host: process.env.REDIS_CLOUD_HOST,
          port: parseInt(process.env.REDIS_CLOUD_PORT || '13442'),
          connectTimeout: 5000,
          keepAlive: 30000,
          reconnectStrategy: (retries) => Math.min(retries * 50, 500)
        },
        password: process.env.REDIS_CLOUD_PASSWORD,
        database: 0
      });
      await redisCloudClient.connect();
      isConnecting = false;
      return redisCloudClient;
    } catch {
      redisCloudClient = null;
      isConnecting = false;
    }
  }
  return null;
}

const upstashRedis = new Redis({
  url: process.env.UPSTASH_REDIS_URL || '',
  token: process.env.UPSTASH_REDIS_TOKEN || '',
});

export const redis = {
  async lpush(key: string, value: string) {
    const client = await getRedisClient();
    if (client) {
      try {
        return await Promise.race([
          client.lPush(key, value),
          new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 3000))
        ]);
      } catch {}
    }
    return await upstashRedis.lpush(key, value);
  },
  async ltrim(key: string, start: number, stop: number) {
    const client = await getRedisClient();
    if (client) {
      try {
        return await Promise.race([
          client.lTrim(key, start, stop),
          new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 3000))
        ]);
      } catch {}
    }
    return await upstashRedis.ltrim(key, start, stop);
  },
  async lrange(key: string, start: number, stop: number) {
    const client = await getRedisClient();
    if (client) {
      try {
        return await Promise.race([
          client.lRange(key, start, stop),
          new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 3000))
        ]);
      } catch {}
    }
    return await upstashRedis.lrange(key, start, stop);
  }
};
