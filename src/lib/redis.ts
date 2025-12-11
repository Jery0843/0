import { Redis } from '@upstash/redis';
import { createClient } from 'redis';

let redisCloudClient: any = null;

if (process.env.REDIS_CLOUD_HOST) {
  redisCloudClient = createClient({
    socket: {
      host: process.env.REDIS_CLOUD_HOST,
      port: parseInt(process.env.REDIS_CLOUD_PORT || '13442')
    },
    password: process.env.REDIS_CLOUD_PASSWORD
  });
  
  redisCloudClient.connect().catch(() => {
    redisCloudClient = null;
  });
}

const upstashRedis = new Redis({
  url: process.env.UPSTASH_REDIS_URL || '',
  token: process.env.UPSTASH_REDIS_TOKEN || '',
});

export const redis = {
  async lpush(key: string, value: string) {
    if (redisCloudClient) {
      try {
        return await redisCloudClient.lPush(key, value);
      } catch (err) {
        console.log('Redis Cloud lpush failed, using Upstash');
      }
    }
    return await upstashRedis.lpush(key, value);
  },
  async ltrim(key: string, start: number, stop: number) {
    if (redisCloudClient) {
      try {
        return await redisCloudClient.lTrim(key, start, stop);
      } catch (err) {
        console.log('Redis Cloud ltrim failed, using Upstash');
      }
    }
    return await upstashRedis.ltrim(key, start, stop);
  },
  async lrange(key: string, start: number, stop: number) {
    if (redisCloudClient) {
      try {
        return await redisCloudClient.lRange(key, start, stop);
      } catch (err) {
        console.log('Redis Cloud lrange failed, using Upstash');
      }
    }
    return await upstashRedis.lrange(key, start, stop);
  }
};
