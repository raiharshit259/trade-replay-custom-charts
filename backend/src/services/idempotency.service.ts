import { isRedisReady, redisClient } from "../config/redis";
import { clusterScopedKey } from "./redisKey.service";

const IDEMPOTENCY_TTL_SECONDS = 3600;

export function toIdempotencyKey(parts: Array<string | number>): string {
  return parts.join("-");
}

export async function acquireIdempotencyLock(scope: string, key: string): Promise<boolean> {
  if (!isRedisReady()) return true;

  const redisKey = clusterScopedKey(`app:dedupe:idempotency:${scope}`, key);
  const result = await redisClient.set(redisKey, "1", "EX", IDEMPOTENCY_TTL_SECONDS, "NX");
  return result === "OK";
}
