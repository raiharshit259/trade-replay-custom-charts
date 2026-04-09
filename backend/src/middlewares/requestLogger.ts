import crypto from "node:crypto";
import { NextFunction, Request, Response } from "express";
import { env } from "../config/env";
import { logger, runWithLogContext } from "../utils/logger";

export function requestLogger(req: Request, res: Response, next: NextFunction): void {
  const startedAt = Date.now();
  const headerRequestId = req.header("x-request-id");
  const requestId = headerRequestId && headerRequestId.trim()
    ? headerRequestId.trim().slice(0, 120)
    : crypto.randomUUID();
  res.setHeader("x-request-id", requestId);

  res.on("finish", () => {
    const isError = res.statusCode >= 400;
    const shouldSample = Math.random() < env.LOG_REQUEST_SAMPLE_RATE;
    if (!isError && !shouldSample) {
      return;
    }

    logger.info("http_request", {
      requestId,
      method: req.method,
      path: req.originalUrl,
      statusCode: res.statusCode,
      durationMs: Date.now() - startedAt,
    });
  });

  runWithLogContext({ requestId }, () => next());
}
