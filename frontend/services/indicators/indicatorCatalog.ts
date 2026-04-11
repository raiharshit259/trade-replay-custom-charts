/**
 * Comprehensive indicator catalog data for the Indicators Modal.
 *
 * Maps the built-in indicators from @tradereplay/charts into
 * TradingView-style categories for the sidebar navigation.
 */

// ─── Types ──────────────────────────────────────────────────────────────────

export type IndicatorCategory =
  | 'technicals'
  | 'financials'
  | 'community';

export type TechnicalSubcategory =
  | 'trend'
  | 'oscillators'
  | 'volatility'
  | 'volume'
  | 'movingAverages'
  | 'billWilliams'
  | 'breadth'
  | 'momentum'
  | 'statistical'
  | 'candlePatterns';

export type FinancialSubcategory =
  | 'incomeStatement'
  | 'balanceSheet'
  | 'cashFlow'
  | 'statistics'
  | 'dividends';

export type CommunitySubcategory =
  | 'editorsPicks'
  | 'topScripts'
  | 'trending';

export interface CatalogEntry {
  id: string;
  name: string;
  /** Whether this id matches a built-in indicator in the registry */
  builtin: boolean;
  description?: string;
}

export interface TechnicalSection {
  subcategory: TechnicalSubcategory;
  label: string;
  items: CatalogEntry[];
}

export interface FinancialSection {
  subcategory: FinancialSubcategory;
  label: string;
  items: CatalogEntry[];
}

export interface CommunitySection {
  subcategory: CommunitySubcategory;
  label: string;
  items: CatalogEntry[];
}

// ─── Technicals ─────────────────────────────────────────────────────────────

