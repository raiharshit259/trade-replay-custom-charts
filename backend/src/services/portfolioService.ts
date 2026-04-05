import { PortfolioModel } from "../models/Portfolio";
import { TradeModel } from "../models/Trade";
import { CandleData, Currency, Holding } from "../types/shared";

export const INITIAL_BALANCE = 100000;

export async function ensurePortfolio(userId: string): Promise<{
  balance: number;
  holdings: Holding[];
  currency: Currency;
}> {
  const portfolio =
    (await PortfolioModel.findOne({ userId }).lean()) ||
    (await PortfolioModel.create({ userId, balance: INITIAL_BALANCE, holdings: [], currency: "USD" }));

  return {
    balance: portfolio.balance,
    holdings: portfolio.holdings as Holding[],
    currency: portfolio.currency as Currency,
  };
}

export async function setCurrency(userId: string, currency: Currency) {
  const updated = await PortfolioModel.findOneAndUpdate(
    { userId },
    { $set: { currency } },
    { new: true, upsert: true },
  ).lean();

  return updated;
}

export function computePortfolioValue(balance: number, holdings: Holding[], currentBySymbol: Record<string, CandleData | null>): number {
  const holdingsValue = holdings.reduce((acc, holding) => {
    const current = currentBySymbol[holding.symbol];
    const price = current?.close ?? holding.avgPrice;
    return acc + holding.quantity * price;
  }, 0);

  return balance + holdingsValue;
}

export async function listTrades(userId: string) {
  return TradeModel.find({ userId }).sort({ createdAt: -1 }).lean();
}
