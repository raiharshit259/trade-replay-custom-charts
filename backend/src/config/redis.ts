import { createClient } from "redis";
import { env } from "./env";
import { logger } from "../utils/logger";

const isTls = env.REDIS_URL.startsWith("rediss://");
let initialConnectDone = false;

export const redisClient = createClient({
  url: env.REDIS_URL,
  socket: {
    connectTimeout: 3000,
    reconnectStrategy: (retries: number) => {
      // During initial connect, fail fast — don't retry
      if (!initialConnectDone) return false;
      // After initial success + disconnect, retry with backoff
      if (retries > 10) {
        logger.error("redis_max_retries", { retries });
        return new Error("Redis max retries reached");
      }
      const delay = Math.min(retries * 500, 5000);
      logger.warn("redis_reconnect", { retries, delayMs: delay });
      return delay;
    },
    ...(isTls ? { tls: true, rejectUnauthorized: false } : {}),
  },
});

redisClient.on("error", (error) => {
  if (initialConnectDone) {
    logger.error("redis_error", { message: error.message });
  }
});

redisClient.on("ready", () => {
  logger.info("redis_ready");
});

export async function connectRedis(): Promise<void> {
  if (redisClient.isOpen) return;
  try {
    await redisClient.connect();
    initialConnectDone = true;
    logger.info("redis_connected", { url: env.REDIS_URL.replace(/\/\/.*@/, "//***@"), tls: isTls });
  } catch (error) {
    logger.warn("redis_unavailable", {
      error: error instanceof Error ? error.message : String(error),
    });
  }
}
