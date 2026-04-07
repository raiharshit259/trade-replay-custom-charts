import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, Globe, Search, X } from "lucide-react";
import AssetAvatar from "@/components/ui/AssetAvatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  fetchAssetSearchFilters,
  searchAssets,
  type AssetCategory,
  type AssetSearchFilterOption,
  type AssetSearchItem,
} from "@/lib/assetSearch";
import { FilterDropdown, ModalPanel, ModalTriggerButton, SYMBOL_CATEGORIES } from "@/components/simulation/symbolSearchModalParts";

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
  const [category, setCategory] = useState<(typeof SYMBOL_CATEGORIES)[number]["id"]>(initialCategory);
  const [country, setCountry] = useState("all");
  const [type, setType] = useState("all");
  const [sector, setSector] = useState("all");
  const [source, setSource] = useState("all");
  const [exchangeType, setExchangeType] = useState("all");
  const [futureCategory, setFutureCategory] = useState("all");
  const [economyCategory, setEconomyCategory] = useState("all");

  const [rows, setRows] = useState<AssetSearchItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [total, setTotal] = useState(0);

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

  const resultCache = useRef(new Map<string, { rows: AssetSearchItem[]; hasMore: boolean; total: number }>());
  const listContainerRef = useRef<HTMLDivElement | null>(null);

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

  const filterKey = useMemo(() => JSON.stringify({
    q: query.trim(),
    category,
    country,
    type,
    sector,
    source,
    exchangeType,
    futureCategory,
    economyCategory,
  }), [query, category, country, type, sector, source, exchangeType, futureCategory, economyCategory]);

  useEffect(() => {
    if (!open) return;

    const loadFirstPage = async () => {
      const cached = resultCache.current.get(filterKey);
      if (cached) {
        setRows(cached.rows);
        setHasMore(cached.hasMore);
        setTotal(cached.total);
        setPage(1);
        return;
      }

      setLoading(true);
      try {
        const response = await searchAssets({
          q: query.trim(),
          category: category === "all" ? undefined : category,
          country: country === "all" ? undefined : country,
          type: type === "all" ? undefined : type,
          sector: sector === "all" ? undefined : sector,
          source: source === "all" ? undefined : source,
          exchangeType: exchangeType === "all" ? undefined : exchangeType,
          futureCategory: futureCategory === "all" ? undefined : futureCategory,
          economyCategory: economyCategory === "all" ? undefined : economyCategory,
          page: 1,
          limit: 50,
        });

        setRows(response.assets);
        setHasMore(response.hasMore);
        setTotal(response.total);
        setPage(1);
        resultCache.current.set(filterKey, {
          rows: response.assets,
          hasMore: response.hasMore,
          total: response.total,
        });
      } catch {
        setRows([]);
        setHasMore(false);
        setTotal(0);
      } finally {
        setLoading(false);
      }
    };

    const timer = window.setTimeout(async () => {
      await loadFirstPage();
    }, 300);

    return () => window.clearTimeout(timer);
  }, [open, filterKey, query, category, country, type, sector, source, exchangeType, futureCategory, economyCategory]);

  useEffect(() => {
    if (!open) return;
    const container = listContainerRef.current;
    if (!container) return;

    const onScroll = () => {
      if (loading || loadingMore || !hasMore) return;

      const distanceToBottom = container.scrollHeight - container.scrollTop - container.clientHeight;
      if (distanceToBottom > 80) return;

      setLoadingMore(true);
      void (async () => {
        try {
          const nextPage = page + 1;
          const response = await searchAssets({
            q: query.trim(),
            category: category === "all" ? undefined : category,
            country: country === "all" ? undefined : country,
            type: type === "all" ? undefined : type,
            sector: sector === "all" ? undefined : sector,
            source: source === "all" ? undefined : source,
            exchangeType: exchangeType === "all" ? undefined : exchangeType,
            futureCategory: futureCategory === "all" ? undefined : futureCategory,
            economyCategory: economyCategory === "all" ? undefined : economyCategory,
            page: nextPage,
            limit: 50,
          });

          setRows((previous) => {
            const mergedMap = new Map(previous.map((item) => [`${item.category}|${item.ticker}|${item.exchange}`, item]));
            response.assets.forEach((item) => {
              mergedMap.set(`${item.category}|${item.ticker}|${item.exchange}`, item);
            });
            const merged = Array.from(mergedMap.values());
            resultCache.current.set(filterKey, {
              rows: merged,
              hasMore: response.hasMore,
              total: response.total,
            });
            return merged;
          });

          setHasMore(response.hasMore);
          setTotal(response.total);
          setPage(nextPage);
        } catch {
          // Keep existing list on pagination failures.
        } finally {
          setLoadingMore(false);
        }
      })();
    };

    container.addEventListener("scroll", onScroll);
    return () => container.removeEventListener("scroll", onScroll);
  }, [open, loading, loadingMore, hasMore, page, query, category, country, type, sector, source, exchangeType, futureCategory, economyCategory, filterKey]);

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
            {SYMBOL_CATEGORIES.map((categoryItem) => (
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

          <div ref={listContainerRef} className="mt-3 max-h-[58vh] overflow-y-auto rounded-xl border border-border/70">
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
            {!loading && rows.length > 0 ? (
              <p className="px-3 py-2 text-center text-[11px] text-muted-foreground">
                Showing {rows.length} of {total}
              </p>
            ) : null}
            {loadingMore ? <p className="px-3 py-3 text-center text-xs text-muted-foreground">Loading more...</p> : null}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
