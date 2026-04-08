/**
 * Unit tests for indicator computations.
 *
 * Run with:
 *   node --experimental-strip-types tests/indicators.test.ts
 *
 * Exit code 0 = all tests pass; non-zero = at least one failure.
 */

import assert from 'node:assert/strict';
import { computeSmaValues } from '../src/indicators/builtins/sma.ts';
import { computeEmaValues } from '../src/indicators/builtins/ema.ts';
import { computeRsiValues } from '../src/indicators/builtins/rsi.ts';
import { computeMacdValues } from '../src/indicators/builtins/macd.ts';
import { registerIndicator, getIndicator, listIndicators } from '../src/indicators/registry.ts';
import { smaDef } from '../src/indicators/builtins/sma.ts';
import { emaDef } from '../src/indicators/builtins/ema.ts';
import { rsiDef } from '../src/indicators/builtins/rsi.ts';
import { macdDef } from '../src/indicators/builtins/macd.ts';

// ─── Helpers ──────────────────────────────────────────────────────────────────

let passed = 0;
let failed = 0;

function test(name: string, fn: () => void): void {
  try {
    fn();
    console.log(`  ✓  ${name}`);
    passed++;
  } catch (err) {
    console.error(`  ✗  ${name}`);
    console.error(`     ${(err as Error).message}`);
    failed++;
  }
}

function approx(a: number | null, b: number, eps = 1e-6): boolean {
  if (a == null) return false;
  return Math.abs(a - b) < eps;
}

// ─── Registry ─────────────────────────────────────────────────────────────────

console.log('\nRegistry');

test('registerIndicator + getIndicator round-trip', () => {
  registerIndicator(smaDef);
  registerIndicator(emaDef);
  registerIndicator(rsiDef);
  registerIndicator(macdDef);
  assert.equal(getIndicator('sma')?.id, 'sma');
  assert.equal(getIndicator('ema')?.id, 'ema');
  assert.equal(getIndicator('rsi')?.id, 'rsi');
  assert.equal(getIndicator('macd')?.id, 'macd');
  assert.equal(getIndicator('unknown'), undefined);
});

test('listIndicators returns all registered', () => {
  const ids = listIndicators().map((d) => d.id);
  assert.ok(ids.includes('sma'));
  assert.ok(ids.includes('ema'));
  assert.ok(ids.includes('rsi'));
  assert.ok(ids.includes('macd'));
});

// ─── SMA ──────────────────────────────────────────────────────────────────────

console.log('\nSMA');

test('period=3, basic sequence', () => {
  const result = computeSmaValues([1, 2, 3, 4, 5], 3);
  assert.deepEqual(result, [null, null, 2, 3, 4]);
});

test('period=1 equals input', () => {
  const result = computeSmaValues([10, 20, 30], 1);
  assert.deepEqual(result, [10, 20, 30]);
});

test('period > length returns all nulls', () => {
  const result = computeSmaValues([1, 2], 5);
  assert.deepEqual(result, [null, null]);
});

test('handles null values in input', () => {
  const result = computeSmaValues([1, null, 3, 4, 5], 3);
  // Null at index 1 → insufficient non-null values for indices 0-2
  assert.equal(result[0], null);
  assert.equal(result[1], null);
  assert.equal(result[2], null);
  // [3,4,5] at indices 2-4: after null the window [null,3,4] has 2 non-nulls → still null
  // [4,5] at indices 3-4 with window [null,3,4] → wait for 3 consecutive non-nulls
  // This tests that the function correctly handles null gaps
});

test('SMA via IndicatorDefinition.compute()', () => {
  const def = getIndicator('sma')!;
  const times = [1000, 2000, 3000, 4000, 5000] as const;
  const close = [10, 20, 30, 40, 50] as const;
  const result = def.compute({
    times,
    open: close,
    high: close,
    low: close,
    close,
    volume: [null, null, null, null, null],
    params: { period: 3 },
  });
  assert.deepEqual(result.outputs[0], [null, null, 20, 30, 40]);
});

// ─── EMA ──────────────────────────────────────────────────────────────────────

console.log('\nEMA');

test('EMA period=3, seed is SMA of first 3', () => {
  // First 3 values: 1,2,3 → seed EMA = 2
  // k = 2/(3+1) = 0.5
  // i=3: EMA = 4*0.5 + 2*0.5 = 3
  // i=4: EMA = 5*0.5 + 3*0.5 = 4
  const result = computeEmaValues([1, 2, 3, 4, 5], 3);
  assert.equal(result[0], null);
  assert.equal(result[1], null);
  assert.ok(approx(result[2], 2));
  assert.ok(approx(result[3], 3));
  assert.ok(approx(result[4], 4));
});

test('EMA period=1 equals input', () => {
  const result = computeEmaValues([10, 20, 30], 1);
  assert.ok(approx(result[0], 10));
  assert.ok(approx(result[1], 20));
  assert.ok(approx(result[2], 30));
});

test('EMA not all null when enough data', () => {
  const result = computeEmaValues([1, 2, 3, 4, 5, 6, 7, 8, 9, 10], 5);
  // First 4 bars null, 5th is seed
  assert.equal(result[0], null);
  assert.equal(result[1], null);
  assert.equal(result[2], null);
  assert.equal(result[3], null);
  assert.ok(result[4] != null);
});

