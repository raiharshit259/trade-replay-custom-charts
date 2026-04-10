#!/usr/bin/env node
/**
 * Check that .env and .env.secrets files exist and contain required keys.
 * Does NOT load them (that's done by the actual app).
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const scriptDir = path.dirname(__filename);
const rootDir = path.resolve(scriptDir, "..");

const envPath = path.join(rootDir, ".env");
const secretsPath = path.join(rootDir, ".env.secrets");

const envExists = fs.existsSync(envPath);
const secretsExists = fs.existsSync(secretsPath);

console.log(`[ENV:CHECK] Root directory: ${rootDir}`);
console.log(`[ENV:CHECK] .env exists: ${envExists ? "✓" : "✗"} (${envPath})`);
console.log(`[ENV:CHECK] .env.secrets exists: ${secretsExists ? "✓" : "✗"} (${secretsPath})`);

if (!envExists) {
  console.error(`[ENV:CHECK] FAIL: .env not found at ${envPath}`);
  process.exit(1);
}

// Read and parse .env file to check for keys
const envContent = fs.readFileSync(envPath, "utf8");
const envVars = envContent.split("\n").filter((line) => line.trim() && !line.startsWith("#"));

const requiredKeys = [
  "LOCAL_PORT=",
  "LOCAL_CLIENT_URL=",
  "LOCAL_MONGO_URI=",
  "LOCAL_REDIS_URL=",
];

console.log("[ENV:CHECK] Checking required keys in .env file...");
let allKeysFound = true;
for (const key of requiredKeys) {
  const exists = envVars.some((line) => line.startsWith(key));
  console.log(`[ENV:CHECK] ${key.replace("=", "")}: ${exists ? "✓" : "✗"}`);
  if (!exists) allKeysFound = false;
}

if (!allKeysFound) {
  console.error("[ENV:CHECK] FAIL: Some required environment variables are missing from .env");
  process.exit(1);
}

console.log("[ENV:CHECK] SUCCESS: Environment files are properly configured");
process.exit(0);