export const technicalSections: TechnicalSection[] = [
  {
    subcategory: 'movingAverages',
    label: 'Moving Averages',
    items: [
      { id: 'sma', name: 'Simple Moving Average (SMA)', builtin: true },
      { id: 'ema', name: 'Exponential Moving Average (EMA)', builtin: true },
      { id: 'wma', name: 'Weighted Moving Average (WMA)', builtin: true },
      { id: 'hma', name: 'Hull Moving Average (HMA)', builtin: true },
      { id: 'dema', name: 'Double EMA (DEMA)', builtin: true },
      { id: 'tema', name: 'Triple EMA (TEMA)', builtin: true },
      { id: 'zlema', name: 'Zero-Lag EMA (ZLEMA)', builtin: true },
      { id: 'kama', name: 'Kaufman Adaptive MA (KAMA)', builtin: true },
      { id: 'alma', name: 'Arnaud Legoux MA (ALMA)', builtin: true },
      { id: 'lsma', name: 'Least Squares MA (LSMA)', builtin: true },
      { id: 'trima', name: 'Triangular MA (TRIMA)', builtin: true },
      { id: 'smma', name: 'Smoothed MA (SMMA)', builtin: true },
      { id: 'vwap', name: 'Volume Weighted Average Price (VWAP)', builtin: true },
    ],
  },
  {
    subcategory: 'trend',
    label: 'Trend',
    items: [
      { id: 'macd', name: 'MACD', builtin: true },
      { id: 'adx', name: 'Average Directional Index (ADX)', builtin: true },
      { id: 'dx', name: 'Directional Movement Index (DX)', builtin: true },
      { id: 'aroon', name: 'Aroon', builtin: true },
      { id: 'aroonOscillator', name: 'Aroon Oscillator', builtin: true },
      { id: 'supertrend', name: 'Supertrend', builtin: true },
      { id: 'psar', name: 'Parabolic SAR', builtin: true },
      { id: 'ichimoku', name: 'Ichimoku Cloud', builtin: true },
      { id: 'vortex', name: 'Vortex Indicator', builtin: true },
      { id: 'trix', name: 'TRIX', builtin: true },
      { id: 'dpo', name: 'Detrended Price Oscillator', builtin: true },
      { id: 'coppockCurve', name: 'Coppock Curve', builtin: true },
      { id: 'elderRay', name: 'Elder Ray Index', builtin: true },
      { id: 'trendStrength', name: 'Trend Strength', builtin: true },
      { id: 'linearRegSlope', name: 'Linear Regression Slope', builtin: true },
      { id: 'linearRegIntercept', name: 'Linear Regression Intercept', builtin: true },
      { id: 'linearRegAngle', name: 'Linear Regression Angle', builtin: true },
      { id: 'choppiness', name: 'Choppiness Index', builtin: true },
    ],
  },
  {
    subcategory: 'oscillators',
    label: 'Oscillators',
    items: [
      { id: 'rsi', name: 'Relative Strength Index (RSI)', builtin: true },
      { id: 'stochastic', name: 'Stochastic', builtin: true },
      { id: 'stochRsi', name: 'Stochastic RSI', builtin: true },
      { id: 'cci', name: 'Commodity Channel Index (CCI)', builtin: true },
      { id: 'williamsR', name: 'Williams %R', builtin: true },
      { id: 'roc', name: 'Rate of Change (ROC)', builtin: true },
      { id: 'momentum', name: 'Momentum', builtin: true },
      { id: 'ppo', name: 'Percentage Price Oscillator (PPO)', builtin: true },
      { id: 'pvo', name: 'Percentage Volume Oscillator (PVO)', builtin: true },
      { id: 'tsi', name: 'True Strength Index (TSI)', builtin: true },
      { id: 'crsi', name: 'Connors RSI (CRSI)', builtin: true },
      { id: 'cmo', name: 'Chande Momentum Oscillator (CMO)', builtin: true },
      { id: 'fisher', name: 'Fisher Transform', builtin: true },
      { id: 'kdj', name: 'KDJ', builtin: true },
      { id: 'apo', name: 'Absolute Price Oscillator (APO)', builtin: true },
      { id: 'smi', name: 'Stochastic Momentum Index (SMI)', builtin: true },
      { id: 'rvi', name: 'Relative Vigor Index (RVI)', builtin: true },
      { id: 'ultimate', name: 'Ultimate Oscillator', builtin: true },
    ],
  },
  {
    subcategory: 'volatility',
    label: 'Volatility',
    items: [
      { id: 'bbands', name: 'Bollinger Bands', builtin: true },
      { id: 'atr', name: 'Average True Range (ATR)', builtin: true },
      { id: 'donchian', name: 'Donchian Channels', builtin: true },
      { id: 'keltner', name: 'Keltner Channels', builtin: true },
      { id: 'bollingerPercentB', name: 'Bollinger %B', builtin: true },
      { id: 'bollingerBandwidth', name: 'Bollinger Bandwidth', builtin: true },
      { id: 'chaikinVolatility', name: 'Chaikin Volatility', builtin: true },
      { id: 'stddev', name: 'Standard Deviation', builtin: true },
      { id: 'variance', name: 'Variance', builtin: true },
      { id: 'normalizedAtr', name: 'Normalized ATR', builtin: true },
      { id: 'priceChannelWidth', name: 'Price Channel Width', builtin: true },
      { id: 'priceChannelMid', name: 'Price Channel Midline', builtin: true },
      { id: 'volatilityRatio', name: 'Volatility Ratio', builtin: true },
      { id: 'volatilityEma', name: 'Volatility EMA', builtin: true },
      { id: 'ulcerIndex', name: 'Ulcer Index', builtin: true },
      { id: 'massIndex', name: 'Mass Index', builtin: true },
      { id: 'trueRangePercent', name: 'True Range %', builtin: true },
    ],
  },
  {
    subcategory: 'volume',
    label: 'Volume',
    items: [
      { id: 'obv', name: 'On Balance Volume (OBV)', builtin: true },
      { id: 'mfi', name: 'Money Flow Index (MFI)', builtin: true },
      { id: 'cmf', name: 'Chaikin Money Flow (CMF)', builtin: true },
      { id: 'chaikinOsc', name: 'Chaikin Oscillator', builtin: true },
      { id: 'adl', name: 'Accumulation/Distribution Line', builtin: true },
      { id: 'forceIndex', name: 'Force Index', builtin: true },
      { id: 'eom', name: 'Ease of Movement', builtin: true },
      { id: 'nvi', name: 'Negative Volume Index', builtin: true },
      { id: 'pvi', name: 'Positive Volume Index', builtin: true },
      { id: 'vpt', name: 'Volume Price Trend', builtin: true },
      { id: 'relativeVolume', name: 'Relative Volume', builtin: true },
      { id: 'balanceOfPower', name: 'Balance of Power', builtin: true },
      { id: 'emvOsc', name: 'EMV Oscillator', builtin: true },
      { id: 'volumeOscillator', name: 'Volume Oscillator', builtin: true },
      { id: 'volumeZScore', name: 'Volume Z-Score', builtin: true },
      { id: 'volumeSmaRatio', name: 'Volume SMA Ratio', builtin: true },
      { id: 'cumulativeVolumeDelta', name: 'Cumulative Volume Delta', builtin: true },
    ],
  },
  {
    subcategory: 'momentum',
    label: 'Momentum',
    items: [
      { id: 'awesome', name: 'Awesome Oscillator', builtin: true },
      { id: 'qstick', name: 'QStick', builtin: true },
      { id: 'breakoutStrength', name: 'Breakout Strength', builtin: true },
      { id: 'percentileRank', name: 'Percentile Rank', builtin: true },
      { id: 'closeLocationValue', name: 'Close Location Value', builtin: true },
    ],
  },
  {
    subcategory: 'statistical',
    label: 'Statistical',
    items: [
      { id: 'medianPrice', name: 'Median Price', builtin: true },
      { id: 'typicalPrice', name: 'Typical Price', builtin: true },
      { id: 'weightedClose', name: 'Weighted Close', builtin: true },
      { id: 'rollingHigh', name: 'Rolling High', builtin: true },
      { id: 'rollingLow', name: 'Rolling Low', builtin: true },
      { id: 'rollingReturn', name: 'Rolling Return', builtin: true },
      { id: 'logReturn', name: 'Log Return', builtin: true },
      { id: 'rangeSmaRatio', name: 'Range SMA Ratio', builtin: true },
      { id: 'candleBody', name: 'Candle Body', builtin: true },
      { id: 'candleBodyPercent', name: 'Candle Body %', builtin: true },
      { id: 'upperWick', name: 'Upper Wick', builtin: true },
      { id: 'lowerWick', name: 'Lower Wick', builtin: true },
    ],
  },
  {
    subcategory: 'billWilliams',
    label: 'Bill Williams',
    items: [
      { id: 'awesome', name: 'Awesome Oscillator', builtin: true },
      { id: 'fractal', name: 'Fractals', builtin: true, description: 'Williams Fractals — highlights swing highs/lows' },
      { id: 'gator', name: 'Gator Oscillator', builtin: true, description: 'Measures convergence/divergence of Alligator lines' },
      { id: 'alligator', name: 'Williams Alligator', builtin: true, description: 'Smoothed moving averages: jaw, teeth, lips' },
      { id: 'mfi_williams', name: 'Market Facilitation Index', builtin: true, description: 'Measures bar efficiency (range / volume)' },
    ],
  },
  {
    subcategory: 'breadth',
    label: 'Breadth Indicators',
    items: [
      { id: 'advDecline', name: 'Advance/Decline Line', builtin: true, description: 'Tracks advancing vs declining issues' },
      { id: 'mcclellan', name: 'McClellan Oscillator', builtin: true, description: 'Breadth momentum oscillator' },
      { id: 'mcclellanSum', name: 'McClellan Summation', builtin: true, description: 'Cumulative McClellan' },
      { id: 'newHighLow', name: 'New High / New Low', builtin: true, description: 'Tracks new 52-week highs vs lows' },
      { id: 'upDownVolume', name: 'Up/Down Volume', builtin: true, description: 'Volume in advancing vs declining issues' },
    ],
  },
  {
    subcategory: 'candlePatterns',
    label: 'Candlestick Patterns',
    items: [
      { id: 'cp_doji', name: 'Doji', builtin: true, description: 'Indecision candle' },
      { id: 'cp_hammer', name: 'Hammer', builtin: true, description: 'Bullish reversal at bottom' },
      { id: 'cp_shootingStar', name: 'Shooting Star', builtin: true, description: 'Bearish reversal at top' },
      { id: 'cp_engulfing', name: 'Engulfing', builtin: true, description: 'Bullish or bearish engulfing' },
      { id: 'cp_morningStar', name: 'Morning Star', builtin: true, description: 'Bullish 3-candle reversal' },
      { id: 'cp_eveningStar', name: 'Evening Star', builtin: true, description: 'Bearish 3-candle reversal' },
      { id: 'cp_harami', name: 'Harami', builtin: true, description: 'Inside bar reversal' },
      { id: 'cp_threeWhiteSoldiers', name: 'Three White Soldiers', builtin: true, description: 'Strong bullish continuation' },
      { id: 'cp_threeBlackCrows', name: 'Three Black Crows', builtin: true, description: 'Strong bearish continuation' },
      { id: 'cp_spinningTop', name: 'Spinning Top', builtin: true, description: 'Indecision candle' },
      { id: 'cp_marubozu', name: 'Marubozu', builtin: true, description: 'Full-body candle' },
      { id: 'cp_piercingLine', name: 'Piercing Line', builtin: true, description: 'Bullish reversal' },
      { id: 'cp_darkCloud', name: 'Dark Cloud Cover', builtin: true, description: 'Bearish reversal' },
      { id: 'cp_tweezer', name: 'Tweezer Top/Bottom', builtin: true, description: 'Same high or low on 2 candles' },
    ],
  },
];

