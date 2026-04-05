import mongoose from "mongoose";
import { env } from "./env";
import { logger } from "../utils/logger";

async function wait(ms: number): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

export async function connectDB(): Promise<void> {
  let connected = false;
  const isTls = env.MONGO_URI.includes("tls=true") || env.MONGO_URI.startsWith("mongodb+srv");
  const sanitizedUri = env.MONGO_URI.replace(/:([^@/]+)@/, ":***@");

  // Mongoose connection event listeners
  mongoose.connection.on("disconnected", () => logger.warn("mongodb_disconnected"));
  mongoose.connection.on("reconnected", () => logger.info("mongodb_reconnected"));
  mongoose.connection.on("error", (err) =>
    logger.error("mongodb_connection_error", { error: err.message }),
  );

  for (let attempt = 1; attempt <= 10; attempt += 1) {
    try {
      await mongoose.connect(env.MONGO_URI, {
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
        maxPoolSize: 10,
        retryWrites: true,
        ...(isTls ? { tls: true } : {}),
      });
      logger.info("mongodb_connected", { uri: sanitizedUri, tls: isTls });
      connected = true;
      break;
    } catch (error) {
      logger.warn("mongodb_connect_retry", {
        attempt,
        error: error instanceof Error ? error.message : String(error),
      });
      await wait(Math.min(attempt * 1500, 10000));
    }
  }

  if (!connected) {
    throw new Error("MongoDB unavailable after 10 attempts");
  }

  const db = mongoose.connection.db;
  if (db) {
    const requiredCollections = ["users", "portfolios", "trades", "simulationsessions"];
    const existing = await db.listCollections().toArray();
    const existingNames = new Set(existing.map((collection) => collection.name));

    for (const name of requiredCollections) {
      if (!existingNames.has(name)) {
        await db.createCollection(name);
      }
    }

    logger.info("mongodb_collections_ready", { collections: requiredCollections });
  }
}
