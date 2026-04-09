type SymbolType = "stock" | "crypto" | "forex" | "index";
import { env } from "../config/env";
import { resolveStaticIcon } from "../config/staticIconMap";

type ResolveInput = {
  symbol: string;
  name: string;
  exchange: string;
  type: SymbolType;
  companyDomain?: string;
  existingIconUrl?: string;
  existingS3Icon?: string;
};

type ResolveOutput = {
  logoUrl: string | null;
  domain: string | null;
  source: "clearbit" | "google" | "duckduckgo" | "fmp" | "coingecko" | "forex-fallback" | "fund-fallback" | "none";
};

const CRYPTO_ICON_MAP: Record<string, string> = {
  BTC: "https://assets.coingecko.com/coins/images/1/small/bitcoin.png",
  ETH: "https://assets.coingecko.com/coins/images/279/small/ethereum.png",
  USDT: "https://assets.coingecko.com/coins/images/325/small/tether.png",
  BNB: "https://assets.coingecko.com/coins/images/825/small/bnb-icon2_2x.png",
  SOL: "https://assets.coingecko.com/coins/images/4128/small/solana.png",
  XRP: "https://assets.coingecko.com/coins/images/44/small/xrp-symbol-white-128.png",
  ADA: "https://assets.coingecko.com/coins/images/975/small/cardano.png",
  DOGE: "https://assets.coingecko.com/coins/images/5/small/dogecoin.png",
};

function normalizeDomain(domain: string): string {
  return domain.trim().toLowerCase().replace(/^https?:\/\//, "").replace(/\/$/, "");
}

function resolveCdnIcon(input: ResolveInput): string | null {
  const candidates = [input.existingS3Icon, input.existingIconUrl].filter(Boolean) as string[];
  if (!candidates.length) return null;

  const cdnBase = env.AWS_CDN_BASE_URL.trim();
  for (const candidate of candidates) {
    if (!candidate) continue;
    if (cdnBase && candidate.startsWith(cdnBase)) return candidate;
    if (candidate.includes(".amazonaws.com/")) return candidate;
  }

  return null;
}

function clearbitUrl(domain: string): string {
  return `https://logo.clearbit.com/${domain}`;
}

function googleFaviconUrl(domain: string): string {
  return `https://www.google.com/s2/favicons?domain=${domain}&sz=128`;
}

function duckduckgoIconUrl(domain: string): string {
  return `https://icons.duckduckgo.com/ip3/${domain}.ico`;
}

function fmpLogoUrl(symbol: string): string {
  return `https://financialmodelingprep.com/image-stock/${symbol.toUpperCase()}.png`;
}

function extractCryptoBase(symbol: string): string {
  const upper = symbol.toUpperCase();
  const suffixes = ["USDT", "USDC", "BUSD", "USD", "INR", "BTC", "ETH", "BNB", "EUR"];
  for (const suffix of suffixes) {
    if (upper.endsWith(suffix) && upper.length > suffix.length + 1) {
      return upper.slice(0, -suffix.length);
    }
  }
  return upper;
}

async function validateLogoUrl(url: string): Promise<boolean> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 3000);

  try {
    const head = await fetch(url, {
      method: "HEAD",
      signal: controller.signal,
      headers: { "User-Agent": "tradereplay-logo-service/1.0" },
    });
    if (head.ok) return true;

    const fallback = await fetch(url, {
      method: "GET",
      signal: controller.signal,
      headers: {
        "User-Agent": "tradereplay-logo-service/1.0",
        Range: "bytes=0-64",
      },
    });

    return fallback.ok;
  } catch {
    return false;
  } finally {
    clearTimeout(timeout);
  }
}

async function resolveByDomain(domain: string): Promise<{ logoUrl: string | null; source: ResolveOutput["source"] }> {
  const normalized = normalizeDomain(domain);
  if (!normalized) {
    return { logoUrl: null, source: "none" };
  }

  const candidates: Array<{ source: ResolveOutput["source"]; url: string }> = [
    { source: "google", url: googleFaviconUrl(normalized) },
    { source: "duckduckgo", url: duckduckgoIconUrl(normalized) },
    { source: "clearbit", url: clearbitUrl(normalized) },
  ];

  for (const candidate of candidates) {
    // eslint-disable-next-line no-await-in-loop
    if (await validateLogoUrl(candidate.url)) {
      return { logoUrl: candidate.url, source: candidate.source };
    }
  }

  return { logoUrl: null, source: "none" };
}

function inferDomainFromName(name: string, exchange: string): string | null {
  const isIndia = exchange.toUpperCase() === "NSE" || exchange.toUpperCase() === "BSE";
  const clean = name
    .toLowerCase()
    .replace(/\b(limited|ltd|inc\.?|corp\.?|corporation|plc|company|co\.?|holdings|group)\b/g, "")
    .replace(/[^a-z0-9 ]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  const token = clean.split(" ").find((part) => part.length >= 4) || "";
  if (!token) return null;

  return `${token}${isIndia ? ".co.in" : ".com"}`;
}

export async function resolveLogo(input: ResolveInput): Promise<ResolveOutput> {
  const staticLogo = resolveStaticIcon(input.symbol);
  if (staticLogo) {
    return {
      logoUrl: staticLogo,
      domain: input.type === "forex" ? "xe.com" : null,
      source: input.type === "forex" ? "forex-fallback" : "fund-fallback",
    };
  }

  const cdnLogo = resolveCdnIcon(input);
  if (cdnLogo) {
    return {
      logoUrl: cdnLogo,
      domain: input.companyDomain ? normalizeDomain(input.companyDomain) : null,
      source: "fmp",
    };
  }

  if (input.type === "forex") {
    return {
      logoUrl: "https://www.google.com/s2/favicons?domain=xe.com&sz=128",
      domain: "xe.com",
      source: "forex-fallback",
    };
  }

  if (input.type === "index") {
    return {
      logoUrl: "https://www.google.com/s2/favicons?domain=tradingview.com&sz=128",
      domain: "tradingview.com",
      source: "fund-fallback",
    };
  }

  if (input.type === "crypto") {
    const base = extractCryptoBase(input.symbol);
    const mapped = CRYPTO_ICON_MAP[base];
    if (mapped) {
      return { logoUrl: mapped, domain: "coingecko.com", source: "coingecko" };
    }

    const fallback = `https://cdn.jsdelivr.net/gh/spothq/cryptocurrency-icons@master/128/color/${base.toLowerCase()}.png`;
    if (await validateLogoUrl(fallback)) {
      return { logoUrl: fallback, domain: "github.com", source: "coingecko" };
    }

    return { logoUrl: null, domain: null, source: "none" };
  }

  if (input.companyDomain) {
    const byKnownDomain = await resolveByDomain(input.companyDomain);
    if (byKnownDomain.logoUrl) {
      return {
        logoUrl: byKnownDomain.logoUrl,
        domain: normalizeDomain(input.companyDomain),
        source: byKnownDomain.source,
      };
    }
  }

  const inferred = inferDomainFromName(input.name, input.exchange);
  if (inferred) {
    const byInferred = await resolveByDomain(inferred);
    if (byInferred.logoUrl) {
      return {
        logoUrl: byInferred.logoUrl,
        domain: inferred,
        source: byInferred.source,
      };
    }
  }

  const fmp = fmpLogoUrl(input.symbol);
  if (await validateLogoUrl(fmp)) {
    return { logoUrl: fmp, domain: inferred, source: "fmp" };
  }

  return { logoUrl: null, domain: inferred, source: "none" };
}
