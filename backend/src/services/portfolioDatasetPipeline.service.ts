import mongoose from "mongoose";
import { env } from "../config/env";
import { connectDB } from "../config/db";
import { PortfolioDatasetMetadataModel } from "../models/PortfolioDatasetMetadata";
import { CsvHoldingRow, generatePortfolioCsv } from "./csv.service";
import { listS3KeysByPrefix, uploadCsvToS3 } from "./s3.service";
import { logger } from "../utils/logger";

type PortfolioType = "real" | "13f" | "simulated";

interface InvestorProfile {
  name: string;
  type: PortfolioType;
  symbols?: string[];
}

interface UploadResult {
  name: string;
  type: PortfolioType;
  s3Key: string;
  holdingCount: number;
}

const TARGET_COUNTS: Record<PortfolioType, number> = {
  real: 35,
  "13f": 45,
  simulated: 20,
};

const TOTAL_TARGET = 100;
const BASE_PREFIX = "trade-replay/portfolios";

const US_SYMBOL_POOL = [
  "AAPL", "MSFT", "AMZN", "GOOGL", "GOOG", "NVDA", "META", "TSLA", "BRK-B", "JPM", "V", "MA", "UNH", "XOM", "CVX",
  "AVGO", "LLY", "ORCL", "COST", "HD", "BAC", "KO", "PEP", "WMT", "MCD", "NFLX", "ADBE", "AMD", "CRM", "QCOM",
  "INTC", "CSCO", "IBM", "CAT", "GE", "BA", "LIN", "SPGI", "MS", "GS", "BKNG", "AMAT", "INTU", "TMO", "NKE",
];

const INDIA_SYMBOL_POOL = [
  "RELIANCE.NS", "TCS.NS", "INFY.NS", "HDFCBANK.NS", "ICICIBANK.NS", "ITC.NS", "LT.NS", "SBIN.NS", "AXISBANK.NS", "KOTAKBANK.NS",
  "HINDUNILVR.NS", "ASIANPAINT.NS", "BAJFINANCE.NS", "SUNPHARMA.NS", "MARUTI.NS", "TITAN.NS", "ULTRACEMCO.NS", "DMART.NS", "PIDILITIND.NS", "TATAMOTORS.NS",
  "BHARTIARTL.NS", "HCLTECH.NS", "WIPRO.NS", "ONGC.NS", "POWERGRID.NS", "ADANIENT.NS", "ADANIPORTS.NS", "COALINDIA.NS", "NTPC.NS", "M&M.NS",
];

const REAL_SYMBOL_HINTS: Record<string, string[]> = {
  "Warren Buffett": ["AAPL", "BAC", "KO", "CVX", "AMZN", "AXP", "OXY", "MCO"],
  "Charlie Munger": ["AAPL", "COST", "BAC", "WFC", "BRK-B", "USB", "BABA", "MSFT"],
  "Rakesh Jhunjhunwala": ["TITAN.NS", "TATAMOTORS.NS", "CRISIL.NS", "FORTIS.NS", "NCC.NS", "CANARA BANK.NS"],
  "Nikhil Kamath": ["HDFCBANK.NS", "ICICIBANK.NS", "TCS.NS", "INFY.NS", "RELIANCE.NS", "LT.NS"],
  "Radhakishan Damani": ["DMART.NS", "BLUE DART.NS", "VSTIND.NS", "TRENT.NS", "ABB.NS", "3MINDIA.NS"],
};

const THIRTEEN_F_SYMBOL_HINTS: Record<string, string[]> = {
  "Berkshire Hathaway": ["AAPL", "BAC", "CVX", "KO", "AXP", "OXY", "MCO", "DVA", "HPQ", "KHC"],
  Bridgewater: ["SPY", "IVV", "VOO", "IEMG", "GLD", "TLT", "XLP", "XLE", "JNJ", "PG"],
  "Pershing Square": ["GOOGL", "QSR", "HLT", "CMG", "LOW", "CP", "HHC", "ORC", "BN"],
};

const SIMULATED_SYMBOL_HINTS: Record<string, string[]> = {
  "Elon Musk": ["TSLA", "NVDA", "GOOGL", "MSFT", "AMD", "PLTR", "ARKK", "SPCE"],
  "Donald Trump": ["DJT", "XOM", "JPM", "LMT", "NOC", "CVX", "BA", "CAT"],
  "Mukesh Ambani": ["RELIANCE.NS", "JIOFIN.NS", "TCS.NS", "INFY.NS", "HDFCBANK.NS", "BHARTIARTL.NS", "SUNPHARMA.NS", "LT.NS"],
  "Gautam Adani": ["ADANIENT.NS", "ADANIPORTS.NS", "ACC.NS", "AMBUJACEM.NS", "POWERGRID.NS", "NTPC.NS", "L&T.NS", "COALINDIA.NS"],
};

