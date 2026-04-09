type LatencyBucket = {
  count: number;
  totalMs: number;
  maxMs: number;
};

type CacheBucket = {
  hits: number;
  misses: number;
};

const apiLatency: Record<string, LatencyBucket> = {};
const cacheStats: Record<string, CacheBucket> = {};
const queueStats: Record<string, { samples: number; avgLatencyMs: number; maxLatencyMs: number }> = {};

function ensureLatencyBucket(key: string): LatencyBucket {
  if (!apiLatency[key]) {
    apiLatency[key] = { count: 0, totalMs: 0, maxMs: 0 };
  }
  return apiLatency[key];
}

function ensureCacheBucket(name: string): CacheBucket {
  if (!cacheStats[name]) {
    cacheStats[name] = { hits: 0, misses: 0 };
  }
  return cacheStats[name];
}

export function recordApiLatency(routeKey: string, durationMs: number): void {
  const bucket = ensureLatencyBucket(routeKey);
  bucket.count += 1;
  bucket.totalMs += durationMs;
  bucket.maxMs = Math.max(bucket.maxMs, durationMs);
}

export function recordCacheResult(cacheName: string, hit: boolean): void {
  const bucket = ensureCacheBucket(cacheName);
  if (hit) {
    bucket.hits += 1;
  } else {
    bucket.misses += 1;
  }
}

export function recordQueueLatency(queueName: string, latencyMs: number): void {
  const current = queueStats[queueName] ?? { samples: 0, avgLatencyMs: 0, maxLatencyMs: 0 };
  const samples = current.samples + 1;
  const avgLatencyMs = ((current.avgLatencyMs * current.samples) + latencyMs) / samples;
  queueStats[queueName] = {
    samples,
    avgLatencyMs,
    maxLatencyMs: Math.max(current.maxLatencyMs, latencyMs),
  };
}

export function getMetricsSnapshot(): {
  apiLatency: Record<string, { count: number; avgMs: number; maxMs: number }>;
  cacheHitRate: Record<string, { hits: number; misses: number; hitRate: number }>;
  queueLatency: Record<string, { samples: number; avgLatencyMs: number; maxLatencyMs: number }>;
} {
  const latency = Object.fromEntries(
    Object.entries(apiLatency).map(([key, value]) => ([
      key,
      {
        count: value.count,
        avgMs: value.count ? Number((value.totalMs / value.count).toFixed(2)) : 0,
        maxMs: value.maxMs,
      },
    ])),
  );

  const cache = Object.fromEntries(
    Object.entries(cacheStats).map(([name, value]) => {
      const total = value.hits + value.misses;
      const hitRate = total ? Number(((value.hits / total) * 100).toFixed(2)) : 0;
      return [name, { ...value, hitRate }];
    }),
  );

  return {
    apiLatency: latency,
    cacheHitRate: cache,
    queueLatency: queueStats,
  };
}
