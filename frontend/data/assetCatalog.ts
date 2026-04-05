export type MarketType = "stocks" | "funds" | "futures" | "forex" | "crypto" | "indices" | "bonds" | "economy" | "options";

export interface CurrencyItem {
  code: string;
  name: string;
  iconUrl: string;
}

export const marketMeta: Array<{ key: MarketType; label: string; iconUrl: string }> = [
  { key: "stocks", label: "Stocks", iconUrl: "https://logo.clearbit.com/nasdaq.com" },
  { key: "funds", label: "Funds", iconUrl: "https://logo.clearbit.com/vanguard.com" },
  { key: "futures", label: "Futures", iconUrl: "https://logo.clearbit.com/cmegroup.com" },
  { key: "forex", label: "Forex", iconUrl: "https://flagcdn.com/us.svg" },
  { key: "crypto", label: "Crypto", iconUrl: "https://assets.coingecko.com/coins/images/1/large/bitcoin.png" },
  { key: "indices", label: "Indices", iconUrl: "https://logo.clearbit.com/spglobal.com" },
  { key: "bonds", label: "Bonds", iconUrl: "https://logo.clearbit.com/treasury.gov" },
  { key: "economy", label: "Economy", iconUrl: "https://logo.clearbit.com/stlouisfed.org" },
  { key: "options", label: "Options", iconUrl: "https://logo.clearbit.com/cboe.com" },
];

export const currencyCatalog: CurrencyItem[] = [
  { code: "USD", name: "US Dollar", iconUrl: "https://flagcdn.com/us.svg" },
  { code: "INR", name: "Indian Rupee", iconUrl: "https://flagcdn.com/in.svg" },
  { code: "EUR", name: "Euro", iconUrl: "https://flagcdn.com/eu.svg" },
  { code: "GBP", name: "British Pound", iconUrl: "https://flagcdn.com/gb.svg" },
  { code: "JPY", name: "Japanese Yen", iconUrl: "https://flagcdn.com/jp.svg" },
  { code: "CHF", name: "Swiss Franc", iconUrl: "https://flagcdn.com/ch.svg" },
  { code: "CAD", name: "Canadian Dollar", iconUrl: "https://flagcdn.com/ca.svg" },
  { code: "AUD", name: "Australian Dollar", iconUrl: "https://flagcdn.com/au.svg" },
  { code: "SGD", name: "Singapore Dollar", iconUrl: "https://flagcdn.com/sg.svg" },
  { code: "AED", name: "UAE Dirham", iconUrl: "https://flagcdn.com/ae.svg" },
];
