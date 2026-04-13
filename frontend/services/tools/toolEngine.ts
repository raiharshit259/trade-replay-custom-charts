import type { UTCTimestamp } from '@tradereplay/charts';
import { buildToolOptions, getToolDefinition, type DrawPoint, type Drawing, type ToolVariant } from './toolRegistry.ts';
import type { ToolOptions } from './toolOptions.ts';
import { interpolateDrawPoint } from './drawingGeometry.ts';

export function isWizardVariant(variant: ToolVariant): boolean {
  const definition = getToolDefinition(variant);
  return Boolean(definition && definition.family === 'pattern' && definition.capabilities.anchors > 2);
}

export function makeId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

type TimeLike = UTCTimestamp | string | { year: number; month: number; day: number };

export function toTimestampFromTime(value: TimeLike | null): UTCTimestamp | null {
  if (value == null) return null;
  if (typeof value === 'number') return value as UTCTimestamp;
  if (typeof value === 'string') {
    const parsed = Math.floor(new Date(value).getTime() / 1000);
    return Number.isFinite(parsed) ? (parsed as UTCTimestamp) : null;
  }
  if (typeof value === 'object' && 'year' in value && 'month' in value && 'day' in value) {
    return Math.floor(Date.UTC(value.year, value.month - 1, value.day) / 1000) as UTCTimestamp;
  }
  return null;
}

export function nearestCandleIndex(times: UTCTimestamp[], target: UTCTimestamp): number {
  if (!times.length) return -1;
  let lo = 0;
  let hi = times.length - 1;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    if (times[mid] === target) return mid;
    if (times[mid] < target) lo = mid + 1;
    else hi = mid - 1;
  }
  const left = Math.max(0, hi);
  const right = Math.min(times.length - 1, lo);
  return Math.abs(times[left] - target) <= Math.abs(times[right] - target) ? left : right;
}

export function isPointOnlyVariant(variant: ToolVariant): boolean {
  const def = getToolDefinition(variant);
  return Boolean(def && def.capabilities.anchors <= 1);
}

export function createDrawing(variant: Exclude<ToolVariant, 'none'>, options: ToolOptions, p1: DrawPoint, p2?: DrawPoint, text?: string): Drawing {
  const definition = getToolDefinition(variant);
  const anchorCount = definition?.capabilities.anchors ?? 2;
  const anchors: DrawPoint[] = [p1];
  while (anchors.length < anchorCount) {
    anchors.push(p2 || p1);
  }

  return {
    id: makeId(),
    type: definition?.family ?? 'line',
    variant,
    anchors,
    text,
    options: { ...buildToolOptions(variant), ...options },
    selected: false,
    locked: options.locked,
    visible: options.visible,
  };
}

export function updateDraftDrawing(draft: Drawing, point: DrawPoint, activeAnchorIndex?: number): Drawing {
  if (isWizardVariant(draft.variant)) {
    const anchors = [...draft.anchors];
    const targetIndex = Math.max(1, Math.min(anchors.length - 1, activeAnchorIndex ?? anchors.length - 1));
    anchors[targetIndex] = point;
    for (let index = targetIndex + 1; index < anchors.length; index += 1) {
      anchors[index] = point;
    }
    return { ...draft, anchors };
  }

  if (draft.variant === 'brush' || draft.variant === 'highlighter') {
    const last = draft.anchors[draft.anchors.length - 1];
    const smoothness = Math.max(0, Math.min(1, Number(draft.options.brushSmoothness) || 0));
    const minTimeDelta = Math.max(0.5, smoothness * 2.2);
    const minPriceDelta = Math.max(0.00005, Math.abs(point.price) * (0.00001 + smoothness * 0.00006));

    if (
      last
      && Math.abs(last.time - point.time) < minTimeDelta
      && Math.abs(last.price - point.price) < minPriceDelta
    ) {
      return draft;
    }
    return { ...draft, anchors: [...draft.anchors, point] };
  }

  const definition = getToolDefinition(draft.variant);
  if (definition?.family === 'position' && draft.anchors.length >= 3) {
    const entry = draft.anchors[0];
    const mirrored = {
      time: point.time,
      price: entry.price - (point.price - entry.price),
    };
    return {
      ...draft,
      anchors: [entry, { time: point.time, price: point.price }, mirrored],
    };
  }

  const anchors = [...draft.anchors];
  if (anchors.length > 2) {
    const first = anchors[0];
    const lastIndex = anchors.length - 1;
    for (let index = 1; index < lastIndex; index += 1) {
      anchors[index] = interpolateDrawPoint(first, point, index / lastIndex);
    }
    anchors[lastIndex] = point;
    return { ...draft, anchors };
  }

  anchors[anchors.length - 1] = point;
  return { ...draft, anchors };
}

