import type { ArchiveRecord } from "@/lib/types";

export type SortKey = "saved" | "price" | "drop" | "bids";
export type SortDir = "asc" | "desc";
export type SortState = { key: SortKey; dir: SortDir } | null;

export const DEFAULT_SORT: { key: SortKey; dir: SortDir } = { key: "saved", dir: "desc" };

export const SORT_PRESETS: { id: string; label: string; sort: { key: SortKey; dir: SortDir } }[] = [
  { id: "saved-desc", label: "新しく保存した順", sort: { key: "saved", dir: "desc" } },
  { id: "price-asc", label: "価格の安い順", sort: { key: "price", dir: "asc" } },
  { id: "price-desc", label: "価格の高い順", sort: { key: "price", dir: "desc" } },
  { id: "drop-desc", label: "値下げの大きい順", sort: { key: "drop", dir: "desc" } },
  { id: "bids-desc", label: "入札の多い順", sort: { key: "bids", dir: "desc" } },
];

export function presetIdOf(sort: SortState): string {
  const { key, dir } = sort ?? DEFAULT_SORT;
  return SORT_PRESETS.find((p) => p.sort.key === key && p.sort.dir === dir)?.id ?? "saved-desc";
}

export function priceDropYen(r: Pick<ArchiveRecord, "priceHistory">): number | null {
  const points = (r.priceHistory ?? []).filter((p) => p.priceYen != null);
  if (points.length < 2) return null;
  const first = points[0].priceYen;
  const last = points[points.length - 1].priceYen;
  if (first == null || last == null) return null;
  const drop = first - last;
  return drop > 0 ? drop : null;
}

function value(r: ArchiveRecord, key: SortKey): number | null {
  switch (key) {
    case "price":
      return r.priceYen;
    case "drop":
      return priceDropYen(r);
    case "bids":
      return r.bidCount;
    case "saved": {
      const t = Date.parse(r.savedAt);
      return Number.isNaN(t) ? null : t;
    }
  }
}

export function sortListings(list: ArchiveRecord[], sort: SortState): ArchiveRecord[] {
  const { key, dir } = sort ?? DEFAULT_SORT;
  const mul = dir === "asc" ? 1 : -1;
  return [...list].sort((a, b) => {
    const va = value(a, key);
    const vb = value(b, key);
    if (va == null && vb == null) return 0;
    if (va == null) return 1;
    if (vb == null) return -1;
    return (va - vb) * mul;
  });
}
