const FOREX_ICON = "https://logo.clearbit.com/xe.com";

export const STATIC_ICON_MAP: Record<string, string> = {
  DAX: "https://logo.clearbit.com/deutsche-boerse.com",
  CAC40: "https://logo.clearbit.com/euronext.com",
  NDX: "https://logo.clearbit.com/nasdaq.com",
  DJI: "https://logo.clearbit.com/dowjones.com",
  HANGSENG: "https://logo.clearbit.com/hkex.com.hk",
  EURUSD: FOREX_ICON,
  USDJPY: FOREX_ICON,
  GBPUSD: FOREX_ICON,
  USDCHF: FOREX_ICON,
  AUDUSD: FOREX_ICON,
  USDCAD: FOREX_ICON,
  NZDUSD: FOREX_ICON,
  EURJPY: FOREX_ICON,
  USDINR: FOREX_ICON,
  EURINR: FOREX_ICON,
  GBPINR: FOREX_ICON,
};

export function resolveStaticIcon(symbol?: string): string | undefined {
  if (!symbol) return undefined;
  return STATIC_ICON_MAP[symbol.trim().toUpperCase()];
}
