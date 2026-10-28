import { classify, type Filter } from "@/lib/classify";
import type { ArchiveRecord, SourceId, WatchStatus } from "@/lib/types";

export type SourceFilter = "all" | SourceId;
export type WatchFilter = "all" | WatchStatus;

export const SOURCE_TABS: { id: SourceFilter; label: string }[] = [
  { id: "all", label: "すべて" },
  { id: "yahoo-auction", label: "ヤフオク" },
  { id: "paypay", label: "PayPayフリマ" },
  { id: "jmty", label: "ジモティー" },
  { id: "mercari", label: "メルカリ" },
];

export const WATCH_STATUS_LABELS: Record<WatchStatus, string> = {
  watching: "検討中",
  contacted: "入札・質問した",
  passed: "見送り",
  bought: "落札・購入した",
};

export function matchesQuery(listing: ArchiveRecord, query: string): boolean {
  const needle = query.trim().toLowerCase();
  if (!needle) return true;
  const haystack = [
    listing.title,
    listing.seller,
    listing.prefecture,
    listing.condition,
    listing.category,
    listing.priceLabel,
    listing.memo,
    ...(listing.memoEntries ?? []).map((e) => e.text),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  return haystack.includes(needle);
}

export function sourceCounts(
  listings: ArchiveRecord[],
  statusFilter: Filter,
  query: string,
  favoritesOnly: boolean,
  now = Date.now(),
): Record<SourceFilter, number> {
  const counts: Record<SourceFilter, number> = {
    all: 0,
    "yahoo-auction": 0,
    paypay: 0,
    jmty: 0,
    mercari: 0,
  };
  for (const item of listings) {
    if (statusFilter !== "all" && classify(item, now) !== statusFilter) continue;
    if (favoritesOnly && !item.favorite) continue;
    if (!matchesQuery(item, query)) continue;
    counts.all += 1;
    const src: SourceId = item.source || "yahoo-auction";
    counts[src] = (counts[src] ?? 0) + 1;
  }
  return counts;
}
