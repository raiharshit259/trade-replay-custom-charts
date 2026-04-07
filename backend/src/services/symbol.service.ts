import { FilterQuery } from "mongoose";
import { SymbolDocument, SymbolModel } from "../models/Symbol";
import { getCachedJson, setCachedJson } from "./cache.service";

type SymbolType = "stock" | "crypto" | "forex" | "index";
const SUPPORTED_TYPES: SymbolType[] = ["stock", "crypto", "forex", "index"];

function coerceSymbolType(value?: string): SymbolType | undefined {
  if (!value) return undefined;
  const normalized = value.toLowerCase();
  if (SUPPORTED_TYPES.includes(normalized as SymbolType)) {
    return normalized as SymbolType;
  }
  return undefined;
}

export interface SymbolRegistryItem {
  symbol: string;
  fullSymbol: string;
  name: string;
  exchange: string;
  country: string;
  type: SymbolType;
  currency: string;
  iconUrl?: string;
  companyDomain?: string;
  popularity: number;
}

export interface SymbolSearchResult {
  items: SymbolRegistryItem[];
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
}

const CACHE_TTL_SECONDS = 60;

function normalizeQuery(query: string): string {
  return query.trim();
}

function rankSymbol(item: SymbolRegistryItem, normalizedQuery: string): number {
  if (!normalizedQuery) {
    return item.popularity * 10;
  }

  const q = normalizedQuery.toUpperCase();
  const symbolUpper = item.symbol.toUpperCase();
  const nameUpper = item.name.toUpperCase();

  const startsWithScore = symbolUpper.startsWith(q) ? 100 : 0;
  const nameContainsScore = nameUpper.includes(q) ? 50 : 0;
  const fullSymbolScore = item.fullSymbol.toUpperCase().includes(q) ? 30 : 0;

  return startsWithScore + nameContainsScore + fullSymbolScore + item.popularity * 10;
}

function toRegistryItem(document: SymbolDocument): SymbolRegistryItem {
  return {
    symbol: document.symbol,
    fullSymbol: document.fullSymbol,
    name: document.name,
    exchange: document.exchange,
    country: document.country,
    type: document.type,
    currency: document.currency,
    popularity: document.popularity,
  };
}

function buildFilter(params: { query: string; type?: string; country?: string }): FilterQuery<SymbolDocument> {
  const filter: FilterQuery<SymbolDocument> = {};
  const q = normalizeQuery(params.query);

  if (q) {
    filter.$or = [
      { symbol: { $regex: `^${escapeRegex(q)}`, $options: "i" } },
      { name: { $regex: escapeRegex(q), $options: "i" } },
      { fullSymbol: { $regex: escapeRegex(q), $options: "i" } },
    ];
  }

  if (params.type) {
    const type = coerceSymbolType(params.type);
    if (type) {
      filter.type = type;
    }
  }

  if (params.country) {
    filter.country = params.country.toUpperCase();
  }

  return filter;
}

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export async function searchSymbols(params: {
  query: string;
  type?: string;
  country?: string;
  limit?: number;
  offset?: number;
}): Promise<SymbolSearchResult> {
  const query = normalizeQuery(params.query);
  const limit = Math.max(1, Math.min(100, params.limit ?? 25));
  const offset = Math.max(0, params.offset ?? 0);

  const cacheKey = `symbol:${query.toLowerCase()}:${params.type ?? "all"}:${params.country ?? "all"}:${limit}:${offset}`;
  const cached = await getCachedJson<SymbolSearchResult>(cacheKey);
  if (cached) return cached;

  const filter = buildFilter({ query, type: params.type, country: params.country });

  const [total, docs] = await Promise.all([
    SymbolModel.countDocuments(filter),
    SymbolModel.find(filter)
      .select({
        symbol: 1,
        fullSymbol: 1,
        name: 1,
        exchange: 1,
        country: 1,
        type: 1,
        currency: 1,
        iconUrl: 1,
        companyDomain: 1,
        popularity: 1,
      })
      .limit(Math.max(limit * 4, 100))
      .lean<SymbolRegistryItem[]>(),
  ]);

  const ranked = docs
    .map((item) => ({ item, score: rankSymbol(item, query) }))
    .sort((left, right) => {
      if (right.score !== left.score) return right.score - left.score;
      return left.item.symbol.localeCompare(right.item.symbol);
    });

  const paged = ranked.slice(offset, offset + limit).map((entry) => entry.item);

  const response: SymbolSearchResult = {
    items: paged,
    total,
    limit,
    offset,
    hasMore: offset + limit < total,
  };

  await setCachedJson(cacheKey, response, CACHE_TTL_SECONDS);
  return response;
}

export async function fetchSymbolFilters(type?: string): Promise<{
  countries: Array<{ value: string; label: string }>;
  types: Array<{ value: string; label: string }>;
}> {
  const filter: FilterQuery<SymbolDocument> = {};
  const resolvedType = coerceSymbolType(type);
  if (resolvedType) {
    filter.type = resolvedType;
  }

  const [countryRows, typeRows] = await Promise.all([
    SymbolModel.aggregate<{ _id: string; count: number }>([
      { $match: filter },
      { $group: { _id: "$country", count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]),
    SymbolModel.aggregate<{ _id: string; count: number }>([
      { $match: filter },
      { $group: { _id: "$type", count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]),
  ]);

  return {
    countries: [{ value: "all", label: "All Countries" }, ...countryRows.map((row) => ({ value: row._id, label: row._id }))],
    types: [{ value: "all", label: "All Types" }, ...typeRows.map((row) => ({ value: row._id, label: toTypeLabel(row._id) }))],
  };
}

function toTypeLabel(type: string): string {
  if (type === "stock") return "Stock";
  if (type === "crypto") return "Crypto";
  if (type === "forex") return "Forex";
  if (type === "index") return "Index";
  return type;
}

export function mapCategoryToSymbolType(category?: string): SymbolType | undefined {
  if (!category) return undefined;
  const normalized = category.toLowerCase();
  if (normalized === "stocks" || normalized === "funds" || normalized === "bonds" || normalized === "options") return "stock";
  if (normalized === "crypto") return "crypto";
  if (normalized === "forex") return "forex";
  if (normalized === "indices" || normalized === "futures" || normalized === "economy") return "index";
  return undefined;
}

export function toAssetSearchItem(symbol: SymbolRegistryItem) {
  const category = symbol.type === "stock"
    ? "stocks"
    : symbol.type === "crypto"
      ? "crypto"
      : symbol.type === "forex"
        ? "forex"
        : "indices";

  const market = category === "stocks"
    ? "Stocks"
    : category === "crypto"
      ? "Crypto"
      : category === "forex"
        ? "Forex"
        : "Indices";

  const stockIconUrl = symbol.companyDomain ? `https://logo.clearbit.com/${symbol.companyDomain}` : "";

  return {
    ticker: symbol.symbol,
    symbol: symbol.symbol,
    name: symbol.name,
    exchange: symbol.exchange,
    region: symbol.country,
    instrumentType: symbol.type,
    type: symbol.type,
    category,
    assetType: category,
    market,
    country: symbol.country,
    sector: "",
    exchangeType: symbol.type === "crypto" ? "cex" : "",
    icon: "",
    exchangeIcon: "",
    exchangeLogoUrl: "",
    iconUrl: symbol.iconUrl || stockIconUrl,
    logoUrl: symbol.iconUrl || stockIconUrl,
    source: "symbol-registry",
  };
}
