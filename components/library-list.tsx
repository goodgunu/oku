"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { classify, countByFilter, type Filter } from "@/lib/classify";
import { readCompare, writeCompare } from "@/lib/compare";
import { SOURCE_TABS, WATCH_STATUS_LABELS, matchesQuery, sourceCounts, type SourceFilter } from "@/lib/library-filter";
import { DEFAULT_SORT, SORT_PRESETS, presetIdOf, sortListings, type SortState } from "@/lib/library-sort";
import { priceChange } from "@/lib/price-history";
import { sourceLabel } from "@/lib/source-labels";
import type { ArchiveRecord } from "@/lib/types";

export function LibraryList({ listings: initialListings }: { listings: ArchiveRecord[] }) {
  const router = useRouter();
  const [listings, setListings] = useState<ArchiveRecord[]>(initialListings);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<Filter>("all");
  const [sourceFilter, setSourceFilter] = useState<SourceFilter>("all");
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<SortState>(DEFAULT_SORT);
  const [compareIds, setCompareIds] = useState<string[]>([]);
  const [now] = useState(() => Date.now());

  useEffect(() => {
    setListings(initialListings);
  }, [initialListings]);

  useEffect(() => {
    setCompareIds(readCompare());
  }, []);

  const counts = countByFilter(listings, now);
  const srcCounts = sourceCounts(listings, statusFilter, query, favoritesOnly, now);

  const filtered = listings.filter((item) => {
    if (statusFilter !== "all" && classify(item, now) !== statusFilter) return false;
    if (sourceFilter !== "all" && (item.source || "yahoo-auction") !== sourceFilter) return false;
    if (favoritesOnly && !item.favorite) return false;
    if (!matchesQuery(item, query)) return false;
    return true;
  });

  const shown = sortListings(filtered, sort);

  async function remove(id: string) {
    if (!confirm("このメモを消しますか？")) return;
    setBusyId(id);
    try {
      await fetch(`/api/library/${id}`, { method: "DELETE" });
      setListings((prev) => prev.filter((item) => item.id !== id));
      const nextCmp = compareIds.filter((c) => c !== id);
      setCompareIds(nextCmp);
      writeCompare(nextCmp);
      router.refresh();
    } finally {
      setBusyId(null);
    }
  }

  async function toggleFavorite(item: ArchiveRecord) {
    const nextFav = !item.favorite;
    setListings((prev) => prev.map((r) => (r.id === item.id ? { ...r, favorite: nextFav || undefined } : r)));
    await fetch(`/api/library/${item.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ favorite: nextFav }),
    }).catch(() => undefined);
  }

  function toggleCompare(id: string) {
    const next = compareIds.includes(id)
      ? compareIds.filter((x) => x !== id)
      : [...compareIds, id].slice(-3);
    setCompareIds(next);
    writeCompare(next);
  }

  if (!listings.length) {
    return (
      <div className="rounded-xl border border-dashed border-border bg-card px-5 py-12 text-center text-sm text-muted">
        まだ何もおくっていません。上のフォームにURLを貼るか、LINEから共有してください。
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* サイト別タブ */}
      <div className="flex flex-wrap gap-1.5 border-b border-border pb-2.5">
        {SOURCE_TABS.map((tab) => {
          const active = sourceFilter === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setSourceFilter(tab.id)}
              className={`rounded-full border px-3 py-1 text-xs font-bold transition ${
                active
                  ? "border-[#ffdc00] bg-[#ffdc00] text-black"
                  : "border-border bg-card text-muted hover:text-ink"
              }`}
            >
              {tab.label} <span className="tabular-nums opacity-80">{srcCounts[tab.id] ?? 0}</span>
            </button>
          );
        })}
      </div>

      {/* ステータス＋お気に入り＋検索＋並び替え */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-1.5">
          {([
            ["all", "すべて"],
            ["live", "出品中"],
            ["ended", "終了"],
          ] as const).map(([k, label]) => (
            <button
              key={k}
              type="button"
              onClick={() => setStatusFilter(k)}
              className={`rounded-full border px-3 py-1.5 text-xs font-bold ${
                statusFilter === k
                  ? "border-ink bg-ink text-white"
                  : "border-border bg-card text-muted hover:text-ink"
              }`}
            >
              {label} {counts[k]}
            </button>
          ))}
          <button
            type="button"
            onClick={() => setFavoritesOnly((v) => !v)}
            aria-pressed={favoritesOnly}
            className={`rounded-full border px-3 py-1.5 text-xs font-bold ${
              favoritesOnly
                ? "border-[#ffdc00] bg-[#fff8d6] text-ink"
                : "border-border bg-card text-muted hover:text-ink"
            }`}
          >
            ♥ お気に入り
          </button>
        </div>

        <div className="flex flex-1 flex-wrap items-center justify-end gap-2 sm:flex-initial">
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="タイトル・出品者・メモで検索"
            className="h-9 min-w-[160px] flex-1 rounded-full border border-border bg-card px-3.5 text-xs outline-none focus:border-ink sm:w-52 sm:flex-initial"
          />
          <select
            aria-label="並べ替え"
            value={presetIdOf(sort)}
            onChange={(e) => {
              const found = SORT_PRESETS.find((p) => p.id === e.target.value);
              if (found) setSort(found.sort);
            }}
            className="h-9 rounded-full border border-border bg-card px-3 text-xs font-bold text-ink outline-none"
          >
            {SORT_PRESETS.map((p) => (
              <option key={p.id} value={p.id}>
                {p.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {shown.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-card px-5 py-8 text-center text-sm text-muted">
          該当するものはありません。
        </div>
      ) : null}

      <ul className="space-y-3">
        {shown.map((item) => {
          const first = item.photos[0];
          const thumb = first?.key ? `/api/photo/${item.id}/0` : first?.url;
          const change = priceChange(item);
          const compared = compareIds.includes(item.id);
          return (
            <li
              key={item.id}
              className="flex gap-3 rounded-xl border border-border bg-card p-3 shadow-sm transition hover:border-ink/20 sm:p-4"
            >
              <Link href={`/listings/${item.id}`} className="flex min-w-0 flex-1 gap-3">
                <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-lg border border-border bg-background sm:h-24 sm:w-24">
                  {thumb ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={thumb} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full items-center justify-center bg-yahoo/40 text-xs font-bold text-ink/50">
                      おく
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="mb-1 flex flex-wrap items-center gap-1.5">
                    <AvailabilityBadge value={item.availability} />
                    <span className="rounded border border-border bg-background px-1.5 py-0.5 text-[10px] font-bold text-ink/70">
                      {sourceLabel(item.source)}
                    </span>
                    {item.watchStatus && item.watchStatus !== "watching" && (
                      <span className="rounded-full bg-[#fff8d6] px-2 py-0.5 text-[10px] font-bold text-ink">
                        {WATCH_STATUS_LABELS[item.watchStatus]}
                      </span>
                    )}
                    {change && (
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                          change.direction === "down"
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-amber-100 text-amber-900"
                        }`}
                      >
                        {change.deltaText}
                      </span>
                    )}
                  </div>
                  <p className="line-clamp-2 text-sm font-bold leading-snug text-ink">{item.title}</p>
                  {item.priceLabel && item.priceLabel !== "—" ? (
                    <p className="mt-1.5 text-base font-bold text-ink">
                      {item.priceLabel}
                      {item.bidCount != null ? (
                        <span className="ml-2 text-xs font-medium text-muted">入札 {item.bidCount}</span>
                      ) : null}
                    </p>
                  ) : null}
                  <div className="mt-1 flex flex-wrap items-center gap-x-2.5 gap-y-0.5 text-xs text-muted">
                    {item.endTimeLabel && <span>終了 {item.endTimeLabel}</span>}
                    {item.condition && <span>状態: {item.condition}</span>}
                    {item.shipping && <span>{item.shipping}</span>}
                  </div>
                </div>
              </Link>

              <div className="flex shrink-0 flex-col items-end justify-between gap-1">
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => void toggleFavorite(item)}
                    aria-label={item.favorite ? "お気に入りから外す" : "お気に入りに入れる"}
                    className={`rounded-full px-2 py-1 text-sm ${
                      item.favorite ? "text-amber-500" : "text-muted/50 hover:text-ink"
                    }`}
                  >
                    {item.favorite ? "♥" : "♡"}
                  </button>
                  <button
                    type="button"
                    onClick={() => remove(item.id)}
                    disabled={busyId === item.id}
                    className="rounded-md px-2 py-1 text-xs text-muted hover:bg-background hover:text-ended"
                  >
                    消す
                  </button>
                </div>

                <label className="inline-flex cursor-pointer items-center gap-1 rounded-full border border-border bg-background px-2.5 py-1 text-[11px] font-bold text-ink select-none">
                  <input
                    type="checkbox"
                    checked={compared}
                    onChange={() => toggleCompare(item.id)}
                    className="accent-black"
                  />
                  比べる
                </label>
              </div>
            </li>
          );
        })}
      </ul>

      {compareIds.length > 0 && (
        <div className="sticky bottom-4 z-30 mx-auto flex max-w-md items-center justify-between gap-3 rounded-full border border-black/20 bg-ink px-4 py-2.5 text-xs font-bold text-white shadow-lg">
          <span>比べる出品：{compareIds.length} / 3件</span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setCompareIds([]);
                writeCompare([]);
              }}
              className="text-white/70 underline hover:text-white"
            >
              クリア
            </button>
            <Link
              href="/compare"
              className="rounded-full bg-[#ffdc00] px-3.5 py-1 text-xs font-extrabold text-black"
            >
              並べて比べる
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

function AvailabilityBadge({ value }: { value: ArchiveRecord["availability"] }) {
  if (value === "live") {
    return <span className="rounded bg-live px-1.5 py-0.5 text-[10px] font-bold text-white">出品中</span>;
  }
  if (value === "ended") {
    return <span className="rounded bg-ended px-1.5 py-0.5 text-[10px] font-bold text-white">終了</span>;
  }
  return <span className="rounded bg-border px-1.5 py-0.5 text-[10px] font-bold text-muted">不明</span>;
}
