import mongoose from "mongoose";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { connectDB } from "../config/db";
import { runLogoEnrichmentPass } from "../jobs/logoEnrichment.worker";
import { FailureReason, getFailureStatsSnapshot } from "../services/diagnostics.service";
import { computeFallbackRatio } from "../services/logoValidation.service";
import { logger } from "../utils/logger";

interface ValidationSnapshot {
  fallbackRatio: number;
  successRate: number;
  timestamp: string;
}

const BACKEND_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const SNAPSHOT_PATH = path.join(BACKEND_ROOT, ".logo-validation-snapshot.json");

async function readPreviousSnapshot(): Promise<ValidationSnapshot | null> {
  try {
    const raw = await fs.readFile(SNAPSHOT_PATH, "utf8");
    const parsed = JSON.parse(raw) as ValidationSnapshot;
    if (typeof parsed.fallbackRatio !== "number" || typeof parsed.successRate !== "number") return null;
    return parsed;
  } catch {
    return null;
  }
}

async function writeSnapshot(snapshot: ValidationSnapshot): Promise<void> {
  await fs.writeFile(SNAPSHOT_PATH, JSON.stringify(snapshot, null, 2), "utf8");
}

function pickBottleneck(failureSummary: Record<string, number>): { bottleneck: string; action: string } {
  const api404 = failureSummary[FailureReason.API_404] ?? 0;
  const lowConfidence = failureSummary[FailureReason.LOW_CONFIDENCE] ?? 0;
  const noDomain = failureSummary[FailureReason.NO_DOMAIN] ?? 0;

  if (api404 >= lowConfidence && api404 >= noDomain) {
    return { bottleneck: "API_404", action: "Fix/verify inferred domains and source priority." };
  }
  if (lowConfidence >= api404 && lowConfidence >= noDomain) {
    return { bottleneck: "LOW_CONFIDENCE", action: "Relax inference thresholds and widen candidate attempts." };
  }
  return { bottleneck: "NO_DOMAIN", action: "Expand domain dataset and symbol-to-domain mappings." };
}

async function main(): Promise<void> {
  await connectDB();
  const previous = await readPreviousSnapshot();

  const result = await runLogoEnrichmentPass();
  const diagnostics = getFailureStatsSnapshot();
  const fallbackState = await computeFallbackRatio();

  const failureSummary = {
    LOW_CONFIDENCE: diagnostics.failureStats[FailureReason.LOW_CONFIDENCE] ?? 0,
    API_404: diagnostics.failureStats[FailureReason.API_404] ?? 0,
    NO_DOMAIN: diagnostics.failureStats[FailureReason.NO_DOMAIN] ?? 0,
    RATE_LIMIT: diagnostics.failureStats[FailureReason.RATE_LIMIT] ?? 0,
  };

  const byCountry = {
    INDIA: diagnostics.byCountry.INDIA ?? { processed: 0, resolved: 0, successRate: 0, failureSummary: {} },
    US: diagnostics.byCountry.US ?? { processed: 0, resolved: 0, successRate: 0, failureSummary: {} },
    CRYPTO: diagnostics.byCountry.CRYPTO ?? { processed: 0, resolved: 0, successRate: 0, failureSummary: {} },
  };

  const byType = {
    stock: diagnostics.byType.stock ?? { processed: 0, resolved: 0, successRate: 0, failureSummary: {} },
    crypto: diagnostics.byType.crypto ?? { processed: 0, resolved: 0, successRate: 0, failureSummary: {} },
    forex: diagnostics.byType.forex ?? { processed: 0, resolved: 0, successRate: 0, failureSummary: {} },
    index: diagnostics.byType.index ?? { processed: 0, resolved: 0, successRate: 0, failureSummary: {} },
  };

  const previousFallbackRatio = previous?.fallbackRatio ?? null;
  const previousSuccessRate = previous?.successRate ?? null;
  const delta = previousFallbackRatio === null ? null : Number((previousFallbackRatio - fallbackState.ratio).toFixed(6));
  const bottleneck = pickBottleneck(failureSummary);

  const structured = {
    processed: result.processed,
    resolved: result.resolved,
    successRate: Number(diagnostics.successRate.toFixed(6)),
    fallbackRatio: Number(fallbackState.ratio.toFixed(6)),
    fallbackCount: fallbackState.fallbackCount,
    totalSymbols: fallbackState.totalSymbols,
    failureSummary,
    previousFallbackRatio,
    previousSuccessRate,
    delta,
    byCountry,
    byType,
    bottleneck,
  };

  logger.info("logo_validation_failure_summary", diagnostics);
  logger.info("logo_validation_job_completed", structured);
  console.log(JSON.stringify(structured, null, 2));

  await writeSnapshot({
    fallbackRatio: fallbackState.ratio,
    successRate: diagnostics.successRate,
    timestamp: new Date().toISOString(),
  });

  await mongoose.connection.close();
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    logger.error("logo_validation_job_failed", {
      message: error instanceof Error ? error.message : String(error),
    });
    process.exit(1);
  });
