import { useState } from "react";
import { ChevronsUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import AssetAvatar from "@/components/ui/AssetAvatar";
import SymbolSearchModal from "@/components/simulation/SymbolSearchModal";
import type { AssetCategory, AssetSearchItem } from "@/lib/assetSearch";

interface AssetSearchDropdownProps {
  value: string;
  selectedAsset?: AssetSearchItem | null;
  marketFilter?: string;
  categoryFilter?: string;
  countryFilter?: string;
  typeFilter?: string;
  sectorFilter?: string;
  onValueChange: (value: string, asset: AssetSearchItem) => void;
  placeholder?: string;
}

export default function AssetSearchDropdown({
  value,
  selectedAsset,
  marketFilter,
  categoryFilter,
  onValueChange,
  placeholder = "Search assets globally",
}: AssetSearchDropdownProps) {
  const [open, setOpen] = useState(false);
  const preferredCategory = (categoryFilter ?? marketFilter) as AssetCategory | undefined;

  const selectedLabel = selectedAsset?.name ?? value;

  return (
    <>
      <Button
        data-testid="asset-search-trigger"
        type="button"
        variant="outline"
        role="combobox"
        onClick={() => setOpen(true)}
        className="premium-select w-full justify-between rounded-lg border-border/80 px-3 py-2.5 text-left text-sm text-foreground hover:bg-secondary/60"
      >
        <span className="flex min-w-0 items-center gap-2 truncate">
          {selectedAsset?.iconUrl ? <AssetAvatar src={selectedAsset.iconUrl} label={selectedAsset.name} className="h-4 w-4 rounded-full object-cover ring-1 ring-border/70" /> : null}
          <span className="truncate">{selectedLabel || placeholder}</span>
        </span>
        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-70" />
      </Button>

      <SymbolSearchModal
        open={open}
        selectedSymbol={value}
        onOpenChange={setOpen}
        initialCategory={preferredCategory ?? "all"}
        onSelect={(item) => {
          onValueChange(item.symbol, item);
        }}
      />
    </>
  );
}
