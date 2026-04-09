export interface DomainInferenceResult {
  domain: string | null;
  confidence: number;
  reason: string;
}

const NSE_SYMBOLS: Record<string, string> = {
  TCS: "tcs.com",
  INFY: "infosys.com",
  RELIANCE: "ril.com",
  HDFCBANK: "hdfcbank.com",
  ICICIBANK: "icicibank.com",
  SBIN: "sbi.co.in",
  ITC: "itcportal.com",
  LT: "larsentoubro.com",
  AXISBANK: "axisbank.com",
  KOTAKBANK: "kotak.com",
  BAJFINANCE: "bajajfinserv.in",
  BHARTIARTL: "airtel.in",
  HCLTECH: "hcltech.com",
  WIPRO: "wipro.com",
  MARUTI: "marutisuzuki.com",
  SUNPHARMA: "sunpharma.com",
  MANDM: "mahindra.com",
  "M&M": "mahindra.com",
  ULTRACEMCO: "ultratechcement.com",
  NTPC: "ntpc.co.in",
  POWERGRID: "powergrid.in",
  TITAN: "titancompany.in",
  BAJAJFINSV: "bajajfinserv.in",
  ASIANPAINT: "asianpaints.com",
  NESTLEIND: "nestle.in",
  TATAMOTORS: "tatamotors.com",
  TATASTEEL: "tatasteel.com",
  HINDUNILVR: "hul.co.in",
  ADANIENT: "adani.com",
  ADANIPORTS: "adaniports.com",
  ONGC: "ongcindia.com",
  COALINDIA: "coalindia.in",
  BPCL: "bharatpetroleum.in",
  IOC: "iocl.com",
  INDUSINDBK: "indusind.com",
  TECHM: "techmahindra.com",
  CIPLA: "cipla.com",
  DRREDDY: "drreddys.com",
  APOLLOHOSP: "apollohospitals.com",
  DIVISLAB: "divislabs.com",
  BRITANNIA: "britannia.co.in",
  EICHERMOT: "eichermotors.com",
  HEROMOTOCO: "heromotocorp.com",
  JSWSTEEL: "jsw.in",
  GRASIM: "grasim.com",
  HINDALCO: "hindalco.com",
  TATACONSUM: "tataconsumer.com",
  UPL: "upl-ltd.com",
  ADANIGREEN: "adanigreenenergy.com",
  ADANIPOWER: "adani.com",
  ADANITRANS: "adani.com",
  GODREJCP: "godrejcp.com",
  DABUR: "dabur.com",
  PIDILITIND: "pidilite.com",
  BAJAJ_AUTO: "bajajauto.com",
  HDFCLIFE: "hdfclife.com",
  SBILIFE: "sbilife.co.in",
  ICICIPRULI: "iciciprulife.com",
  SHREECEM: "shreecement.com",
  AMBUJACEM: "ambujacement.com",
  ACC: "acclimited.com",
  SIEMENS: "siemens.co.in",
  ABB: "new.abb.com/in",
  BEL: "bel-india.in",
  HAL: "hal-india.co.in",
  IRCTC: "irctc.co.in",
  DMART: "avenuesupermarts.com",
  ZOMATO: "zomato.com",
  PAYTM: "paytm.com",
  NYKAA: "nykaa.com",
  POLICYBZR: "policybazaar.com",
  MOTHERSON: "motherson.com",
  LUPIN: "lupin.com",
  AUROPHARMA: "aurobindo.com",
  BIOCON: "biocon.com",
  MCDOWELL_N: "diageoindia.com",
  PEL: "piramal.com",
  PNB: "pnbindia.in",
  BANKBARODA: "bankofbaroda.in",
  CANBK: "canarabank.com",
  UNIONBANK: "unionbankofindia.co.in",
  IDFCFIRSTB: "idfcfirstbank.com",
  FEDERALBNK: "federalbank.co.in",
  BHEL: "bhel.com",
  GAIL: "gailonline.com",
  TVSMOTOR: "tvsmotor.com",
  BOSCHLTD: "bosch.in",
  MRF: "mrf.co.in",
  INDIGO: "goindigo.in",
  LICI: "licindia.in",
  CHOLAFIN: "cholamandalam.com",
  SRF: "srf.com",
  PAGEIND: "pageind.com",
  HAVELLS: "havells.com",
  BERGEPAINT: "bergerpaints.com",
  NAUKRI: "infoedge.in",
  IRFC: "irfc.co.in",
  RVNL: "rvnl.org",
  PFC: "pfcindia.com",
  RECLTD: "recindia.nic.in",
  TRENT: "trentlimited.com",
};

