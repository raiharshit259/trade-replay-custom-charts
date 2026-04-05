import { createConsumer, MessageHandler } from "../consumer";
import {
  KAFKA_TOPICS,
  KafkaEvent,
  SimulationEventPayload,
  UserActivityPayload,
  TradeExecutePayload,
} from "../topics";
import { logger } from "../../utils/logger";
import { redisClient } from "../../config/redis";

/**
 * Analytics Processor Consumer
 * Aggregates user activity, simulation events, and trade metrics
 * into Redis counters for dashboards and monitoring.
 */
const handleAnalytics: MessageHandler = async (event: KafkaEvent) => {
  const { topic, payload, timestamp } = event;

  switch (topic) {
    case KAFKA_TOPICS.USER_ACTIVITY: {
      const activity = payload as UserActivityPayload;
      logger.info("kafka_analytics_user_activity", {
        userId: activity.userId,
        action: activity.action,
      });

      if (redisClient.isOpen) {
        // Increment daily active users counter
        const dayKey = `analytics:dau:${new Date(timestamp).toISOString().slice(0, 10)}`;
        await redisClient.pfAdd(dayKey, activity.userId);
        await redisClient.expire(dayKey, 86400 * 7); // 7 day TTL

        // Increment action counter
        const actionKey = `analytics:actions:${activity.action}`;
        await redisClient.incr(actionKey);
      }
      break;
    }

    case KAFKA_TOPICS.SIMULATION_EVENTS: {
      const sim = payload as SimulationEventPayload;
      logger.info("kafka_analytics_simulation", {
        userId: sim.userId,
        action: sim.action,
        scenarioId: sim.scenarioId,
      });

      if (redisClient.isOpen) {
        // Track simulation starts per scenario
        if (sim.action === "init" && sim.scenarioId) {
          const scenarioKey = `analytics:scenario:${sim.scenarioId}`;
          await redisClient.incr(scenarioKey);
        }
      }
      break;
    }

    case KAFKA_TOPICS.TRADES_EXECUTE: {
      const trade = payload as TradeExecutePayload;
      logger.info("kafka_analytics_trade", {
        userId: trade.userId,
        symbol: trade.symbol,
        type: trade.type,
      });

      if (redisClient.isOpen) {
        // Track most traded symbols
        const symbolKey = "analytics:top_symbols";
        await redisClient.zIncrBy(symbolKey, 1, trade.symbol);
      }
      break;
    }

    default:
      logger.warn("kafka_analytics_unknown_topic", { topic });
  }
};

export async function startAnalyticsProcessor(): Promise<void> {
  await createConsumer({
    groupId: "tradereplay-analytics-processor",
    topics: [
      KAFKA_TOPICS.USER_ACTIVITY,
      KAFKA_TOPICS.SIMULATION_EVENTS,
      KAFKA_TOPICS.TRADES_EXECUTE,
    ],
    handler: handleAnalytics,
  });
  logger.info("kafka_analytics_processor_started");
}
