import { redisClient } from "../config/redis";

export type AssetCategory = "stocks" | "funds" | "futures" | "forex" | "crypto" | "indices" | "bonds" | "economy" | "options";
export type AssetType = AssetCategory;
export type MarketType = "Stocks" | "Funds" | "Futures" | "Forex" | "Crypto" | "Indices" | "Bonds" | "Economy" | "Options";
type AssetSource = "yahoo" | "coingecko" | "forex-universe" | "static" | "tradingview";

export interface AssetCatalogItem {
  ticker: string;
  symbol: string;
  name: string;
  exchange: string;
  region: string;
  instrumentType: string;
  type: string;
  category: AssetCategory;
  assetType: AssetType;
  market: MarketType;
  country: string;
  sector: string;
  icon: string;
  iconUrl: string;
  logoUrl: string;
  exchangeIcon: string;
  exchangeLogoUrl: string;
  source: AssetSource;
  exchangeType: string;
}

export interface AssetSearchResponse {
  assets: AssetCatalogItem[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

export interface AssetSearchFilterOption {
  value: string;
  label: string;
  icon?: string;
  subtitle?: string;
}

export interface AssetSearchFiltersResponse {
  activeFilters: string[];
  countries: AssetSearchFilterOption[];
  types: AssetSearchFilterOption[];
  sectors: AssetSearchFilterOption[];
  sources: AssetSearchFilterOption[];
  exchangeTypes: AssetSearchFilterOption[];
  sourceUiType?: "modal" | "dropdown";
}

const CACHE_TTL_SECONDS = 60;
const memoryCache = new Map<string, { expiresAt: number; payload: AssetSearchResponse }>();
const inFlight = new Map<string, Promise<AssetSearchResponse>>();

const exchangeLogoMap: Record<string, string> = {
  NASDAQ: "https://logo.clearbit.com/nasdaq.com",
  NYSE: "https://logo.clearbit.com/nyse.com",
  NSE: "https://logo.clearbit.com/nseindia.com",
  BSE: "https://logo.clearbit.com/bseindia.com",
  BINANCE: "https://logo.clearbit.com/binance.com",
  COINBASE: "https://logo.clearbit.com/coinbase.com",
  CME: "https://logo.clearbit.com/cmegroup.com",
  CBOE: "https://logo.clearbit.com/cboe.com",
  EUREX: "https://logo.clearbit.com/eurex.com",
  FOREX: "https://logo.clearbit.com/oanda.com",
  FX: "https://logo.clearbit.com/oanda.com",
  OTC: "https://logo.clearbit.com/otcmarkets.com",
  "ICE FUTURES": "https://logo.clearbit.com/theice.com",
  "US BOND": "https://logo.clearbit.com/treasury.gov",
  "MACRO DATA": "https://logo.clearbit.com/stlouisfed.org",
};

const symbolDomainMap: Record<string, string> = {
  AAPL: "apple.com",
  MSFT: "microsoft.com",
  GOOGL: "abc.xyz",
  GOOGL34: "abc.xyz",
  AMZN: "amazon.com",
  TSLA: "tesla.com",
  NVDA: "nvidia.com",
  META: "meta.com",
  RELIANCE: "ril.com",
  "RELIANCE.NS": "ril.com",
  TCS: "tcs.com",
  "TCS.NS": "tcs.com",
};

const forexCountryMap: Record<string, string> = {
  USD: "us",
  EUR: "eu",
  JPY: "jp",
  GBP: "gb",
  INR: "in",
  AUD: "au",
  CAD: "ca",
  CHF: "ch",
  NZD: "nz",
  CNY: "cn",
};

const categoryToMarket: Record<AssetCategory, MarketType> = {
  stocks: "Stocks",
  funds: "Funds",
  futures: "Futures",
  forex: "Forex",
  crypto: "Crypto",
  indices: "Indices",
  bonds: "Bonds",
  economy: "Economy",
  options: "Options",
};

const staticBonds: AssetCatalogItem[] = [
  createStatic("US10Y", "US 10Y Treasury Yield", "US Bond", "us", "bonds", "Government", "US Treasuries", "https://flagcdn.com/us.svg"),
  createStatic("US02Y", "US 2Y Treasury Yield", "US Bond", "us", "bonds", "Government", "US Treasuries", "https://flagcdn.com/us.svg"),
  createStatic("IN10Y", "India 10Y Government Bond", "NSE", "in", "bonds", "Government", "Indian Gov Bonds", "https://flagcdn.com/in.svg"),
  createStatic("DE10Y", "Germany 10Y Bund", "EUREX", "de", "bonds", "Government", "German Bunds", "https://flagcdn.com/de.svg"),
];

const staticEconomy: AssetCatalogItem[] = [
  createStatic("USCPI", "US Consumer Price Index", "Macro Data", "us", "economy", "Inflation", "US Macro", "https://logo.clearbit.com/bls.gov"),
  createStatic("USPPI", "US Producer Price Index", "Macro Data", "us", "economy", "Inflation", "US Macro", "https://logo.clearbit.com/bls.gov"),
  createStatic("USNFP", "US Non-Farm Payrolls", "Macro Data", "us", "economy", "Employment", "US Macro", "https://logo.clearbit.com/bls.gov"),
  createStatic("USGDP", "US Gross Domestic Product", "Macro Data", "us", "economy", "Growth", "US Macro", "https://logo.clearbit.com/bea.gov"),
  createStatic("INIIP", "India Industrial Production", "Macro Data", "in", "economy", "Growth", "India Macro", "https://logo.clearbit.com/mospi.gov.in"),
];

const staticOptions: AssetCatalogItem[] = [
  createStatic("AAPL_C_CHAIN", "Apple Option Chain", "CBOE", "us", "options", "Technology", "US Options", "https://logo.clearbit.com/apple.com"),
  createStatic("SPX_C_CHAIN", "S&P 500 Index Options", "CBOE", "us", "options", "Index", "US Options", "https://logo.clearbit.com/spglobal.com"),
  createStatic("NIFTY_OPT", "NIFTY 50 Option Chain", "NSE", "in", "options", "Index", "India Options", "https://logo.clearbit.com/nseindia.com"),
  createStatic("BANKNIFTY_OPT", "Bank Nifty Option Chain", "NSE", "in", "options", "Banking", "India Options", "https://logo.clearbit.com/nseindia.com"),
];

const staticFunds: AssetCatalogItem[] = [
  createStatic("SPY", "SPDR S&P 500 ETF Trust", "NYSE", "us", "funds", "Index", "US Funds", "https://logo.clearbit.com/ssga.com"),
  createStatic("QQQ", "Invesco QQQ Trust", "NASDAQ", "us", "funds", "Technology", "US Funds", "https://logo.clearbit.com/invesco.com"),
  createStatic("VTI", "Vanguard Total Stock Market ETF", "NYSE", "us", "funds", "Broad Market", "US Funds", "https://logo.clearbit.com/vanguard.com"),
  createStatic("NIFTYBEES", "Nippon India ETF Nifty BeES", "NSE", "in", "funds", "Index", "India Funds", "https://logo.clearbit.com/nipponindiamf.com"),
];

const staticIndices: AssetCatalogItem[] = [
  createStatic("SPX", "S&P 500 Index", "NYSE", "us", "indices", "Large Cap", "US Indices", "https://logo.clearbit.com/spglobal.com"),
  createStatic("NDX", "NASDAQ 100 Index", "NASDAQ", "us", "indices", "Technology", "US Indices", "https://logo.clearbit.com/nasdaq.com"),
  createStatic("DJI", "Dow Jones Industrial Average", "NYSE", "us", "indices", "Blue Chip", "US Indices", "https://logo.clearbit.com/spglobal.com"),
  createStatic("NIFTY50", "NIFTY 50", "NSE", "in", "indices", "Large Cap", "India Indices", "https://logo.clearbit.com/nseindia.com"),
];

const staticFutures: AssetCatalogItem[] = [
  createStatic("ES=F", "E-mini S&P 500 Futures", "CME", "us", "futures", "Index", "US Futures", "https://logo.clearbit.com/cmegroup.com"),
  createStatic("NQ=F", "E-mini Nasdaq 100 Futures", "CME", "us", "futures", "Index", "US Futures", "https://logo.clearbit.com/cmegroup.com"),
  createStatic("CL=F", "WTI Crude Oil Futures", "ICE Futures", "us", "futures", "Energy", "Commodities", "https://logo.clearbit.com/theice.com"),
  createStatic("GC=F", "Gold Futures", "CME", "us", "futures", "Metals", "Commodities", "https://logo.clearbit.com/cmegroup.com"),
];

const typeTaxonomy: AssetSearchFilterOption[] = [
  { value: "all", label: "All types" },
  { value: "Common stock", label: "Common stock" },
  { value: "Preferred stock", label: "Preferred stock" },
  { value: "Depository Receipt", label: "Depository Receipt" },
  { value: "Warrant", label: "Warrant" },
  { value: "Pre-IPO", label: "Pre-IPO" },
];

const sectorTaxonomy: AssetSearchFilterOption[] = [
  { value: "all", label: "All sectors" },
  { value: "Commercial Services", label: "Commercial Services" },
  { value: "Communications", label: "Communications" },
  { value: "Consumer Durables", label: "Consumer Durables" },
  { value: "Consumer Non-Durables", label: "Consumer Non-Durables" },
  { value: "Consumer Services", label: "Consumer Services" },
  { value: "Distribution Services", label: "Distribution Services" },
  { value: "Electronic Technology", label: "Electronic Technology" },
  { value: "Energy Minerals", label: "Energy Minerals" },
  { value: "Finance", label: "Finance" },
  { value: "Government sector", label: "Government sector" },
  { value: "Health Services", label: "Health Services" },
  { value: "Health Technology", label: "Health Technology" },
  { value: "Industrial Services", label: "Industrial Services" },
  { value: "Miscellaneous", label: "Miscellaneous" },
  { value: "Non-Energy Minerals", label: "Non-Energy Minerals" },
  { value: "Process Industries", label: "Process Industries" },
  { value: "Producer Manufacturing", label: "Producer Manufacturing" },
  { value: "Retail Trade", label: "Retail Trade" },
  { value: "Technology Services", label: "Technology Services" },
  { value: "Transportation", label: "Transportation" },
  { value: "Utilities", label: "Utilities" },
];

const countryNameByCode: Record<string, string> = {
  US: "USA",
  CA: "Canada",
  AT: "Austria",
  BE: "Belgium",
  BG: "Bulgaria",
  HR: "Croatia",
  CY: "Cyprus",
  CZ: "Czech Republic",
  DK: "Denmark",
  EE: "Estonia",
  LV: "Latvia",
  LT: "Lithuania",
  LU: "Luxembourg",
  NL: "Netherlands",
  NO: "Norway",
  PL: "Poland",
  PT: "Portugal",
  RO: "Romania",
  SI: "Slovenia",
  GB: "United Kingdom",
  FR: "France",
  DE: "Germany",
  CH: "Switzerland",
  IN: "India",
  JP: "Japan",
  AU: "Australia",
  NZ: "New Zealand",
  TH: "Thailand",
};

const CATEGORY_FILTER_CONFIG: Record<string, string[]> = {
  all: [],
  stocks: ["country", "type", "sector"],
  funds: ["country", "type"],
  futures: ["country", "sector"],
  forex: ["source"],
  crypto: ["source", "type", "exchangeType"],
  indices: ["source"],
  bonds: ["country", "type"],
  economy: ["country", "source", "sector"],
  options: [],
};

const stocksTypeOptions: AssetSearchFilterOption[] = [
  { value: "all", label: "All types" },
  { value: "Common stock", label: "Common stock" },
  { value: "Preferred stock", label: "Preferred stock" },
  { value: "Depository Receipt", label: "Depository Receipt" },
  { value: "Warrant", label: "Warrant" },
  { value: "Pre-IPO", label: "Pre-IPO" },
];

const fundsTypeOptions: AssetSearchFilterOption[] = [
  { value: "all", label: "All types" },
  { value: "ETF", label: "ETF" },
  { value: "Mutual fund", label: "Mutual fund" },
  { value: "Trust", label: "Trust" },
  { value: "REIT", label: "REIT" },
];

const stocksSectorOptions: AssetSearchFilterOption[] = [
  { value: "all", label: "All sectors" },
  { value: "Commercial Services", label: "Commercial Services" },
  { value: "Communications", label: "Communications" },
  { value: "Consumer Durables", label: "Consumer Durables" },
  { value: "Consumer Non-Durables", label: "Consumer Non-Durables" },
  { value: "Consumer Services", label: "Consumer Services" },
  { value: "Distribution Services", label: "Distribution Services" },
  { value: "Electronic Technology", label: "Electronic Technology" },
  { value: "Energy Minerals", label: "Energy Minerals" },
  { value: "Finance", label: "Finance" },
  { value: "Government sector", label: "Government sector" },
  { value: "Health Services", label: "Health Services" },
  { value: "Health Technology", label: "Health Technology" },
  { value: "Industrial Services", label: "Industrial Services" },
  { value: "Miscellaneous", label: "Miscellaneous" },
  { value: "Non-Energy Minerals", label: "Non-Energy Minerals" },
  { value: "Process Industries", label: "Process Industries" },
  { value: "Producer Manufacturing", label: "Producer Manufacturing" },
  { value: "Retail Trade", label: "Retail Trade" },
  { value: "Technology Services", label: "Technology Services" },
  { value: "Transportation", label: "Transportation" },
  { value: "Utilities", label: "Utilities" },
];

const futuresCategoryOptions: AssetSearchFilterOption[] = [
  { value: "all", label: "All categories" },
  { value: "Single stock", label: "Single stock" },
  { value: "World indices", label: "World indices" },
  { value: "Currencies", label: "Currencies" },
  { value: "Interest rates", label: "Interest rates" },
  { value: "Energy", label: "Energy" },
  { value: "Agriculture", label: "Agriculture" },
  { value: "Metals", label: "Metals" },
  { value: "Weather", label: "Weather" },
  { value: "Building materials", label: "Building materials" },
  { value: "Chemicals", label: "Chemicals" },
];

const cryptoTypeOptions: AssetSearchFilterOption[] = [
  { value: "all", label: "All types" },
  { value: "Spot", label: "Spot" },
  { value: "Swap", label: "Swap" },
  { value: "Futures", label: "Futures" },
  { value: "Index", label: "Index" },
  { value: "Fundamental", label: "Fundamental" },
];

const cryptoExchangeTypeOptions: AssetSearchFilterOption[] = [
  { value: "all", label: "All exchange types" },
  { value: "CEX", label: "CEX" },
  { value: "DEX", label: "DEX" },
];

const bondsTypeOptions: AssetSearchFilterOption[] = [
  { value: "all", label: "All types" },
  { value: "Government", label: "Government" },
  { value: "Corporate", label: "Corporate" },
];

const economySourceOptions: AssetSearchFilterOption[] = [
  { value: "all", label: "All sources" },
  { value: "World Bank", label: "World Bank" },
  { value: "EUROSTAT", label: "EUROSTAT" },
  { value: "AKAMAI", label: "AKAMAI" },
  { value: "Transparency International", label: "Transparency International" },
  { value: "OECD", label: "Organisation for Economic Co-operation and Development" },
  { value: "World Economic Forum", label: "World Economic Forum" },
  { value: "WageIndicator Foundation", label: "WageIndicator Foundation" },
  { value: "Bureau of Labour Statistics", label: "Bureau of Labour Statistics" },
  { value: "Federal Reserve", label: "Federal Reserve" },
  { value: "SIPRI", label: "Stockholm International Peace Research Institute" },
  { value: "IEP", label: "Institute for Economics and Peace" },
  { value: "BEA", label: "Bureau of Economics Analysis" },
  { value: "World Gold Council", label: "World Gold Council" },
  { value: "Census Bureau", label: "Census Bureau" },
  { value: "BCEAO", label: "Central Bank of West African States (BCEAO)" },
  { value: "IMF", label: "International Monetary Fund (IMF)" },
  { value: "EIA", label: "U.S. Energy Information Administration" },
  { value: "Statistics Canada", label: "Statistics Canada" },
  { value: "ONS", label: "Office for National Statistics" },
  { value: "Statistics Norway", label: "Statistics Norway" },
];

const economyCategoryOptions: AssetSearchFilterOption[] = [
  { value: "all", label: "All categories" },
  { value: "GDP", label: "GDP" },
  { value: "Labor", label: "Labor" },
  { value: "Prices", label: "Prices" },
  { value: "Health", label: "Health" },
  { value: "Money", label: "Money" },
  { value: "Trade", label: "Trade" },
  { value: "Government", label: "Government" },
  { value: "Business", label: "Business" },
  { value: "Consumer", label: "Consumer" },
  { value: "Housing", label: "Housing" },
  { value: "Taxes", label: "Taxes" },
];

function createStatic(
  ticker: string,
  name: string,
  exchange: string,
  country: string,
  category: AssetCategory,
  sector: string,
  region: string,
  icon: string,
  instrumentType?: string
): AssetCatalogItem {
  const normalizedExchange = normalizeExchange(exchange);
  const exchangeIcon = resolveExchangeIcon(normalizedExchange);
  const market = categoryToMarket[category];
  return {
    ticker,
    symbol: ticker,
    name,
    exchange,
    region,
    instrumentType: instrumentType ?? defaultInstrumentTypeForCategory(category),
    type: resolveTypeToken(instrumentType ?? defaultInstrumentTypeForCategory(category), category),
    category,
    assetType: category,
    market,
    country: country.toUpperCase(),
    sector,
    icon,
    iconUrl: icon,
    logoUrl: icon,
    exchangeIcon,
    exchangeLogoUrl: exchangeIcon,
    source: "static",
    exchangeType: inferExchangeType(exchange, category),
  };
}

function defaultInstrumentTypeForCategory(category: AssetCategory): string {
  if (category === "stocks") return "Common stock";
  if (category === "funds") return "ETF";
  if (category === "futures") return "Futures";
  if (category === "forex") return "Spot";
  if (category === "crypto") return "Spot";
  if (category === "indices") return "Index";
  if (category === "bonds") return "Bond";
  if (category === "economy") return "Indicator";
  return "Option";
}

function normalizeTypeToken(value: string): string {
  const v = normalizeInput(value);
  if (!v) return "stock";
  if (v.includes("common") || v.includes("preferred") || v.includes("depository") || v.includes("warrant") || v.includes("pre-ipo")) return "stock";
  if (v.includes("etf") || v.includes("fund") || v.includes("closed-end")) return "etf";
  if (v.includes("future") || v.includes("continuous")) return "future";
  if (v.includes("forex") || v.includes("cfd")) return "forex";
  if (v.includes("crypto") || v === "spot") return "crypto";
  if (v.includes("index") || v.includes("synthetic")) return "index";
  if (v.includes("bond")) return "bond";
  if (v.includes("option")) return "option";
  return v;
}

function resolveTypeToken(value: string, category: AssetCategory): string {
  const raw = normalizeInput(value);
  const token = normalizeTypeToken(value);
  if (raw === "spot") {
    if (category === "forex") return "forex";
    if (category === "crypto") return "crypto";
  }
  if (category === "forex") return token === "stock" ? "forex" : token;
  if (category === "crypto") return token === "stock" ? "crypto" : token;
  if (category === "indices") return token === "stock" ? "index" : token;
  if (category === "futures") return token === "stock" ? "future" : token;
  if (category === "funds") return token === "stock" ? "etf" : token;
  if (category === "bonds") return token === "stock" ? "bond" : token;
  if (category === "options") return token === "stock" ? "option" : token;
  return token;
}

function typeLabelFromToken(token: string): string {
  if (token === "stock") return "Stock";
  if (token === "etf") return "ETF / Fund";
  if (token === "future") return "Future";
  if (token === "forex") return "Forex";
  if (token === "crypto") return "Crypto";
  if (token === "index") return "Index";
  if (token === "bond") return "Bond";
  if (token === "option") return "Option";
  return token;
}

function normalizeInput(value: string): string {
  return value.trim().toLowerCase();
}

function normalizeExchange(exchange: string | undefined): string {
  return String(exchange ?? "").trim().toUpperCase();
}

function inferCountryFromExchange(exchange: string): string {
  if (exchange.includes("NSE") || exchange.includes("BSE")) return "IN";
  if (exchange.includes("NASDAQ") || exchange.includes("NYSE") || exchange.includes("AMEX")) return "US";
  if (exchange.includes("LSE")) return "GB";
  if (exchange.includes("TSX")) return "CA";
  if (exchange.includes("JPX") || exchange.includes("TSE")) return "JP";
  if (exchange.includes("CRYPTO") || exchange.includes("BINANCE") || exchange.includes("COINBASE")) return "GLOBAL";
  if (exchange.includes("FOREX") || exchange.includes("FX")) return "GLOBAL";
  return "GLOBAL";
}

function resolveExchangeIcon(exchange: string): string {
  if (!exchange) return "https://logo.clearbit.com/tradingview.com";
  const direct = exchangeLogoMap[exchange];
  if (direct) return direct;
  const key = Object.keys(exchangeLogoMap).find((item) => exchange.includes(item));
  if (key) return exchangeLogoMap[key];
  return "https://logo.clearbit.com/tradingview.com";
}

function normalizeSymbolForDomainLookup(symbol: string): string {
  return symbol.replace(/\^/g, "").replace(/\.NS$/i, "").replace(/\.BO$/i, "").replace(/[-=].*$/g, "").toUpperCase();
}

function resolveStockIcon(symbol: string): string {
  const normalized = normalizeSymbolForDomainLookup(symbol);
  const mapped = symbolDomainMap[normalized] ?? symbolDomainMap[symbol.toUpperCase()];
  if (mapped) return `https://logo.clearbit.com/${mapped}`;
  return "";
}

function resolveForexIcon(pair: string): string {
  const code = pair.slice(0, 3).toUpperCase();
  const country = forexCountryMap[code] ?? "us";
  return `https://flagcdn.com/${country}.svg`;
}

function categoryFromYahooQuote(quoteType: string): AssetCategory {
  const type = quoteType.toUpperCase();
  if (type === "CRYPTOCURRENCY") return "crypto";
  if (type === "CURRENCY") return "forex";
  if (type === "ETF" || type === "MUTUALFUND") return "funds";
  if (type === "FUTURE") return "futures";
  if (type === "INDEX") return "indices";
  if (type === "OPTION") return "options";
  if (type === "BOND") return "bonds";
  return "stocks";
}

function instrumentTypeFromYahooQuote(quoteType: string): string {
  const type = quoteType.toUpperCase();
  if (type === "ETF") return "ETF";
  if (type === "MUTUALFUND") return "Fund";
  if (type === "PREFERRED") return "Preferred stock";
  if (type === "DR") return "Depository Receipt";
  if (type === "WARRANT") return "Warrant";
  if (type === "FUTURE") return "Futures";
  if (type === "OPTION") return "Option";
  if (type === "INDEX") return "Index";
  if (type === "BOND") return "Bond";
  if (type === "CURRENCY" || type === "CRYPTOCURRENCY") return "Spot";
  return "Common stock";
}

function categoryFromTradingViewType(value: string, typespecs: string[]): AssetCategory {
  const t = value.toLowerCase();
  const specs = typespecs.map((item) => item.toLowerCase());
  if (t === "futures") return "futures";
  if (t === "forex") return "forex";
  if (t === "crypto" || specs.includes("crypto") || specs.includes("cryptoasset") || specs.includes("defi")) return "crypto";
  if (t === "index") return "indices";
  if (t === "bond") return "bonds";
  if (t === "option") return "options";
  if (t === "fund" || specs.includes("etf") || specs.includes("closedend")) return "funds";
  return "stocks";
}

function instrumentTypeFromTradingView(value: string, typespecs: string[]): string {
  const specs = typespecs.map((item) => item.toLowerCase());
  if (specs.includes("common")) return "Common stock";
  if (specs.includes("preferred")) return "Preferred stock";
  if (specs.includes("dr")) return "Depository Receipt";
  if (specs.includes("warrant")) return "Warrant";
  if (specs.includes("preipo")) return "Pre-IPO";
  if (specs.includes("etf")) return "ETF";
  if (specs.includes("closedend")) return "Closed-end fund";
  if (specs.includes("mutual")) return "Mutual fund";
  if (specs.includes("trust") || specs.includes("unit")) return "Trust";
  if (specs.includes("reit")) return "REIT";
  if (specs.includes("continuous")) return "Continuous";
  if (specs.includes("cfd")) return "CFD";
  if (value.toLowerCase() === "futures") return "Futures";
  if (value.toLowerCase() === "index") return "Index";
  if (value.toLowerCase() === "option") return "Option";
  if (value.toLowerCase() === "bond") return "Bond";
  if (value.toLowerCase() === "fund") return "Fund";
  if (value.toLowerCase() === "spot") return "Spot";
  return "Common stock";
}

function inferFuturesSector(ticker: string, name: string, exchange: string): string {
  const t = `${ticker} ${name} ${exchange}`.toLowerCase();
  if (t.includes("crude") || t.includes("oil") || t.includes("natural gas") || t.includes("brent") || t.includes("heating") || t.includes("gasoline")) return "Energy";
  if (t.includes("gold") || t.includes("silver") || t.includes("copper") || t.includes("platinum") || t.includes("palladium")) return "Metals";
  if (t.includes("corn") || t.includes("wheat") || t.includes("soybean") || t.includes("coffee") || t.includes("sugar") || t.includes("cotton") || t.includes("cocoa") || t.includes("rice") || t.includes("oat")) return "Agriculture";
  if (t.includes("s&p") || t.includes("nasdaq") || t.includes("nifty") || t.includes("dow") || t.includes("dax") || t.includes("ftse") || t.includes("nikkei") || t.includes("hang seng") || t.includes("index")) return "World indices";
  if (t.includes("eurusd") || t.includes("gbpusd") || t.includes("usdjpy") || t.includes("currency") || t.includes("dollar index")) return "Currencies";
  if (t.includes("bond") || t.includes("treasury") || t.includes("note") || t.includes("bund") || t.includes("interest") || t.includes("bill")) return "Interest rates";
  if (t.includes("weather")) return "Weather";
  if (t.includes("lumber") || t.includes("building")) return "Building materials";
  if (t.includes("chemical")) return "Chemicals";
  return "Single stock";
}

function inferExchangeType(exchange: string, category: AssetCategory): string {
  if (category !== "crypto") return "";
  const e = exchange.toLowerCase();
  if (e.includes("swap") || e.includes("dex") || e.includes("uniswap") || e.includes("sushi") || e.includes("curve") || e.includes("balancer") || e.includes("aerodrome") || e.includes("orca") || e.includes("osmosis") || e.includes("raydium") || e.includes("jupiter") || e.includes("pancake")) return "DEX";
  return "CEX";
}

function tradingViewLogoUrl(logoid?: string): string {
  const clean = String(logoid ?? "").trim();
  if (!clean) return "";
  return `https://s3-symbol-logo.tradingview.com/${clean}.svg`;
}

function normalizeTradingViewMarkup(value: string): string {
  return value.replace(/<[^>]+>/g, "").trim();
}

async function fetchTradingViewAssets(query: string, category?: string): Promise<AssetCatalogItem[]> {
  const text = query || "a";
  const url = new URL("https://symbol-search.tradingview.com/symbol_search/");
  url.searchParams.set("text", text);
  url.searchParams.set("hl", "1");
  url.searchParams.set("exchange", "");
  url.searchParams.set("lang", "en");
  url.searchParams.set("domain", "production");
  const tvType = categoryToTradingViewType(category);
  if (tvType) url.searchParams.set("type", tvType);

  try {
    const response = await fetch(url.toString(), {
      headers: {
        "User-Agent": "Mozilla/5.0",
        Referer: "https://www.tradingview.com/",
        Origin: "https://www.tradingview.com",
      },
    });
    if (!response.ok) return [];

    const payload = (await response.json()) as Array<{
      symbol?: string;
      description?: string;
      type?: string;
      exchange?: string;
      country?: string;
      typespecs?: string[];
      logoid?: string;
      logo?: { logoid?: string };
      source_logoid?: string;
    }>;

    return payload.map((item) => {
      const ticker = normalizeTradingViewMarkup(String(item.symbol ?? ""));
      const description = normalizeTradingViewMarkup(String(item.description ?? ticker));
      const exchange = String(item.exchange ?? "").trim() || "TV";
      const country = String(item.country ?? "GLOBAL").toUpperCase();
      const specs = item.typespecs ?? [];
      const categoryValue = categoryFromTradingViewType(String(item.type ?? ""), specs);
      const instrumentType = instrumentTypeFromTradingView(String(item.type ?? ""), specs);
      const exchangeIcon = tradingViewLogoUrl(item.source_logoid) || resolveExchangeIcon(normalizeExchange(exchange));
      const icon = tradingViewLogoUrl(item.logo?.logoid || item.logoid) || exchangeIcon;

      return normalizeAsset({
        ticker,
        name: description,
        exchange,
        region: countryNameByCode[country] ?? (country === "GLOBAL" ? "Global" : country),
        instrumentType,
        category: categoryValue,
        country,
        sector: categoryValue === "futures" ? inferFuturesSector(ticker, description, exchange) : "Miscellaneous",
        icon,
        exchangeIcon,
        source: "tradingview",
      });
    }).filter((item) => Boolean(item.ticker));
  } catch {
    return [];
  }
}

function normalizeAsset(item: Omit<AssetCatalogItem, "symbol" | "type" | "assetType" | "market" | "iconUrl" | "logoUrl" | "exchangeLogoUrl" | "exchangeType">): AssetCatalogItem {
  const symbol = item.ticker.toUpperCase();
  const category = item.category;
  const market = categoryToMarket[category];
  const icon = item.icon;
  const exchangeIcon = item.exchangeIcon;
  return {
    ...item,
    symbol,
    type: resolveTypeToken(item.instrumentType || defaultInstrumentTypeForCategory(category), category),
    assetType: category,
    market,
    instrumentType: item.instrumentType || defaultInstrumentTypeForCategory(category),
    icon,
    iconUrl: icon,
    logoUrl: icon,
    exchangeLogoUrl: exchangeIcon,
    exchangeType: inferExchangeType(item.exchange, category),
  };
}

async function fetchYahooAssets(query: string): Promise<AssetCatalogItem[]> {
  if (!query) return [];

  const url = new URL("https://query1.finance.yahoo.com/v1/finance/search");
  url.searchParams.set("q", query);
  url.searchParams.set("quotesCount", "80");
  url.searchParams.set("newsCount", "0");
  url.searchParams.set("enableFuzzyQuery", "true");

  try {
    const response = await fetch(url.toString());
    if (!response.ok) return [];

    const payload = (await response.json()) as {
      quotes?: Array<{
        symbol?: string;
        shortname?: string;
        longname?: string;
        quoteType?: string;
        exchDisp?: string;
        exchange?: string;
        sector?: string;
      }>;
    };

    const mapped: AssetCatalogItem[] = [];
    for (const quote of payload.quotes ?? []) {
      const ticker = String(quote.symbol ?? "").trim();
      if (!ticker) continue;

      const quoteType = String(quote.quoteType ?? "").toUpperCase();
      const category = categoryFromYahooQuote(quoteType);
      const exchange = String(quote.exchDisp ?? quote.exchange ?? "").trim() || "OTC";
      const exchangeNormalized = normalizeExchange(exchange);
      const exchangeIcon = resolveExchangeIcon(exchangeNormalized);
      const country = inferCountryFromExchange(exchangeNormalized);

      let icon = "";
      if (category === "crypto") {
        icon = `https://cryptoicons.org/api/icon/${ticker.replace(/-USD$/i, "").toLowerCase()}/200`;
      } else if (category === "forex") {
        icon = resolveForexIcon(ticker);
      } else {
        icon = resolveStockIcon(ticker);
      }
      if (!icon) icon = exchangeIcon;

      const displayName = String(quote.longname ?? quote.shortname ?? ticker).trim();
      mapped.push(
        normalizeAsset({
          ticker,
          name: displayName,
          exchange,
          region: country === "GLOBAL" ? "Global" : country,
          instrumentType: instrumentTypeFromYahooQuote(quoteType),
          category,
          country,
          sector: String(quote.sector ?? "General"),
          icon,
          exchangeIcon,
          source: "yahoo",
        })
      );
    }

    return mapped;
  } catch {
    return [];
  }
}

async function fetchCoinGeckoAssets(query: string, page: number, limit: number): Promise<AssetCatalogItem[]> {
  if (!query) return [];

  const searchUrl = new URL("https://api.coingecko.com/api/v3/search");
  searchUrl.searchParams.set("query", query);

  const marketUrl = new URL("https://api.coingecko.com/api/v3/coins/markets");
  marketUrl.searchParams.set("vs_currency", "usd");
  marketUrl.searchParams.set("order", "market_cap_desc");
  marketUrl.searchParams.set("per_page", String(Math.min(100, Math.max(20, limit * 3))));
  marketUrl.searchParams.set("page", String(Math.max(1, page)));
  marketUrl.searchParams.set("sparkline", "false");

  try {
    const [searchResp, marketResp] = await Promise.all([fetch(searchUrl.toString()), fetch(marketUrl.toString())]);
    const searchPayload = searchResp.ok
      ? (await searchResp.json()) as { coins?: Array<{ id: string; symbol: string; name: string; large?: string }> }
      : { coins: [] };
    const marketPayload = marketResp.ok
      ? (await marketResp.json()) as Array<{ id: string; symbol: string; name: string; image?: string }>
      : [];

    const coingeckoExchange = "COINBASE";
    const exchangeIcon = resolveExchangeIcon(coingeckoExchange);
    const fromSearch = (searchPayload.coins ?? []).map((coin) => {
      const base = String(coin.symbol || "").toUpperCase();
      const ticker = `${base}USD`;
      return normalizeAsset({
        ticker,
        name: coin.name,
        exchange: "CoinGecko",
        region: "Global",
        instrumentType: "Spot",
        category: "crypto",
        country: "GLOBAL",
        sector: "Digital Assets",
        icon: coin.large || `https://cryptoicons.org/api/icon/${base.toLowerCase()}/200`,
        exchangeIcon,
        source: "coingecko",
      });
    });

    const fromMarkets = marketPayload.map((coin) => {
      const base = String(coin.symbol || "").toUpperCase();
      const ticker = `${base}USD`;
      return normalizeAsset({
        ticker,
        name: coin.name,
        exchange: "CoinGecko",
        region: "Global",
        instrumentType: "Spot",
        category: "crypto",
        country: "GLOBAL",
        sector: "Digital Assets",
        icon: coin.image || `https://cryptoicons.org/api/icon/${base.toLowerCase()}/200`,
        exchangeIcon,
        source: "coingecko",
      });
    });

    return [...fromSearch, ...fromMarkets];
  } catch {
    return [];
  }
}

function buildForexUniverse(): AssetCatalogItem[] {
  const pairs: Array<[string, string, string, string]> = [
    ["EURUSD", "Euro / US Dollar", "EU", "Majors"],
    ["GBPUSD", "British Pound / US Dollar", "GB", "Majors"],
    ["USDJPY", "US Dollar / Japanese Yen", "JP", "Majors"],
    ["USDCHF", "US Dollar / Swiss Franc", "CH", "Majors"],
    ["AUDUSD", "Australian Dollar / US Dollar", "AU", "Majors"],
    ["USDCAD", "US Dollar / Canadian Dollar", "CA", "Majors"],
    ["USDINR", "US Dollar / Indian Rupee", "IN", "EM"],
    ["EURINR", "Euro / Indian Rupee", "IN", "EM"],
  ];
  return pairs.map(([ticker, name, country, sector]) => {
    const icon = `https://flagcdn.com/${country.toLowerCase()}.svg`;
    const exchangeIcon = resolveExchangeIcon("FOREX");
    return normalizeAsset({
      ticker,
      name,
      exchange: "Global FX",
      region: "Global",
      instrumentType: "Spot",
      category: "forex",
      country,
      sector,
      icon,
      exchangeIcon,
      source: "forex-universe",
    });
  });
}

function passesQuery(item: AssetCatalogItem, query: string): boolean {
  if (!query) return true;
  const haystack = `${item.ticker} ${item.name} ${item.exchange} ${item.sector} ${item.category} ${item.country}`.toLowerCase();
  if (haystack.includes(query)) return true;
  // Fuzzy: typo tolerance via edit distance on ticker/name
  if (query.length >= 2) {
    const tickerLc = item.ticker.toLowerCase();
    const nameLc = item.name.toLowerCase();
    if (fuzzyClose(tickerLc, query, 1)) return true;
    // Check if query is close to any word in the name
    const nameWords = nameLc.split(/\s+/);
    for (const word of nameWords) {
      if (fuzzyClose(word, query, 1)) return true;
    }
  }
  return false;
}

function fuzzyClose(a: string, b: string, maxDist: number): boolean {
  if (Math.abs(a.length - b.length) > maxDist) return false;
  if (a.startsWith(b) || b.startsWith(a)) return true;
  const len = Math.min(a.length, b.length, 8);
  let dist = 0;
  for (let i = 0; i < len; i++) {
    if (a[i] !== b[i]) dist++;
    if (dist > maxDist) return false;
  }
  return true;
}

function scoreResult(item: AssetCatalogItem, query: string): number {
  if (!query) return 0;
  const tickerLc = item.ticker.toLowerCase();
  const nameLc = item.name.toLowerCase();
  // Exact ticker match → highest priority
  if (tickerLc === query) return 100;
  // Ticker starts with query
  if (tickerLc.startsWith(query)) return 80;
  // Ticker contains query
  if (tickerLc.includes(query)) return 60;
  // Name starts with query
  if (nameLc.startsWith(query)) return 50;
  // Name contains query
  if (nameLc.includes(query)) return 40;
  // Fuzzy match on ticker
  if (fuzzyClose(tickerLc, query, 1)) return 30;
  // Fuzzy match on name word
  return 10;
}

function mapMarketInputToCategory(market?: string): AssetCategory | undefined {
  const raw = normalizeInput(market ?? "");
  if (!raw || raw === "all") return undefined;
  if (raw === "stocks") return "stocks";
  if (raw === "crypto") return "crypto";
  if (raw === "forex") return "forex";
  if (raw === "commodities" || raw === "futures") return "futures";
  if (raw === "etf" || raw === "funds") return "funds";
  if (raw === "indices") return "indices";
  if (raw === "bonds") return "bonds";
  if (raw === "economy") return "economy";
  if (raw === "options") return "options";
  return undefined;
}

function matchesFilters(
  item: AssetCatalogItem,
  filters: { category?: string; market?: string; assetType?: string; country?: string; type?: string; sector?: string; source?: string; exchangeType?: string }
): boolean {
  const category = normalizeInput(filters.category ?? "") || normalizeInput(filters.assetType ?? "");
  const marketCategory = mapMarketInputToCategory(filters.market);
  const effectiveCategory = (category && category !== "all" ? category : marketCategory) as AssetCategory | undefined;
  const country = normalizeInput(filters.country ?? "");
  const type = normalizeInput(filters.type ?? "");
  const sector = normalizeInput(filters.sector ?? "");
  const source = normalizeInput(filters.source ?? "");
  const exchangeType = normalizeInput(filters.exchangeType ?? "");

  const categoryOk = !effectiveCategory || item.category === effectiveCategory;
  const countryOk = !country || country === "all" || item.country.toLowerCase() === country || item.region.toLowerCase() === country;
  const typeOk = !type || type === "all" || item.instrumentType.toLowerCase() === type;
  const sectorOk = !sector || sector === "all" || item.sector.toLowerCase() === sector;
  const sourceOk = !source || source === "all" || item.exchange.toLowerCase() === source;
  const exchangeTypeOk = !exchangeType || exchangeType === "all" || item.exchangeType.toLowerCase() === exchangeType;

  return categoryOk && countryOk && typeOk && sectorOk && sourceOk && exchangeTypeOk;
}

async function getCached(cacheKey: string): Promise<AssetSearchResponse | null> {
  if (redisClient.isOpen) {
    const raw = await redisClient.get(cacheKey);
    if (raw) return JSON.parse(raw) as AssetSearchResponse;
  }

  const local = memoryCache.get(cacheKey);
  if (!local || local.expiresAt < Date.now()) return null;
  return local.payload;
}

async function setCached(cacheKey: string, payload: AssetSearchResponse): Promise<void> {
  if (redisClient.isOpen) {
    await redisClient.set(cacheKey, JSON.stringify(payload), { EX: CACHE_TTL_SECONDS });
  }
  memoryCache.set(cacheKey, { expiresAt: Date.now() + CACHE_TTL_SECONDS * 1000, payload });
}

function buildStaticUniverse(query: string): AssetCatalogItem[] {
  const q = normalizeInput(query);
  return [...staticFunds, ...staticFutures, ...staticIndices, ...staticBonds, ...staticEconomy, ...staticOptions, ...buildForexUniverse()].filter((item) => passesQuery(item, q));
}

function categoryToTradingViewType(category?: string): string {
  const c = normalizeInput(category ?? "");
  if (c === "stocks") return "stock";
  if (c === "funds") return "fund";
  if (c === "futures") return "futures";
  if (c === "forex") return "forex";
  if (c === "crypto") return "crypto";
  if (c === "indices") return "index";
  if (c === "bonds") return "bond";
  if (c === "options") return "option";
  return "";
}

async function fetchTradingViewCountries(category?: string): Promise<string[]> {
  const seeds = ["a", "sp", "btc", "usd", "nifty", "bond"];
  const tvType = categoryToTradingViewType(category);
  const codes = new Set<string>();

  for (const seed of seeds) {
    const url = new URL("https://symbol-search.tradingview.com/symbol_search/");
    url.searchParams.set("text", seed);
    url.searchParams.set("hl", "1");
    url.searchParams.set("exchange", "");
    url.searchParams.set("lang", "en");
    url.searchParams.set("domain", "production");
    if (tvType) url.searchParams.set("type", tvType);

    try {
      const response = await fetch(url.toString(), {
        headers: {
          "User-Agent": "Mozilla/5.0",
          Referer: "https://www.tradingview.com/",
          Origin: "https://www.tradingview.com",
        },
      });
      if (!response.ok) continue;
      const payload = (await response.json()) as Array<{ country?: string }>;
      payload.forEach((item) => {
        const code = String(item.country ?? "").toUpperCase();
        if (code) codes.add(code);
      });
    } catch {
      // Continue through seed failures.
    }
  }

  return Array.from(codes);
}

async function fetchTradingViewSources(category?: string): Promise<AssetSearchFilterOption[]> {
  const seeds = ["a", "b", "e", "s", "btc", "usd", "eur", "gold", "sp"];
  const tvType = categoryToTradingViewType(category);
  const sourceMap = new Map<string, string>();

  for (const seed of seeds) {
    const url = new URL("https://symbol-search.tradingview.com/symbol_search/");
    url.searchParams.set("text", seed);
    url.searchParams.set("hl", "1");
    url.searchParams.set("exchange", "");
    url.searchParams.set("lang", "en");
    url.searchParams.set("domain", "production");
    if (tvType) url.searchParams.set("type", tvType);

    try {
      const response = await fetch(url.toString(), {
        headers: {
          "User-Agent": "Mozilla/5.0",
          Referer: "https://www.tradingview.com/",
          Origin: "https://www.tradingview.com",
        },
      });
      if (!response.ok) continue;
      const payload = (await response.json()) as Array<{ exchange?: string; source_logoid?: string }>;
      for (const item of payload) {
        const exchange = String(item.exchange ?? "").trim();
        if (!exchange) continue;
        if (!sourceMap.has(exchange)) {
          sourceMap.set(exchange, String(item.source_logoid ?? ""));
        }
      }
    } catch {
      // Continue through seed failures.
    }
  }

  const options: AssetSearchFilterOption[] = [{ value: "all", label: "All sources" }];
  const sorted = Array.from(sourceMap.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  for (const [exchange, logoid] of sorted) {
    options.push({
      value: exchange,
      label: exchange,
      icon: logoid ? tradingViewLogoUrl(logoid) : resolveExchangeIcon(exchange),
      subtitle: exchange,
    });
  }
  return options;
}

export async function getAssetSearchFilters(input?: { category?: string }): Promise<AssetSearchFiltersResponse> {
  const category = normalizeInput(input?.category ?? "all");
  const cacheKey = `sim:assets:filters:${category}`;
  if (redisClient.isOpen) {
    const raw = await redisClient.get(cacheKey);
    if (raw) return JSON.parse(raw) as AssetSearchFiltersResponse;
  }

  const activeFilters = CATEGORY_FILTER_CONFIG[category] ?? [];
  let countries: AssetSearchFilterOption[] = [];
  let types: AssetSearchFilterOption[] = [];
  let sectors: AssetSearchFilterOption[] = [];
  let sources: AssetSearchFilterOption[] = [];
  let exchangeTypes: AssetSearchFilterOption[] = [];

  if (activeFilters.includes("country")) {
    const codes = await fetchTradingViewCountries(category);
    countries = [{ value: "all", label: "All countries" }];
    for (const code of codes) {
      countries.push({ value: code.toLowerCase(), label: countryNameByCode[code] ?? code });
    }
    if (countries.length === 1) {
      Object.entries(countryNameByCode).forEach(([code, label]) => {
        countries.push({ value: code.toLowerCase(), label });
      });
    }
    countries.sort((a, b) => {
      if (a.value === "all") return -1;
      if (b.value === "all") return 1;
      return a.label.localeCompare(b.label);
    });
  }

  if (activeFilters.includes("type")) {
    if (category === "stocks") types = stocksTypeOptions;
    else if (category === "funds") types = fundsTypeOptions;
    else if (category === "crypto") types = cryptoTypeOptions;
    else if (category === "bonds") types = bondsTypeOptions;
    else types = [{ value: "all", label: "All types" }];
  }

  if (activeFilters.includes("sector")) {
    if (category === "stocks") sectors = stocksSectorOptions;
    else if (category === "futures") sectors = futuresCategoryOptions;
    else if (category === "economy") sectors = economyCategoryOptions;
    else sectors = [{ value: "all", label: "All sectors" }];
  }

  if (activeFilters.includes("source")) {
    if (category === "economy") {
      sources = economySourceOptions;
    } else {
      sources = await fetchTradingViewSources(category);
    }
  }

  if (activeFilters.includes("exchangeType")) {
    exchangeTypes = cryptoExchangeTypeOptions;
  }

  // Determine sourceUiType: economy uses inline dropdown, others use modal sub-view
  let sourceUiType: "modal" | "dropdown" | undefined;
  if (activeFilters.includes("source")) {
    sourceUiType = category === "economy" ? "dropdown" : "modal";
  }

  const payload: AssetSearchFiltersResponse = { activeFilters, countries, types, sectors, sources, exchangeTypes, sourceUiType };

  if (redisClient.isOpen) {
    await redisClient.set(cacheKey, JSON.stringify(payload), { EX: CACHE_TTL_SECONDS });
  }
  return payload;
}

export async function searchAssetCatalog(input: {
  query?: string;
  market?: string;
  category?: string;
  assetType?: string;
  country?: string;
  type?: string;
  sector?: string;
  source?: string;
  exchangeType?: string;
  page?: number;
  limit?: number;
}): Promise<AssetSearchResponse> {
  const query = normalizeInput(input.query ?? "");
  const page = Math.max(1, Number(input.page ?? 1));
  const limit = Math.min(100, Math.max(10, Number(input.limit ?? 25)));
  const cacheKey = `sim:assets:search:${JSON.stringify({
    q: query,
    market: normalizeInput(input.market ?? "all"),
    category: normalizeInput(input.category ?? "all"),
    assetType: normalizeInput(input.assetType ?? "all"),
    country: normalizeInput(input.country ?? "all"),
    type: normalizeInput(input.type ?? "all"),
    sector: normalizeInput(input.sector ?? "all"),
    source: normalizeInput(input.source ?? "all"),
    exchangeType: normalizeInput(input.exchangeType ?? "all"),
    page,
    limit,
  })}`;

  const cached = await getCached(cacheKey);
  if (cached) return cached;
  const pending = inFlight.get(cacheKey);
  if (pending) return pending;

  const task = (async () => {
    const [tv, yahoo, crypto] = await Promise.all([
      fetchTradingViewAssets(query, input.category),
      fetchYahooAssets(query),
      fetchCoinGeckoAssets(query, page, limit),
    ]);
    const universe = [...tv, ...yahoo, ...crypto, ...buildStaticUniverse(query)];

    const filtered = universe.filter((item) => passesQuery(item, query) && matchesFilters(item, input));
    const dedupeMap = new Map<string, AssetCatalogItem>();
    for (const item of filtered) {
      const key = `${item.ticker}|${item.category}|${item.exchange}`;
      const existing = dedupeMap.get(key);
      if (!existing) {
        dedupeMap.set(key, item);
        continue;
      }
      const currentScore = (item.iconUrl ? 1 : 0) + (item.exchangeLogoUrl ? 1 : 0) + (item.source === "tradingview" ? 2 : 0);
      const prevScore = (existing.iconUrl ? 1 : 0) + (existing.exchangeLogoUrl ? 1 : 0) + (existing.source === "tradingview" ? 2 : 0);
      if (currentScore > prevScore) {
        dedupeMap.set(key, { ...item, sector: item.sector === "Miscellaneous" && existing.sector !== "Miscellaneous" ? existing.sector : item.sector });
      } else if (existing.sector === "Miscellaneous" && item.sector !== "Miscellaneous") {
        dedupeMap.set(key, { ...existing, sector: item.sector });
      }
    }
    const deduped = Array.from(dedupeMap.values());

    deduped.sort((a, b) => {
      const sa = scoreResult(a, query);
      const sb = scoreResult(b, query);
      if (sa !== sb) return sb - sa;
      if (a.category !== b.category) return a.category.localeCompare(b.category);
      return a.ticker.localeCompare(b.ticker);
    });

    const start = (page - 1) * limit;
    const assets = deduped.slice(start, start + limit);
    const payload: AssetSearchResponse = {
      assets,
      total: deduped.length,
      page,
      limit,
      hasMore: start + assets.length < deduped.length,
    };
    await setCached(cacheKey, payload);
    return payload;
  })();

  inFlight.set(cacheKey, task);
  try {
    return await task;
  } finally {
    inFlight.delete(cacheKey);
  }
}
