import { env } from "../config/env";
import { CandleData } from "../types/shared";
import { AlphaDailyResponse } from "../types/service";

export async function getAlphaVantageCandles(
  symbol: string,
  startDate?: string,
  endDate?: string,
): Promise<CandleData[] | null> {
  if (!env.ALPHA_VANTAGE_KEY) {
    return null;
  }

  const url = new URL("https://www.alphavantage.co/query");
  url.searchParams.set("function", "TIME_SERIES_DAILY");
  url.searchParams.set("symbol", symbol);
  url.searchParams.set("outputsize", "full");
  url.searchParams.set("apikey", env.ALPHA_VANTAGE_KEY);

  const response = await fetch(url.toString(), {
    method: "GET",
    headers: { Accept: "application/json" },
  });

  if (!response.ok) {
    return null;
  }

  const payload = (await response.json()) as AlphaDailyResponse;
  if (payload.Note || payload.Information || payload["Error Message"] || !payload["Time Series (Daily)"]) {
    return null;
  }

  const candles = Object.entries(payload["Time Series (Daily)"])
    .map(([time, row]) => ({
      time,
      open: Number(row["1. open"]),
      high: Number(row["2. high"]),
      low: Number(row["3. low"]),
      close: Number(row["4. close"]),
      volume: Number(row["5. volume"]),
    }))
    .filter((candle) => {
      if (startDate && candle.time < startDate) return false;
      if (endDate && candle.time > endDate) return false;
      return true;
    })
    .sort((a, b) => (a.time < b.time ? -1 : 1));

  return candles;
}
