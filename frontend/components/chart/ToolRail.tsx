import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Activity,
  AlignHorizontalSpaceAround,
  ArrowDown,
  ArrowRight,
  ArrowUp,
  Box,
  Circle,
  Clock3,
  CornerRightUp,
  Crosshair,
  Eraser,
  Fan,
  Flag,
  GitFork,
  GitMerge,
  Info,
  Layers,
  Layers3,
  MessageCircle,
  MessageSquare,
  MessageSquareText,
  Minus,
  MoreHorizontal,
  Mountain,
  MousePointer,
  MousePointer2,
  Move3d,
  MoveHorizontal,
  MoveRight,
  Orbit,
  PencilLine,
  Pin,
  Play,
  RectangleHorizontal,
  Ruler,
  SeparatorVertical,
  Sparkles,
  Square,
  Tag,
  TrendingDown,
  TrendingUp,
  Triangle,
  Type,
  Unlink,
  Waves,
  ZoomIn,
} from 'lucide-react';
import { toolGroups, type CursorMode, type ToolCategory, type ToolGroup, type ToolGroupVariant, type ToolState, type ToolVariant } from '@/services/tools/toolRegistry';

/* ── Icon map ───────────────────────────────────────────────── */
const railIconMap: Record<string, React.ComponentType<any>> = {
  Activity, AlignHorizontalSpaceAround, ArrowDown, ArrowRight, ArrowUp, Box, Circle,
  Clock3, CornerRightUp, Crosshair, Eraser, Fan, Flag, GitFork, GitMerge, Info,
  Layers, Layers3, MessageCircle, MessageSquare, MessageSquareText, Minus, Mountain,
  MousePointer, MousePointer2, Move3d, MoveHorizontal, MoveRight, Orbit, PencilLine,
  Pin, Play, RectangleHorizontal, Ruler, SeparatorVertical, Sparkles, Square, Tag,
  TrendingDown, TrendingUp, Triangle, Type, Unlink, Waves, ZoomIn,
};

/* ── Cursor items (special menu) ────────────────────────────── */
const cursorItems: Array<{ id: CursorMode; label: string; iconKey: string }> = [
  { id: 'cross', label: 'Cross', iconKey: 'Crosshair' },
  { id: 'dot', label: 'Dot', iconKey: 'Circle' },
  { id: 'arrow', label: 'Arrow', iconKey: 'MousePointer' },
  { id: 'demo', label: 'Demonstration', iconKey: 'Play' },
  { id: 'eraser', label: 'Eraser', iconKey: 'Eraser' },
];

const requiredTestIdByVariant: Partial<Record<ToolVariant, string>> = {
  trend: 'tool-trendline',
  ray: 'tool-ray',
  infoLine: 'tool-info-line',
  extendedLine: 'tool-extended-line',
  trendAngle: 'tool-trend-angle',
  hline: 'tool-horizontal-line',
  horizontalRay: 'tool-horizontal-ray',
  vline: 'tool-vertical-line',
  crossLine: 'tool-cross-line',
  channel: 'tool-parallel-channel',
  regressionTrend: 'tool-regression-trend',
  flatTopBottom: 'tool-flat-top-bottom',
  disjointChannel: 'tool-disjoint-channel',
  pitchfork: 'tool-pitchfork',
  schiffPitchfork: 'tool-schiff-pitchfork',
  modifiedSchiffPitchfork: 'tool-modified-schiff-pitchfork',
  insidePitchfork: 'tool-inside-pitchfork',
  fibRetracement: 'fib-retracement',
  fibExtension: 'fib-extension',
  fibChannel: 'fib-channel',
  fibTimeZone: 'fib-time-zone',
  fibSpeedResistFan: 'fib-speed-resistance-fan',
  fibTrendTime: 'fib-trend-time',
  fibCircles: 'fib-circles',
  fibSpiral: 'fib-spiral',
  fibSpeedResistArcs: 'fib-speed-resistance-arcs',
  fibWedge: 'fib-wedge',
  pitchfan: 'pitchfan',
  gannBox: 'gann-box',
  gannSquareFixed: 'gann-square-fixed',
  gannSquare: 'gann-square',
  gannFan: 'gann-fan',
};

/* ── Props ──────────────────────────────────────────────────── */
type ToolRailProps = {
  toolState: ToolState;
  expandedCategory: ToolCategory | null;
  setExpandedCategory: (value: ToolCategory | null) => void;
  onVariant: (group: ToolCategory, variant: ToolVariant) => void;
  cursorMode: CursorMode;
  setCursorMode: (mode: CursorMode) => void;
  valuesTooltip: boolean;
  setValuesTooltip: (value: boolean) => void;
  isMobile: boolean;
};

