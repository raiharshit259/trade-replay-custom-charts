/**
 * Auto-registers all built-in indicators.
 *
 * Import this module once (done automatically by createChart.ts) to ensure
 * SMA, EMA, RSI, and MACD are available via `getIndicator()`.
 *
 * Calling `registerBuiltins()` multiple times is safe — a guard flag
 * prevents duplicate registration.
 */

import { registerIndicator } from '../registry.ts';
import { smaDef }  from './sma.ts';
import { emaDef }  from './ema.ts';
import { rsiDef }  from './rsi.ts';
import { macdDef } from './macd.ts';

let _registered = false;

export function registerBuiltins(): void {
  if (_registered) return;
  _registered = true;
  registerIndicator(smaDef);
  registerIndicator(emaDef);
  registerIndicator(rsiDef);
  registerIndicator(macdDef);
}
