import { Currency, ScenarioId } from "./shared";

export interface UserEntity {
  id: string;
  email: string;
  name: string;
  googleId?: string;
}

export interface PortfolioEntity {
  userId: string;
  balance: number;
  currency: Currency;
  holdings: Array<{ symbol: string; quantity: number; avgPrice: number }>;
}

export interface TradeEntity {
  userId: string;
  symbol: string;
  type: "BUY" | "SELL";
  price: number;
  quantity: number;
  total: number;
  date: string;
  realizedPnl: number;
}

export interface SimulationSessionEntity {
  userId: string;
  scenarioId: ScenarioId;
  symbol: string;
  currentIndex: number;
  totalCandles: number;
  isPlaying: boolean;
  playSpeed: number;
  startDate?: string;
  endDate?: string;
}
