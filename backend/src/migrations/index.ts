import mongoose from "mongoose";
import { connectDB } from "../config/db";
import { logger } from "../utils/logger";
import { MigrationRecord } from "../types/service";
import { id as initCollectionsId, up as initCollectionsUp } from "./001_initCollections";

const migrations: Array<{ id: string; up: () => Promise<void> }> = [
  { id: initCollectionsId, up: initCollectionsUp },
];

export async function runMigrations(): Promise<void> {
  await connectDB();

  const db = mongoose.connection.db;
  if (!db) {
    throw new Error("Database is not connected");
  }

  const migrationsCollection = db.collection<MigrationRecord>("migrations");
  await migrationsCollection.createIndex({ id: 1 }, { unique: true, background: true });

  for (const migration of migrations) {
    const exists = await migrationsCollection.findOne({ id: migration.id });
    if (exists) {
      logger.info("migration_skipped", { migrationId: migration.id });
      continue;
    }

    logger.info("migration_start", { migrationId: migration.id });
    await migration.up();
    await migrationsCollection.insertOne({ id: migration.id, ranAt: new Date() });
    logger.info("migration_done", { migrationId: migration.id });
  }

  await mongoose.connection.close();
}

runMigrations()
  .then(() => {
    logger.info("migrations_complete");
    process.exit(0);
  })
  .catch(async (error: unknown) => {
    logger.error("migrations_failed", { error: error instanceof Error ? error.message : String(error) });
    await mongoose.connection.close();
    process.exit(1);
  });
