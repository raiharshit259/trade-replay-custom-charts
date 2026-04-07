// ─── Public types ────────────────────────────────────────────────────────────

import { TimeIndex } from './data/timeIndex';
import { SeriesStore, type TimedRow } from './data/seriesStore';

export type UTCTimestamp = number;

export type InteractionMode = 'idle' | 'pan' | 'axis-zoom' | 'scroll' | 'pinch';

export interface CandlestickData {
  time: UTCTimestamp;
  open: number;
  high: number;
  low: number;
  close: number;
}

export interface LineData {
  time: UTCTimestamp;
  value: number;
}

export interface HistogramData {
  time: UTCTimestamp;
  value: number;
  color?: string;
}

export type SeriesType = 'Candlestick' | 'Line' | 'Area' | 'Baseline' | 'Histogram' | 'Bar';

type RowOf<T extends SeriesType> = T extends 'Candlestick' | 'Bar'
  ? CandlestickData
  : T extends 'Histogram'
  ? HistogramData
  : LineData;

export interface SeriesOptions {
  visible?: boolean;
  color?: string;
  lineWidth?: number;
  lineColor?: string;
  topColor?: string;
  bottomColor?: string;
  upColor?: string;
  downColor?: string;
  borderUpColor?: string;
  borderDownColor?: string;
  wickUpColor?: string;
  wickDownColor?: string;
  topLineColor?: string;
  bottomLineColor?: string;
  topFillColor1?: string;
  topFillColor2?: string;
  bottomFillColor1?: string;
  bottomFillColor2?: string;
  baseValue?: { type: string; price: number };
  priceFormat?: { type: string; precision?: number; minMove?: number };
  base?: number;
  thinBars?: boolean;
  priceScaleId?: string;
}

export interface ScaleMargins {
  top: number;
  bottom: number;
}

export interface IPriceScaleApi {
  applyOptions(opts: { scaleMargins?: ScaleMargins }): void;
}

export interface ISeriesApi<_T extends SeriesType> {
  setData(data: RowOf<_T>[]): void;
  update(row: RowOf<_T>): void;
  applyOptions(options: Partial<SeriesOptions>): void;
  priceScale(): IPriceScaleApi;
  coordinateToPrice(y: number): number | null;
  priceToCoordinate(price: number): number | null;
}

export interface LogicalRange {
  from: number;
  to: number;
}

export interface TimeRange {
  from: UTCTimestamp;
  to: UTCTimestamp;
}

export interface ITimeScaleApi {
  scrollPosition(): number;
  getVisibleLogicalRange(): LogicalRange | null;
  setVisibleLogicalRange(range: LogicalRange): void;
  applyOptions(opts: { rightOffset?: number; [key: string]: unknown }): void;
  scrollToPosition(pos: number, animate: boolean): void;
  scrollToRealTime(): void;
  coordinateToTime(x: number): UTCTimestamp | null;
  timeToCoordinate(time: UTCTimestamp): number | null;
  setVisibleRange(range: TimeRange): void;
}

export interface ChartOptions {
  width?: number;
  height?: number;
  autoSize?: boolean;
  layout?: {
    background?: { type?: string; color?: string };
    textColor?: string;
    fontFamily?: string;
    fontSize?: number;
  };
  grid?: {
    vertLines?: { color?: string };
    horzLines?: { color?: string };
  };
  crosshair?: {
    mode?: number;
    vertLine?: { color?: string; width?: number; style?: number; labelBackgroundColor?: string };
    horzLine?: { color?: string; width?: number; style?: number; labelBackgroundColor?: string };
  };
  rightPriceScale?: { borderColor?: string };
  timeScale?: {
    borderColor?: string;
    timeVisible?: boolean;
    secondsVisible?: boolean;
    rightBarStaysOnScroll?: boolean;
    shiftVisibleRangeOnNewBar?: boolean;
    rightOffset?: number;
  };
  handleScale?: {
    axisPressedMouseMove?: { time?: boolean; price?: boolean };
    mouseWheel?: boolean;
    pinch?: boolean;
  };
  handleScroll?: {
    mouseWheel?: boolean;
    pressedMouseMove?: boolean;
    vertTouchDrag?: boolean;
    horzTouchDrag?: boolean;
  };
}

export interface IChartApi {
  applyOptions(opts: Partial<ChartOptions>): void;
  addSeries<T extends SeriesType>(type: T, options?: Partial<SeriesOptions>): ISeriesApi<T>;
  timeScale(): ITimeScaleApi;
  subscribeCrosshairMove(handler: (param: unknown) => void): void;
  unsubscribeCrosshairMove(handler: (param: unknown) => void): void;
  setInteractionMode(mode: InteractionMode): void;
  remove(): void;
}

