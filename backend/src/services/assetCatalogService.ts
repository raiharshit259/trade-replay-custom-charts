export type AssetCategory = "stocks" | "funds" | "futures" | "forex" | "crypto" | "indices" | "bonds" | "economy" | "options";
export type AssetMarketType = "Stocks" | "Funds" | "Futures" | "Forex" | "Crypto" | "Indices" | "Bonds" | "Economy" | "Options";

export interface AssetCatalogItem {
  ticker: string;
  symbol: string;
  name: string;
  exchange: string;
  region: string;
  instrumentType: string;
  type: string;
  category: AssetCategory;
  assetType: AssetCategory;
  market: AssetMarketType;
  country: string;
  sector: string;
  exchangeType: string;
  icon: string;
  exchangeIcon: string;
  exchangeLogoUrl: string;
  iconUrl: string;
  logoUrl: string;
  source: string;
  futureCategory?: string;
  economyCategory?: string;
  contracts?: AssetCatalogItem[];
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
  futureCategories: AssetSearchFilterOption[];
  economyCategories: AssetSearchFilterOption[];
  sourceUiType?: "modal" | "dropdown";
}

export interface AssetSearchResponse {
  assets: AssetCatalogItem[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

interface AssetSearchInput {
  q?: string;
  market?: string;
  category?: string;
  assetType?: string;
  country?: string;
  type?: string;
  sector?: string;
  source?: string;
  exchangeType?: string;
  futureCategory?: string;
  economyCategory?: string;
  page?: number;
  limit?: number;
}

const CATEGORY_LABEL: Record<AssetCategory, AssetMarketType> = {
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

const EXCHANGE_ICON_BY_NAME: Record<string, string> = {
  NASDAQ: "https://logo.clearbit.com/nasdaq.com",
  NYSE: "https://logo.clearbit.com/nyse.com",
  NSE: "https://logo.clearbit.com/nseindia.com",
  BSE: "https://logo.clearbit.com/bseindia.com",
  ARCA: "https://logo.clearbit.com/nyse.com",
  LSE: "https://logo.clearbit.com/londonstockexchange.com",
  EURONEXT: "https://logo.clearbit.com/euronext.com",
  CME: "https://logo.clearbit.com/cmegroup.com",
  NYMEX: "https://logo.clearbit.com/cmegroup.com",
  COMEX: "https://logo.clearbit.com/cmegroup.com",
  CBOT: "https://logo.clearbit.com/cmegroup.com",
  OANDA: "https://logo.clearbit.com/oanda.com",
  FXCM: "https://logo.clearbit.com/fxcm.com",
  "FOREX.COM": "https://logo.clearbit.com/forex.com",
  SAXO: "https://logo.clearbit.com/home.saxo",
  BINANCE: "https://logo.clearbit.com/binance.com",
  COINBASE: "https://logo.clearbit.com/coinbase.com",
  KRAKEN: "https://logo.clearbit.com/kraken.com",
  BYBIT: "https://logo.clearbit.com/bybit.com",
  UNISWAP: "https://logo.clearbit.com/uniswap.org",
  "S&P": "https://logo.clearbit.com/spglobal.com",
  "DOW JONES": "https://logo.clearbit.com/dowjones.com",
  FTSE: "https://logo.clearbit.com/ftserussell.com",
  DAX: "https://logo.clearbit.com/deutsche-boerse.com",
  UST: "https://logo.clearbit.com/treasury.gov",
  FINRA: "https://logo.clearbit.com/finra.org",
  FRED: "https://logo.clearbit.com/stlouisfed.org",
  IMF: "https://logo.clearbit.com/imf.org",
  OECD: "https://logo.clearbit.com/oecd.org",
  "WORLD BANK": "https://logo.clearbit.com/worldbank.org",
  OPRA: "https://logo.clearbit.com/theocc.com",
};

function option(value: string, label: string, icon?: string, subtitle?: string): AssetSearchFilterOption {
  return { value, label, icon, subtitle };
}

const STOCK_TYPE_OPTIONS: AssetSearchFilterOption[] = [
  option("all", "All Types"),
  option("common_stock", "Common Stock"),
  option("preferred_stock", "Preferred Stock"),
  option("etf", "ETF"),
  option("adr", "ADR"),
  option("reit", "REIT"),
  option("closed_end_fund", "Closed-End Fund"),
];

const STOCK_SECTOR_OPTIONS: AssetSearchFilterOption[] = [
  option("all", "All Sectors"),
  option("technology", "Technology"),
  option("finance", "Finance"),
  option("healthcare", "Healthcare"),
  option("energy", "Energy"),
  option("consumer_cyclical", "Consumer Cyclical"),
  option("consumer_defensive", "Consumer Defensive"),
  option("industrials", "Industrials"),
  option("utilities", "Utilities"),
  option("real_estate", "Real Estate"),
  option("communication_services", "Communication Services"),
];

const FUND_TYPE_OPTIONS: AssetSearchFilterOption[] = [
  option("all", "All Types"),
  option("etf", "ETF"),
  option("mutual_fund", "Mutual Fund"),
  option("index_fund", "Index Fund"),
];

const FUTURE_CATEGORY_OPTIONS: AssetSearchFilterOption[] = [
  option("all", "All Categories"),
  option("equity_index", "Equity Index"),
  option("commodity", "Commodity"),
  option("currency", "Currency"),
  option("interest_rate", "Interest Rate"),
];

const FOREX_SOURCE_OPTIONS: AssetSearchFilterOption[] = [
  option("all", "All Sources"),
  option("oanda", "OANDA", EXCHANGE_ICON_BY_NAME.OANDA),
  option("fxcm", "FXCM", EXCHANGE_ICON_BY_NAME.FXCM),
  option("forex_com", "FOREX.com", EXCHANGE_ICON_BY_NAME["FOREX.COM"]),
  option("saxo", "SAXO", EXCHANGE_ICON_BY_NAME.SAXO),
];

const CRYPTO_SOURCE_OPTIONS: AssetSearchFilterOption[] = [
  option("all", "All Sources"),
  option("binance", "Binance", EXCHANGE_ICON_BY_NAME.BINANCE),
  option("coinbase", "Coinbase", EXCHANGE_ICON_BY_NAME.COINBASE),
  option("kraken", "Kraken", EXCHANGE_ICON_BY_NAME.KRAKEN),
  option("bybit", "Bybit", EXCHANGE_ICON_BY_NAME.BYBIT),
  option("uniswap", "Uniswap", EXCHANGE_ICON_BY_NAME.UNISWAP),
];

const CRYPTO_TYPE_OPTIONS: AssetSearchFilterOption[] = [
  option("all", "All Types"),
  option("spot", "Spot"),
  option("perpetual", "Perpetual"),
  option("token", "Token"),
];

const CRYPTO_EXCHANGE_TYPE_OPTIONS: AssetSearchFilterOption[] = [
  option("all", "All"),
  option("cex", "CEX"),
  option("dex", "DEX"),
];

const INDEX_SOURCE_OPTIONS: AssetSearchFilterOption[] = [
  option("all", "All Sources"),
  option("nse", "NSE", EXCHANGE_ICON_BY_NAME.NSE),
  option("nasdaq", "NASDAQ", EXCHANGE_ICON_BY_NAME.NASDAQ),
  option("snp", "S&P", EXCHANGE_ICON_BY_NAME["S&P"]),
  option("dow_jones", "Dow Jones", EXCHANGE_ICON_BY_NAME["DOW JONES"]),
  option("ftse", "FTSE", EXCHANGE_ICON_BY_NAME.FTSE),
  option("dax", "DAX", EXCHANGE_ICON_BY_NAME.DAX),
];

const BOND_TYPE_OPTIONS: AssetSearchFilterOption[] = [
  option("all", "All Types"),
  option("government", "Government"),
  option("corporate", "Corporate"),
];

const ECONOMY_SOURCE_OPTIONS: AssetSearchFilterOption[] = [
  option("all", "All Sources"),
  option("fred", "FRED", EXCHANGE_ICON_BY_NAME.FRED),
  option("world_bank", "World Bank", EXCHANGE_ICON_BY_NAME["WORLD BANK"]),
  option("imf", "IMF", EXCHANGE_ICON_BY_NAME.IMF),
  option("oecd", "OECD", EXCHANGE_ICON_BY_NAME.OECD),
];

const ECONOMY_CATEGORY_OPTIONS: AssetSearchFilterOption[] = [
  option("all", "All Categories"),
  option("inflation", "Inflation"),
  option("gdp", "GDP"),
  option("employment", "Employment"),
  option("interest_rates", "Interest Rates"),
  option("manufacturing", "Manufacturing"),
  option("consumer", "Consumer"),
];

const FALLBACK_COUNTRY_CODES = [
  "US", "IN", "GB", "DE", "FR", "JP", "CN", "CA", "AU", "SG", "CH", "AE", "BR", "MX", "ZA", "KR", "HK", "ES", "IT", "NL", "SE", "NO", "DK", "FI", "BE", "AT", "IE", "PT", "PL", "CZ", "HU", "RO", "GR", "TR", "IL", "SA", "QA", "KW", "EG", "NG", "KE", "MA", "AR", "CL", "CO", "PE", "NZ", "TH", "MY", "ID", "PH", "VN", "PK", "BD", "LK", "TW", "RU", "UA", "KZ", "LU", "IS", "EE", "LV", "LT",
];

function countryFlagUrl(code: string): string {
  return `https://flagcdn.com/${code.toLowerCase()}.svg`;
}

function buildGlobalCountryOptions(): AssetSearchFilterOption[] {
  const intlApi = Intl as unknown as {
    supportedValuesOf?: (key: string) => string[];
    DisplayNames?: new (locales?: string | string[], options?: { type: "region" }) => { of: (code: string) => string | undefined };
  };

  let dynamicCodes: string[] = [];
  if (typeof intlApi.supportedValuesOf === "function") {
    try {
      dynamicCodes = intlApi.supportedValuesOf("region");
    } catch {
      dynamicCodes = [];
    }
  }
  const mergedCodes = Array.from(new Set([...dynamicCodes, ...FALLBACK_COUNTRY_CODES]))
    .filter((code) => /^[A-Z]{2}$/.test(code) && code !== "ZZ");

  const display = typeof intlApi.DisplayNames === "function"
    ? new intlApi.DisplayNames(["en"], { type: "region" })
    : null;

  const countryOptions = mergedCodes
    .map((code) => option(code.toLowerCase(), display?.of(code) ?? code, countryFlagUrl(code)))
    .sort((a, b) => a.label.localeCompare(b.label));

  return [option("all", "All Countries"), ...countryOptions];
}

const GLOBAL_COUNTRY_OPTIONS = buildGlobalCountryOptions();

function exchangeLogo(exchange: string): string {
  return EXCHANGE_ICON_BY_NAME[exchange.toUpperCase()] ?? "https://logo.clearbit.com/cboe.com";
}

interface AssetSeedInput {
  ticker: string;
  name: string;
  category: AssetCategory;
  exchange: string;
  country: string;
  source: string;
  type: string;
  instrumentType: string;
  sector?: string;
  exchangeType?: string;
  iconUrl: string;
  futureCategory?: string;
  economyCategory?: string;
  contracts?: AssetCatalogItem[];
}

function createAsset(seed: AssetSeedInput): AssetCatalogItem {
  const normalizedCountry = (seed.country || "GLOBAL").toUpperCase();
  const exchangeLogoUrl = exchangeLogo(seed.exchange);

  return {
    ticker: seed.ticker,
    symbol: seed.ticker,
    name: seed.name,
    exchange: seed.exchange,
    region: normalizedCountry,
    instrumentType: seed.instrumentType,
    type: seed.type,
    category: seed.category,
    assetType: seed.category,
    market: CATEGORY_LABEL[seed.category],
    country: normalizedCountry,
    sector: seed.sector ?? "",
    exchangeType: seed.exchangeType ?? "cex",
    icon: seed.iconUrl,
    exchangeIcon: exchangeLogoUrl,
    exchangeLogoUrl,
    iconUrl: seed.iconUrl,
    logoUrl: seed.iconUrl,
    source: seed.source,
    futureCategory: seed.futureCategory,
    economyCategory: seed.economyCategory,
    contracts: seed.contracts,
  };
}

const STOCKS: AssetCatalogItem[] = [
  createAsset({ ticker: "AAPL", name: "Apple Inc.", category: "stocks", exchange: "NASDAQ", country: "US", source: "nasdaq", type: "common_stock", instrumentType: "Common Stock", sector: "technology", iconUrl: "https://logo.clearbit.com/apple.com" }),
  createAsset({ ticker: "RELIANCE.NS", name: "Reliance Industries", category: "stocks", exchange: "NSE", country: "IN", source: "nse", type: "common_stock", instrumentType: "Common Stock", sector: "energy", iconUrl: "https://logo.clearbit.com/ril.com" }),
  createAsset({ ticker: "TCS.NS", name: "Tata Consultancy Services", category: "stocks", exchange: "NSE", country: "IN", source: "nse", type: "common_stock", instrumentType: "Common Stock", sector: "technology", iconUrl: "https://logo.clearbit.com/tcs.com" }),
  createAsset({ ticker: "JPM", name: "JPMorgan Chase & Co.", category: "stocks", exchange: "NYSE", country: "US", source: "nyse", type: "common_stock", instrumentType: "Common Stock", sector: "finance", iconUrl: "https://logo.clearbit.com/jpmorganchase.com" }),
  createAsset({ ticker: "PFE", name: "Pfizer Inc.", category: "stocks", exchange: "NYSE", country: "US", source: "nyse", type: "common_stock", instrumentType: "Common Stock", sector: "healthcare", iconUrl: "https://logo.clearbit.com/pfizer.com" }),
  createAsset({ ticker: "XOM", name: "Exxon Mobil Corporation", category: "stocks", exchange: "NYSE", country: "US", source: "nyse", type: "common_stock", instrumentType: "Common Stock", sector: "energy", iconUrl: "https://logo.clearbit.com/exxonmobil.com" }),
  createAsset({ ticker: "TSLA", name: "Tesla, Inc.", category: "stocks", exchange: "NASDAQ", country: "US", source: "nasdaq", type: "common_stock", instrumentType: "Common Stock", sector: "consumer_cyclical", iconUrl: "https://logo.clearbit.com/tesla.com" }),
  createAsset({ ticker: "PG", name: "The Procter & Gamble Company", category: "stocks", exchange: "NYSE", country: "US", source: "nyse", type: "common_stock", instrumentType: "Common Stock", sector: "consumer_defensive", iconUrl: "https://logo.clearbit.com/pg.com" }),
  createAsset({ ticker: "CAT", name: "Caterpillar Inc.", category: "stocks", exchange: "NYSE", country: "US", source: "nyse", type: "common_stock", instrumentType: "Common Stock", sector: "industrials", iconUrl: "https://logo.clearbit.com/caterpillar.com" }),
  createAsset({ ticker: "NEE", name: "NextEra Energy, Inc.", category: "stocks", exchange: "NYSE", country: "US", source: "nyse", type: "common_stock", instrumentType: "Common Stock", sector: "utilities", iconUrl: "https://logo.clearbit.com/nexteraenergy.com" }),
  createAsset({ ticker: "O", name: "Realty Income Corporation", category: "stocks", exchange: "NYSE", country: "US", source: "nyse", type: "reit", instrumentType: "REIT", sector: "real_estate", iconUrl: "https://logo.clearbit.com/realtyincome.com" }),
  createAsset({ ticker: "VZ", name: "Verizon Communications Inc.", category: "stocks", exchange: "NYSE", country: "US", source: "nyse", type: "common_stock", instrumentType: "Common Stock", sector: "communication_services", iconUrl: "https://logo.clearbit.com/verizon.com" }),
  createAsset({ ticker: "SPY", name: "SPDR S&P 500 ETF Trust", category: "stocks", exchange: "ARCA", country: "US", source: "nyse", type: "etf", instrumentType: "ETF", sector: "finance", iconUrl: "https://logo.clearbit.com/ssga.com" }),
  createAsset({ ticker: "BAC.PB", name: "Bank of America Series B Preferred", category: "stocks", exchange: "NYSE", country: "US", source: "nyse", type: "preferred_stock", instrumentType: "Preferred Stock", sector: "finance", iconUrl: "https://logo.clearbit.com/bankofamerica.com" }),
  createAsset({ ticker: "TSM", name: "Taiwan Semiconductor ADR", category: "stocks", exchange: "NYSE", country: "US", source: "nyse", type: "adr", instrumentType: "ADR", sector: "technology", iconUrl: "https://logo.clearbit.com/tsmc.com" }),
  createAsset({ ticker: "PDI", name: "PIMCO Dynamic Income Fund", category: "stocks", exchange: "NYSE", country: "US", source: "nyse", type: "closed_end_fund", instrumentType: "Closed-End Fund", sector: "finance", iconUrl: "https://logo.clearbit.com/pimco.com" }),
];

const FUNDS: AssetCatalogItem[] = [
  createAsset({ ticker: "VTI", name: "Vanguard Total Stock Market ETF", category: "funds", exchange: "ARCA", country: "US", source: "vanguard", type: "etf", instrumentType: "ETF", iconUrl: "https://logo.clearbit.com/vanguard.com" }),
  createAsset({ ticker: "QQQ", name: "Invesco QQQ Trust", category: "funds", exchange: "NASDAQ", country: "US", source: "invesco", type: "etf", instrumentType: "ETF", iconUrl: "https://logo.clearbit.com/invesco.com" }),
  createAsset({ ticker: "IVV", name: "iShares Core S&P 500 ETF", category: "funds", exchange: "ARCA", country: "US", source: "blackrock", type: "etf", instrumentType: "ETF", iconUrl: "https://logo.clearbit.com/ishares.com" }),
  createAsset({ ticker: "VFIAX", name: "Vanguard 500 Index Admiral", category: "funds", exchange: "NASDAQ", country: "US", source: "vanguard", type: "mutual_fund", instrumentType: "Mutual Fund", iconUrl: "https://logo.clearbit.com/vanguard.com" }),
  createAsset({ ticker: "SWPPX", name: "Schwab S&P 500 Index Fund", category: "funds", exchange: "NASDAQ", country: "US", source: "schwab", type: "index_fund", instrumentType: "Index Fund", iconUrl: "https://logo.clearbit.com/schwab.com" }),
  createAsset({ ticker: "HDFC500", name: "HDFC Nifty 500 Index Fund", category: "funds", exchange: "NSE", country: "IN", source: "hdfc", type: "index_fund", instrumentType: "Index Fund", iconUrl: "https://logo.clearbit.com/hdfcfund.com" }),
  createAsset({ ticker: "MFSX", name: "MFS Growth Fund", category: "funds", exchange: "NYSE", country: "US", source: "mfs", type: "mutual_fund", instrumentType: "Mutual Fund", iconUrl: "https://logo.clearbit.com/mfs.com" }),
  createAsset({ ticker: "ISF", name: "iShares Core FTSE 100 UCITS ETF", category: "funds", exchange: "LSE", country: "GB", source: "blackrock", type: "etf", instrumentType: "ETF", iconUrl: "https://logo.clearbit.com/ishares.com" }),
];

function buildFutureContracts(baseTicker: string, namePrefix: string, exchange: string, country: string, source: string, futureCategory: string, iconUrl: string): AssetCatalogItem[] {
  return [
    createAsset({ ticker: `${baseTicker}-JUN26`, name: `${namePrefix} JUN 2026`, category: "futures", exchange, country, source, type: "future_contract", instrumentType: "Future Contract", sector: futureCategory, futureCategory, iconUrl }),
    createAsset({ ticker: `${baseTicker}-JUL26`, name: `${namePrefix} JUL 2026`, category: "futures", exchange, country, source, type: "future_contract", instrumentType: "Future Contract", sector: futureCategory, futureCategory, iconUrl }),
    createAsset({ ticker: `${baseTicker}-AUG26`, name: `${namePrefix} AUG 2026`, category: "futures", exchange, country, source, type: "future_contract", instrumentType: "Future Contract", sector: futureCategory, futureCategory, iconUrl }),
  ];
}

const FUTURES: AssetCatalogItem[] = [
  createAsset({
    ticker: "ES",
    name: "E-Mini S&P 500 Futures",
    category: "futures",
    exchange: "CME",
    country: "US",
    source: "cme",
    type: "future",
    instrumentType: "Future",
    sector: "equity_index",
    futureCategory: "equity_index",
    iconUrl: "https://logo.clearbit.com/cmegroup.com",
    contracts: buildFutureContracts("ES", "E-Mini S&P 500", "CME", "US", "cme", "equity_index", "https://logo.clearbit.com/cmegroup.com"),
  }),
  createAsset({
    ticker: "NIFTY",
    name: "NIFTY 50 Futures",
    category: "futures",
    exchange: "NSE",
    country: "IN",
    source: "nse",
    type: "future",
    instrumentType: "Future",
    sector: "equity_index",
    futureCategory: "equity_index",
    iconUrl: "https://logo.clearbit.com/nseindia.com",
    contracts: buildFutureContracts("NIFTY", "NIFTY 50", "NSE", "IN", "nse", "equity_index", "https://logo.clearbit.com/nseindia.com"),
  }),
  createAsset({
    ticker: "CL",
    name: "Crude Oil Futures",
    category: "futures",
    exchange: "NYMEX",
    country: "US",
    source: "cme",
    type: "future",
    instrumentType: "Future",
    sector: "commodity",
    futureCategory: "commodity",
    iconUrl: "https://logo.clearbit.com/cmegroup.com",
    contracts: buildFutureContracts("CL", "Crude Oil", "NYMEX", "US", "cme", "commodity", "https://logo.clearbit.com/cmegroup.com"),
  }),
  createAsset({
    ticker: "GC",
    name: "Gold Futures",
    category: "futures",
    exchange: "COMEX",
    country: "US",
    source: "cme",
    type: "future",
    instrumentType: "Future",
    sector: "commodity",
    futureCategory: "commodity",
    iconUrl: "https://logo.clearbit.com/cmegroup.com",
    contracts: buildFutureContracts("GC", "Gold", "CME", "US", "cme", "commodity", "https://logo.clearbit.com/cmegroup.com"),
  }),
  createAsset({
    ticker: "6E",
    name: "Euro FX Futures",
    category: "futures",
    exchange: "CME",
    country: "US",
    source: "cme",
    type: "future",
    instrumentType: "Future",
    sector: "currency",
    futureCategory: "currency",
    iconUrl: "https://logo.clearbit.com/cmegroup.com",
    contracts: buildFutureContracts("6E", "Euro FX", "CME", "US", "cme", "currency", "https://logo.clearbit.com/cmegroup.com"),
  }),
  createAsset({
    ticker: "ZN",
    name: "10-Year T-Note Futures",
    category: "futures",
    exchange: "CBOT",
    country: "US",
    source: "cme",
    type: "future",
    instrumentType: "Future",
    sector: "interest_rate",
    futureCategory: "interest_rate",
    iconUrl: "https://logo.clearbit.com/cmegroup.com",
    contracts: buildFutureContracts("ZN", "10-Year T-Note", "CBOT", "US", "cme", "interest_rate", "https://logo.clearbit.com/cmegroup.com"),
  }),
];

const FOREX: AssetCatalogItem[] = [
  createAsset({ ticker: "EURUSD", name: "Euro / US Dollar", category: "forex", exchange: "OANDA", country: "GLOBAL", source: "oanda", type: "spot", instrumentType: "Forex Spot", iconUrl: "https://flagcdn.com/eu.svg" }),
  createAsset({ ticker: "GBPUSD", name: "British Pound / US Dollar", category: "forex", exchange: "FXCM", country: "GLOBAL", source: "fxcm", type: "spot", instrumentType: "Forex Spot", iconUrl: "https://flagcdn.com/gb.svg" }),
  createAsset({ ticker: "USDJPY", name: "US Dollar / Japanese Yen", category: "forex", exchange: "FOREX.COM", country: "GLOBAL", source: "forex_com", type: "spot", instrumentType: "Forex Spot", iconUrl: "https://flagcdn.com/jp.svg" }),
  createAsset({ ticker: "AUDUSD", name: "Australian Dollar / US Dollar", category: "forex", exchange: "SAXO", country: "GLOBAL", source: "saxo", type: "spot", instrumentType: "Forex Spot", iconUrl: "https://flagcdn.com/au.svg" }),
  createAsset({ ticker: "USDINR", name: "US Dollar / Indian Rupee", category: "forex", exchange: "OANDA", country: "GLOBAL", source: "oanda", type: "spot", instrumentType: "Forex Spot", iconUrl: "https://flagcdn.com/in.svg" }),
  createAsset({ ticker: "USDCAD", name: "US Dollar / Canadian Dollar", category: "forex", exchange: "FXCM", country: "GLOBAL", source: "fxcm", type: "spot", instrumentType: "Forex Spot", iconUrl: "https://flagcdn.com/ca.svg" }),
  createAsset({ ticker: "USDCHF", name: "US Dollar / Swiss Franc", category: "forex", exchange: "FOREX.COM", country: "GLOBAL", source: "forex_com", type: "spot", instrumentType: "Forex Spot", iconUrl: "https://flagcdn.com/ch.svg" }),
  createAsset({ ticker: "NZDUSD", name: "New Zealand Dollar / US Dollar", category: "forex", exchange: "SAXO", country: "GLOBAL", source: "saxo", type: "spot", instrumentType: "Forex Spot", iconUrl: "https://flagcdn.com/nz.svg" }),
];

const CRYPTO: AssetCatalogItem[] = [
  createAsset({ ticker: "BTCUSDT", name: "Bitcoin / Tether", category: "crypto", exchange: "BINANCE", country: "GLOBAL", source: "binance", type: "spot", instrumentType: "Spot", exchangeType: "cex", iconUrl: "https://assets.coingecko.com/coins/images/1/large/bitcoin.png" }),
  createAsset({ ticker: "ETHUSDT", name: "Ethereum / Tether", category: "crypto", exchange: "COINBASE", country: "GLOBAL", source: "coinbase", type: "spot", instrumentType: "Spot", exchangeType: "cex", iconUrl: "https://assets.coingecko.com/coins/images/279/large/ethereum.png" }),
  createAsset({ ticker: "SOLUSDT", name: "Solana / Tether", category: "crypto", exchange: "BINANCE", country: "GLOBAL", source: "binance", type: "spot", instrumentType: "Spot", exchangeType: "cex", iconUrl: "https://assets.coingecko.com/coins/images/4128/large/solana.png" }),
  createAsset({ ticker: "BNBUSDT", name: "BNB / Tether", category: "crypto", exchange: "BINANCE", country: "GLOBAL", source: "binance", type: "token", instrumentType: "Token", exchangeType: "cex", iconUrl: "https://assets.coingecko.com/coins/images/825/large/bnb-icon2_2x.png" }),
  createAsset({ ticker: "BTC-PERP", name: "Bitcoin Perpetual", category: "crypto", exchange: "BYBIT", country: "GLOBAL", source: "bybit", type: "perpetual", instrumentType: "Perpetual", exchangeType: "cex", iconUrl: "https://assets.coingecko.com/coins/images/1/large/bitcoin.png" }),
  createAsset({ ticker: "ETH-PERP", name: "Ethereum Perpetual", category: "crypto", exchange: "KRAKEN", country: "GLOBAL", source: "kraken", type: "perpetual", instrumentType: "Perpetual", exchangeType: "cex", iconUrl: "https://assets.coingecko.com/coins/images/279/large/ethereum.png" }),
  createAsset({ ticker: "UNIUSD", name: "Uniswap Token", category: "crypto", exchange: "UNISWAP", country: "GLOBAL", source: "uniswap", type: "token", instrumentType: "Token", exchangeType: "dex", iconUrl: "https://assets.coingecko.com/coins/images/12504/large/uniswap-uni.png" }),
  createAsset({ ticker: "AAVEUSD", name: "Aave Token", category: "crypto", exchange: "UNISWAP", country: "GLOBAL", source: "uniswap", type: "token", instrumentType: "Token", exchangeType: "dex", iconUrl: "https://assets.coingecko.com/coins/images/12645/large/AAVE.png" }),
];

const INDICES: AssetCatalogItem[] = [
  createAsset({ ticker: "NIFTY50", name: "NIFTY 50", category: "indices", exchange: "NSE", country: "IN", source: "nse", type: "index", instrumentType: "Index", iconUrl: "https://logo.clearbit.com/nseindia.com" }),
  createAsset({ ticker: "IXIC", name: "NASDAQ Composite", category: "indices", exchange: "NASDAQ", country: "US", source: "nasdaq", type: "index", instrumentType: "Index", iconUrl: "https://logo.clearbit.com/nasdaq.com" }),
  createAsset({ ticker: "SPX", name: "S&P 500", category: "indices", exchange: "S&P", country: "US", source: "snp", type: "index", instrumentType: "Index", iconUrl: "https://logo.clearbit.com/spglobal.com" }),
  createAsset({ ticker: "DJI", name: "Dow Jones Industrial Average", category: "indices", exchange: "DOW JONES", country: "US", source: "dow_jones", type: "index", instrumentType: "Index", iconUrl: "https://logo.clearbit.com/dowjones.com" }),
  createAsset({ ticker: "FTSE100", name: "FTSE 100", category: "indices", exchange: "FTSE", country: "GB", source: "ftse", type: "index", instrumentType: "Index", iconUrl: "https://logo.clearbit.com/ftserussell.com" }),
  createAsset({ ticker: "DAX40", name: "DAX 40", category: "indices", exchange: "DAX", country: "DE", source: "dax", type: "index", instrumentType: "Index", iconUrl: "https://logo.clearbit.com/deutsche-boerse.com" }),
];

const BONDS: AssetCatalogItem[] = [
  createAsset({ ticker: "US10Y", name: "US 10Y Treasury Note", category: "bonds", exchange: "UST", country: "US", source: "treasury", type: "government", instrumentType: "Government", iconUrl: "https://logo.clearbit.com/treasury.gov" }),
  createAsset({ ticker: "US30Y", name: "US 30Y Treasury Bond", category: "bonds", exchange: "UST", country: "US", source: "treasury", type: "government", instrumentType: "Government", iconUrl: "https://logo.clearbit.com/treasury.gov" }),
  createAsset({ ticker: "IN10Y", name: "India 10Y Government Bond", category: "bonds", exchange: "NSE", country: "IN", source: "nse", type: "government", instrumentType: "Government", iconUrl: "https://logo.clearbit.com/rbi.org.in" }),
  createAsset({ ticker: "DE10Y", name: "Germany 10Y Bund", category: "bonds", exchange: "DAX", country: "DE", source: "bund", type: "government", instrumentType: "Government", iconUrl: "https://logo.clearbit.com/bundesbank.de" }),
  createAsset({ ticker: "AAPL2030", name: "Apple 2030 Corporate Bond", category: "bonds", exchange: "FINRA", country: "US", source: "finra", type: "corporate", instrumentType: "Corporate", iconUrl: "https://logo.clearbit.com/apple.com" }),
  createAsset({ ticker: "MSFT2031", name: "Microsoft 2031 Corporate Bond", category: "bonds", exchange: "FINRA", country: "US", source: "finra", type: "corporate", instrumentType: "Corporate", iconUrl: "https://logo.clearbit.com/microsoft.com" }),
  createAsset({ ticker: "TSLA2029", name: "Tesla 2029 Corporate Bond", category: "bonds", exchange: "FINRA", country: "US", source: "finra", type: "corporate", instrumentType: "Corporate", iconUrl: "https://logo.clearbit.com/tesla.com" }),
  createAsset({ ticker: "RIL2032", name: "Reliance 2032 Corporate Bond", category: "bonds", exchange: "NSE", country: "IN", source: "nse", type: "corporate", instrumentType: "Corporate", iconUrl: "https://logo.clearbit.com/ril.com" }),
];

const ECONOMY: AssetCatalogItem[] = [
  createAsset({ ticker: "US_CPI", name: "US Consumer Price Index", category: "economy", exchange: "FRED", country: "US", source: "fred", type: "macro", instrumentType: "Inflation", iconUrl: "https://logo.clearbit.com/stlouisfed.org", economyCategory: "inflation" }),
  createAsset({ ticker: "EU_HICP", name: "Euro Area HICP", category: "economy", exchange: "OECD", country: "DE", source: "oecd", type: "macro", instrumentType: "Inflation", iconUrl: "https://logo.clearbit.com/oecd.org", economyCategory: "inflation" }),
  createAsset({ ticker: "US_GDP", name: "US Real GDP Growth", category: "economy", exchange: "FRED", country: "US", source: "fred", type: "macro", instrumentType: "GDP", iconUrl: "https://logo.clearbit.com/stlouisfed.org", economyCategory: "gdp" }),
  createAsset({ ticker: "IN_GDP", name: "India GDP Growth", category: "economy", exchange: "WORLD BANK", country: "IN", source: "world_bank", type: "macro", instrumentType: "GDP", iconUrl: "https://logo.clearbit.com/worldbank.org", economyCategory: "gdp" }),
  createAsset({ ticker: "US_NFP", name: "US Non-Farm Payrolls", category: "economy", exchange: "FRED", country: "US", source: "fred", type: "macro", instrumentType: "Employment", iconUrl: "https://logo.clearbit.com/stlouisfed.org", economyCategory: "employment" }),
  createAsset({ ticker: "EU_UNEMP", name: "Euro Area Unemployment Rate", category: "economy", exchange: "OECD", country: "FR", source: "oecd", type: "macro", instrumentType: "Employment", iconUrl: "https://logo.clearbit.com/oecd.org", economyCategory: "employment" }),
  createAsset({ ticker: "FED_FUNDS", name: "US Federal Funds Rate", category: "economy", exchange: "FRED", country: "US", source: "fred", type: "macro", instrumentType: "Interest Rates", iconUrl: "https://logo.clearbit.com/stlouisfed.org", economyCategory: "interest_rates" }),
  createAsset({ ticker: "ECB_RATE", name: "ECB Main Refinancing Rate", category: "economy", exchange: "IMF", country: "DE", source: "imf", type: "macro", instrumentType: "Interest Rates", iconUrl: "https://logo.clearbit.com/imf.org", economyCategory: "interest_rates" }),
  createAsset({ ticker: "US_ISM_PMI", name: "US ISM Manufacturing PMI", category: "economy", exchange: "FRED", country: "US", source: "fred", type: "macro", instrumentType: "Manufacturing", iconUrl: "https://logo.clearbit.com/stlouisfed.org", economyCategory: "manufacturing" }),
  createAsset({ ticker: "CN_PMI", name: "China Manufacturing PMI", category: "economy", exchange: "IMF", country: "CN", source: "imf", type: "macro", instrumentType: "Manufacturing", iconUrl: "https://logo.clearbit.com/imf.org", economyCategory: "manufacturing" }),
  createAsset({ ticker: "US_CONFIDENCE", name: "US Consumer Confidence", category: "economy", exchange: "FRED", country: "US", source: "fred", type: "macro", instrumentType: "Consumer", iconUrl: "https://logo.clearbit.com/stlouisfed.org", economyCategory: "consumer" }),
  createAsset({ ticker: "IN_CONSUMER", name: "India Consumer Sentiment", category: "economy", exchange: "WORLD BANK", country: "IN", source: "world_bank", type: "macro", instrumentType: "Consumer", iconUrl: "https://logo.clearbit.com/worldbank.org", economyCategory: "consumer" }),
];

const OPTIONS: AssetCatalogItem[] = [
  createAsset({ ticker: "AAPL-2026-190C", name: "Apple Jun 2026 190 Call", category: "options", exchange: "OPRA", country: "US", source: "opra", type: "call", instrumentType: "Call Option", iconUrl: "https://logo.clearbit.com/apple.com" }),
  createAsset({ ticker: "AAPL-2026-170P", name: "Apple Jun 2026 170 Put", category: "options", exchange: "OPRA", country: "US", source: "opra", type: "put", instrumentType: "Put Option", iconUrl: "https://logo.clearbit.com/apple.com" }),
  createAsset({ ticker: "SPY-2026-500C", name: "SPY Sep 2026 500 Call", category: "options", exchange: "OPRA", country: "US", source: "opra", type: "call", instrumentType: "Call Option", iconUrl: "https://logo.clearbit.com/ssga.com" }),
  createAsset({ ticker: "SPY-2026-420P", name: "SPY Sep 2026 420 Put", category: "options", exchange: "OPRA", country: "US", source: "opra", type: "put", instrumentType: "Put Option", iconUrl: "https://logo.clearbit.com/ssga.com" }),
  createAsset({ ticker: "NIFTY-2026-22500CE", name: "NIFTY Jun 2026 22500 Call", category: "options", exchange: "NSE", country: "IN", source: "nse", type: "call", instrumentType: "Call Option", iconUrl: "https://logo.clearbit.com/nseindia.com" }),
  createAsset({ ticker: "BTC-2026-70000C", name: "BTC Jun 2026 70000 Call", category: "options", exchange: "BINANCE", country: "GLOBAL", source: "binance", type: "call", instrumentType: "Call Option", iconUrl: "https://assets.coingecko.com/coins/images/1/large/bitcoin.png" }),
];

const CATALOG_BY_CATEGORY: Record<AssetCategory, AssetCatalogItem[]> = {
  stocks: STOCKS,
  funds: FUNDS,
  futures: FUTURES,
  forex: FOREX,
  crypto: CRYPTO,
  indices: INDICES,
  bonds: BONDS,
  economy: ECONOMY,
  options: OPTIONS,
};

function normalizeCategory(rawCategory?: string): AssetCategory | "all" {
  if (!rawCategory || !rawCategory.trim()) return "all";

  const normalized = rawCategory.trim().toLowerCase();

  if (normalized in CATALOG_BY_CATEGORY) {
    return normalized as AssetCategory;
  }

  if (normalized === "stock") return "stocks";
  if (normalized === "fund") return "funds";
  if (normalized === "future") return "futures";
  if (normalized === "commodity") return "futures";
  if (normalized === "forex") return "forex";
  if (normalized === "crypto") return "crypto";
  if (normalized === "index") return "indices";
  if (normalized === "bond") return "bonds";
  if (normalized === "economic") return "economy";
  if (normalized === "option") return "options";

  return "all";
}

function normalizeOptional(value?: string): string | undefined {
  if (!value) return undefined;
  const next = value.trim().toLowerCase();
  if (!next || next === "all") return undefined;
  return next;
}

function normalizeCountry(value?: string): string | undefined {
  const normalized = normalizeOptional(value);
  if (!normalized) return undefined;
  return normalized;
}

function itemSearchScore(item: AssetCatalogItem, query: string): number {
  if (!query) return 1;

  const q = query.toLowerCase();
  const ticker = item.ticker.toLowerCase();
  const name = item.name.toLowerCase();
  const text = `${ticker} ${name}`;

  let baseScore = -1;
  if (ticker === q) baseScore = 120;
  else if (ticker.startsWith(q)) baseScore = 105;
  else if (name.startsWith(q)) baseScore = 92;
  else if (text.includes(q)) baseScore = 78;
  else if (isSubsequence(ticker, q)) baseScore = 62;
  else if (isSubsequence(name, q)) baseScore = 48;

  if (item.category === "futures" && item.contracts?.length) {
    const contractScores = item.contracts.map((contract) => itemSearchScore(contract, query));
    const bestContractScore = Math.max(...contractScores);
    if (bestContractScore > 0) {
      baseScore = Math.max(baseScore, bestContractScore - 4);
    }
  }

  return baseScore;
}

function isSubsequence(text: string, query: string): boolean {
  let cursor = 0;
  for (let i = 0; i < text.length && cursor < query.length; i += 1) {
    if (text[i] === query[cursor]) {
      cursor += 1;
    }
  }
  return cursor === query.length;
}

function cloneAsset(item: AssetCatalogItem): AssetCatalogItem {
  return {
    ...item,
    contracts: item.contracts?.map((contract) => ({ ...contract })),
  };
}

type NormalizedFilterState = {
  country: string | undefined;
  type: string | undefined;
  sector: string | undefined;
  source: string | undefined;
  exchangeType: string | undefined;
  futureCategory: string | undefined;
  economyCategory: string | undefined;
};

function matchesFilters(item: AssetCatalogItem, input: NormalizedFilterState): boolean {
  if (input.country && item.country.toLowerCase() !== input.country) return false;
  if (input.type && item.type.toLowerCase() !== input.type) return false;
  if (input.sector && item.sector.toLowerCase() !== input.sector) return false;
  if (input.source && item.source.toLowerCase() !== input.source) return false;
  if (input.exchangeType && item.exchangeType.toLowerCase() !== input.exchangeType) return false;
  if (input.futureCategory && (item.futureCategory ?? "").toLowerCase() !== input.futureCategory) return false;
  if (input.economyCategory && (item.economyCategory ?? "").toLowerCase() !== input.economyCategory) return false;
  return true;
}

function toNumber(value: unknown, fallback: number): number {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === "string") {
    const next = Number.parseInt(value, 10);
    if (Number.isFinite(next)) return next;
  }
  return fallback;
}

export async function searchAssetCatalog(input: AssetSearchInput): Promise<AssetSearchResponse> {
  const category = normalizeCategory(input.category ?? input.assetType ?? input.market);
  const country = normalizeCountry(input.country);
  const type = normalizeOptional(input.type);
  const sector = normalizeOptional(input.sector);
  const source = normalizeOptional(input.source);
  const exchangeType = normalizeOptional(input.exchangeType);
  const futureCategory = normalizeOptional(input.futureCategory);
  const economyCategory = normalizeOptional(input.economyCategory);
  const query = (input.q ?? "").trim();

  const page = Math.max(1, toNumber(input.page, 1));
  const limit = Math.max(1, Math.min(100, toNumber(input.limit, 50)));

  const searchPool = category === "all"
    ? Object.values(CATALOG_BY_CATEGORY).flat()
    : CATALOG_BY_CATEGORY[category] ?? [];

  const uniqueMap = new Map<string, AssetCatalogItem>();
  for (const asset of searchPool) {
    const key = `${asset.category}|${asset.ticker}|${asset.exchange}`;
    if (!uniqueMap.has(key)) {
      uniqueMap.set(key, asset);
    }
  }

  const filtered = Array.from(uniqueMap.values())
    .filter((asset) => matchesFilters(asset, {
      country,
      type,
      sector,
      source,
      exchangeType,
      futureCategory,
      economyCategory,
    }))
    .map((asset) => ({ asset, score: itemSearchScore(asset, query) }))
    .filter((row) => row.score >= 0)
    .sort((left, right) => {
      if (right.score !== left.score) return right.score - left.score;
      return left.asset.ticker.localeCompare(right.asset.ticker);
    });

  const total = filtered.length;
  const start = (page - 1) * limit;
  const paged = filtered.slice(start, start + limit).map((row) => cloneAsset(row.asset));

  return {
    assets: paged,
    total,
    page,
    limit,
    hasMore: start + limit < total,
  };
}

function emptyFilters(sourceUiType: "modal" | "dropdown" = "modal"): AssetSearchFiltersResponse {
  return {
    activeFilters: [],
    countries: [],
    types: [],
    sectors: [],
    sources: [],
    exchangeTypes: [],
    futureCategories: [],
    economyCategories: [],
    sourceUiType,
  };
}

export async function fetchAssetCatalogFilters(input?: { category?: string }): Promise<AssetSearchFiltersResponse> {
  const category = normalizeCategory(input?.category);

  if (category === "all") {
    return emptyFilters("modal");
  }

  switch (category) {
    case "stocks": {
      return {
        ...emptyFilters("modal"),
        activeFilters: ["country", "type", "sector"],
        countries: GLOBAL_COUNTRY_OPTIONS,
        types: STOCK_TYPE_OPTIONS,
        sectors: STOCK_SECTOR_OPTIONS,
      };
    }

    case "funds": {
      return {
        ...emptyFilters("modal"),
        activeFilters: ["country", "type"],
        countries: GLOBAL_COUNTRY_OPTIONS,
        types: FUND_TYPE_OPTIONS,
      };
    }

    case "futures": {
      return {
        ...emptyFilters("modal"),
        activeFilters: ["futureCategory", "country"],
        countries: GLOBAL_COUNTRY_OPTIONS,
        futureCategories: FUTURE_CATEGORY_OPTIONS,
      };
    }

    case "forex": {
      return {
        ...emptyFilters("modal"),
        activeFilters: ["source"],
        sources: FOREX_SOURCE_OPTIONS,
      };
    }

    case "crypto": {
      return {
        ...emptyFilters("modal"),
        activeFilters: ["source", "type", "exchangeType"],
        sources: CRYPTO_SOURCE_OPTIONS,
        types: CRYPTO_TYPE_OPTIONS,
        exchangeTypes: CRYPTO_EXCHANGE_TYPE_OPTIONS,
      };
    }

    case "indices": {
      return {
        ...emptyFilters("modal"),
        activeFilters: ["source"],
        sources: INDEX_SOURCE_OPTIONS,
      };
    }

    case "bonds": {
      return {
        ...emptyFilters("modal"),
        activeFilters: ["country", "type"],
        countries: GLOBAL_COUNTRY_OPTIONS,
        types: BOND_TYPE_OPTIONS,
      };
    }

    case "economy": {
      return {
        ...emptyFilters("dropdown"),
        activeFilters: ["country", "source", "economyCategory"],
        countries: GLOBAL_COUNTRY_OPTIONS,
        sources: ECONOMY_SOURCE_OPTIONS,
        economyCategories: ECONOMY_CATEGORY_OPTIONS,
      };
    }

    case "options": {
      return emptyFilters("modal");
    }

    default: {
      return emptyFilters("modal");
    }
  }
}
