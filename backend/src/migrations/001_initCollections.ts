import mongoose from "mongoose";
import { logger } from "../utils/logger";

export const id = "001_init_collections";

export async function up(): Promise<void> {
  const db = mongoose.connection.db;
  if (!db) {
    throw new Error("Database is not connected");
  }

  const existing = await db.listCollections().toArray();
  const names = new Set(existing.map((collection) => collection.name));

  const requiredCollections = ["users", "portfolios", "trades", "simulationsessions"];
  for (const name of requiredCollections) {
    if (!names.has(name)) {
      await db.createCollection(name);
      logger.info("migration_collection_created", { name });
    }
  }

  await db.collection("users").createIndex({ email: 1 }, { unique: true, background: true });
  await db.collection("portfolios").createIndex({ userId: 1 }, { unique: true, background: true });
  await db.collection("trades").createIndex({ userId: 1, createdAt: -1 }, { background: true });
  await db.collection("simulationsessions").createIndex({ userId: 1 }, { unique: true, background: true });

  logger.info("migration_indexes_ensured", { migrationId: id });
}