// ─── Internal constants ───────────────────────────────────────────────────────
const PRICE_AXIS_W = 68;
const TIME_AXIS_H = 28;
const DEFAULT_BAR_WIDTH = 8;
const MIN_BAR_WIDTH = 2;
const MAX_BAR_WIDTH = 60;
const PRICE_PADDING = 0.1;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function niceStep(range: number, steps: number): number {
  const rough = range / steps;
  const mag = Math.pow(10, Math.floor(Math.log10(rough)));
  const norm = rough / mag;
  const nice = norm < 1.5 ? 1 : norm < 3 ? 2 : norm < 7 ? 5 : 10;
  return nice * mag;
}

function fmtPrice(p: number): string {
  if (Math.abs(p) >= 10000) return p.toFixed(0);
  if (Math.abs(p) >= 1000) return p.toFixed(1);
  if (Math.abs(p) >= 1) return p.toFixed(2);
  return p.toPrecision(4);
}

function fmtTime(ts: UTCTimestamp, interval: number): string {
  const d = new Date(ts * 1000);
  if (interval >= 86400) {
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' });
  }
  const hh = String(d.getUTCHours()).padStart(2, '0');
  const mm = String(d.getUTCMinutes()).padStart(2, '0');
  return `${hh}:${mm}`;
}

/** Bars within this distance of the live edge are treated as "at live edge"
 * for the purpose of auto-advancing rightmostIndex on new streaming bars. */
const LIVE_EDGE_THRESHOLD = 2;

interface SeriesState {
  type: SeriesType;
  opts: SeriesOptions;
  store: SeriesStore<TimedRow>;
  scaleMargins: ScaleMargins;
  separateScale: boolean;
}

// ─── createChart ─────────────────────────────────────────────────────────────

