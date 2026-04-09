import { Producer, CompressionTypes } from "kafkajs";
import crypto from "node:crypto";
import { kafka, isKafkaEnabled, isKafkaReady } from "../config/kafka";
import { ALL_TOPICS, KafkaEvent, KafkaTopic } from "./topics";
import { logger } from "../utils/logger";

let producer: Producer | null = null;

export async function connectProducer(): Promise<void> {
  if (!isKafkaEnabled()) return;

  producer = kafka.producer({
    allowAutoTopicCreation: false,
    idempotent: true,
    maxInFlightRequests: 5,
    transactionTimeout: 30_000,
  });

  await producer.connect();
  logger.info("kafka_producer_connected");
}

export async function disconnectProducer(): Promise<void> {
  if (producer) {
    await producer.disconnect();
    producer = null;
    logger.info("kafka_producer_disconnected");
  }
}

/**
 * Non-blocking produce: fire-and-forget with async error logging.
 * Never blocks the Node.js event loop or the caller.
 */
export function produce<T>(topic: KafkaTopic, payload: T, key?: string): void {
  if (!isKafkaEnabled() || !isKafkaReady() || !producer) return;

  if (!ALL_TOPICS.includes(topic)) {
    logger.warn("kafka_produce_blocked_unknown_topic", { topic });
    return;
  }

  const event: KafkaEvent<T> = {
    eventId: crypto.randomUUID(),
    topic,
    timestamp: Date.now(),
    source: "tradereplay-backend",
    payload,
  };

  try {
    // Fire-and-forget — microtask, not blocking.
    producer
      .send({
        topic,
        compression: CompressionTypes.GZIP,
        messages: [
          {
            key: key ?? event.eventId,
            value: JSON.stringify(event),
            headers: { eventId: event.eventId },
          },
        ],
      })
      .catch((error) => {
        logger.error("kafka_produce_failed", {
          topic,
          eventId: event.eventId,
          error: error instanceof Error ? error.message : String(error),
        });
      });
  } catch (error) {
    logger.error("kafka_produce_sync_failed", {
      topic,
      eventId: event.eventId,
      error: error instanceof Error ? error.message : String(error),
    });
  }
}
