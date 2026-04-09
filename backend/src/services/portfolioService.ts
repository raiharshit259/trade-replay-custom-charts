import { PortfolioModel } from "../models/Portfolio";
import { TradeModel } from "../models/Trade";
import { CandleData, Currency, Holding } from "../types/shared";
import { getOrSetCachedJsonWithLock, setCachedJson } from "./cache.service";

export const INITIAL_BALANCE = 100000;
const PORTFOLIO_CACHE_TTL_SECONDS = 300;

function primaryPortfolioCacheKey(userId: string): string {
  return `app:portfolio:${userId}`;
}

function legacyPortfolioCacheKey(userId: string): string {
  return `user:${userId}:portfolio`;
}

type PortfolioSnapshot = {
  balance: number;
  holdings: Holding[];
  currency: Currency;
};

export async function writeThroughPortfolioCache(userId: string, portfolio: PortfolioSnapshot): Promise<void> {
  await Promise.all([
    setCachedJson(primaryPortfolioCacheKey(userId), portfolio, PORTFOLIO_CACHE_TTL_SECONDS),
    setCachedJson(legacyPortfolioCacheKey(userId), portfolio, PORTFOLIO_CACHE_TTL_SECONDS),
  ]);
}

export async function ensurePortfolio(userId: string): Promise<{
  balance: number;
  holdings: Holding[];
  currency: Currency;
}> {
  const cached = await getOrSetCachedJsonWithLock<PortfolioSnapshot>(
    primaryPortfolioCacheKey(userId),
    PORTFOLIO_CACHE_TTL_SECONDS,
    async () => {
      const portfolio =
        (await PortfolioModel.findOne({ userId }).lean()) ||
        (await PortfolioModel.create({ userId, balance: INITIAL_BALANCE, holdings: [], currency: "USD" }));

      return {
        balance: portfolio.balance,
        holdings: portfolio.holdings as Holding[],
        currency: portfolio.currency as Currency,
      };
    },
  );

  await setCachedJson(legacyPortfolioCacheKey(userId), cached, PORTFOLIO_CACHE_TTL_SECONDS);
  return cached;
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
