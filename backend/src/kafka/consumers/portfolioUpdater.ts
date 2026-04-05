import { createConsumer, MessageHandler } from "../consumer";
import { KAFKA_TOPICS, KafkaEvent, PortfolioUpdatePayload } from "../topics";
import { logger } from "../../utils/logger";
import { redisClient } from "../../config/redis";

/**
 * Portfolio Updater Consumer
 * Handles portfolio change events: invalidates caches,
 * updates denormalized views, triggers notifications.
 */
const handlePortfolioUpdate: MessageHandler = async (event: KafkaEvent) => {
  const payload = event.payload as PortfolioUpdatePayload;

  logger.info("kafka_portfolio_updated", {
    userId: payload.userId,
    action: payload.action,
    balance: payload.balance,
    holdingsCount: payload.holdingsCount,
  });

  // Invalidate portfolio cache so next read fetches fresh data
  if (redisClient.isOpen) {
    const cacheKey = `user:${payload.userId}:portfolio`;
    await redisClient.del(cacheKey);
  }
};

export async function startPortfolioUpdater(): Promise<void> {
  await createConsumer({
    groupId: "tradereplay-portfolio-updater",
    topics: [KAFKA_TOPICS.PORTFOLIO_UPDATE],
    handler: handlePortfolioUpdate,
  });
  logger.info("kafka_portfolio_updater_started");
}
