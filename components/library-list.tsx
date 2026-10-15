"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { ArchiveRecord } from "@/lib/types";

export function LibraryList({ listings }: { listings: ArchiveRecord[] }) {
  const router = useRouter();
  const [busyId, setBusyId] = useState<string | null>(null);

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
      <div className="rounded-2xl border border-dashed border-border bg-card/60 px-5 py-10 text-center text-sm text-muted">
        まだ何もおくっていません。上のフォームにURLを貼るか、LINEから共有してください。
      </div>
    );
  }

  return (
    <ul className="space-y-3">
      {listings.map((item) => {
        const first = item.photos[0];
        const thumb = first?.key ? `/api/photo/${item.id}/0` : first?.url;
        return (
          <li
            key={item.id}
            className="flex gap-3 rounded-2xl border border-border bg-card p-3 shadow-sm sm:p-4"
          >
            <Link href={`/listings/${item.id}`} className="flex min-w-0 flex-1 gap-3">
              <div className="h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-background">
                {thumb ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={thumb} alt="" className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full items-center justify-center text-xs text-muted">No img</div>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="mb-1 flex flex-wrap items-center gap-2">
                  <AvailabilityBadge value={item.availability} />
                  <span className="text-xs text-muted">{item.id}</span>
                </div>
                <p className="line-clamp-2 text-sm font-medium leading-snug">{item.title}</p>
                <p className="mt-1 text-sm text-violet-ink">
                  {item.priceLabel}
                  {item.bidCount != null ? ` · 入札 ${item.bidCount}` : ""}
                </p>
                {item.endTimeLabel && (
                  <p className="mt-0.5 text-xs text-muted">終了 {item.endTimeLabel}</p>
                )}
              </div>
            </Link>
            <button
              type="button"
              onClick={() => remove(item.id)}
              disabled={busyId === item.id}
              className="self-start rounded-lg px-2 py-1 text-xs text-muted hover:bg-background hover:text-ended"
            >
              消す
            </button>
          </li>
        );
      })}
    </ul>
  );
}

function AvailabilityBadge({ value }: { value: ArchiveRecord["availability"] }) {
  if (value === "live") {
    return (
      <span className="rounded-full bg-live/10 px-2 py-0.5 text-[11px] font-medium text-live">出品中</span>
    );
  }
  if (value === "ended") {
    return (
      <span className="rounded-full bg-ended/10 px-2 py-0.5 text-[11px] font-medium text-ended">終了</span>
    );
  }
  return (
    <span className="rounded-full bg-border px-2 py-0.5 text-[11px] font-medium text-muted">不明</span>
  );
}
