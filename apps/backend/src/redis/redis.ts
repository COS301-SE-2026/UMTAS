import Redis from 'ioredis';
import { Logger } from '@nestjs/common';

const logger = new Logger('Redis');

let redisInstance: Redis | null = null;

/**
 * Get or create a shared Redis instance.
 * Used by BetterAuth, BullMQ, and other services.
 * Call once on app bootstrap.
 */
export function createRedisClient(redisUrl?: string): Redis | null {
  if (!redisUrl) {
    logger.warn('REDIS_URL not configured, Redis disabled');
    return null;
  }

  try {
    redisInstance = new Redis(redisUrl, {
      maxRetriesPerRequest: 3,
      enableReadyCheck: true,
      retryStrategy: (times) => {
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
    });

    redisInstance.on('error', (err) => {
      logger.error('Redis connection error', err);
    });

    redisInstance.on('connect', () => {
      logger.log('Redis connected');
    });

    redisInstance.on('ready', () => {
      logger.log('Redis ready');
    });

    return redisInstance;
  } catch (error) {
    logger.error('Failed to create Redis client', error);
    return null;
  }
}

export function getRedisClient(): Redis | null {
  return redisInstance;
}

export async function closeRedis(): Promise<void> {
  if (redisInstance) {
    await redisInstance.quit();
    redisInstance = null;
    logger.log('Redis connection closed');
  }
}
