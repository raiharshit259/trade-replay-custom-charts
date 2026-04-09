import { SymbolModel } from "../models/Symbol";
import { env } from "../config/env";
import { inferDomainWithConfidence } from "./domainConfidence.service";
import { classifySymbol, type SymbolClass } from "./symbolClassifier.service";
import { FailureReason, recordResolverDiagnostic } from "./diagnostics.service";
import { getKnownDomain, rememberResolvedDomain } from "./domainMemory.service";
import { getCuratedDomain, saveToDomainDataset } from "./curatedDomainDataset.service";
import { invalidateSymbolCaches } from "./cacheInvalidation.service";

function clearbitUrl(domain: string): string {
  return `https://logo.clearbit.com/${domain}`;
}

function fmpLogoUrl(symbol: string): string {
  const apiKeySuffix = env.FMP_API_KEY ? `?apikey=${encodeURIComponent(env.FMP_API_KEY)}` : "";
  return `https://financialmodelingprep.com/image-stock/${symbol.toUpperCase()}.png${apiKeySuffix}`;
}

function googleFaviconUrl(domain: string): string {
  return `https://www.google.com/s2/favicons?domain=${domain}&sz=128`;
}

function duckduckgoIconUrl(domain: string): string {
  return `https://icons.duckduckgo.com/ip3/${domain}.ico`;
}

