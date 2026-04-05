import { ChevronDown, Search } from 'lucide-react';
import { useMemo, useState } from 'react';

type Option<T extends string> = {
  value: T;
  label: string;
  subtitle?: string;
};

type PremiumSelectProps<T extends string> = {
  value: T;
  options: Array<Option<T>>;
  onChange: (next: T) => void;
  placeholder?: string;
  searchable?: boolean;
  className?: string;
};

export default function PremiumSelect<T extends string>({
  value,
  options,
  onChange,
  placeholder,
  searchable = false,
  className,
}: PremiumSelectProps<T>) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');

  const selected = options.find((option) => option.value === value);

  const filtered = useMemo(() => {
    if (!searchable || !query.trim()) return options;
    const q = query.toLowerCase();
    return options.filter((option) => option.label.toLowerCase().includes(q) || option.subtitle?.toLowerCase().includes(q));
  }, [options, query, searchable]);

  return (
    <div className={`relative ${className || ''}`}>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="inline-flex min-w-[160px] items-center justify-between gap-2 rounded-lg border border-primary/20 bg-background/55 px-3 py-1.5 text-sm text-foreground transition hover:border-primary/45 hover:bg-background/75"
      >
        <span className="truncate">{selected?.label || placeholder || 'Select'}</span>
        <ChevronDown size={14} className={`transition ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute left-0 top-[calc(100%+6px)] z-50 w-full rounded-lg border border-primary/25 bg-background/95 p-2 shadow-[0_16px_34px_hsl(var(--background)/0.55)]">
          {searchable && (
            <div className="mb-2 flex items-center gap-2 rounded-md border border-border/60 bg-background/70 px-2 py-1">
              <Search size={13} className="text-muted-foreground" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search"
                className="w-full bg-transparent text-xs text-foreground outline-none"
              />
            </div>
          )}
          <div className="max-h-[220px] overflow-y-auto">
            {filtered.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => {
                  onChange(option.value);
                  setOpen(false);
                  setQuery('');
                }}
                className={`w-full rounded-md px-2 py-1.5 text-left transition ${value === option.value ? 'bg-primary/20 text-primary' : 'text-foreground hover:bg-secondary/45'}`}
              >
                <div className="text-xs font-medium">{option.label}</div>
                {option.subtitle && <div className="text-[10px] text-muted-foreground">{option.subtitle}</div>}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
