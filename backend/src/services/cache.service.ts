import { isRedisReady, redisClient } from "../config/redis";
import { LRUCache } from "lru-cache";
import { recordCacheResult } from "./metrics.service";

const l1Cache = new LRUCache<string, string>({
  max: 5000,
  ttl: 60 * 1000,
});

const LOCK_TTL_SECONDS = 5;
const LOCK_WAIT_ATTEMPTS = 8;
const LOCK_WAIT_INTERVAL_MS = 75;
const SWR_TTL_MULTIPLIER = 3;
const LOCK_KEY_PREFIX = "app:lock:";

type CacheEnvelope<T> = {
  value: T;
  expiresAt: number;
};

type CacheRead<T> = {
  value: T;
  isStale: boolean;
};

function globToRegex(glob: string): RegExp {
  const escaped = glob.replace(/[.+^${}()|[\]\\]/g, "\\$&").replace(/\*/g, ".*");
  return new RegExp(`^${escaped}$`);
}

export function invalidateL1CacheByPattern(pattern: string): number {
  const matcher = globToRegex(pattern);
  let removed = 0;
  for (const key of l1Cache.keys()) {
    if (matcher.test(key)) {
      l1Cache.delete(key);
      removed += 1;
    }
  }
  return removed;
}

export async function getCachedJson<T>(key: string): Promise<T | null> {
  const entry = await readCacheEntry<T>(key);
  return entry?.value ?? null;
}

export async function setCachedJson(key: string, value: unknown, ttlSeconds: number): Promise<void> {
  const envelope: CacheEnvelope<unknown> = {
    value,
    expiresAt: Date.now() + ttlSeconds * 1000,
  };
  const payload = JSON.stringify(envelope);
  l1Cache.set(key, payload, { ttl: ttlSeconds * 1000 });

  if (!isRedisReady()) return;
  try {
    await redisClient.set(key, payload, "EX", ttlSeconds * SWR_TTL_MULTIPLIER);
  } catch {
    // L1 remains hot even when Redis is transiently unavailable.
  }
}

function parseEnvelope<T>(raw: string): CacheRead<T> | null {
  try {
    const parsed = JSON.parse(raw) as Partial<CacheEnvelope<T>>;
    if (typeof parsed.expiresAt === "number" && "value" in parsed) {
      return {
        value: parsed.value as T,
        isStale: parsed.expiresAt <= Date.now(),
      };
    }

    // Backward compatibility with legacy payload format.
    return {
      value: parsed as T,
      isStale: false,
    };
  } catch {
    return null;
  }
}

async function readCacheEntry<T>(key: string): Promise<CacheRead<T> | null> {
  const memoryHit = l1Cache.get(key);
  if (memoryHit) {
    const parsed = parseEnvelope<T>(memoryHit);
    if (parsed) {
      recordCacheResult("symbol-search", true);
      return parsed;
    }
    l1Cache.delete(key);
  }

  if (!isRedisReady()) {
    recordCacheResult("symbol-search", false);
    return null;
  }
  let raw: string | null = null;
  try {
    raw = await redisClient.get(key);
  } catch {
    return null;
  }
  if (!raw) return null;

  l1Cache.set(key, raw);
  recordCacheResult("symbol-search", true);
  return parseEnvelope<T>(raw);
}

async function delay(ms: number): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

async function tryAcquireCacheLock(lockKey: string): Promise<boolean> {
  if (!isRedisReady()) return false;
  try {
    const result = await redisClient.set(lockKey, "1", "EX", LOCK_TTL_SECONDS, "NX");
    return result === "OK";
  } catch {
    return false;
  }
}

async function releaseCacheLock(lockKey: string): Promise<void> {
  if (!isRedisReady()) return;
  try {
    await redisClient.del(lockKey);
  } catch {
    // Best effort unlock.
  }
}

export async function getOrSetCachedJsonWithLock<T>(
  key: string,
  ttlSeconds: number,
  fetchFromDb: () => Promise<T>,
): Promise<T> {
  const cached = await readCacheEntry<T>(key);
  if (cached && !cached.isStale) return cached.value;

  if (cached?.isStale) {
    // Stale-while-revalidate: serve stale immediately and refresh in background.
    void (async () => {
      const lockKey = `${LOCK_KEY_PREFIX}${key}`;
      const lockAcquired = await tryAcquireCacheLock(lockKey);
      if (!lockAcquired) return;

      try {
        const fresh = await fetchFromDb();
        await setCachedJson(key, fresh, ttlSeconds);
      } finally {
        await releaseCacheLock(lockKey);
      }
    })();

    return cached.value;
  }

  if (!isRedisReady()) {
    const data = await fetchFromDb();
    await setCachedJson(key, data, ttlSeconds);
    return data;
  }

  const lockKey = `${LOCK_KEY_PREFIX}${key}`;
  const lockAcquired = await tryAcquireCacheLock(lockKey);

  if (lockAcquired) {
    try {
      const data = await fetchFromDb();
      await setCachedJson(key, data, ttlSeconds);
      return data;
    } finally {
      await releaseCacheLock(lockKey);
    }
  }

  for (let attempt = 0; attempt < LOCK_WAIT_ATTEMPTS; attempt += 1) {
    await delay(LOCK_WAIT_INTERVAL_MS);
    const retryCached = await getCachedJson<T>(key);
    if (retryCached) return retryCached;
  }

  const fallbackData = await fetchFromDb();
  recordCacheResult("symbol-search", false);
  await setCachedJson(key, fallbackData, ttlSeconds);
  return fallbackData;
}