export default function ToolRail({
  toolState,
  expandedCategory,
  setExpandedCategory,
  onVariant,
  cursorMode,
  setCursorMode,
  valuesTooltip,
  setValuesTooltip,
  isMobile,
}: ToolRailProps) {
  const railRef = useRef<HTMLDivElement>(null);
  const submenuRef = useRef<HTMLDivElement>(null);
  const [submenuStyle, setSubmenuStyle] = useState<React.CSSProperties>({});

  const activeGroup = toolGroups.find((g) => g.id === expandedCategory) ?? null;
  const railGroups = toolGroups;
  const overflowGroups = toolGroups;

  /* ── Position submenu anchored to rail button ─────────────── */
  const positionSubmenu = useCallback(() => {
    if (!expandedCategory || !railRef.current) return;
    const btn = railRef.current.querySelector(`[data-rail-group="${expandedCategory}"]`) as HTMLElement | null;
    if (!btn) return;
    const btnRect = btn.getBoundingClientRect();
    const railRect = railRef.current.getBoundingClientRect();
    const viewH = window.innerHeight;

    let top = btnRect.top;
    if (top + 280 > viewH) top = Math.max(4, viewH - 400);

    setSubmenuStyle({
      position: 'fixed',
      top,
      left: railRect.right + 2,
      zIndex: 60,
    });
  }, [expandedCategory]);

  useEffect(() => {
    positionSubmenu();
    window.addEventListener('resize', positionSubmenu);
    return () => window.removeEventListener('resize', positionSubmenu);
  }, [positionSubmenu]);

  /* ── Close on outside click or ESC ────────────────────────── */
  useEffect(() => {
    if (!expandedCategory) return;
    const onPointerDown = (e: MouseEvent) => {
      const target = e.target as Node;
      if (railRef.current?.contains(target)) return;
      if (submenuRef.current?.contains(target)) return;
      setExpandedCategory(null);
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setExpandedCategory(null);
    };
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [expandedCategory, setExpandedCategory]);

  const hasActiveVariantInGroup = (groupId: ToolCategory) =>
    toolGroups.find((g) => g.id === groupId)?.variants.some((v) => v.id === toolState.variant) ?? false;

  if (isMobile) return null;

  /* ── Render a tool variant button ─────────────────────────── */
  const renderVariant = (variant: ToolGroupVariant, group: ToolGroup) => {
    const Icon = railIconMap[variant.iconKey] ?? Move3d;
    const active = toolState.variant === variant.id;
    const disabled = !variant.implemented;
    const legacyTestId = `tool-${variant.id}`;
    const requiredTestId = requiredTestIdByVariant[variant.id];
    const testId = requiredTestId ?? legacyTestId;
    return (
      <button
        key={variant.id}
        type="button"
        data-testid={testId}
        data-legacy-testid={legacyTestId}
        disabled={disabled}
        onClick={() => {
          if (disabled) return;
          onVariant(group.id, variant.id);
          setExpandedCategory(null);
        }}
        className={`flex w-full items-center gap-2.5 rounded-md px-2.5 py-[7px] text-[13px] transition ${
          disabled
            ? 'cursor-default text-muted-foreground/40'
            : active
              ? 'bg-primary/25 text-primary'
              : 'text-foreground/80 hover:bg-primary/10 hover:text-foreground'
        }`}
        title={disabled ? `${variant.label} — Coming soon` : variant.label}
      >
        <Icon size={16} className={disabled ? 'opacity-40' : ''} />
        <span className="flex-1 text-left">{variant.label}</span>
        {requiredTestId && requiredTestId !== legacyTestId ? <span className="sr-only" data-testid={legacyTestId} /> : null}
        {disabled && <span className="text-[9px] uppercase tracking-wider text-muted-foreground/50">Soon</span>}
      </button>
    );
  };

  /* ── Build submenu content ────────────────────────────────── */
  const renderSubmenuContent = () => {
    if (!activeGroup) return null;

    const sections = new Map<string, ToolGroupVariant[]>();
    let hasSubSections = false;
    for (const v of activeGroup.variants) {
      const sec = v.subSection ?? '';
      if (sec) hasSubSections = true;
      const arr = sections.get(sec) ?? [];
      arr.push(v);
      sections.set(sec, arr);
    }

    if (!hasSubSections) {
      return activeGroup.variants.map((v) => renderVariant(v, activeGroup));
    }

    const entries = Array.from(sections.entries());
    return entries.map(([sectionName, variants], idx) => (
      <div key={sectionName || idx}>
        {sectionName && (
          <div className={`px-2.5 pb-1 pt-2 text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground/70 ${idx > 0 ? 'mt-1.5 border-t border-primary/10 pt-2.5' : ''}`}>
            {sectionName}
          </div>
        )}
        {variants.map((v) => renderVariant(v, activeGroup))}
      </div>
    ));
  };

  /* ── Cursor menu ──────────────────────────────────────────── */
  const renderCursorMenu = () => (
    <div>
      {cursorItems.map((item) => {
        const Icon = railIconMap[item.iconKey] ?? Crosshair;
        const active = cursorMode === item.id;
        return (
          <button
            key={item.id}
            type="button"
            data-testid={`cursor-${item.id}`}
            onClick={() => {
              setCursorMode(item.id);
              if (item.id !== 'eraser') setExpandedCategory(null);
            }}
            className={`flex w-full items-center gap-2.5 rounded-md px-2.5 py-[7px] text-[13px] transition ${
              active
                ? 'bg-primary/25 text-primary'
                : 'text-foreground/80 hover:bg-primary/10 hover:text-foreground'
            }`}
          >
            <Icon size={16} />
            <span>{item.label}</span>
          </button>
        );
      })}
      <div className="mt-1.5 border-t border-primary/10 px-2.5 py-2">
        <label className="flex cursor-pointer items-center justify-between text-[12px] text-foreground/80" data-testid="cursor-values-tooltip-toggle">
          <span>Values tooltip on long press</span>
          <button
            type="button"
            role="switch"
            aria-checked={valuesTooltip}
            onClick={() => setValuesTooltip(!valuesTooltip)}
            className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors ${valuesTooltip ? 'bg-primary' : 'bg-muted-foreground/30'}`}
          >
            <span className={`inline-block h-3.5 w-3.5 rounded-full bg-white transition-transform ${valuesTooltip ? 'translate-x-[18px]' : 'translate-x-[3px]'}`} />
          </button>
        </label>
      </div>
    </div>
  );

  const renderMoreToolsMenu = () => (
    <div className="space-y-2">
      {overflowGroups.map((group) => (
        <div key={group.id}>
          <div className="px-2.5 pb-1 pt-1.5 text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground/70">{group.label}</div>
          {group.variants.map((variant) => renderVariant(variant, group))}
        </div>
      ))}
    </div>
  );

  return (
    <>
      {/* Rail */}
      <div
        ref={railRef}
        data-testid="tool-rail"
        className="flex w-[44px] shrink-0 flex-col items-center gap-0.5 overflow-y-auto border-r border-primary/15 bg-background/60 py-1.5 backdrop-blur-xl"
      >
        {railGroups.map((group) => {
          const Icon = railIconMap[group.railIcon] ?? Move3d;
          const isOpen = expandedCategory === group.id;
          const isActive = group.id === 'cursor' ? false : hasActiveVariantInGroup(group.id);
          return (
            <button
              key={group.id}
              type="button"
              data-testid={`rail-${group.id}`}
              data-rail-group={group.id}
              onClick={() => setExpandedCategory(isOpen ? null : group.id)}
              className={`flex h-[36px] w-[36px] items-center justify-center rounded-md transition ${
                isOpen
                  ? 'bg-primary/20 text-primary'
                  : isActive
                    ? 'bg-primary/10 text-primary/80'
                    : 'text-muted-foreground hover:bg-primary/10 hover:text-foreground'
              }`}
              title={group.label}
            >
              <Icon size={18} />
            </button>
          );
        })}

        {overflowGroups.length > 0 ? <div className="my-0.5 h-px w-7 bg-border/40" /> : null}
        {overflowGroups.length > 0 ? (
          <button
            type="button"
            data-testid="rail-more-tools"
            data-rail-group="system"
            onClick={() => setExpandedCategory(expandedCategory === 'system' ? null : 'system')}
            className={`mb-1 flex h-[36px] w-[36px] items-center justify-center rounded-md transition ${
              expandedCategory === 'system'
                ? 'bg-primary/20 text-primary'
                : 'text-muted-foreground hover:bg-primary/10 hover:text-foreground'
            }`}
            title="More tools"
          >
            <MoreHorizontal size={18} />
          </button>
        ) : null}
      </div>

      {/* Floating popover anchored to rail icon */}
      {expandedCategory && (
        <div
          ref={submenuRef}
          data-testid="tool-menu-popover"
          style={submenuStyle}
          className="min-w-[220px] max-w-[280px] rounded-xl border border-primary/25 bg-background/95 p-1.5 shadow-xl shadow-black/40 backdrop-blur-xl"
        >
          <div data-testid={expandedCategory === 'cursor' ? 'menu-cursor' : expandedCategory === 'system' ? 'menu-more-tools' : `menu-${expandedCategory}`} className="mb-1 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground/70">
            {expandedCategory === 'cursor' ? 'Cursor' : expandedCategory === 'system' ? 'More tools' : activeGroup?.label ?? ''}
          </div>
          <div className="max-h-[60vh] space-y-0.5 overflow-y-auto">
            {expandedCategory === 'cursor' ? renderCursorMenu() : expandedCategory === 'system' ? renderMoreToolsMenu() : renderSubmenuContent()}
          </div>
        </div>
      )}
    </>
  );
}