function normalizeDomain(domain: string): string {
  return domain.trim().toLowerCase().replace(/^https?:\/\//, "").replace(/\/$/, "");
}

function normalizeSymbol(symbol: string): string {
  return symbol.trim().toUpperCase().replace(/[^A-Z0-9.-]/g, "");
}

const failedDomains = new Set<string>();
const validDomains = new Set<string>();
const CIRCUIT_BREAKER_THRESHOLD = 15;
const CIRCUIT_BREAKER_COOLDOWN_MS = 5 * 60 * 1000;
let externalFailureCount = 0;
let circuitOpenUntil = 0;
const CRYPTO_ICON_MAP: Record<string, string> = {
  BTC: "https://assets.coingecko.com/coins/images/1/small/bitcoin.png",
  ETH: "https://assets.coingecko.com/coins/images/279/small/ethereum.png",
  USDT: "https://assets.coingecko.com/coins/images/325/small/tether.png",
  BNB: "https://assets.coingecko.com/coins/images/825/small/bnb-icon2_2x.png",
  SOL: "https://assets.coingecko.com/coins/images/4128/small/solana.png",
  XRP: "https://assets.coingecko.com/coins/images/44/small/xrp-symbol-white-128.png",
  ADA: "https://assets.coingecko.com/coins/images/975/small/cardano.png",
  DOGE: "https://assets.coingecko.com/coins/images/5/small/dogecoin.png",
  MATIC: "https://assets.coingecko.com/coins/images/4713/small/matic-token-icon.png",
  DOT: "https://assets.coingecko.com/coins/images/12171/small/polkadot.png",
  AVAX: "https://assets.coingecko.com/coins/images/12559/small/coin-round-red.png",
  LINK: "https://assets.coingecko.com/coins/images/877/small/chainlink-new-logo.png",
  LTC: "https://assets.coingecko.com/coins/images/2/small/litecoin.png",
  SHIB: "https://assets.coingecko.com/coins/images/11939/small/shiba.png",
};

function extractBaseSymbol(rawSymbol: string): string {
  const upper = rawSymbol.trim().toUpperCase();
  const [head] = upper.split(/[-.$]/);
  return head || upper;
}

function extractCryptoBaseSymbol(rawSymbol: string): string {
  const upper = normalizeSymbol(rawSymbol);
  const quoteSuffixes = ["USDT", "USDC", "BUSD", "USD", "INR", "BTC", "ETH", "BNB", "EUR", "TRY"];
  for (const suffix of quoteSuffixes) {
    if (upper.endsWith(suffix) && upper.length > suffix.length + 1) {
      return upper.slice(0, -suffix.length);
    }
  }
  return upper;
}

function generateCryptoDomainGuesses(symbol: string): string[] {
  const base = extractCryptoBaseSymbol(symbol).toLowerCase();
  if (!base || base.length < 3) return [];
  return [`${base}.com`, `${base}.org`, `${base}.io`];
}

function isBlockedGuessedDomain(domain: string): boolean {
  const normalized = normalizeDomain(domain);
  const blockedRoots = new Set(["usdt", "usdc", "busd", "usd", "inr", "btc", "eth", "bnb"]);
  const root = normalized.split(".")[0] || "";
  return blockedRoots.has(root);
}

function isPlausibleGuessedDomain(domain: string): boolean {
  const normalized = normalizeDomain(domain);
  if (!normalized || !normalized.includes(".")) return false;
  if (isBlockedGuessedDomain(normalized)) return false;
  const root = normalized.split(".")[0] || "";
  if (root.length < 3) return false;
  return /^[a-z0-9][a-z0-9-]*\.[a-z0-9.-]+$/.test(normalized);
}

const GENERIC_LOW_CONFIDENCE_TOKENS = new Set([
  "india",
  "indian",
  "global",
  "group",
  "holding",
  "holdings",
  "service",
  "services",
  "solution",
  "solutions",
  "system",
  "systems",
  "enterprise",
  "enterprises",
  "industry",
  "industries",
  "financial",
  "finance",
  "capital",
  "investment",
  "investments",
  "ventures",
  "infra",
  "energy",
  "auto",
  "motors",
  "technology",
  "technologies",
]);

function pickLowConfidenceToken(symbol: string, name: string, country?: string): string {
  const base = extractBaseSymbol(symbol).toLowerCase().replace(/[^a-z0-9]/g, "");
  if (base.length >= 4 && !GENERIC_LOW_CONFIDENCE_TOKENS.has(base)) {
    return base;
  }

  const isIndia = (country || "").toUpperCase() === "IN" || (country || "").toUpperCase() === "INDIA";
  const cleanedNameTokens = name
    .toLowerCase()
    .replace(/\b(limited|ltd|inc\.?|corp\.?|plc|company|co\.?|holdings|group)\b/gi, "")
    .replace(/[^a-z0-9 ]/g, " ")
    .trim()
    .split(/\s+/)
    .filter((part) => part.length >= 4 && !GENERIC_LOW_CONFIDENCE_TOKENS.has(part));

  if (!cleanedNameTokens.length) return "";
  if (!isIndia) return cleanedNameTokens[0] ?? "";
  return cleanedNameTokens.sort((a, b) => b.length - a.length)[0] ?? "";
}

function generateLowConfidenceDomainGuesses(input: { symbol: string; name: string; country?: string }): string[] {
  const token = pickLowConfidenceToken(input.symbol, input.name, input.country);
  if (!token) return [];
  return [];
}

function etfFallbackLogoUrl(): string {
  return "https://www.google.com/s2/favicons?domain=etf.com&sz=128";
}

function forexFallbackLogoUrl(symbol: string): string {
  const normalized = normalizeSymbol(symbol);
  return `https://www.google.com/s2/favicons?domain=xe.com&sz=128&pair=${normalized}`;
}

function isCircuitOpen(): boolean {
  return Date.now() < circuitOpenUntil;
}

function markExternalCallSuccess(): void {
  externalFailureCount = 0;
}

function markExternalCallFailure(): void {
  externalFailureCount += 1;
  if (externalFailureCount >= CIRCUIT_BREAKER_THRESHOLD) {
    circuitOpenUntil = Date.now() + CIRCUIT_BREAKER_COOLDOWN_MS;
  }
}

async function validateLogoUrl(url: string): Promise<boolean> {
  if (isCircuitOpen()) return false;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 3000);
  try {
    const response = await fetch(url, {
      method: "HEAD",
      signal: controller.signal,
      headers: { "User-Agent": "tradereplay-logo-worker/1.0" },
    });
    if (response.ok) return true;

    const fallback = await fetch(url, {
      method: "GET",
      signal: controller.signal,
      headers: { "User-Agent": "tradereplay-logo-worker/1.0", Range: "bytes=0-64" },
    });
    if (fallback.ok) {
      markExternalCallSuccess();
      return true;
    }
    markExternalCallFailure();
    return false;
  } catch {
    markExternalCallFailure();
    return false;
  } finally {
    clearTimeout(timeout);
  }
}