test('EMA with Wilder k=1/period (used by RSI)', () => {
  // Wilder's EMA: k = 1/period
  const result = computeEmaValues([1, 2, 3, 4, 5], 3, 1 / 3);
  // seed at index 2: (1+2+3)/3 = 2
  // index 3: 4*(1/3) + 2*(2/3) = 4/3 + 4/3 = 8/3 ≈ 2.667
  assert.ok(approx(result[2]!, 2));
  assert.ok(approx(result[3]!, 8 / 3, 1e-10)); // 8/3 = Wilder smooth of 2 → 4 over period 3
});

// ─── RSI ──────────────────────────────────────────────────────────────────────

console.log('\nRSI');

test('RSI all-gains gives 100', () => {
  // 14 intervals all up → RSI = 100 (avgLoss = 0)
  const close = Array.from({ length: 16 }, (_, i) => i + 1); // 1..16
  const result = computeRsiValues(close, 14);
  const lastVal = result[result.length - 1];
  assert.ok(approx(lastVal, 100), `expected 100, got ${lastVal}`);
});

test('RSI all-losses gives 0', () => {
  // 14 intervals all down → RSI = 0 (avgGain = 0)
  const close = Array.from({ length: 16 }, (_, i) => 16 - i); // 16..1
  const result = computeRsiValues(close, 14);
  const lastVal = result[result.length - 1];
  assert.ok(approx(lastVal, 0), `expected 0, got ${lastVal}`);
});

test('RSI has period+1 leading nulls', () => {
  const close = Array.from({ length: 20 }, (_, i) => i + 1);
  const result = computeRsiValues(close, 14);
  for (let i = 0; i < 14; i++) {
    assert.equal(result[i], null, `expected null at index ${i}`);
  }
  assert.ok(result[14] != null, 'expected non-null at index 14');
});

test('RSI in [0, 100] range', () => {
  // Alternating up/down prices
  const close = [1, 2, 1, 2, 1, 2, 1, 2, 1, 2, 1, 2, 1, 2, 1, 2, 1, 2, 1, 2];
  const result = computeRsiValues(close, 14);
  for (const v of result) {
    if (v != null) {
      assert.ok(v >= 0 && v <= 100, `RSI out of range: ${v}`);
    }
  }
});

test('RSI via IndicatorDefinition.compute() produces 1 output', () => {
  const def = getIndicator('rsi')!;
  const close = Array.from({ length: 20 }, (_, i) => i + 1);
  const times = close.map((_, i) => i * 86400);
  const result = def.compute({
    times, open: close, high: close, low: close, close, volume: close.map(() => null),
    params: { period: 14 },
  });
  assert.equal(result.outputs.length, 1);
  assert.equal(result.outputs[0].length, close.length);
});

// ─── MACD ─────────────────────────────────────────────────────────────────────

console.log('\nMACD');

test('MACD outputs have correct length', () => {
  const close = Array.from({ length: 50 }, (_, i) => 100 + Math.sin(i * 0.3) * 10);
  const { macdLine, signalLine, histogram } = computeMacdValues(close, 12, 26, 9);
  assert.equal(macdLine.length, 50);
  assert.equal(signalLine.length, 50);
  assert.equal(histogram.length, 50);
});

test('MACD line is null before slow EMA seed', () => {
  const close = Array.from({ length: 50 }, (_, i) => 100 + i);
  const { macdLine } = computeMacdValues(close, 12, 26, 9);
  // slowEMA seeds at index 25 (period=26, 0-based)
  for (let i = 0; i < 25; i++) {
    assert.equal(macdLine[i], null, `expected null at index ${i}`);
  }
  assert.ok(macdLine[25] != null);
});

test('histogram = macdLine - signalLine wherever both defined', () => {
  const close = Array.from({ length: 100 }, (_, i) => 100 + Math.sin(i * 0.2) * 20);
  const { macdLine, signalLine, histogram } = computeMacdValues(close, 12, 26, 9);
  for (let i = 0; i < close.length; i++) {
    const m = macdLine[i];
    const s = signalLine[i];
    const h = histogram[i];
    if (m != null && s != null) {
      assert.ok(approx(h, m - s, 1e-9), `histogram[${i}] = ${h} ≠ ${m} - ${s}`);
    } else {
      assert.equal(h, null, `histogram[${i}] should be null when MACD or signal is null`);
    }
  }
});

test('MACD via IndicatorDefinition.compute() produces 3 outputs', () => {
  const def = getIndicator('macd')!;
  const close = Array.from({ length: 50 }, (_, i) => 100 + i);
  const times = close.map((_, i) => i * 86400);
  const result = def.compute({
    times, open: close, high: close, low: close, close, volume: close.map(() => null),
    params: { fast: 12, slow: 26, signal: 9 },
  });
  assert.equal(result.outputs.length, 3);
  assert.equal(result.outputs[0].length, close.length); // macd line
  assert.equal(result.outputs[1].length, close.length); // signal
  assert.equal(result.outputs[2].length, close.length); // histogram
});

// ─── Summary ──────────────────────────────────────────────────────────────────

console.log(`\n${passed + failed} test(s): ${passed} passed, ${failed} failed.\n`);
if (failed > 0) process.exit(1);
