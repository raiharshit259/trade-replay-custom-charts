export function normalizeSymbol(input: string): string {
  return input
    .toUpperCase()
    .replace(/^[A-Z]+:/, "")
    .replace(/(\.NS|\.BO|-EQ|-BE)$/, "")
    .replace(/[^A-Z0-9]/g, "");
}
