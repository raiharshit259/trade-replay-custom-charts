import IORedis from "ioredis";
import { env } from "./env";
import { logWarn } from "../services/logger";

export const redisClient = new IORedis(env.REDIS_URL, {
  lazyConnect: true,
  maxRetriesPerRequest: 1,
  enableOfflineQueue: false,
  retryStrategy: () => null,
});

let redisFallbackActive = false;
let redisLastError: string | null = null;
let redisErrorBurstCount = 0;
let redisErrorBurstSince = Date.now();
let redisLastSummaryLogAt = 0;
let redisDisabledReason: string | null = null;

export function maybeLogRedisErrorSummary(
  errorMessage: string,
  now = Date.now(),
  logFn: (message: string, payload?: Record<string, unknown>) => void = logWarn,
): void {
  redisErrorBurstCount += 1;

  if (now - redisLastSummaryLogAt < 15_000) {
    return;
  }

  logFn("chart_service_redis_error_suppressed", {
    error: errorMessage,
    attempts: redisErrorBurstCount,
    windowMs: now - redisErrorBurstSince,
  });

  redisLastSummaryLogAt = now;
  redisErrorBurstCount = 0;
  redisErrorBurstSince = now;
}

redisClient.on("error", (error) => {
  redisLastError = error instanceof Error ? error.message : String(error);
  maybeLogRedisErrorSummary(redisLastError);
});

function allowDevFallback(): boolean {
  return env.APP_ENV !== "production" && env.DEV_ALLOW_MOCK_REDIS;
}

export async function connectRedis(): Promise<void> {
  if (!env.REDIS_ENABLED) {
    redisFallbackActive = true;
    redisDisabledReason = "disabled_by_config";
    return;
  }

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
  enabledByConfig: boolean;
  runtimeEnabled: boolean;
  ready: boolean;
  fallback: "cache-disabled" | "external";
  degraded: boolean;
  lastError: string | null;
  reason: string | null;
} {
  return {
    enabledByConfig: env.REDIS_ENABLED,
    runtimeEnabled: env.REDIS_ENABLED,
    ready: isRedisReady(),
    fallback: redisFallbackActive ? "cache-disabled" : "external",
    degraded: redisFallbackActive,
    lastError: redisLastError,
    reason: redisDisabledReason,
  };
}

export function resetRedisLogStateForTests(): void {
  redisErrorBurstCount = 0;
  redisErrorBurstSince = Date.now();
  redisLastSummaryLogAt = 0;
}
