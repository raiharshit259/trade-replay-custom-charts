import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, Check, ChevronDown, Globe, Search, X } from "lucide-react";
import AssetAvatar from "@/components/ui/AssetAvatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { fetchAssetSearchFilters, searchAssets, type AssetCategory, type AssetSearchFilterOption, type AssetSearchItem } from "@/lib/assetSearch";

function typeDisplay(item: AssetSearchItem): string {
  if (item.category === "funds") return `fund ${(item.instrumentType || "etf").toLowerCase()}`;
  if (item.category === "stocks") return "stock";
  if (item.category === "crypto") return "crypto";
  if (item.category === "forex") return "forex";
  if (item.category === "indices") return "index";
  if (item.category === "bonds") return "bond";
  if (item.category === "economy") return "economy";
  if (item.category === "options") return "option";
  return "";
}

const categories: Array<{ id: "all" | AssetCategory; label: string }> = [
  { id: "all", label: "All" },
  { id: "stocks", label: "Stocks" },
  { id: "funds", label: "Funds" },
  { id: "futures", label: "Futures" },
  { id: "forex", label: "Forex" },
  { id: "crypto", label: "Crypto" },
  { id: "indices", label: "Indices" },
  { id: "bonds", label: "Bonds" },
  { id: "economy", label: "Economy" },
  { id: "options", label: "Options" },
];

interface SymbolSearchModalProps {
  open: boolean;
  selectedSymbol: string;
  onOpenChange: (next: boolean) => void;
  onSelect: (item: AssetSearchItem) => void;
}