async function validateLogoUrlDetailed(url: string): Promise<{ ok: boolean; failureReason?: FailureReason }> {
  if (isCircuitOpen()) {
    return { ok: false, failureReason: FailureReason.RATE_LIMIT };
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 3000);
  try {
    const response = await fetch(url, {
      method: "HEAD",
      signal: controller.signal,
      headers: { "User-Agent": "tradereplay-logo-worker/1.0" },
    });
    if (response.ok) {
      markExternalCallSuccess();
      return { ok: true };
    }
    if (response.status === 404) return { ok: false, failureReason: FailureReason.API_404 };
    if (response.status === 429) return { ok: false, failureReason: FailureReason.RATE_LIMIT };

    const fallback = await fetch(url, {
      method: "GET",
      signal: controller.signal,
      headers: { "User-Agent": "tradereplay-logo-worker/1.0", Range: "bytes=0-64" },
    });
    if (fallback.ok) {
      markExternalCallSuccess();
      return { ok: true };
    }
    if (fallback.status === 404) return { ok: false, failureReason: FailureReason.API_404 };
    if (fallback.status === 429) return { ok: false, failureReason: FailureReason.RATE_LIMIT };
    markExternalCallFailure();
    return { ok: false, failureReason: FailureReason.INVALID_LOGO };
  } catch {
    markExternalCallFailure();
    return { ok: false, failureReason: FailureReason.INVALID_LOGO };
  } finally {
    clearTimeout(timeout);
  }
}

async function isValidDomain(domain: string): Promise<boolean> {
  if (isCircuitOpen()) return false;

  const normalized = normalizeDomain(domain);
  if (!normalized || failedDomains.has(normalized)) return false;
  if (validDomains.has(normalized)) return true;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 2000);
  try {
    const res = await fetch(`https://${normalized}`, {
      method: "HEAD",
      signal: controller.signal,
      headers: { "User-Agent": "tradereplay-domain-check/1.0" },
    });
    if (res.ok) {
      validDomains.add(normalized);
      markExternalCallSuccess();
      return true;
    }

    // Some hosts reject HEAD but are still valid; verify with a tiny GET probe.
    const fallback = await fetch(`https://${normalized}`, {
      method: "GET",
      signal: controller.signal,
      headers: {
        "User-Agent": "tradereplay-domain-check/1.0",
        Range: "bytes=0-64",
      },
    });

    if (fallback.ok || (fallback.status >= 300 && fallback.status < 500 && fallback.status !== 404)) {
      validDomains.add(normalized);
      markExternalCallSuccess();
      return true;
    }

    failedDomains.add(normalized);
    markExternalCallFailure();
    return false;
  } catch {
    failedDomains.add(normalized);
    markExternalCallFailure();
    return false;
  } finally {
    clearTimeout(timeout);
  }
}

async function getValidatedDomain(domain: string | null | undefined): Promise<string | null> {
  if (!domain) return null;
  const normalized = normalizeDomain(domain);
  if (!normalized) return null;
  if (!(await isValidDomain(normalized))) return null;
  return normalized;
}

export async function tryFetchLogo(domain: string): Promise<string | null> {
  const normalized = normalizeDomain(domain);
  if (!normalized) return null;

  // 1) Clearbit
  const clearbit = clearbitUrl(normalized);
  if (await validateLogoUrl(clearbit)) return clearbit;

  // 2) Google favicon
  const google = googleFaviconUrl(normalized);
  if (await validateLogoUrl(google)) return google;

  // 3) DuckDuckGo host icon
  const duck = duckduckgoIconUrl(normalized);
  if (await validateLogoUrl(duck)) return duck;

  return null;
}

async function tryFetchFmpLogo(symbol: string): Promise<string | null> {
  if (!env.FMP_API_KEY) return null;
  const normalizedSymbol = normalizeSymbol(symbol);
  if (!normalizedSymbol) return null;

  const candidate = fmpLogoUrl(normalizedSymbol);
  if (await validateLogoUrl(candidate)) return candidate;
  return null;
}

async function tryFetchCryptoLogo(symbol: string): Promise<string | null> {
  const base = extractCryptoBaseSymbol(symbol).toLowerCase();
  if (!base) return null;

  const sources = [
    `https://cdn.jsdelivr.net/gh/spothq/cryptocurrency-icons@master/128/color/${base}.png`,
    `https://cdn.jsdelivr.net/gh/spothq/cryptocurrency-icons@master/128/icon/${base}.png`,
  ];

  for (const source of sources) {
    // eslint-disable-next-line no-await-in-loop
    if (await validateLogoUrl(source)) return source;
  }

  return null;
}