const REAL_INVESTORS = [
  "Warren Buffett", "Charlie Munger", "Rakesh Jhunjhunwala", "Nikhil Kamath", "Radhakishan Damani", "Dolly Khanna", "Vijay Kedia", "Ashish Kacholia", "Porinju Veliyath", "Mohnish Pabrai",
  "Raamdeo Agrawal", "Madhusudan Kela", "Sunil Singhania", "Nemish Shah", "Akash Bhanshali", "Anil Kumar Goel", "Ashish Dhawan", "Ramesh Damani", "Deepak Shenoy", "Sanjiv Bhasin",
  "Peter Lynch", "Joel Greenblatt", "Guy Spier", "Li Lu", "Terry Smith", "Howard Marks", "Prem Watsa", "Cathie Wood", "Chris Hohn", "Seth Klarman",
  "Bill Nygren", "David Tepper", "Chase Coleman", "François Rochon", "Monika Halan",
];

const THIRTEEN_F_FUNDS = [
  "Berkshire Hathaway", "Bridgewater", "Pershing Square", "Scion Asset Management", "Third Point", "Tiger Global", "Coatue Management", "Point72", "Viking Global", "D.E. Shaw",
  "Renaissance Technologies", "Citadel Advisors", "Two Sigma", "Millennium Management", "AQR Capital", "Soroban Capital", "Lone Pine Capital", "Maverick Capital", "Greenlight Capital", "Baupost Group",
  "Appaloosa Management", "Farallon Capital", "Elliott Management", "Oaktree Capital", "T. Rowe Price", "Fidelity Management", "BlackRock Advisors", "Vanguard Group", "Invesco", "State Street",
  "Capital Group", "Franklin Advisors", "Wellington Management", "Morgan Stanley Investment", "JPMorgan Investment", "Goldman Sachs Asset", "Wells Fargo Advisors", "BNY Mellon", "Nuveen", "Pzena Investment",
  "Arrowstreet Capital", "Adage Capital", "Yacktman Asset", "First Eagle Investment", "Soros Fund Management",
];

const SIMULATED_CELEBRITIES = [
  "Elon Musk", "Donald Trump", "Mukesh Ambani", "Gautam Adani", "Bill Gates", "Jeff Bezos", "Mark Zuckerberg", "Sundar Pichai", "Satya Nadella", "Tim Cook",
  "Oprah Winfrey", "LeBron James", "Taylor Swift", "Shah Rukh Khan", "Virat Kohli", "Rihanna", "Jay-Z", "Deepika Padukone", "Priyanka Chopra", "Cristiano Ronaldo",
];

