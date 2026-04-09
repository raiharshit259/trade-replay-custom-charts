import { SymbolModel } from "../models/Symbol";

export async function countTotalSymbols(): Promise<number> {
  return SymbolModel.countDocuments({});
}

export async function countFallbackIcons(): Promise<number> {
  return SymbolModel.countDocuments({
    $or: [
      { iconUrl: { $exists: false } },
      { iconUrl: "" },
      { iconUrl: { $regex: "exchange|default|generated|/icons/exchange/|/icons/category/|/icons/sector/", $options: "i" } },
    ],
  });
}

export async function computeFallbackRatio(): Promise<{ fallbackCount: number; totalSymbols: number; ratio: number }> {
  const [fallbackCount, totalSymbols] = await Promise.all([
    countFallbackIcons(),
    countTotalSymbols(),
  ]);

  const ratio = totalSymbols === 0 ? 0 : fallbackCount / totalSymbols;
  return { fallbackCount, totalSymbols, ratio };
}
