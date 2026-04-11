# TradingView Parity Inventory

> Last updated: 2026-04-11 · Branch: `chart-engine`

## Tier Definitions

| Tier | Description |
|------|-------------|
| **Tier 1** | Core features required for a usable charting platform. Must be stable before moving on. |
| **Tier 2** | Advanced tools and features that bring TradingView-like depth. |
| **Tier 3** | Polish, niche tools, and workflow optimizations. |

---

## A) Chart Types (20 total)

| Chart Type | Status | Tier | Notes | E2E Test |
|-----------|--------|------|-------|----------|
| Candlestick | ✅ Supported | 1 | Default type | Yes |
| Line | ✅ Supported | 1 | | Yes |
| Area | ✅ Supported | 1 | | Yes |
| Baseline | ✅ Supported | 2 | | Yes (dropdown) |
| Histogram | ✅ Supported | 2 | | Yes (dropdown) |
| Bar | ✅ Supported | 2 | | Yes (dropdown) |
| OHLC | ✅ Supported | 2 | | Yes (dropdown) |
| Heikin Ashi | ✅ Supported | 2 | | Yes (dropdown) |
| Hollow Candles | ✅ Supported | 2 | | Yes (dropdown) |
| Step Line | ✅ Supported | 2 | | Yes (dropdown) |
| Range Area | ✅ Supported | 2 | | Yes (dropdown) |
| Mountain Area | ✅ Supported | 2 | | Yes (dropdown) |
| Renko | ✅ Supported | 3 | Custom transform | Yes (dropdown) |
| Range Bars | ✅ Supported | 3 | Custom transform | Yes (dropdown) |
| 3-Line Break | ✅ Supported | 3 | Custom transform | Yes (dropdown) |
| Kagi | ✅ Supported | 3 | Custom transform | Yes (dropdown) |
| Point & Figure | ✅ Supported | 3 | Custom transform | Yes (dropdown) |
| Brick | ✅ Supported | 3 | Custom transform | Yes (dropdown) |
| Candles + Volume | ✅ Supported | 2 | | Yes (dropdown) |
| Line + Volume | ✅ Supported | 2 | | Yes (dropdown) |

---

## B) Drawing Tools (44 registered)

### Trend Lines (Tier 1)

| Tool | Status | Rendering | Object Tree | Select/Move | Undo/Redo | Magnet | E2E Test |
|------|--------|-----------|-------------|-------------|-----------|--------|----------|
| Trend Line | ✅ Supported | ✅ | ✅ | ✅ | ✅ | ✅ | Yes |
| Ray | ✅ Supported | ✅ | ✅ | ✅ | ✅ | ✅ | No |
| Extended Line | ✅ Supported | ✅ | ✅ | ✅ | ✅ | ✅ | No |
| Channel | ✅ Supported | ⚠️ Partial | ✅ | ✅ | ✅ | ✅ | No |

### Annotations (Tier 1)

| Tool | Status | Rendering | Object Tree | Select/Move | Undo/Redo | Magnet | E2E Test |
|------|--------|-----------|-------------|-------------|-----------|--------|----------|
| Horizontal Line | ✅ Supported | ✅ | ✅ | ✅ | ✅ | ✅ | No |
| Vertical Line | ✅ Supported | ✅ | ✅ | ✅ | ✅ | ✅ | No |
| Horizontal Ray | ✅ Supported | ✅ | ✅ | ✅ | ✅ | ✅ | No |
| Vertical Marker | ✅ Supported | ✅ | ✅ | ✅ | ✅ | ✅ | No |

### Shapes (Tier 1)

| Tool | Status | Rendering | Object Tree | Select/Move | Undo/Redo | Magnet | E2E Test |
|------|--------|-----------|-------------|-------------|-----------|--------|----------|
| Rectangle | ✅ Supported | ✅ | ✅ | ✅ | ✅ | ✅ | No |
| Circle | ✅ Supported | ✅ | ✅ | ✅ | ✅ | ✅ | No |
| Triangle | ✅ Supported | ✅ | ✅ | ✅ | ✅ | ✅ | No |
| Brush | ✅ Supported | ⚠️ Basic | ✅ | ✅ | ✅ | ✅ | No |

### Text (Tier 1)

