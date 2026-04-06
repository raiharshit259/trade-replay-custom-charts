import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, Check, ChevronDown, Globe, Search, X } from "lucide-react";
import AssetAvatar from "@/components/ui/AssetAvatar";
import { marketMeta } from "@/data/assetCatalog";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  fetchAssetSearchFilters,
  searchAssets,
  type AssetCategory,
  type AssetSearchFilterOption,
  type AssetSearchItem,
} from "@/lib/assetSearch";

const marketIconByCategory = marketMeta.reduce((accumulator, item) => {
  accumulator[item.key] = item.iconUrl;
  return accumulator;
}, {} as Record<AssetCategory, string>);

const categories: Array<{ id: "all" | AssetCategory; label: string; iconUrl?: string }> = [
  { id: "all", label: "All" },
  { id: "stocks", label: "Stocks", iconUrl: marketIconByCategory.stocks },
  { id: "funds", label: "Funds", iconUrl: marketIconByCategory.funds },
  { id: "futures", label: "Futures", iconUrl: marketIconByCategory.futures },
  { id: "forex", label: "Forex", iconUrl: marketIconByCategory.forex },
  { id: "crypto", label: "Crypto", iconUrl: marketIconByCategory.crypto },
  { id: "indices", label: "Indices", iconUrl: marketIconByCategory.indices },
  { id: "bonds", label: "Bonds", iconUrl: marketIconByCategory.bonds },
  { id: "economy", label: "Economy", iconUrl: marketIconByCategory.economy },
  { id: "options", label: "Options", iconUrl: marketIconByCategory.options },
];

interface SymbolSearchModalProps {
  open: boolean;
  selectedSymbol: string;
  onOpenChange: (next: boolean) => void;
  onSelect: (item: AssetSearchItem) => void;
  initialCategory?: "all" | AssetCategory;
}

