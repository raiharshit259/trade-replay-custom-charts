import { disableKafkaRuntime, isKafkaEnabled, setKafkaReady } from "../config/kafka";
import { ensureTopics } from "./admin";
import { connectProducer, disconnectProducer } from "./producer";
import { disconnectAllConsumers } from "./consumer";
import { startTradeProcessor } from "./consumers/tradeProcessor";
import { startPortfolioUpdater } from "./consumers/portfolioUpdater";
import { startAnalyticsProcessor } from "./consumers/analyticsProcessor";
import { logger } from "../utils/logger";
import { env } from "../config/env";

export async function bootstrapKafkaProducerOnly(): Promise<void> {
  if (!isKafkaEnabled()) {
    logger.info("kafka_disabled");
    return;
  }

  try {
    logger.info("kafka_producer_bootstrap_start");

    await ensureTopics();
    await connectProducer();

    setKafkaReady(true);
    logger.info("kafka_producer_bootstrap_complete");
  } catch (error) {
    logger.error("kafka_producer_bootstrap_failed", {
      error: error instanceof Error ? error.message : String(error),
    });
    if (env.APP_ENV !== "production" && env.DEV_DISABLE_KAFKA_IF_UNAVAILABLE) {
      disableKafkaRuntime("kafka_unreachable_in_dev");
      logger.warn("kafka_auto_disabled_for_dev", {
        reason: "broker_unreachable",
      });
    }
    setKafkaReady(false);
  }
}

export async function bootstrapKafkaConsumersOnly(): Promise<void> {
  if (!isKafkaEnabled()) {
    logger.info("kafka_disabled");
    return;
  }

  try {
    logger.info("kafka_consumers_bootstrap_start");
    await ensureTopics();
    await startTradeProcessor();
    await startPortfolioUpdater();
    await startAnalyticsProcessor();
    logger.info("kafka_consumers_bootstrap_complete");
  } catch (error) {
    logger.error("kafka_consumers_bootstrap_failed", {
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

export async function bootstrapKafka(): Promise<void> {
  await bootstrapKafkaProducerOnly();
  await bootstrapKafkaConsumersOnly();
}

export async function shutdownKafka(): Promise<void> {
  if (!isKafkaEnabled()) return;

  logger.info("kafka_shutdown_start");
  setKafkaReady(false);

  await disconnectAllConsumers();
  await disconnectProducer();

  logger.info("kafka_shutdown_complete");
}