| Tool | Status | Rendering | Object Tree | Select/Move | Undo/Redo | Magnet | E2E Test |
|------|--------|-----------|-------------|-------------|-----------|--------|----------|
| Anchored Text | ✅ Supported | ✅ | ✅ | ✅ | ✅ | ✅ | Yes |
| Note | ✅ Supported | ✅ | ✅ | ✅ | ✅ | ✅ | No |
| Price Label | ✅ Supported | ✅ | ✅ | ✅ | ✅ | ✅ | No |
| Callout | ✅ Supported | ✅ | ✅ | ✅ | ✅ | ✅ | No |
| Comment | ✅ Supported | ✅ | ✅ | ✅ | ✅ | ✅ | No |
| Pin | ✅ Supported | ✅ | ✅ | ✅ | ✅ | ✅ | No |
| Emoji | ✅ Supported | ✅ | ✅ | ✅ | ✅ | ✅ | No |
| Icon Up/Down/Flag | ✅ Supported | ✅ | ✅ | ✅ | ✅ | ✅ | No |

### Measure (Tier 1)

| Tool | Status | Rendering | Object Tree | Select/Move | Undo/Redo | Magnet | E2E Test |
|------|--------|-----------|-------------|-------------|-----------|--------|----------|
| Measure | ✅ Supported | ⚠️ Basic line only | ✅ | ✅ | ✅ | ✅ | No |
| Zoom | ✅ Supported | ✅ | ✅ | ✅ | ✅ | ✅ | No |

### Fibonacci / Gann (Tier 2)

| Tool | Status | Rendering | Object Tree | Select/Move | Undo/Redo | Magnet | E2E Test |
|------|--------|-----------|-------------|-------------|-----------|--------|----------|
| Fib Retracement | ✅ Supported | ✅ | ✅ | ✅ | ✅ | ✅ | No |
| Fib Extension | ✅ Supported | ✅ | ✅ | ✅ | ✅ | ✅ | No |
| Fib Channel | ✅ Supported | ⚠️ Basic | ✅ | ✅ | ✅ | ✅ | No |
| Fib Arcs | ✅ Supported | ⚠️ Basic | ✅ | ✅ | ✅ | ✅ | No |
| Fib Fan | ✅ Supported | ⚠️ Basic | ✅ | ✅ | ✅ | ✅ | No |
| Fib Spiral | ✅ Supported | ⚠️ Basic | ✅ | ✅ | ✅ | ✅ | No |
| Fib Time Zones | ✅ Supported | ⚠️ Basic | ✅ | ✅ | ✅ | ✅ | No |
| Gann Box | ✅ Supported | ⚠️ Basic | ✅ | ✅ | ✅ | ✅ | No |
| Gann Square | ✅ Supported | ⚠️ Basic | ✅ | ✅ | ✅ | ✅ | No |
| Gann Fan | ✅ Supported | ⚠️ Basic | ✅ | ✅ | ✅ | ✅ | No |

### Pitchforks (Tier 2)

| Tool | Status | Rendering | Object Tree | Select/Move | Undo/Redo | Magnet | E2E Test |
|------|--------|-----------|-------------|-------------|-----------|--------|----------|
| Pitchfork | ✅ Supported | ⚠️ Basic | ✅ | ✅ | ✅ | ✅ | No |
| Schiff Pitchfork | ✅ Supported | ⚠️ Basic | ✅ | ✅ | ✅ | ✅ | No |
| Inside Pitchfork | ✅ Supported | ⚠️ Basic | ✅ | ✅ | ✅ | ✅ | No |

### Patterns (Tier 2)

| Tool | Status | Rendering | Object Tree | Select/Move | Undo/Redo | Magnet | E2E Test |
|------|--------|-----------|-------------|-------------|-----------|--------|----------|
| XABCD Pattern | ✅ Supported | ⚠️ Basic | ✅ | ✅ | ✅ | ✅ | No |
| Triangle Pattern | ✅ Supported | ⚠️ Basic | ✅ | ✅ | ✅ | ✅ | No |
| Head & Shoulders | ✅ Supported | ⚠️ Basic | ✅ | ✅ | ✅ | ✅ | No |
| Elliott Impulse | ✅ Supported | ⚠️ Basic | ✅ | ✅ | ✅ | ✅ | No |
| Elliott Correction | ✅ Supported | ⚠️ Basic | ✅ | ✅ | ✅ | ✅ | No |

### Positions (Tier 2)

