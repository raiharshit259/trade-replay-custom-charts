import { AsyncLocalStorage } from "node:async_hooks";

type LogMeta = Record<string, unknown>;
type LogContext = { requestId?: string; traceId?: string };

const logContextStore = new AsyncLocalStorage<LogContext>();

export function runWithLogContext<T>(context: LogContext, callback: () => T): T {
  return logContextStore.run(context, callback);
}

function write(level: "info" | "warn" | "error", message: string, meta?: LogMeta): void {
  const context = logContextStore.getStore();
  const payload = {
    ts: new Date().toISOString(),
    level,
    message,
    ...(context?.requestId ? { requestId: context.requestId } : {}),
    ...(context?.traceId ? { traceId: context.traceId } : {}),
    ...(meta ? { meta } : {}),
  };
  const line = JSON.stringify(payload);

  if (level === "error") {
    console.error(line);
    return;
  }

  if (level === "warn") {
    console.warn(line);
    return;
  }

  console.log(line);
}

export const logger = {
  info: (message: string, meta?: LogMeta) => write("info", message, meta),
  warn: (message: string, meta?: LogMeta) => write("warn", message, meta),
  error: (message: string, meta?: LogMeta) => write("error", message, meta),
};
