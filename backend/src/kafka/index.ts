import { isKafkaEnabled, setKafkaReady } from "../config/kafka";
import { ensureTopics } from "./admin";
import { connectProducer, disconnectProducer } from "./producer";
import { disconnectAllConsumers } from "./consumer";
import { startTradeProcessor } from "./consumers/tradeProcessor";
import { startPortfolioUpdater } from "./consumers/portfolioUpdater";
import { startAnalyticsProcessor } from "./consumers/analyticsProcessor";
import { logger } from "../utils/logger";

export async function bootstrapKafka(): Promise<void> {
  if (!isKafkaEnabled()) {
    logger.info("kafka_disabled");
    return;
  }

  try {
    logger.info("kafka_bootstrap_start");

    // 1. Ensure topics exist
    await ensureTopics();

    // 2. Connect producer
    await connectProducer();

    // 3. Start consumers
    await startTradeProcessor();
    await startPortfolioUpdater();
    await startAnalyticsProcessor();

    setKafkaReady(true);
    logger.info("kafka_bootstrap_complete");
  } catch (error) {
    logger.error("kafka_bootstrap_failed", {
      error: error instanceof Error ? error.message : String(error),
    });
    // Kafka failure is non-fatal — app works without it (graceful degradation)
    setKafkaReady(false);
  }
}

export async function shutdownKafka(): Promise<void> {
  if (!isKafkaEnabled()) return;

  logger.info("kafka_shutdown_start");
  setKafkaReady(false);

  await disconnectAllConsumers();
  await disconnectProducer();

  logger.info("kafka_shutdown_complete");
}