| Tool | Status | Rendering | Object Tree | Select/Move | Undo/Redo | Magnet | E2E Test |
|------|--------|-----------|-------------|-------------|-----------|--------|----------|
| Long Position | ✅ Supported | ⚠️ Basic | ✅ | ✅ | ✅ | ✅ | No |
| Short Position | ✅ Supported | ⚠️ Basic | ✅ | ✅ | ✅ | ✅ | No |

---

## C) Indicators (101 total)

| Category | Count | Status | E2E Test |
|----------|-------|--------|----------|
| Moving Averages (SMA, EMA, WMA, VWAP, HMA, DEMA, TEMA, ZLEMA, KAMA, ALMA, LSMA) | 11 | ✅ All pass unit tests | MACD add/remove |
| Momentum (RSI, MACD, Stochastic, etc.) | 15 | ✅ All pass unit tests | MACD search/add |
| Volatility (ATR, Bollinger, Keltner, etc.) | 10 | ✅ All pass unit tests | Bollinger search |
| Trend (ADX, Aroon, PSAR, Ichimoku, etc.) | 15 | ✅ All pass unit tests | ADX add |
| Volume (OBV, MFI, CMF, etc.) | 13 | ✅ All pass unit tests | No |
| Price Action (CCI, Williams %R, etc.) | 17 | ✅ All pass unit tests | No |
| Advanced (Ulcer, Mass Index, etc.) | 12 | ✅ All pass unit tests | No |
| Statistical (SMMA, TRIMA, etc.) | 9 | ✅ All pass unit tests | No |

Searchable dropdown: ✅ Implemented  
Top 5 quick-add: ✅ Implemented (SMA, EMA, VWAP, RSI, MACD)  
Keyboard navigation: ✅ Implemented  

---

## D) Multi-Chart (Super Charts)

| Feature | Status | E2E Test |
|---------|--------|----------|
| 1×1 layout | ✅ Supported | No |
| 1×2 horizontal | ✅ Supported | No |
| 2×1 vertical | ✅ Supported | No |
| 2+1 layout | ✅ Supported | No |
| 2×2 layout | ✅ Supported | No |
| Active pane highlight | ✅ Supported | No |
| Independent drawings per pane | ✅ Supported | No |
| Independent indicators per pane | ✅ Supported | No |

---

## E) Core UX Features

| Feature | Status | E2E Test |
|---------|--------|----------|
| Undo/Redo | ✅ Supported | Yes |
| Object Tree (select/lock/hide/delete) | ✅ Supported | Partial |
| Magnet mode (OHLC snap) | ✅ Supported | Yes |
| Crosshair snap modes (free/time/ohlc) | ✅ Supported | No |
| Export PNG | ✅ Supported | Yes |
| Go to Live button | ✅ Supported | No |
| OHLC status row | ✅ Supported | Yes |
| Toolbar collapse/expand | ✅ Supported | Yes |
| Toolbox collapse/expand | ✅ Supported | Yes |
| Drawing anchoring (time/price) | ✅ Supported | Yes |
| Drawing visibility during resize | ✅ Supported | Yes |
| Mobile touch modes (pan/zoom/scroll) | ✅ Supported | No |

---

## F) Known Rendering Gaps (Tier 2+ tools)

The following tool families have registrations and basic line/shape rendering, but lack family-specific overlay rendering:

- **Channel**: Renders as 2-point line, should render parallel fill region
- **Fib Arcs / Fan / Spiral**: Render basic fib levels, should render arcs/fan lines/spiral curves
- **Gann tools**: Render as fib levels, should render Gann-specific geometry
- **Pitchforks**: Render as multi-point lines, should render median line + parallels
- **Patterns**: Render as polylines, should render labeled pattern structures
- **Positions**: Render as rectangles, should render entry/SL/TP zones with labels
- **Measure**: Renders as line, should render distance/bars/percentage label

---

## G) Missing Features (not yet implemented)

| Feature | Tier | Priority |
|---------|------|----------|
| Drawing serialization (save/load JSON) | 2 | Medium |
| Drawing templates/presets | 3 | Low |
| Indicator settings UI per instance | 2 | Medium |
| Alert lines | 3 | Low |
| Replay/playback controls | 2 | Medium |
| Timeframe selector | 2 | Medium |
| Symbol search | 2 | Medium |
| Crosshair sync across multi-chart panes | 3 | Low |
| Drawing sync across panes | 3 | Low |
| Right-click context menu on drawings | 2 | Medium |
| Keyboard shortcuts (Ctrl+Z, Ctrl+Y, Del) | 2 | Medium — Del exists |
