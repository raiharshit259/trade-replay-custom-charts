import { isRedisReady, redisClient } from "../config/redis";

const keyFor = (userId: string) => `sim:session:${userId}`;

export async function cacheSession(userId: string, payload: unknown): Promise<void> {
  if (!isRedisReady()) return;
  await redisClient.set(keyFor(userId), JSON.stringify(payload), "EX", 60 * 30);
}

export async function getCachedSession<T>(userId: string): Promise<T | null> {
  if (!isRedisReady()) return null;
  const raw = await redisClient.get(keyFor(userId));
  if (!raw) return null;
  return JSON.parse(raw) as T;
}

export async function clearCachedSession(userId: string): Promise<void> {
  if (!isRedisReady()) return;
  await redisClient.del(keyFor(userId));
}
