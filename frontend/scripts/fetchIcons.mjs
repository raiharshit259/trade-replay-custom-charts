import fs from "node:fs/promises";
import path from "node:path";

const ICON_REGISTRY = {
  TCS: "/icons/stocks/TCS.svg",
  RELIANCE: "/icons/stocks/RELIANCE.svg",
  HDFCBANK: "/icons/stocks/HDFCBANK.svg",
  INFY: "/icons/stocks/INFY.svg",
  ICICIBANK: "/icons/stocks/ICICIBANK.svg",
  SBIN: "/icons/stocks/SBIN.svg",
  AAPL: "/icons/stocks/AAPL.svg",
  MSFT: "/icons/stocks/MSFT.svg",
  TSLA: "/icons/stocks/TSLA.svg",
  NVDA: "/icons/stocks/NVDA.svg",
  BTC: "/icons/crypto/BTC.svg",
  ETH: "/icons/crypto/ETH.svg",
  USDT: "/icons/crypto/USDT.svg",
  BNB: "/icons/crypto/BNB.svg",
  SOL: "/icons/crypto/SOL.svg",
  XRP: "/icons/crypto/XRP.svg",
  USDINR: "/icons/forex/USDINR.svg",
  EURUSD: "/icons/forex/EURUSD.svg",
  GBPUSD: "/icons/forex/GBPUSD.svg",
  USDJPY: "/icons/forex/USDJPY.svg",
  NIFTY50: "/icons/indices/NIFTY50.svg",
  SENSEX: "/icons/indices/SENSEX.svg",
  SPX: "/icons/indices/SPX.svg",
  NDX: "/icons/indices/NDX.svg",
};

const ROOT = path.resolve(process.cwd(), "public", "icons");

function svgForSymbol(symbol, bg) {
  return `<svg xmlns='http://www.w3.org/2000/svg' width='128' height='128' viewBox='0 0 128 128'><rect width='128' height='128' rx='24' fill='${bg}'/><text x='64' y='72' text-anchor='middle' font-family='Inter, Arial, sans-serif' font-size='34' font-weight='700' fill='#ffffff'>${symbol.slice(0, 3)}</text></svg>`;
}

async function ensureDirectories() {
  await Promise.all([
    fs.mkdir(path.join(ROOT, "stocks"), { recursive: true }),
    fs.mkdir(path.join(ROOT, "crypto"), { recursive: true }),
    fs.mkdir(path.join(ROOT, "forex"), { recursive: true }),
    fs.mkdir(path.join(ROOT, "indices"), { recursive: true }),
    fs.mkdir(path.join(ROOT, "exchange"), { recursive: true }),
    fs.mkdir(path.join(ROOT, "generated"), { recursive: true }),
  ]);
}

async function seedRegistryIcons() {
  const entries = Object.entries(ICON_REGISTRY);
  for (const [symbol, relativePath] of entries) {
    const absolute = path.resolve(process.cwd(), "public", relativePath.replace(/^\//, ""));
    try {
      await fs.access(absolute);
    } catch {
      const bg = symbol.charCodeAt(0) % 2 === 0 ? "#0ea5e9" : "#10b981";
      await fs.writeFile(absolute, svgForSymbol(symbol, bg), "utf8");
    }
  }
}

async function seedExchangeDefaults() {
  const exchanges = ["NASDAQ", "NYSE", "NSE", "BSE", "FOREX", "BINANCE", "GLOBAL", "SP", "DJ", "default"];
  for (const exchange of exchanges) {
    const file = path.join(ROOT, "exchange", `${exchange}.svg`);
    try {
      await fs.access(file);
    } catch {
      const bg = exchange.charCodeAt(0) % 2 === 0 ? "#334155" : "#1f2937";
      await fs.writeFile(file, svgForSymbol(exchange, bg), "utf8");
    }
  }
}

async function main() {
  await ensureDirectories();
  await seedRegistryIcons();
  await seedExchangeDefaults();
  console.log("Icon registry sync complete.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