// ─── Financials (placeholders — these don't compute, shown for TradingView parity) ─

export const financialSections: FinancialSection[] = [
  {
    subcategory: 'incomeStatement',
    label: 'Income Statement',
    items: [
      { id: 'fin_totalRevenue', name: 'Total Revenue', builtin: true },
      { id: 'fin_grossProfit', name: 'Gross Profit', builtin: true },
      { id: 'fin_operatingIncome', name: 'Operating Income', builtin: true },
      { id: 'fin_netIncome', name: 'Net Income', builtin: true },
      { id: 'fin_ebitda', name: 'EBITDA', builtin: true },
      { id: 'fin_eps', name: 'Earnings Per Share (EPS)', builtin: true },
      { id: 'fin_costOfRevenue', name: 'Cost of Revenue', builtin: true },
      { id: 'fin_operatingExpenses', name: 'Operating Expenses', builtin: true },
      { id: 'fin_researchDev', name: 'Research & Development', builtin: true },
      { id: 'fin_interestExpense', name: 'Interest Expense', builtin: true },
    ],
  },
  {
    subcategory: 'balanceSheet',
    label: 'Balance Sheet',
    items: [
      { id: 'fin_totalAssets', name: 'Total Assets', builtin: true },
      { id: 'fin_totalLiabilities', name: 'Total Liabilities', builtin: true },
      { id: 'fin_totalEquity', name: "Total Shareholders' Equity", builtin: true },
      { id: 'fin_currentAssets', name: 'Current Assets', builtin: true },
      { id: 'fin_currentLiabilities', name: 'Current Liabilities', builtin: true },
      { id: 'fin_longTermDebt', name: 'Long-Term Debt', builtin: true },
      { id: 'fin_cashEquivalents', name: 'Cash & Equivalents', builtin: true },
      { id: 'fin_goodwill', name: 'Goodwill', builtin: true },
      { id: 'fin_inventory', name: 'Inventory', builtin: true },
      { id: 'fin_accountsReceivable', name: 'Accounts Receivable', builtin: true },
    ],
  },
  {
    subcategory: 'cashFlow',
    label: 'Cash Flow',
    items: [
      { id: 'fin_operatingCashFlow', name: 'Operating Cash Flow', builtin: true },
      { id: 'fin_capex', name: 'Capital Expenditures', builtin: true },
      { id: 'fin_freeCashFlow', name: 'Free Cash Flow', builtin: true },
      { id: 'fin_financingCashFlow', name: 'Financing Cash Flow', builtin: true },
      { id: 'fin_investingCashFlow', name: 'Investing Cash Flow', builtin: true },
      { id: 'fin_dividendsPaid', name: 'Dividends Paid', builtin: true },
      { id: 'fin_shareRepurchase', name: 'Share Repurchase', builtin: true },
    ],
  },
  {
    subcategory: 'statistics',
    label: 'Statistics',
    items: [
      { id: 'fin_peRatio', name: 'P/E Ratio', builtin: true },
      { id: 'fin_pbRatio', name: 'P/B Ratio', builtin: true },
      { id: 'fin_psRatio', name: 'P/S Ratio', builtin: true },
      { id: 'fin_evEbitda', name: 'EV/EBITDA', builtin: true },
      { id: 'fin_debtEquity', name: 'Debt/Equity', builtin: true },
      { id: 'fin_currentRatio', name: 'Current Ratio', builtin: true },
      { id: 'fin_quickRatio', name: 'Quick Ratio', builtin: true },
      { id: 'fin_roe', name: 'Return on Equity (ROE)', builtin: true },
      { id: 'fin_roa', name: 'Return on Assets (ROA)', builtin: true },
      { id: 'fin_grossMargin', name: 'Gross Margin', builtin: true },
      { id: 'fin_operatingMargin', name: 'Operating Margin', builtin: true },
      { id: 'fin_netMargin', name: 'Net Margin', builtin: true },
      { id: 'fin_beta', name: 'Beta', builtin: true },
      { id: 'fin_marketCap', name: 'Market Cap', builtin: true },
    ],
  },
  {
    subcategory: 'dividends',
    label: 'Dividends',
    items: [
      { id: 'fin_dividendYield', name: 'Dividend Yield', builtin: true },
      { id: 'fin_dividendPerShare', name: 'Dividend Per Share', builtin: true },
      { id: 'fin_payoutRatio', name: 'Payout Ratio', builtin: true },
      { id: 'fin_exDividendDate', name: 'Ex-Dividend Date', builtin: true },
    ],
  },
];

