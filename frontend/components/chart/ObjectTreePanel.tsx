import { Eye, EyeOff, Lock, LockOpen, Trash2 } from 'lucide-react';
import type { Drawing } from '@/services/tools/toolRegistry';

type ObjectTreePanelProps = {
  open: boolean;
  drawings: Drawing[];
  selectedDrawingId: string | null;
  onSelect: (id: string) => void;
  onToggleVisible: (id: string) => void;
  onToggleLocked: (id: string) => void;
  onDelete: (id: string) => void;
};

export default function ObjectTreePanel({
  open,
  drawings,
  selectedDrawingId,
  onSelect,
  onToggleVisible,
  onToggleLocked,
  onDelete,
}: ObjectTreePanelProps) {
  if (!open) return null;

  return (
    <aside className="absolute bottom-3 right-3 z-30 max-h-[42vh] w-[320px] overflow-y-auto rounded-xl border border-primary/25 bg-background/85 p-2 backdrop-blur-xl">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">Object Tree</span>
        <span className="text-[11px] text-muted-foreground">{drawings.length} objects</span>
      </div>
      <div className="space-y-1">
        {drawings.slice().reverse().map((drawing) => {
          const selected = selectedDrawingId === drawing.id;
          return (
            <div key={drawing.id} className={`rounded-md border px-2 py-1.5 text-[11px] ${selected ? 'border-primary/45 bg-primary/10' : 'border-border/60 bg-background/40'}`}>
              <div className="flex items-center justify-between gap-1">
                <button type="button" onClick={() => onSelect(drawing.id)} className="text-left text-foreground/90 hover:text-foreground">
                  {drawing.variant}
                </button>
                <div className="flex items-center gap-1">
                  <button type="button" onClick={() => onToggleVisible(drawing.id)} className="rounded p-1 text-muted-foreground hover:bg-primary/10 hover:text-foreground">
                    {drawing.visible === false ? <EyeOff size={12} /> : <Eye size={12} />}
                  </button>
                  <button type="button" onClick={() => onToggleLocked(drawing.id)} className="rounded p-1 text-muted-foreground hover:bg-primary/10 hover:text-foreground">
                    {drawing.locked ? <Lock size={12} /> : <LockOpen size={12} />}
                  </button>
                  <button type="button" onClick={() => onDelete(drawing.id)} className="rounded p-1 text-muted-foreground hover:bg-destructive/20 hover:text-destructive">
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </aside>
  );
}
