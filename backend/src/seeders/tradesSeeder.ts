import mongoose from "mongoose";
import { TradeModel } from "../models/Trade";

export async function seedTrades(userId: string): Promise<void> {
  const objectId = new mongoose.Types.ObjectId(userId);

  await TradeModel.deleteMany({ userId: objectId });
  await TradeModel.insertMany([
    {
      userId: objectId,
      symbol: "AAPL",
      type: "BUY",
      price: 175,
      quantity: 20,
      total: 3500,
      date: "2020-01-10",
      realizedPnl: 0,
    },
    {
      userId: objectId,
      symbol: "TSLA",
      type: "BUY",
      price: 210,
      quantity: 10,
      total: 2100,
      date: "2020-01-14",
      realizedPnl: 0,
    },
    {
      userId: objectId,
      symbol: "AAPL",
      type: "SELL",
      price: 190,
      quantity: 5,
      total: 950,
      date: "2020-01-20",
      realizedPnl: 75,
    },
  ]);
}
