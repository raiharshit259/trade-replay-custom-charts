import type { AssetCategory, AssetSearchFilterOption, AssetSearchFiltersResponse } from "@/lib/assetSearch";

const country = (value: string, label: string): AssetSearchFilterOption => ({ value, label });
const option = (value: string, label: string): AssetSearchFilterOption => ({ value, label });

export const PREDEFINED_COUNTRIES: AssetSearchFilterOption[] = [
  country("all", "All Countries"),
  country("US", "United States"),
  country("IN", "India"),
  country("GB", "United Kingdom"),
  country("DE", "Germany"),
  country("FR", "France"),
  country("JP", "Japan"),
  country("CN", "China"),
  country("CA", "Canada"),
  country("AU", "Australia"),
  country("SG", "Singapore"),
  country("CH", "Switzerland"),
  country("AE", "United Arab Emirates"),
  country("BR", "Brazil"),
  country("MX", "Mexico"),
  country("ZA", "South Africa"),
  country("KR", "South Korea"),
  country("HK", "Hong Kong"),
  country("ES", "Spain"),
  country("IT", "Italy"),
  country("NL", "Netherlands"),
  country("SE", "Sweden"),
  country("NO", "Norway"),
  country("DK", "Denmark"),
  country("FI", "Finland"),
  country("BE", "Belgium"),
  country("AT", "Austria"),
  country("IE", "Ireland"),
  country("PT", "Portugal"),
  country("PL", "Poland"),
  country("CZ", "Czechia"),
  country("HU", "Hungary"),
  country("RO", "Romania"),
  country("GR", "Greece"),
  country("TR", "Turkey"),
  country("IL", "Israel"),
  country("SA", "Saudi Arabia"),
  country("QA", "Qatar"),
  country("KW", "Kuwait"),
  country("EG", "Egypt"),
  country("NG", "Nigeria"),
  country("KE", "Kenya"),
  country("MA", "Morocco"),
  country("AR", "Argentina"),
  country("CL", "Chile"),
  country("CO", "Colombia"),
  country("PE", "Peru"),
  country("NZ", "New Zealand"),
  country("TH", "Thailand"),
  country("MY", "Malaysia"),
  country("ID", "Indonesia"),
  country("PH", "Philippines"),
  country("VN", "Vietnam"),
  country("PK", "Pakistan"),
  country("BD", "Bangladesh"),
  country("LK", "Sri Lanka"),
  country("TW", "Taiwan"),
  country("RU", "Russia"),
  country("UA", "Ukraine"),
  country("KZ", "Kazakhstan"),
  country("LU", "Luxembourg"),
  country("IS", "Iceland"),
  country("EE", "Estonia"),
  country("LV", "Latvia"),
  country("LT", "Lithuania"),
];

export const STOCK_TYPES: AssetSearchFilterOption[] = [
  option("all", "All types"),
  option("common_stock", "Common stock"),
  option("preferred_stock", "Preferred stock"),
  option("depository_receipt", "Depository Receipt"),
  option("warrant", "Warrant"),
  option("pre_ipo", "Pre-IPO"),
];

export const STOCK_SECTORS: AssetSearchFilterOption[] = [
  option("all", "All sectors"),
  option("commercial_services", "Commercial Services"),
  option("communications", "Communications"),
  option("consumer_durables", "Consumer Durables"),
  option("consumer_non_durables", "Consumer Non-Durables"),
  option("consumer_services", "Consumer Services"),
  option("distribution_services", "Distribution Services"),
  option("electronic_technology", "Electronic Technology"),
  option("energy_minerals", "Energy Minerals"),
  option("finance", "Finance"),
  option("government_sector", "Government sector"),
  option("health_services", "Health Services"),
  option("health_technology", "Health Technology"),
  option("industrial_services", "Industrial Services"),
  option("miscellaneous", "Miscellaneous"),
  option("non_energy_minerals", "Non-Energy Minerals"),
  option("process_industries", "Process Industries"),
  option("producer_manufacturing", "Producer Manufacturing"),
  option("retail_trade", "Retail Trade"),
  option("technology_services", "Technology Services"),
  option("transportation", "Transportation"),
  option("utilities", "Utilities"),
];

export const FUND_TYPES: AssetSearchFilterOption[] = [
  option("all", "All types"),
  option("etf", "ETF"),
  option("mutual_fund", "Mutual fund"),
  option("trust", "Trust"),
  option("reit", "REIT"),
];

function emptyFilters(sourceUiType: "modal" | "dropdown" = "modal"): AssetSearchFiltersResponse {
  return {
    activeFilters: [],
    countries: [],
    types: [],
    sectors: [],
    sources: [],
    exchangeTypes: [],
    futureCategories: [],
    economyCategories: [],
    sourceUiType,
  };
}

export function getStaticFilters(category?: "all" | AssetCategory): AssetSearchFiltersResponse {
  const resolved = category ?? "all";

  if (resolved === "all") return emptyFilters("modal");

  if (resolved === "stocks") {
    return {
      ...emptyFilters("modal"),
      activeFilters: ["country", "type", "sector"],
      countries: PREDEFINED_COUNTRIES,
      types: STOCK_TYPES,
      sectors: STOCK_SECTORS,
    };
  }

  if (resolved === "funds") {
    return {
      ...emptyFilters("modal"),
      activeFilters: ["country", "type"],
      countries: PREDEFINED_COUNTRIES,
      types: FUND_TYPES,
    };
  }

  if (resolved === "bonds") {
    return {
      ...emptyFilters("modal"),
      activeFilters: ["country", "type"],
      countries: PREDEFINED_COUNTRIES,
      types: [option("all", "All types"), option("government", "Government"), option("corporate", "Corporate")],
    };
  }

  if (resolved === "economy") {
    return {
      ...emptyFilters("dropdown"),
      activeFilters: ["country", "economyCategory"],
      countries: PREDEFINED_COUNTRIES,
      economyCategories: [
        option("all", "All categories"),
        option("inflation", "Inflation"),
        option("gdp", "GDP"),
        option("employment", "Employment"),
        option("interest_rates", "Interest Rates"),
        option("manufacturing", "Manufacturing"),
        option("consumer", "Consumer"),
      ],
    };
  }

  return emptyFilters("modal");
}
