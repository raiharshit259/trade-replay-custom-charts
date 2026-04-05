import { ChevronLeft, ChevronRight, CalendarDays } from 'lucide-react';
import { useMemo, useState } from 'react';

function toInputDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function buildCalendarGrid(cursor: Date): Array<Date | null> {
  const first = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
  const startDay = first.getDay();
  const days = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0).getDate();
  const cells: Array<Date | null> = [];

  for (let i = 0; i < startDay; i += 1) cells.push(null);
  for (let d = 1; d <= days; d += 1) cells.push(new Date(cursor.getFullYear(), cursor.getMonth(), d));
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

type PremiumDatePickerProps = {
  label: string;
  value: string;
  onChange: (next: string) => void;
};

export default function PremiumDatePicker({ label, value, onChange }: PremiumDatePickerProps) {
  const initial = value ? new Date(`${value}T00:00:00`) : new Date();
  const [open, setOpen] = useState(false);
  const [cursor, setCursor] = useState(new Date(initial.getFullYear(), initial.getMonth(), 1));
  const grid = useMemo(() => buildCalendarGrid(cursor), [cursor]);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="inline-flex items-center gap-2 rounded-lg border border-primary/20 bg-background/55 px-3 py-1.5 text-xs text-foreground transition hover:border-primary/45 hover:bg-background/75"
      >
        <CalendarDays size={14} className="text-primary" />
        <span>{label}: {value || 'Select date'}</span>
      </button>

      {open && (
        <div className="absolute left-0 top-[calc(100%+6px)] z-50 w-[280px] rounded-lg border border-primary/25 bg-background/95 p-2 shadow-[0_16px_34px_hsl(var(--background)/0.55)]">
          <div className="mb-2 flex items-center justify-between">
            <button type="button" className="rounded p-1 hover:bg-secondary/45" onClick={() => setCursor((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1))}><ChevronLeft size={14} /></button>
            <div className="text-xs font-semibold">{cursor.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}</div>
            <button type="button" className="rounded p-1 hover:bg-secondary/45" onClick={() => setCursor((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1))}><ChevronRight size={14} /></button>
          </div>
          <div className="mb-1 grid grid-cols-7 text-center text-[10px] text-muted-foreground">
            {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((d) => <div key={d}>{d}</div>)}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {grid.map((date, index) => {
              const iso = date ? toInputDate(date) : '';
              const active = iso === value;
              return (
                <button
                  key={`${iso}-${index}`}
                  type="button"
                  disabled={!date}
                  className={`rounded px-1 py-1 text-[11px] transition ${!date ? 'opacity-0' : active ? 'bg-primary/25 text-primary' : 'hover:bg-secondary/45'}`}
                  onClick={() => {
                    if (!date) return;
                    onChange(iso);
                    setOpen(false);
                  }}
                >
                  {date?.getDate()}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
