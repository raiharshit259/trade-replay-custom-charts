import { Kafka } from "kafkajs";
import net from "node:net";
import { kafkaConfig } from "../config/kafka";
import { invalidateSymbolTimeframeCaches } from "./cache";
import { incrementCounter } from "./metrics";
import { logError, logInfo, logWarn } from "./logger";
import { env } from "../config/env";

type CandleUpdateEvent = {
  symbol?: string;
  timeframe?: string;
  time?: string;
};

type KafkaEventEnvelope<T = unknown> = {
  eventId?: string;
  timestamp?: number;
  topic?: string;
  source?: string;
  payload?: T;
};

const state = {
  connected: false,
  started: false,
  runtimeDisabled: false,
  runtimeDisableReason: null as string | null,
  hasLoggedRuntimeDisableSummary: false,
  processedCount: 0,
  failedCount: 0,
  dlqCount: 0,
  lastMessageTime: null as string | null,
  lastProcessedAt: null as string | null,
  lastLagMs: null as number | null,
};

type StreamingHealth = {
  enabled: boolean;
  runtimeEnabled: boolean;
  optional: boolean;
  disabledReason: string | null;
  connected: boolean;
  topic: string;
  dlqTopic: string;
  maxRetries: number;
  retryBaseMs: number;
  processedCount: number;
  failedCount: number;
  dlqCount: number;
  lastMessageTime: string | null;
  lastProcessedAt: string | null;
  lastLagMs: number | null;
};

type DlqPublishInput = {
  rawValue: string;
  reason: string;
  attempts: number;
};

type ProcessingOptions = {
  maxRetries?: number;
  retryBaseMs?: number;
  sleep?: (ms: number) => Promise<void>;
  publishDlq?: (input: DlqPublishInput) => Promise<void>;
};

function wait(ms: number): Promise<void> {
  return new Promise<void>((resolve) => {
    setTimeout(() => resolve(), ms);
  });
}

function retryDelayMs(attempt: number, baseMs: number): number {
  const exp = baseMs * (2 ** attempt);
  const jitter = Math.floor(Math.random() * Math.max(20, Math.floor(baseMs / 2)));
  return exp + jitter;
}

function toIsoTime(value: unknown): string | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    return new Date(value).toISOString();
  }

  if (typeof value === "string") {
    const parsed = Date.parse(value);
    if (Number.isFinite(parsed)) {
      return new Date(parsed).toISOString();
    }
  }

  return null;
}

function lagMsFromMessageTime(messageTime: string | null): number | null {
  if (!messageTime) return null;
  const ts = Date.parse(messageTime);
  if (!Number.isFinite(ts)) return null;
  return Math.max(0, Date.now() - ts);
}

function updateSuccessTelemetry(messageTime: string | null): void {
  state.processedCount += 1;
  state.lastMessageTime = messageTime;
  state.lastProcessedAt = new Date().toISOString();
  state.lastLagMs = lagMsFromMessageTime(messageTime);
}

function updateFailureTelemetry(messageTime: string | null): void {
  state.failedCount += 1;
  state.lastMessageTime = messageTime;
  state.lastProcessedAt = new Date().toISOString();
  state.lastLagMs = lagMsFromMessageTime(messageTime);
}

export function getStreamingHealth(): StreamingHealth {
  const runtimeEnabled = kafkaConfig.enabled && kafkaConfig.streamingEnabled && !state.runtimeDisabled;
  const disabledReason = !kafkaConfig.enabled
    ? "kafka_disabled"
    : (!kafkaConfig.streamingEnabled
      ? "streaming_disabled_by_config"
      : (state.runtimeDisableReason ?? null));

  return {
    enabled: kafkaConfig.enabled,
    runtimeEnabled,
    optional: true,
    disabledReason,
    connected: state.connected,
    topic: kafkaConfig.topic,
    dlqTopic: kafkaConfig.dlqTopic,
    maxRetries: kafkaConfig.maxRetries,
    retryBaseMs: kafkaConfig.retryBaseMs,
    processedCount: state.processedCount,
    failedCount: state.failedCount,
    dlqCount: state.dlqCount,
    lastMessageTime: state.lastMessageTime,
    lastProcessedAt: state.lastProcessedAt,
    lastLagMs: state.lastLagMs,
  };
}

export async function handleCandleUpdateEvent(event: CandleUpdateEvent): Promise<void> {
  const symbol = event.symbol?.trim();
  const timeframe = event.timeframe?.trim();
  if (!symbol || !timeframe) {
    incrementCounter("streaming.events.invalid");
    return;
  }

  incrementCounter("streaming.events.received");
  await invalidateSymbolTimeframeCaches(symbol, timeframe);
}