type NormalizedPoint = { x: number; y: number };
type SelectionIntent = 'select' | 'erase';

function normalizePoint(point: DrawPoint, timeScale: number, priceScale: number): NormalizedPoint {
  return {
    x: Number(point.time) / timeScale,
    y: point.price / priceScale,
  };
}

function distance(a: NormalizedPoint, b: NormalizedPoint): number {
  return Math.hypot(b.x - a.x, b.y - a.y);
}

function pointToSegmentDistance(point: NormalizedPoint, start: NormalizedPoint, end: NormalizedPoint): number {
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const span = dx * dx + dy * dy;
  if (span === 0) return distance(point, start);
  const t = Math.max(0, Math.min(1, ((point.x - start.x) * dx + (point.y - start.y) * dy) / span));
  return distance(point, { x: start.x + dx * t, y: start.y + dy * t });
}

function pointToRayDistance(point: NormalizedPoint, start: NormalizedPoint, through: NormalizedPoint): number {
  const dx = through.x - start.x;
  const dy = through.y - start.y;
  const span = dx * dx + dy * dy;
  if (span === 0) return distance(point, start);
  const t = ((point.x - start.x) * dx + (point.y - start.y) * dy) / span;
  if (t < 0) return distance(point, start) + Math.abs(t);
  return distance(point, { x: start.x + dx * t, y: start.y + dy * t });
}

function pointToLineDistance(point: NormalizedPoint, start: NormalizedPoint, end: NormalizedPoint): number {
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const span = Math.hypot(dx, dy);
  if (span === 0) return distance(point, start);
  return Math.abs(((point.x - start.x) * dy - (point.y - start.y) * dx) / span);
}

function pointToRectDistance(point: NormalizedPoint, a: NormalizedPoint, b: NormalizedPoint): number {
  const left = Math.min(a.x, b.x);
  const right = Math.max(a.x, b.x);
  const top = Math.min(a.y, b.y);
  const bottom = Math.max(a.y, b.y);

  if (point.x >= left && point.x <= right && point.y >= top && point.y <= bottom) return 0;

  const dx = point.x < left ? left - point.x : point.x > right ? point.x - right : 0;
  const dy = point.y < top ? top - point.y : point.y > bottom ? point.y - bottom : 0;
  return Math.hypot(dx, dy);
}

function pointToCircleDistance(point: NormalizedPoint, center: NormalizedPoint, edge: NormalizedPoint): number {
  const radius = Math.max(1e-6, distance(center, edge));
  const dist = distance(point, center);
  if (dist <= radius) return 0;
  return dist - radius;
}

function signedDistanceToLine(point: NormalizedPoint, start: NormalizedPoint, end: NormalizedPoint): number {
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const span = Math.hypot(dx, dy);
  if (span === 0) return 0;
  return ((point.x - start.x) * dy - (point.y - start.y) * dx) / span;
}

function scorePolyline(point: NormalizedPoint, anchors: NormalizedPoint[]): number {
  if (anchors.length === 0) return Number.POSITIVE_INFINITY;
  if (anchors.length === 1) return distance(point, anchors[0]);

  let best = Number.POSITIVE_INFINITY;
  for (let index = 0; index < anchors.length - 1; index += 1) {
    best = Math.min(best, pointToSegmentDistance(point, anchors[index], anchors[index + 1]));
  }
  return best;
}