// ─── Community (placeholder scripts for TradingView parity) ────────────────

export const communitySections: CommunitySection[] = [
  {
    subcategory: 'editorsPicks',
    label: "Editors' Picks",
    items: [
      { id: 'cm_tpHeatmap', name: 'TP Heatmap', builtin: true, description: 'Take-profit target heatmap overlay' },
      { id: 'cm_smartMoney', name: 'Smart Money Concepts', builtin: true, description: 'Order blocks, FVG, BOS' },
      { id: 'cm_vwapBands', name: 'VWAP Bands', builtin: true, description: 'Standard deviation bands around VWAP' },
      { id: 'cm_supplyDemand', name: 'Supply & Demand Zones', builtin: true, description: 'Auto-detect supply/demand areas' },
      { id: 'cm_lutBot', name: 'LuxAlgo Smart Money', builtin: true, description: 'Community smart-money suite' },
      { id: 'cm_trendlines', name: 'Auto Trendlines', builtin: true, description: 'Algorithmically drawn trendlines' },
    ],
  },
  {
    subcategory: 'topScripts',
    label: 'Top Scripts',
    items: [
      { id: 'cm_halfTrend', name: 'HalfTrend', builtin: true, description: 'Trend-following signals' },
      { id: 'cm_superTrendPro', name: 'Supertrend Pro', builtin: true, description: 'Enhanced supertrend' },
      { id: 'cm_bbStoch', name: 'BB + Stoch Strategy', builtin: true, description: 'Combined BB and Stochastic' },
      { id: 'cm_volumeProfile', name: 'Volume Profile', builtin: true, description: 'Horizontal volume distribution' },
      { id: 'cm_rangeFilter', name: 'Range Filter', builtin: true, description: 'Volatility-based trend filter' },
      { id: 'cm_pivotBoss', name: 'Pivot Boss', builtin: true, description: 'Advanced pivot point system' },
    ],
  },
  {
    subcategory: 'trending',
    label: 'Trending',
    items: [
      { id: 'cm_aiMA', name: 'AI Moving Average', builtin: true, description: 'ML-based adaptive MA' },
      { id: 'cm_liquidation', name: 'Liquidation Levels', builtin: true, description: 'Estimated liquidation heatmap' },
      { id: 'cm_orderBlock', name: 'Order Block Finder', builtin: true, description: 'Institutional order flow' },
      { id: 'cm_divergence', name: 'RSI Divergence Detector', builtin: true, description: 'Auto bullish/bearish divergence' },
      { id: 'cm_fairValue', name: 'Fair Value Gaps', builtin: true, description: 'Imbalance / FVG highlighter' },
      { id: 'cm_sessions', name: 'Market Sessions', builtin: true, description: 'London, NY, Tokyo session boxes' },
    ],
  },
];

