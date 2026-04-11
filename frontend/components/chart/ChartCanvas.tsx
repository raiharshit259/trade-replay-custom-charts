import type React from 'react';
import type { RefObject } from 'react';
import type { ToolVariant } from '@/services/tools/toolRegistry';
import { toolCursor } from '@/services/tools/toolRegistry';

type ChartCanvasProps = {
  chartContainerRef: RefObject<HTMLDivElement>;
  overlayRef: RefObject<HTMLCanvasElement>;
  activeVariant: ToolVariant;
  overlayInteractive?: boolean;
  overlayCursor?: string;
  onPointerDown: (event: React.PointerEvent<HTMLCanvasElement>) => void;
  onPointerMove: (event: React.PointerEvent<HTMLCanvasElement>) => void;
  onPointerUp: (event: React.PointerEvent<HTMLCanvasElement>) => void;
  onContextMenu: (event: React.MouseEvent<HTMLCanvasElement>) => void;
};

export default function ChartCanvas({
  chartContainerRef,
  overlayRef,
  activeVariant,
  overlayInteractive,
  overlayCursor,
  onPointerDown,
  onPointerMove,
  onPointerUp,
  onContextMenu,
}: ChartCanvasProps) {
  const isInteractive = overlayInteractive ?? activeVariant !== 'none';
  const cursor = overlayCursor ?? toolCursor[activeVariant];

  return (
    <>
      <div ref={chartContainerRef} className="h-full w-full" />
      <canvas
        ref={overlayRef}
        aria-label="chart-drawing-overlay"
        tabIndex={0}
        className={`absolute inset-0 z-10 ${isInteractive ? 'pointer-events-auto' : 'pointer-events-none'}`}
        style={{ cursor }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onContextMenu={onContextMenu}
      />
    </>
  );
}
