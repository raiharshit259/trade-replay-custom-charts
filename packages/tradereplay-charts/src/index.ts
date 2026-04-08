export {
  createChart,
  type UTCTimestamp,
  type InteractionMode,
  type CandlestickData,
  type LineData,
  type HistogramData,
  type SeriesType,
  type SeriesOptions,
  type ScaleMargins,
  type IPriceScaleApi,
  type ISeriesApi,
  type LogicalRange,
  type TimeRange,
  type ITimeScaleApi,
  type ChartOptions,
  type IChartApi,
} from './lib/createChart';

export { TimeIndex } from './lib/data/timeIndex';
export { SeriesStore, type TimedRow } from './lib/data/seriesStore';
export { type PaneId, type PaneDef, type PaneRect, PANE_DIVIDER_H, computePaneLayout } from './lib/layout/panes';
export { priceToY, yToPrice, sepPriceToY, sepYToPrice } from './lib/scales/priceScale';

// ─── Indicator framework ─────────────────────────────────────────────────────
export {
  type IndicatorId,
  type IndicatorInstanceId,
  type IndicatorInputSpec,
  type IndicatorOutputSpec,
  type IndicatorSeriesType,
  type IndicatorPanePlacement,
  type IndicatorComputeContext,
  type IndicatorOutputSeries,
  type IndicatorResult,
  type IndicatorDefinition,
} from './indicators/types';

export { registerIndicator, getIndicator, listIndicators } from './indicators/registry';

// Re-export builtin definitions so consumers can reference them without re-registering.
export { smaDef }  from './indicators/builtins/sma';
export { emaDef }  from './indicators/builtins/ema';
export { rsiDef }  from './indicators/builtins/rsi';
export { macdDef } from './indicators/builtins/macd';
