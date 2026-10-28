"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { readCompare, writeCompare } from "@/lib/compare";
import { COMPARE_ROWS, bestIds } from "@/lib/compare-rows";
import type { ArchiveRecord } from "@/lib/types";

export function CompareScreen() {
  const [records, setRecords] = useState<ArchiveRecord[] | null>(null);

  useEffect(() => {
    const ids = readCompare();
    Promise.all(
      ids.map((id) =>
        fetch(`/api/library/${encodeURIComponent(id)}`, { cache: "no-store" })
          .then((r) => (r.ok ? r.json() : null))
          .then((d: { record?: ArchiveRecord; listing?: ArchiveRecord } | null) => d?.record || d?.listing || null)
          .catch(() => null),
      ),
    ).then((rows) => {
      setRecords(rows.filter((row): row is ArchiveRecord => Boolean(row)));
    });
  }, []);

  function remove(id: string) {
    writeCompare(readCompare().filter((item) => item !== id));
    setRecords((current) => current?.filter((item) => item.id !== id) ?? []);
  }

  const count = records?.length ?? 0;
  const col = count >= 3 ? "minmax(8.75rem,1fr)" : "minmax(0,1fr)";
  const gridTemplate = `5rem repeat(${Math.max(count, 1)}, ${col})`;

  return (
    <div className="space-y-5">
      <div className="flex items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-ink">並べて比べる</h1>
          <p className="mt-1 text-xs leading-5 text-muted sm:text-sm">
            選んだ出品を同じ項目で並べます。<span className="rounded bg-[#fff8d6] px-1.5 py-0.5 font-bold text-ink">黄色</span>はいちばん安い出品です。
          </p>
        </div>
        <Link
          href="/"
          className="inline-flex h-9 items-center rounded-full border border-border bg-card px-4 text-xs font-bold text-ink hover:bg-background"
        >
          ← 保存した一覧
        </Link>
      </div>

      {records === null ? (
        <p className="mt-8 text-sm text-muted">読み込み中…</p>
      ) : records.length < 2 ? (
        <div className="mt-8 rounded-2xl border border-dashed border-border bg-card px-5 py-8">
          <p className="text-sm leading-7 text-ink">
            比べる出品が足りません。一覧のカードで「比べる」に2件以上チェックしてから戻ってきてください（3件まで）。
          </p>
          <Link
            href="/"
            className="mt-4 inline-flex h-10 items-center rounded-full bg-[#ffdc00] px-5 text-xs font-bold text-black"
          >
            出品を選ぶ
          </Link>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-border bg-card" data-compare-count={records.length}>
          <div
            className={`grid ${count >= 3 ? "min-w-max sm:min-w-0" : "w-full"}`}
            style={{ gridTemplateColumns: gridTemplate }}
          >
            <div className="sticky left-0 z-10 border-b border-border bg-card" />
            {records.map((record) => {
              const first = record.photos[0];
              const thumb = first?.key ? `/api/photo/${record.id}/0` : first?.url;
              return (
                <div key={record.id} className="min-w-0 border-b border-l border-border p-2 sm:p-3">
                  <Link href={`/listings/${record.id}`} className="block min-w-0">
                    <div className="relative aspect-[4/3] overflow-hidden rounded-lg border-b-2 border-[#ffdc00] bg-background">
                      {thumb && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={thumb} alt="" className="size-full object-cover" />
                      )}
                      {record.favorite && (
                        <span
                          className="absolute top-1 right-1 rounded-full bg-white/95 px-1.5 text-xs text-amber-500"
                          aria-label="お気に入り"
                        >
                          ♥
                        </span>
                      )}
                    </div>
                    <p className="mt-1.5 line-clamp-2 text-[13px] font-bold leading-snug break-words text-ink">
                      {record.title}
                    </p>
                  </Link>
                  <button
                    type="button"
                    className="mt-1 text-[11px] text-muted underline"
                    onClick={() => remove(record.id)}
                  >
                    外す
                  </button>
                </div>
              );
            })}

            {COMPARE_ROWS.map((row) => {
              const best = bestIds(records, row);
              return (
                <Row key={row.label} label={row.label}>
                  {records.map((record) => {
                    const isBest = best.has(record.id);
                    const value = row.value(record);
                    return (
                      <div
                        key={record.id}
                        data-best={isBest || undefined}
                        className={`min-w-0 border-b border-l border-border px-2 py-2 text-[13px] leading-5 break-words sm:px-3 ${
                          row.label === "価格" ? "text-base font-extrabold" : ""
                        } ${value === "未記載" ? "text-muted" : "text-ink"}`}
                        style={isBest ? { fontWeight: 800, background: "#fff8d6" } : undefined}
                      >
                        {value}
                      </div>
                    );
                  })}
                </Row>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <>
      <div className="sticky left-0 z-10 border-b border-border bg-card px-2 py-2 text-[11px] font-bold leading-5 text-muted sm:px-3 sm:text-xs">
        {label}
      </div>
      {children}
    </>
  );
}
