import crypto from "node:crypto";

function sanitizeTag(value: string): string {
  return value.replace(/[^a-zA-Z0-9:_-]/g, "_").slice(0, 64) || "default";
}

export function stableHash(value: string): string {
  return crypto.createHash("sha1").update(value).digest("hex").slice(0, 12);
}

export function clusterScopedKey(namespace: string, partitionKey: string, suffix?: string): string {
  const tag = sanitizeTag(partitionKey);
  const tail = suffix ? `:${suffix}` : "";
  return `${namespace}:{${tag}}${tail}`;
}
