import mongoose from "mongoose";
import { connectDB } from "../config/db";
import { logger } from "../utils/logger";
import { seedUsers } from "./usersSeeder";
import { seedPortfolios } from "./portfoliosSeeder";
import { seedTrades } from "./tradesSeeder";
import { seedSimulationSession } from "./simulationSessionSeeder";

async function runSeeders(): Promise<void> {
  await connectDB();

  const { userId } = await seedUsers();
  await seedPortfolios(userId);
  await seedTrades(userId);
  await seedSimulationSession(userId);

  logger.info("seed_complete", { userEmail: "demo@test.com" });
  await mongoose.connection.close();
}

runSeeders()
  .then(() => process.exit(0))
  .catch(async (error: unknown) => {
    logger.error("seed_failed", { error: error instanceof Error ? error.message : String(error) });
    await mongoose.connection.close();
    process.exit(1);
  });
