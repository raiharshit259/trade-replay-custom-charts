import type { AssetSearchItem } from "@/lib/assetSearch";

const EXCHANGE_DOMAINS: Record<string, string> = {
  NASDAQ: "nasdaq.com",
  NYSE: "nyse.com",
  NYSEARCA: "nyse.com",
  NSE: "nseindia.com",
  BSE: "bseindia.com",
  FOREX: "oanda.com",
  FX: "oanda.com",
  BINANCE: "binance.com",
  CRYPTO: "coingecko.com",
  GLOBAL: "coingecko.com",
  SP: "spglobal.com",
  DJ: "dowjones.com",
  LSE: "londonstockexchange.com",
  XETRA: "deutsche-boerse.com",
  EURONEXT: "euronext.com",
  TSE: "jpx.co.jp",
  HKEX: "hkex.com.hk",
};

function toSeed(input: string): string {
  return encodeURIComponent(input.trim().toUpperCase());
}

function generatedSymbolIcon(symbol: string): string {
  return `https://api.dicebear.com/9.x/identicon/svg?seed=${toSeed(symbol)}`;
}

function generatedExchangeIcon(exchange: string): string {
  return `https://api.dicebear.com/9.x/shapes/svg?seed=${toSeed(exchange)}`;
}

export function resolveAssetIcons(item: AssetSearchItem): Pick<AssetSearchItem, "iconUrl" | "logoUrl" | "exchangeLogoUrl" | "exchangeIcon"> {
  const exchange = (item.exchange || "").toUpperCase();
  const domain = EXCHANGE_DOMAINS[exchange];

  const exchangeLogoUrl = item.exchangeLogoUrl
    || item.exchangeIcon
    || (domain ? `https://logo.clearbit.com/${domain}` : generatedExchangeIcon(exchange || "EXCHANGE"));

  const iconUrl = item.iconUrl
    || item.logoUrl
    || (domain ? `https://logo.clearbit.com/${domain}` : generatedSymbolIcon(item.symbol || item.ticker || item.name));

  return {
    iconUrl,
    logoUrl: iconUrl,
    exchangeLogoUrl,
    exchangeIcon: exchangeLogoUrl,
  };
}