// ─── Sidebar structure ──────────────────────────────────────────────────────

export type SidebarSection = 'personal' | 'technicals' | 'financials' | 'community';

export interface SidebarItem {
  id: string;
  label: string;
  section: SidebarSection;
}

export const sidebarItems: SidebarItem[] = [
  { id: 'myScripts', label: 'My scripts', section: 'personal' },
  { id: 'inviteOnly', label: 'Invite-only', section: 'personal' },
  { id: 'purchased', label: 'Purchased', section: 'personal' },
  { id: 'technicals', label: 'Technicals', section: 'technicals' },
  { id: 'financials', label: 'Fundamentals', section: 'financials' },
  { id: 'editorsPicks', label: "Editors' picks", section: 'community' },
  { id: 'topScripts', label: 'Top', section: 'community' },
  { id: 'trending', label: 'Trending', section: 'community' },
  { id: 'store', label: 'Store', section: 'community' },
];

// ─── Technicals sub-tabs ────────────────────────────────────────────────────

export type TechnicalsTab = 'indicators' | 'strategies' | 'profiles' | 'patterns';

export interface TechnicalsTabDef {
  id: TechnicalsTab;
  label: string;
}

/** Only the subcategories that map into each tab */
const techTabSubcategories: Record<TechnicalsTab, TechnicalSubcategory[]> = {
  indicators: ['movingAverages', 'trend', 'oscillators', 'volatility', 'volume', 'momentum', 'statistical', 'billWilliams', 'breadth'],
  strategies: [],
  profiles: [],
  patterns: ['candlePatterns'],
};