function parseRawKafkaMessage(rawValue: string): { event: CandleUpdateEvent; messageTime: string | null } {
  const parsed = JSON.parse(rawValue) as CandleUpdateEvent | KafkaEventEnvelope<CandleUpdateEvent>;
  const event = (parsed && typeof parsed === "object" && "payload" in parsed)
    ? ((parsed as KafkaEventEnvelope<CandleUpdateEvent>).payload ?? {})
    : (parsed as CandleUpdateEvent);

  const envelope = (parsed && typeof parsed === "object" && "payload" in parsed)
    ? parsed as KafkaEventEnvelope<CandleUpdateEvent>
    : null;
  const messageTime = toIsoTime(envelope?.timestamp) ?? toIsoTime(event.time);

  return { event, messageTime };
}

export async function handleKafkaMessageValue(rawValue: string, options: ProcessingOptions = {}): Promise<void> {
  const maxRetries = Math.max(0, options.maxRetries ?? kafkaConfig.maxRetries);
  const retryBaseMs = Math.max(10, options.retryBaseMs ?? kafkaConfig.retryBaseMs);
  const sleep = options.sleep ?? wait;
  const publishDlq = options.publishDlq;

  let parsed: { event: CandleUpdateEvent; messageTime: string | null };
  try {
    parsed = parseRawKafkaMessage(rawValue);
  } catch (error) {
    updateFailureTelemetry(null);
    if (publishDlq) {
      try {
        await publishDlq({
          rawValue,
          reason: error instanceof Error ? error.message : String(error),
          attempts: 1,
        });
        state.dlqCount += 1;
      } catch (publishError) {
        logWarn("streaming_dlq_publish_failed", {
          error: publishError instanceof Error ? publishError.message : String(publishError),
        });
      }
    }
    throw error;
  }

  for (let attempt = 0; attempt <= maxRetries; attempt += 1) {
    try {
      await handleCandleUpdateEvent(parsed.event);
      updateSuccessTelemetry(parsed.messageTime);
      return;
    } catch (error) {
      if (attempt < maxRetries) {
        await sleep(retryDelayMs(attempt, retryBaseMs));
        continue;
      }

      updateFailureTelemetry(parsed.messageTime);
      if (publishDlq) {
        try {
          await publishDlq({
            rawValue,
            reason: error instanceof Error ? error.message : String(error),
            attempts: attempt + 1,
          });
          state.dlqCount += 1;
        } catch (publishError) {
          logWarn("streaming_dlq_publish_failed", {
            error: publishError instanceof Error ? publishError.message : String(publishError),
          });
        }
      }

      throw error;
    }
  }

  updateFailureTelemetry(parsed.messageTime);
}

export function resetStreamingStateForTests(): void {
  state.connected = false;
  state.started = false;
  state.runtimeDisabled = false;
  state.runtimeDisableReason = null;
  state.hasLoggedRuntimeDisableSummary = false;
  state.processedCount = 0;
  state.failedCount = 0;
  state.dlqCount = 0;
  state.lastMessageTime = null;
  state.lastProcessedAt = null;
  state.lastLagMs = null;
}

export function markStreamingProcessedForTests(input: { messageTime?: string }): void {
  updateSuccessTelemetry(input.messageTime ?? null);
}

export function markStreamingFailureForTests(input: { messageTime?: string }): void {
  updateFailureTelemetry(input.messageTime ?? null);
}

type StreamingPreflightResult = {
  reachable: boolean;
  broker?: string;
  reason?: string;
};

function parseBrokerAddress(broker: string): { host: string; port: number } | null {
  const [hostRaw, portRaw] = broker.split(":");
  const host = hostRaw?.trim();
  const port = Number(portRaw);
  if (!host || !Number.isFinite(port) || port <= 0) {
    return null;
  }
  return { host, port };
}

function probeBroker(host: string, port: number, timeoutMs: number): Promise<boolean> {
  return new Promise((resolve) => {
    const socket = net.connect({ host, port });
    let settled = false;

    const done = (ok: boolean) => {
      if (settled) return;
      settled = true;
      socket.destroy();
      resolve(ok);
    };

    socket.setTimeout(timeoutMs);
    socket.once("connect", () => done(true));
    socket.once("error", () => done(false));
    socket.once("timeout", () => done(false));
  });
}

