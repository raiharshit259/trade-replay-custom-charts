import { useCallback, useEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';
import { Dialog, DialogOverlay, DialogPortal } from '@/components/ui/dialog';

/* ─── Types ─────────────────────────────────────────────────────────────── */

export interface ChartPromptRequest {
  title: string;
  label: string;
  defaultValue: string;
  placeholder?: string;
  /** Show a live preview of the value (e.g. emoji preview) */
  preview?: boolean;
}

interface ChartPromptModalProps {
  request: ChartPromptRequest | null;
  onConfirm: (value: string) => void;
  onCancel: () => void;
}

/* ─── Component ─────────────────────────────────────────────────────────── */

export default function ChartPromptModal({ request, onConfirm, onCancel }: ChartPromptModalProps) {
  const [value, setValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (request) {
      setValue(request.defaultValue);
      // focus after dialog renders
      requestAnimationFrame(() => inputRef.current?.select());
    }
  }, [request]);

  const handleSubmit = useCallback(() => {
    const trimmed = value.trim();
    onConfirm(trimmed || request?.defaultValue || '');
  }, [value, request, onConfirm]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        handleSubmit();
      }
      if (e.key === 'Escape') {
        e.preventDefault();
        onCancel();
      }
    },
    [handleSubmit, onCancel],
  );

  if (!request) return null;

  return (
    <Dialog open onOpenChange={(open) => { if (!open) onCancel(); }}>
      <DialogPortal>
        <DialogOverlay className="bg-black/60" />
        <div
          data-testid="chart-prompt-modal"
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          onClick={(e) => { if (e.target === e.currentTarget) onCancel(); }}
        >
          <div className="w-full max-w-sm rounded-xl border border-primary/25 bg-background shadow-2xl shadow-black/60">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-primary/15 px-4 py-3">
              <span className="text-sm font-semibold text-foreground">{request.title}</span>
              <button
                type="button"
                data-testid="chart-prompt-cancel"
                onClick={onCancel}
                className="rounded-md p-1 text-muted-foreground hover:bg-primary/10 hover:text-foreground"
              >
                <X size={16} />
              </button>
            </div>

            {/* Body */}
            <div className="px-4 py-4">
              {/* Preview */}
              {request.preview && value.trim() && (
                <div className="mb-3 flex items-center justify-center rounded-lg border border-border/50 bg-muted/20 py-3">
                  <span className="text-3xl">{value}</span>
                </div>
              )}

              <label className="mb-1.5 block text-xs font-medium text-muted-foreground">{request.label}</label>
              <input
                ref={inputRef}
                data-testid="chart-prompt-input"
                type="text"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={request.placeholder || request.defaultValue}
                className="w-full rounded-lg border border-border/70 bg-background/70 px-3 py-2 text-sm text-foreground outline-none transition focus:border-primary/50 focus:ring-1 focus:ring-primary/30 placeholder:text-muted-foreground"
                autoFocus
              />
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-2 border-t border-primary/10 px-4 py-3">
              <button
                type="button"
                data-testid="chart-prompt-cancel-btn"
                onClick={onCancel}
                className="rounded-lg border border-border/70 px-4 py-1.5 text-xs font-medium text-muted-foreground transition hover:bg-muted/30 hover:text-foreground"
              >
                Cancel
              </button>
              <button
                type="button"
                data-testid="chart-prompt-ok"
                onClick={handleSubmit}
                className="rounded-lg bg-emerald-600 px-4 py-1.5 text-xs font-semibold text-white transition hover:bg-emerald-500"
              >
                OK
              </button>
            </div>
          </div>
        </div>
      </DialogPortal>
    </Dialog>
  );
}
