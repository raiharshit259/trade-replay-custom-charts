import type React from 'react';
import type { RefObject } from 'react';
import type { ToolVariant } from '@/services/tools/toolRegistry';
import { toolCursor } from '@/services/tools/toolRegistry';

type ChartCanvasProps = {
  chartContainerRef: RefObject<HTMLDivElement>;
  overlayRef: RefObject<HTMLCanvasElement>;
  activeVariant: ToolVariant;
  onPointerDown: (event: React.PointerEvent<HTMLCanvasElement>) => void;
  onPointerMove: (event: React.PointerEvent<HTMLCanvasElement>) => void;
  onPointerUp: (event: React.PointerEvent<HTMLCanvasElement>) => void;
  onContextMenu: (event: React.MouseEvent<HTMLCanvasElement>) => void;
};

export default function ChartCanvas({
  chartContainerRef,
  overlayRef,
  activeVariant,
  onPointerDown,
  onPointerMove,
  onPointerUp,
  onContextMenu,
}: ChartCanvasProps) {
  return (
    <>
      <div ref={chartContainerRef} className="h-full w-full" />
      <canvas
        ref={overlayRef}
        aria-label="chart-drawing-overlay"
        tabIndex={0}
        className={`absolute inset-0 z-10 ${activeVariant === 'none' ? 'pointer-events-none' : 'pointer-events-auto'}`}
        style={{ cursor: toolCursor[activeVariant] }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onContextMenu={onContextMenu}
      />
    </>
  );
}