function slugify(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

function hashCode(input: string): number {
  let hash = 0;
  for (let index = 0; index < input.length; index += 1) {
    hash = (hash * 31 + input.charCodeAt(index)) >>> 0;
  }
  return hash;
}

function pickSymbols(name: string, type: PortfolioType, count: number): string[] {
  const hints = type === "real"
    ? REAL_SYMBOL_HINTS[name]
    : type === "13f"
      ? THIRTEEN_F_SYMBOL_HINTS[name]
      : SIMULATED_SYMBOL_HINTS[name];

  const pool = type === "real"
    ? [...INDIA_SYMBOL_POOL, ...US_SYMBOL_POOL]
    : type === "13f"
      ? US_SYMBOL_POOL
      : [...US_SYMBOL_POOL, ...INDIA_SYMBOL_POOL];

  const chosen = new Set<string>(hints ?? []);
  const seed = hashCode(`${type}-${name}`);
  let cursor = seed % pool.length;

  while (chosen.size < count) {
    chosen.add(pool[cursor % pool.length]);
    cursor += 7;
  }

  return Array.from(chosen).slice(0, count);
}

async function fetchPrices(symbols: string[]): Promise<Map<string, number>> {
  const result = new Map<string, number>();
  const chunks: string[][] = [];
  for (let index = 0; index < symbols.length; index += 50) {
    chunks.push(symbols.slice(index, index + 50));
  }

  await Promise.all(chunks.map(async (chunk) => {
    const url = `https://query1.finance.yahoo.com/v7/finance/quote?symbols=${encodeURIComponent(chunk.join(","))}`;
    try {
      const response = await fetch(url, { headers: { "User-Agent": "tradereplay-pipeline/1.0" } });
      if (!response.ok) {
        return;
      }
      const payload = await response.json() as { quoteResponse?: { result?: Array<{ symbol: string; regularMarketPrice?: number }> } };
      for (const quote of payload.quoteResponse?.result ?? []) {
        if (typeof quote.regularMarketPrice === "number" && quote.regularMarketPrice > 0) {
          result.set(quote.symbol, Number(quote.regularMarketPrice.toFixed(2)));
        }
      }
    } catch (_error) {
      // Ignore quote API failures and use deterministic fallback pricing.
    }
  }));

  return result;
}

function fallbackPrice(symbol: string): number {
  const hash = hashCode(symbol);
  const base = 20 + (hash % 480);
  return Number(base.toFixed(2));
}

function buildHoldings(profile: InvestorProfile, prices: Map<string, number>): CsvHoldingRow[] {
  const seed = hashCode(`${profile.type}-${profile.name}`);
  const holdingCount = 5 + (seed % 12);
  const symbols = pickSymbols(profile.name, profile.type, holdingCount);

  return symbols.map((symbol, index) => {
    const quote = prices.get(symbol) ?? fallbackPrice(symbol);
    const quantity = 100 + ((seed + index * 37) % 4900);
    const avgPrice = Number((quote * (0.85 + ((seed + index * 13) % 30) / 100)).toFixed(2));
    const marketValue = Number((quantity * avgPrice).toFixed(2));
    const stock = symbol.replace(/\.NS$/i, "").replace(/-/g, " ").replace(/\./g, " ");

    return {
      stock,
      symbol,
      quantity,
      avgPrice,
      marketValue,
    };
  });
}

function validateHoldings(rows: CsvHoldingRow[]): void {
  if (rows.length < 5 || rows.length > 20) {
    throw new Error("INVALID_HOLDING_COUNT");
  }

  const uniqueSymbols = new Set(rows.map((row) => row.symbol));
  if (uniqueSymbols.size !== rows.length) {
    throw new Error("DUPLICATE_SYMBOLS_IN_PORTFOLIO");
  }

  if (rows.some((row) => !row.symbol || row.quantity <= 0 || row.avgPrice <= 0 || row.marketValue <= 0)) {
    throw new Error("INVALID_HOLDING_VALUES");
  }
}

function buildProfiles(): InvestorProfile[] {
  const real = REAL_INVESTORS.slice(0, TARGET_COUNTS.real).map((name) => ({ name, type: "real" as const }));
  const filing = THIRTEEN_F_FUNDS.slice(0, TARGET_COUNTS["13f"]).map((name) => ({ name, type: "13f" as const }));
  const simulated = SIMULATED_CELEBRITIES.slice(0, TARGET_COUNTS.simulated).map((name) => ({ name, type: "simulated" as const }));

  return [...real, ...filing, ...simulated];
}

export async function runPortfolioDatasetPipeline(): Promise<{
  uploaded: UploadResult[];
  failed: Array<{ name: string; type: PortfolioType; reason: string }>;
  s3PrefixCount: number;
}> {
  const profiles = buildProfiles();
  if (profiles.length !== TOTAL_TARGET) {
    throw new Error(`INVALID_PROFILE_COUNT_${profiles.length}`);
  }

  const symbols = Array.from(new Set(
    profiles.flatMap((profile) => pickSymbols(profile.name, profile.type, 16)),
  ));

  const prices = await fetchPrices(symbols);
  const seenDatasetSignatures = new Set<string>();

  const tasks = profiles.map(async (profile): Promise<UploadResult> => {
    const rows = buildHoldings(profile, prices);
    validateHoldings(rows);

    const signature = rows.map((row) => `${row.symbol}:${row.quantity}:${row.avgPrice}`).join("|");
    if (seenDatasetSignatures.has(signature)) {
      throw new Error("DUPLICATE_DATASET_DETECTED");
    }
    seenDatasetSignatures.add(signature);

    const csv = generatePortfolioCsv(rows);
    if (csv.trim().split("\n").length <= 1) {
      throw new Error("EMPTY_CSV_GENERATED");
    }

    const key = `${BASE_PREFIX}/${profile.type}/${slugify(profile.name)}.csv`;
    await uploadCsvToS3(key, csv);

    return {
      name: profile.name,
      type: profile.type,
      s3Key: key,
      holdingCount: rows.length,
    };
  });

  const settled = await Promise.allSettled(tasks);
  const uploaded: UploadResult[] = [];
  const failed: Array<{ name: string; type: PortfolioType; reason: string }> = [];

  settled.forEach((entry, index) => {
    const profile = profiles[index];
    if (entry.status === "fulfilled") {
      uploaded.push(entry.value);
      return;
    }

    failed.push({
      name: profile.name,
      type: profile.type,
      reason: entry.reason instanceof Error ? entry.reason.message : String(entry.reason),
    });
  });

  if (uploaded.length > 0) {
    try {
      await connectDB();
      await PortfolioDatasetMetadataModel.insertMany(
        uploaded.map((item) => ({
          name: item.name,
          type: item.type,
          s3Key: item.s3Key,
          createdAt: new Date(),
        })),
        { ordered: false },
      );
    } catch (error) {
      logger.warn("portfolio_dataset_metadata_write_failed", {
        message: error instanceof Error ? error.message : String(error),
      });
    } finally {
      if (mongoose.connection.readyState === 1) {
        await mongoose.connection.close();
      }
    }
  }

  const keys = await listS3KeysByPrefix(`${BASE_PREFIX}/`);

  return {
    uploaded,
    failed,
    s3PrefixCount: keys.length,
  };
}

export function printPipelineSummary(result: {
  uploaded: UploadResult[];
  failed: Array<{ name: string; type: PortfolioType; reason: string }>;
  s3PrefixCount: number;
}): void {
  logger.info("portfolio_pipeline_summary", {
    totalUploaded: result.uploaded.length,
    totalFailed: result.failed.length,
    s3PrefixCount: result.s3PrefixCount,
    requiredTotal: TOTAL_TARGET,
  });

  if (result.failed.length > 0) {
    logger.warn("portfolio_pipeline_failures", {
      failed: result.failed,
    });
  }
}