export function createChart(
  container: HTMLElement,
  initOpts?: Partial<ChartOptions>
): IChartApi {
  // ── dimensions ──
  let width = (initOpts?.width ?? container.clientWidth) || 800;
  let height = (initOpts?.height ?? container.clientHeight) || 400;

  // ── theme ──
  let bgColor = 'rgba(9, 17, 32, 0.85)';
  let textColor = 'rgba(173, 192, 225, 0.88)';
  let fontFamily = 'JetBrains Mono, monospace';
  let fontSize = 11;
  let gridColor = 'rgba(38, 56, 84, 0.48)';
  let crosshairVColor = 'rgba(0, 209, 255, 0.72)';
  let crosshairHColor = 'rgba(255, 0, 0, 0.65)';
  let axisBorderColor = 'rgba(56, 80, 117, 0.55)';

  // ── chart state ──
  let barWidth = DEFAULT_BAR_WIDTH;
  /** Index into timeIndex for the bar at the right edge of the chart area. */
  let rightmostIndex = 0;
  const timeIndex = new TimeIndex();
  let mode: InteractionMode = 'idle';
  let crosshairX: number | null = null;
  let crosshairY: number | null = null;

  const seriesList: SeriesState[] = [];
  let rafId: number | null = null;

  // ── canvas setup ──
  const canvas = document.createElement('canvas');
  canvas.style.cssText = 'position:absolute;inset:0;user-select:none;touch-action:none;';
  container.style.position = 'relative';
  container.appendChild(canvas);

  const ctx = canvas.getContext('2d')!;

  function resizeCanvas(): void {
    const dpr = window.devicePixelRatio || 1;
    canvas.width = Math.floor(width * dpr);
    canvas.height = Math.floor(height * dpr);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  resizeCanvas();

  // ── layout helpers ──
  function cw(): number { return width - PRICE_AXIS_W; }
  function ch(): number { return height - TIME_AXIS_H; }
  function vbars(): number { return cw() / barWidth; }

  // bar index → screen x (center of bar)
  function barToX(idx: number): number {
    return cw() - (rightmostIndex - idx + 0.5) * barWidth;
  }
  // screen x → bar index (float)
  function xToBar(x: number): number {
    return rightmostIndex + 0.5 - (cw() - x) / barWidth;
  }

  // ── time management ──
  /**
   * Rebuild the canonical TimeIndex from all series' raw rows, re-align every
   * store, then update `rightmostIndex`.
   *
   * Called once after all series have been `setData`-ed for the same symbol
   * so the index is consistent.  O(S·N·log(S·N)).
   */
  function rebuildIndex(): void {
    const oldLastTime =
      timeIndex.length > 0 ? timeIndex.at(timeIndex.length - 1) : null;

    timeIndex.rebuild(
      seriesList.map((s) =>
        (s.store.rawRows as Array<{ time: UTCTimestamp }>).map((r) => r.time),
      ),
    );

    for (const s of seriesList) {
      s.store.realign();
    }

    const newLen = timeIndex.length;
    if (newLen === 0) {
      rightmostIndex = 0;
      return;
    }

    const newLastTime = timeIndex.at(newLen - 1)!;
    if (oldLastTime === null || newLastTime !== oldLastTime) {
      // First load or symbol switch: jump to the live edge.
      rightmostIndex = newLen - 1;
    } else {
      // Clamp to valid range (handles shrinking data sets).
      rightmostIndex = Math.max(0, Math.min(rightmostIndex, newLen - 1));
    }
  }

  // ── price scale helpers ──
  function computePriceRange(
    s: SeriesState,
    first: number,
    last: number
  ): { min: number; max: number } | null {
    let min = Infinity;
    let max = -Infinity;
    for (let i = Math.max(0, first); i <= Math.min(s.store.length - 1, last); i++) {
      const row = s.store.getAt(i) as (CandlestickData & LineData & HistogramData) | null;
      if (!row) continue;
      if (s.type === 'Candlestick' || s.type === 'Bar') {
        min = Math.min(min, row.low);
        max = Math.max(max, row.high);
      } else {
        const v = row.value;
        min = Math.min(min, v);
        if (s.type === 'Baseline' || s.type === 'Histogram') min = Math.min(min, 0);
        max = Math.max(max, v);
      }
    }
    if (!isFinite(min) || !isFinite(max)) return null;
    if (min === max) { min -= 1; max += 1; }
    const pad = (max - min) * PRICE_PADDING;
    return { min: min - pad, max: max + pad };
  }

  interface RenderState {
    firstBar: number;
    lastBar: number;
    mainMin: number;
    mainMax: number;
    seriesRanges: (ReturnType<typeof computePriceRange>)[];
  }

  function computeRenderState(): RenderState {
    const firstBar = Math.max(0, Math.floor(xToBar(0)));
    const lastBar = Math.min(timeIndex.length - 1, Math.ceil(rightmostIndex));

    let mainMin = Infinity;
    let mainMax = -Infinity;
    for (const s of seriesList) {
      if (s.opts.visible === false || s.separateScale) continue;
      const r = computePriceRange(s, firstBar, lastBar);
      if (r) { mainMin = Math.min(mainMin, r.min); mainMax = Math.max(mainMax, r.max); }
    }
    if (!isFinite(mainMin)) { mainMin = 0; mainMax = 100; }

    const seriesRanges = seriesList.map((s) =>
      s.separateScale ? computePriceRange(s, firstBar, lastBar) : null
    );

    return { firstBar, lastBar, mainMin, mainMax, seriesRanges };
  }

  function mainPriceToY(price: number, min: number, max: number): number {
    const h = ch();
    const range = max - min || 1;
    return h - ((price - min) / range) * h;
  }

  function mainYToPrice(y: number, min: number, max: number): number {
    const h = ch();
    const range = max - min || 1;
    return min + ((h - y) / h) * range;
  }

  function sepPriceToY(
    price: number,
    min: number,
    max: number,
    margins: ScaleMargins
  ): number {
    const h = ch();
    const top = margins.top * h;
    const bottom = (1 - margins.bottom) * h;
    const rh = bottom - top || 1;
    const range = max - min || 1;
    return bottom - ((price - min) / range) * rh;
  }

  // ── render ────────────────────────────────────────────────────────────────

  function drawBackground(): void {
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, width, height);
  }

  function drawGrid(rs: RenderState): void {
    const w = cw();
    const h = ch();
    ctx.strokeStyle = gridColor;
    ctx.lineWidth = 0.5;
    ctx.setLineDash([]);

    // Horizontal (price)
    const priceRange = rs.mainMax - rs.mainMin;
    const hStep = niceStep(priceRange, 6);
    let p = Math.ceil(rs.mainMin / hStep) * hStep;
    while (p <= rs.mainMax) {
      const y = mainPriceToY(p, rs.mainMin, rs.mainMax);
      if (y >= 0 && y <= h) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
      }
      p += hStep;
    }

    // Vertical (time)
    const minSpacing = 60;
    const bpl = Math.max(1, Math.ceil(minSpacing / barWidth));
    for (let i = Math.ceil(rs.firstBar / bpl) * bpl; i <= rs.lastBar; i += bpl) {
      const x = barToX(i);
      if (x >= 0 && x <= w) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke();
      }
    }
  }

  function drawAxesBorder(): void {
    const w = cw();
    const h = ch();
    ctx.strokeStyle = axisBorderColor;
    ctx.lineWidth = 1;
    ctx.setLineDash([]);
    ctx.beginPath(); ctx.moveTo(w, 0); ctx.lineTo(w, height); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(0, h); ctx.lineTo(width, h); ctx.stroke();
  }

  function drawTimeAxis(rs: RenderState): void {
    const w = cw();
    const h = ch();
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, h, w, TIME_AXIS_H);

    ctx.fillStyle = textColor;
    ctx.font = `${fontSize}px ${fontFamily}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    let interval = 86400;
    if (timeIndex.length >= 2) {
      interval = timeIndex.interval();
    }

    const minSpacing = 70;
    const bpl = Math.max(1, Math.ceil(minSpacing / barWidth));
    for (let i = Math.ceil(rs.firstBar / bpl) * bpl; i <= rs.lastBar; i += bpl) {
      const x = barToX(i);
      if (x < 10 || x > w - 10) continue;
      const t = timeIndex.at(i);
      if (t == null) continue;
      ctx.fillText(fmtTime(t, interval), x, h + TIME_AXIS_H / 2);
    }
  }

  function drawPriceAxis(rs: RenderState): void {
    const w = cw();
    const h = ch();
    ctx.fillStyle = bgColor;
    ctx.fillRect(w, 0, PRICE_AXIS_W, height);

    ctx.fillStyle = textColor;
    ctx.font = `${fontSize}px ${fontFamily}`;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';

    const priceRange = rs.mainMax - rs.mainMin;
    const hStep = niceStep(priceRange, 6);
    let p = Math.ceil(rs.mainMin / hStep) * hStep;
    while (p <= rs.mainMax) {
      const y = mainPriceToY(p, rs.mainMin, rs.mainMax);
      if (y >= 0 && y <= h) {
        ctx.fillText(fmtPrice(p), w + 6, y);
      }
      p += hStep;
    }
  }

  function drawCandlestick(s: SeriesState, rs: RenderState): void {
    const bw = barWidth;
    const hw = Math.max(0.5, bw * 0.4);
    const { firstBar, lastBar, mainMin, mainMax } = rs;
    const w = cw();

    for (let i = firstBar; i <= lastBar; i++) {
      const row = s.store.getAt(i) as CandlestickData | null;
      if (!row) continue;
      const x = barToX(i);
      if (x < -bw || x > w + bw) continue;

      const isUp = row.close >= row.open;
      const wickColor = isUp
        ? (s.opts.wickUpColor ?? s.opts.upColor ?? '#17c964')
        : (s.opts.wickDownColor ?? s.opts.downColor ?? '#ff4d4f');
      const borderColor = isUp
        ? (s.opts.borderUpColor ?? s.opts.upColor ?? '#17c964')
        : (s.opts.borderDownColor ?? s.opts.downColor ?? '#ff4d4f');
      const bodyColor = isUp
        ? (s.opts.upColor ?? '#17c964')
        : (s.opts.downColor ?? '#ff4d4f');

      const openY = mainPriceToY(row.open, mainMin, mainMax);
      const closeY = mainPriceToY(row.close, mainMin, mainMax);
      const highY = mainPriceToY(row.high, mainMin, mainMax);
      const lowY = mainPriceToY(row.low, mainMin, mainMax);

      // Wick
      ctx.strokeStyle = wickColor;
      ctx.lineWidth = 1;
      ctx.setLineDash([]);
      ctx.beginPath();
      ctx.moveTo(x, highY);
      ctx.lineTo(x, lowY);
      ctx.stroke();

      // Body
      const bodyTop = Math.min(openY, closeY);
      const bodyH = Math.max(1, Math.abs(closeY - openY));
      ctx.fillStyle = bodyColor;
      ctx.fillRect(x - hw, bodyTop, hw * 2, bodyH);
      ctx.strokeStyle = borderColor;
      ctx.lineWidth = 1;
      ctx.strokeRect(x - hw, bodyTop, hw * 2, bodyH);
    }
  }

  function drawBar(s: SeriesState, rs: RenderState): void {
    const bw = barWidth;
    const w = cw();
    const { firstBar, lastBar, mainMin, mainMax } = rs;

    for (let i = firstBar; i <= lastBar; i++) {
      const row = s.store.getAt(i) as CandlestickData | null;
      if (!row) continue;
      const x = barToX(i);
      if (x < -bw || x > w + bw) continue;

      const isUp = row.close >= row.open;
      const col = isUp ? (s.opts.upColor ?? '#17c964') : (s.opts.downColor ?? '#ff4d4f');
      const thin = s.opts.thinBars === true;
      const tick = Math.max(2, bw * (thin ? 0.3 : 0.4));

      ctx.strokeStyle = col;
      ctx.lineWidth = thin ? 1 : 1.5;
      ctx.setLineDash([]);

      const highY = mainPriceToY(row.high, mainMin, mainMax);
      const lowY = mainPriceToY(row.low, mainMin, mainMax);
      const openY = mainPriceToY(row.open, mainMin, mainMax);
      const closeY = mainPriceToY(row.close, mainMin, mainMax);

      ctx.beginPath(); ctx.moveTo(x, highY); ctx.lineTo(x, lowY); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(x - tick, openY); ctx.lineTo(x, openY); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(x, closeY); ctx.lineTo(x + tick, closeY); ctx.stroke();
    }
  }

  function drawHistogram(s: SeriesState, rs: RenderState): void {
    const bw = barWidth;
    const hw = Math.max(0.5, bw * 0.4);
    const w = cw();
    const { firstBar, lastBar } = rs;

    const baseVal = s.opts.base ?? 0;
    let baseY: number;
    if (s.separateScale) {
      const range = rs.seriesRanges[seriesList.indexOf(s)];
      if (!range) return;
      baseY = sepPriceToY(baseVal, range.min, range.max, s.scaleMargins);
    } else {
      baseY = mainPriceToY(baseVal, rs.mainMin, rs.mainMax);
    }

    for (let i = firstBar; i <= lastBar; i++) {
      const row = s.store.getAt(i) as HistogramData | null;
      if (!row) continue;
      const x = barToX(i);
      if (x < -bw || x > w + bw) continue;

      let valY: number;
      if (s.separateScale) {
        const range = rs.seriesRanges[seriesList.indexOf(s)];
        if (!range) continue;
        valY = sepPriceToY(row.value, range.min, range.max, s.scaleMargins);
      } else {
        valY = mainPriceToY(row.value, rs.mainMin, rs.mainMax);
      }

      const top = Math.min(valY, baseY);
      const barH = Math.max(1, Math.abs(valY - baseY));
      ctx.fillStyle = row.color ?? s.opts.color ?? 'rgba(0,209,255,0.5)';
      ctx.fillRect(x - hw, top, hw * 2, barH);
    }
  }

  function drawLine(s: SeriesState, rs: RenderState): void {
    const { firstBar, lastBar, mainMin, mainMax } = rs;
    ctx.strokeStyle = s.opts.color ?? '#00d1ff';
    ctx.lineWidth = s.opts.lineWidth ?? 2;
    ctx.setLineDash([]);
    ctx.beginPath();
    let started = false;
    for (let i = firstBar; i <= lastBar; i++) {
      const row = s.store.getAt(i) as LineData | null;
      if (!row) continue;
      const x = barToX(i);
      const y = mainPriceToY(row.value, mainMin, mainMax);
      if (!started) { ctx.moveTo(x, y); started = true; }
      else ctx.lineTo(x, y);
    }
    if (started) ctx.stroke();
  }

  function drawArea(s: SeriesState, rs: RenderState): void {
    const { firstBar, lastBar, mainMin, mainMax } = rs;
    const lineColor = s.opts.lineColor ?? s.opts.color ?? '#00d1ff';
    const topColor = s.opts.topColor ?? 'rgba(0,209,255,0.42)';
    const bottomColor = s.opts.bottomColor ?? 'rgba(0,209,255,0.02)';
    const h = ch();

    // Fill
    ctx.beginPath();
    let started = false;
    let firstX = 0;
    let lastX = 0;
    for (let i = firstBar; i <= lastBar; i++) {
      const row = s.store.getAt(i) as LineData | null;
      if (!row) continue;
      const x = barToX(i);
      const y = mainPriceToY(row.value, mainMin, mainMax);
      if (!started) { ctx.moveTo(x, y); firstX = x; started = true; }
      else ctx.lineTo(x, y);
      lastX = x;
    }
    if (started) {
      ctx.lineTo(lastX, h);
      ctx.lineTo(firstX, h);
      ctx.closePath();
      const g = ctx.createLinearGradient(0, 0, 0, h);
      g.addColorStop(0, topColor);
      g.addColorStop(1, bottomColor);
      ctx.fillStyle = g;
      ctx.fill();
    }

    // Line
    ctx.strokeStyle = lineColor;
    ctx.lineWidth = s.opts.lineWidth ?? 2;
    ctx.setLineDash([]);
    ctx.beginPath();
    started = false;
    for (let i = firstBar; i <= lastBar; i++) {
      const row = s.store.getAt(i) as LineData | null;
      if (!row) continue;
      const x = barToX(i);
      const y = mainPriceToY(row.value, mainMin, mainMax);
      if (!started) { ctx.moveTo(x, y); started = true; } else ctx.lineTo(x, y);
    }
    if (started) ctx.stroke();
  }

  function drawBaseline(s: SeriesState, rs: RenderState): void {
    const { firstBar, lastBar, mainMin, mainMax } = rs;
    const basePrice = s.opts.baseValue?.price ?? 0;
    const baseY = mainPriceToY(basePrice, mainMin, mainMax);
    const topFill1 = s.opts.topFillColor1 ?? 'rgba(23,201,100,0.35)';
    const topFill2 = s.opts.topFillColor2 ?? 'rgba(23,201,100,0.04)';
    const botFill1 = s.opts.bottomFillColor1 ?? 'rgba(255,77,79,0.25)';
    const botFill2 = s.opts.bottomFillColor2 ?? 'rgba(255,77,79,0.03)';
    const topLineColor = s.opts.topLineColor ?? '#17c964';
    const h = ch();

    // Top fill (values above base → visually above baseY)
    ctx.beginPath();
    let started = false;
    let firstX = 0;
    let lastX = 0;
    for (let i = firstBar; i <= lastBar; i++) {
      const row = s.store.getAt(i) as LineData | null;
      if (!row) continue;
      const x = barToX(i);
      const rawY = mainPriceToY(row.value, mainMin, mainMax);
      const y = Math.min(rawY, baseY); // clip to above base
      if (!started) { ctx.moveTo(x, baseY); ctx.lineTo(x, y); firstX = x; started = true; }
      else ctx.lineTo(x, y);
      lastX = x;
    }
    if (started) {
      ctx.lineTo(lastX, baseY);
      ctx.lineTo(firstX, baseY);
      ctx.closePath();
      const g = ctx.createLinearGradient(0, 0, 0, baseY);
      g.addColorStop(0, topFill1);
      g.addColorStop(1, topFill2);
      ctx.fillStyle = g;
      ctx.fill();
    }

    // Bottom fill (values below base → visually below baseY)
    ctx.beginPath();
    started = false;
    firstX = 0; lastX = 0;
    for (let i = firstBar; i <= lastBar; i++) {
      const row = s.store.getAt(i) as LineData | null;
      if (!row) continue;
      const x = barToX(i);
      const rawY = mainPriceToY(row.value, mainMin, mainMax);
      const y = Math.max(rawY, baseY); // clip to below base
      if (!started) { ctx.moveTo(x, baseY); ctx.lineTo(x, y); firstX = x; started = true; }
      else ctx.lineTo(x, y);
      lastX = x;
    }
    if (started) {
      ctx.lineTo(lastX, baseY);
      ctx.lineTo(firstX, baseY);
      ctx.closePath();
      const g = ctx.createLinearGradient(0, baseY, 0, h);
      g.addColorStop(0, botFill1);
      g.addColorStop(1, botFill2);
      ctx.fillStyle = g;
      ctx.fill();
    }

    // Line
    ctx.strokeStyle = topLineColor;
    ctx.lineWidth = s.opts.lineWidth ?? 2;
    ctx.setLineDash([]);
    ctx.beginPath();
    started = false;
    for (let i = firstBar; i <= lastBar; i++) {
      const row = s.store.getAt(i) as LineData | null;
      if (!row) continue;
      const x = barToX(i);
      const y = mainPriceToY(row.value, mainMin, mainMax);
      if (!started) { ctx.moveTo(x, y); started = true; } else ctx.lineTo(x, y);
    }
    if (started) ctx.stroke();
  }

  function drawSeries(s: SeriesState, rs: RenderState): void {
    if (s.opts.visible === false || s.store.length === 0) return;
    switch (s.type) {
      case 'Candlestick': drawCandlestick(s, rs); break;
      case 'Bar':         drawBar(s, rs); break;
      case 'Histogram':   drawHistogram(s, rs); break;
      case 'Line':        drawLine(s, rs); break;
      case 'Area':        drawArea(s, rs); break;
      case 'Baseline':    drawBaseline(s, rs); break;
    }
  }

  function drawCrosshair(rs: RenderState): void {
    if (crosshairX == null || crosshairY == null) return;
    const w = cw();
    const h = ch();
    if (crosshairX < 0 || crosshairX > w || crosshairY < 0 || crosshairY > h) return;

    ctx.setLineDash([4, 4]);

    ctx.strokeStyle = crosshairVColor;
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(crosshairX, 0); ctx.lineTo(crosshairX, h); ctx.stroke();

    ctx.strokeStyle = crosshairHColor;
    ctx.beginPath(); ctx.moveTo(0, crosshairY); ctx.lineTo(w, crosshairY); ctx.stroke();

    ctx.setLineDash([]);

    // Price label
    const price = mainYToPrice(crosshairY, rs.mainMin, rs.mainMax);
    const pLabel = fmtPrice(price);
    ctx.font = `${fontSize}px ${fontFamily}`;
    ctx.textBaseline = 'middle';
    const labelH = 16;
    ctx.fillStyle = crosshairHColor;
    ctx.fillRect(w + 2, crosshairY - labelH / 2, PRICE_AXIS_W - 4, labelH);
    ctx.fillStyle = '#fff';
    ctx.textAlign = 'left';
    ctx.fillText(pLabel, w + 6, crosshairY);

    // Time label
    const barIdx = Math.round(xToBar(crosshairX));
    if (barIdx >= 0 && barIdx < timeIndex.length) {
      const interval = timeIndex.interval();
      const t = timeIndex.at(barIdx);
      if (t != null) {
        const tLabel = fmtTime(t, interval);
        ctx.textAlign = 'center';
        const tlW = Math.max(50, ctx.measureText(tLabel).width + 12);
        ctx.fillStyle = crosshairVColor;
        ctx.fillRect(crosshairX - tlW / 2, h + 2, tlW, labelH);
        ctx.fillStyle = '#fff';
        ctx.fillText(tLabel, crosshairX, h + 2 + labelH / 2);
      }
    }
  }

  function scheduleRender(): void {
    if (rafId != null) return;
    rafId = requestAnimationFrame(() => {
      rafId = null;
      render();
    });
  }

  function render(): void {
    const rs = computeRenderState();

    drawBackground();
    drawGrid(rs);

    // Clip to chart area for series + crosshair
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, 0, cw(), ch());
    ctx.clip();
    for (const s of seriesList) drawSeries(s, rs);
    drawCrosshair(rs);
    ctx.restore();

    drawAxesBorder();
    drawTimeAxis(rs);
    drawPriceAxis(rs);
  }

  // ── interaction ──────────────────────────────────────────────────────────

  let dragStart: { clientX: number; rightAtStart: number } | null = null;

  function onWheel(e: WheelEvent): void {
    e.preventDefault();
    const factor = e.deltaY > 0 ? 0.9 : 1 / 0.9;
    const mouseBar = xToBar(e.offsetX);
    barWidth = Math.max(MIN_BAR_WIDTH, Math.min(MAX_BAR_WIDTH, barWidth * factor));
    // Keep the bar under the mouse cursor fixed
    rightmostIndex = mouseBar + 0.5 - (cw() - e.offsetX) / barWidth;
    scheduleRender();
  }

  function onPointerDown(e: PointerEvent): void {
    dragStart = { clientX: e.clientX, rightAtStart: rightmostIndex };
    canvas.setPointerCapture(e.pointerId);
  }

  function onPointerMove(e: PointerEvent): void {
    crosshairX = e.offsetX;
    crosshairY = e.offsetY;
    if (dragStart != null && (mode === 'pan' || mode === 'scroll' || mode === 'idle')) {
      const dx = e.clientX - dragStart.clientX;
      rightmostIndex = dragStart.rightAtStart - dx / barWidth;
    }
    scheduleRender();
  }

  function onPointerUp(e: PointerEvent): void {
    if (canvas.hasPointerCapture(e.pointerId)) canvas.releasePointerCapture(e.pointerId);
    dragStart = null;
  }

  function onPointerLeave(): void {
    crosshairX = null;
    crosshairY = null;
    scheduleRender();
  }

  canvas.addEventListener('wheel', onWheel, { passive: false });
  canvas.addEventListener('pointerdown', onPointerDown);
  canvas.addEventListener('pointermove', onPointerMove);
  canvas.addEventListener('pointerup', onPointerUp);
  canvas.addEventListener('pointerleave', onPointerLeave);

  // ── series factory ────────────────────────────────────────────────────────

  function makeSeries<T extends SeriesType>(sState: SeriesState): ISeriesApi<T> {
    return {
      setData(data: RowOf<T>[]): void {
        sState.store.setData(data as TimedRow[]);
        rebuildIndex();
        scheduleRender();
      },
      update(row: RowOf<T>): void {
        const t = (row as { time: UTCTimestamp }).time;
        const result = sState.store.update(row as TimedRow);

        if (result === 'appended') {
          // New timestamp: insert into the shared time index.
          const newBarIdx = timeIndex.insertOne(t);
          const newLen = timeIndex.length;

          if (newBarIdx === newLen - 1) {
            // Fast path: timestamp appended at the live edge.
            sState.store.setAt(newBarIdx, row as TimedRow);
            for (const other of seriesList) {
              if (other !== sState) other.store.grow(newLen);
            }
            // Advance viewport to the live edge if the user hasn't scrolled away.
            if (rightmostIndex >= newLen - LIVE_EDGE_THRESHOLD) {
              rightmostIndex = newLen - 1;
            }
          } else {
            // Slow path: out-of-order insert — realign all stores.
            for (const s of seriesList) {
              s.store.realign();
            }
          }
        }

        scheduleRender();
      },
      applyOptions(opts: Partial<SeriesOptions>): void {
        sState.opts = { ...sState.opts, ...opts };
        scheduleRender();
      },
      priceScale(): IPriceScaleApi {
        return {
          applyOptions(opts: { scaleMargins?: ScaleMargins }): void {
            if (opts.scaleMargins) {
              sState.scaleMargins = { ...sState.scaleMargins, ...opts.scaleMargins };
              scheduleRender();
            }
          },
        };
      },
      coordinateToPrice(y: number): number | null {
        const rs = computeRenderState();
        if (sState.separateScale) {
          const range = rs.seriesRanges[seriesList.indexOf(sState)];
          if (!range) return null;
          const h = ch();
          const top = sState.scaleMargins.top * h;
          const bot = (1 - sState.scaleMargins.bottom) * h;
          const rh = bot - top || 1;
          return range.min + ((bot - y) / rh) * (range.max - range.min);
        }
        return mainYToPrice(y, rs.mainMin, rs.mainMax);
      },
      priceToCoordinate(price: number): number | null {
        const rs = computeRenderState();
        if (sState.separateScale) {
          const range = rs.seriesRanges[seriesList.indexOf(sState)];
          if (!range) return null;
          return sepPriceToY(price, range.min, range.max, sState.scaleMargins);
        }
        return mainPriceToY(price, rs.mainMin, rs.mainMax);
      },
    };
  }

  // ── time scale API ────────────────────────────────────────────────────────

  const timeScaleApi: ITimeScaleApi = {
    scrollPosition(): number {
      return (timeIndex.length - 1) - rightmostIndex;
    },
    getVisibleLogicalRange(): LogicalRange | null {
      if (!timeIndex.length) return null;
      return { from: xToBar(0), to: rightmostIndex };
    },
    setVisibleLogicalRange(range: LogicalRange): void {
      const bars = Math.abs(range.to - range.from);
      if (bars > 0) barWidth = Math.max(MIN_BAR_WIDTH, Math.min(MAX_BAR_WIDTH, cw() / bars));
      rightmostIndex = range.to;
      scheduleRender();
    },
    applyOptions(opts: { rightOffset?: number; [key: string]: unknown }): void {
      if (typeof opts.rightOffset === 'number') {
        rightmostIndex = (timeIndex.length - 1) - opts.rightOffset;
        scheduleRender();
      }
    },
    scrollToPosition(pos: number, _animate: boolean): void {
      rightmostIndex = (timeIndex.length - 1) - pos;
      scheduleRender();
    },
    scrollToRealTime(): void {
      rightmostIndex = timeIndex.length - 1;
      scheduleRender();
    },
    coordinateToTime(x: number): UTCTimestamp | null {
      if (!timeIndex.length) return null;
      const idx = Math.round(xToBar(x));
      if (idx < 0 || idx >= timeIndex.length) return null;
      return timeIndex.at(idx) ?? null;
    },
    timeToCoordinate(time: UTCTimestamp): number | null {
      if (!timeIndex.length) return null;
      const idx = timeIndex.indexOf(time);
      if (idx < 0) return null;
      return barToX(idx);
    },
    setVisibleRange(range: TimeRange): void {
      const fromIdx = timeIndex.closestIndex(range.from);
      const toIdx = timeIndex.closestIndex(range.to);
      const bars = toIdx - fromIdx + 1;
      if (bars > 0) barWidth = Math.max(MIN_BAR_WIDTH, Math.min(MAX_BAR_WIDTH, cw() / bars));
      rightmostIndex = toIdx;
      scheduleRender();
    },
  };

  // ── chart API ─────────────────────────────────────────────────────────────

  const api: IChartApi = {
    applyOptions(opts: Partial<ChartOptions>): void {
      if (opts.width != null) width = opts.width;
      if (opts.height != null) height = opts.height;
      if (opts.layout?.background?.color) bgColor = opts.layout.background.color;
      if (opts.layout?.textColor) textColor = opts.layout.textColor;
      if (opts.layout?.fontFamily) fontFamily = opts.layout.fontFamily;
      if (opts.layout?.fontSize != null) fontSize = opts.layout.fontSize;
      if (opts.grid?.vertLines?.color) gridColor = opts.grid.vertLines.color;
      if (opts.crosshair?.vertLine?.color) crosshairVColor = opts.crosshair.vertLine.color;
      if (opts.crosshair?.horzLine?.color) crosshairHColor = opts.crosshair.horzLine.color;
      if (opts.rightPriceScale?.borderColor) axisBorderColor = opts.rightPriceScale.borderColor;
      resizeCanvas();
      scheduleRender();
    },
    addSeries<T extends SeriesType>(type: T, options?: Partial<SeriesOptions>): ISeriesApi<T> {
      const sState: SeriesState = {
        type,
        opts: { visible: true, ...options },
        store: new SeriesStore<TimedRow>(timeIndex),
        scaleMargins: { top: 0, bottom: 0 },
        separateScale: options?.priceScaleId === '',
      };
      seriesList.push(sState);
      return makeSeries<T>(sState);
    },
    timeScale(): ITimeScaleApi {
      return timeScaleApi;
    },
    subscribeCrosshairMove(_handler: (param: unknown) => void): void {
      // optional: no-op for now
    },
    unsubscribeCrosshairMove(_handler: (param: unknown) => void): void {
      // optional: no-op
    },
    setInteractionMode(newMode: InteractionMode): void {
      mode = newMode;
    },
    remove(): void {
      if (rafId != null) { cancelAnimationFrame(rafId); rafId = null; }
      canvas.removeEventListener('wheel', onWheel);
      canvas.removeEventListener('pointerdown', onPointerDown);
      canvas.removeEventListener('pointermove', onPointerMove);
      canvas.removeEventListener('pointerup', onPointerUp);
      canvas.removeEventListener('pointerleave', onPointerLeave);
      if (container.contains(canvas)) container.removeChild(canvas);
    },
  };

  scheduleRender();
  return api;
}
