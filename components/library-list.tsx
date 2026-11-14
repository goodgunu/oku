"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { classify, countByFilter, type Filter } from "@/lib/classify";
import { readCompare, writeCompare } from "@/lib/compare";
import { SOURCE_TABS, WATCH_STATUS_LABELS, matchesQuery, sourceCounts, type SourceFilter } from "@/lib/library-filter";
import { DEFAULT_SORT, SORT_PRESETS, presetIdOf, sortListings, type SortState } from "@/lib/library-sort";
import { LibraryPager } from "@/components/library-pager";
import { DEFAULT_PAGE_SIZE, PAGE_SIZES, PAGE_SIZE_KEY, paginate, parsePage, parsePageSize, type PageSize } from "@/lib/library-page";
import { priceChange } from "@/lib/price-history";
import { sourceLabel } from "@/lib/source-labels";
import type { ArchiveRecord } from "@/lib/types";

type ArchiveResponse = {
  status: "ok" | "ended" | "error";
  message?: string;
  record?: ArchiveRecord;
};

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
  const [compareMode, setCompareMode] = useState(false);
  const [compareNotice, setCompareNotice] = useState<string | null>(null);
  const [now] = useState(() => Date.now());
  // ページ分け: 表示件数はこのブラウザに覚える。今のページは ?page= に残す
  const [pageSize, setPageSize] = useState<PageSize>(() => {
    if (typeof window === "undefined") return DEFAULT_PAGE_SIZE;
    try {
      return parsePageSize(localStorage.getItem(PAGE_SIZE_KEY));
    } catch {
      return DEFAULT_PAGE_SIZE;
    }
  });
  const [page, setPage] = useState(() =>
    typeof window === "undefined" ? 1 : parsePage(new URLSearchParams(window.location.search).get("page")),
  );
  const listTopRef = useRef<HTMLDivElement>(null);

  // 折りたたみ式「＋ URLから直接追加」フォーム
  const [showAdd, setShowAdd] = useState<boolean>(() => initialListings.length === 0);
  const [addUrl, setAddUrl] = useState("");
  const [addBusy, setAddBusy] = useState(false);
  const [addMessage, setAddMessage] = useState<string | null>(null);
  const [addError, setAddError] = useState<string | null>(null);

  useEffect(() => {
    setListings(initialListings);
    if (initialListings.length === 0) {
      setShowAdd(true);
    }
  }, [initialListings]);

  useEffect(() => {
    const savedCompare = readCompare();
    setCompareIds(savedCompare);
    if (savedCompare.length > 0) {
      setCompareMode(true);
    }
    try {
      const pending = sessionStorage.getItem("oku-pending-url") || "";
      if (pending) {
        sessionStorage.removeItem("oku-pending-url");
        setAddUrl(pending);
        setShowAdd(true);
      }
    } catch {
      /* ignore */
    }
  }, []);

  const counts = countByFilter(listings, now);
  const srcCounts = sourceCounts(listings, statusFilter, query, favoritesOnly, now);
  const favoriteCount = listings.filter((item) => item.favorite).length;

  const filtered = listings.filter((item) => {
    if (statusFilter !== "all" && classify(item, now) !== statusFilter) return false;
    if (sourceFilter !== "all" && (item.source || "yahoo-auction") !== sourceFilter) return false;
    if (favoritesOnly && !item.favorite) return false;
    if (!matchesQuery(item, query)) return false;
    return true;
  });

  const shown = sortListings(filtered, sort);
  // 並べ替え・絞り込み・表示件数が変わったら1ページ目に戻す
  const pageResetKey = JSON.stringify([query, sourceFilter, statusFilter, favoritesOnly, sort, pageSize]);
  const [lastResetKey, setLastResetKey] = useState(pageResetKey);
  if (pageResetKey !== lastResetKey) {
    setLastResetKey(pageResetKey);
    setPage(1);
  }
  const paged = useMemo(() => paginate(shown, page, pageSize), [shown, page, pageSize]);

  // 今のページを URL の ?page= に残す（1ページ目は付けない）。一覧があるときだけ
  useEffect(() => {
    if (listings.length === 0) return;
    const url = new URL(window.location.href);
    const current = url.searchParams.get("page");
    const want = paged.page > 1 ? String(paged.page) : null;
    if (current === want) return;
    if (want) url.searchParams.set("page", want);
    else url.searchParams.delete("page");
    window.history.replaceState(window.history.state, "", `${url.pathname}${url.search}${url.hash}`);
  }, [listings.length, paged.page]);

  function goToPage(next: number) {
    setPage(next);
    listTopRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function changePageSize(next: PageSize) {
    setPageSize(next);
    try {
      localStorage.setItem(PAGE_SIZE_KEY, String(next));
    } catch {
      // 保存できないブラウザでは、この画面の間だけ使う
    }
  }

  async function onAddSubmit(event: React.FormEvent) {
    event.preventDefault();
    const target = addUrl.trim();
    if (!target || addBusy) return;
    setAddBusy(true);
    setAddMessage(null);
    setAddError(null);
    try {
      const response = await fetch("/api/archive", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ url: target }),
        cache: "no-store",
      });
      const data = (await response.json()) as ArchiveResponse;
      if (data.status === "error") {
        setAddError(data.message || "保存できませんでした。");
        return;
      }
      const note = data.status === "ended" ? "（終了済みとして保存）" : "";
      setAddMessage(`保存しました${note}: ${data.record?.title || data.record?.id}`);
      setAddUrl("");
      if (data.record) {
        const rec = data.record;
        setListings((prev) => [rec, ...prev.filter((item) => item.id !== rec.id)]);
      }
      router.refresh();
      if (data.record?.id) {
        router.push(`/listings/${data.record.id}`);
      }
    } catch {
      setAddError("通信に失敗しました。もう一度試してください。");
    } finally {
      setAddBusy(false);
    }
  }

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
    setCompareNotice(null);
    if (compareIds.includes(id)) {
      const next = compareIds.filter((x) => x !== id);
      setCompareIds(next);
      writeCompare(next);
      return;
    }
    if (compareIds.length >= 4) {
      setCompareNotice("比べられるのは4件までです。");
      return;
    }
    const next = [...compareIds, id].slice(0, 4);
    setCompareIds(next);
    writeCompare(next);
  }

  const hasExtraFilter = statusFilter !== "all" || sourceFilter !== "all" || favoritesOnly || Boolean(query.trim());

  return (
    <div className="space-y-4">
      {/* 上部バー: タイトル・件数 ＋ アクションボタン（＋ URLから直接追加 / 使い方（LINE）） */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b-2 border-[#ffdc00] pb-2.5">
        <div className="flex items-baseline gap-2">
          <h2 className="text-lg font-bold text-ink">ライブラリ</h2>
          <span className="text-xs font-medium text-muted">{listings.length}件</span>
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            aria-expanded={showAdd}
            onClick={() => setShowAdd((v) => !v)}
            className={`inline-flex h-8 items-center gap-1 rounded-full border px-3 text-xs font-bold transition ${
              showAdd
                ? "border-ink bg-ink text-white"
                : "border-[#ffdc00] bg-[#ffdc00] text-black hover:bg-[#f5c400]"
            }`}
          >
            {showAdd ? "× 閉じる" : "＋ URLから直接追加"}
          </button>
          <a
            href="#line-add-card"
            className="inline-flex h-8 items-center rounded-full border border-border bg-card px-3 text-xs font-bold text-ink hover:bg-[#FFF8D6]"
          >
            使い方（LINE）
          </a>
        </div>
      </div>

      {/* 折りたたみ URL 追加フォーム */}
      {showAdd && (
        <form
          onSubmit={onAddSubmit}
          className="rounded-2xl border border-[#F3E5AB] bg-[#FFF8D6]/60 p-4 shadow-xs sm:p-5"
        >
          <label htmlFor="yahoo-url" className="mb-2 block text-sm font-bold text-ink">
            出品ページのURL（ヤフオク・PayPayフリマ・ジモティー・メルカリ）
          </label>
          <div className="flex flex-col gap-2 sm:flex-row sm:gap-3">
            <input
              id="yahoo-url"
              type="url"
              required
              value={addUrl}
              onChange={(e) => setAddUrl(e.target.value)}
              placeholder="ヤフオク・PayPayフリマ・ジモティー・メルカリのURL"
              className="h-11 min-w-0 flex-1 rounded-lg border border-border bg-white px-3 text-sm text-ink outline-none focus:border-ink focus:ring-2 focus:ring-[#ffdc00]"
              inputMode="url"
              autoCapitalize="off"
              autoCorrect="off"
            />
            <button
              type="submit"
              disabled={addBusy}
              className="h-11 shrink-0 rounded-lg bg-[#ffdc00] px-6 text-sm font-extrabold text-black shadow-xs hover:bg-[#f5c400] disabled:opacity-60"
            >
              {addBusy ? "おくっています…" : "おく"}
            </button>
          </div>
          {addMessage && <p className="mt-3 text-sm font-medium text-live">{addMessage}</p>}
          {addError && <p className="mt-3 text-sm font-medium text-ended">{addError}</p>}
          <p className="mt-3 text-xs leading-relaxed text-muted">
            出品が生きているうちにURLを貼ると、タイトル・価格・写真などをメモとして残します。各アプリの共有からLINEの「おく」へ送ることもできます。
          </p>
        </form>
      )}

      {listings.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-card px-5 py-12 text-center text-sm leading-7 text-muted">
          まだ何も残っていません。上のフォームにURLを貼るか、LINEから共有してください。
        </div>
      ) : (
        <>
          {/* サイト別タブ */}
          <div className="flex flex-wrap gap-1.5" role="group" aria-label="サイトで絞る">
            {SOURCE_TABS.map((tab) => {
              const active = sourceFilter === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  aria-pressed={active}
                  data-source-filter={tab.id}
                  onClick={() => setSourceFilter(tab.id)}
                  className={`shrink-0 rounded-full border px-3 py-1.5 text-xs font-bold transition ${
                    active
                      ? "border-[#ffdc00] bg-[#ffdc00] text-black shadow-2xs"
                      : "border-border bg-card text-muted hover:text-ink"
                  }`}
                >
                  {tab.label}（{srcCounts[tab.id] ?? 0}）
                </button>
              );
            })}
          </div>

          {/* ステータス＋お気に入り＋比較トグル＋検索＋並び替え */}
          <div className="flex flex-col gap-2.5 rounded-2xl border border-border bg-card p-3 sm:p-3.5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-1.5">
                <div
                  className="inline-grid grid-cols-3 overflow-hidden rounded-lg border border-border shadow-2xs"
                  role="group"
                  aria-label="出品の状態"
                >
                  {(
                    [
                      ["all", "すべて"],
                      ["live", "出品中"],
                      ["ended", "終了"],
                    ] as const
                  ).map(([k, label], idx) => {
                    const active = statusFilter === k;
                    return (
                      <button
                        key={k}
                        type="button"
                        aria-pressed={active}
                        onClick={() => setStatusFilter(k)}
                        className={`h-9 px-2.5 text-xs font-bold transition ${idx ? "border-l border-border" : ""} ${
                          active ? "bg-[#ffdc00] text-black" : "bg-card text-muted hover:text-ink"
                        }`}
                      >
                        {label} <span className="tabular-nums opacity-80">{counts[k]}</span>
                      </button>
                    );
                  })}
                </div>

                <button
                  type="button"
                  onClick={() => setFavoritesOnly((v) => !v)}
                  aria-pressed={favoritesOnly}
                  data-control="favorites"
                  className={`inline-flex h-9 items-center gap-1 rounded-lg border px-3 text-xs font-bold transition ${
                    favoritesOnly
                      ? "border-[#ffdc00] bg-[#fff8d6] text-ink"
                      : "border-border bg-card text-muted hover:text-ink"
                  }`}
                >
                  <span className={favoritesOnly ? "text-amber-500" : ""}>{favoritesOnly ? "♥" : "♡"}</span>
                  お気に入り（{favoriteCount}）
                </button>

                <button
                  type="button"
                  aria-pressed={compareMode || compareIds.length > 0}
                  onClick={() => setCompareMode((v) => !v)}
                  className={`inline-flex h-9 items-center gap-1 rounded-lg border px-3 text-xs font-bold transition ${
                    compareMode || compareIds.length > 0
                      ? "border-ink bg-ink text-white"
                      : "border-border bg-card text-muted hover:text-ink"
                  }`}
                >
                  2〜4件を選んで比較
                </button>
              </div>

              <div className="flex flex-1 flex-wrap items-center justify-end gap-2 sm:flex-initial">
                <input
                  type="search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="タイトル・出品者・メモで検索"
                  className="h-9 min-w-[160px] flex-1 rounded-lg border border-border bg-background px-3 text-xs text-ink outline-none focus:border-ink sm:w-52 sm:flex-initial"
                />
                <select
                  aria-label="並べ替え"
                  data-control="sort"
                  value={presetIdOf(sort)}
                  onChange={(e) => {
                    const found = SORT_PRESETS.find((p) => p.id === e.target.value);
                    if (found) setSort(found.sort);
                  }}
                  className="h-9 rounded-lg border border-border bg-background px-2.5 text-xs font-bold text-ink outline-none focus:border-ink"
                >
                  {SORT_PRESETS.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {(hasExtraFilter || compareNotice) && (
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted">
                {hasExtraFilter ? (
                  <p className="flex items-center gap-2">
                    <span>{shown.length}件を表示中</span>
                    <button
                      type="button"
                      className="font-bold text-ink underline"
                      onClick={() => {
                        setStatusFilter("all");
                        setSourceFilter("all");
                        setFavoritesOnly(false);
                        setQuery("");
                      }}
                    >
                      絞り込みを解除
                    </button>
                  </p>
                ) : (
                  <span />
                )}
                {compareNotice && <p className="font-bold text-ended">{compareNotice}</p>}
              </div>
            )}
          </div>

          {shown.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border bg-card px-5 py-8 text-center text-sm text-muted">
              条件に合う出品はありません。絞り込みを変えてみてください。
            </div>
          ) : (
            <div ref={listTopRef} className="min-w-0 scroll-mt-3" data-library="paged">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2" data-library="page-info">
              <p className="text-sm" aria-live="polite">
                <span className="font-bold tabular-nums">{paged.total}</span>件中{" "}
                <span className="font-bold tabular-nums">{paged.from}〜{paged.to}</span>件を表示
              </p>
              <label className="flex items-center gap-2 text-sm">
                <span className="text-muted text-xs font-bold">表示件数</span>
                <select
                  data-control="page-size"
                  value={pageSize}
                  onChange={(event) => changePageSize(parsePageSize(event.target.value))}
                  className="h-11 rounded-lg border border-border bg-card px-3 text-sm font-bold"
                >
                  {PAGE_SIZES.map((size) => (
                    <option key={size} value={size}>
                      {size}件
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <ul className="min-w-0 space-y-3">
              {paged.items.map((item) => {
                const first = item.photos[0];
                const thumb = first?.key ? `/api/photo/${item.id}/0` : first?.url;
                const change = priceChange(item);
                const compared = compareIds.includes(item.id);
                return (
                  <li
                    key={item.id}
                    className={`flex min-w-0 gap-3 rounded-2xl border bg-card p-3 shadow-sm transition sm:p-4 ${
                      compared ? "border-2 border-[#ffdc00] bg-[#FFFDF2]" : "border-border hover:border-ink/20"
                    } ${item.watchStatus === "passed" ? "opacity-60" : ""}`}
                  >
                    <Link href={`/listings/${item.id}`} className="flex min-w-0 flex-1 gap-3">
                      <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl border border-border bg-background sm:h-24 sm:w-24">
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
                          <span className="rounded-full border border-[#E5C200] bg-[#FFF8D6] px-2 py-0.5 text-[10px] font-bold text-ink">
                            {sourceLabel(item.source)}
                          </span>
                          {item.watchStatus && item.watchStatus !== "watching" && (
                            <span className="rounded-full bg-[#FAF7F2] px-2 py-0.5 text-[10px] font-bold text-ink">
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
                        <p className="line-clamp-2 break-words text-sm font-bold leading-snug text-ink">{item.title}</p>
                        {item.priceLabel && item.priceLabel !== "—" ? (
                          <p className="mt-1.5 text-base font-extrabold tabular-nums text-ink">
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
                          aria-pressed={Boolean(item.favorite)}
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

                      <label
                        className={`inline-flex cursor-pointer items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-bold select-none ${
                          compared
                            ? "border-[#ffdc00] bg-[#ffdc00] text-black"
                            : "border-border bg-background text-ink"
                        }`}
                      >
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
            <LibraryPager page={paged.page} totalPages={paged.totalPages} onChange={goToPage} />
            </div>
          )}
        </>
      )}

      {/* 下部固定の比較バー */}
      {(compareIds.length > 0 || compareMode) && (
        <div className="fixed inset-x-0 bottom-3 z-30 mx-auto max-w-md px-4">
          <div className="flex items-center justify-between gap-3 rounded-full border border-black/20 bg-ink px-4 py-2.5 text-xs font-bold text-white shadow-lg">
            <span>
              {compareIds.length > 0
                ? `${compareIds.length}件を選択中（2〜4件）`
                : "カードの「比べる」にチェック（2〜4件）"}
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setCompareIds([]);
                  writeCompare([]);
                  setCompareMode(false);
                  setCompareNotice(null);
                }}
                className="text-white/75 underline hover:text-white"
              >
                解除
              </button>
              {compareIds.length >= 2 ? (
                <Link
                  href="/compare"
                  className="rounded-full bg-[#ffdc00] px-3.5 py-1 text-xs font-extrabold text-black hover:bg-[#f5c400]"
                >
                  並べて見る
                </Link>
              ) : (
                <span className="cursor-not-allowed rounded-full bg-white/20 px-3.5 py-1 text-xs font-bold text-white/60">
                  並べて見る
                </span>
              )}
            </div>
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
