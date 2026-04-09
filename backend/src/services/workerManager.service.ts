import os from "node:os";
import type { MissingLogoWorkItem } from "./missingLogo.service";
import { chunkArray } from "./batch.service";
import { processLogoBatchWithConcurrency, type LogoBatchResult } from "./logoProcessing.service";

export interface WorkerManagerResult extends LogoBatchResult {
  workerCount: number;
  chunkSize: number;
}

export async function processWithWorkerPool(
  items: MissingLogoWorkItem[],
  options?: {
    workerCount?: number;
    maxWorkers?: number;
    perWorkerChunkSize?: number;
    perWorkerConcurrency?: number;
    strategy?: "normal" | "aggressive" | "deep_enrichment" | "strict_domain_only";
    minConfidence?: number;
    popularityForceThreshold?: number;
  },
): Promise<WorkerManagerResult> {
  const cpuCores = Math.max(1, os.cpus().length);
  const maxWorkers = Math.max(1, Math.min(options?.maxWorkers ?? 6, 6));
  const workerCount = Math.max(1, Math.min(options?.workerCount ?? 4, cpuCores, maxWorkers));
  const perWorkerChunkSize = Math.max(1, options?.perWorkerChunkSize ?? 300);
  const perWorkerConcurrency = Math.max(1, options?.perWorkerConcurrency ?? 20);
  const strategy = options?.strategy ?? "normal";
  const minConfidence = options?.minConfidence;
  const popularityForceThreshold = options?.popularityForceThreshold;

  const chunks = chunkArray(items, perWorkerChunkSize).slice(0, workerCount);

  const results = await Promise.all(
    chunks.map((chunk) => processLogoBatchWithConcurrency(chunk, perWorkerConcurrency, strategy, {
      minConfidence,
      popularityForceThreshold,
    })),
  );

  let processed = 0;
  let resolved = 0;

  for (const result of results) {
    processed += result.processed;
    resolved += result.resolved;
  }

  return {
    processed,
    resolved,
    workerCount,
    chunkSize: perWorkerChunkSize,
  };
}
