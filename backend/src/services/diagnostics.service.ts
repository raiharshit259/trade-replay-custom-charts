import { logger } from "../utils/logger";

export enum FailureReason {
  NO_DOMAIN = "NO_DOMAIN",
  LOW_CONFIDENCE = "LOW_CONFIDENCE",
  API_404 = "API_404",
  RATE_LIMIT = "RATE_LIMIT",
  INVALID_LOGO = "INVALID_LOGO",
  UNKNOWN = "UNKNOWN",
}

export interface ResolverDiagnosticEvent {
  symbol: string;
  type: string;
  country: string;
  attemptedSources: string[];
  domain: string | null;
  confidence: number;
  result: "resolved" | "failed";
  failureReason?: FailureReason;
  source?: string;
}

const failureCounter = new Map<FailureReason, number>();
let processedCount = 0;
let resolvedCount = 0;
const countryStats = new Map<string, { processed: number; resolved: number; failures: Map<FailureReason, number> }>();
const typeStats = new Map<string, { processed: number; resolved: number; failures: Map<FailureReason, number> }>();

function normalizeCountryBucket(input: ResolverDiagnosticEvent): string {
  const upperCountry = (input.country || "").toUpperCase();
  const lowerType = (input.type || "").toLowerCase();
  if (lowerType === "crypto") return "CRYPTO";
  if (upperCountry === "IN" || upperCountry === "INDIA") return "INDIA";
  if (upperCountry === "US" || upperCountry === "USA") return "US";
  return upperCountry || "OTHER";
}

function normalizeTypeBucket(input: ResolverDiagnosticEvent): string {
  const lower = (input.type || "unknown").toLowerCase();
  if (lower.includes("stock")) return "stock";
  if (lower.includes("crypto")) return "crypto";
  if (lower.includes("forex") || lower === "fx") return "forex";
  if (lower.includes("index")) return "index";
  return "unknown";
}

function updateBucket(
  map: Map<string, { processed: number; resolved: number; failures: Map<FailureReason, number> }>,
  bucket: string,
  event: ResolverDiagnosticEvent,
): void {
  const entry = map.get(bucket) ?? { processed: 0, resolved: 0, failures: new Map<FailureReason, number>() };
  entry.processed += 1;
  if (event.result === "resolved") {
    entry.resolved += 1;
  } else {
    const reason = event.failureReason ?? FailureReason.UNKNOWN;
    entry.failures.set(reason, (entry.failures.get(reason) ?? 0) + 1);
  }
  map.set(bucket, entry);
}

function snapshotBucket(
  map: Map<string, { processed: number; resolved: number; failures: Map<FailureReason, number> }>,
): Record<string, {
  processed: number;
  resolved: number;
  successRate: number;
  failureSummary: Record<string, number>;
}> {
  const snapshot: Record<string, {
    processed: number;
    resolved: number;
    successRate: number;
    failureSummary: Record<string, number>;
  }> = {};

  for (const [key, value] of map.entries()) {
    const failed = Math.max(0, value.processed - value.resolved);
    const failureSummary: Record<string, number> = {};
    for (const reason of Object.values(FailureReason)) {
      const count = value.failures.get(reason) ?? 0;
      failureSummary[reason] = failed === 0 ? 0 : Number((count / failed).toFixed(4));
    }

    snapshot[key] = {
      processed: value.processed,
      resolved: value.resolved,
      successRate: value.processed === 0 ? 0 : Number((value.resolved / value.processed).toFixed(4)),
      failureSummary,
    };
  }

  return snapshot;
}

export function resetDiagnosticsWindow(): void {
  failureCounter.clear();
  processedCount = 0;
  resolvedCount = 0;
  countryStats.clear();
  typeStats.clear();
}

export function recordResolverDiagnostic(event: ResolverDiagnosticEvent): void {
  processedCount += 1;
  if (event.result === "resolved") {
    resolvedCount += 1;
  } else {
    const reason = event.failureReason ?? FailureReason.UNKNOWN;
    failureCounter.set(reason, (failureCounter.get(reason) ?? 0) + 1);
  }

  updateBucket(countryStats, normalizeCountryBucket(event), event);
  updateBucket(typeStats, normalizeTypeBucket(event), event);

  logger.info("logo_resolver_diagnostic", {
    symbol: event.symbol,
    type: event.type,
    country: event.country,
    attemptedSources: event.attemptedSources,
    domain: event.domain,
    confidence: event.confidence,
    result: event.result,
    failureReason: event.failureReason,
    source: event.source,
  });
}

export function getFailureStatsSnapshot(): {
  processed: number;
  resolved: number;
  successRate: number;
  failureStats: Record<string, number>;
  dominantFailureReason: FailureReason | null;
  byCountry: Record<string, {
    processed: number;
    resolved: number;
    successRate: number;
    failureSummary: Record<string, number>;
  }>;
  byType: Record<string, {
    processed: number;
    resolved: number;
    successRate: number;
    failureSummary: Record<string, number>;
  }>;
} {
  const failed = Math.max(0, processedCount - resolvedCount);
  const successRate = processedCount === 0 ? 0 : resolvedCount / processedCount;

  const failureStats: Record<string, number> = {};
  let dominantFailureReason: FailureReason | null = null;
  let dominantCount = -1;

  for (const reason of Object.values(FailureReason)) {
    const count = failureCounter.get(reason) ?? 0;
    const share = failed === 0 ? 0 : count / failed;
    failureStats[reason] = Number(share.toFixed(4));

    if (count > dominantCount) {
      dominantCount = count;
      dominantFailureReason = count > 0 ? reason : dominantFailureReason;
    }
  }

  return {
    processed: processedCount,
    resolved: resolvedCount,
    successRate,
    failureStats,
    dominantFailureReason,
    byCountry: snapshotBucket(countryStats),
    byType: snapshotBucket(typeStats),
  };
}
