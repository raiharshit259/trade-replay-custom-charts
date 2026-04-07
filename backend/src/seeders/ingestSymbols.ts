import mongoose from "mongoose";
import { connectDB } from "../config/db";
import { ingestGlobalSymbols } from "../services/ingestion.service";
import { logger } from "../utils/logger";

async function main(): Promise<void> {
  await connectDB();
  const result = await ingestGlobalSymbols();
  logger.info("symbol_ingestion_completed", result);
  await mongoose.connection.close();
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    logger.error("symbol_ingestion_failed", {
      message: error instanceof Error ? error.message : String(error),
    });
    process.exit(1);
  });
