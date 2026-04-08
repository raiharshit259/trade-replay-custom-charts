/**
 * Auto-registers all built-in indicators.
 *
 * Import this module once (done automatically by createChart.ts) to ensure
 * SMA, EMA, RSI, and MACD are available via `getIndicator()`.
 */

import { registerIndicator } from '../registry.ts';
import { smaDef }  from './sma.ts';
import { emaDef }  from './ema.ts';
import { rsiDef }  from './rsi.ts';
import { macdDef } from './macd.ts';

export function registerBuiltins(): void {
  registerIndicator(smaDef);
  registerIndicator(emaDef);
  registerIndicator(rsiDef);
  registerIndicator(macdDef);
}
