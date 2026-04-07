import type { AssetSearchItem } from "@/lib/assetSearch";
import { CRYPTO_ICON_ID_MAP, EXCHANGE_ICON_MAP, STOCK_DOMAIN_MAP } from "@/config/iconMap";
import { EXCHANGE_ICON_REGISTRY, ICON_REGISTRY } from "@/config/iconRegistry";

function coinGeckoIconUrl(id: string): string {
  return `https://assets.coingecko.com/coins/images/${id}/small.png`;
}

function symbolKey(item: AssetSearchItem): string {
  return (item.symbol || item.ticker || "").toUpperCase();
}

function deterministicGeneratedIcon(symbol: string, category: string): string {
  const normalizedSymbol = symbol || "UNKNOWN";
  const palette = ["#0ea5e9", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4", "#84cc16", "#f97316"];
  const sum = normalizedSymbol.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const bg = palette[sum % palette.length];
  const fg = "#ffffff";
  const initials = normalizedSymbol.slice(0, 3);
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='128' height='128' viewBox='0 0 128 128'><rect width='128' height='128' rx='24' fill='${bg}'/><text x='64' y='72' text-anchor='middle' font-family='Inter, Arial, sans-serif' font-size='36' font-weight='700' fill='${fg}'>${initials}</text><title>${normalizedSymbol}-${category}</title></svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

function resolveCryptoIcon(item: AssetSearchItem): string | undefined {
  const symbol = symbolKey(item);
  const quoteSuffixes = ["USDT", "USDC", "USD", "BTC", "ETH", "BNB", "INR", "EUR", "GBP", "JPY"];
  let base = symbol;
  for (const suffix of quoteSuffixes) {
    if (base.endsWith(suffix) && base.length > suffix.length) {
      base = base.slice(0, -suffix.length);
      break;
    }
  }
  const iconId = CRYPTO_ICON_ID_MAP[base] || CRYPTO_ICON_ID_MAP[symbol];
  if (iconId) {
    return coinGeckoIconUrl(iconId);
  }
  return undefined;
}

function resolveStockIcon(item: AssetSearchItem): string | undefined {
  const symbol = symbolKey(item);
  const registryIcon = ICON_REGISTRY[symbol];
  if (registryIcon) {
    return registryIcon;
  }

  const domain = STOCK_DOMAIN_MAP[symbol];
  if (domain) {
    return `https://logo.clearbit.com/${domain}`;
  }

  return undefined;
}

export function resolveAssetIcons(item: AssetSearchItem): Pick<AssetSearchItem, "iconUrl" | "logoUrl" | "exchangeLogoUrl" | "exchangeIcon"> {
  const symbol = symbolKey(item);
  const exchange = (item.exchange || "").toUpperCase();
  const registryIcon = ICON_REGISTRY[symbol];
  const exchangeIcon = item.exchangeLogoUrl
    || item.exchangeIcon
    || EXCHANGE_ICON_REGISTRY[exchange]
    || EXCHANGE_ICON_MAP[exchange]
    || "/icons/exchange/default.svg";

  const type = (item.type || item.instrumentType || "").toLowerCase();
  const isCrypto = type === "crypto" || item.category === "crypto";
  const isStockLike = item.category === "stocks" || item.category === "funds" || item.category === "bonds";

  const iconUrl = registryIcon
    || item.iconUrl
    || item.logoUrl
    || (isCrypto ? resolveCryptoIcon(item) : undefined)
    || (isStockLike ? resolveStockIcon(item) : undefined)
    || exchangeIcon
    || deterministicGeneratedIcon(symbol, item.category || "asset");

  return {
    iconUrl,
    logoUrl: iconUrl,
    exchangeLogoUrl: exchangeIcon,
    exchangeIcon,
  };
}
