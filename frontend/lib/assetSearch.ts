import { api } from "@/lib/api";
import { getStaticFilters } from "@/config/filters";
import { mapSymbolItemToUi } from "@/utils/symbolMapper";

export type AssetMarketType = "Stocks" | "Funds" | "Futures" | "Forex" | "Crypto" | "Indices" | "Bonds" | "Economy" | "Options";
export type AssetCategory = "stocks" | "funds" | "futures" | "forex" | "crypto" | "indices" | "bonds" | "economy" | "options";

export interface AssetSearchItem {
  ticker: string;
  symbol: string;
  name: string;
  exchange: string;
  region: string;
  instrumentType: string;
  type: string;
  category: AssetCategory;
  assetType: AssetCategory;
  market: AssetMarketType;
  country: string;
  sector: string;
  exchangeType: string;
  icon: string;
  exchangeIcon: string;
  exchangeLogoUrl: string;
  iconUrl: string;
  logoUrl: string;
  source: string;
  futureCategory?: string;
  economyCategory?: string;
  contracts?: AssetSearchItem[];
}

export interface AssetSearchResponse {
  assets: AssetSearchItem[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

export interface AssetSearchFilterOption {
  value: string;
  label: string;
  icon?: string;
  subtitle?: string;
}

export interface AssetSearchFiltersResponse {
  activeFilters: string[];
  countries: AssetSearchFilterOption[];
  types: AssetSearchFilterOption[];
  sectors: AssetSearchFilterOption[];
  sources: AssetSearchFilterOption[];
  exchangeTypes: AssetSearchFilterOption[];
  futureCategories: AssetSearchFilterOption[];
  economyCategories: AssetSearchFilterOption[];
  sourceUiType?: "modal" | "dropdown";
}

export async function searchAssets(params: {
  q: string;
  market?: string;
  category?: string;
  country?: string;
  type?: string;
  sector?: string;
  source?: string;
  exchangeType?: string;
  futureCategory?: string;
  economyCategory?: string;
  page?: number;
  limit?: number;
}): Promise<AssetSearchResponse> {
  const limit = params.limit ?? 25;
  const page = params.page ?? 1;
  const offset = (Math.max(1, page) - 1) * limit;
  const requestedCategory = params.category ?? params.market;

  const response = await api.get<AssetSearchResponse>("/simulation/assets", {
    params: {
      q: params.q,
      market: params.market,
      category: params.category,
      country: params.country,
      type: params.type,
      sector: params.sector,
      source: params.source,
      exchangeType: params.exchangeType,
      futureCategory: params.futureCategory,
      economyCategory: params.economyCategory,
      page,
      limit,
      offset,
    },
  });

  const mappedAssets = response.data.assets
    .map((item) => mapSymbolItemToUi(item, requestedCategory))
    .filter((item) => {
      if (params.type && params.type !== "all" && item.type !== params.type) return false;
      if (params.sector && params.sector !== "all" && item.sector !== params.sector) return false;
      return true;
    });

  return {
    ...response.data,
    assets: mappedAssets,
  };
}

export async function fetchAssetSearchFilters(params?: { category?: string }): Promise<AssetSearchFiltersResponse> {
  const category = (params?.category as AssetCategory | "all" | undefined) ?? "all";
  return getStaticFilters(category);
}
