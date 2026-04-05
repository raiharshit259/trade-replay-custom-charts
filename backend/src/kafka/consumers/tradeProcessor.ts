import { createConsumer, MessageHandler } from "../consumer";
import { KAFKA_TOPICS, KafkaEvent, TradeResultPayload } from "../topics";
import { logger } from "../../utils/logger";
import { redisClient } from "../../config/redis";

/**
 * Trade Processor Consumer
 * Processes trade results: updates Redis cache for fast reads,
 * logs analytics, and handles post-trade side effects.
 */
const handleTradeResult: MessageHandler = async (event: KafkaEvent) => {
  const payload = event.payload as TradeResultPayload;

  logger.info("kafka_trade_processed", {
    tradeId: payload.tradeId,
    userId: payload.userId,
    symbol: payload.symbol,
    type: payload.type,
    success: payload.success,
  });

  // Cache latest trade in Redis for fast dashboard reads
  if (redisClient.isOpen && payload.success) {
    const cacheKey = `user:${payload.userId}:latest_trade`;
    await redisClient.set(cacheKey, JSON.stringify(payload), { EX: 3600 });
  }
};

export async function startTradeProcessor(): Promise<void> {
  await createConsumer({
    groupId: "tradereplay-trade-processor",
    topics: [KAFKA_TOPICS.TRADES_RESULT],
    handler: handleTradeResult,
  });
  logger.info("kafka_trade_processor_started");
}
