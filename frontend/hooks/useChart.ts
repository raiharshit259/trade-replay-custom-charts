import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { Time, UTCTimestamp } from 'lightweight-charts';
import type { CandleData } from '@/data/stockData';
import { createTradingChart, resizeChartSurface } from '@/services/chart/chartEngine';
import {
  activeSeriesForType,
  applySeriesData,
  applySeriesVisibility,
  createChartSeries,
  type ChartSeriesMap,
} from '@/services/chart/seriesManager';
import { transformChartData, type ChartType } from '@/services/chart/dataTransforms';
import { nearestCandleIndex, toTimestampFromTime } from '@/services/tools/toolEngine';

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function useChart(data: CandleData[], visibleCount: number, chartType: ChartType) {
  const chartContainerRef = useRef<HTMLDivElement | null>(null);
  const overlayRef = useRef<HTMLCanvasElement | null>(null);
  const chartRef = useRef<ReturnType<typeof createTradingChart> | null>(null);
  const seriesMapRef = useRef<ChartSeriesMap | null>(null);
  const resizeDebounceRef = useRef<number | null>(null);
  const [ready, setReady] = useState(false);

  const transformedData = useMemo(() => transformChartData(data, visibleCount), [data, visibleCount]);

  const getActiveSeries = useCallback(() => {
    const map = seriesMapRef.current;
    if (!map) return null;
    return activeSeriesForType(map, chartType);
  }, [chartType]);

  useEffect(() => {
    const container = chartContainerRef.current;
    const overlay = overlayRef.current;
    if (!container || !overlay) return;

    const chart = createTradingChart(container);
    const seriesMap = createChartSeries(chart);
    chartRef.current = chart;
    seriesMapRef.current = seriesMap;

    resizeChartSurface(chart, container, overlay);

    const observer = new ResizeObserver(() => {
      if (resizeDebounceRef.current != null) {
        window.clearTimeout(resizeDebounceRef.current);
      }
      resizeDebounceRef.current = window.setTimeout(() => {
        if (!chartRef.current || !chartContainerRef.current || !overlayRef.current) return;
        resizeChartSurface(chartRef.current, chartContainerRef.current, overlayRef.current);
      }, 90);
    });

    observer.observe(container);
    setReady(true);

    return () => {
      if (resizeDebounceRef.current != null) {
        window.clearTimeout(resizeDebounceRef.current);
      }
      observer.disconnect();
      chart.remove();
      chartRef.current = null;
      seriesMapRef.current = null;
      setReady(false);
    };
  }, []);

  useEffect(() => {
    const map = seriesMapRef.current;
    if (!map) return;
    applySeriesData(map, transformedData);
    chartRef.current?.timeScale().fitContent();
  }, [transformedData]);

  useEffect(() => {
    const map = seriesMapRef.current;
    if (!map) return;
    applySeriesVisibility(map, chartType);
  }, [chartType]);

  const pointerToDataPoint = useCallback((clientX: number, clientY: number, magnetMode: boolean) => {
    const overlay = overlayRef.current;
    const chart = chartRef.current;
    const series = getActiveSeries();
    if (!overlay || !chart || !series) return null;

    const rect = overlay.getBoundingClientRect();
    const x = clamp(clientX - rect.left, 0, rect.width);
    const y = clamp(clientY - rect.top, 0, rect.height);

    const rawTime = chart.timeScale().coordinateToTime(x);
    const rawPrice = series.coordinateToPrice(y);

    const time = toTimestampFromTime(rawTime);
    if (time == null || rawPrice == null || Number.isNaN(rawPrice)) return null;

    if (!magnetMode || !transformedData.times.length) {
      return { time, price: rawPrice };
    }

    const idx = nearestCandleIndex(transformedData.times, time);
    if (idx < 0) return { time, price: rawPrice };
    const candle = transformedData.ohlcRows[idx];

    const prices = [candle.open, candle.high, candle.low, candle.close];
    let snapped = prices[0];
    for (let i = 1; i < prices.length; i += 1) {
      if (Math.abs(prices[i] - rawPrice) < Math.abs(snapped - rawPrice)) snapped = prices[i];
    }

    return { time: candle.time, price: snapped };
  }, [getActiveSeries, transformedData.ohlcRows, transformedData.times]);

  const zoomToRange = useCallback((from: UTCTimestamp, to: UTCTimestamp) => {
    chartRef.current?.timeScale().setVisibleRange({ from: Math.min(from, to) as Time, to: Math.max(from, to) as Time });
  }, []);

  return {
    ready,
    chartContainerRef,
    overlayRef,
    chartRef,
    getActiveSeries,
    transformedData,
    pointerToDataPoint,
    zoomToRange,
  };
}
