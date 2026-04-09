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
import { wmaDef } from './wma.ts';
import { vwapDef } from './vwap.ts';
import { bbandsDef } from './bbands.ts';
import { donchianDef } from './donchian.ts';
import { keltnerDef } from './keltner.ts';
import { atrDef } from './atr.ts';
import { supertrendDef } from './supertrend.ts';
import { psarDef } from './psar.ts';
import { pivotDef } from './pivot.ts';
import { stochasticDef } from './stochastic.ts';
import { cciDef } from './cci.ts';
import { rocDef } from './roc.ts';
import { momentumDef } from './momentum.ts';
import { williamsRDef } from './williamsR.ts';
import { mfiDef } from './mfi.ts';
import { obvDef } from './obv.ts';
import { cmfDef } from './cmf.ts';
import { adxDef } from './adx.ts';
import { aroonDef } from './aroon.ts';
import { trixDef } from './trix.ts';
import { ultimateDef } from './ultimate.ts';
import { chaikinOscDef } from './chaikinOsc.ts';
import { awesomeDef } from './awesome.ts';
import { dpoDef } from './dpo.ts';
import { ichimokuDef } from './ichimoku.ts';
import {
  hmaDef,
  demaDef,
  temaDef,
  zlemaDef,
  kamaDef,
  almaDef,
  lsmaDef,
  stochRsiDef,
  rviDef,
  ppoDef,
  pvoDef,
  tsiDef,
  dxDef,
  crsiDef,
  elderRayDef,
  cmoDef,
  fisherDef,
  kdjDef,
  bollingerPercentBDef,
  bollingerBandwidthDef,
  chaikinVolatilityDef,
  stddevDef,
  varianceDef,
  adlDef,
  forceIndexDef,
  eomDef,
  nviDef,
  pviDef,
  vptDef,
  aroonOscillatorDef,
  vortexDef,
} from './batch2.ts';
import {
  trimaDef,
  smmaDef,
  apoDef,
  smiDef,
  choppinessDef,
  ulcerIndexDef,
  massIndexDef,
  qstickDef,
  relativeVolumeDef,
  balanceOfPowerDef,
  emvOscDef,
  volatilityRatioDef,
  linearRegSlopeDef,
  linearRegInterceptDef,
  linearRegAngleDef,
  priceChannelMidDef,
  medianPriceDef,
  typicalPriceDef,
  weightedCloseDef,
  volumeOscillatorDef,
} from './batch3.ts';
import {
  coppockCurveDef,
  percentileRankDef,
  normalizedAtrDef,
  priceChannelWidthDef,
  closeLocationValueDef,
  candleBodyDef,
  candleBodyPercentDef,
  upperWickDef,
  lowerWickDef,
  trueRangePercentDef,
  rollingHighDef,
  rollingLowDef,
  volumeZScoreDef,
  volumeSmaRatioDef,
  rangeSmaRatioDef,
  cumulativeVolumeDeltaDef,
  rollingReturnDef,
  logReturnDef,
  volatilityEmaDef,
  breakoutStrengthDef,
  trendStrengthDef,
} from './batch4.ts';

let _registered = false;

export function registerBuiltins(): void {
  if (_registered) return;
  _registered = true;
  registerIndicator(smaDef);
  registerIndicator(emaDef);
  registerIndicator(rsiDef);
  registerIndicator(macdDef);
  registerIndicator(wmaDef);
  registerIndicator(vwapDef);
  registerIndicator(bbandsDef);
  registerIndicator(donchianDef);
  registerIndicator(keltnerDef);
  registerIndicator(atrDef);
  registerIndicator(supertrendDef);
  registerIndicator(psarDef);
  registerIndicator(pivotDef);
  registerIndicator(stochasticDef);
  registerIndicator(cciDef);
  registerIndicator(rocDef);
  registerIndicator(momentumDef);
  registerIndicator(williamsRDef);
  registerIndicator(mfiDef);
  registerIndicator(obvDef);
  registerIndicator(cmfDef);
  registerIndicator(adxDef);
  registerIndicator(aroonDef);
  registerIndicator(trixDef);
  registerIndicator(ultimateDef);
  registerIndicator(chaikinOscDef);
  registerIndicator(awesomeDef);
  registerIndicator(dpoDef);
  registerIndicator(ichimokuDef);
  registerIndicator(hmaDef);
  registerIndicator(demaDef);
  registerIndicator(temaDef);
  registerIndicator(zlemaDef);
  registerIndicator(kamaDef);
  registerIndicator(almaDef);
  registerIndicator(lsmaDef);
  registerIndicator(stochRsiDef);
  registerIndicator(rviDef);
  registerIndicator(ppoDef);
  registerIndicator(pvoDef);
  registerIndicator(tsiDef);
  registerIndicator(dxDef);
  registerIndicator(crsiDef);
  registerIndicator(elderRayDef);
  registerIndicator(cmoDef);
  registerIndicator(fisherDef);
  registerIndicator(kdjDef);
  registerIndicator(bollingerPercentBDef);
  registerIndicator(bollingerBandwidthDef);
  registerIndicator(chaikinVolatilityDef);
  registerIndicator(stddevDef);
  registerIndicator(varianceDef);
  registerIndicator(adlDef);
  registerIndicator(forceIndexDef);
  registerIndicator(eomDef);
  registerIndicator(nviDef);
  registerIndicator(pviDef);
  registerIndicator(vptDef);
  registerIndicator(aroonOscillatorDef);
  registerIndicator(vortexDef);
  registerIndicator(trimaDef);
  registerIndicator(smmaDef);
  registerIndicator(apoDef);
  registerIndicator(smiDef);
  registerIndicator(choppinessDef);
  registerIndicator(ulcerIndexDef);
  registerIndicator(massIndexDef);
  registerIndicator(qstickDef);
  registerIndicator(relativeVolumeDef);
  registerIndicator(balanceOfPowerDef);
  registerIndicator(emvOscDef);
  registerIndicator(volatilityRatioDef);
  registerIndicator(linearRegSlopeDef);
  registerIndicator(linearRegInterceptDef);
  registerIndicator(linearRegAngleDef);
  registerIndicator(priceChannelMidDef);
  registerIndicator(medianPriceDef);
  registerIndicator(typicalPriceDef);
  registerIndicator(weightedCloseDef);
  registerIndicator(volumeOscillatorDef);
  registerIndicator(coppockCurveDef);
  registerIndicator(percentileRankDef);
  registerIndicator(normalizedAtrDef);
  registerIndicator(priceChannelWidthDef);
  registerIndicator(closeLocationValueDef);
  registerIndicator(candleBodyDef);
  registerIndicator(candleBodyPercentDef);
  registerIndicator(upperWickDef);
  registerIndicator(lowerWickDef);
  registerIndicator(trueRangePercentDef);
  registerIndicator(rollingHighDef);
  registerIndicator(rollingLowDef);
  registerIndicator(volumeZScoreDef);
  registerIndicator(volumeSmaRatioDef);
  registerIndicator(rangeSmaRatioDef);
  registerIndicator(cumulativeVolumeDeltaDef);
  registerIndicator(rollingReturnDef);
  registerIndicator(logReturnDef);
  registerIndicator(volatilityEmaDef);
  registerIndicator(breakoutStrengthDef);
  registerIndicator(trendStrengthDef);
}