export default function SymbolSearchModal({
  open,
  selectedSymbol,
  onOpenChange,
  onSelect,
  initialCategory = "all",
}: SymbolSearchModalProps) {
  const [view, setView] = useState<"search" | "sources" | "countries" | "futureContracts">("search");
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<(typeof categories)[number]["id"]>(initialCategory);
  const [country, setCountry] = useState("all");
  const [type, setType] = useState("all");
  const [sector, setSector] = useState("all");
  const [source, setSource] = useState("all");
  const [exchangeType, setExchangeType] = useState("all");
  const [futureCategory, setFutureCategory] = useState("all");
  const [economyCategory, setEconomyCategory] = useState("all");

  const [rows, setRows] = useState<AssetSearchItem[]>([]);
  const [loading, setLoading] = useState(false);

  const [activeFilters, setActiveFilters] = useState<string[]>([]);
  const [countryOptions, setCountryOptions] = useState<AssetSearchFilterOption[]>([]);
  const [typeOptions, setTypeOptions] = useState<AssetSearchFilterOption[]>([]);
  const [sectorOptions, setSectorOptions] = useState<AssetSearchFilterOption[]>([]);
  const [sourceOptions, setSourceOptions] = useState<AssetSearchFilterOption[]>([]);
  const [exchangeTypeOptions, setExchangeTypeOptions] = useState<AssetSearchFilterOption[]>([]);
  const [futureCategoryOptions, setFutureCategoryOptions] = useState<AssetSearchFilterOption[]>([]);
  const [economyCategoryOptions, setEconomyCategoryOptions] = useState<AssetSearchFilterOption[]>([]);
  const [sourceUiType, setSourceUiType] = useState<"modal" | "dropdown">("modal");

  const [selectedFutureRoot, setSelectedFutureRoot] = useState<AssetSearchItem | null>(null);

  const resultCache = useRef(new Map<string, AssetSearchItem[]>());

  useEffect(() => {
    if (!open) return;
    setCategory(initialCategory);
  }, [initialCategory, open]);

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
        setFutureCategoryOptions(response.futureCategories ?? []);
        setEconomyCategoryOptions(response.economyCategories ?? []);
        setSourceUiType(response.sourceUiType ?? "modal");
      } catch {
        if (cancelled) return;
        setActiveFilters([]);
        setCountryOptions([]);
        setTypeOptions([]);
        setSectorOptions([]);
        setSourceOptions([]);
        setExchangeTypeOptions([]);
        setFutureCategoryOptions([]);
        setEconomyCategoryOptions([]);
        setSourceUiType("modal");
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [category, open]);

  useEffect(() => {
    setCountry("all");
    setType("all");
    setSector("all");
    setSource("all");
    setExchangeType("all");
    setFutureCategory("all");
    setEconomyCategory("all");
    setView("search");
    setSelectedFutureRoot(null);
  }, [category]);

  useEffect(() => {
    if (!open) return;

    const timer = window.setTimeout(async () => {
      const effectiveQuery = query.trim();
      const cacheKey = JSON.stringify({
        q: effectiveQuery,
        category,
        country,
        type,
        sector,
        source,
        exchangeType,
        futureCategory,
        economyCategory,
      });

      const cached = resultCache.current.get(cacheKey);
      if (cached) {
        setRows(cached);
        return;
      }

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
          futureCategory: futureCategory === "all" ? undefined : futureCategory,
          economyCategory: economyCategory === "all" ? undefined : economyCategory,
          page: 1,
          limit: 80,
        });
        resultCache.current.set(cacheKey, response.assets);
        setRows(response.assets);
      } catch {
        setRows([]);
      } finally {
        setLoading(false);
      }
    }, 280);

    return () => window.clearTimeout(timer);
  }, [open, query, category, country, type, sector, source, exchangeType, futureCategory, economyCategory]);

  useEffect(() => {
    if (!open) return;
    setQuery("");
    setView("search");
    setSelectedFutureRoot(null);
  }, [open, selectedSymbol]);

  const selectedCountryLabel = useMemo(() => {
    return countryOptions.find((optionItem) => optionItem.value === country)?.label || "All Countries";
  }, [country, countryOptions]);

  const selectedTypeLabel = useMemo(() => {
    return typeOptions.find((optionItem) => optionItem.value === type)?.label || "All Types";
  }, [type, typeOptions]);

  const selectedSectorLabel = useMemo(() => {
    return sectorOptions.find((optionItem) => optionItem.value === sector)?.label || "All Sectors";
  }, [sector, sectorOptions]);

  const selectedSourceLabel = useMemo(() => {
    return sourceOptions.find((optionItem) => optionItem.value === source)?.label || "All Sources";
  }, [source, sourceOptions]);

  const selectedExchangeTypeLabel = useMemo(() => {
    return exchangeTypeOptions.find((optionItem) => optionItem.value === exchangeType)?.label || "All";
  }, [exchangeType, exchangeTypeOptions]);

  const selectedFutureCategoryLabel = useMemo(() => {
    return futureCategoryOptions.find((optionItem) => optionItem.value === futureCategory)?.label || "All Categories";
  }, [futureCategory, futureCategoryOptions]);

  const selectedEconomyCategoryLabel = useMemo(() => {
    return economyCategoryOptions.find((optionItem) => optionItem.value === economyCategory)?.label || "All Categories";
  }, [economyCategory, economyCategoryOptions]);

  if (view === "futureContracts" && selectedFutureRoot) {
    const contracts = selectedFutureRoot.contracts ?? [];

    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent data-testid="symbol-search-modal" className="w-[min(960px,94vw)] max-w-none gap-0 border-border/80 bg-background/95 p-0 backdrop-blur-xl">
          <DialogHeader className="flex flex-row items-center gap-3 border-b border-border/60 px-5 pt-5 pb-4">
            <button
              type="button"
              onClick={() => {
                setView("search");
                setSelectedFutureRoot(null);
              }}
              className="rounded-full p-1 transition-colors hover:bg-secondary/60"
              aria-label="Back"
            >
              <ArrowLeft size={20} />
            </button>
            <DialogTitle className="font-display text-xl">{selectedFutureRoot.ticker} Contracts</DialogTitle>
          </DialogHeader>

          <div className="space-y-3 px-5 py-4">
            <div className="flex items-center gap-3 rounded-xl border border-border/70 bg-secondary/20 px-3 py-2.5">
              <AssetAvatar src={selectedFutureRoot.iconUrl} label={selectedFutureRoot.name} className="h-8 w-8 rounded-full object-cover" />
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-foreground">{selectedFutureRoot.ticker}</p>
                <p className="truncate text-xs text-muted-foreground">{selectedFutureRoot.name}</p>
              </div>
            </div>

            <div className="max-h-[52vh] overflow-y-auto rounded-xl border border-border/70">
              {contracts.map((contract) => (
                <button
                  key={`${contract.ticker}-${contract.exchange}`}
                  data-testid="symbol-contract-row"
                  data-symbol={contract.ticker}
                  type="button"
                  onClick={() => {
                    onSelect(contract);
                    onOpenChange(false);
                  }}
                  className={`grid w-full grid-cols-[1fr_auto] items-center gap-3 border-b border-border/60 px-3 py-2.5 text-left transition-colors hover:bg-secondary/45 ${
                    contract.ticker === selectedSymbol ? "bg-secondary/65" : "bg-secondary/20"
                  }`}
                >
                  <div className="flex min-w-0 items-center gap-2.5">
                    <AssetAvatar src={contract.iconUrl} label={contract.name} className="h-7 w-7 rounded-full object-cover" />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-foreground">{contract.ticker}</p>
                      <p className="truncate text-xs text-muted-foreground">{contract.name}</p>
                    </div>
                  </div>

                  <div className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                    <AssetAvatar src={contract.exchangeLogoUrl || contract.exchangeIcon} label={contract.exchange} className="h-4 w-4 rounded-sm object-cover" />
                    <span className="font-medium text-foreground">{contract.exchange}</span>
                  </div>
                </button>
              ))}
              {contracts.length === 0 ? (
                <p className="px-3 py-4 text-sm text-center text-muted-foreground">No contracts available</p>
              ) : null}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (view === "sources") {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="w-[min(960px,94vw)] max-w-none gap-0 border-border/80 bg-background/95 p-0 backdrop-blur-xl">
          <DialogHeader className="flex flex-row items-center gap-3 px-5 pt-5 pb-3">
            <button type="button" onClick={() => setView("search")} className="rounded-full p-1 transition-colors hover:bg-secondary/60" aria-label="Back">
              <ArrowLeft size={20} />
            </button>
            <DialogTitle className="font-display text-xl">Sources</DialogTitle>
          </DialogHeader>

          <ModalPanel
            options={sourceOptions}
            value={source}
            sectionLabel="SOURCES"
            onChange={(nextValue) => {
              setSource(nextValue);
              setView("search");
            }}
          />
        </DialogContent>
      </Dialog>
    );
  }

  if (view === "countries") {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="w-[min(960px,94vw)] max-w-none gap-0 border-border/80 bg-background/95 p-0 backdrop-blur-xl">
          <DialogHeader className="flex flex-row items-center gap-3 px-5 pt-5 pb-3">
            <button type="button" onClick={() => setView("search")} className="rounded-full p-1 transition-colors hover:bg-secondary/60" aria-label="Back">
              <ArrowLeft size={20} />
            </button>
            <DialogTitle className="font-display text-xl">Countries</DialogTitle>
          </DialogHeader>

          <ModalPanel
            options={countryOptions}
            value={country}
            sectionLabel="COUNTRIES"
            showFlags
            onChange={(nextValue) => {
              setCountry(nextValue);
              setView("search");
            }}
          />
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent data-testid="symbol-search-modal" className="w-[min(960px,94vw)] max-w-none gap-3 border-border/80 bg-background/95 p-0 backdrop-blur-xl">
        <DialogHeader className="px-6 pt-5 pb-1">
          <DialogTitle className="font-display text-[1.9rem]">Symbol Search</DialogTitle>
        </DialogHeader>

        <div className="px-4 pb-4">
          <div className="rounded-xl border border-border/70 bg-secondary/20 px-3 py-2">
            <div className="flex items-center gap-2">
              <Search size={18} className="text-muted-foreground" />
              <input
                data-testid="symbol-search-input"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Symbol or name"
                className="h-9 w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
              />
              {query ? (
                <button type="button" onClick={() => setQuery("")} className="rounded-full p-1 text-muted-foreground transition-colors hover:bg-secondary/60" aria-label="Clear">
                  <X size={14} />
                </button>
              ) : null}
            </div>
          </div>

          <div className="mt-3 flex flex-wrap gap-1.5">
            {categories.map((categoryItem) => (
              <button
                key={categoryItem.id}
                data-testid={`symbol-category-${categoryItem.id}`}
                type="button"
                onClick={() => setCategory(categoryItem.id)}
                className={`rounded-full border px-3 py-1 text-xs transition-colors ${
                  category === categoryItem.id
                    ? "border-primary/70 bg-primary/15 text-foreground"
                    : "border-border/70 bg-secondary/30 text-muted-foreground hover:text-foreground"
                }`}
              >
                <span className="inline-flex items-center gap-1.5">
                  {categoryItem.id === "all" ? (
                    <Globe size={12} className="shrink-0" />
                  ) : categoryItem.iconUrl ? (
                    <AssetAvatar src={categoryItem.iconUrl} label={categoryItem.label} className="h-3.5 w-3.5 shrink-0 rounded-full object-cover ring-1 ring-border/70" />
                  ) : null}
                  <span>{categoryItem.label}</span>
                </span>
              </button>
            ))}
          </div>

          {activeFilters.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2 text-xs">
              {activeFilters.includes("source") && sourceUiType === "modal" ? (
                <ModalTriggerButton
                  testId="symbol-filter-source-modal"
                  label={source === "all" ? "All Sources" : selectedSourceLabel}
                  onClick={() => setView("sources")}
                />
              ) : null}

              {activeFilters.includes("source") && sourceUiType === "dropdown" ? (
                <FilterDropdown
                  testId="symbol-filter-source-dropdown"
                  triggerLabel={selectedSourceLabel}
                  value={source}
                  options={sourceOptions}
                  onChange={setSource}
                />
              ) : null}

              {activeFilters.includes("country") ? (
                <ModalTriggerButton
                  testId="symbol-filter-country-modal"
                  label={country === "all" ? "All Countries" : selectedCountryLabel}
                  onClick={() => setView("countries")}
                />
              ) : null}

              {activeFilters.includes("type") ? (
                <FilterDropdown
                  testId="symbol-filter-type"
                  triggerLabel={selectedTypeLabel}
                  value={type}
                  options={typeOptions}
                  onChange={setType}
                />
              ) : null}

              {activeFilters.includes("sector") ? (
                <FilterDropdown
                  testId="symbol-filter-sector"
                  triggerLabel={selectedSectorLabel}
                  value={sector}
                  options={sectorOptions}
                  onChange={setSector}
                />
              ) : null}

              {activeFilters.includes("exchangeType") ? (
                <FilterDropdown
                  testId="symbol-filter-exchange-type"
                  triggerLabel={selectedExchangeTypeLabel}
                  value={exchangeType}
                  options={exchangeTypeOptions}
                  onChange={setExchangeType}
                />
              ) : null}

              {activeFilters.includes("futureCategory") ? (
                <FilterDropdown
                  testId="symbol-filter-future-category"
                  triggerLabel={selectedFutureCategoryLabel}
                  value={futureCategory}
                  options={futureCategoryOptions}
                  onChange={setFutureCategory}
                />
              ) : null}

              {activeFilters.includes("economyCategory") ? (
                <FilterDropdown
                  testId="symbol-filter-economy-category"
                  triggerLabel={selectedEconomyCategoryLabel}
                  value={economyCategory}
                  options={economyCategoryOptions}
                  onChange={setEconomyCategory}
                />
              ) : null}
            </div>
          )}

          <div className="mt-3 max-h-[58vh] overflow-y-auto rounded-xl border border-border/70">
            {rows.map((item) => (
              <button
                key={`${item.category}-${item.ticker}-${item.exchange}`}
                data-testid="symbol-result-row"
                data-symbol={item.ticker}
                type="button"
                onClick={() => {
                  if (item.category === "futures" && (item.contracts?.length ?? 0) > 0) {
                    setSelectedFutureRoot(item);
                    setView("futureContracts");
                    return;
                  }
                  onSelect(item);
                  onOpenChange(false);
                }}
                className={`grid w-full grid-cols-[1fr_auto] items-center gap-4 border-b border-border/60 px-3 py-2.5 text-left transition-colors hover:bg-secondary/45 ${
                  item.ticker === selectedSymbol ? "bg-secondary/65" : "bg-secondary/20"
                }`}
              >
                <div className="flex min-w-0 items-center gap-2.5">
                  <AssetAvatar src={item.iconUrl} label={item.name} className="h-8 w-8 shrink-0 rounded-full object-cover" />

                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-foreground">{item.ticker}</p>
                    <p className="truncate text-sm text-muted-foreground">{item.name}</p>
                    <p className="truncate text-[11px] text-muted-foreground">
                      {item.market} {item.instrumentType ? `• ${item.instrumentType}` : ""}
                    </p>
                  </div>
                </div>

                <div className="inline-flex items-center gap-1.5 whitespace-nowrap text-xs text-muted-foreground">
                  <AssetAvatar src={item.exchangeLogoUrl || item.exchangeIcon} label={item.exchange} className="h-4 w-4 rounded-sm object-cover" />
                  <span className="font-medium text-foreground">{item.exchange}</span>
                </div>
              </button>
            ))}

            {!loading && rows.length === 0 ? (
              <p className="px-3 py-5 text-center text-sm text-muted-foreground">No symbols found</p>
            ) : null}
            {loading ? <p className="px-3 py-4 text-center text-xs text-muted-foreground">Loading symbols...</p> : null}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function ModalTriggerButton({ label, onClick, testId }: { label: string; onClick: () => void; testId?: string }) {
  return (
    <button
      data-testid={testId}
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs text-foreground transition-colors hover:bg-secondary/45"
    >
      <span>{label}</span>
      <ChevronDown size={13} className="text-muted-foreground" />
    </button>
  );
}

