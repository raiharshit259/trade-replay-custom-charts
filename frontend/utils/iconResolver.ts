import type { AssetSearchItem } from "@/lib/assetSearch";
import { CRYPTO_ICON_ID_MAP, EXCHANGE_ICON_MAP, STOCK_DOMAIN_MAP } from "@/config/iconMap";

function coinGeckoIconUrl(id: string): string {
  return `https://assets.coingecko.com/coins/images/${id}/small.png`;
}

function resolveCryptoIcon(item: AssetSearchItem): string | undefined {
  const symbol = (item.symbol || item.ticker || "").toUpperCase();
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
  if (base) {
    return `https://cryptoicons.org/api/icon/${base.toLowerCase()}/200`;
  }
  return undefined;
}

function resolveStockIcon(item: AssetSearchItem): string | undefined {
  const symbol = (item.symbol || item.ticker || "").toUpperCase();
  const domain = STOCK_DOMAIN_MAP[symbol];
  if (domain) {
    return `https://logo.clearbit.com/${domain}`;
  }

  if (symbol) {
    return `https://financialmodelingprep.com/image-stock/${symbol}.png`;
  }

  return undefined;
}

export function resolveAssetIcons(item: AssetSearchItem): Pick<AssetSearchItem, "iconUrl" | "logoUrl" | "exchangeLogoUrl" | "exchangeIcon"> {
  const exchange = (item.exchange || "").toUpperCase();
  const exchangeIcon = item.exchangeLogoUrl
    || item.exchangeIcon
    || EXCHANGE_ICON_MAP[exchange]
    || "";

  const type = (item.type || item.instrumentType || "").toLowerCase();
  const isCrypto = type === "crypto" || item.category === "crypto";
  const isStockLike = item.category === "stocks" || item.category === "funds" || item.category === "bonds";

  const iconUrl = item.iconUrl
    || item.logoUrl
    || (isCrypto ? resolveCryptoIcon(item) : undefined)
    || (isStockLike ? resolveStockIcon(item) : undefined)
    || exchangeIcon;

  return {
    iconUrl,
    logoUrl: iconUrl,
    exchangeLogoUrl: exchangeIcon,
    exchangeIcon,
  };
}