async function probeKafkaBrokers(timeoutMs = 750): Promise<StreamingPreflightResult> {
  const brokers = kafkaConfig.brokers;
  if (brokers.length === 0) {
    return { reachable: false, reason: "missing_broker_config" };
  }

  for (const broker of brokers) {
    const parsed = parseBrokerAddress(broker);
    if (!parsed) continue;
    const reachable = await probeBroker(parsed.host, parsed.port, timeoutMs);
    if (reachable) {
      return { reachable: true, broker };
    }
  }

  return { reachable: false, broker: brokers[0], reason: "tcp_connect_failed" };
}

type StreamingPreflightOptions = {
  probe?: () => Promise<StreamingPreflightResult>;
  logWarn?: (meta: { reason: string; broker?: string | null }) => void;
};

export async function preflightStreamingOrDisableForDev(options: StreamingPreflightOptions = {}): Promise<boolean> {
  if (!kafkaConfig.enabled || !kafkaConfig.streamingEnabled) {
    return false;
  }

  if (env.APP_ENV === "production" || !kafkaConfig.autoDisableWhenUnavailable) {
    return true;
  }

  const probe = options.probe ?? (() => probeKafkaBrokers());
  const result = await probe();
  if (result.reachable) {
    return true;
  }

  state.runtimeDisabled = true;
  state.runtimeDisableReason = `kafka_unreachable_in_dev:${result.reason ?? "unknown"}`;
  if (!state.hasLoggedRuntimeDisableSummary) {
    state.hasLoggedRuntimeDisableSummary = true;
    if (options.logWarn) {
      options.logWarn({ reason: state.runtimeDisableReason, broker: result.broker ?? null });
    } else {
      logWarn("chart_streaming_auto_disabled_for_dev", {
        reason: state.runtimeDisableReason,
        broker: result.broker ?? null,
        strategy: "preflight_tcp_probe",
      });
    }
  }

  return false;
}

export async function startStreaming(): Promise<(() => Promise<void>) | null> {
  if (!kafkaConfig.enabled || !kafkaConfig.streamingEnabled || state.runtimeDisabled || state.started) {
    if (!state.started) {
      logInfo("chart_streaming_disabled", {
        kafkaEnabled: kafkaConfig.enabled,
        streamingEnabled: kafkaConfig.streamingEnabled,
        runtimeDisabled: state.runtimeDisabled,
        runtimeDisableReason: state.runtimeDisableReason,
      });
    }
    return null;
  }

  const preflightOk = await preflightStreamingOrDisableForDev();
  if (!preflightOk) {
    logInfo("chart_streaming_disabled", {
      kafkaEnabled: kafkaConfig.enabled,
      streamingEnabled: kafkaConfig.streamingEnabled,
      runtimeDisabled: state.runtimeDisabled,
      runtimeDisableReason: state.runtimeDisableReason,
    });
    return null;
  }

  const kafka = new Kafka({
    clientId: kafkaConfig.clientId,
    brokers: kafkaConfig.brokers,
  });

  const consumer = kafka.consumer({ groupId: kafkaConfig.groupId });
  const producer = kafka.producer();

  const publishDlq = async (input: DlqPublishInput): Promise<void> => {
    await producer.send({
      topic: kafkaConfig.dlqTopic,
      messages: [{
        key: `dlq:${Date.now()}`,
        value: JSON.stringify({
          originalValue: input.rawValue,
          reason: input.reason,
          attempts: input.attempts,
          failedAt: new Date().toISOString(),
          sourceTopic: kafkaConfig.topic,
        }),
      }],
    });
  };

  try {
    await producer.connect();
    await consumer.connect();
    state.connected = true;
    await consumer.subscribe({ topic: kafkaConfig.topic, fromBeginning: false });

    await consumer.run({
      eachMessage: async ({ message }) => {
        if (!message.value) {
          incrementCounter("streaming.events.empty");
          return;
        }

        try {
          await handleKafkaMessageValue(message.value.toString(), {
            publishDlq,
          });
        } catch (error) {
          incrementCounter("streaming.events.failed");
          logWarn("streaming_message_processing_failed", {
            error: error instanceof Error ? error.message : String(error),
          });
        }
      },
    });

    state.started = true;
    logInfo("chart_streaming_started", { topic: kafkaConfig.topic });

    return async () => {
      try {
        await consumer.disconnect();
        await producer.disconnect();
      } catch (error) {
        logError("chart_streaming_stop_failed", {
          error: error instanceof Error ? error.message : String(error),
        });
      } finally {
        state.connected = false;
        state.started = false;
      }
    };
  } catch (error) {
    state.connected = false;
    state.started = false;
    logWarn("chart_streaming_start_failed", {
      error: error instanceof Error ? error.message : String(error),
      topic: kafkaConfig.topic,
    });
    try {
      await consumer.disconnect();
      await producer.disconnect();
    } catch {
      // ignore cleanup failure
    }
    return null;
  }
}