function scoreLineLikeDrawing(drawing: Drawing, point: DrawPoint): number {
  const timeScale = 172800;
  const priceScale = Math.max(0.5, Math.abs(point.price) * 0.03);
  const normalizedPoint = normalizePoint(point, timeScale, priceScale);
  const anchors = drawing.anchors.map((anchor) => normalizePoint(anchor, timeScale, priceScale));
  const definition = getToolDefinition(drawing.variant);

  if (!anchors.length) return Number.POSITIVE_INFINITY;

  const [a, b, c, d] = anchors;
  const variant = drawing.variant;

  if (variant === 'hline') {
    return Math.abs(normalizedPoint.y - a.y);
  }

  if (variant === 'horizontalRay') {
    const score = Math.abs(normalizedPoint.y - a.y);
    return normalizedPoint.x < a.x ? score + (a.x - normalizedPoint.x) : score;
  }

  if (variant === 'vline') {
    return Math.abs(normalizedPoint.x - a.x);
  }

  if (variant === 'crossLine') {
    return Math.min(Math.abs(normalizedPoint.y - a.y), Math.abs(normalizedPoint.x - a.x));
  }

  if (variant === 'ray' && a && b) {
    return pointToRayDistance(normalizedPoint, a, b);
  }

  if (drawing.options.rayMode && a && b) {
    return pointToRayDistance(normalizedPoint, a, b);
  }

  if (drawing.options.extendLeft || drawing.options.extendRight) {
    if (a && b) return pointToLineDistance(normalizedPoint, a, b);
  }

  if (variant === 'channel' && a && b) {
    const span = Math.max(0.1, distance(a, b));
    const offset = span * 0.24;
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const magnitude = Math.hypot(dx, dy) || 1;
    const normal = { x: -dy / magnitude, y: dx / magnitude };
    const upperStart = { x: a.x + normal.x * offset, y: a.y + normal.y * offset };
    const upperEnd = { x: b.x + normal.x * offset, y: b.y + normal.y * offset };
    const lowerStart = { x: a.x - normal.x * offset, y: a.y - normal.y * offset };
    const lowerEnd = { x: b.x - normal.x * offset, y: b.y - normal.y * offset };
    return Math.min(
      pointToLineDistance(normalizedPoint, a, b),
      pointToLineDistance(normalizedPoint, upperStart, upperEnd),
      pointToLineDistance(normalizedPoint, lowerStart, lowerEnd),
    );
  }

  if (variant === 'regressionTrend' && a && b) {
    return pointToSegmentDistance(normalizedPoint, a, b);
  }

  if (variant === 'flatTopBottom' && a && b) {
    const top = Math.min(a.y, b.y);
    const bottom = Math.max(a.y, b.y);
    if (normalizedPoint.y >= top && normalizedPoint.y <= bottom) return 0;
    return Math.min(Math.abs(normalizedPoint.y - top), Math.abs(normalizedPoint.y - bottom));
  }

  if (variant === 'disjointChannel' && a && b && c && d) {
    return Math.min(
      pointToSegmentDistance(normalizedPoint, a, b),
      pointToSegmentDistance(normalizedPoint, c, d),
      pointToSegmentDistance(normalizedPoint, a, c),
      pointToSegmentDistance(normalizedPoint, b, d),
    );
  }

  if (variant === 'pitchfork' && a && b && c) {
    const target = { x: (b.x + c.x) / 2, y: (b.y + c.y) / 2 };
    const offsetUpper = signedDistanceToLine(b, a, target);
    const offsetLower = signedDistanceToLine(c, a, target);
    const dx = target.x - a.x;
    const dy = target.y - a.y;
    const magnitude = Math.hypot(dx, dy) || 1;
    const normal = { x: -dy / magnitude, y: dx / magnitude };
    const upperStart = { x: a.x + normal.x * offsetUpper, y: a.y + normal.y * offsetUpper };
    const upperEnd = { x: target.x + normal.x * offsetUpper, y: target.y + normal.y * offsetUpper };
    const lowerStart = { x: a.x + normal.x * offsetLower, y: a.y + normal.y * offsetLower };
    const lowerEnd = { x: target.x + normal.x * offsetLower, y: target.y + normal.y * offsetLower };
    return Math.min(
      pointToRayDistance(normalizedPoint, a, target),
      pointToRayDistance(normalizedPoint, upperStart, upperEnd),
      pointToRayDistance(normalizedPoint, lowerStart, lowerEnd),
    );
  }

  if (variant === 'schiffPitchfork' && a && b && c) {
    const origin = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
    const target = c;
    const offsetUpper = signedDistanceToLine(a, origin, target);
    const offsetLower = signedDistanceToLine(b, origin, target);
    const dx = target.x - origin.x;
    const dy = target.y - origin.y;
    const magnitude = Math.hypot(dx, dy) || 1;
    const normal = { x: -dy / magnitude, y: dx / magnitude };
    const upperStart = { x: origin.x + normal.x * offsetUpper, y: origin.y + normal.y * offsetUpper };
    const upperEnd = { x: target.x + normal.x * offsetUpper, y: target.y + normal.y * offsetUpper };
    const lowerStart = { x: origin.x + normal.x * offsetLower, y: origin.y + normal.y * offsetLower };
    const lowerEnd = { x: target.x + normal.x * offsetLower, y: target.y + normal.y * offsetLower };
    return Math.min(
      pointToRayDistance(normalizedPoint, origin, target),
      pointToRayDistance(normalizedPoint, upperStart, upperEnd),
      pointToRayDistance(normalizedPoint, lowerStart, lowerEnd),
    );
  }

  if (variant === 'modifiedSchiffPitchfork' && a && b && c) {
    const origin = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
    const target = c;
    const offsetUpper = signedDistanceToLine(a, origin, target) * 0.82;
    const offsetLower = signedDistanceToLine(b, origin, target) * 0.82;
    const dx = target.x - origin.x;
    const dy = target.y - origin.y;
    const magnitude = Math.hypot(dx, dy) || 1;
    const normal = { x: -dy / magnitude, y: dx / magnitude };
    const upperStart = { x: origin.x + normal.x * offsetUpper, y: origin.y + normal.y * offsetUpper };
    const upperEnd = { x: target.x + normal.x * offsetUpper, y: target.y + normal.y * offsetUpper };
    const lowerStart = { x: origin.x + normal.x * offsetLower, y: origin.y + normal.y * offsetLower };
    const lowerEnd = { x: target.x + normal.x * offsetLower, y: target.y + normal.y * offsetLower };
    return Math.min(
      pointToRayDistance(normalizedPoint, origin, target),
      pointToRayDistance(normalizedPoint, upperStart, upperEnd),
      pointToRayDistance(normalizedPoint, lowerStart, lowerEnd),
    );
  }

  if (variant === 'insidePitchfork' && a && b && c) {
    const origin = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
    const target = c;
    const offsetUpper = signedDistanceToLine(a, origin, target) * 0.62;
    const offsetLower = signedDistanceToLine(b, origin, target) * 0.62;
    const dx = target.x - origin.x;
    const dy = target.y - origin.y;
    const magnitude = Math.hypot(dx, dy) || 1;
    const normal = { x: -dy / magnitude, y: dx / magnitude };
    const upperStart = { x: origin.x + normal.x * offsetUpper, y: origin.y + normal.y * offsetUpper };
    const upperEnd = { x: target.x + normal.x * offsetUpper, y: target.y + normal.y * offsetUpper };
    const lowerStart = { x: origin.x + normal.x * offsetLower, y: origin.y + normal.y * offsetLower };
    const lowerEnd = { x: target.x + normal.x * offsetLower, y: target.y + normal.y * offsetLower };
    return Math.min(
      pointToRayDistance(normalizedPoint, origin, target),
      pointToRayDistance(normalizedPoint, upperStart, upperEnd),
      pointToRayDistance(normalizedPoint, lowerStart, lowerEnd),
    );
  }

  if (variant === 'fibCircles' && a && b) {
    return pointToCircleDistance(normalizedPoint, a, b);
  }

  if (variant === 'fibTimeZone' && a && b) {
    const spacing = Math.abs(b.x - a.x);
    if (spacing > 1e-6) {
      const sequence = [1, 2, 3, 5, 8, 13];
      let best = Number.POSITIVE_INFINITY;
      for (const n of sequence) {
        best = Math.min(best, Math.abs(normalizedPoint.x - (a.x + spacing * n)));
      }
      return best;
    }
  }

  if (variant === 'fibTrendTime' && a && b) {
    const base = pointToSegmentDistance(normalizedPoint, a, b);
    const spacing = Math.abs(b.x - a.x);
    if (spacing > 1e-6) {
      const sequence = [1, 2, 3, 5, 8];
      let bestVertical = Number.POSITIVE_INFINITY;
      for (const n of sequence) {
        bestVertical = Math.min(bestVertical, Math.abs(normalizedPoint.x - (b.x + spacing * n)));
      }
      return Math.min(base, bestVertical);
    }
    return base;
  }

  if ((variant === 'gannBox' || variant === 'gannSquare' || variant === 'gannSquareFixed' || variant === 'fixedRangeVolumeProfile') && a && b) {
    return pointToRectDistance(normalizedPoint, a, b);
  }

  if (variant === 'anchoredVolumeProfile' && a) {
    const approxB = { x: a.x + 0.22, y: a.y + 0.4 };
    return pointToRectDistance(normalizedPoint, { x: a.x, y: a.y - 0.4 }, approxB);
  }

  if (variant === 'anchoredVwap' && anchors.length >= 1) {
    return distance(normalizedPoint, anchors[0]);
  }

  if (definition?.family === 'text') {
    const anchor = anchors[0];
    const text = (drawing.text && drawing.text.trim()) || drawing.variant;
    const fontSize = Math.max(10, Number(drawing.options.textSize) || 14);
    const pad = Math.max(3, Number(drawing.options.textPadding) || 4);
    const approxWidthPx = Math.max(fontSize * 0.9, text.length * fontSize * 0.58);
    const align = drawing.options.align ?? 'left';
    const anchorX = anchor.x + 4 / timeScale;
    const anchorY = anchor.y - 4 / priceScale;
    let leftX = anchorX;
    if (align === 'center') {
      leftX -= (approxWidthPx / 2) / timeScale;
    } else if (align === 'right') {
      leftX -= approxWidthPx / timeScale;
    }
    const topY = anchorY - (fontSize + pad) / priceScale;
    const rightX = leftX + (approxWidthPx + pad * 2) / timeScale;
    const bottomY = anchorY + pad / priceScale;
    const boxScore = pointToRectDistance(normalizedPoint, { x: leftX, y: topY }, { x: rightX, y: bottomY });
    return Math.min(boxScore, distance(normalizedPoint, anchor));
  }

  if (definition?.family === 'position' && a && b) {
    const third = anchors[2] ?? { x: b.x, y: a.y - (b.y - a.y) };
    const left = Math.min(a.x, b.x, third.x);
    const right = Math.max(a.x, b.x, third.x);
    const top = Math.min(b.y, third.y);
    const bottom = Math.max(b.y, third.y);
    const entryDistance = Math.abs(normalizedPoint.y - a.y);
    const bodyDistance = pointToRectDistance(normalizedPoint, { x: left, y: top }, { x: right, y: bottom });
    return Math.min(entryDistance, bodyDistance);
  }

  if ((definition?.family === 'shape' || definition?.family === 'measure') && a && b) {
    if (definition.behaviors?.shapeKind === 'circle') {
      return pointToCircleDistance(normalizedPoint, a, b);
    }
    return pointToRectDistance(normalizedPoint, a, b);
  }

  return scorePolyline(normalizedPoint, anchors);
}

export function selectNearestDrawingId(drawings: Drawing[], point: DrawPoint, intent: SelectionIntent = 'select'): string | null {
  if (!drawings.length) return null;
  const pool = drawings.filter((d) => d.visible !== false).slice().reverse();
  let bestId: string | null = null;
  let bestScore = Number.POSITIVE_INFINITY;

  for (const drawing of pool) {
    const score = scoreLineLikeDrawing(drawing, point);
    if (score < bestScore) {
      bestScore = score;
      bestId = drawing.id;
    }
  }

  const limit = intent === 'erase' ? 4.2 : 2.5;
  return bestScore <= limit ? bestId : null;
}
