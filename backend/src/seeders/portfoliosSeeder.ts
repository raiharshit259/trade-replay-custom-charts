import mongoose from "mongoose";
import { PortfolioModel } from "../models/Portfolio";

export async function seedPortfolios(userId: string): Promise<void> {
  await PortfolioModel.findOneAndUpdate(
    { userId: new mongoose.Types.ObjectId(userId) },
    {
      $set: {
        balance: 100000,
        currency: "USD",
        holdings: [
          { symbol: "AAPL", quantity: 20, avgPrice: 180 },
          { symbol: "TSLA", quantity: 10, avgPrice: 220 },
        ],
      },
    },
    { upsert: true, returnDocument: "after" },
  );
}
