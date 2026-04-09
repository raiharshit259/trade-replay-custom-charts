import dotenv from "dotenv";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const rootEnvPath = path.resolve(__dirname, "../../../../.env");
if (fs.existsSync(rootEnvPath)) {
  dotenv.config({ path: rootEnvPath });
}

function read(key: string, fallback: string): string {
  return process.env[key] ?? process.env[`LOCAL_${key}`] ?? fallback;
}

function getPrefixForNodeEnv(nodeEnv: string): "LOCAL" | "DEV" | "QA" | "PROD" {
  if (nodeEnv === "production" || nodeEnv === "prod") return "PROD";
  if (nodeEnv === "qa" || nodeEnv === "test") return "QA";
  if (nodeEnv === "development" || nodeEnv === "dev") return "DEV";
  return "LOCAL";
}

function readProfileVar(targetEnv: string, key: string, fallback: string): string {
  const envPrefix = getPrefixForNodeEnv(targetEnv);
  return process.env[`${envPrefix}_${key}`]
    ?? process.env[`LOCAL_${key}`]
    ?? process.env[key]
    ?? fallback;
}

const targetEnv = (process.env.NODE_ENV ?? "local").toLowerCase();

export const env = {
  NODE_ENV: targetEnv,
  MONGO_URI: readProfileVar(targetEnv, "MONGO_URI", "mongodb://127.0.0.1:27017/tradereplay"),
  REDIS_URL: readProfileVar(targetEnv, "REDIS_URL", "redis://127.0.0.1:6379"),
  KAFKA_ENABLED: readProfileVar(targetEnv, "KAFKA_ENABLED", "false") === "true",
  KAFKA_BROKERS: readProfileVar(targetEnv, "KAFKA_BROKERS", "127.0.0.1:9092"),
  LOGO_WORKER_CONCURRENCY: Number(readProfileVar(targetEnv, "LOGO_WORKER_CONCURRENCY", "20")),
  AWS_REGION: process.env.AWS_REGION ?? "",
  AWS_S3_BUCKET: process.env.AWS_S3_BUCKET ?? "",
  AWS_ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID ?? "",
  AWS_SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY ?? "",
  AWS_CDN_BASE_URL: process.env.AWS_CDN_BASE_URL ?? "",
};

export const hasAwsConfig = Boolean(
  env.AWS_REGION
  && env.AWS_S3_BUCKET
  && env.AWS_ACCESS_KEY_ID
  && env.AWS_SECRET_ACCESS_KEY,
);
