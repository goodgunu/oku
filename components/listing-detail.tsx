"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowLeft, ExternalLink, RefreshCw, Share } from "lucide-react";
import { DescriptionSection, EquipmentTags } from "@/components/detail-blocks";
import { PhotoGallery } from "@/components/photo-gallery";
import { PhotoPicker } from "@/components/photo-picker";
import { ShareXSheet, XIcon } from "@/components/share-x-sheet";
import { SpecChip } from "@/components/spec-chip";
import { formatYen } from "@/lib/format";
import { vtName } from "@/lib/motion";
import { WATCH_STATUS_LABELS } from "@/lib/library-filter";
import { endedPriceHeading } from "@/lib/format";
import { priceChange } from "@/lib/price-history";
import { sourceLabel } from "@/lib/source-labels";
import { MERCARI_NOTE } from "@/lib/sources/mercari";
import type { ArchiveRecord, WatchStatus } from "@/lib/types";

const WATCH_OPTIONS: WatchStatus[] = ["watching", "contacted", "passed", "bought"];

export function ListingDetail({ initialListing }: { initialListing: ArchiveRecord }) {
  const router = useRouter();
  const [listing, setListing] = useState<ArchiveRecord>(initialListing);
  const [memo, setMemo] = useState(initialListing.memo || "");
  const [newEntry, setNewEntry] = useState("");
  const [savingMemo, setSavingMemo] = useState(false);
  const [savedNotice, setSavedNotice] = useState("");
  const [checking, setChecking] = useState(false);
  const [checkNote, setCheckNote] = useState("");
  const [pickingPhotos, setPickingPhotos] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [shareMode, setShareMode] = useState<"x" | "native">("x");

  const badge =
    listing.availability === "live"
      ? { label: "出品中", className: "bg-live text-white" }
      : listing.availability === "ended"
        ? { label: "終了", className: "bg-ended text-white" }
        : { label: "不明", className: "bg-border text-muted" };

  const change = priceChange(listing);
  const photos = listing.photos.map((photo, index) => ({
    url: photo.key ? `/api/photo/${listing.id}/${index}` : photo.url,
    src: photo.key ? `/api/photo/${listing.id}/${index}` : photo.url,
    caption: photo.caption || "",
    alt: photo.caption || listing.title,
  }));

  const chips = [
    { label: "状態", value: listing.condition || "" },
    { label: "送料", value: listing.shipping || "" },
    { label: "地域", value: listing.prefecture || "" },
    { label: "即決", value: listing.buyNowYen != null ? formatYen(listing.buyNowYen) : "" },
    { label: "入札", value: listing.bidCount != null ? `${listing.bidCount}件` : "" },
  ].filter((c) => c.value);

  const tags = [
    ...(listing.category
      ? listing.category
          .split(/[>＞/・,、]+/)
          .map((s) => s.trim())
          .filter(Boolean)
      : []),
    ...(listing.condition ? [listing.condition] : []),
    ...(listing.shipping ? [listing.shipping] : []),
    ...(listing.prefecture ? [listing.prefecture] : []),
  ];

  async function patch(fields: Partial<ArchiveRecord>, noticeText?: string) {
    setSavingMemo(true);
    setSavedNotice("");
    try {
      const res = await fetch(`/api/library/${listing.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(fields),
      });
      if (res.ok) {
        const data = (await res.json()) as { record?: ArchiveRecord; listing?: ArchiveRecord };
        const updated = data.record || data.listing;
        if (updated) setListing(updated);
        if (noticeText) setSavedNotice(noticeText);
      }
    } finally {
      setSavingMemo(false);
    }
  }

  async function keepSelectedPhotos(indexes: number[]) {
    const nextPhotos = indexes
      .map((i) => listing.photos[i])
      .filter((p): p is NonNullable<typeof p> => Boolean(p));
    await patch({ photos: nextPhotos }, "残す写真を更新しました");
    setPickingPhotos(false);
  }

  async function addMemoEntry(e: React.FormEvent) {
    e.preventDefault();
    const text = newEntry.trim();
    if (!text) return;
    const nextEntries = [{ at: new Date().toISOString(), text }, ...(listing.memoEntries ?? [])];
    setNewEntry("");
    await patch({ memoEntries: nextEntries, memo }, "メモを追加しました");
  }

  async function checkNow() {
    if (checking) return;
    setChecking(true);
    setCheckNote("");
    try {
      const res = await fetch(`/api/library/${listing.id}/check`, { method: "POST" });
      if (!res.ok) {
        setCheckNote("確認できませんでした。");
        return;
      }
      const data = (await res.json()) as { record?: ArchiveRecord; failed?: boolean };
      if (data.record) setListing(data.record);
      setCheckNote(
        data.failed
          ? "元ページを読み取れませんでした（終了またはアクセス制限の可能性があります）。"
          : data.record?.availability === "ended"
            ? "終了していることを確認しました。"
            : "最新の状態に更新しました。",
      );
    } finally {
      setChecking(false);
    }
  }

  async function removeListing() {
    if (!confirm("この出品メモを消しますか？")) return;
    await fetch(`/api/library/${listing.id}`, { method: "DELETE" });
    router.push("/");
    router.refresh();
  }

  return (
    <article className="space-y-6 pb-20">
      {/* ナビゲーション＆操作バー */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Link
          href="/"
          className="inline-flex h-8 shrink-0 items-center gap-1 whitespace-nowrap rounded-full border border-black/15 bg-white px-3.5 text-xs font-bold text-[#0f1419] shadow-2xs hover:bg-black/5"
          data-control="back"
        >
          <ArrowLeft className="size-3.5" />
          保存した一覧
        </Link>

        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={() => void patch({ favorite: !listing.favorite })}
            aria-pressed={Boolean(listing.favorite)}
            className={`inline-flex h-8 items-center gap-1 rounded-full border px-3 text-xs font-bold ${
              listing.favorite
                ? "border-[#ffdc00] bg-[#fff8d6] text-ink"
                : "border-border bg-card text-muted hover:text-ink"
            }`}
          >
            <span>{listing.favorite ? "♥" : "♡"}</span>
            お気に入り
          </button>

          <button
            type="button"
            onClick={() => {
              setShareMode("x");
              setShareOpen(true);
            }}
            className="inline-flex h-8 items-center gap-1.5 rounded-full bg-[#0f1419] px-3 text-xs font-bold text-white"
          >
            <XIcon className="size-3.5" />
            Xで共有
          </button>

          <button
            type="button"
            onClick={() => {
              setShareMode("native");
              setShareOpen(true);
            }}
            className="inline-flex h-8 items-center gap-1.5 rounded-full border border-[#0f1419] bg-white px-3 text-xs font-bold text-[#0f1419] hover:bg-background"
          >
            <Share className="size-3.5" />
            共有
          </button>

          <button
            type="button"
            onClick={() => void checkNow()}
            disabled={checking}
            className="inline-flex h-8 items-center gap-1 rounded-full border border-border bg-card px-3 text-xs font-bold text-ink hover:bg-background disabled:opacity-50"
          >
            <RefreshCw className={`size-3.5 ${checking ? "animate-spin" : ""}`} />
            {checking ? "確認中…" : "掲載を確認"}
          </button>

          <button
            type="button"
            onClick={() => void removeListing()}
            className="inline-flex h-8 items-center rounded-full border border-border bg-card px-3 text-xs font-bold text-muted hover:text-ended"
          >
            消す
          </button>
        </div>
      </div>

      {checkNote && (
        <p className="rounded-xl border border-border bg-card px-4 py-2.5 text-xs font-bold text-ink">{checkNote}</p>
      )}

      {/* 写真ギャラリー / 写真ピッカー（のこす同様、上部に配置） */}
      {pickingPhotos ? (
        <PhotoPicker
          title={listing.title}
          photos={listing.photos.map((p, i) => ({
            ...p,
            src: p.key ? `/api/photo/${listing.id}/${i}` : p.url,
          }))}
          replacing={listing.photos.length > 0}
          busy={savingMemo ? "保存中…" : ""}
          onKeep={(indexes) => void keepSelectedPhotos(indexes)}
          onCancel={() => setPickingPhotos(false)}
        />
      ) : photos.length > 0 ? (
        <section className="space-y-3">
          <PhotoGallery photos={photos} title={listing.title} transitionName={vtName("photo", listing.id)} />
          {photos.length > 1 && (
            <button
              type="button"
              onClick={() => setPickingPhotos(true)}
              className="h-11 w-full rounded-xl bg-[#ffdc00] text-sm font-bold text-black shadow-2xs transition hover:bg-[#f5c400]"
            >
              残す写真を選び直す（{photos.length}枚）
            </button>
          )}
        </section>
      ) : null}

      {/* 掲載状態バー */}
      <div className="flex items-center justify-between rounded-xl border border-border bg-card px-3.5 py-2.5 text-sm shadow-sm">
        <span className="flex items-center gap-2">
          <span
            className={`inline-block size-2 rounded-full ${
              listing.availability === "live" ? "bg-live" : "bg-[#b5b5b5]"
            }`}
          />
          <span
            className={
              listing.availability === "ended"
                ? "font-bold text-ink"
                : listing.availability === "live"
                  ? "font-bold text-live"
                  : "text-muted"
            }
          >
            {listing.availability === "ended"
              ? "掲載終了"
              : listing.availability === "live"
                ? "出品中"
                : "まだ確認していません"}
          </span>
        </span>
        {change && (
          <span
            className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${
              change.direction === "down" ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-900"
            }`}
          >
            {change.deltaText}（{change.fromText} → {change.toText}）
          </span>
        )}
      </div>

      {/* タイトル・価格・スペックチップ */}
      <div className="space-y-3 rounded-xl border border-border bg-card p-4 shadow-sm sm:p-5">
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${badge.className}`}>{badge.label}</span>
          <span className="rounded border border-border bg-background px-1.5 py-0.5 text-[10px] font-bold text-ink/70">
            {sourceLabel(listing.source)}
          </span>
          <span className="text-muted">{listing.id}</span>
        </div>

        <h1 className="text-[19px] font-bold leading-snug break-words text-ink sm:text-2xl">{listing.title}</h1>

        {listing.priceLabel && listing.priceLabel !== "—" ? (
          <p className="flex items-baseline gap-1.5 leading-none">
            <span className="text-xs font-bold text-muted">
              {listing.availability === "ended" ? endedPriceHeading(listing) : listing.priceKind === "current_bid" ? "現在価格" : "価格"}
            </span>
            <span className="text-[26px] font-extrabold tabular-nums text-ink sm:text-3xl">{listing.priceLabel}</span>
          </p>
        ) : null}

        {chips.length > 0 && (
          <div className="flex flex-wrap gap-1.5 pt-1" data-card="chips">
            {chips.map((chip) => (
              <SpecChip key={chip.label} label={chip.label} value={chip.value} />
            ))}
          </div>
        )}

        {listing.detailLevel === "partial" && listing.source === "mercari" ? (
          <p className="rounded-lg bg-background px-3 py-2 text-xs text-muted">{MERCARI_NOTE}</p>
        ) : null}
      </div>

      {/* 検討ステータス（のこす同様のピル型セグメント） */}
      <div className="flex rounded-full border border-border bg-card p-1 shadow-2xs">
        {WATCH_OPTIONS.map((st) => {
          const active = (listing.watchStatus || "watching") === st;
          return (
            <button
              key={st}
              type="button"
              onClick={() => void patch({ watchStatus: st })}
              className={`flex-1 rounded-full px-2 py-2 text-xs transition ${
                active ? "bg-[#ffdc00] font-bold text-black shadow-2xs" : "text-muted hover:text-ink"
              }`}
            >
              {WATCH_STATUS_LABELS[st]}
            </button>
          );
        })}
      </div>

      {/* 要点 */}
      <section>
        <h2 className="border-b-2 border-[#ffdc00] pb-1 text-sm font-bold text-ink">要点</h2>
        <dl className="mt-2 grid grid-cols-2 rounded-xl border border-border bg-card px-4 shadow-sm">
          {listing.bidCount != null && <Fact label="入札" value={`${listing.bidCount}件`} />}
          {listing.buyNowYen != null && <Fact label="即決" value={formatYen(listing.buyNowYen)} />}
          {listing.seller && <Fact label="出品者" value={listing.seller} />}
          {listing.prefecture && <Fact label="出品地域" value={listing.prefecture} />}
          {listing.shipping && <Fact label="送料・発送" value={listing.shipping} />}
          {listing.condition && <Fact label="状態" value={listing.condition} />}
          {listing.category && <Fact label="カテゴリ" value={listing.category} />}
          {listing.endTimeLabel && <Fact label="終了" value={listing.endTimeLabel} />}
          {listing.postedAt && (
            <Fact
              label="掲載"
              value={new Date(listing.postedAt).toLocaleDateString("ja-JP", { timeZone: "Asia/Tokyo" })}
            />
          )}
          <Fact
            label="元ページ"
            value={
              <a
                href={listing.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 font-bold text-ink underline decoration-[#ffdc00] decoration-2 underline-offset-2 hover:text-black"
              >
                {sourceLabel(listing.source)}で開く
                <ExternalLink className="size-3.5" />
              </a>
            }
          />
        </dl>
      </section>

      {/* タグ・特徴（もっと見る開閉） */}
      <EquipmentTags items={tags} />

      {/* 出品者の説明（もっと見る開閉） */}
      <DescriptionSection text={listing.description} />

      {/* 価格の推移（2件以上あるとき） */}
      {(listing.priceHistory?.length ?? 0) >= 2 && (
        <section className="space-y-2 rounded-xl border border-border bg-card p-4 shadow-sm">
          <h2 className="text-sm font-bold text-ink">価格の推移</h2>
          <ul className="space-y-1 text-xs">
            {listing.priceHistory!.map((pt, idx) => (
              <li key={`${pt.at}-${idx}`} className="flex items-center justify-between text-muted">
                <span>{new Date(pt.at).toLocaleDateString("ja-JP", { timeZone: "Asia/Tokyo" })}</span>
                <span className="font-bold text-ink">{pt.priceLabel || formatYen(pt.priceYen)}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* 自分のメモ */}
      <section className="space-y-3 rounded-xl border border-border bg-card p-4 shadow-sm">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-ink">自分のメモ（共有ページには出ません）</h2>
          {savedNotice && <span className="text-xs font-bold text-emerald-700">{savedNotice}</span>}
        </div>
        <textarea
          value={memo}
          onChange={(e) => setMemo(e.target.value)}
          rows={3}
          placeholder="状態・相場・出品者への質問メモなど"
          className="w-full rounded-lg border border-border bg-background p-3 text-sm outline-none focus:border-ink"
        />
        <div className="flex justify-end">
          <button
            type="button"
            disabled={savingMemo}
            onClick={() => void patch({ memo }, "メモを保存しました")}
            className="rounded-full bg-[#ffdc00] px-4 py-1.5 text-xs font-bold text-black hover:bg-[#f5c400] disabled:opacity-50"
          >
            {savingMemo ? "保存中…" : "メモを保存"}
          </button>
        </div>

        <form onSubmit={addMemoEntry} className="flex gap-2 border-t border-border pt-3">
          <input
            value={newEntry}
            onChange={(e) => setNewEntry(e.target.value)}
            placeholder="ひとことメモを時刻つきで残す"
            className="h-9 flex-1 rounded-lg border border-border bg-background px-3 text-xs outline-none focus:border-ink"
          />
          <button
            type="submit"
            disabled={savingMemo || !newEntry.trim()}
            className="rounded-lg border border-border bg-background px-3 text-xs font-bold text-ink hover:bg-card disabled:opacity-50"
          >
            残す
          </button>
        </form>

        {(listing.memoEntries?.length ?? 0) > 0 && (
          <ul className="space-y-1.5 pt-1 text-xs">
            {listing.memoEntries!.map((entry, idx) => (
              <li key={`${entry.at}-${idx}`} className="rounded-lg bg-background px-3 py-2">
                <span className="mr-2 text-[11px] tabular-nums text-muted">
                  {new Date(entry.at).toLocaleString("ja-JP", { timeZone: "Asia/Tokyo" })}
                </span>
                <span className="text-ink">{entry.text}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <p className="text-xs text-muted">
        保存: {new Date(listing.savedAt).toLocaleString("ja-JP", { timeZone: "Asia/Tokyo" })} · 更新:{" "}
        {new Date(listing.updatedAt).toLocaleString("ja-JP", { timeZone: "Asia/Tokyo" })}
      </p>

      {/* 下部固定アクションバー（のこす共通） */}
      {!pickingPhotos && (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-card/95 p-3 backdrop-blur">
          <div className="mx-auto flex max-w-3xl gap-2">
            <button
              type="button"
              disabled={checking}
              onClick={() => void checkNow()}
              className="h-11 flex-1 rounded-full border border-border bg-background text-sm font-bold text-ink hover:bg-card disabled:opacity-50"
            >
              {checking ? "確認中…" : "掲載を確認"}
            </button>
            <a
              href={listing.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-11 flex-[1.4] items-center justify-center rounded-full bg-[#ffdc00] text-sm font-bold text-black shadow-2xs hover:bg-[#f5c400]"
            >
              {sourceLabel(listing.source)}で開く
            </a>
          </div>
        </div>
      )}

      <ShareXSheet
        key={`${listing.id}-${listing.updatedAt}-${shareMode}`}
        record={listing}
        open={shareOpen}
        onOpenChange={setShareOpen}
        mode={shareMode}
      />
    </article>
  );
}

function Fact({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="border-b border-border py-2.5 pr-3 last:border-b-0">
      <dt className="text-[11px] text-muted">{label}</dt>
      <dd className="mt-0.5 text-sm font-bold text-ink">{value}</dd>
    </div>
  );
}
