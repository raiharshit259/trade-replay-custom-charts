#!/usr/bin/env bash
set -euo pipefail

if [[ -z "${AWS_S3_BUCKET:-}" ]]; then
  echo "AWS_S3_BUCKET is required"
  exit 1
fi

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
POLICY_FILE="${SCRIPT_DIR}/s3-logo-lifecycle-policy.json"

aws s3api put-bucket-lifecycle-configuration \
  --bucket "${AWS_S3_BUCKET}" \
  --lifecycle-configuration "file://${POLICY_FILE}"

echo "Applied S3 lifecycle policy to ${AWS_S3_BUCKET}"
