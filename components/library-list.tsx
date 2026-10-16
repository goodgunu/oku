"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { ArchiveRecord } from "@/lib/types";
import { sourceLabel } from "@/lib/source-labels";
import { classify, countByFilter, type Filter } from "@/lib/classify";

export function LibraryList({ listings }: { listings: ArchiveRecord[] }) {
  const router = useRouter();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [filter, setFilter] = useState<Filter>("all");
  const [now] = useState(() => Date.now());
  const counts = countByFilter(listings, now);
  const shown = filter === "all" ? listings : listings.filter((l) => classify(l, now) === filter);

  async function remove(id: string) {
    if (!confirm("このメモを消しますか？")) return;
    setBusyId(id);
    try {
      await fetch(`/api/library/${id}`, { method: "DELETE" });
      router.refresh();
    } finally {
      setBusyId(null);
    }
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
    <div className="flex gap-2">
      {([["all", "すべて"], ["live", "出品中"], ["ended", "終了"]] as const).map(([k, label]) => (
        <button
          key={k}
          type="button"
          onClick={() => setFilter(k)}
          className={`rounded-full border px-3 py-1.5 text-sm font-bold ${filter === k ? "border-[#ffdc00] bg-[#ffdc00] text-black" : "border-border bg-card text-muted"}`}
        >
          {label} {counts[k]}
        </button>
      ))}
    </div>
    {shown.length === 0 ? (
      <div className="rounded-xl border border-dashed border-border bg-card px-5 py-8 text-center text-sm text-muted">該当するものはありません。</div>
    ) : null}
    <ul className="space-y-3">
      {shown.map((item) => {
        const first = item.photos[0];
        const thumb = first?.key ? `/api/photo/${item.id}/0` : first?.url;
        return (
          <li
            key={item.id}
            className="flex gap-3 rounded-xl border border-border bg-card p-3 shadow-sm transition hover:border-ink/20 sm:p-4"
          >
            <Link href={`/listings/${item.id}`} className="flex min-w-0 flex-1 gap-3">
              <div className="h-20 w-20 shrink-0 overflow-hidden rounded-lg border border-border bg-background sm:h-24 sm:w-24">
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
                <div className="mb-1 flex flex-wrap items-center gap-2">
                  <AvailabilityBadge value={item.availability} />
                  <span className="rounded border border-border bg-background px-1.5 py-0.5 text-[10px] font-bold text-ink/70">
                    {sourceLabel(item.source)}
                  </span>
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
                {item.endTimeLabel && (
                  <p className="mt-0.5 text-xs text-muted">終了 {item.endTimeLabel}</p>
                )}
              </div>
            </Link>
            <button
              type="button"
              onClick={() => remove(item.id)}
              disabled={busyId === item.id}
              className="self-start rounded-md px-2 py-1 text-xs text-muted hover:bg-background hover:text-ended"
            >
              消す
            </button>
          </li>
        );
      })}
    </ul>
    </div>
  );
}

function AvailabilityBadge({ value }: { value: ArchiveRecord["availability"] }) {
  if (value === "live") {
    return (
      <span className="rounded bg-live px-1.5 py-0.5 text-[10px] font-bold text-white">出品中</span>
    );
  }
  if (value === "ended") {
    return (
      <span className="rounded bg-ended px-1.5 py-0.5 text-[10px] font-bold text-white">終了</span>
    );
  }
  return (
    <span className="rounded bg-border px-1.5 py-0.5 text-[10px] font-bold text-muted">不明</span>
  );
}