const KEYWORDS: Array<{ keyword: string; domain: string; confidence: number }> = [
  { keyword: "tata", domain: "tcs.com", confidence: 0.9 },
  { keyword: "reliance", domain: "ril.com", confidence: 0.95 },
  { keyword: "infosys", domain: "infosys.com", confidence: 0.95 },
  { keyword: "hdfc", domain: "hdfcbank.com", confidence: 0.9 },
  { keyword: "icici", domain: "icicibank.com", confidence: 0.9 },
  { keyword: "state bank", domain: "sbi.co.in", confidence: 0.9 },
  { keyword: "bank", domain: "bankofbaroda.in", confidence: 0.45 },
  { keyword: "pharma", domain: "sunpharma.com", confidence: 0.5 },
  { keyword: "motors", domain: "tatamotors.com", confidence: 0.6 },
  { keyword: "steel", domain: "tatasteel.com", confidence: 0.55 },
  { keyword: "power", domain: "ntpc.co.in", confidence: 0.5 },
  { keyword: "cement", domain: "ultratechcement.com", confidence: 0.55 },
  { keyword: "finance", domain: "bajajfinserv.in", confidence: 0.5 },
  { keyword: "insurance", domain: "hdfclife.com", confidence: 0.5 },
];

const GENERIC_DOMAIN_TOKENS = new Set([
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
  "technologies",
  "technology",
]);

function getCleanSymbolToken(symbol: string): string {
  return symbol
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "")
    .replace(/(ltd|limited|inc|corp|plc)$/g, "");
}

function pickBestDomainToken(tokens: string[], preferLonger: boolean): string | null {
  const filtered = tokens.filter((token) => token.length >= 4 && !GENERIC_DOMAIN_TOKENS.has(token));
  if (!filtered.length) return null;
  return preferLonger
    ? filtered.sort((a, b) => b.length - a.length)[0]
    : filtered[0];
}

function fallbackDomain(name: string, exchange?: string, symbol?: string): string | null {
  const cleaned = name
    .toLowerCase()
    .replace(/\b(limited|ltd|inc\.?|corp\.?|corporation|plc|company|co\.?|holdings|services|group|technologies|technology)\b/gi, "")
    .replace(/[^a-z0-9 ]/gi, " ")
    .replace(/\s+/g, " ")
    .trim();

  const upperExchange = (exchange || "").toUpperCase();
  const isIndia = upperExchange === "NSE" || upperExchange === "BSE";

  const nameTokens = cleaned.split(" ").filter(Boolean);
  const symbolToken = symbol ? getCleanSymbolToken(symbol) : "";
  const token = pickBestDomainToken(
    [symbolToken, ...nameTokens],
    isIndia
  ) ?? pickBestDomainToken(nameTokens, isIndia);

  if (!token) return null;

  const tld = isIndia ? ".co.in" : ".com";
  return `${token}${tld}`;
}

export function inferDomainWithConfidence(input: { symbol: string; name: string; exchange?: string }): DomainInferenceResult {
  const symbol = input.symbol.trim().toUpperCase();
  const mapped = NSE_SYMBOLS[symbol];
  if (mapped) {
    return { domain: mapped, confidence: 0.98, reason: "nse_symbol_map" };
  }

  const loweredName = input.name.toLowerCase();
  for (const entry of KEYWORDS) {
    if (loweredName.includes(entry.keyword)) {
      return { domain: entry.domain, confidence: entry.confidence, reason: `keyword:${entry.keyword}` };
    }
  }

  const candidate = fallbackDomain(input.name, input.exchange, symbol);
  if (!candidate) {
    return { domain: null, confidence: 0, reason: "no_candidate" };
  }

  let confidence = 0.35;
  if (loweredName.includes("bank")) confidence += 0.2;
  if (loweredName.includes("ltd") || loweredName.includes("limited")) confidence += 0.1;
  if ((input.exchange || "").toUpperCase() === "NSE" || (input.exchange || "").toUpperCase() === "BSE") confidence += 0.1;

  return {
    domain: candidate,
    confidence: Math.min(0.95, confidence),
    reason: "name_heuristic",
  };
}