export const technicalsTabs: TechnicalsTabDef[] = [
  { id: 'indicators', label: 'Indicators' },
  { id: 'strategies', label: 'Strategies' },
  { id: 'profiles', label: 'Profiles' },
  { id: 'patterns', label: 'Patterns' },
];

export function getTechSectionsForTab(tab: TechnicalsTab): TechnicalSection[] {
  const subcats = techTabSubcategories[tab];
  if (subcats.length === 0) return [];
  return technicalSections.filter((s) => subcats.includes(s.subcategory));
}

// ─── Fundamentals sub-tabs ──────────────────────────────────────────────────

export type FundamentalsTab = 'financialsTab' | 'network' | 'ownership' | 'social';

export interface FundamentalsTabDef {
  id: FundamentalsTab;
  label: string;
  items: CatalogEntry[];
}

export const fundamentalsTabs: FundamentalsTabDef[] = [
  {
    id: 'financialsTab',
    label: 'Financials',
    items: [
      { id: 'fund_rvtRatio', name: 'RVT ratio, 90 days', builtin: true },
      { id: 'fund_realizedMarketCap', name: 'Realized market cap', builtin: true },
      { id: 'fund_supplyEqualityRatio', name: 'Supply equality ratio', builtin: true },
      { id: 'fund_1yrActiveSupply', name: '1 year active supply %', builtin: true },
    ],
  },
  {
    id: 'network',
    label: 'Network',
    items: [
      { id: 'fund_addressesWithBalance', name: 'Addresses with balance', builtin: true },
      { id: 'fund_newFundedAddresses', name: 'New funded addresses', builtin: true },
      { id: 'fund_activeAddresses', name: 'Active addresses', builtin: true },
      { id: 'fund_txVolumeUsd', name: 'Transaction volume in USD', builtin: true },
      { id: 'fund_txVolume', name: 'Transaction volume', builtin: true },
      { id: 'fund_avgTxVolumeUsd', name: 'Average transaction volume in USD', builtin: true },
      { id: 'fund_avgTxVolume', name: 'Average transaction volume', builtin: true },
      { id: 'fund_txCount', name: 'Transaction count', builtin: true },
      { id: 'fund_largeTxCount', name: 'Large transaction count', builtin: true },
      { id: 'fund_largeTxVolumeUsd', name: 'Large transaction volume in USD', builtin: true },
      { id: 'fund_largeTxVolume', name: 'Large transaction volume', builtin: true },
      { id: 'fund_totalValueLocked', name: 'Total value locked', builtin: true },
      { id: 'fund_txFeesUsd', name: 'Transaction fees in USD', builtin: true },
      { id: 'fund_blockCount', name: 'Block count', builtin: true },
      { id: 'fund_blockSizeMb', name: 'Block size in MB', builtin: true },
      { id: 'fund_hashRate', name: 'Hash rate', builtin: true },
      { id: 'fund_minerRevenueUsd', name: 'Miner revenue in USD', builtin: true },
      { id: 'fund_avgTxFeeUsd', name: 'Average transaction fee in USD', builtin: true },
      { id: 'fund_txPerBlock', name: 'Transaction per block', builtin: true },
      { id: 'fund_difficulty', name: 'Difficulty', builtin: true },
      { id: 'fund_mempoolSize', name: 'Mempool size', builtin: true },
      { id: 'fund_mempoolTxCount', name: 'Mempool transaction count', builtin: true },
      { id: 'fund_issuance', name: 'Issuance', builtin: true },
    ],
  },
  {
    id: 'ownership',
    label: 'Ownership',
    items: [
      { id: 'fund_heldTokensUsd', name: 'Held tokens in addresses ≥ X (USD)', builtin: true },
      { id: 'fund_heldTokens', name: 'Held tokens in addresses ≥ X (tokens)', builtin: true },
      { id: 'fund_heldTokensSupply', name: 'Held tokens in addresses ≥ X (% of supply)', builtin: true },
      { id: 'fund_addrBalanceUsd', name: 'Addresses with balance ≥ X (USD)', builtin: true },
      { id: 'fund_addrBalanceSupply', name: 'Addresses with balance ≥ X (% of supply)', builtin: true },
      { id: 'fund_etfBalancesUsd', name: 'US spot crypto ETF balances in USD', builtin: true },
      { id: 'fund_etfBalances', name: 'US spot crypto ETF balances', builtin: true },
      { id: 'fund_etfFlowsUsd', name: 'US spot crypto ETF flows in USD', builtin: true },
      { id: 'fund_etfFlows', name: 'US spot crypto ETF flows', builtin: true },
    ],
  },
  {
    id: 'social',
    label: 'Social',
    items: [
      { id: 'fund_altRank', name: 'AltRank', builtin: true },
      { id: 'fund_galaxyScore', name: 'Galaxy score', builtin: true },
      { id: 'fund_socialDominance', name: 'Social dominance %', builtin: true },
      { id: 'fund_sentiment', name: 'Sentiment %', builtin: true },
      { id: 'fund_interactions', name: 'Interactions', builtin: true },
      { id: 'fund_activeContributors', name: 'Active contributors', builtin: true },
      { id: 'fund_createdContributors', name: 'Created contributors', builtin: true },
      { id: 'fund_activePosts', name: 'Active posts', builtin: true },
      { id: 'fund_createdPosts', name: 'Created posts', builtin: true },
    ],
  },
];

// ─── Flat lookup ────────────────────────────────────────────────────────────

const _allCatalogEntries: CatalogEntry[] = [
  ...technicalSections.flatMap((s) => s.items),
  ...financialSections.flatMap((s) => s.items),
  ...fundamentalsTabs.flatMap((t) => t.items),
  ...communitySections.flatMap((s) => s.items),
];

// Deduplicate by id (awesome appears in both oscillators & momentum)
const _seen = new Set<string>();
export const allCatalogEntries: CatalogEntry[] = [];
for (const entry of _allCatalogEntries) {
  if (!_seen.has(entry.id)) {
    _seen.add(entry.id);
    allCatalogEntries.push(entry);
  }
}

export const catalogById = new Map(allCatalogEntries.map((e) => [e.id, e]));
