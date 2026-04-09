# Chart Roadmap

## Current Status
- Chart engine: Canvas2D runtime only, no TradingView widget or lightweight-charts runtime.
- Chart types implemented: 14 / 20+
- Indicators implemented: 29 / 100+
- UX parity: in progress

## UX Checklist
- [x] Smooth pan/zoom with cursor-anchored wheel zoom
- [x] Crosshair with coordinate mapping and snap support
- [x] Draw trend lines and shapes
- [x] Select drawings from the object tree
- [x] Delete drawings
- [x] Undo / redo drawing actions
- [x] Drawing overlay persists across pan/zoom
- [x] Ghosting / frame residue fixed
- [ ] Whole-object drag move for all drawing types
- [ ] Pane resize by divider drag
- [ ] Screenshot export of chart + drawings
- [ ] Keyboard Escape cancels drawing in all tool modes
- [ ] Accessibility polish for tool focus states
- [ ] 60fps interactions on 10k bars
- [ ] Listener duplication / memory leak audit

## Chart Types Checklist
- [x] Candlestick
- [x] Line
- [x] Area
- [x] Baseline
- [x] Histogram
- [x] Bar
- [x] Heikin Ashi
- [x] OHLC
- [x] Hollow Candles
- [x] Step Line
- [x] Range Area
- [x] Mountain Area
- [x] Candles + Volume
- [x] Line + Volume
- [ ] Renko
- [ ] Range Bars
- [ ] Kagi
- [ ] Point & Figure
- [ ] Three-line break
- [ ] Additional premium transforms to reach 20+

## Indicator Checklist
- [x] sma
- [x] ema
- [x] rsi
- [x] macd
- [x] wma
- [x] vwap
- [x] bbands
- [x] donchian
- [x] keltner
- [x] atr
- [x] supertrend
- [x] psar
- [x] pivot
- [x] stochastic
- [x] cci
- [x] roc
- [x] momentum
- [x] williams_r
- [x] mfi
- [x] obv
- [x] cmf
- [x] adx
- [x] aroon
- [x] trix
- [x] ultimate
- [x] chaikin_osc
- [x] awesome
- [x] dpo
- [x] ichimoku
- [ ] 70+ additional indicators across trend, momentum, volatility, volume, oscillators

## Next Milestones
1. Finish whole-object move, multi-select, and richer selection handles.
2. Expose pane divider resizing in the UI and validate with interaction tests.
3. Add premium transforms: Renko, Range Bars, Kagi, Point & Figure, Three-line break.
4. Expand indicators in batches until 100+ with unit coverage per indicator.
5. Add export and accessibility polish.
