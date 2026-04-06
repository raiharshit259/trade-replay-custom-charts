import { api } from "@/lib/api";

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
      page: params.page ?? 1,
      limit: params.limit ?? 25,
    },
  });

  return response.data;
}

export async function fetchAssetSearchFilters(params?: { category?: string }): Promise<AssetSearchFiltersResponse> {
  const response = await api.get<AssetSearchFiltersResponse>("/simulation/assets/filters", {
    params: {
      category: params?.category,
    },
  });
  return response.data;
}
