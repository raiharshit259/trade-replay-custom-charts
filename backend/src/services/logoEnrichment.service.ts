import { SymbolModel } from "../models/Symbol";
import { inferDomainForSymbol } from "./domainInference.service";
import { resolveLogoForSymbol } from "./logo.service";

export { inferDomainForSymbol };

export async function enrichSymbolLogos(options?: { limit?: number }): Promise<{ checked: number; updated: number }> {
  const limit = Math.max(50, Math.min(options?.limit ?? 1000, 5000));
  const candidates = await SymbolModel.find({
    type: "stock",
    $or: [
      { iconUrl: { $exists: false } },
      { iconUrl: "" },
      { companyDomain: { $exists: false } },
      { companyDomain: "" },
    ],
  })
    .select({ symbol: 1, name: 1, exchange: 1, iconUrl: 1, companyDomain: 1 })
    .limit(limit)
    .lean<Array<{ symbol: string; name: string; exchange: string; iconUrl?: string; companyDomain?: string }>>();

  let updated = 0;

  for (const symbol of candidates) {
    // eslint-disable-next-line no-await-in-loop
    const resolvedLogo = await resolveLogoForSymbol({
      symbol: symbol.symbol,
      name: symbol.name,
      exchange: symbol.exchange,
      companyDomain: symbol.companyDomain,
    });

    if (!resolvedLogo) {
      continue;
    }

    // eslint-disable-next-line no-await-in-loop
    await SymbolModel.updateOne(
      { symbol: symbol.symbol, exchange: symbol.exchange },
      {
        $set: {
          companyDomain: resolvedLogo.domain,
          iconUrl: resolvedLogo.logoUrl,
          logoValidatedAt: new Date(),
        },
      },
    );

    updated += 1;
  }

  return { checked: candidates.length, updated };
}
