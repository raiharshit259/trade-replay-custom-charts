import IORedis, { type RedisOptions } from "ioredis";
import { env } from "./env";
import { logger } from "../utils/logger";

function parseRedisUrl(url: string): RedisOptions {
  const parsed = new URL(url);
  const db = parsed.pathname ? Number(parsed.pathname.replace("/", "")) : 0;
  const isTls = parsed.protocol === "rediss:";

  return {
    host: parsed.hostname,
    port: Number(parsed.port || "6379"),
    username: parsed.username || undefined,
    password: parsed.password || undefined,
    db: Number.isFinite(db) ? db : 0,
    tls: isTls ? {} : undefined,
    maxRetriesPerRequest: null,
  };
}

export const redisConnectionOptions = parseRedisUrl(env.REDIS_URL);

export const redisClient = new IORedis(env.REDIS_URL, {
  ...redisConnectionOptions,
  lazyConnect: true,
});

export const redisPublisher = redisClient.duplicate();
export const redisSubscriber = redisClient.duplicate();

redisClient.on("error", (error) => {
  logger.error("redis_error", { message: error.message });
});

redisPublisher.on("error", (error) => {
  logger.error("redis_publisher_error", { message: error.message });
});

redisSubscriber.on("error", (error) => {
  logger.error("redis_subscriber_error", { message: error.message });
});

export function isRedisReady(): boolean {
  return redisClient.status === "ready";
}

export async function connectRedis(): Promise<void> {
  if (isRedisReady()) return;

  try {
    if (redisClient.status === "wait") {
      await redisClient.connect();
    }

    if (redisPublisher.status === "wait") {
      await redisPublisher.connect();
    }

    if (redisSubscriber.status === "wait") {
      await redisSubscriber.connect();
    }

    logger.info("redis_connected", { url: env.REDIS_URL });
  } catch (_error) {
    logger.warn("redis_unavailable");
  }
}
