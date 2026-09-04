// Parses a pasted menu list into categories/items.
//
// Expected shape (blank lines are just visual separators, not required):
//
//   Category Name
//   Item name: 2900
//   Another item: 3200
//
//   Next Category
//   Item: 1500
//
// A line with no parseable price becomes a new category header. A line
// "Name: Price" is added under the most recent header. When a name or price
// contains " / " (e.g. "Black / White Russian: 2400" or
// "B52 / B53: 2400 / 13000"), it's split into multiple items — paired up
// when both sides have the same number of parts, otherwise the single price
// (or single name) is reused for every part. This is a best-effort guess;
// the caller should let the user review/edit the result before saving.

export type ParsedMenuItem = { name: string; priceAmd: number };
export type ParsedMenuCategory = { name: string; items: ParsedMenuItem[] };
export type ParsedMenuImport = { categories: ParsedMenuCategory[]; warnings: string[] };

const LINE_WITH_PRICE = /^(.+?):\s*([\d][\d.,\s/]*)$/;

function parseAmd(raw: string): number | null {
  const cleaned = raw.replace(/[,\s]/g, "");
  const n = Number(cleaned);
  return Number.isFinite(n) && n > 0 ? Math.round(n) : null;
}

function splitParts(raw: string): string[] {
  return raw
    .split("/")
    .map((s) => s.trim())
    .filter(Boolean);
}

export function parseMenuImportText(text: string): ParsedMenuImport {
  const categories: ParsedMenuCategory[] = [];
  const warnings: string[] = [];
  let current: ParsedMenuCategory | null = null;

  for (const rawLine of text.split("\n")) {
    const line = rawLine.trim();
    if (!line) continue;

    const match = line.match(LINE_WITH_PRICE);
    if (!match) {
      current = { name: line.replace(/:\s*$/, "").trim(), items: [] };
      categories.push(current);
      continue;
    }

    if (!current) {
      warnings.push(`Skipped "${line}" — no category above it yet.`);
      continue;
    }

    const nameParts = splitParts(match[1]);
    const priceParts = splitParts(match[2]);
    const prices = priceParts.map(parseAmd);

    if (prices.length === 0 || prices.some((p) => p === null)) {
      warnings.push(`Skipped "${line}" — couldn't read a price.`);
      continue;
    }
    const validPrices = prices as number[];

    if (nameParts.length > 1 && validPrices.length === nameParts.length) {
      nameParts.forEach((name, i) => current!.items.push({ name, priceAmd: validPrices[i] }));
    } else if (nameParts.length > 1 && validPrices.length === 1) {
      nameParts.forEach((name) => current!.items.push({ name, priceAmd: validPrices[0] }));
    } else if (nameParts.length === 1 && validPrices.length > 1) {
      validPrices.forEach((priceAmd, i) => current!.items.push({ name: `${nameParts[0]} (${i + 1})`, priceAmd }));
      warnings.push(`"${line}" had ${validPrices.length} prices for one name — labeled (1), (2)…; rename as needed.`);
    } else {
      current.items.push({ name: nameParts[0] ?? match[1].trim(), priceAmd: validPrices[0] });
    }
  }

  return { categories: categories.filter((c) => c.items.length > 0), warnings };
}
