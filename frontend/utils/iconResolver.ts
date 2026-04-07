import type { AssetSearchItem } from "@/lib/assetSearch";
import { CRYPTO_ICON_ID_MAP } from "@/config/iconMap";
import { DOMAIN_MAP } from "@/config/domainMap";

function coinGeckoIconUrl(id: string): string {
  return `https://assets.coingecko.com/coins/images/${id}/small.png`;
}

function symbolKey(item: AssetSearchItem): string {
  return (item.symbol || item.ticker || "").toUpperCase();
}

function exchangeIconPath(exchange: string): string {
  const normalized = exchange.trim().toUpperCase();
  if (!normalized) return "/icons/exchange/default.svg";
  if (normalized === "NYSEARCA") return "/icons/exchange/NYSE.svg";
  return `/icons/exchange/${normalized}.svg`;
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
  return item.iconUrl || item.logoUrl || undefined;
}

function resolveStockIcon(item: AssetSearchItem): string | undefined {
  const symbol = symbolKey(item);
  const domain = DOMAIN_MAP[symbol];
  if (domain) {
    return `https://logo.clearbit.com/${domain}`;
  }

  return undefined;
}

export function resolveAssetIcons(item: AssetSearchItem): Pick<AssetSearchItem, "iconUrl" | "logoUrl" | "exchangeLogoUrl" | "exchangeIcon"> {
  const exchange = (item.exchange || "").toUpperCase();
  const exchangeIcon = exchangeIconPath(exchange);

  const withOptionalS3 = item as AssetSearchItem & { s3Icon?: string };

  const type = (item.type || item.instrumentType || "").toLowerCase();
  const isCrypto = type === "crypto" || item.category === "crypto";
  const isStockLike = item.category === "stocks" || item.category === "funds" || item.category === "bonds";

  const iconUrl = item.iconUrl
    || item.logoUrl
    || (isCrypto ? resolveCryptoIcon(item) : undefined)
    || (isStockLike ? resolveStockIcon(item) : undefined)
    || withOptionalS3.s3Icon
    || exchangeIcon;

  return {
    iconUrl,
    logoUrl: iconUrl,
    exchangeLogoUrl: exchangeIcon,
    exchangeIcon,
  };
}
