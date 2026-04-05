import { parse } from "csv-parse/sync";
import { SavedPortfolioModel } from "../models/SavedPortfolio";
import { Holding } from "../types/shared";

function normalizePortfolioName(name: string): string {
  return String(name).trim().replace(/\s+/g, " ").toLowerCase();
}

function sanitizePortfolioName(name: string): string {
  return String(name).trim().replace(/\s+/g, " ");
}

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function isDuplicateKeyError(error: unknown): boolean {
  return typeof error === "object" && error !== null && "code" in error && (error as { code?: number }).code === 11000;
}

function normalizeHoldings(input: Holding[]): Holding[] {
  return input
    .map((holding) => ({
      symbol: String(holding.symbol || "").trim().toUpperCase(),
      quantity: Number(holding.quantity),
      avgPrice: Number(holding.avgPrice),
    }))
    .filter((holding) => holding.symbol && holding.quantity > 0 && holding.avgPrice > 0);
}

function computeTotals(holdings: Holding[]) {
  const totalValue = holdings.reduce((acc, holding) => acc + holding.quantity * holding.avgPrice, 0);
  const pnl = totalValue * 0.04;
  return {
    totalValue,
    pnl,
    pnlPercent: totalValue > 0 ? Number(((pnl / totalValue) * 100).toFixed(2)) : 0,
  };
}

function mapSavedPortfolio(portfolio: {
  _id: unknown;
  name: string;
  baseCurrency: string;
  holdings: Holding[];
  createdAt?: Date;
  updatedAt?: Date;
}) {
  const totals = computeTotals(portfolio.holdings);
  return {
    id: String(portfolio._id),
    name: portfolio.name,
    baseCurrency: portfolio.baseCurrency,
    holdings: portfolio.holdings,
    ...totals,
    createdAt: portfolio.createdAt,
    updatedAt: portfolio.updatedAt,
  };
}

export async function listSavedPortfolios(userId: string) {
  const rows = await SavedPortfolioModel.find({ userId }).sort({ createdAt: -1 });
  return rows.map((row) => mapSavedPortfolio({
    _id: row._id,
    name: row.name,
    baseCurrency: row.baseCurrency,
    holdings: row.holdings as Holding[],
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  }));
}

export async function getSavedPortfolioById(userId: string, portfolioId: string) {
  const row = await SavedPortfolioModel.findOne({ _id: portfolioId, userId });
  if (!row) throw new Error("PORTFOLIO_NOT_FOUND");
  return mapSavedPortfolio({
    _id: row._id,
    name: row.name,
    baseCurrency: row.baseCurrency,
    holdings: row.holdings as Holding[],
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  });
}

export async function createSavedPortfolio(input: {
  userId: string;
  name: string;
  baseCurrency?: string;
  holdings: Holding[];
}) {
  const holdings = normalizeHoldings(input.holdings);
  if (!holdings.length) throw new Error("EMPTY_PORTFOLIO");
  const sanitizedName = sanitizePortfolioName(input.name);
  const normalizedName = normalizePortfolioName(sanitizedName);
  const exactNameRegex = new RegExp(`^${escapeRegex(sanitizedName)}$`, "i");

  const existing = await SavedPortfolioModel.findOne({
    userId: input.userId,
    $or: [
      { nameNormalized: normalizedName },
      { name: { $regex: exactNameRegex } },
    ],
  }).lean();
  if (existing) {
    throw new Error("PORTFOLIO_NAME_EXISTS");
  }

  let created;
  try {
    created = await SavedPortfolioModel.create({
      userId: input.userId,
      name: sanitizedName,
      nameNormalized: normalizedName,
      baseCurrency: input.baseCurrency ?? "USD",
      holdings,
    });
  } catch (error) {
    if (isDuplicateKeyError(error)) {
      throw new Error("PORTFOLIO_NAME_EXISTS");
    }
    throw error;
  }

  return mapSavedPortfolio({
    _id: created._id,
    name: created.name,
    baseCurrency: created.baseCurrency,
    holdings: created.holdings as Holding[],
    createdAt: created.createdAt,
    updatedAt: created.updatedAt,
  });
}

export async function importSavedPortfolioFromCsv(input: {
  userId: string;
  name: string;
  baseCurrency?: string;
  csvRaw: string;
}) {
  const records = parse(input.csvRaw, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
    bom: true,
  }) as Array<{ symbol: string; quantity: string; avgPrice: string }>;

  const holdings = normalizeHoldings(
    records.map((record) => ({
      symbol: record.symbol,
      quantity: Number(record.quantity),
      avgPrice: Number(record.avgPrice),
    })),
  );

  if (!holdings.length) throw new Error("EMPTY_PORTFOLIO");

  return createSavedPortfolio({
    userId: input.userId,
    name: input.name,
    baseCurrency: input.baseCurrency,
    holdings,
  });
}

export async function updateSavedPortfolio(input: {
  userId: string;
  portfolioId: string;
  name: string;
  baseCurrency?: string;
  holdings: Holding[];
}) {
  const holdings = normalizeHoldings(input.holdings);
  if (!holdings.length) throw new Error("EMPTY_PORTFOLIO");
  const sanitizedName = sanitizePortfolioName(input.name);
  const normalizedName = normalizePortfolioName(sanitizedName);
  const exactNameRegex = new RegExp(`^${escapeRegex(sanitizedName)}$`, "i");

  const existing = await SavedPortfolioModel.findOne({
    userId: input.userId,
    $or: [
      { nameNormalized: normalizedName },
      { name: { $regex: exactNameRegex } },
    ],
    _id: { $ne: input.portfolioId },
  }).lean();

  if (existing) {
    throw new Error("PORTFOLIO_NAME_EXISTS");
  }

  let updated;
  try {
    updated = await SavedPortfolioModel.findOneAndUpdate(
      { _id: input.portfolioId, userId: input.userId },
      {
        $set: {
          name: sanitizedName,
          nameNormalized: normalizedName,
          baseCurrency: input.baseCurrency ?? "USD",
          holdings,
        },
      },
      { new: true },
    );
  } catch (error) {
    if (isDuplicateKeyError(error)) {
      throw new Error("PORTFOLIO_NAME_EXISTS");
    }
    throw error;
  }

  if (!updated) {
    throw new Error("PORTFOLIO_NOT_FOUND");
  }

  return mapSavedPortfolio({
    _id: updated._id,
    name: updated.name,
    baseCurrency: updated.baseCurrency,
    holdings: updated.holdings as Holding[],
    createdAt: updated.createdAt,
    updatedAt: updated.updatedAt,
  });
}
