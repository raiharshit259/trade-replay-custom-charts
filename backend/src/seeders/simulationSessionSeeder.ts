import mongoose from "mongoose";
import { SimulationSessionModel } from "../models/SimulationSession";

export async function seedSimulationSession(userId: string): Promise<void> {
  await SimulationSessionModel.findOneAndUpdate(
    { userId: new mongoose.Types.ObjectId(userId) },
    {
      $set: {
        userId: new mongoose.Types.ObjectId(userId),
        scenarioId: "covid-2020",
        symbol: "AAPL",
        currentIndex: 15,
        totalCandles: 260,
        isPlaying: false,
        playSpeed: 1,
        startDate: "2020-01-02",
        endDate: "2020-12-31",
      },
    },
    { upsert: true },
  );
}
