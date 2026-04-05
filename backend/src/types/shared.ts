export type ScenarioId = string;

export type Currency = "USD" | "INR" | "EUR" | "GBP" | "JPY";

export interface CandleData {
  time: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface Holding {
  symbol: string;
  quantity: number;
  avgPrice: number;
}

export interface TradeResponse {
  id: string;
  symbol: string;
  type: "BUY" | "SELL";
  price: number;
  quantity: number;
  total: number;
  date: string;
  realizedPnl: number;
  timestamp: number;
}
