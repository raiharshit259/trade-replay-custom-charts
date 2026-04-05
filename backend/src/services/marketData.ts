import { getAlphaVantageCandles } from "./alphaVantage";
import { getFallbackCandles } from "./fallbackData";
import { CandleData, ScenarioId } from "../types/shared";

export async function loadCandlesForSimulation(input: {
  scenarioId: ScenarioId;
  symbol: string;
  startDate?: string;
  endDate?: string;
}): Promise<{ candles: CandleData[]; source: "alpha-vantage" | "fallback" }> {
  try {
    const alpha = await getAlphaVantageCandles(input.symbol, input.startDate, input.endDate);
    if (alpha && alpha.length > 0) {
      return { candles: alpha, source: "alpha-vantage" };
    }
  } catch (_error) {
    // Explicitly fall back to local pre-seeded data when API fails.
  }

  return {
    candles: getFallbackCandles(input.scenarioId, input.symbol, input.startDate, input.endDate),
    source: "fallback",
  };
}
