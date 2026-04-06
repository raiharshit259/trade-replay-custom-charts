import { GetObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { env } from "../config/env";

const PORTFOLIO_PREFIX = "trade-replay/portfolios";

const hasAwsConfig = Boolean(
  env.AWS_REGION && env.AWS_S3_BUCKET && env.AWS_ACCESS_KEY_ID && env.AWS_SECRET_ACCESS_KEY,
);

export const s3 = new S3Client({
  region: env.AWS_REGION,
  credentials: {
    accessKeyId: env.AWS_ACCESS_KEY_ID,
    secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
  },
});

function ensureAwsConfigured(): void {
  if (!hasAwsConfig) {
    throw new Error("AWS_S3_NOT_CONFIGURED");
  }
}

function sanitizeFileName(fileName: string): string {
  const lower = fileName.trim().toLowerCase();
  const safe = lower.replace(/[^a-z0-9._-]/g, "-");
  return safe.length > 120 ? safe.slice(-120) : safe;
}

export function buildPortfolioUploadKey(userId: string, fileName: string): string {
  const safeName = sanitizeFileName(fileName);
  return `${PORTFOLIO_PREFIX}/${userId}/${Date.now()}-${safeName}`;
}

export async function generatePortfolioUploadUrl(userId: string, fileName: string): Promise<{ url: string; key: string }> {
  ensureAwsConfigured();
  const key = buildPortfolioUploadKey(userId, fileName);

  const command = new PutObjectCommand({
    Bucket: env.AWS_S3_BUCKET,
    Key: key,
    ContentType: "text/csv",
  });

  const url = await getSignedUrl(s3, command, { expiresIn: 60 });
  return { url, key };
}

function assertKeyOwnership(userId: string, key: string): void {
  const expectedPrefix = `${PORTFOLIO_PREFIX}/${userId}/`;
  if (!key.startsWith(expectedPrefix)) {
    throw new Error("INVALID_S3_KEY_SCOPE");
  }
}

export async function downloadPortfolioCsv(userId: string, key: string): Promise<string> {
  ensureAwsConfigured();
  assertKeyOwnership(userId, key);

  const command = new GetObjectCommand({
    Bucket: env.AWS_S3_BUCKET,
    Key: key,
  });

  const response = await s3.send(command);
  const body = response.Body;
  if (!body) {
    throw new Error("S3_OBJECT_EMPTY");
  }

  if (typeof (body as { transformToString?: (encoding?: string) => Promise<string> }).transformToString === "function") {
    return (body as { transformToString: (encoding?: string) => Promise<string> }).transformToString("utf-8");
  }

  throw new Error("S3_OBJECT_UNREADABLE");
}