function ModalPanel({
  options,
  value,
  sectionLabel,
  showFlags,
  onChange,
}: {
  options: AssetSearchFilterOption[];
  value: string;
  sectionLabel: string;
  showFlags?: boolean;
  onChange: (nextValue: string) => void;
}) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    if (!query.trim()) return options;
    const normalized = query.trim().toLowerCase();
    return options.filter((optionItem) => optionItem.label.toLowerCase().includes(normalized));
  }, [options, query]);

  const allOption = filtered.find((optionItem) => optionItem.value === "all");
  const rest = filtered.filter((optionItem) => optionItem.value !== "all");

  return (
    <div className="px-5 pb-5">
      <div className="mb-3 rounded-xl border border-border/70 bg-secondary/20 px-3 py-2">
        <div className="flex items-center gap-2">
          <Search size={16} className="text-muted-foreground" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search"
            className="h-7 w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
        </div>
      </div>

      {allOption ? (
        <button
          data-testid="symbol-modal-option"
          data-option="all"
          type="button"
          onClick={() => onChange("all")}
          className={`mb-3 flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm ${
            value === "all" ? "bg-foreground text-background" : "transition-colors hover:bg-secondary/45"
          }`}
        >
          <Globe size={16} />
          <span className="font-medium">{allOption.label}</span>
        </button>
      ) : null}

      <div className="mb-2 px-1 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">{sectionLabel}</div>

      <div className="max-h-[50vh] overflow-y-auto">
        <div className="grid grid-cols-2 gap-x-4 gap-y-0.5">
          {rest.map((optionItem) => {
            const selected = value === optionItem.value;
            const iconUrl = optionItem.icon || (showFlags ? countryFlagUrl(optionItem.value) : "");

            return (
              <button
                key={optionItem.value}
                data-testid="symbol-modal-option"
                data-option={optionItem.value}
                type="button"
                onClick={() => onChange(optionItem.value)}
                className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-left transition-colors ${
                  selected ? "bg-secondary/65" : "hover:bg-secondary/35"
                }`}
              >
                {iconUrl ? (
                  <AssetAvatar src={iconUrl} label={optionItem.label} className="h-6 w-6 shrink-0 rounded-full object-cover" />
                ) : (
                  <div className="h-6 w-6 shrink-0 rounded-full bg-muted" />
                )}

                <div className="min-w-0">
                  <p className={`truncate text-sm ${selected ? "font-semibold text-foreground" : "text-foreground"}`}>{optionItem.label}</p>
                  {optionItem.subtitle ? <p className="truncate text-xs text-muted-foreground">{optionItem.subtitle}</p> : null}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function FilterDropdown({
  triggerLabel,
  value,
  options,
  onChange,
  testId,
}: {
  triggerLabel: string;
  value: string;
  options: AssetSearchFilterOption[];
  onChange: (nextValue: string) => void;
  testId?: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button data-testid={testId} type="button" className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs text-foreground transition-colors hover:bg-secondary/45">
          <span>{triggerLabel}</span>
          <ChevronDown size={13} className={`text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`} />
        </button>
      </PopoverTrigger>

      <PopoverContent align="start" sideOffset={6} className="w-[260px] border-border/80 bg-background/95 p-0">
        <div className="max-h-[320px] overflow-y-auto py-1">
          {options.map((optionItem) => {
            const selected = value === optionItem.value;
            return (
              <button
                key={optionItem.value}
                type="button"
                onClick={() => {
                  onChange(optionItem.value);
                  setOpen(false);
                }}
                className={`flex w-full items-center justify-between px-3 py-1.5 text-left text-xs transition-colors ${
                  selected
                    ? "bg-secondary/65 text-foreground"
                    : "text-muted-foreground hover:bg-secondary/35 hover:text-foreground"
                }`}
              >
                <span>{optionItem.label}</span>
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
