import IORedis from "ioredis";
import { env } from "./env";

export const redisClient = new IORedis(env.REDIS_URL, {
  lazyConnect: true,
  maxRetriesPerRequest: 1,
  enableOfflineQueue: false,
  retryStrategy: () => null,
});

let redisFallbackActive = false;
let redisLastError: string | null = null;

function allowDevFallback(): boolean {
  return env.APP_ENV !== "production" && env.DEV_ALLOW_MOCK_REDIS;
}

export async function connectRedis(): Promise<void> {
  try {
    if (redisClient.status !== "ready") {
      if (redisClient.status === "wait") {
        await redisClient.connect();
      }
      await redisClient.ping();
    }
    redisFallbackActive = false;
    redisLastError = null;
  } catch (error) {
    redisLastError = error instanceof Error ? error.message : String(error);
    if (allowDevFallback()) {
      redisFallbackActive = true;
      return;
    }
    throw error;
  }
}

export function isRedisReady(): boolean {
  return redisClient.status === "ready";
}

export function isRedisFallbackActive(): boolean {
  return redisFallbackActive;
}

export function getRedisHealthStatus(): {
  ready: boolean;
  fallback: "cache-disabled" | "external";
  degraded: boolean;
  lastError: string | null;
} {
  return {
    ready: isRedisReady(),
    fallback: redisFallbackActive ? "cache-disabled" : "external",
    degraded: redisFallbackActive,
    lastError: redisLastError,
  };
}
