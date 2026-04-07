export interface CsvHoldingRow {
  stock: string;
  symbol: string;
  quantity: number;
  avgPrice: number;
  marketValue: number;
}

export function generatePortfolioCsv(rows: CsvHoldingRow[]): string {
  const header = "Stock,Symbol,Quantity,AvgPrice,MarketValue";
  const lines = rows.map((row) => [
    sanitizeCell(row.stock),
    sanitizeCell(row.symbol),
    row.quantity,
    row.avgPrice,
    row.marketValue,
  ].join(","));

  return `${header}\n${lines.join("\n")}`;
}

function sanitizeCell(value: string): string {
  const normalized = value.replace(/\r|\n/g, " ").trim();
  if (normalized.includes(",") || normalized.includes('"')) {
    return `"${normalized.replace(/"/g, '""')}"`;
  }
  return normalized;
}