async function tryFetchCoinGeckoLogo(symbol: string): Promise<string | null> {
  if (isCircuitOpen()) return null;

  const base = extractCryptoBaseSymbol(symbol).toLowerCase();
  if (!base) return null;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 2500);
  try {
    const res = await fetch(`https://api.coingecko.com/api/v3/search?query=${encodeURIComponent(base)}`, {
      method: "GET",
      signal: controller.signal,
      headers: { "User-Agent": "tradereplay-logo-worker/1.0" },
    });
    if (!res.ok) {
      markExternalCallFailure();
      return null;
    }

    const payload = await res.json() as {
      coins?: Array<{ symbol?: string; large?: string; thumb?: string; id?: string }>;
    };

    const coins = payload.coins ?? [];
    const exact = coins.find((coin) => (coin.symbol || "").toLowerCase() === base) ?? coins[0];
    const candidate = exact?.large || exact?.thumb || null;
    if (!candidate) return null;

    if (await validateLogoUrl(candidate)) return candidate;
    markExternalCallFailure();
    return null;
  } catch {
    markExternalCallFailure();
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

export interface ResolveLogoResult {
  logoUrl: string | null;
  domain: string | null;
  hasDomain: boolean;
  confidence: number;
  classification: SymbolClass;
  reason?: FailureReason;
  attemptedSources: string[];
  source?: string;
}

export async function resolveLogoForSymbol(input: {
  symbol: string;
  fullSymbol?: string;
  name: string;
  exchange?: string;
  companyDomain?: string;
  type?: string;
  country?: string;
  strategy?: "normal" | "aggressive" | "deep_enrichment" | "strict_domain_only";
  minConfidence?: number;
  forceAttempt?: boolean;
}): Promise<ResolveLogoResult> {
  const strategy = input.strategy ?? "normal";
  const strictDomainOnly = strategy === "strict_domain_only";
  const attemptedSources: string[] = [];
  const country = (input.country || "GLOBAL").toUpperCase();
  const baseSymbol = extractBaseSymbol(input.symbol);

  if (baseSymbol && baseSymbol !== input.symbol.toUpperCase()) {
    attemptedSources.push("base-symbol-lookup");
    const baseRecord = await SymbolModel.findOne({
      symbol: baseSymbol,
      $or: [{ iconUrl: { $ne: "" } }, { s3Icon: { $ne: "" } }],
    })
      .sort({ logoValidatedAt: -1 })
      .select({ iconUrl: 1, s3Icon: 1, companyDomain: 1 })
      .lean<{ iconUrl?: string; s3Icon?: string; companyDomain?: string } | null>();

    const reusedIcon = baseRecord?.iconUrl || baseRecord?.s3Icon || "";
    if (reusedIcon.startsWith("http")) {
      const baseCompanyDomain = baseRecord && baseRecord.companyDomain ? baseRecord.companyDomain : null;
      const result: ResolveLogoResult = {
        logoUrl: reusedIcon,
        domain: baseCompanyDomain,
        hasDomain: Boolean(baseCompanyDomain),
        confidence: 0.99,
        classification: "company",
        attemptedSources,
        source: "base-symbol-lookup",
      };
      recordResolverDiagnostic({
        symbol: input.symbol,
        type: input.type || "company",
        country,
        attemptedSources,
        domain: result.domain,
        confidence: result.confidence,
        result: "resolved",
        source: result.source,
      });
      return result;
    }
  }

  const classification = classifySymbol({
    symbol: input.symbol,
    name: input.name,
    exchange: input.exchange,
    type: input.type,
  });

  if (classification === "forex") {
    attemptedSources.push("forex-fallback");
    const result: ResolveLogoResult = {
      logoUrl: forexFallbackLogoUrl(input.symbol),
      domain: "xe.com",
      hasDomain: true,
      confidence: 1,
      classification,
      attemptedSources,
      source: "forex-fallback",
    };
    recordResolverDiagnostic({
      symbol: input.symbol,
      type: input.type || classification,
      country,
      attemptedSources,
      domain: result.domain,
      confidence: result.confidence,
      result: "resolved",
      source: result.source,
    });
    await rememberResolvedDomain({ symbol: input.symbol, domain: "xe.com", confidence: 1, source: "forex-fallback" });
    return result;
  }

  if (classification === "fund") {
    attemptedSources.push("fund-fallback");
    const result: ResolveLogoResult = {
      logoUrl: etfFallbackLogoUrl(),
      domain: "etf.com",
      hasDomain: true,
      confidence: 1,
      classification,
      attemptedSources,
      source: "fund-fallback",
    };
    recordResolverDiagnostic({
      symbol: input.symbol,
      type: input.type || classification,
      country,
      attemptedSources,
      domain: result.domain,
      confidence: result.confidence,
      result: "resolved",
      source: result.source,
    });
    await rememberResolvedDomain({ symbol: input.symbol, domain: "etf.com", confidence: 1, source: "fund-fallback" });
    return result;
  }

  if (classification === "crypto") {
    const cryptoBase = extractCryptoBaseSymbol(input.symbol).toUpperCase();
    const mappedCryptoIcon = CRYPTO_ICON_MAP[cryptoBase];
    if (mappedCryptoIcon) {
      attemptedSources.push("crypto-static-map");
      const result: ResolveLogoResult = {
        logoUrl: mappedCryptoIcon,
        domain: null,
        hasDomain: false,
        confidence: 1,
        classification,
        attemptedSources,
        source: "crypto-static-map",
      };
      recordResolverDiagnostic({
        symbol: input.symbol,
        type: input.type || classification,
        country,
        attemptedSources,
        domain: result.domain,
        confidence: result.confidence,
        result: "resolved",
        source: result.source,
      });
      return result;
    }

    const existingCrypto = await SymbolModel.findOne({
      symbol: input.symbol.toUpperCase(),
    })
      .sort({ logoValidatedAt: -1 })
      .select({ iconUrl: 1, s3Icon: 1 })
      .lean<{ iconUrl?: string; s3Icon?: string } | null>();

    const existingIcon = existingCrypto?.iconUrl || existingCrypto?.s3Icon || null;
    if (existingIcon && existingIcon.startsWith("http")) {
      attemptedSources.push("crypto-existing-icon");
      const result: ResolveLogoResult = {
        logoUrl: existingIcon,
        domain: null,
        hasDomain: false,
        confidence: 1,
        classification,
        attemptedSources,
        source: "crypto-existing-icon",
      };
      recordResolverDiagnostic({
        symbol: input.symbol,
        type: input.type || classification,
        country,
        attemptedSources,
        domain: result.domain,
        confidence: result.confidence,
        result: "resolved",
        source: result.source,
      });
      return result;
    }

    attemptedSources.push("coingecko");
    const coingeckoLogo = await tryFetchCoinGeckoLogo(input.symbol);
    if (coingeckoLogo) {
      const result: ResolveLogoResult = {
        logoUrl: coingeckoLogo,
        domain: "coingecko.com",
        hasDomain: false,
        confidence: 0.95,
        classification,
        attemptedSources,
        source: "coingecko",
      };
      recordResolverDiagnostic({
        symbol: input.symbol,
        type: input.type || classification,
        country,
        attemptedSources,
        domain: result.domain,
        confidence: result.confidence,
        result: "resolved",
        source: result.source,
      });
      return result;
    }

    attemptedSources.push("crypto-cdn");
    const cryptoLogo = await tryFetchCryptoLogo(input.symbol);
    if (cryptoLogo) {
      const result: ResolveLogoResult = {
        logoUrl: cryptoLogo,
        domain: "crypto-icons.local",
        hasDomain: false,
        confidence: 0.9,
        classification,
        attemptedSources,
        source: "crypto-cdn",
      };
      recordResolverDiagnostic({
        symbol: input.symbol,
        type: input.type || classification,
        country,
        attemptedSources,
        domain: result.domain,
        confidence: result.confidence,
        result: "resolved",
        source: result.source,
      });
      return result;
    }

    attemptedSources.push("fmp");
    const cryptoFmp = await tryFetchFmpLogo(input.symbol);
    if (cryptoFmp) {
      const result: ResolveLogoResult = {
        logoUrl: cryptoFmp,
        domain: null,
        hasDomain: false,
        confidence: 0.8,
        classification,
        attemptedSources,
        source: "fmp",
      };
      recordResolverDiagnostic({
        symbol: input.symbol,
        type: input.type || classification,
        country,
        attemptedSources,
        domain: result.domain,
        confidence: result.confidence,
        result: "resolved",
        source: result.source,
      });
      return result;
    }

    const cryptoFail: ResolveLogoResult = {
      logoUrl: null,
      domain: null,
      hasDomain: false,
      confidence: 0,
      classification,
      reason: FailureReason.NO_DOMAIN,
      attemptedSources,
    };
    recordResolverDiagnostic({
      symbol: input.symbol,
      type: input.type || classification,
      country,
      attemptedSources,
      domain: null,
      confidence: 0,
      result: "failed",
      failureReason: FailureReason.NO_DOMAIN,
    });
    return cryptoFail;
  }

  const fullSymbol = input.fullSymbol || `${(input.exchange || "GLOBAL").toUpperCase()}:${input.symbol}`;
  const curatedDomain = await getCuratedDomain({
    symbol: input.symbol,
    fullSymbol,
  });
  const validatedCuratedDomain = await getValidatedDomain(curatedDomain);
  const knownDomain = await getKnownDomain(input.symbol);
  const validatedKnownDomain = await getValidatedDomain(knownDomain);
  const registryDomainRecord = await SymbolModel.findOne({
    $or: [{ symbol: input.symbol.toUpperCase() }, { symbol: baseSymbol }],
    companyDomain: { $ne: "" },
  })
    .sort({ logoValidatedAt: -1 })
    .select({ companyDomain: 1 })
    .lean<{ companyDomain?: string } | null>();
  const validatedRegistryDomain = await getValidatedDomain(registryDomainRecord?.companyDomain || null);

  if (validatedCuratedDomain || validatedKnownDomain || validatedRegistryDomain) {
    const prioritizedDomain = validatedCuratedDomain || validatedKnownDomain || validatedRegistryDomain;
    if (validatedCuratedDomain) attemptedSources.push("domain-dataset");
    if (!validatedCuratedDomain && validatedKnownDomain) attemptedSources.push("domain-memory");
    if (!validatedCuratedDomain && !validatedKnownDomain && validatedRegistryDomain) attemptedSources.push("symbol-registry-domain");

    if (prioritizedDomain) {
      const preferredDomainCandidates: Array<{ source: string; url: string }> = [
        { source: "google", url: googleFaviconUrl(prioritizedDomain) },
        { source: "duckduckgo", url: duckduckgoIconUrl(prioritizedDomain) },
      ];

      for (const candidate of preferredDomainCandidates) {
        attemptedSources.push(candidate.source);
        // eslint-disable-next-line no-await-in-loop
        const validation = await validateLogoUrlDetailed(candidate.url);
        if (validation.ok) {
          const result: ResolveLogoResult = {
            logoUrl: candidate.url,
            domain: prioritizedDomain,
            hasDomain: true,
            confidence: 0.99,
            classification,
            attemptedSources,
            source: candidate.source,
          };
          recordResolverDiagnostic({
            symbol: input.symbol,
            type: input.type || classification,
            country,
            attemptedSources,
            domain: result.domain,
            confidence: result.confidence,
            result: "resolved",
            source: result.source,
          });
          await rememberResolvedDomain({ symbol: input.symbol, domain: prioritizedDomain, confidence: 0.99, source: candidate.source });
          await saveToDomainDataset(input.symbol, prioritizedDomain);
          return result;
        }
      }
    }
  }

  const confidenceMeta = inferDomainWithConfidence({
    symbol: input.symbol,
    name: input.name,
    exchange: input.exchange,
  });
  const inferredRaw = validatedCuratedDomain
    || validatedKnownDomain
    || validatedRegistryDomain
    || input.companyDomain
    || (confidenceMeta.reason === "nse_symbol_map" ? confidenceMeta.domain : null);
  const inferred = await getValidatedDomain(inferredRaw);
  const minimumConfidence = strategy === "deep_enrichment" || strictDomainOnly
    ? 0
    : (input.minConfidence ?? (strategy === "aggressive" ? 0.5 : 0.7));
  const isCuratedMapping = confidenceMeta.reason === "nse_symbol_map";
  const allowLowConfidenceMode = !strictDomainOnly
    && (Boolean(input.forceAttempt) || !inferred || confidenceMeta.confidence < minimumConfidence);

  if (strictDomainOnly && !validatedKnownDomain && !validatedCuratedDomain && !validatedRegistryDomain && !(isCuratedMapping && inferred)) {
    const strictFail: ResolveLogoResult = {
      logoUrl: null,
      domain: null,
      hasDomain: false,
      confidence: confidenceMeta.confidence,
      classification,
      reason: FailureReason.NO_DOMAIN,
      attemptedSources: [...attemptedSources, "strict-domain-only-skip"],
    };
    recordResolverDiagnostic({
      symbol: input.symbol,
      type: input.type || classification,
      country,
      attemptedSources: strictFail.attemptedSources,
      domain: null,
      confidence: strictFail.confidence,
      result: "failed",
      failureReason: FailureReason.NO_DOMAIN,
    });
    return strictFail;
  }

  if (allowLowConfidenceMode) {
    attemptedSources.push("domain-confidence-check");

    const guessedDomains = Array.from(
      new Set(
        [
          ...(inferred ? [inferred] : []),
          ...generateLowConfidenceDomainGuesses({ symbol: input.symbol, name: input.name, country }),
        ]
          .map((candidate) => normalizeDomain(candidate))
          .filter((candidate) => isPlausibleGuessedDomain(candidate))
      )
    ).filter((candidate) => !failedDomains.has(candidate));

    attemptedSources.push("fmp");
    const fmpLowConfidence = await tryFetchFmpLogo(input.symbol);
    if (fmpLowConfidence) {
      const result: ResolveLogoResult = {
        logoUrl: fmpLowConfidence,
        domain: normalizeSymbol(input.symbol),
        hasDomain: false,
        confidence: confidenceMeta.confidence,
        classification,
        reason: FailureReason.LOW_CONFIDENCE,
        attemptedSources,
        source: "fmp",
      };
      recordResolverDiagnostic({
        symbol: input.symbol,
        type: input.type || classification,
        country,
        attemptedSources,
        domain: result.domain,
        confidence: result.confidence,
        result: "resolved",
        source: result.source,
      });
      if (inferred) {
        await saveToDomainDataset(input.symbol, inferred);
      }
      return result;
    }

    for (const domainGuess of guessedDomains) {
      // eslint-disable-next-line no-await-in-loop
      if (!(await isValidDomain(domainGuess))) {
        continue;
      }

      const lowConfidenceCandidates: Array<{ source: string; url: string }> = strategy === "deep_enrichment"
        ? [
            { source: "google", url: googleFaviconUrl(domainGuess) },
            { source: "duckduckgo", url: duckduckgoIconUrl(domainGuess) },
            { source: "clearbit", url: clearbitUrl(domainGuess) },
          ]
        : [
            { source: "google", url: googleFaviconUrl(domainGuess) },
            { source: "duckduckgo", url: duckduckgoIconUrl(domainGuess) },
            { source: "clearbit", url: clearbitUrl(domainGuess) },
          ];

      for (const candidate of lowConfidenceCandidates) {
        attemptedSources.push(candidate.source);
        // eslint-disable-next-line no-await-in-loop
        const validation = await validateLogoUrlDetailed(candidate.url);
        if (validation.ok) {
          const result: ResolveLogoResult = {
            logoUrl: candidate.url,
            domain: domainGuess,
            hasDomain: true,
            confidence: confidenceMeta.confidence,
            classification,
            reason: FailureReason.LOW_CONFIDENCE,
            attemptedSources,
            source: candidate.source,
          };
          await rememberResolvedDomain({
            symbol: input.symbol,
            domain: domainGuess,
            confidence: Math.max(0.3, confidenceMeta.confidence),
            source: candidate.source,
          });
          recordResolverDiagnostic({
            symbol: input.symbol,
            type: input.type || classification,
            country,
            attemptedSources,
            domain: result.domain,
            confidence: result.confidence,
            result: "resolved",
            source: result.source,
          });
          return result;
        }

        if (validation.failureReason === FailureReason.API_404) {
          failedDomains.add(domainGuess);
          validDomains.delete(domainGuess);
        }
      }
    }

    const reason = !inferred ? FailureReason.NO_DOMAIN : FailureReason.LOW_CONFIDENCE;
    const result: ResolveLogoResult = {
      logoUrl: null,
      domain: null,
      hasDomain: false,
      confidence: confidenceMeta.confidence,
      classification,
      reason,
      attemptedSources,
    };
    recordResolverDiagnostic({
      symbol: input.symbol,
      type: input.type || classification,
      country,
      attemptedSources,
      domain: result.domain,
      confidence: result.confidence,
      result: "failed",
      failureReason: reason,
    });
    return result;
  }

  if (!strictDomainOnly) {
    attemptedSources.push("fmp");
    const fmp = await tryFetchFmpLogo(input.symbol);
    if (fmp) {
      const result: ResolveLogoResult = {
        logoUrl: fmp,
        domain: inferred || normalizeSymbol(input.symbol),
        hasDomain: Boolean(inferred),
        confidence: confidenceMeta.confidence,
        classification,
        attemptedSources,
        source: "fmp",
      };
      recordResolverDiagnostic({
        symbol: input.symbol,
        type: input.type || classification,
        country,
        attemptedSources,
        domain: result.domain,
        confidence: result.confidence,
        result: "resolved",
        source: result.source,
      });
      return result;
    }
  }

  if (!inferred) {
    const noDomainResult: ResolveLogoResult = {
      logoUrl: null,
      domain: null,
      hasDomain: false,
      confidence: confidenceMeta.confidence,
      classification,
      reason: FailureReason.NO_DOMAIN,
      attemptedSources,
    };
    recordResolverDiagnostic({
      symbol: input.symbol,
      type: input.type || classification,
      country,
      attemptedSources,
      domain: null,
      confidence: noDomainResult.confidence,
      result: "failed",
      failureReason: FailureReason.NO_DOMAIN,
    });
    return noDomainResult;
  }

  const domainSourceCandidates: Array<{ source: string; url: string }> = [
    { source: "google", url: googleFaviconUrl(inferred) },
    { source: "duckduckgo", url: duckduckgoIconUrl(inferred) },
    { source: "clearbit", url: clearbitUrl(inferred) },
  ];

  let lastFailureReason: FailureReason = FailureReason.INVALID_LOGO;
  for (const candidate of domainSourceCandidates) {
    attemptedSources.push(candidate.source);
    // eslint-disable-next-line no-await-in-loop
    const validation = await validateLogoUrlDetailed(candidate.url);
    if (validation.ok) {
      const result: ResolveLogoResult = {
        domain: inferred,
        logoUrl: candidate.url,
        hasDomain: true,
        confidence: confidenceMeta.confidence,
        classification,
        attemptedSources,
        source: candidate.source,
      };
      recordResolverDiagnostic({
        symbol: input.symbol,
        type: input.type || classification,
        country,
        attemptedSources,
        domain: result.domain,
        confidence: result.confidence,
        result: "resolved",
        source: result.source,
      });
      await rememberResolvedDomain({
        symbol: input.symbol,
        domain: inferred,
        confidence: Math.max(0.6, confidenceMeta.confidence),
        source: candidate.source,
      });
      await saveToDomainDataset(input.symbol, inferred);
      return result;
    }
    lastFailureReason = validation.failureReason ?? FailureReason.INVALID_LOGO;
    if (lastFailureReason === FailureReason.API_404) {
      failedDomains.add(inferred);
      validDomains.delete(inferred);
    }
  }

  const result: ResolveLogoResult = {
    logoUrl: null,
    domain: inferred,
    hasDomain: Boolean(inferred),
    confidence: confidenceMeta.confidence,
    classification,
    reason: lastFailureReason,
    attemptedSources,
  };
  recordResolverDiagnostic({
    symbol: input.symbol,
    type: input.type || classification,
    country,
    attemptedSources,
    domain: result.domain,
    confidence: result.confidence,
    result: "failed",
    failureReason: result.reason,
  });
  return result;
}

export async function updateSymbolLogo(fullSymbol: string, logoUrl: string, domain: string, s3Icon = ""): Promise<boolean> {
  const result = await SymbolModel.updateOne(
    { fullSymbol: fullSymbol.toUpperCase() },
    {
      $set: {
        iconUrl: logoUrl,
        s3Icon,
        companyDomain: domain,
        logoValidatedAt: new Date(),
        logoAttempts: 0,
        lastLogoAttemptAt: Date.now(),
      },
    },
  );

  if (result.modifiedCount > 0) {
    await invalidateSymbolCaches(fullSymbol);
    return true;
  }

  return false;
}
