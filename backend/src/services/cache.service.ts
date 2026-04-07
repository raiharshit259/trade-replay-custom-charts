import { redisClient } from "../config/redis";

export async function getCachedJson<T>(key: string): Promise<T | null> {
  if (!redisClient.isOpen) return null;
  const raw = await redisClient.get(key);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export async function setCachedJson(key: string, value: unknown, ttlSeconds: number): Promise<void> {
  if (!redisClient.isOpen) return;
  await redisClient.set(key, JSON.stringify(value), { EX: ttlSeconds });
}