export default function SymbolSearchModal({ open, selectedSymbol, onOpenChange, onSelect }: SymbolSearchModalProps) {
  const [view, setView] = useState<"search" | "sources" | "countries" | "futureDetail">("search");
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<(typeof categories)[number]["id"]>("all");
  const [country, setCountry] = useState("all");
  const [type, setType] = useState("all");
  const [sector, setSector] = useState("all");
  const [source, setSource] = useState("all");
  const [exchangeType, setExchangeType] = useState("all");
  const [rows, setRows] = useState<AssetSearchItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeFilters, setActiveFilters] = useState<string[]>([]);
  const [countryOptions, setCountryOptions] = useState<AssetSearchFilterOption[]>([]);
  const [typeOptions, setTypeOptions] = useState<AssetSearchFilterOption[]>([]);
  const [sectorOptions, setSectorOptions] = useState<AssetSearchFilterOption[]>([]);
  const [sourceOptions, setSourceOptions] = useState<AssetSearchFilterOption[]>([]);
  const [exchangeTypeOptions, setExchangeTypeOptions] = useState<AssetSearchFilterOption[]>([]);
  const [sourceUiType, setSourceUiType] = useState<"modal" | "dropdown">("modal");
  const [detailItem, setDetailItem] = useState<AssetSearchItem | null>(null);
  const resultCache = useRef(new Map<string, AssetSearchItem[]>());

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    void (async () => {
      try {
        const response = await fetchAssetSearchFilters({ category: category === "all" ? undefined : category });
        if (cancelled) return;
        setActiveFilters(response.activeFilters ?? []);
        setCountryOptions(response.countries ?? []);
        setTypeOptions(response.types ?? []);
        setSectorOptions(response.sectors ?? []);
        setSourceOptions(response.sources ?? []);
        setExchangeTypeOptions(response.exchangeTypes ?? []);
        setSourceUiType(response.sourceUiType ?? "modal");
      } catch {
        if (cancelled) return;
        setActiveFilters([]);
        setCountryOptions([]);
        setTypeOptions([]);
        setSectorOptions([]);
        setSourceOptions([]);
        setExchangeTypeOptions([]);
        setSourceUiType("modal");
      }
    })();
    return () => { cancelled = true; };
  }, [open, category]);

  useEffect(() => {
    setCountry("all");
    setType("all");
    setSector("all");
    setSource("all");
    setExchangeType("all");
    setView("search");
  }, [category]);

  useEffect(() => {
    if (!open) return;
    const timer = window.setTimeout(async () => {
      const effectiveQuery = query.trim();
      const key = JSON.stringify({ query: effectiveQuery, category, country, type, sector, source, exchangeType });
      const cached = resultCache.current.get(key);
      if (cached) { setRows(cached); return; }

      setLoading(true);
      try {
        const response = await searchAssets({
          q: effectiveQuery,
          category: category === "all" ? undefined : category,
          country: country === "all" ? undefined : country,
          type: type === "all" ? undefined : type,
          sector: sector === "all" ? undefined : sector,
          source: source === "all" ? undefined : source,
          exchangeType: exchangeType === "all" ? undefined : exchangeType,
          page: 1,
          limit: 50,
        });
        resultCache.current.set(key, response.assets);
        setRows(response.assets);
      } catch { setRows([]); }
      finally { setLoading(false); }
    }, 300);
    return () => window.clearTimeout(timer);
  }, [open, query, category, country, type, sector, source, exchangeType]);

  useEffect(() => { if (!open) return; setQuery(""); }, [open, selectedSymbol]);

  const selectedCountryLabel = useMemo(() => countryOptions.find((o) => o.value === country)?.label || "All countries", [country, countryOptions]);
  const selectedTypeLabel = useMemo(() => typeOptions.find((o) => o.value === type)?.label || "All types", [type, typeOptions]);
  const selectedSectorLabel = useMemo(() => sectorOptions.find((o) => o.value === sector)?.label || (sectorOptions[0]?.label ?? "All sectors"), [sector, sectorOptions]);
  const selectedSourceLabel = useMemo(() => sourceOptions.find((o) => o.value === source)?.label || "All sources", [source, sourceOptions]);
  const selectedExTypeLabel = useMemo(() => exchangeTypeOptions.find((o) => o.value === exchangeType)?.label || "All exchange types", [exchangeType, exchangeTypeOptions]);

  // ── Futures detail sub-view ──
  if (view === "futureDetail" && detailItem) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="w-[min(960px,94vw)] max-w-none gap-0 border-border/80 bg-background/95 p-0 backdrop-blur-xl">
          <DialogHeader className="flex flex-row items-center gap-3 px-5 pt-5 pb-3">
            <button type="button" onClick={() => { setView("search"); setDetailItem(null); }} className="rounded-full p-1 hover:bg-secondary/60" aria-label="Back">
              <ArrowLeft size={20} />
            </button>
            <DialogTitle className="font-display text-xl">Contract Details</DialogTitle>
          </DialogHeader>
          <div className="px-6 pb-6 space-y-5">
            <div className="flex items-center gap-4">
              <AssetAvatar src={detailItem.iconUrl} label={detailItem.name} className="h-14 w-14 shrink-0 rounded-full object-cover ring-2 ring-border/60" />
              <div className="min-w-0">
                <p className="text-xl font-bold font-display text-foreground">{detailItem.ticker}</p>
                <p className="text-sm text-muted-foreground truncate">{detailItem.name}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <DetailField label="Symbol" value={detailItem.ticker} />
              <DetailField label="Exchange" value={detailItem.exchange} />
              <DetailField label="Type" value={detailItem.instrumentType || "Future"} />
              <DetailField label="Category" value={detailItem.sector || "—"} />
              <DetailField label="Country" value={detailItem.country || "Global"} />
              <DetailField label="Source" value={detailItem.source || detailItem.exchange || "—"} />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => { setView("search"); setDetailItem(null); }}
                className="rounded-lg border border-border px-4 py-2 text-sm hover:bg-secondary/45 transition-colors"
              >
                Back
              </button>
              <button
                type="button"
                onClick={() => { onSelect(detailItem); onOpenChange(false); }}
                className="rounded-lg bg-primary px-4 py-2 text-sm text-primary-foreground transition-colors hover:bg-primary/90"
              >
                Select Contract
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // ── Sources sub-view ──
  if (view === "sources") {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="w-[min(960px,94vw)] max-w-none gap-0 border-border/80 bg-background/95 p-0 backdrop-blur-xl">
          <DialogHeader className="flex flex-row items-center gap-3 px-5 pt-5 pb-3">
            <button type="button" onClick={() => setView("search")} className="rounded-full p-1 hover:bg-secondary/60" aria-label="Back">
              <ArrowLeft size={20} />
            </button>
            <DialogTitle className="font-display text-xl">Sources</DialogTitle>
          </DialogHeader>
          <ModalPanel
            options={sourceOptions}
            value={source}
            sectionLabel={category === "crypto" ? "CRYPTOCURRENCY" : category === "forex" ? "FOREX & CFD" : category === "indices" ? "INDICES" : "SOURCES"}
            onChange={(v) => { setSource(v); setView("search"); }}
          />
        </DialogContent>
      </Dialog>
    );
  }

  // ── Countries sub-view ──
  if (view === "countries") {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="w-[min(960px,94vw)] max-w-none gap-0 border-border/80 bg-background/95 p-0 backdrop-blur-xl">
          <DialogHeader className="flex flex-row items-center gap-3 px-5 pt-5 pb-3">
            <button type="button" onClick={() => setView("search")} className="rounded-full p-1 hover:bg-secondary/60" aria-label="Back">
              <ArrowLeft size={20} />
            </button>
            <DialogTitle className="font-display text-xl">Countries</DialogTitle>
          </DialogHeader>
          <ModalPanel
            options={countryOptions}
            value={country}
            sectionLabel="COUNTRIES"
            onChange={(v) => { setCountry(v); setView("search"); }}
            showFlags
          />
        </DialogContent>
      </Dialog>
    );
  }

  // ── Main search view ──
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[min(960px,94vw)] max-w-none gap-3 border-border/80 bg-background/95 p-0 backdrop-blur-xl">
        <DialogHeader className="px-6 pt-5 pb-1">
          <DialogTitle className="font-display text-[1.9rem]">Symbol Search</DialogTitle>
        </DialogHeader>

        <div className="px-4 pb-4">
          {/* Search input */}
          <div className="rounded-xl border border-border/70 bg-secondary/20 px-3 py-2">
            <div className="flex items-center gap-2">
              <Search size={18} className="text-muted-foreground" />
              <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Symbol, ISIN, or CUSIP" className="h-9 w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground" />
              {query ? <button type="button" onClick={() => setQuery("")} className="rounded-full p-1 text-muted-foreground hover:bg-secondary/60" aria-label="Clear"><X size={14} /></button> : null}
            </div>
          </div>

          {/* Category tabs */}
          <div className="mt-3 flex flex-wrap gap-1.5">
            {categories.map((c) => (
              <button key={c.id} type="button" onClick={() => setCategory(c.id)} className={`rounded-full border px-3 py-1 text-xs transition-colors ${category === c.id ? "border-primary/70 bg-primary/15 text-foreground" : "border-border/70 bg-secondary/30 text-muted-foreground hover:text-foreground"}`}>
                {c.label}
              </button>
            ))}
          </div>

          {/* Filter bar — only if activeFilters has items */}
          {activeFilters.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2 text-xs">
              {activeFilters.includes("source") && sourceUiType === "modal" && (
                <ModalTriggerButton label={source === "all" ? "All sources" : selectedSourceLabel} onClick={() => setView("sources")} />
              )}
              {activeFilters.includes("source") && sourceUiType === "dropdown" && (
                <FilterDropdown label="All sources" triggerLabel={selectedSourceLabel} value={source} options={sourceOptions} onChange={setSource} />
              )}
              {activeFilters.includes("country") && (
                <ModalTriggerButton label={country === "all" ? "All countries" : selectedCountryLabel} onClick={() => setView("countries")} />
              )}
              {activeFilters.includes("type") && (
                <FilterDropdown label={typeOptions[0]?.label ?? "All types"} triggerLabel={selectedTypeLabel} value={type} options={typeOptions} onChange={setType} />
              )}
              {activeFilters.includes("sector") && (
                <FilterDropdown label={sectorOptions[0]?.label ?? "All sectors"} triggerLabel={selectedSectorLabel} value={sector} options={sectorOptions} onChange={setSector} />
              )}
              {activeFilters.includes("exchangeType") && (
                <FilterDropdown label="All exchange types" triggerLabel={selectedExTypeLabel} value={exchangeType} options={exchangeTypeOptions} onChange={setExchangeType} />
              )}
            </div>
          )}

          {/* Results */}
          <div className="mt-3 max-h-[58vh] overflow-y-auto rounded-xl border border-border/70">
            {rows.map((item) => (
              <button
                key={`${item.ticker}-${item.exchange}`}
                type="button"
                onClick={() => {
                  if (item.category === "futures") {
                    setDetailItem(item);
                    setView("futureDetail");
                  } else {
                    onSelect(item);
                    onOpenChange(false);
                  }
                }}
                className={`grid w-full grid-cols-[1fr_auto] items-center gap-4 border-b border-border/60 px-3 py-2.5 text-left transition-colors hover:bg-secondary/45 ${item.ticker === selectedSymbol ? "bg-secondary/65" : "bg-secondary/20"}`}
              >
                <div className="flex min-w-0 items-center gap-2.5">
                  <AssetAvatar src={item.iconUrl} label={item.name} className="h-7 w-7 shrink-0 rounded-full object-cover" />
                  <span className="shrink-0 text-sm font-semibold text-foreground">{item.ticker}</span>
                  <span className="truncate text-sm text-muted-foreground">{item.name}</span>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground whitespace-nowrap">
                  {typeDisplay(item) && <span>{typeDisplay(item)}</span>}
                  <span className="font-medium">{item.exchange}</span>
                  {item.country && item.country !== "GLOBAL" && (
                    <AssetAvatar src={`https://flagcdn.com/${item.country.toLowerCase()}.svg`} label={item.country} className="h-4 w-4 rounded-full object-cover" />
                  )}
                </div>
              </button>
            ))}
            {!loading && rows.length === 0 ? <p className="px-3 py-5 text-center text-sm text-muted-foreground">No symbols found</p> : null}
            {loading ? <p className="px-3 py-4 text-center text-xs text-muted-foreground">Loading symbols...</p> : null}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/* ────── ModalTriggerButton: opens a sub-view (sources/countries) ────── */
function ModalTriggerButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs text-foreground hover:bg-secondary/45">
      <span>{label}</span>
      <ChevronDown size={13} className="text-muted-foreground" />
    </button>
  );
}

/* ────── ModalPanel: full-panel view for sources/countries ────── */
function ModalPanel({ options, value, sectionLabel, showFlags, onChange }: {
  options: AssetSearchFilterOption[];
  value: string;
  sectionLabel: string;
  showFlags?: boolean;
  onChange: (v: string) => void;
}) {
  const [query, setQuery] = useState("");
  const filtered = useMemo(() => {
    if (!query.trim()) return options;
    const q = query.trim().toLowerCase();
    return options.filter((o) => o.label.toLowerCase().includes(q));
  }, [options, query]);

  const allOption = filtered.find((o) => o.value === "all");
  const rest = filtered.filter((o) => o.value !== "all");

  return (
    <div className="px-5 pb-5">
      {/* Search */}
      <div className="rounded-xl border border-border/70 bg-secondary/20 px-3 py-2 mb-3">
        <div className="flex items-center gap-2">
          <Search size={16} className="text-muted-foreground" />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search" className="h-7 w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground" />
        </div>
      </div>

      {/* "All" option */}
      {allOption && (
        <button
          type="button"
          onClick={() => onChange("all")}
          className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm mb-3 ${value === "all" ? "bg-foreground text-background" : "hover:bg-secondary/45"}`}
        >
          <Globe size={16} />
          <span className="font-medium">{allOption.label}</span>
        </button>
      )}

      {/* Section label */}
      <div className="mb-2 px-1 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">{sectionLabel}</div>

      {/* Two-column grid */}
      <div className="max-h-[50vh] overflow-y-auto">
        <div className="grid grid-cols-2 gap-x-4 gap-y-0.5">
          {rest.map((opt) => {
            const selected = value === opt.value;
            const flag = showFlags ? countryFlagUrl(opt.value) : "";
            const icon = opt.icon || flag;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => onChange(opt.value)}
                className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-left transition-colors ${selected ? "bg-secondary/65" : "hover:bg-secondary/35"}`}
              >
                {icon ? <AssetAvatar src={icon} label={opt.label} className="h-6 w-6 shrink-0 rounded-full object-cover" /> : <div className="h-6 w-6 shrink-0 rounded-full bg-muted" />}
                <div className="min-w-0">
                  <p className={`truncate text-sm ${selected ? "font-semibold text-foreground" : "text-foreground"}`}>{opt.label}</p>
                  {opt.subtitle && <p className="truncate text-xs text-muted-foreground">{opt.subtitle}</p>}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* ────── FilterDropdown: Popover-based dropdown for type/sector/exchangeType ────── */
function FilterDropdown({ label, triggerLabel, value, options, onChange }: {
  label: string;
  triggerLabel: string;
  value: string;
  options: AssetSearchFilterOption[];
  onChange: (v: string) => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button type="button" className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs text-foreground hover:bg-secondary/45">
          <span>{triggerLabel}</span>
          <ChevronDown size={13} className={`text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`} />
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" sideOffset={6} className="w-[260px] border-border/80 bg-background/95 p-0">
        <div className="max-h-[320px] overflow-y-auto py-1">
          {options.map((opt) => {
            const selected = value === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => { onChange(opt.value); setOpen(false); }}
                className={`flex w-full items-center justify-between px-3 py-1.5 text-left text-xs transition-colors ${selected ? "bg-secondary/65 text-foreground" : "text-muted-foreground hover:bg-secondary/35 hover:text-foreground"}`}
              >
                <span>{opt.label}</span>
                {selected ? <Check size={12} className="text-foreground" /> : null}
              </button>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
}

function countryFlagUrl(value: string): string {
  const code = value.trim().toLowerCase();
  if (!code || code === "all" || code === "global") return "";
  if (code.length !== 2) return "";
  return `https://flagcdn.com/${code}.svg`;
}

/* ────── DetailField: key-value row for futures detail ────── */
function DetailField({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border/60 bg-secondary/20 px-3 py-2.5">
      <p className="text-[10px] uppercase tracking-widest text-muted-foreground">{label}</p>
      <p className="text-sm font-medium text-foreground mt-0.5">{value}</p>
    </div>
  );
}
