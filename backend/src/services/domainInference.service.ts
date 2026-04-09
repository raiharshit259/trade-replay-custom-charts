import { inferDomainWithConfidence } from "./domainConfidence.service";

export function inferDomain(input: { symbol: string; name: string; exchange?: string }): string | null {
  return inferDomainWithConfidence(input).domain;
}

export function inferDomainForSymbol(input: { symbol: string; name: string; exchange?: string }): string | null {
  return inferDomain(input);
}
