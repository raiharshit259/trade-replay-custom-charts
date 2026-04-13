import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { UTCTimestamp } from '@tradereplay/charts';
import type { CandleData } from '@/data/stockData';
import { createTradingChart, resizeChartSurface } from '@/services/chart/chartEngine';
import {
  activeSeriesForType,
  applySeriesData,
  applySeriesVisibility,
  createChartSeries,
  updateSeriesData,
  type ChartSeriesMap,
} from '@/services/chart/seriesManager';
import { transformChartData, type ChartType } from '@/services/chart/dataTransforms';
import { nearestCandleIndex, toTimestampFromTime } from '@/services/tools/toolEngine';

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export type CrosshairSnapMode = 'free' | 'time' | 'ohlc';

export function useChart(data: CandleData[], visibleCount: number, chartType: ChartType, onResize?: () => void, mountKey = 'default') {
  const chartContainerRef = useRef<HTMLDivElement | null>(null);
  const overlayRef = useRef<HTMLCanvasElement | null>(null);
  const chartRef = useRef<ReturnType<typeof createTradingChart> | null>(null);
  const seriesMapRef = useRef<ChartSeriesMap | null>(null);
  const resizeDebounceRef = useRef<number | null>(null);
  const lastLengthRef = useRef(0);
  const lastTimeRef = useRef<number | null>(null);
  const isDetachedFromRealtimeRef = useRef(false);
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

    const syncDetachState = () => {
      const position = chart.timeScale().scrollPosition();
      isDetachedFromRealtimeRef.current = position != null && position > 0.5;
    };

    chart.timeScale().subscribeVisibleTimeRangeChange(syncDetachState);
    container.addEventListener('wheel', syncDetachState, { passive: true });
    container.addEventListener('pointerup', syncDetachState);
    container.addEventListener('touchend', syncDetachState, { passive: true });
    syncDetachState();

    const observer = new ResizeObserver(() => {
      if (resizeDebounceRef.current != null) {
        window.clearTimeout(resizeDebounceRef.current);
      }
      resizeDebounceRef.current = window.setTimeout(() => {
        if (!chartRef.current || !chartContainerRef.current || !overlayRef.current) return;
        resizeChartSurface(chartRef.current, chartContainerRef.current, overlayRef.current);
        onResize?.();
      }, 90);
    });

    observer.observe(container);
    setReady(true);

    return () => {
      if (resizeDebounceRef.current != null) {
        window.clearTimeout(resizeDebounceRef.current);
      }
      try {
        chart.timeScale().unsubscribeVisibleTimeRangeChange(syncDetachState);
      } catch {
        // Chart may already be disposed.
      }
      container.removeEventListener('wheel', syncDetachState);
      container.removeEventListener('pointerup', syncDetachState);
      container.removeEventListener('touchend', syncDetachState);
      observer.disconnect();
      chart.remove();
      chartRef.current = null;
      seriesMapRef.current = null;
      setReady(false);
    };
  }, [mountKey]);

  useEffect(() => {
    const map = seriesMapRef.current;
    const chart = chartRef.current;
    if (!ready || !map || !chart) return;

    const timeScale = chart.timeScale();
    const wasDetachedFromRealtime = isDetachedFromRealtimeRef.current;
    const previousLogicalRange = timeScale.getVisibleLogicalRange();
    const previousScrollPosition = timeScale.scrollPosition();
    const nextLength = transformedData.ohlcRows.length;
    const nextLast = nextLength > 0 ? Number(transformedData.ohlcRows[nextLength - 1].time) : null;
    const prevLength = lastLengthRef.current;
    const prevLast = lastTimeRef.current;

    const isAppend = prevLength > 0 && nextLength === prevLength + 1 && prevLast != null && nextLast != null && nextLast > prevLast;
    const isReplaceTail = prevLength > 0 && nextLength === prevLength && prevLast != null && nextLast != null && nextLast === prevLast;

    if (isAppend || isReplaceTail) {
      updateSeriesData(map, transformedData);
    } else {
      applySeriesData(map, transformedData);
    }

    if (wasDetachedFromRealtime) {
      if (previousLogicalRange) {
        timeScale.setVisibleLogicalRange(previousLogicalRange);
      }
      if (previousScrollPosition != null && Number.isFinite(previousScrollPosition)) {
        timeScale.scrollToPosition(previousScrollPosition, false);
      }
    } else {
      timeScale.scrollToRealTime();
    }

    const postPosition = timeScale.scrollPosition();
    isDetachedFromRealtimeRef.current = postPosition != null && postPosition > 0.5;

    lastLengthRef.current = nextLength;
    lastTimeRef.current = nextLast;
  }, [ready, transformedData]);

  useEffect(() => {
    const map = seriesMapRef.current;
    if (!ready || !map) return;
    applySeriesVisibility(map, chartType);
  }, [chartType, ready]);

  const pointerToDataPoint = useCallback((clientX: number, clientY: number, snapMode: CrosshairSnapMode, magnetMode: boolean) => {
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

    const effectiveSnapMode = magnetMode ? 'ohlc' : snapMode;
    if (!transformedData.times.length || effectiveSnapMode === 'free') {
      return { time, price: rawPrice };
    }

    const idx = nearestCandleIndex(transformedData.times, time);
    if (idx < 0) return { time, price: rawPrice };
    const candle = transformedData.ohlcRows[idx];

    if (effectiveSnapMode === 'time') {
      return { time: candle.time, price: rawPrice };
    }

    const prices = [candle.open, candle.high, candle.low, candle.close];
    let snapped = prices[0];
    for (let i = 1; i < prices.length; i += 1) {
      if (Math.abs(prices[i] - rawPrice) < Math.abs(snapped - rawPrice)) snapped = prices[i];
    }

    if (magnetMode) {
      const baseRange = Math.max(1e-6, candle.high - candle.low, Math.abs(candle.close - candle.open));
      const exponent = Math.floor(Math.log10(baseRange));
      const baseStep = Math.pow(10, exponent);
      const gridStep = Math.max(baseStep / 2, Math.abs(rawPrice) * 0.0001, 0.0001);
      const snappedToGrid = Math.round(rawPrice / gridStep) * gridStep;
      if (Math.abs(snappedToGrid - rawPrice) < Math.abs(snapped - rawPrice) * 0.9) {
        snapped = snappedToGrid;
      }
    }

    return { time: candle.time, price: snapped };
  }, [getActiveSeries, transformedData.ohlcRows, transformedData.times]);

  const zoomToRange = useCallback((from: UTCTimestamp, to: UTCTimestamp) => {
    chartRef.current?.timeScale().setVisibleRange({ from: Math.min(from, to), to: Math.max(from, to) });
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
