import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { normalizeSymbol } from "../utils/normalizeSymbol";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const DATASET_PATH = path.join(ROOT, "data", "domainDataset.json");

function normalizeDomain(domain: string): string {
  return domain.trim().toLowerCase().replace(/^https?:\/\//, "").replace(/\/$/, "");
}

async function main(): Promise<void> {
  const raw = await fs.readFile(DATASET_PATH, "utf8");
  const rawDataset = JSON.parse(raw) as Record<string, string>;
  const normalizedDataset: Record<string, string> = {};

  for (const [symbol, domain] of Object.entries(rawDataset)) {
    const key = normalizeSymbol(symbol);
    if (!key) continue;
    normalizedDataset[key] = normalizeDomain(domain);
  }

  const orderedKeys = Object.keys(normalizedDataset).sort();
  const ordered: Record<string, string> = {};
  for (const key of orderedKeys) {
    ordered[key] = normalizedDataset[key]!;
  }

  await fs.writeFile(DATASET_PATH, `${JSON.stringify(ordered, null, 2)}\n`, "utf8");

  console.log(JSON.stringify({
    inputKeys: Object.keys(rawDataset).length,
    outputKeys: orderedKeys.length,
    datasetPath: DATASET_PATH,
  }, null, 2));
}

main().catch((error) => {
  console.error("rebuild_normalized_domain_dataset_failed", error instanceof Error ? error.message : String(error));
  process.exit(1);
});
